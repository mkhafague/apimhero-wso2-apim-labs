#!/usr/bin/env node
/**
 * Burst caller - lab 8a (module 7). Cross-platform, zero dependencies (Node >= 18).
 * Output stays in English so the screencast is reusable in every course language.
 *
 * Usage: node burst.mjs <url> <access_token> [calls=15] [pause_ms=1000]
 * Example: node burst.mjs https://localhost:8243/petstore/1.0.0/pets eyJhbGci... 15
 *
 * Pace: the calls leave one after the other, with a pause of pause_ms between the
 * answer to one call and the next call - by default 1000 ms, about one call per
 * second (0 = no pause). Fifteen calls take about fifteen seconds, well inside the
 * one-minute window of a 10 req/min plan.
 * Why a pause: the gateway does not count the calls itself. It reports each call to
 * the Traffic Manager, which decides when the plan is exceeded and sends that
 * decision back to the gateway: a few hundred milliseconds later, up to about a
 * second on a busy laptop. Without a pause, fifteen calls leave in under half a
 * second and all get through before the decision arrives: "15 x 200, 0 x 429" on a
 * plan that does bite (one more call a second later returns 429). With the pause,
 * the switch lands where the plan puts it: ten 200, then 429 from the 11th call.
 * A shorter pause (e.g. 300) runs faster but may let an 11th or 12th call through.
 * Each call opens its own connection (Connection: close), like a separate curl:
 * a connection kept open across the pauses sometimes stalls for seconds on the
 * Docker lab stack.
 * The window is the clock minute (the 429 says to retry at the next minute): a
 * burst started in the last seconds of a minute is split in two windows and may
 * show fewer 429 - run it again.
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // LAB self-signed certificate only

const [url, token, countArg, pauseArg] = process.argv.slice(2);
const pause = parseInt(pauseArg ?? "1000", 10);
if (!url || !token || !(pause >= 0)) {
  console.error("Usage: node burst.mjs <url> <access_token> [calls=15] [pause_ms=1000]");
  process.exit(2);
}
const count = parseInt(countArg || "15", 10);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let ok = 0, throttled = 0, other = 0;
for (let i = 1; i <= count; i++) {
  if (i > 1 && pause > 0) await sleep(pause);
  const res = await fetch(url, { headers: { Authorization: "Bearer " + token, Connection: "close" } });
  await res.arrayBuffer();
  const mark = res.status === 200 ? "OK  " : res.status === 429 ? "STOP" : "?   ";
  const retry = res.status === 429 ? res.headers.get("retry-after") : null; // seconds, or an HTTP date
  console.log(String(i).padStart(3) + ". " + mark + " " + res.status +
    (retry ? "  (Retry-After: " + retry + (/^\d+$/.test(retry) ? "s" : "") + ")" : ""));
  if (res.status === 200) ok++; else if (res.status === 429) throttled++; else other++;
}
console.log("\nSummary: " + ok + " x 200, " + throttled + " x 429" + (other ? ", " + other + " other" : ""));
console.log(throttled > 0
  ? "The limit did its job as a regulator - wait ~1 minute and run again: the quota refills."
  : "No 429: the subscription plan limit was not reached (check the 10 req/min plan).");
