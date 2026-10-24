/**
 * legacy-mock — simulator of the "GestPrest" core business system (AS/400, 25 years old).
 * "WSO2 API Management: The Mission" training course — module 7, lab 9.
 *
 * Deliberately speaks a painful dialect: dense XML, cryptic tags, numeric codes
 * with no legend. This is the dialect that Micro Integrator translates into
 * modern JSON (the lab 9 facade).
 *
 * The GestPrest dialect (fictional) is FRENCH ON PURPOSE — tag names, labels
 * (DOSSIER INCONNU...) and date formats mimic a real French legacy system.
 * Do not translate the wire format: the lab 9 mediation and its tests depend on it.
 *
 * GestPrest dialect legend:
 *   CDRET  : return code (00 = OK, 91 = unknown record, 99 = error)
 *   NUMRMB : reimbursement record number
 *   CDPS   : healthcare provider code
 *   MTRMB  : reimbursed amount in cents, 8 positions (e.g. 00004250)
 *   CDETA  : state code (10 = entered, 20 = validated, 30 = paid, 40 = rejected)
 *   DTTRT  : processing date, YYYYMMDD
 *
 * Zero dependencies: Node.js >= 18.
 */
"use strict";

const http = require("node:http");
const crypto = require("node:crypto");

const PORT = parseInt(process.env.PORT || "8080", 10);
const SERVICE = "legacy-mock";

// Fictional reimbursement records (key = NUMRMB)
const RECORDS = {
  1042: { cdps: "PS0047", mtrmb: 4250, cdeta: 30, dttrt: "20260628" },
  1043: { cdps: "PS0112", mtrmb: 15800, cdeta: 20, dttrt: "20260702" },
  1044: { cdps: "PS0047", mtrmb: 68050, cdeta: 10, dttrt: "20260709" },
  1045: { cdps: "PS0201", mtrmb: 3200, cdeta: 40, dttrt: "20260711" },
};

function log(level, message, extra) {
  console.log(JSON.stringify(Object.assign(
    { timestamp: new Date().toISOString(), level, service: SERVICE, message }, extra)));
}

function pad(n, width) {
  return String(n).padStart(width, "0");
}

function xmlEnvelope(inner) {
  return '<?xml version="1.0" encoding="ISO-8859-1"?>\n' +
    "<GESTPREST><VERPGM>V07R02M04</VERPGM><TSREP>" +
    new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14) +
    "</TSREP>" + inner + "</GESTPREST>";
}

function sendXml(res, correlationId, status, body) {
  res.writeHead(status, {
    "Content-Type": "text/xml; charset=ISO-8859-1",
    "Content-Length": Buffer.byteLength(body),
    "X-Correlation-Id": correlationId,
  });
  res.end(body);
  return status;
}

const server = http.createServer((req, res) => {
  const started = Date.now();
  const correlationId = req.headers["x-correlation-id"] || crypto.randomUUID();
  const url = new URL(req.url, "http://" + (req.headers.host || "localhost"));
  const path = url.pathname.replace(/\/+$/, "") || "/";
  let status = 500;

  try {
    // Health probe (modern, outside the dialect — for Docker only)
    if (req.method === "GET" && path === "/health") {
      const payload = JSON.stringify({ status: "UP", service: SERVICE });
      res.writeHead(200, { "Content-Type": "application/json", "X-Correlation-Id": correlationId });
      res.end(payload);
      status = 200;
      return;
    }

    // The one and only GestPrest "service": look up a reimbursement record.
    // GET /GESTPREST/RMBT?id=1042  →  cryptic XML
    if (req.method === "GET" && path === "/GESTPREST/RMBT") {
      const id = parseInt(url.searchParams.get("id") || "", 10);
      if (!Number.isInteger(id)) {
        status = sendXml(res, correlationId, 200, xmlEnvelope(
          "<RMBT><CDRET>99</CDRET><LIBRET>PARAM ID OBLIGATOIRE</LIBRET></RMBT>"));
        return;
      }
      const rec = RECORDS[id];
      if (!rec) {
        // True to the legacy: HTTP 200 even when the record does not exist — only CDRET is authoritative.
        status = sendXml(res, correlationId, 200, xmlEnvelope(
          "<RMBT><CDRET>91</CDRET><LIBRET>DOSSIER INCONNU</LIBRET><NUMRMB>" + pad(id, 10) + "</NUMRMB></RMBT>"));
        return;
      }
      status = sendXml(res, correlationId, 200, xmlEnvelope(
        "<RMBT><CDRET>00</CDRET><NUMRMB>" + pad(id, 10) + "</NUMRMB>" +
        "<CDPS>" + rec.cdps + "</CDPS>" +
        "<MTRMB>" + pad(rec.mtrmb, 8) + "</MTRMB>" +
        "<CDETA>" + pad(rec.cdeta, 2) + "</CDETA>" +
        "<DTTRT>" + rec.dttrt + "</DTTRT></RMBT>"));
      return;
    }

    status = sendXml(res, correlationId, 200, xmlEnvelope(
      "<RMBT><CDRET>99</CDRET><LIBRET>SERVICE INCONNU</LIBRET></RMBT>"));
  } catch (err) {
    log("error", "unhandled error: " + err.message, { correlationId });
    if (!res.headersSent) {
      status = sendXml(res, correlationId, 500, xmlEnvelope(
        "<RMBT><CDRET>99</CDRET><LIBRET>ERREUR INTERNE</LIBRET></RMBT>"));
    }
  } finally {
    log("info", "request handled", {
      correlationId, method: req.method, path, status, durationMs: Date.now() - started,
    });
  }
});

server.listen(PORT, () => {
  log("info", "legacy-mock (GestPrest) listening", { port: PORT });
});

// Clean stop. In the container, node runs as PID 1: without a handler, SIGTERM is
// ignored, `docker compose stop` waits its 10 s grace period, then SIGKILLs the
// process, which shows up as "Exited (137)" - the very code the course teaches as
// an out-of-memory kill. Lab 9 stops this service on purpose (the incident, then
// the cleanup): it must exit at once, with code 0.
function shutdown(signal) {
  log("info", "legacy-mock stopping", { signal });
  server.close(() => process.exit(0));
  if (typeof server.closeAllConnections === "function") server.closeAllConnections();
  setTimeout(() => process.exit(0), 2000).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
