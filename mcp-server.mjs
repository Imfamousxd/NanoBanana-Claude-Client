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

  engine_status: {
    description: "See WHAT recent generations produced and WHY — the last N rows from the ledger " +
      "with status (succeeded/failed), the gate outcome (watcher/transcript, and whether a gate " +
      "REJECTED it), the operator verdict, and cost. This is the 'did it reach the final goal?' " +
      "view: a run that succeeded but shows rejected_by, or sits at verdict 'pending', has NOT been " +
      "delivered. Read-only, spends nothing.",
    inputSchema: {
      type: "object",
      properties: { limit: { type: "integer", default: 20, minimum: 1, maximum: 200,
        description: "how many recent generations to show" } },
    },
    handler: async ({ limit = 20 }) => {
      const r = await run("node", ["gen-verdict.mjs", "recent", String(limit)], { timeoutMs: 30000 });
      return okText(r.out || r.err || "(no output)");
    },
  },
  engine_verdict: {
    description: "CLOSE THE LOOP: record the operator's call on a generation — 'approved' (it's " +
      "delivered) or 'rejected' (sets rejected_by='operator', the highest-value training row: a " +
      "clip the machine gates PASSED but a human failed). This is the flywheel's human step; a " +
      "generation is not 'done' until it has a verdict. Pass the cgt-* task id (from engine_status) " +
      "or a clip path. --why is surfaced, not persisted — say it in chat so it lands in the ledger.",
    inputSchema: {
      type: "object", required: ["target", "verdict"],
      properties: {
        target: { type: "string", description: "cgt-* task id, or path to the .mp4 (resolves via sidecar)" },
        verdict: { type: "string", enum: ["approved", "rejected"] },
        why: { type: "string", description: "one-line reason (surfaced to the operator, not stored)" },
      },
    },
    handler: async ({ target, verdict, why }) => {
      if (!target || !["approved", "rejected"].includes(verdict))
        return errText("engine_verdict needs target (cgt-* id or clip path) and verdict = approved|rejected");
      const args = ["gen-verdict.mjs", target, verdict];
      if (why) args.push("--why", why);
      const r = await run("node", args, { timeoutMs: 30000 });
      return (r.code === 0 ? okText : errText)(r.out || r.err || "(no output)");
    },
  },

  // ---- knowledge-graph tools: evolve the graph fast, through the MCP ----
  kg_list: {
    description: "List the knowledge-graph law banks (seedance25/house/post) with law counts, or " +
      "pass bank to list its law ids.",
    inputSchema: { type: "object", properties: { bank: { type: "string" } } },
    handler: async ({ bank }) => {
      const r = await run("node", ["kg-law.mjs", "list", ...(bank ? [bank] : [])], { timeoutMs: 30000 });
      return okText(r.out || r.err);
    },
  },
  kg_search: {
    description: "Search the knowledge graph for laws matching a query across every bank. " +
      "Use before adding a law to avoid duplicating an existing one.",
    inputSchema: { type: "object", required: ["query"], properties: { query: { type: "string" } } },
    handler: async ({ query }) => {
      const r = await run("node", ["kg-law.mjs", "search", query], { timeoutMs: 30000 });
      return okText(r.out || r.err);
    },
  },
  kg_get: {
    description: "Print one law's full 6 fields.",
    inputSchema: { type: "object", required: ["bank", "id"], properties: { bank: { type: "string" }, id: { type: "string" } } },
    handler: async ({ bank, id }) => {
      const r = await run("node", ["kg-law.mjs", "get", bank, id], { timeoutMs: 30000 });
      return okText(r.out || r.err);
    },
  },
  kg_add_law: {
    description: "Add or update a knowledge-graph law (upsert), then run the regression suite to " +
      "validate schema + rebuild the vault. Every law needs all 6 fields: claim, evidence, " +
      "counterexamples, applies_to, confidence, source. Set confidence='documented' (NOT " +
      "'measured') for anything from external docs until you A/B it on our own endpoint — that " +
      "honesty is the point of the graph.",
    inputSchema: {
      type: "object",
      required: ["bank", "id", "claim", "evidence", "counterexamples", "applies_to", "confidence", "source"],
      properties: {
        bank: { type: "string", description: "seedance25_laws | house_laws | post_laws" },
        id: { type: "string", description: "kebab law id, e.g. sd25:some-new-finding" },
        claim: { type: "string" }, evidence: { type: "string" }, counterexamples: { type: "string" },
        applies_to: { type: "string" },
        confidence: { type: "string", enum: ["measured", "strong", "moderate", "documented", "weak"] },
        source: { type: "string" },
      },
    },
    handler: async ({ bank, id, claim, evidence, counterexamples, applies_to, confidence, source }) => {
      const law = JSON.stringify({ claim, evidence, counterexamples, applies_to, confidence, source });
      const add = await run("node", ["kg-law.mjs", "add", bank, id, "--json", law], { timeoutMs: 30000 });
      if (add.code !== 0) return errText(`add failed:\n${add.err || add.out}`);
      const suite = await run("python3", ["kg-vault-test.py"], { timeoutMs: 300000 });
      const passed = /(\d+)\/\1 passed/.test(suite.out) || /passed/.test(suite.out);
      return (passed ? okText : errText)(`${add.out}\n--- suite ---\n${(suite.out || suite.err).split("\n").slice(-3).join("\n")}`);
    },
  },

  examples_find: {
    description: "Pull PAST reference creatives (the 'what we want' library) by type, so a new " +
      "generation has real targets and @Image references. Omit type to see the taxonomy + counts. " +
      "e.g. type='photo', subtype='meta-ad' returns past Meta ad creatives; returns real file paths " +
      "you can feed to scene_frame or cite as @Image references.",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["photo", "video"], description: "omit to list the whole taxonomy" },
        subtype: { type: "string", description: "e.g. meta-ad, packshot, hero, lifestyle, card, logo, ugc-talking-head" },
        brand: { type: "string" },
        limit: { type: "integer", default: 8 },
      },
    },
    handler: async ({ type, subtype, brand, limit = 8 }) => {
      if (!type) { const r = await run("node", ["examples.mjs", "types"], { timeoutMs: 30000 }); return okText(r.out || r.err); }
      const args = ["examples.mjs", "find", "--type", type, "--limit", String(limit)];
      if (subtype) args.push("--subtype", subtype);
      if (brand) args.push("--brand", brand);
      const r = await run("node", args, { timeoutMs: 30000 });
      return okText(r.out || r.err);
    },
  },
  create_from_request: {
    description: "Turn a structured creative request into a SAVED, VALIDATED, PLANNED brief in one " +
      "call. You supply the creative content (casting, scene, beats, refs); this assembles a " +
      "correct *.video.json with routing-driven defaults, writes it to briefs/, runs the dry-run, " +
      "and returns the plan (route, cost, prompt-craft score, any blockers). It spends nothing — " +
      "review the plan, then call engine_generate. This is the fast path from 'I want X' to a brief.",
    inputSchema: {
      type: "object",
      required: ["id", "brand", "subject_type", "scene", "beats"],
      properties: {
        id: { type: "string" },
        brand: { type: "string" },
        campaign: { type: "string", description: "campaign name, or omit for 'none'" },
        subject_type: { type: "string", enum: ["person", "product", "artwork"] },
        avatar: { type: "string", description: "avatar name for the same-face lane (optional)" },
        casting: { type: "string", description: "person description (person subjects)" },
        lane: { type: "string", enum: ["ugc", "campaign"], default: "ugc" },
        duration: { type: "integer", default: 5 },
        ratio: { type: "string", default: "9:16" },
        resolution: { type: "string" },
        scene: { type: "object", description: "{look, camera, voice}" },
        beats: { type: "array", description: "[{t, action, line}] — the timed script" },
        refs: { type: "array", description: "[{path, name, role, describe, contains_person, third_party_marks}]" },
        claims_used: { type: "array", items: { type: "string" } },
        required_tokens: { type: "array", items: { type: "string" } },
        audio: { type: "object", description: "{generate, direction}" },
      },
    },
    handler: async (a) => {
      const talking = a.subject_type === "person" && (a.beats || []).some((b) => b.line);
      const brief = {
        _what: `Drafted via create_from_request (MCP) — review the plan, then engine_generate.`,
        id: a.id, brand: a.brand, campaign: a.campaign || "none",
        claims_used: a.claims_used || [], slots: [],
        lane: a.lane || "ugc", duration: a.duration ?? 5, ratio: a.ratio || "9:16",
        ...(a.resolution ? { resolution: a.resolution } : {}),
        subject: { type: a.subject_type, ...(a.avatar ? { avatar: a.avatar } : {}),
                   casting: a.casting || null, props: null },
        refs: { images: a.refs || [] },
        scene: a.scene || {},
        script: { register: "", profanity: false, beats: a.beats || [] },
        required_tokens: a.required_tokens || [],
        audio: a.audio || { generate: talking },
        proof: { required: false },
        post: { loudnorm: true, conform1080: false },
      };
      const briefsDir = path.join(DIR, "briefs");
      fs.mkdirSync(briefsDir, { recursive: true });
      const saved = path.join(briefsDir, `${a.id}.video.json`);
      fs.writeFileSync(saved, JSON.stringify(brief, null, 2) + "\n");
      const r = await run("node", ["video-engine.mjs", "--brief", saved], { timeoutMs: 60000 });
      return okText(`saved brief: ${path.relative(DIR, saved)}\n\n${r.out || r.err}`);
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
