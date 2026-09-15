// Search — the part the old DAM got wrong. Three retrievers fused, not one caption embedding:
//   1. structured filters read off the query (brand, product, class, orientation, people, duration)
//   2. lexical over a weighted tsvector (title/product > OCR/tags > summary > full document > path)
//   3. vector over the document embedding AND the visual embedding (text query → picture)
// fused with reciprocal rank fusion, then optionally reranked by a small model that reads the
// retrieval documents. Every hit explains why it matched.
import { resolveBrand } from "../knowledge/graph.mjs";
import { tokenize } from "../knowledge/retrieval.mjs";
import { CLASS_IDS, SUBCLASS_IDS, VIDEO_FORMS } from "./taxonomy.mjs";
import { embed, toPgVector } from "./providers/embed.mjs";
import { analyzeText } from "./providers/vision.mjs";

const CLASS_WORDS = {
  "ugc-video": ["ugc", "creator", "talking head", "testimonial", "unboxing", "review", "influencer video", "tiktok", "reel"],
  "ugc-still": ["selfie", "creator photo", "holding the product", "hand holding"],
  "product-ref": ["packshot", "product shot", "render", "cutout", "label", "canonical", "product ref", "product reference", "dieline"],
  "logo": ["logo", "wordmark", "lockup", "brand mark", "seal"],
  "marketing-still": ["ad", "ads", "banner", "flyer", "poster", "post", "carousel", "creative", "graphic", "hero image", "web hero", "email"],
  "marketing-video": ["promo", "commercial", "montage", "motion graphics", "product video", "launch video", "campaign video", "edit"],
  "lifestyle-photo": ["lifestyle", "event", "gym", "outdoor", "kitchen", "team photo"],
  "raw-footage": ["b-roll", "broll", "raw footage", "footage", "behind the scenes", "bts", "screen recording"],
  "packaging-collateral": ["packaging", "print", "insert card", "box art", "mockup"],
  "meme": ["meme"],
  "screenshot": ["screenshot"],
  "document": ["deck", "pdf", "document", "coa", "guidelines"],
};

/** Deterministic query understanding: brand, product, class, orientation, people, duration. Never calls a model. */
export function parseQuery(query, graph, products = []) {
  const lower = ` ${String(query).toLowerCase()} `;
  const filters = {};
  const matchedTerms = [];
  for (const brand of graph.nodes.filter((node) => node.type === "brand")) {
    for (const alias of [brand.name, ...(brand.aliases || [])]) {
      const needle = ` ${alias.toLowerCase()} `;
      if (lower.includes(needle) && (!filters.brand || alias.length > (filters.brandAlias || "").length)) { filters.brand = brand.id; filters.brandAlias = alias; }
    }
  }
  for (const product of products) {
    if (filters.brand && product.brand && product.brand !== filters.brand) continue;
    for (const alias of [product.id, product.name, ...(product.aliases || [])].filter(Boolean)) {
      if (alias.length < 3) continue;
      if (lower.includes(` ${alias.toLowerCase()} `) || lower.includes(`${alias.toLowerCase()} `)) { filters.product = product.id; filters.productAlias = alias; if (!filters.brand && product.brand) filters.brand = product.brand; break; }
    }
    if (filters.product) break;
  }
  let bestClass = null;
  for (const [classId, words] of Object.entries(CLASS_WORDS)) {
    for (const word of words) {
      if (lower.includes(` ${word} `) || lower.includes(` ${word}s `)) {
        matchedTerms.push(`${classId}:${word}`);
        if (!bestClass || word.length > bestClass.word.length) bestClass = { classId, word };
      }
    }
  }
  if (bestClass) filters.class = bestClass.classId;
  for (const form of VIDEO_FORMS) if (lower.includes(` ${form.replace(/-/g, " ")} `) || lower.includes(` ${form} `)) filters.form = form;
  for (const sub of SUBCLASS_IDS) { const words = sub.replace(/-/g, " "); if (words !== "other" && (lower.includes(` ${words} `) || lower.includes(` ${words}s `))) filters.form = filters.form || sub; }
  if (/\b(render|renders|rendered|3d)\b/.test(lower) && !filters.form) filters.generated = true;
  if (/\b(photo|photos|photograph|photoshoot|shot on|real photo)\b/.test(lower) && !filters.class && !filters.form) filters.photograph = true;
  if (/\b(vertical|9:16|portrait|story|stories|reel|tiktok)\b/.test(lower)) filters.orientation = "9:16";
  else if (/\b(square|1:1)\b/.test(lower)) filters.orientation = "1:1";
  else if (/\b(landscape|16:9|widescreen|youtube)\b/.test(lower)) filters.orientation = "16:9";
  else if (/\b4:5\b/.test(lower)) filters.orientation = "4:5";
  if (/\b(video|videos|clip|clips|footage|reel|reels)\b/.test(lower) && !filters.class) filters.kind = "video";
  if (/\b(image|images|photo|photos|still|stills|picture|graphic|graphics)\b/.test(lower) && !filters.class) filters.kind = "image";
  if (/\b(with (a )?person|with people|someone|creator|talking|face)\b/.test(lower)) filters.people = true;
  if (/\b(no people|without people|product only|no person)\b/.test(lower)) filters.people = false;
  if (/\btransparent\b/.test(lower)) filters.alpha = true;
  const duration = lower.match(/\b(under|less than|max|<)\s*(\d+)\s*(s|sec|seconds)\b/);
  if (duration) filters.maxDuration = Number(duration[2]);
  const longer = lower.match(/\b(over|more than|longer than|>)\s*(\d+)\s*(s|sec|seconds)\b/);
  if (longer) filters.minDuration = Number(longer[2]);
  if (/\b(real|human|actual person|genuine|not ai|not generated)\b/.test(lower)) filters.realHuman = true;
  // the text left over for lexical/vector once filter words are removed
  const strip = [filters.brandAlias, filters.productAlias].filter(Boolean).map((alias) => alias.toLowerCase());
  let residual = lower;
  for (const alias of strip) residual = residual.replace(` ${alias} `, " ");
  return { filters, residual: residual.trim(), matchedTerms };
}

