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
      files.push({ filePath, relative, tags: source.tags || [] });
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

function indexFingerprint(graphHash, stats) {
  return sha256Text(JSON.stringify({ graphHash, stats }));
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

export function chunkMarkdown(relativePath, text, tags = []) {
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

export function buildKnowledgeIndex(root, { write = true, includePaths = undefined } = {}) {
  const graph = loadGraph(root);
  const graphHash = graphFingerprint(graph);
  const chunks = [];
  const files = collectSourceFiles(root, graph, includePaths);
  const sourceStats = sourceMetadata(files);

  for (const { filePath, relative, tags } of files) {
    const text = fs.readFileSync(filePath, "utf8");
    chunks.push(...chunkMarkdown(relative, text, tags));
  }

  for (const node of graph.nodes) {
    chunks.push({
      id: node.id,
      type: node.type,
      source: node.source || node.sourceUrl || "knowledge/graph.json",
      heading: node.name,
      text: JSON.stringify({ ...node, aliases: node.aliases || [] }),
      tags: [node.type, ...(node.aliases || [])],
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
