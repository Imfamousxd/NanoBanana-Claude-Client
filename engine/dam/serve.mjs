// DAM search UI + JSON API — one small HTTP server, no framework. Runs on the same Railway service as
// the worker (`dam watch` starts it on $PORT) or on a laptop (`dam serve`). Auth is a shared password
// (DAM_UI_PASSWORD) sent as a cookie or `X-DAM-Key` header; nothing here writes except verdicts.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadGraph } from "../knowledge/graph.mjs";
import { damConfig } from "./config.mjs";
import { DamDb } from "./db.mjs";
import { brandCards } from "./analyze.mjs";
import { searchAssets, similarAssets, productIndexFromCards } from "./search.mjs";
import { getUgcProfile } from "./ugc-profile.mjs";
import { applyVerdictToDam } from "./kg-bridge.mjs";
import { CLASS_IDS, SUBCLASSES, ROLE_IDS } from "./taxonomy.mjs";

const MIME = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".mp4": "video/mp4" };
let PROXY_ROOT = null;
function proxyUrl(value) {
  if (typeof value !== "string" || !PROXY_ROOT || !value.startsWith(PROXY_ROOT)) return value;
  return "/proxy/" + value.slice(PROXY_ROOT.length).replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/");
}
function rewriteProxies(proxies) {
  if (!proxies || typeof proxies !== "object") return proxies;
  const out = {};
  for (const [key, value] of Object.entries(proxies)) out[key] = Array.isArray(value) ? value.map((item) => (item && item.url ? { ...item, url: proxyUrl(item.url) } : proxyUrl(item))) : proxyUrl(value);
  return out;
}
function json(res, status, body) { res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }); res.end(JSON.stringify(body)); }
function readBody(req) { return new Promise((resolve) => { let data = ""; req.on("data", (chunk) => { data += chunk; if (data.length > 1e6) req.destroy(); }); req.on("end", () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } }); }); }
function cookie(req, name) { const match = (req.headers.cookie || "").match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`)); return match ? decodeURIComponent(match[1]) : null; }

export function createDamServer(root, { config = damConfig(root), password = process.env.DAM_UI_PASSWORD || null } = {}) {
  const graph = loadGraph(root);
  const db = new DamDb(config.databaseUrl);
  const cards = brandCards(root, graph);
  const products = productIndexFromCards(cards);
  const brands = graph.nodes.filter((node) => node.type === "brand").map((node) => ({ id: node.id, name: node.name }));
  const html = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "ui.html"), "utf8");
  const authed = (req) => !password || cookie(req, "dam_key") === password || req.headers["x-dam-key"] === password;
  PROXY_ROOT = path.join(config.workDir, "proxies");

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    try {
      if (url.pathname === "/healthz") return json(res, 200, { ok: true, workers: (await db.query("select id, activity, last_seen_at from dam.workers order by last_seen_at desc limit 3")).rows });
      if (url.pathname === "/login" && req.method === "POST") {
        const body = await readBody(req);
        if (!password || body.password === password) { res.writeHead(204, { "Set-Cookie": `dam_key=${encodeURIComponent(body.password || "")}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000` }); return res.end(); }
        return json(res, 401, { error: "wrong password" });
      }
      if (url.pathname === "/" || url.pathname === "/index.html") { res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }); return res.end(html); }
      if (url.pathname.startsWith("/proxy/")) {
        const relative = decodeURIComponent(url.pathname.slice("/proxy/".length));
        const file = path.join(PROXY_ROOT, relative);
        if (!file.startsWith(PROXY_ROOT) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
        res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream", "Cache-Control": "public, max-age=86400" });
        return fs.createReadStream(file).pipe(res);
      }
      if (!authed(req)) return json(res, 401, { error: "unauthorised" });
      if (url.pathname === "/api/status") { const { digestionStatus } = await import("./status.mjs"); return json(res, 200, await digestionStatus(db)); }
      if (url.pathname === "/api/products") {
        const brand = url.searchParams.get("brand");
        const { rows } = await db.query(`select brand, product, count(*)::int as n from dam.assets where product is not null and status in ('analyzed','embedded') and deleted_at is null ${brand ? "and brand = $1" : ""} group by 1,2 order by 1, 3 desc`, brand ? [brand] : []);
        return json(res, 200, { products: rows });
      }
      // Admin: repair proxies recorded as local paths on THIS host (the worker's volume). Password-protected; free.
      if (url.pathname === "/api/admin/repair-proxies" && req.method === "POST") {
        const [{ repairProxies }, { ProxyStore }] = await Promise.all([import("./repair-proxies.mjs"), import("./storage.mjs")]);
        const store = new ProxyStore({ ...config.storage, localRoot: config.workDir });
        await store.ready();
        return json(res, 200, await repairProxies(db, store, { limit: Number(url.searchParams.get("limit") || 50000), concurrency: 8 }));
      }
      if (url.pathname === "/api/directory") {
        const { productDirectory } = await import("./product-refs.mjs");
        const result = await productDirectory(db, graph, root, { brand: url.searchParams.get("brand") || null, since: url.searchParams.get("since") || null, limit: Number(url.searchParams.get("best") || 6) });
        return json(res, 200, { ...result, directory: result.directory.map((entry) => ({ ...entry, best: entry.best.map((item) => ({ ...item, thumb: rewriteProxies({ thumb: item.thumb }).thumb })) })) });
      }
      if (url.pathname === "/api/meta") {
        const stats = await db.stats();
        return json(res, 200, { brands, classes: CLASS_IDS, subclasses: SUBCLASSES, roles: ROLE_IDS, stats });
      }
      if (url.pathname === "/api/search") {
        const q = url.searchParams.get("q") || "";
        const filters = {};
        for (const key of ["brand", "class", "form", "orientation", "kind"]) if (url.searchParams.get(key)) filters[key] = url.searchParams.get(key);
        if (url.searchParams.get("roles")) filters.roles = url.searchParams.get("roles").split(",");
        if (url.searchParams.get("realHuman") === "1") filters.realHuman = true;
        const result = await searchAssets(db, graph, q || " ", { filters, limit: Number(url.searchParams.get("limit") || 40), rerank: url.searchParams.get("rerank") === "1", config: { ...config, searchEmbeddingsAllowed: url.searchParams.get("vectors") !== "0" }, products });
        return json(res, 200, { ...result, results: result.results.map(slim) });
      }
      const assetMatch = url.pathname.match(/^\/api\/asset\/([0-9a-f-]{36})$/);
      if (assetMatch) {
        const asset = await db.getAsset(assetMatch[1]);
        if (!asset) return json(res, 404, { error: "not found" });
        const { rows } = await db.query("select measured, transcript, read, keyframes from dam.video_analysis where asset_id = $1", [asset.id]);
        const { embedding_text: _t, embedding_visual: _v, tsv: _tsv, ...rest } = asset;
        rest.proxies = rewriteProxies(rest.proxies);
        if (rows[0]?.keyframes) rows[0].keyframes = rows[0].keyframes.map((frame) => ({ ...frame, url: proxyUrl(frame.url) }));
        return json(res, 200, { ...rest, video: rows[0] || null, similar: asset.embedding_visual ? (await similarAssets(db, asset.id, { limit: 8 })).map(slim) : [] });
      }
      const verdictMatch = url.pathname.match(/^\/api\/asset\/([0-9a-f-]{36})\/verdict$/);
      if (verdictMatch && req.method === "POST") {
        const body = await readBody(req);
        return json(res, 200, slim(await applyVerdictToDam(db, { assetId: verdictMatch[1], verdict: body.verdict, reason: body.reason, roles: body.roles || [] })));
      }
      const profileMatch = url.pathname.match(/^\/api\/ugc-profile\/([a-z0-9.-]+)$/);
      if (profileMatch) return json(res, 200, await getUgcProfile(db, profileMatch[1]));
      json(res, 404, { error: "no such route" });
    } catch (error) {
      console.error(`[dam serve] ${req.method} ${url.pathname}: ${error.message}`);
      json(res, 500, { error: error.message });
    }
  });
  server.close = ((original) => (...args) => { db.end().catch(() => {}); return original.apply(server, args); })(server.close.bind(server));
  return server;
}

function slim(row) {
  return { id: row.id, path: row.path, source: row.source_id, kind: row.kind, brand: row.brand, class: row.class, form: row.subclass, product: row.product, title: row.title, summary: row.summary, tags: row.tags, roles: row.reference_roles, quality: row.quality, orientation: row.orientation, width: row.width, height: row.height, duration_s: row.duration_s, people: row.people_count, realHuman: row.is_real_human, thumb: proxyUrl(row.proxies?.thumb) || null, preview: proxyUrl(row.proxies?.preview) || null, contact: proxyUrl(row.proxies?.contact) || null, flags: row.flags, verdict: row.verdict, score: row.score, why: row.why, similarity: row.similarity };
}

export function startDamServer(root, { port = Number(process.env.PORT) || 8787 } = {}) {
  const server = createDamServer(root);
  server.listen(port, () => console.error(`[dam serve] listening on http://localhost:${port}${process.env.DAM_UI_PASSWORD ? " (password protected)" : " (no DAM_UI_PASSWORD set — open)"}`));
  return server;
}
