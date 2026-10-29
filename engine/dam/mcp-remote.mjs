// The DAM as its own remote MCP, for people who only want to find assets. Mounted at /mcp on the DAM
// web server (serve.mjs), so the Railway worker hosts it with no extra service. Read-only by design:
// it exposes the search/lookup tools from mcp-tools.mjs and nothing that scans, analyses, spends or
// records verdicts. Each person gets a token (DAM_MCP_TOKENS); a token can be limited to some brands.
//
//   DAM_MCP_TOKENS="ali:3f9c…:muha+dialed-moods,cory:a81d…"   name:token[:brand+brand]
//
// Claude.ai connectors cannot send headers, so the token may sit in the path (/mcp/<token>); Claude
// Code and other clients can send `Authorization: Bearer <token>` to /mcp instead.
import crypto from "node:crypto";
import path from "node:path";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { resolveBrand } from "../knowledge/graph.mjs";
import { createDamTools } from "./mcp-tools.mjs";
import { DropboxClient } from "./dropbox.mjs";
import { CLASS_IDS } from "./taxonomy.mjs";

// The tools a searcher gets. Everything else in mcp-tools.mjs writes, spends, or only makes sense on
// the machine running it (dam_studio_refs writes files to the server's disk).
export const READ_ONLY_TOOLS = ["dam_search", "dam_asset", "dam_similar", "dam_products", "dam_product_refs", "dam_catalog", "dam_product_directory", "dam_ugc_profile", "dam_brands", "dam_stats"];

export const REMOTE_INSTRUCTIONS = `Search the team's brand asset library (the DAM): every image and video in the Dropbox brand folders, read by a vision model.
Classes you can filter on: ${CLASS_IDS.join(", ")}. Lifestyle/photoshoot pictures are lifestyle-photo; edited videos (promos, ad cuts, montages, launch films, recaps) are marketing-video; social posts, ads, flyers, banners, email graphics are marketing-still; creator content is ugc-video / ugc-still.
Start with dam_search in plain words ("muha lifestyle photo of someone holding the device outside, vertical"). Each hit has a thumbnail, a preview and why it matched. dam_asset gives the full read of one file; dam_similar finds other angles, takes and sizes; dam_download gives a temporary link to the original file.
Show people the thumbnails, not just ids. This server is read-only.`;

/** Parse DAM_MCP_TOKENS into [{ name, token, brands: Set|null }]. Brands are resolved to graph ids. */
export function parseTokens(raw, graph) {
  const out = [];
  for (const entry of String(raw || "").split(",").map((part) => part.trim()).filter(Boolean)) {
    const [name, token, brandList] = entry.split(":");
    if (!name || !token || token.length < 16) { console.error(`[dam mcp] ignoring malformed DAM_MCP_TOKENS entry for "${name || "?"}" (need name:token with a token of 16+ chars)`); continue; }
    const brands = brandList ? new Set(brandList.split("+").map((value) => resolveBrand(graph, value)?.id || value)) : null;
    out.push({ name, token, brands });
  }
  return out;
}

export function newToken() { return crypto.randomBytes(24).toString("base64url"); }

function sameSecret(a, b) {
  const left = Buffer.from(String(a)); const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function findCaller(tokens, presented) {
  if (!presented) return null;
  return tokens.find((entry) => sameSecret(entry.token, presented)) || null;
}

/** Turn proxy paths that live on this host's volume into absolute URLs served by /proxy/. */
function absolutize(value, proxyRoot, publicBase) {
  if (typeof value !== "string" || !proxyRoot || !publicBase || !value.startsWith(proxyRoot)) return value;
  return `${publicBase}/proxy/` + value.slice(proxyRoot.length).replace(/^\/+/, "").split("/").map(encodeURIComponent).join("/");
}
function absolutizeDeep(value, proxyRoot, publicBase) {
  if (typeof value === "string") return absolutize(value, proxyRoot, publicBase);
  if (Array.isArray(value)) return value.map((item) => absolutizeDeep(item, proxyRoot, publicBase));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, absolutizeDeep(item, proxyRoot, publicBase)]));
  return value;
}

