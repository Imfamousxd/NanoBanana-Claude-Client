// Prompt log — every generation prompt that goes through the engine or the MCP is appended here,
// verdict or not. Local-only (.content-engine/ is gitignored) and append-only JSONL; the tracked
// memory of what worked is knowledge/learnings/<brand>.json, written by feedback.mjs from these rows.
import fs from "node:fs";
import path from "node:path";
import { sha256File } from "../core/files.mjs";
import { redact } from "../core/errors.mjs";
import { resolveBrand } from "../knowledge/graph.mjs";

export const PROMPT_LOG_DIR = path.join(".content-engine", "prompt-log");

export function brandSlug(brandNode) {
  return String(brandNode?.id || brandNode || "unknown").replace(/^brand\./, "");
}

function logFile(root, slug, date = new Date()) {
  const month = date.toISOString().slice(0, 7);
  return path.join(root, PROMPT_LOG_DIR, slug, `${month}.jsonl`);
}

export function newLogId() {
  return `pl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function fileRecord(root, item) {
  const entry = typeof item === "string" ? { path: item } : { ...item };
  if (!entry.path) return entry;
  const absolute = path.isAbsolute(entry.path) ? entry.path : path.resolve(root, entry.path);
  entry.path = path.isAbsolute(item.path || item) && absolute.startsWith(root) ? path.relative(root, absolute) : entry.path;
  if (!entry.sha256 && fs.existsSync(absolute) && fs.statSync(absolute).isFile()) {
    try { entry.sha256 = sha256File(absolute); } catch { /* unreadable file: keep the path only */ }
  }
  return entry;
}

/**
 * Append one prompt-log entry. Never throws: a logging failure must not cost a paid generation.
 * Returns the entry (with id) or null when the write failed.
 */
export function appendPromptLog(root, graph, input) {
  try {
    const brandNode = resolveBrand(graph, input.brand);
    const slug = brandNode ? brandSlug(brandNode) : String(input.brand || "unknown").toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    const entry = {
      id: input.id || newLogId(),
      ts: new Date().toISOString(),
      type: "prompt",
      brand: brandNode?.id || input.brand || null,
      category: input.category || null,
      product: input.product || null,
      mode: input.mode || null,
      provider: input.provider || null,
      model: input.model || null,
      params: input.params || null,
      prompt: redact(String(input.prompt || "")),
      negativePrompt: input.negativePrompt ? redact(String(input.negativePrompt)) : null,
      refs: (input.refs || []).map((item) => fileRecord(root, item)),
      outputs: (input.outputs || []).map((item) => fileRecord(root, item)),
      jobId: input.jobId || null,
      manifestPath: input.manifestPath || null,
      source: input.source || "mcp",
      notes: input.notes || null,
      costUsd: Number.isFinite(input.costUsd) ? input.costUsd : null,
    };
    const file = logFile(root, slug);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, `${JSON.stringify(entry)}\n`, { mode: 0o600 });
    return entry;
  } catch (error) {
    console.error(`[prompt-log] append failed (generation unaffected): ${error?.message || error}`);
    return null;
  }
}

/** Append a verdict marker so the raw log shows which prompts were judged, without rewriting rows. */
export function appendVerdictMarker(root, graph, { brand, logEntryId, verdict, reason, eventId }) {
  try {
    const brandNode = resolveBrand(graph, brand);
    const file = logFile(root, brandNode ? brandSlug(brandNode) : "unknown");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, `${JSON.stringify({ id: newLogId(), ts: new Date().toISOString(), type: "verdict", ref: logEntryId || null, verdict, reason: reason || null, eventId })}\n`, { mode: 0o600 });
  } catch (error) {
    console.error(`[prompt-log] verdict marker failed: ${error?.message || error}`);
  }
}

function* iterateLogRows(root, slug = undefined) {
  const base = path.join(root, PROMPT_LOG_DIR);
  if (!fs.existsSync(base)) return;
  const slugs = slug ? [slug] : fs.readdirSync(base).filter((entry) => fs.statSync(path.join(base, entry)).isDirectory());
  for (const folder of slugs) {
    const directory = path.join(base, folder);
    if (!fs.existsSync(directory)) continue;
    for (const file of fs.readdirSync(directory).filter((name) => name.endsWith(".jsonl")).sort()) {
      const text = fs.readFileSync(path.join(directory, file), "utf8");
      for (const line of text.split("\n")) {
        if (!line.trim()) continue;
        try { yield JSON.parse(line); } catch { /* skip a torn line */ }
      }
    }
  }
}

/** All prompt rows (type=prompt) with their latest verdict marker folded in. Newest first. */
export function readPromptLog(root, graph, { brand = undefined, limit = 50, query = undefined, verdict = undefined } = {}) {
  const brandNode = brand ? resolveBrand(graph, brand) : undefined;
  const slug = brandNode ? brandSlug(brandNode) : undefined;
  const rows = [];
  const verdicts = new Map();
  for (const row of iterateLogRows(root, slug)) {
    if (row.type === "verdict") verdicts.set(row.ref, { verdict: row.verdict, reason: row.reason, eventId: row.eventId, ts: row.ts });
    else rows.push(row);
  }
  const terms = String(query || "").toLowerCase().split(/\s+/).filter(Boolean);
  const merged = rows
    .map((row) => ({ ...row, verdict: verdicts.get(row.id) || null }))
    .filter((row) => !verdict || row.verdict?.verdict === verdict)
    .filter((row) => !terms.length || terms.every((term) => JSON.stringify(row).toLowerCase().includes(term)))
    .sort((a, b) => b.ts.localeCompare(a.ts));
  return merged.slice(0, limit);
}

/** Find one log entry by id, or the newest entry that produced the given output path / sha256. */
export function findPromptLogEntry(root, graph, { id = undefined, outputPath = undefined, sha256 = undefined, brand = undefined } = {}) {
  const wanted = outputPath ? path.normalize(outputPath).replace(/^\.\//, "") : undefined;
  const rows = readPromptLog(root, graph, { brand, limit: Number.MAX_SAFE_INTEGER });
  for (const row of rows) {
    if (id && row.id === id) return row;
    if (!id && (wanted || sha256)) {
      const hit = (row.outputs || []).some((output) =>
        (wanted && (output.path === wanted || path.basename(output.path || "") === path.basename(wanted))) ||
        (sha256 && output.sha256 === sha256));
      if (hit) return row;
    }
  }
  return null;
}
