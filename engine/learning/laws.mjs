// Law search across every bank the repository keeps: the per-brand learning stores, the Muha meme
// registry's laws[], and the graph-fragments/*_laws.json video banks. One result contract so an agent
// can ask "what do we already know about X" before generating and before adding a duplicate law.
import fs from "node:fs";
import path from "node:path";
import { readJson } from "../core/files.mjs";
import { resolveBrand, relatedNodes } from "../knowledge/graph.mjs";
import { tokenize } from "../knowledge/retrieval.mjs";
import { LEARNINGS_DIR } from "./store.mjs";

function normalize(law, extra) {
  return {
    id: law.id,
    claim: law.claim,
    evidence: law.evidence,
    counterexamples: law.counterexamples,
    applies_to: law.applies_to || law.appliesTo || "all",
    confidence: law.confidence,
    source: law.source,
    category: law.category || extra.category || null,
    tags: law.tags || [],
    occurrences: law.occurrences || null,
    ...extra,
  };
}

export function collectLaws(root, graph, { brand = undefined } = {}) {
  const brandNode = brand ? resolveBrand(graph, brand) : undefined;
  const laws = [];
  const learningsDir = path.join(root, LEARNINGS_DIR);
  if (fs.existsSync(learningsDir)) {
    for (const file of fs.readdirSync(learningsDir).filter((name) => name.endsWith(".json"))) {
      const store = readJson(path.join(learningsDir, file));
      if (brandNode && store.brand !== brandNode.id) continue;
      for (const law of store.laws || []) laws.push(normalize(law, { bank: `learnings/${file.replace(/\.json$/, "")}`, brand: store.brand }));
    }
  }
  for (const brandItem of graph.nodes.filter((node) => node.type === "brand")) {
    if (brandNode && brandItem.id !== brandNode.id) continue;
    for (const registry of relatedNodes(graph, brandItem.id, "has-memes")) {
      const file = path.resolve(root, registry.path || registry.source);
      if (!fs.existsSync(file)) continue;
      for (const law of readJson(file).laws || []) laws.push(normalize(law, { bank: "memes", brand: brandItem.id, category: "memes" }));
    }
  }
  if (!brandNode) {
    const fragments = path.join(root, "graph-fragments");
    if (fs.existsSync(fragments)) {
      for (const file of fs.readdirSync(fragments).filter((name) => name.endsWith("_laws.json"))) {
        const bank = readJson(path.join(fragments, file));
        for (const [key, value] of Object.entries(bank)) {
          if (!key.endsWith("_laws") || !value || typeof value !== "object") continue;
          for (const [id, law] of Object.entries(value)) laws.push(normalize({ id, ...law }, { bank: key, brand: null, category: "video" }));
        }
      }
    }
  }
  return laws;
}

export function searchLaws(root, graph, query, { brand = undefined, category = undefined, limit = 12, includeGlobal = true } = {}) {
  const terms = [...new Set(tokenize(query))];
  const laws = collectLaws(root, graph, { brand: includeGlobal ? undefined : brand });
  const brandNode = brand ? resolveBrand(graph, brand) : undefined;
  const scored = laws.map((law) => {
    if (category && law.category && law.category !== category && law.applies_to !== category) return { law, score: 0 };
    const haystack = tokenize(`${law.id} ${law.claim} ${law.evidence} ${law.applies_to} ${(law.tags || []).join(" ")} ${law.category || ""}`);
    const set = new Set(haystack);
    let score = 0;
    for (const term of terms) if (set.has(term)) score += 1;
    if (!terms.length) score = 1;
    if (brandNode) {
      if (law.brand === brandNode.id) score *= 1.5;
      else if (law.brand) score *= 0.2;
      else score *= 0.6;
    }
    score += ["measured", "strong"].includes(law.confidence) ? 0.3 : law.confidence === "moderate" ? 0.15 : 0;
    return { law, score };
  });
  return scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score).slice(0, limit)
    .map(({ law, score }) => ({ ...law, evidence: String(law.evidence || "").slice(0, 600), score: Math.round(score * 100) / 100 }));
}
