import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildKnowledgeIndex, chunkMarkdown, listCategories, loadKnowledgeIndex } from "../engine/knowledge/indexer.mjs";
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

test("a category is a hard scope for retrieval", () => {
  const graph = { nodes: [] };
  const index = {
    chunks: [
      { id: "meme", heading: "Drake meme", text: "Put the device in the character's hand under a lowercase caption.", tags: ["meme"], source: "knowledge/memes/muha-meds.json", categories: ["memes"] },
      { id: "pack", heading: "Device packshot", text: "Put the device on a white sweep, canonical reference, no caption.", tags: ["product"], source: "knowledge/products/muha-meds.json", categories: ["product-assets"] },
      { id: "both", heading: "Dual Flavor device", text: "The device body used in memes and packshots.", tags: [], source: "knowledge/graph.json", categories: ["product-assets", "memes"] },
    ],
  };
  const memes = queryKnowledge(index, graph, "device caption", { category: "memes", limit: 5 });
  assert.deepEqual(memes.map((item) => item.id).sort(), ["both", "meme"]);
  const products = queryKnowledge(index, graph, "device", { category: "product-assets", limit: 5 });
  assert(products.every((item) => item.categories.includes("product-assets")));
  assert(!products.some((item) => item.id === "meme"));
  const all = queryKnowledge(index, graph, "device", { limit: 5 });
  assert.equal(all.length, 3);
  const several = queryKnowledge(index, graph, "device", { category: "memes,product-assets", limit: 5 });
  assert.equal(several.length, 3);
});

test("source and node categories flow into the index and are listable", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "content-engine-categories-"));
  fs.mkdirSync(path.join(root, "knowledge"));
  fs.mkdirSync(path.join(root, "memes"));
  fs.writeFileSync(path.join(root, "knowledge", "graph.json"), JSON.stringify({
    version: 1,
    updatedAt: "2026-09-14",
    sources: [{ directory: "memes", extensions: [".md"], category: "memes" }],
    nodes: [
      { id: "category.memes", type: "context-category", category: "memes", name: "Memes", description: "Meme context.", entry: "memes/README.md" },
      { id: "product.x", type: "product", name: "X", categories: ["product-assets", "memes"] },
      { id: "provider.y", type: "provider", name: "Y" },
    ],
    edges: [],
  }));
  fs.writeFileSync(path.join(root, "memes", "README.md"), "# Memes\nHow to make them.");
  const index = buildKnowledgeIndex(root, { write: false });
  const readme = index.chunks.find((chunk) => chunk.source === "memes/README.md");
  assert.deepEqual(readme.categories, ["memes"]);
  assert.deepEqual(index.chunks.find((chunk) => chunk.id === "product.x").categories, ["product-assets", "memes"]);
  assert.deepEqual(index.chunks.find((chunk) => chunk.id === "provider.y").categories, []);
  const listed = listCategories(index, JSON.parse(fs.readFileSync(path.join(root, "knowledge", "graph.json"), "utf8")));
  const memes = listed.find((item) => item.category === "memes");
  assert.equal(memes.chunks, 3);
  assert.equal(memes.description, "Meme context.");
  assert.equal(memes.entry, "memes/README.md");
  assert(listed.some((item) => item.category === "product-assets"));
});