function whereClause(filters, params, { includeDeleted = false } = {}) {
  const clauses = ["status in ('analyzed','embedded')"];
  if (!includeDeleted) clauses.push("deleted_at is null");
  clauses.push("duplicate_of is null");
  const add = (sql, value) => { params.push(value); clauses.push(sql.replace("?", `$${params.length}`)); };
  if (filters.brand) add("brand = ?", filters.brand);
  if (filters.product) add("(product ilike ? or analysis->>'product' ilike ?)".replace("?", `$${params.length + 1}`).replace("?", `$${params.length + 1}`), `%${filters.product}%`);
  if (filters.class) add("class = ?", filters.class);
  if (filters.form) add("subclass = ?", filters.form);
  if (filters.kind) add("kind = ?", filters.kind);
  if (filters.orientation) add("orientation = ?", filters.orientation);
  if (filters.people === true) clauses.push("coalesce(people_count,0) > 0");
  if (filters.people === false) clauses.push("coalesce(people_count,0) = 0");
  if (filters.alpha) clauses.push("has_alpha = true");
  if (filters.realHuman) clauses.push("is_real_human = true");
  if (filters.generated) clauses.push("coalesce((analysis->'style'->>'is_generated')::boolean, false) = true");
  if (filters.photograph) clauses.push("coalesce((analysis->'style'->>'is_photograph')::boolean, false) = true");
  if (filters.maxDuration) add("duration_s <= ?", filters.maxDuration);
  if (filters.minDuration) add("duration_s >= ?", filters.minDuration);
  if (filters.roles?.length) add("reference_roles && ?", filters.roles);
  if (filters.minQuality) add("quality >= ?", filters.minQuality);
  if (filters.excludeFlagged !== false) clauses.push("coalesce((flags->>'outdated_or_wrong')::boolean, false) = false and coalesce((flags->>'do_not_use')::boolean, false) = false");
  return clauses.join(" and ");
}

const SELECT = "id, source_id, path, name, kind, brand, class, subclass, product, title, summary, tags, reference_roles, quality, orientation, width, height, duration_s, people_count, is_real_human, proxies, flags, analyzed_at";

