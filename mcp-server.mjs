#!/usr/bin/env node
/**
 * mcp-server.mjs — the content engine as an MCP server (dependency-free, stdio JSON-RPC 2.0).
 *
 * WHY: instead of handing people `node video-engine.mjs --brief …`, expose the whole workflow as
 * native MCP tools. Any MCP client (Claude Code/Desktop) adds this server and gets: plan a brief,
 * see brands/avatars, compose a scene frame, check cost, and (gated) generate — as first-class
 * tools. It SPAWNS the already-validated engine scripts; it never reimplements their rules, so the
 * measured gates (claims, bands, refusals, prompt-craft) all still apply exactly once.
 *
 * Add to a client's MCP config:
 *   { "mcpServers": { "nanobanana": { "command": "node",
 *       "args": ["<repo>/mcp-server.mjs"] } } }
 *
 * Transport: newline-delimited JSON-RPC 2.0 on stdin/stdout (MCP stdio). Logs go to stderr only —
 * stdout is the protocol channel and must carry nothing but JSON-RPC.
 */
import fs from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import readline from "readline";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const PROTOCOL = "2025-06-18";
const log = (...a) => process.stderr.write(`[mcp] ${a.join(" ")}\n`);

// ---- run an engine script, capture stdout (never throws) ----
function run(cmd, args, { timeoutMs = 1200000 } = {}) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { cwd: DIR, env: process.env });
    let out = "", err = "";
    const timer = setTimeout(() => { p.kill("SIGKILL"); resolve({ code: -1, out, err: err + "\n[timeout]" }); }, timeoutMs);
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("close", (code) => { clearTimeout(timer); resolve({ code, out, err }); });
    p.on("error", (e) => { clearTimeout(timer); resolve({ code: -1, out, err: String(e) }); });
  });
}
const okText = (t) => ({ content: [{ type: "text", text: t }] });
const errText = (t) => ({ content: [{ type: "text", text: t }], isError: true });

// write a brief object to a temp file so the engine can read it
function tempBrief(brief) {
  const obj = typeof brief === "string" ? JSON.parse(brief) : brief;
  const f = path.join(os.tmpdir(), `mcp-brief-${obj.id || "x"}-${process.pid}.json`);
  fs.writeFileSync(f, JSON.stringify(obj, null, 2));
  return f;
}

