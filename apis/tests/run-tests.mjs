#!/usr/bin/env node
/**
 * API test harness — WSO2 API Management training ("La Mission").
 * Zero dependencies: Node.js >= 18 (native fetch). Cross-platform (Windows / macOS / Linux).
 *
 * Output is in English on purpose: like the WSO2 consoles, Docker and curl, the tooling
 * stays in English so the screencasts can be reused across all course languages (FR/EN/ES).
 *
 * Usage:
 *   node run-tests.mjs --env env.petstore-direct.json --suite petstore
 *   node run-tests.mjs --env env.gateway.json --suite invoices --report-json results.json
 *
 * Environment file (JSON):
 *   {
 *     "baseUrl": "http://localhost:8081",            // or the gateway: https://localhost:8243/petstore/1.0.0
 *     "insecure": false,                             // true = accept the lab's self-signed certificate
 *     "auth": {                                      // optional - omit for direct calls without a token
 *       "tokenUrl": "https://localhost:9443/oauth2/token",   // verified endpoint (APIM 4.7.0 docs)
 *       "clientId": "...", "clientSecret": "...", "scope": "petstore:read petstore:write"
 *     }
 *   }
 *
 * Exit code: 0 when every test passes, 1 otherwise - that code is what stops a pipeline.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import process from "node:process";

// ---------- arguments ----------
const args = {};
for (let i = 2; i < process.argv.length; i += 2) {
  args[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];
}
if (!args.env || !args.suite) {
  console.error("Usage: node run-tests.mjs --env <file.json> --suite <petstore|invoices> [--report-json <file>]");
  process.exit(2);
}

const env = JSON.parse(readFileSync(args.env, "utf8"));
if (env.insecure) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // LAB self-signed certificate only
  console.warn("! insecure mode: TLS certificates are not verified (lab only)"); quietTlsWarning();
}
const base = env.baseUrl.replace(/\/+$/, "");

// ---------- OAuth 2 token (client credentials - endpoint verified in the 4.7.0 docs) ----------
let authHeader = null;
if (env.auth) {
  const basic = Buffer.from(env.auth.clientId + ":" + env.auth.clientSecret).toString("base64");
  const body = "grant_type=client_credentials" + (env.auth.scope ? "&scope=" + encodeURIComponent(env.auth.scope) : "");
  const r = await fetch(env.auth.tokenUrl, {
    method: "POST",
    headers: { Authorization: "Basic " + basic, "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!r.ok) {
    console.error("Failed to get a token (" + r.status + ") from " + env.auth.tokenUrl);
    process.exit(1);
  }
  const tok = await r.json();
  authHeader = "Bearer " + tok.access_token;
  console.log("OK  OAuth 2 token acquired (expires in " + tok.expires_in + "s)");
}

// ---------- mini test framework ----------
const results = [];
async function test(name, fn) {
  const started = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - started });
    console.log("  " + green("PASS") + "  " + name);
  } catch (err) {
    results.push({ name, ok: false, ms: Date.now() - started, error: String(err.message || err) });
    console.log("  " + red("FAIL") + "  " + name + " - " + (err.message || err));
  }
}
function expect(cond, message) {
  if (!cond) throw new Error(message);
}
async function call(method, path, { body, headers } = {}) {
  const h = Object.assign({ "X-Correlation-Id": "test-" + randomUUID().slice(0, 8) }, headers);
  if (authHeader) h.Authorization = authHeader;
  if (body !== undefined) h["Content-Type"] = "application/json";
  const res = await fetch(base + path, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await res.clone().json(); } catch { /* non-JSON responses tolerated */ }
  return { status: res.status, headers: res.headers, json, sentCorrelationId: h["X-Correlation-Id"] };
}