export async function searchAssets(db, graph, query, { filters: extra = {}, limit = 20, rerank = false, config = null, products = [] } = {}) {
  const parsed = parseQuery(query, graph, products);
  if (!parsed.filters.product) {
    // product names the model has identified: longest one contained in the query wins
    const { rows } = await db.query("select distinct product from dam.assets where product is not null and length(product) >= 4 and status in ('analyzed','embedded')");
    const lower = ` ${query.toLowerCase()} `;
    let best = null;
    for (const row of rows) { const name = row.product.toLowerCase(); if (lower.includes(` ${name} `) && (!best || name.length > best.length)) best = name; }
    if (best) { parsed.filters.product = best; parsed.filters.productAlias = best; parsed.residual = parsed.residual.replace(best, " ").trim(); }
  }
  const explicit = Object.fromEntries(Object.entries(extra).filter(([, value]) => value !== undefined && value !== null && value !== ""));
  const filters = { ...parsed.filters, ...explicit };
  if (extra.brand) filters.brand = resolveBrand(graph, extra.brand)?.id || extra.brand;
  const text = parsed.residual || query;
  const candidates = new Map();
  const add = (row, source, rank, extraWhy = {}) => {
    const entry = candidates.get(row.id) || { row, score: 0, why: {} };
    entry.score += 1 / (60 + rank);
    entry.why[source] = { rank: rank + 1, ...extraWhy };
    candidates.set(row.id, entry);
  };

  // 1. lexical
  {
    const params = [];
    const where = whereClause(filters, params);
    params.push(text);
    const { rows } = await db.query(`select ${SELECT}, ts_rank_cd(tsv, websearch_to_tsquery('english', $${params.length})) as rank
      from dam.assets where ${where} and tsv @@ websearch_to_tsquery('english', $${params.length}) order by rank desc limit 60`, params);
    rows.forEach((row, index) => add(row, "lexical", index, { rank_cd: Number(row.rank).toFixed(3) }));
  }
  // 2. vector (document + visual)
  let queryVector = null;
  if (config && (config.approved || config.searchEmbeddingsAllowed)) {
    try {
      queryVector = await embed({ provider: config.embed.provider, model: config.embed.model, dimensions: config.embed.dimensions, text, taskType: "RETRIEVAL_QUERY" });
      for (const column of ["embedding_text", "embedding_visual"]) {
        const params = [];
        const where = whereClause(filters, params);
        params.push(toPgVector(queryVector.vector));
        const { rows } = await db.query(`select ${SELECT}, 1 - (${column} <=> $${params.length}::vector) as similarity from dam.assets where ${where} and ${column} is not null order by ${column} <=> $${params.length}::vector limit 60`, params);
        rows.forEach((row, index) => add(row, column === "embedding_text" ? "semantic" : "visual", index, { similarity: Number(row.similarity).toFixed(3) }));
      }
    } catch (error) {
      console.error(`[dam] vector search unavailable: ${error.message}`);
    }
  }
  // 3. relax parsed (not caller-supplied) filters when they starve the result: "packaging" must not hide a packshot
  const parsedKeys = Object.keys(parsed.filters).filter((key) => !(key in explicit) && !/Alias$/.test(key) && key !== "brand");
  if (parsedKeys.length) {
    const relaxed = { ...(filters.brand ? { brand: filters.brand } : {}), ...(explicit.class ? { class: filters.class } : {}), kind: filters.kind };
    const params = [];
    const where = whereClause(relaxed, params);
    params.push(text);
    const { rows } = await db.query(`select ${SELECT}, ts_rank_cd(tsv, websearch_to_tsquery('english', $${params.length})) as rank from dam.assets where ${where} and tsv @@ websearch_to_tsquery('english', $${params.length}) order by rank desc limit 40`, params);
    rows.forEach((row, index) => add(row, "lexical-relaxed", index + 5, { relaxed: parsedKeys.join(",") }));
    if (queryVector) {
      for (const column of ["embedding_text", "embedding_visual"]) {
        const p2 = [];
        const w2 = whereClause(relaxed, p2);
        p2.push(toPgVector(queryVector.vector));
        const { rows: vrows } = await db.query(`select ${SELECT}, 1 - (${column} <=> $${p2.length}::vector) as similarity from dam.assets where ${w2} and ${column} is not null order by ${column} <=> $${p2.length}::vector limit 40`, p2);
        vrows.forEach((row, index) => add(row, column === "embedding_text" ? "semantic-relaxed" : "visual-relaxed", index + 5, { similarity: Number(row.similarity).toFixed(3), relaxed: parsedKeys.join(",") }));
      }
    }
  }
  // 4. filters-only fallback when nothing textual matched (e.g. "all muha ugc videos")
  if (!candidates.size) {
    const params = [];
    const where = whereClause(filters, params);
    const { rows } = await db.query(`select ${SELECT} from dam.assets where ${where} order by quality desc nulls last, analyzed_at desc limit ${Math.min(limit * 3, 100)}`, params);
    rows.forEach((row, index) => add(row, "filter", index));
  }

  // Precision over recall: a result is either a real match or it is not shown.
  //  - if any direct (non-relaxed, non-fallback) hit exists, drop candidates that only came from a relaxed or filter-only pass
  //  - a vector-only hit must clear a similarity floor; a lexical hit must carry a real rank
  //  - everything below 40% of the top score is noise
  const all = [...candidates.values()].sort((a, b) => b.score - a.score);
  const direct = (entry) => Object.keys(entry.why).some((source) => !/relaxed|filter/.test(source));
  const hasDirect = all.some(direct);
  const strong = all.filter((entry) => {
    if (hasDirect && !direct(entry)) return false;
    const sims = ["semantic", "visual", "semantic-relaxed", "visual-relaxed"].map((key) => Number(entry.why[key]?.similarity || 0));
    const lexical = entry.why.lexical || entry.why["lexical-relaxed"];
    if (!lexical && Math.max(...sims) < 0.45) return false;
    return entry.score >= all[0].score * 0.25;
  });
  let ranked = (strong.length ? strong : all.slice(0, Math.min(3, all.length))).slice(0, rerank ? Math.min(30, limit * 3) : limit);
  if (rerank && config && ranked.length > 1) {
    try {
      const prompt = ["You rank a marketing asset library's search results. Query:", JSON.stringify(query), "", "Return JSON {\"order\": [ids best-first], \"notes\": {id: one short reason}} considering ONLY the documents below. Prefer exact product/brand matches, the asked format, and higher quality.", "", ...ranked.map((entry) => `ID ${entry.row.id}\n${(entry.row.summary || "").slice(0, 600)}\nclass=${entry.row.class} brand=${entry.row.brand} product=${entry.row.product} roles=${entry.row.reference_roles.join(",")} quality=${entry.row.quality}`)].join("\n");
      const result = await analyzeText({ provider: config.rerank.provider, model: config.rerank.model, prompt, schema: { type: "object", required: ["order"], properties: { order: { type: "array", items: { type: "string" } }, notes: { type: "object", additionalProperties: { type: "string" } } } } });
      const position = new Map((result.record.order || []).map((id, index) => [id, index]));
      ranked.sort((a, b) => (position.get(a.row.id) ?? 999) - (position.get(b.row.id) ?? 999));
      for (const entry of ranked) if (result.record.notes?.[entry.row.id]) entry.why.rerank = result.record.notes[entry.row.id];
      ranked = ranked.slice(0, limit);
    } catch (error) {
      console.error(`[dam] rerank unavailable: ${error.message}`);
      ranked = ranked.slice(0, limit);
    }
  }
  return {
    query, parsed: { filters, residual: parsed.residual }, count: ranked.length, usedVectors: Boolean(queryVector),
    results: ranked.map(({ row, score, why }) => ({ ...row, score: Math.round(score * 10_000) / 10_000, why })),
  };
}

/** Nearest neighbours of an asset by visual embedding (siblings of a packshot, takes of a shot…). */
export async function similarAssets(db, assetId, { limit = 12, column = "embedding_visual" } = {}) {
  const { rows } = await db.query(`select ${SELECT}, 1 - (a.${column} <=> b.${column}) as similarity from dam.assets a, dam.assets b
    where b.id = $1 and a.id <> b.id and a.${column} is not null and b.${column} is not null and a.deleted_at is null
    order by a.${column} <=> b.${column} limit $2`, [assetId, limit]);
  return rows.map((row) => ({ ...row, similarity: Number(row.similarity).toFixed(3) }));
}

export function productIndexFromCards(cards) {
  return cards.flatMap((card) => (card.products || []).map((product) => ({ ...product, brand: card.id })));
}

export const KNOWN_CLASSES = CLASS_IDS;
export { tokenize };
