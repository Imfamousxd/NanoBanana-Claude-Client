import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildKnowledgeIndex, chunkMarkdown, loadKnowledgeIndex } from "../engine/knowledge/indexer.mjs";
import { queryKnowledge } from "../engine/knowledge/retrieval.mjs";

test("markdown is chunked by heading with source provenance", () => {
  const chunks = chunkMarkdown("Brand Context/Test.md", "# Test Brand\nIntro\n\n## Product rules\nKeep the cap purple.", ["brand"]);
  assert.equal(chunks.length, 2);
  assert.equal(chunks[1].heading, "Test Brand > Product rules");
  assert.equal(chunks[1].source, "Brand Context/Test.md");
  assert.match(chunks[1].text, /cap purple/);
});

test("hybrid retrieval favors brand-matched operational rules", () => {
  const graph = {
    nodes: [{ id: "brand.test", type: "brand", name: "Test Brand", aliases: ["test"], source: "Brand Context/Test.md" }],
  };
  const index = {
    chunks: [
      { id: "a", heading: "Product rules", text: "Test Brand must preserve the purple cap and white label.", tags: ["test"], source: "Brand Context/Test.md" },
      { id: "b", heading: "Other", text: "A blue landscape with no product.", tags: [], source: "Other.md" },
    ],
  };
  const results = queryKnowledge(index, graph, "purple cap product", { brand: "test", limit: 2 });
  assert.equal(results[0].id, "a");
  assert(results[0].score > results[1].score);
});

test("knowledge cache invalidates when a new configured source file appears", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "content-engine-knowledge-"));
  fs.mkdirSync(path.join(root, "knowledge"));
  fs.mkdirSync(path.join(root, "Brand Context"));
  fs.writeFileSync(path.join(root, "knowledge", "graph.json"), JSON.stringify({
    version: 1,
    updatedAt: "2026-07-22",
    sources: [{ directory: "Brand Context", extensions: [".md"] }],
    nodes: [],
    edges: [],
  }));
  fs.writeFileSync(path.join(root, "Brand Context", "One.md"), "# One\nFirst source.");
  const first = buildKnowledgeIndex(root);
  assert.equal(first.sourceStats.length, 1);

  fs.writeFileSync(path.join(root, "Brand Context", "Two.md"), "# Two\nSecond source.");
  const refreshed = loadKnowledgeIndex(root);
  assert.equal(refreshed.sourceStats.length, 2);
  assert(refreshed.chunks.some((chunk) => chunk.source === "Brand Context/Two.md"));
});
