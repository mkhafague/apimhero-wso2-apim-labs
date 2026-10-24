/**
 * Invoices — sample business backend for the "WSO2 API Management: The Mission" training course.
 * Invoices from partner healthcare providers (100% fictional data, no policyholder data).
 * Zero dependencies: Node.js >= 18, native http module only.
 *
 * - Structured JSON logs on stdout, correlationId on every entry.
 * - X-Correlation-Id: propagated when provided, generated otherwise, always returned.
 * - Errors produced here: 400 (invalid payload), 404 (unknown invoice),
 *   500 (the "GestPrest" dependency, simulated as down via /admin/failure).
 *   401/403/429 are produced by the WSO2 gateway (invoices:read / invoices:write scopes).
 *
 * Invoice type codes (optique, dentaire, pharmacie, kinesitherapie) are part of the
 * wire contract shared with French internal systems — do not translate them.
 */
"use strict";

const http = require("node:http");
const crypto = require("node:crypto");

const PORT = parseInt(process.env.PORT || "8080", 10);
const SERVICE = "invoices";

const VALID_TYPES = ["optique", "dentaire", "pharmacie", "kinesitherapie"];
const VALID_STATUSES = ["SUBMITTED", "APPROVED", "PAID", "REJECTED"];

let nextId = 1007;
const invoices = [
  { id: 1001, provider: "Optique Bellecour", type: "optique", amountCents: 24900, currency: "EUR", status: "PAID", submittedAt: "2026-06-02T09:14:00Z" },
  { id: 1002, provider: "Cabinet Dentaire Part-Dieu", type: "dentaire", amountCents: 68050, currency: "EUR", status: "APPROVED", submittedAt: "2026-06-11T14:32:00Z" },
  { id: 1003, provider: "Pharmacie des Terreaux", type: "pharmacie", amountCents: 4310, currency: "EUR", status: "PAID", submittedAt: "2026-06-15T08:05:00Z" },
  { id: 1004, provider: "Optique Bellecour", type: "optique", amountCents: 15800, currency: "EUR", status: "SUBMITTED", submittedAt: "2026-07-01T10:47:00Z" },
  { id: 1005, provider: "Kine Croix-Rousse", type: "kinesitherapie", amountCents: 3200, currency: "EUR", status: "REJECTED", submittedAt: "2026-07-03T16:20:00Z" },
  { id: 1006, provider: "Cabinet Dentaire Part-Dieu", type: "dentaire", amountCents: 12000, currency: "EUR", status: "SUBMITTED", submittedAt: "2026-07-08T11:02:00Z" },
];

let simulatedFailure = false;

function log(level, message, extra) {
  console.log(JSON.stringify(Object.assign(
    { timestamp: new Date().toISOString(), level, service: SERVICE, message }, extra)));
}

function send(res, correlationId, status, body) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "X-Correlation-Id": correlationId,
  });
  res.end(payload);
  return status;
}

function sendError(res, correlationId, status, code, message) {
  return send(res, correlationId, status, { code, message, correlationId });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => { data += c; if (data.length > 1e6) reject(new Error("payload too large")); });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const started = Date.now();
  const correlationId = req.headers["x-correlation-id"] || crypto.randomUUID();
  const url = new URL(req.url, "http://" + (req.headers.host || "localhost"));
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const route = req.method + " " + path;
  let status = 500;

  try {
    if (route === "GET /health") {
      status = send(res, correlationId, 200, { status: "UP", service: SERVICE });
      return;
    }

    if (route === "POST /admin/failure") {
      const raw = await readBody(req);
      let body;
      try { body = JSON.parse(raw || "{}"); } catch {
        status = sendError(res, correlationId, 400, "INVALID_JSON", "Request body is not valid JSON.");
        return;
      }
      if (typeof body.enabled !== "boolean") {
        status = sendError(res, correlationId, 400, "INVALID_PAYLOAD", "Expected JSON body: {\"enabled\": true|false}.");
        return;
      }
      simulatedFailure = body.enabled;
      log("warn", simulatedFailure ? "simulated GestPrest outage ENABLED" : "simulated GestPrest outage disabled", { correlationId });
      status = send(res, correlationId, 200, { simulatedFailure });
      return;
    }

    if (simulatedFailure && path.startsWith("/invoices")) {
      status = sendError(res, correlationId, 500, "DEPENDENCY_UNAVAILABLE",
        "Upstream system 'GestPrest' is not responding (simulated for training).");
      return;
    }

    if (route === "GET /invoices") {
      const filter = url.searchParams.get("status");
      if (filter && !VALID_STATUSES.includes(filter)) {
        status = sendError(res, correlationId, 400, "INVALID_FILTER",
          "Query parameter 'status' must be one of: " + VALID_STATUSES.join(", ") + ".");
        return;
      }
      const result = filter ? invoices.filter((i) => i.status === filter) : invoices;
      status = send(res, correlationId, 200, result);
      return;
    }

    const m = path.match(/^\/invoices\/(\d+)$/);
    if (req.method === "GET" && m) {
      const invoice = invoices.find((i) => i.id === parseInt(m[1], 10));
      if (!invoice) {
        status = sendError(res, correlationId, 404, "INVOICE_NOT_FOUND", "No invoice with id " + m[1] + ".");
        return;
      }
      status = send(res, correlationId, 200, invoice);
      return;
    }

    if (route === "POST /invoices") {
      const raw = await readBody(req);
      let body;
      try { body = JSON.parse(raw || "{}"); } catch {
        status = sendError(res, correlationId, 400, "INVALID_JSON", "Request body is not valid JSON.");
        return;
      }
      if (typeof body.provider !== "string" || body.provider.trim() === "") {
        status = sendError(res, correlationId, 400, "INVALID_PAYLOAD", "Field 'provider' (non-empty string) is required.");
        return;
      }
      if (!VALID_TYPES.includes(body.type)) {
        status = sendError(res, correlationId, 400, "INVALID_PAYLOAD", "Field 'type' must be one of: " + VALID_TYPES.join(", ") + ".");
        return;
      }
      if (!Number.isInteger(body.amountCents) || body.amountCents <= 0) {
        status = sendError(res, correlationId, 400, "INVALID_PAYLOAD", "Field 'amountCents' (positive integer) is required.");
        return;
      }
      const invoice = {
        id: nextId++,
        provider: body.provider.trim(),
        type: body.type,
        amountCents: body.amountCents,
        currency: "EUR",
        status: "SUBMITTED",
        submittedAt: new Date().toISOString(),
      };
      invoices.push(invoice);
      status = send(res, correlationId, 201, invoice);
      return;
    }

    status = sendError(res, correlationId, 404, "ROUTE_NOT_FOUND", "No route matches " + route + ".");
  } catch (err) {
    log("error", "unhandled error: " + err.message, { correlationId, route });
    if (!res.headersSent) {
      status = sendError(res, correlationId, 500, "INTERNAL_ERROR", "Unexpected server error.");
    }
  } finally {
    log("info", "request handled", {
      correlationId, method: req.method, path, status, durationMs: Date.now() - started,
    });
  }
});

server.listen(PORT, () => {
  log("info", "invoices listening", { port: PORT });
});