export function createRemoteDam(root, graphFn, { config, publicBase = null } = {}) {
  const proxyRoot = path.join(config.workDir, "proxies");
  const all = createDamTools(root, graphFn);
  const tools = all.filter((tool) => READ_ONLY_TOOLS.includes(tool.name));
  const byName = Object.fromEntries(all.map((tool) => [tool.name, tool]));
  const assetTool = byName.dam_asset;
  let dbx = null;

  // Brand scoping. A scoped caller may only name brands in scope; results from other brands are dropped.
  const brandOf = (value) => (value ? resolveBrand(graphFn(), value)?.id || value : undefined);
  const inScope = (caller, brand) => !caller.brands || (brand && caller.brands.has(brand));
  const checkBrand = (caller, brand, { required = false } = {}) => {
    if (!caller.brands) return brand;
    if (!brand) {
      if (caller.brands.size === 1) return [...caller.brands][0];
      if (required) throw new Error(`Name a brand: this token covers ${[...caller.brands].join(", ")}.`);
      return undefined;
    }
    const id = brandOf(brand);
    if (!caller.brands.has(id)) throw new Error(`This token does not cover ${brand}. It covers ${[...caller.brands].join(", ")}.`);
    return id;
  };
  const keepRows = (caller, rows) => (caller.brands ? (rows || []).filter((row) => inScope(caller, row.brand)) : rows);

  function scopedHandler(tool, caller) {
    switch (tool.name) {
      case "dam_search":
        return async (args) => {
          const brand = checkBrand(caller, args.brand);
          // A multi-brand token searching without a brand: over-fetch, then drop out-of-scope hits.
          const limit = args.limit || 20;
          const result = await tool.handler({ ...args, brand, limit: caller.brands && !brand ? Math.min(60, limit * 3) : limit });
          return { ...result, results: keepRows(caller, result.results).slice(0, limit) };
        };
      case "dam_asset":
        return async (args) => {
          const asset = await tool.handler(args);
          if (!inScope(caller, asset.brand)) throw new Error(`no asset ${args.id}`);
          return asset;
        };
      case "dam_similar":
        return async (args) => { const result = await tool.handler(args); return { ...result, results: keepRows(caller, result.results) }; };
      case "dam_products":
        return async (args) => { const result = await tool.handler({ ...args, brand: checkBrand(caller, args.brand) }); return { products: keepRows(caller, result.products) }; };
      case "dam_stats":
        // Library-wide counts and spend are for the owner; a scoped token sees nothing it cannot search.
        return async (args) => { if (caller.brands) throw new Error("dam_stats is only available to unscoped tokens."); return tool.handler(args); };
      case "dam_ugc_profile":
        // compute=true rewrites dam.ugc_profiles; remote callers only read the stored profile.
        return async (args) => tool.handler({ ...args, compute: false, brand: checkBrand(caller, args.brand, { required: true }) });
      default:
        // product refs, catalog and directory are per-brand reads.
        return async (args) => tool.handler({ ...args, brand: checkBrand(caller, args.brand, { required: true }) });
    }
  }

  const downloadTool = {
    name: "dam_download",
    title: "Temporary link to the original file",
    description: "A Dropbox link to the full-resolution original of one asset, valid for about 4 hours, plus its Dropbox path. Use after dam_search / dam_asset when someone wants the actual file.",
    inputSchema: { id: z.string().uuid() },
    handler: (caller) => async ({ id }) => {
      const asset = await assetTool.handler({ id });
      if (!inScope(caller, asset.brand)) throw new Error(`no asset ${id}`);
      const { rows } = await sourceRow(asset.source_id);
      const source = rows[0];
      if (!source || source.kind !== "dropbox") return { id, path: asset.path, note: "This asset is not in Dropbox, so there is no shareable link." };
      dbx ||= DropboxClient.fromEnv();
      const dropboxPath = `${source.root}/${asset.path}`;
      return { id, title: asset.title, dropboxPath, link: await dbx.temporaryLink(dropboxPath), expires: "about 4 hours" };
    },
  };

  let sourceDb = null;
  async function sourceRow(sourceId) {
    if (!sourceDb) { const { DamDb } = await import("./db.mjs"); sourceDb = new DamDb(config.databaseUrl); }
    return sourceDb.query("select id, kind, root from dam.sources where id = $1", [sourceId]);
  }

  function buildServer(caller) {
    const server = new McpServer({ name: "brand-asset-library", version: "1.0.0" }, { instructions: REMOTE_INSTRUCTIONS });
    const register = (name, meta, run) => server.registerTool(name, meta, async (args) => {
      const started = Date.now();
      try {
        const value = absolutizeDeep(await run(args || {}), proxyRoot, publicBase);
        console.error(`[dam mcp] ${caller.name} ${name} ok ${Date.now() - started}ms`);
        return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent: value && typeof value === "object" && !Array.isArray(value) ? value : { value } };
      } catch (error) {
        console.error(`[dam mcp] ${caller.name} ${name} failed: ${error?.message || error}`);
        return { isError: true, content: [{ type: "text", text: String(error?.message || error) }] };
      }
    });
    for (const tool of tools) register(tool.name, { title: tool.title, description: tool.description, inputSchema: tool.inputSchema }, scopedHandler(tool, caller));
    register(downloadTool.name, { title: downloadTool.title, description: downloadTool.description, inputSchema: downloadTool.inputSchema }, downloadTool.handler(caller));
    return server;
  }

  /** Handle one HTTP request to /mcp. Stateless: a fresh server + transport per request. */
  async function handle(req, res, caller, body) {
    const server = buildServer(caller);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    res.on("close", () => { transport.close().catch(() => {}); server.close().catch(() => {}); });
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
  }

  return { handle, toolNames: [...tools.map((tool) => tool.name), downloadTool.name], close: async () => { await sourceDb?.end().catch(() => {}); } };
}
