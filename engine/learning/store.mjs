// Learning store — knowledge/learnings/<brand>.json, the tracked, growing memory of what each brand
// approved and rejected. Schema learning-registry/1:
//   laws[]       distilled rules (claim/evidence/counterexamples/applies_to/confidence/source), the same
//                six-field contract as graph-fragments/*_laws.json and the meme registry's laws
//   exemplars[]  approved outputs with the exact prompt, provider, refs and a tracked copy of the image
//   events[]     every verdict, with the prompt snapshot it judged (rejections are the negative memory)
//   stats        approved/rejected counts per provider and category, the routing signal
import fs from "node:fs";
import path from "node:path";
import { readJson, slugify, writeJsonAtomic } from "../core/files.mjs";
import { EngineError } from "../core/errors.mjs";
import { resolveBrand } from "../knowledge/graph.mjs";
import { tokenize } from "../knowledge/retrieval.mjs";
import { brandSlug } from "./prompt-log.mjs";

export const LEARNINGS_DIR = path.join("knowledge", "learnings");
export const CONFIDENCE_LADDER = ["weak", "moderate", "strong", "measured"];

export function learningsPath(root, brandNode) {
  return path.join(root, LEARNINGS_DIR, `${brandSlug(brandNode)}.json`);
}

export function emptyStore(brandNode) {
  return {
    $comment: "learning-registry/1 — the brand's self-improvement memory. laws[] are distilled rules (six-field law contract shared with graph-fragments and the meme registry), exemplars[] are approved outputs with the exact prompt + refs + a tracked copy, events[] hold every verdict with the prompt it judged, stats drive provider routing hints. Written by `feedback_record` (MCP) / `npm run content -- learn` — edit by hand only to correct a fact. See docs/SELF_IMPROVEMENT.md.",
    schema: "learning-registry/1",
    brand: brandNode.id,
    displayName: brandNode.name,
    updatedAt: new Date().toISOString().slice(0, 10),
    stats: { byProvider: {}, byCategory: {}, byProviderCategory: {}, verdicts: { approved: 0, rejected: 0, revise: 0 } },
    laws: [],
    exemplars: [],
    events: [],
  };
}

export function requireBrand(graph, requested) {
  const brandNode = resolveBrand(graph, requested);
  if (!brandNode) {
    const known = graph.nodes.filter((node) => node.type === "brand").map((node) => `${node.id.replace(/^brand\./, "")} (${(node.aliases || []).join(", ")})`);
    throw new EngineError("UNKNOWN_BRAND", `Brand "${requested}" is not registered. Known: ${known.join("; ")}.`);
  }
  return brandNode;
}

export function loadLearnings(root, graph, requested) {
  const brandNode = requireBrand(graph, requested);
  const file = learningsPath(root, brandNode);
  if (!fs.existsSync(file)) return { store: emptyStore(brandNode), path: file, brandNode, isNew: true };
  const store = readJson(file);
  if (store.schema !== "learning-registry/1") throw new EngineError("INVALID_LEARNINGS", `${path.relative(root, file)} is not a learning-registry/1 file.`);
  store.stats ??= { byProvider: {}, byCategory: {}, byProviderCategory: {}, verdicts: { approved: 0, rejected: 0, revise: 0 } };
  store.laws ??= [];
  store.exemplars ??= [];
  store.events ??= [];
  return { store, path: file, brandNode, isNew: false };
}

export function saveLearnings(file, store) {
  store.updatedAt = new Date().toISOString().slice(0, 10);
  writeJsonAtomic(file, store);
  return file;
}

export function listLearningStores(root, graph) {
  return graph.nodes.filter((node) => node.type === "brand").map((brandNode) => {
    const file = learningsPath(root, brandNode);
    const exists = fs.existsSync(file);
    const store = exists ? readJson(file) : emptyStore(brandNode);
    return { brand: brandNode.id, name: brandNode.name, path: path.relative(root, file), exists, laws: store.laws?.length || 0, exemplars: store.exemplars?.length || 0, events: store.events?.length || 0, verdicts: store.stats?.verdicts || {} };
  });
}

