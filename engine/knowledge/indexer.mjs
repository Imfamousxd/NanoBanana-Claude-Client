import fs from "node:fs";
import path from "node:path";
import { sha256Text, writeJsonAtomic } from "../core/files.mjs";
import { loadGraph } from "./graph.mjs";

function sourceFiles(root, source) {
  if (source.path) {
    const absolute = path.resolve(root, source.path);
    if (!fs.existsSync(absolute)) return source.optional ? [] : [absolute];
    return [absolute];
  }
  const directory = path.resolve(root, source.directory);
  if (!fs.existsSync(directory)) return [];
  const extensions = new Set(source.extensions || [".md"]);
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && extensions.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => path.join(directory, entry.name))
    .sort();
}

/** Context categories an entity belongs to: `categories: [...]`, or the single `category`, else none. */
export function categoriesOf(entity) {
  if (!entity) return [];
  const list = Array.isArray(entity.categories) ? entity.categories : entity.category ? [entity.category] : [];
  return [...new Set(list.map((value) => String(value).trim().toLowerCase()).filter(Boolean))];
}

function graphFingerprint(graph) {
  return sha256Text(JSON.stringify({
    version: graph.version,
    updatedAt: graph.updatedAt,
    sources: graph.sources,
    nodes: graph.nodes,
    edges: graph.edges,
  }));
}

function collectSourceFiles(root, graph, includePaths) {
  const files = [];
  for (const source of graph.sources) {
    for (const filePath of sourceFiles(root, source)) {
      if (!fs.existsSync(filePath)) continue;
      const relative = path.relative(root, filePath);
      if (includePaths && !includePaths.has(relative)) continue;
      files.push({ filePath, relative, tags: source.tags || [], categories: categoriesOf(source) });
    }
  }
  return files.sort((a, b) => a.relative.localeCompare(b.relative));
}

function sourceMetadata(files) {
  return files.map(({ filePath, relative }) => {
    const stat = fs.statSync(filePath);
    return { path: relative, size: stat.size, mtimeMs: Math.round(stat.mtimeMs) };
  });
}

// Bump when chunking changes so a cached index built by an older indexer is rebuilt.
const INDEXER_VERSION = 2;

function indexFingerprint(graphHash, stats) {
  return sha256Text(JSON.stringify({ indexerVersion: INDEXER_VERSION, graphHash, stats }));
}

function splitLongSection(text, maxCharacters = 3_200) {
  if (text.length <= maxCharacters) return [text];
  const paragraphs = text.split(/\n\s*\n/);
  const chunks = [];
  let current = "";
  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length + 2 > maxCharacters) {
      chunks.push(current.trim());
      current = "";
    }
    current += `${current ? "\n\n" : ""}${paragraph}`;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export function chunkMarkdown(relativePath, text, tags = [], categories = []) {
  const lines = text.split(/\r?\n/);
  const headingStack = [];
  const sections = [];
  let current = { heading: "Document", body: [] };

  const flush = () => {
    const body = current.body.join("\n").trim();
    if (!body) return;
    const heading = current.heading || "Document";
    for (const [part, content] of splitLongSection(body).entries()) {
      sections.push({
        id: `chunk.${sha256Text(`${relativePath}:${heading}:${part}:${content}`).slice(0, 18)}`,
        type: "knowledge-chunk",
        source: relativePath,
        heading: part ? `${heading} (part ${part + 1})` : heading,
        text: content,
        tags,
        categories,
      });
    }
  };

  for (const line of lines) {
    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      flush();
      const level = match[1].length;
      headingStack.length = level - 1;
      headingStack[level - 1] = match[2].trim();
      current = { heading: headingStack.filter(Boolean).join(" > "), body: [] };
    } else {
      current.body.push(line);
    }
  }
  flush();
  return sections;
}

function recordLabel(record, index) {
  if (typeof record !== "object" || record === null) return String(index);
  return record.name || record.id || record.sku || record.title || (record.claim ? String(record.claim).slice(0, 80) : undefined) || String(index);
}

/**
 * JSON registries (products, memes, learnings, law banks) are chunked per record so retrieval returns
 * the product, law, exemplar or template that matched — not the first 1,200 characters of the file.
 * Scalars and small string arrays at the top level become one "Document" chunk. Unparseable JSON
 * falls back to the Markdown chunker.
 */
