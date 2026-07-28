import { resolveBrand } from "./graph.mjs";

export function tokenize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9+#-]+/)
    .filter((token) => token.length > 1);
}

export function queryKnowledge(index, graph, query, { brand, limit = 8 } = {}) {
  const terms = [...new Set(tokenize(query))];
  const brandNode = brand ? resolveBrand(graph, brand) : undefined;
  const brandTerms = brandNode ? tokenize([brandNode.name, ...(brandNode.aliases || [])].join(" ")) : [];
  const documentFrequency = new Map();

  for (const chunk of index.chunks) {
    const unique = new Set(tokenize(`${chunk.heading} ${chunk.text} ${(chunk.tags || []).join(" ")}`));
    for (const token of unique) documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
  }

  const scored = index.chunks.map((chunk) => {
    const title = tokenize(chunk.heading);
    const body = tokenize(`${chunk.text} ${(chunk.tags || []).join(" ")}`);
    const bodyCounts = new Map();
    for (const token of body) bodyCounts.set(token, (bodyCounts.get(token) || 0) + 1);
    let score = 0;
    for (const term of terms) {
      const idf = Math.log((index.chunks.length + 1) / ((documentFrequency.get(term) || 0) + 1)) + 1;
      if (title.includes(term)) score += 5 * idf;
      const frequency = bodyCounts.get(term) || 0;
      if (frequency) score += (1 + Math.log(frequency)) * idf;
    }
    const haystack = `${chunk.heading} ${chunk.text} ${(chunk.tags || []).join(" ")}`.toLowerCase();
    if (query.length > 3 && haystack.includes(query.toLowerCase())) score += 12;
    if (brandNode) {
      const brandMatches = brandTerms.some((term) => haystack.includes(term));
      if (brandMatches || chunk.id === brandNode.id || chunk.source === brandNode.source) score += 10;
      else score *= 0.45;
    }
    return { ...chunk, score: Math.round(score * 100) / 100 };
  });

  const ranked = scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.source.localeCompare(b.source));
  const sourceCounts = new Map();
  const diversified = [];
  for (const item of ranked) {
    const count = sourceCounts.get(item.source) || 0;
    if (count >= 3) continue;
    diversified.push(item);
    sourceCounts.set(item.source, count + 1);
    if (diversified.length >= limit) break;
  }
  return diversified.map((item) => ({ ...item, text: item.text.slice(0, 1_200) }));
}
