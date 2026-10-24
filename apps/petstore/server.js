/**
 * Petstore — sample backend for the "WSO2 API Management: The Mission" training course.
 * Zero dependencies: Node.js >= 18, native http module only.
 *
 * - Structured JSON logs on stdout (1 object per line), correlationId on every entry.
 * - X-Correlation-Id: propagated when provided by the caller, generated otherwise,
 *   always returned in the response header.
 * - Errors produced here: 400 (invalid payload), 404 (unknown resource),
 *   500 (simulated failure via /admin/failure). 401/403/429 are the WSO2
 *   gateway's job, not the backend's.
 */
"use strict";

const http = require("node:http");
const crypto = require("node:crypto");

const PORT = parseInt(process.env.PORT || "8080", 10);
const SERVICE = "petstore";

// Fictional dataset (no personal data) — 3 dogs, 2 cats, 1 parrot.
let nextId = 7;
const pets = [
  { id: 1, name: "Rex", species: "dog", status: "available" },
  { id: 2, name: "Bella", species: "dog", status: "available" },
  { id: 3, name: "Max", species: "dog", status: "sold" },
  { id: 4, name: "Luna", species: "cat", status: "available" },
  { id: 5, name: "Milo", species: "cat", status: "pending" },
  { id: 6, name: "Coco", species: "parrot", status: "available" },
];

let simulatedFailure = false;

function log(level, message, extra) {
  const entry = Object.assign(
    { timestamp: new Date().toISOString(), level, service: SERVICE, message },
    extra
  );
  console.log(JSON.stringify(entry));
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
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1e6) reject(new Error("payload too large"));
    });
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
    // --- Health (never affected by the simulated failure) ---
    if (route === "GET /health") {
      status = send(res, correlationId, 200, { status: "UP", service: SERVICE });
      return;
    }

    // --- Simulated failure: toggle used by the diagnostic exercises ---
    if (route === "POST /admin/failure") {
      const raw = await readBody(req);
      let body;
      try {
        body = JSON.parse(raw || "{}");
      } catch {
        status = sendError(res, correlationId, 400, "INVALID_JSON", "Request body is not valid JSON.");
        return;
      }
      if (typeof body.enabled !== "boolean") {
        status = sendError(res, correlationId, 400, "INVALID_PAYLOAD", "Expected JSON body: {\"enabled\": true|false}.");
        return;
      }
      simulatedFailure = body.enabled;
      log("warn", simulatedFailure ? "simulated failure ENABLED" : "simulated failure disabled", { correlationId });
      status = send(res, correlationId, 200, { simulatedFailure });
      return;
    }

    if (simulatedFailure && path.startsWith("/pets")) {
      status = sendError(res, correlationId, 500, "STORAGE_FAILURE", "Internal storage failure (simulated for training).");
      return;
    }

    // --- /pets resource ---
    if (route === "GET /pets") {
      status = send(res, correlationId, 200, pets);
      return;
    }

    const petMatch = path.match(/^\/pets\/(\d+)$/);
    if (req.method === "GET" && petMatch) {
      const pet = pets.find((p) => p.id === parseInt(petMatch[1], 10));
      if (!pet) {
        status = sendError(res, correlationId, 404, "PET_NOT_FOUND", "No pet with id " + petMatch[1] + ".");
        return;
      }
      status = send(res, correlationId, 200, pet);
      return;
    }

    if (route === "POST /pets") {
      const raw = await readBody(req);
      let body;
      try {
        body = JSON.parse(raw || "{}");
      } catch {
        status = sendError(res, correlationId, 400, "INVALID_JSON", "Request body is not valid JSON.");
        return;
      }
      const validSpecies = ["dog", "cat", "parrot", "rabbit", "fish"];
      if (typeof body.name !== "string" || body.name.trim() === "") {
        status = sendError(res, correlationId, 400, "INVALID_PAYLOAD", "Field 'name' (non-empty string) is required.");
        return;
      }
      if (!validSpecies.includes(body.species)) {
        status = sendError(res, correlationId, 400, "INVALID_PAYLOAD", "Field 'species' must be one of: " + validSpecies.join(", ") + ".");
        return;
      }
      const pet = { id: nextId++, name: body.name.trim(), species: body.species, status: "available" };
      pets.push(pet);
      status = send(res, correlationId, 201, pet);
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
      correlationId,
      method: req.method,
      path,
      status,
      durationMs: Date.now() - started,
    });
  }
});

server.listen(PORT, () => {
  log("info", "petstore listening", { port: PORT });
});