/** Token-set Jaccard similarity, used to fold a repeated rejection into the law it already produced. */
export function claimSimilarity(a, b) {
  const left = new Set(tokenize(a));
  const right = new Set(tokenize(b));
  if (!left.size || !right.size) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / (left.size + right.size - shared);
}

export function bumpConfidence(current, floor = "weak") {
  const index = Math.max(CONFIDENCE_LADDER.indexOf(current), CONFIDENCE_LADDER.indexOf(floor), 0);
  if (current === "measured") return current;
  return CONFIDENCE_LADDER[Math.min(index + 1, CONFIDENCE_LADDER.indexOf("strong"))];
}

function bump(map, key, verdict) {
  const entry = map[key] || { approved: 0, rejected: 0, revise: 0 };
  entry[verdict] = (entry[verdict] || 0) + 1;
  map[key] = entry;
}

export function recordStats(store, { verdict, provider, model, category }) {
  const stats = store.stats;
  stats.verdicts[verdict] = (stats.verdicts[verdict] || 0) + 1;
  const providerKey = provider ? `${provider}${model ? `/${model}` : ""}` : "unknown";
  bump(stats.byProvider, providerKey, verdict);
  if (category) {
    bump(stats.byCategory, category, verdict);
    bump(stats.byProviderCategory, `${providerKey} :: ${category}`, verdict);
  }
}

/**
 * Upsert a law. `match` is an explicit id; otherwise a near-duplicate claim (Jaccard >= 0.5) is folded
 * in: evidence appended, occurrences incremented, confidence bumped one rung. Returns { law, created }.
 */
export function upsertLaw(store, brandNode, input) {
  const now = new Date().toISOString();
  let law = input.id ? store.laws.find((item) => item.id === input.id) : undefined;
  if (!law && input.claim) {
    let best = { score: 0, law: undefined };
    for (const candidate of store.laws) {
      const score = claimSimilarity(candidate.claim, input.claim);
      if (score > best.score) best = { score, law: candidate };
    }
    if (best.score >= 0.5) law = best.law;
  }
  if (law) {
    law.occurrences = (law.occurrences || 1) + 1;
    if (input.evidence && !law.evidence.includes(input.evidence)) law.evidence = `${law.evidence}\n${now.slice(0, 10)}: ${input.evidence}`;
    if (input.counterexamples && input.counterexamples !== "none recorded") {
      law.counterexamples = law.counterexamples && law.counterexamples !== "none recorded" ? `${law.counterexamples}\n${input.counterexamples}` : input.counterexamples;
    }
    law.confidence = input.confidence || bumpConfidence(law.confidence);
    if (input.tags?.length) law.tags = [...new Set([...(law.tags || []), ...input.tags])];
    if (input.eventId) law.events = [...new Set([...(law.events || []), input.eventId])];
    law.updatedAt = now;
    return { law, created: false };
  }
  if (!input.claim) throw new EngineError("LAW_CLAIM_REQUIRED", "A new law needs a claim.");
  const id = input.id || `learn:${brandSlug(brandNode)}:${slugify(input.claim).slice(0, 48)}`;
  if (store.laws.some((item) => item.id === id)) throw new EngineError("LAW_ID_TAKEN", `Law id ${id} already exists; pass it as id to update it.`);
  law = {
    id,
    claim: input.claim,
    evidence: input.evidence || "operator verdict, no further evidence given",
    counterexamples: input.counterexamples || "none recorded",
    applies_to: input.appliesTo || input.applies_to || input.category || "all",
    confidence: input.confidence || "weak",
    source: input.source || "feedback_record",
    category: input.category || null,
    tags: input.tags || [],
    occurrences: 1,
    events: input.eventId ? [input.eventId] : [],
    createdAt: now,
    updatedAt: now,
  };
  store.laws.push(law);
  return { law, created: true };
}

export function newEventId() {
  return `ev_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}
