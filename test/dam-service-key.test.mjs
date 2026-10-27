// The DAM's service key (DAM_MCP_KEYS): what the hosted dialed-studio MCP holds instead of the people's
// UI password. Offline — the routes probed here answer before any database query (a pg Pool connects
// lazily), so no DB is needed. What must hold: the key reads (GET), and only reads; the UI password
// keeps working; a short or wrong key is refused.
import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDamServer } from "../engine/dam/serve.mjs";
import { damConfig } from "../engine/dam/config.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KEY = "svc-" + "k".repeat(40);

async function withServer(fn) {
  process.env.DAM_MCP_KEYS = `too-short, ${KEY}`;
  const config = { ...damConfig(ROOT), databaseUrl: "postgres://nobody:none@127.0.0.1:1/none" };
  const server = createDamServer(ROOT, { config, password: "ui-password" });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try { await fn(base); } finally { server.close(); delete process.env.DAM_MCP_KEYS; }
}
const call = (base, p, { method = "GET", key } = {}) => fetch(base + p, { method, headers: key ? { "X-DAM-Key": key } : {} }).then((r) => r.status);

test("service key: GET passes auth, writes and admin are refused, wrong/short keys refused", async () => {
  await withServer(async (base) => {
    assert.equal(await call(base, "/api/no-such-route", { key: KEY }), 404, "authorised GET reaches routing");
    assert.equal(await call(base, "/api/no-such-route"), 401);
    assert.equal(await call(base, "/api/no-such-route", { key: "too-short" }), 401, "keys under 24 chars are ignored");
    assert.equal(await call(base, "/api/no-such-route", { key: KEY + "x" }), 401);
    assert.equal(await call(base, "/api/asset/0f8a3c2e-1111-4222-8333-944455556666/verdict", { method: "POST", key: KEY }), 401, "no verdict writes");
    assert.equal(await call(base, "/api/admin/repair-proxies", { method: "POST", key: KEY }), 401);
    assert.equal(await call(base, "/api/admin/anything", { key: KEY }), 401, "no admin even by GET");
    assert.equal(await call(base, "/api/no-such-route", { key: "ui-password" }), 404, "the people's password still works");
  });
});