// ---------------------------------------------------------------- tools
const TOOLS = {
  engine_plan: {
    description: "Dry-run a video brief: validate claims/bands, route the model, quote cost, and " +
      "score prompt-craft detail. Read-only, spends nothing. Pass the brief as a JSON object.",
    inputSchema: {
      type: "object", required: ["brief"],
      properties: { brief: { type: "object", description: "A *.video.json brief object (see ENGINE-INTAKE.md)" } },
    },
    handler: async ({ brief }) => {
      let f; try { f = tempBrief(brief); } catch (e) { return errText(`bad brief JSON: ${e.message}`); }
      const r = await run("node", ["video-engine.mjs", "--brief", f], { timeoutMs: 60000 });
      fs.rmSync(f, { force: true });
      return okText(r.out || r.err || "(no output)");
    },
  },
  engine_brands: {
    description: "List the brands registered in the engine (sieve/brands/) with campaign counts. " +
      "A claim not sourced in a brand's registry cannot be spoken.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => {
      const base = path.join(DIR, "sieve", "brands");
      if (!fs.existsSync(base)) return okText("no brands registered");
      const rows = fs.readdirSync(base).filter((b) => fs.existsSync(path.join(base, b, "brand.json"))).map((b) => {
        const cdir = path.join(base, b, "campaigns");
        const n = fs.existsSync(cdir) ? fs.readdirSync(cdir).filter((f) => f.endsWith(".json")).length : 0;
        return `- ${b}: ${n} campaign(s)`;
      });
      return okText(rows.join("\n") || "no brands");
    },
  },
  engine_avatars: {
    description: "List reusable avatars (Avatars/) and whether each is APPROVED or CASTING. " +
      "Casting-status avatars are refused for paid use.",
    inputSchema: { type: "object", properties: {} },
    handler: async () => {
      const base = path.join(DIR, "Avatars");
      if (!fs.existsSync(base)) return okText("no avatars");
      const rows = fs.readdirSync(base).filter((a) => fs.existsSync(path.join(base, a, "AVATAR.md"))).map((a) => {
        const md = fs.readFileSync(path.join(base, a, "AVATAR.md"), "utf-8");
        const status = /STATUS:\s*CASTING|status["']?\s*[:=]\s*["']?casting/i.test(md) ? "CASTING" :
          /STATUS:\s*APPROVED/i.test(md) ? "APPROVED" : "?";
        return `- ${a}: ${status}`;
      });
      return okText(rows.join("\n") || "no avatars");
    },
  },
  engine_cost: {
    description: "Show ModelArk spend/ledger status. action='spent' audits the ledger; " +
      "action='drain' recovers paid-but-not-downloaded tasks (run before ending a session).",
    inputSchema: {
      type: "object",
      properties: { action: { type: "string", enum: ["spent", "drain"], default: "spent" } },
    },
    handler: async ({ action = "spent" }) => {
      const r = await run("node", ["sd25-cost.mjs", action], { timeoutMs: 120000 });
      return okText(r.out || r.err || "(no output)");
    },
  },
  scene_frame: {
    description: "Compose an avatar + reference file(s) (product/card/brand asset) into ONE UGC " +
      "first frame at delivery ratio, which the avatar lane then animates. Cheap (image, not video). " +
      "Review the frame before generating. Refs are 'path:role' strings, e.g. 'inputs/card.png:card'.",
    inputSchema: {
      type: "object", required: ["avatar", "scene"],
      properties: {
        avatar: { type: "string", description: "Avatar name, e.g. 'Sol'" },
        refs: { type: "array", items: { type: "string" }, description: "'path:role' entries" },
        scene: { type: "string", description: "What the person is doing/holding, the light" },
        ar: { type: "string", default: "9:16" },
        n: { type: "integer", default: 2, minimum: 1, maximum: 4 },
      },
    },
    handler: async ({ avatar, refs = [], scene, ar = "9:16", n = 2 }) => {
      const args = ["scene-frame.mjs", "--avatar", avatar, "--scene", scene, "--ar", ar, "--n", String(n)];
      for (const r of refs) { args.push("--ref", r); }
      const res = await run("node", args, { timeoutMs: 180000 });
      return okText(res.out || res.err || "(no output)");
    },
  },
  engine_generate: {
    description: "GENERATE (spends money). Runs a brief for real. GATED: you MUST pass confirm=true, " +
      "and if the script speaks any registered claim you MUST pass claims_initialed with the name of " +
      "the human who approved it. Proof-gated prop shots and casting-status avatars still refuse. " +
      "Prefer engine_plan first to see cost. Video generation takes minutes.",
    inputSchema: {
      type: "object", required: ["brief", "confirm"],
      properties: {
        brief: { type: "object", description: "The *.video.json brief object" },
        confirm: { type: "boolean", description: "Must be true — the deliberate spend gate" },
        claims_initialed: { type: "string", description: "Name of the human who approved the claims (required if the brief speaks claims)" },
        n: { type: "integer", minimum: 1, maximum: 3, description: "candidates (each auto-gated)" },
        cite: { type: "string", enum: ["at", "prose"], description: "reference citation style" },
        allow_casting: { type: "boolean", description: "throwaway tests only — bypass the casting gate" },
      },
    },
    handler: async ({ brief, confirm, claims_initialed, n, cite, allow_casting }) => {
      if (confirm !== true) return errText("REFUSED: engine_generate spends money. Pass confirm=true to proceed (run engine_plan first to see the cost).");
      let f; try { f = tempBrief(brief); } catch (e) { return errText(`bad brief JSON: ${e.message}`); }
      const args = ["video-engine.mjs", "--brief", f, "--go"];
      if (claims_initialed) args.push("--claims-initialed", claims_initialed);
      if (n) args.push("--n", String(n));
      if (cite) args.push("--cite", cite);
      if (allow_casting) args.push("--allow-casting");
      const r = await run("node", args, { timeoutMs: 1500000 });
      fs.rmSync(f, { force: true });
      return (r.code === 0 ? okText : errText)(r.out || r.err || "(no output)");
    },
  },
};

// ---------------------------------------------------------------- JSON-RPC loop
function send(msg) { process.stdout.write(JSON.stringify(msg) + "\n"); }
function reply(id, result) { send({ jsonrpc: "2.0", id, result }); }
function replyErr(id, code, message) { send({ jsonrpc: "2.0", id, error: { code, message } }); }

async function handle(msg) {
  const { id, method, params } = msg;
  if (method === "initialize") {
    return reply(id, { protocolVersion: PROTOCOL, capabilities: { tools: {} },
      serverInfo: { name: "nanobanana-engine", version: "1.0.0" } });
  }
  if (method === "notifications/initialized" || method === "notifications/cancelled") return; // no reply
  if (method === "ping") return reply(id, {});
  if (method === "tools/list") {
    return reply(id, { tools: Object.entries(TOOLS).map(([name, t]) => ({
      name, description: t.description, inputSchema: t.inputSchema })) });
  }
  if (method === "tools/call") {
    const t = TOOLS[params?.name];
    if (!t) return replyErr(id, -32602, `unknown tool: ${params?.name}`);
    try { return reply(id, await t.handler(params.arguments || {})); }
    catch (e) { return reply(id, errText(`tool error: ${e?.message || e}`)); }
  }
  if (id !== undefined) replyErr(id, -32601, `method not found: ${method}`);
}

const rl = readline.createInterface({ input: process.stdin });
rl.on("line", (line) => { if (!line.trim()) return; let m; try { m = JSON.parse(line); } catch { return; } handle(m); });
log(`nanobanana-engine MCP server ready (protocol ${PROTOCOL}, ${Object.keys(TOOLS).length} tools)`);