export function chunkJson(relativePath, text, tags = [], categories = []) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return chunkMarkdown(relativePath, text, tags, categories);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return chunkMarkdown(relativePath, text, tags, categories);
  const chunks = [];
  const remainder = {};
  const label = data.displayName || data.name || path.basename(relativePath, ".json");
  const emit = (heading, record) => {
    const content = typeof record === "string" ? record : JSON.stringify(record);
    chunks.push({
      id: `chunk.${sha256Text(`${relativePath}:${heading}:${content}`).slice(0, 18)}`,
      type: "knowledge-chunk",
      source: relativePath,
      heading,
      text: content,
      tags,
      categories,
    });
  };
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith("$")) continue;
    if (Array.isArray(value) && value.length && value.every((item) => item && typeof item === "object")) {
      value.forEach((record, index) => emit(`${label} > ${key} > ${recordLabel(record, index)}`, record));
    } else if (value && typeof value === "object" && !Array.isArray(value) && key.endsWith("_laws")) {
      for (const [id, record] of Object.entries(value)) emit(`${label} > ${key} > ${id}`, { id, ...record });
    } else if (value && typeof value === "object" && !Array.isArray(value) && JSON.stringify(value).length > 3_200) {
      for (const [sub, record] of Object.entries(value)) {
        if (sub.startsWith("$")) continue;
        emit(`${label} > ${key} > ${sub}`, record);
      }
    } else {
      remainder[key] = value;
    }
  }
  if (Object.keys(remainder).length) {
    for (const [part, content] of splitLongSection(JSON.stringify(remainder, null, 1)).entries()) {
      emit(part ? `${label} (part ${part + 1})` : label, content);
    }
  }
  return chunks;
}

export function buildKnowledgeIndex(root, { write = true, includePaths = undefined } = {}) {
  const graph = loadGraph(root);
  const graphHash = graphFingerprint(graph);
  const chunks = [];
  const files = collectSourceFiles(root, graph, includePaths);
  const sourceStats = sourceMetadata(files);

  for (const { filePath, relative, tags, categories } of files) {
    const text = fs.readFileSync(filePath, "utf8");
    const chunker = path.extname(filePath).toLowerCase() === ".json" ? chunkJson : chunkMarkdown;
    chunks.push(...chunker(relative, text, tags, categories));
  }

  for (const node of graph.nodes) {
    chunks.push({
      id: node.id,
      type: node.type,
      source: node.source || node.sourceUrl || "knowledge/graph.json",
      heading: node.name,
      text: JSON.stringify({ ...node, aliases: node.aliases || [] }),
      tags: [node.type, ...(node.aliases || [])],
      categories: categoriesOf(node),
    });
  }

  const index = {
    schemaVersion: 1,
    builtAt: new Date().toISOString(),
    graphUpdatedAt: graph.updatedAt,
    graphFingerprint: graphHash,
    fingerprint: indexFingerprint(graphHash, sourceStats),
    sourceStats,
    chunks,
  };
  if (write) writeJsonAtomic(path.join(root, ".content-engine", "knowledge-index.json"), index);
  return index;
}

export function loadKnowledgeIndex(root, { force = false, scopedPaths = undefined } = {}) {
  const cachePath = path.join(root, ".content-engine", "knowledge-index.json");
  if (!force && fs.existsSync(cachePath)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cachePath, "utf8"));
      const graph = loadGraph(root);
      const graphHash = graphFingerprint(graph);
      const currentStats = sourceMetadata(collectSourceFiles(root, graph));
      if (cached.graphFingerprint === graphHash && indexFingerprint(graphHash, currentStats) === cached.fingerprint) return cached;
    } catch {
      // Rebuild a corrupt or stale cache.
    }
  }
  if (scopedPaths) return buildKnowledgeIndex(root, { write: false, includePaths: new Set(scopedPaths) });
  return buildKnowledgeIndex(root, { write: true });
}

/** Every context category in the index with its chunk/source counts, described by the graph's `context-category` nodes. */
export function listCategories(index, graph = undefined) {
  const described = new Map();
  for (const node of graph?.nodes || []) {
    if (node.type === "context-category") described.set(String(node.category || node.id.replace(/^category\./, "")).toLowerCase(), node);
  }
  const counts = new Map();
  for (const chunk of index.chunks) {
    for (const category of chunk.categories || []) {
      const entry = counts.get(category) || { category, chunks: 0, sources: new Set() };
      entry.chunks += 1;
      entry.sources.add(chunk.source);
      counts.set(category, entry);
    }
  }
  return [...counts.values()]
    .map((entry) => {
      const node = described.get(entry.category);
      return {
        category: entry.category,
        chunks: entry.chunks,
        sources: entry.sources.size,
        name: node?.name,
        description: node?.description,
        entry: node?.entry,
        aliases: node?.aliases || [],
      };
    })
    .sort((a, b) => a.category.localeCompare(b.category));
}