// ---------- suites ----------
const suites = {
  petstore: async () => {
    await test("GET /health returns 200 UP", async () => {
      const r = await call("GET", "/health");
      expect(r.status === 200, "status " + r.status);
      expect(r.json && r.json.status === "UP", "unexpected body");
    });
    await test("GET /pets returns 200 and a non-empty list", async () => {
      const r = await call("GET", "/pets");
      expect(r.status === 200, "status " + r.status);
      expect(Array.isArray(r.json) && r.json.length >= 6, "expected a list of at least 6 pets");
    });
    await test("X-Correlation-Id is echoed back in the response", async () => {
      const r = await call("GET", "/pets");
      expect(r.headers.get("x-correlation-id") === r.sentCorrelationId,
        "expected " + r.sentCorrelationId + ", got " + r.headers.get("x-correlation-id"));
    });
    await test("GET /pets/6 returns 200 (Coco the parrot)", async () => {
      const r = await call("GET", "/pets/6");
      expect(r.status === 200, "status " + r.status);
      expect(r.json && r.json.species === "parrot", "unexpected species");
    });
    await test("GET /pets/99 returns 404 PET_NOT_FOUND", async () => {
      const r = await call("GET", "/pets/99");
      expect(r.status === 404, "status " + r.status);
      expect(r.json && r.json.code === "PET_NOT_FOUND", "unexpected error code");
    });
    await test("POST /pets with a valid body returns 201", async () => {
      const r = await call("POST", "/pets", { body: { name: "TestPet", species: "fish" } });
      expect(r.status === 201, "status " + r.status);
      expect(r.json && r.json.id > 0, "missing id");
    });
    await test("POST /pets with an unknown species returns 400 INVALID_PAYLOAD", async () => {
      const r = await call("POST", "/pets", { body: { name: "Dino", species: "dinosaur" } });
      expect(r.status === 400, "status " + r.status);
      expect(r.json && r.json.code === "INVALID_PAYLOAD", "unexpected error code");
    });
  },

  invoices: async () => {
    await test("GET /health returns 200 UP", async () => {
      const r = await call("GET", "/health");
      expect(r.status === 200, "status " + r.status);
      expect(r.json && r.json.status === "UP", "unexpected body");
    });
    await test("GET /invoices returns 200 and a non-empty list", async () => {
      const r = await call("GET", "/invoices");
      expect(r.status === 200, "status " + r.status);
      expect(Array.isArray(r.json) && r.json.length >= 6, "expected a list of at least 6 invoices");
    });
    await test("X-Correlation-Id is echoed back in the response", async () => {
      const r = await call("GET", "/invoices");
      expect(r.headers.get("x-correlation-id") === r.sentCorrelationId,
        "expected " + r.sentCorrelationId + ", got " + r.headers.get("x-correlation-id"));
    });
    await test("GET /invoices?status=SUBMITTED returns 200 and applies the filter", async () => {
      const r = await call("GET", "/invoices?status=SUBMITTED");
      expect(r.status === 200, "status " + r.status);
      expect(Array.isArray(r.json) && r.json.every((i) => i.status === "SUBMITTED"), "filter not applied");
    });
    await test("GET /invoices?status=FOO returns 400 INVALID_FILTER", async () => {
      const r = await call("GET", "/invoices?status=FOO");
      expect(r.status === 400, "status " + r.status);
      expect(r.json && r.json.code === "INVALID_FILTER", "unexpected error code");
    });
    await test("GET /invoices/1001 returns 200", async () => {
      const r = await call("GET", "/invoices/1001");
      expect(r.status === 200, "status " + r.status);
      expect(r.json && r.json.currency === "EUR", "unexpected body");
    });
    await test("GET /invoices/9999 returns 404 INVOICE_NOT_FOUND", async () => {
      const r = await call("GET", "/invoices/9999");
      expect(r.status === 404, "status " + r.status);
      expect(r.json && r.json.code === "INVOICE_NOT_FOUND", "unexpected error code");
    });
    await test("POST /invoices with a valid body returns 201 SUBMITTED", async () => {
      const r = await call("POST", "/invoices", { body: { provider: "Optique Bellecour", type: "optique", amountCents: 19900 } });
      expect(r.status === 201, "status " + r.status);
      expect(r.json && r.json.status === "SUBMITTED", "unexpected business status");
    });
    await test("POST /invoices with an unknown type returns 400 INVALID_PAYLOAD", async () => {
      const r = await call("POST", "/invoices", { body: { provider: "X", type: "sorcery", amountCents: 100 } });
      expect(r.status === 400, "status " + r.status);
      expect(r.json && r.json.code === "INVALID_PAYLOAD", "unexpected error code");
    });
  },
};

// ---------- run ----------
if (!suites[args.suite]) {
  console.error("Unknown suite: " + args.suite + " (available: " + Object.keys(suites).join(", ") + ")");
  process.exit(2);
}
console.log("Suite '" + args.suite + "' against " + base + (authHeader ? " (OAuth 2)" : " (direct access)"));
await suites[args.suite]();

const failed = results.filter((r) => !r.ok);
const summary = (results.length - failed.length) + "/" + results.length + " tests passed" + (failed.length ? " - FAILED" : "");
console.log("\n" + (failed.length ? red(summary) : green(summary)));

if (args["report-json"]) {
  writeFileSync(args["report-json"], JSON.stringify({
    suite: args.suite, baseUrl: base, ranAt: new Date().toISOString(),
    passed: results.length - failed.length, failed: failed.length, tests: results,
  }, null, 2));
  console.log("Report written: " + args["report-json"]);
}

process.exit(failed.length ? 1 : 0);

// ---------- terminal colours and lab-mode warning (kept at the end: the course shows this
// file by line ranges, its line numbers must not move) ----------
// PASS in green, FAIL in red when stdout is a terminal; plain text when piped (CI logs, files).
// NO_COLOR (https://no-color.org) switches colours off, FORCE_COLOR switches them on.
function colour() { return process.env.NO_COLOR ? false : (process.env.FORCE_COLOR ? true : !!process.stdout.isTTY); }
function green(s) { return colour() ? "\x1b[32m" + s + "\x1b[0m" : s; }
function red(s) { return colour() ? "\x1b[31m" + s + "\x1b[0m" : s; }
// Node repeats the "insecure mode" line above as a three-line Warning (NODE_TLS_REJECT_UNAUTHORIZED);
// the course counts "three lines before the tests": that one warning is swallowed, others still print.
function quietTlsWarning() {
  const printers = process.listeners("warning");
  process.removeAllListeners("warning");
  process.on("warning", (w) => {
    if (/NODE_TLS_REJECT_UNAUTHORIZED/.test(String(w && w.message))) return;
    for (const print of printers) print(w);
  });
}
