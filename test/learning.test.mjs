import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { loadGraph } from "../engine/knowledge/graph.mjs";
import { appendPromptLog, findPromptLogEntry, readPromptLog } from "../engine/learning/prompt-log.mjs";
import { claimSimilarity, loadLearnings, upsertLaw, saveLearnings, bumpConfidence } from "../engine/learning/store.mjs";
import { recordFeedback } from "../engine/learning/feedback.mjs";
import { buildContextPack } from "../engine/learning/context.mjs";
import { searchLaws } from "../engine/learning/laws.mjs";
import { buildAssetCatalog, listProducts, searchAssets } from "../engine/assets/catalog.mjs";
import { chunkJson } from "../engine/knowledge/indexer.mjs";

// A 1x1 PNG so sharp and the header inspector both have a real image to work with.
const PNG_1x1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");

function fixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "content-engine-learning-"));
  fs.mkdirSync(path.join(root, "knowledge", "products"), { recursive: true });
  fs.mkdirSync(path.join(root, "knowledge", "learnings"), { recursive: true });
  fs.mkdirSync(path.join(root, "Brand Context", "assets", "Test_Brand", "creative"), { recursive: true });
  fs.mkdirSync(path.join(root, "generations"), { recursive: true });
  fs.writeFileSync(path.join(root, "Brand Context", "Test_Brand.md"), "# Test Brand\nKeep the cap purple.");
  fs.writeFileSync(path.join(root, "Brand Context", "assets", "Test_Brand", "creative", "vial_canon.png"), PNG_1x1);
  fs.writeFileSync(path.join(root, "generations", "candidate.png"), PNG_1x1);
  fs.writeFileSync(path.join(root, "knowledge", "products", "test.json"), JSON.stringify({
    schema: "product-registry/1",
    brand: "brand.test",
    displayName: "Test Brand",
    logo: [{ path: "Brand Context/assets/Test_Brand/creative/logo.png", role: "logo" }],
    products: [{ sku: "TB-VIAL-10", name: "Test vial 10mg", aliases: ["vial"], locked: ["Cap is purple."], references: [{ path: "Brand Context/assets/Test_Brand/creative/vial_canon.png", role: "canonical", note: "label truth" }] }],
    banned: [{ path: "old/wrong.png", why: "wrong label" }],
    locked: ["Never show human use."],
  }));
  fs.writeFileSync(path.join(root, "knowledge", "graph.json"), JSON.stringify({
    version: 1,
    updatedAt: "2026-09-14",
    sources: [
      { directory: "Brand Context", extensions: [".md"], categories: ["brand"] },
      { directory: "knowledge/learnings", extensions: [".json"], categories: ["learnings"] },
    ],
    nodes: [
      { id: "brand.test", type: "brand", name: "Test Brand", aliases: ["test", "tb"], source: "Brand Context/Test_Brand.md", complianceProfile: "general", promptProfile: { positioning: "Test positioning", mustPreserve: ["purple cap"], avoid: ["neon"] }, categories: ["brand"] },
      { id: "registry.test-products", type: "product-registry", name: "Test registry", path: "knowledge/products/test.json", source: "knowledge/products/test.json", categories: ["product-assets"] },
      { id: "compliance.general", type: "compliance-profile", name: "General", categories: ["compliance"] },
      { id: "rule.routing", type: "routing-rule", name: "Routing", rules: ["Default gpt-image-2."], categories: ["providers"] },
    ],
    edges: [{ from: "brand.test", relation: "has-products", to: "registry.test-products" }],
  }));
  return root;
}

test("prompt log appends, folds verdict markers, and finds an entry by output path", () => {
  const root = fixtureRoot();
  const graph = loadGraph(root);
  const entry = appendPromptLog(root, graph, { brand: "tb", prompt: "A vial on a ledge sk-abcdefghijklmnop123456", provider: "openai-image", model: "gpt-image-2", outputs: ["generations/candidate.png"], refs: [{ path: "Brand Context/assets/Test_Brand/creative/vial_canon.png", role: "canonical" }] });
  assert.match(entry.id, /^pl_/);
  assert.equal(entry.brand, "brand.test");
  assert.match(entry.prompt, /\[REDACTED\]/, "secrets are redacted before they reach the log");
  assert.ok(entry.outputs[0].sha256, "outputs are hashed");
  const found = findPromptLogEntry(root, graph, { outputPath: "generations/candidate.png" });
  assert.equal(found.id, entry.id);
  assert.equal(readPromptLog(root, graph, { brand: "test" }).length, 1);
});

test("law upsert folds near-duplicate claims and climbs the confidence ladder", () => {
  const root = fixtureRoot();
  const graph = loadGraph(root);
  const { store, path: storePath, brandNode } = loadLearnings(root, graph, "test");
  const first = upsertLaw(store, brandNode, { claim: "Nano Banana will not rescale a badge on a rendered device", evidence: "16 candidates" });
  assert.equal(first.created, true);
  assert.equal(first.law.confidence, "weak");
  const second = upsertLaw(store, brandNode, { claim: "Nano Banana does not rescale a badge on the rendered device", evidence: "again today" });
  assert.equal(second.created, false);
  assert.equal(second.law.id, first.law.id);
  assert.equal(second.law.occurrences, 2);
  assert.equal(second.law.confidence, "moderate");
  assert.match(second.law.evidence, /again today/);
  assert.equal(store.laws.length, 1);
  saveLearnings(storePath, store);
  assert.ok(fs.existsSync(storePath));
  assert.ok(claimSimilarity("purple cap on the vial", "the vial cap is purple") > 0.5);
  assert.equal(bumpConfidence("strong"), "strong");
  assert.equal(bumpConfidence("measured"), "measured");
});

test("approval becomes an exemplar with a tracked copy and an approved-output registry entry", async () => {
  const root = fixtureRoot();
  const graph = loadGraph(root);
  const entry = appendPromptLog(root, graph, { brand: "test", prompt: "Test vial 10mg on a white ledge", provider: "openai-image", model: "gpt-image-2", category: "product-image", product: "TB-VIAL-10", outputs: ["generations/candidate.png"] });
  const result = await recordFeedback(root, graph, { target: entry.id, verdict: "approved", reason: "label correct, ledge lighting matches the set", tags: ["ledge"] });
  assert.equal(result.event.verdict, "approved");
  assert.ok(result.exemplar.tracked.startsWith("Brand Context/assets/Test_Brand/approved/"));
  assert.ok(fs.existsSync(path.join(root, result.exemplar.tracked)));
  assert.equal(result.exemplar.prompt, "Test vial 10mg on a white ledge");
  assert.equal(result.registry.attachedTo, "TB-VIAL-10");
  const registry = JSON.parse(fs.readFileSync(path.join(root, "knowledge", "products", "test.json"), "utf8"));
  assert.equal(registry.approvedOutputs.length, 1);
  assert.equal(registry.products[0].references.at(-1).role, "approved-output");
  const { store } = loadLearnings(root, graph, "test");
  assert.equal(store.exemplars.length, 1);
  assert.equal(store.stats.byProviderCategory["openai-image/gpt-image-2 :: product-image"].approved, 1);
  const log = readPromptLog(root, graph, { brand: "test" });
  assert.equal(log[0].verdict.verdict, "approved");
  // The exemplar is now an asset the catalog can find.
  const catalog = buildAssetCatalog(root, graph, { brand: "brand.test" });
  assert.ok(catalog.items.some((item) => item.roles.includes("approved-output") && item.path === result.exemplar.tracked));
});

test("rejection becomes a law, repeated rejection strengthens it, and unlogged work can be judged", async () => {
  const root = fixtureRoot();
  const graph = loadGraph(root);
  const first = await recordFeedback(root, graph, { brand: "test", verdict: "rejected", reason: "cap rendered blue instead of purple", prompt: "vial on ledge", provider: "gemini-image", category: "product-image", output: "generations/candidate.png" });
  assert.equal(first.law.created, true);
  assert.equal(first.law.confidence, "weak");
  const second = await recordFeedback(root, graph, { brand: "test", verdict: "rejected", reason: "the cap rendered blue, not purple", prompt: "vial on ledge v2", provider: "gemini-image", category: "product-image" });
  assert.equal(second.law.created, false);
  assert.equal(second.law.id, first.law.id);
  assert.equal(second.law.confidence, "moderate");
  const { store } = loadLearnings(root, graph, "test");
  assert.equal(store.laws.length, 1);
  assert.equal(store.events.length, 2);
  assert.equal(store.stats.byProvider["gemini-image"].rejected, 2);
  await assert.rejects(recordFeedback(root, graph, { brand: "test", verdict: "approved", reason: "x" }), /reason/i);
  await assert.rejects(recordFeedback(root, graph, { brand: "test", verdict: "approved", reason: "looks right", prompt: "p" }), /output/i);
});

test("context pack pulls refs for the mentioned product, locked rules, laws, exemplars and rejections", async () => {
  const root = fixtureRoot();
  const graph = loadGraph(root);
  await recordFeedback(root, graph, { brand: "test", verdict: "rejected", reason: "cap rendered blue instead of purple", prompt: "test vial ledge", provider: "gemini-image", category: "product-image", product: "TB-VIAL-10" });
  await recordFeedback(root, graph, { brand: "test", verdict: "approved", reason: "purple cap correct", prompt: "test vial on a white ledge, purple cap", provider: "openai-image", model: "gpt-image-2", category: "product-image", product: "TB-VIAL-10", output: "generations/candidate.png" });
  const { pack, promptBlock } = buildContextPack(root, graph, { brand: "test", brief: "Test vial 10mg hero on a ledge for the website", category: "product-image" });
  assert.equal(pack.products[0].product, "TB-VIAL-10");
  assert.ok(pack.references.some((ref) => ref.roles.includes("canonical") && ref.path.endsWith("vial_canon.png")));
  assert.ok(pack.locked.some((item) => item.rule === "Cap is purple."));
  assert.ok(pack.locked.some((item) => item.rule === "Never show human use."));
  assert.equal(pack.banned[0].path, "old/wrong.png");
  assert.ok(pack.laws.some((law) => /purple/.test(law.claim)));
  assert.equal(pack.exemplars.length, 1);
  assert.equal(pack.rejections.length, 1);
  assert.equal(pack.routing.learned.byProviderForCategory[0].key, "openai-image/gpt-image-2 :: product-image");
  assert.match(promptBlock, /References to pass/);
  assert.match(promptBlock, /Approved exemplars/);
  assert.match(promptBlock, /Recent rejections/);
  assert.match(promptBlock, /Learned laws/);
  const laws = searchLaws(root, graph, "purple cap", { brand: "test" });
  assert.equal(laws[0].brand, "brand.test");
});

test("asset catalog walks registries, marks banned files, and answers product/role searches", () => {
  const root = fixtureRoot();
  const graph = loadGraph(root);
  const catalog = buildAssetCatalog(root, graph, { brand: "brand.test" });
  const canon = catalog.items.find((item) => item.path.endsWith("vial_canon.png"));
  assert.ok(canon.roles.includes("canonical"));
  assert.equal(canon.product, "TB-VIAL-10");
  assert.equal(canon.exists, true);
  const banned = catalog.items.find((item) => item.path === "old/wrong.png");
  assert.equal(banned.banned, true);
  assert.equal(searchAssets(catalog, { brand: "brand.test", role: "canonical" }).length, 1);
  assert.equal(searchAssets(catalog, { brand: "brand.test", query: "wrong" }).length, 0, "banned files are hidden by default");
  assert.equal(searchAssets(catalog, { brand: "brand.test", query: "wrong", includeBanned: true }).length, 1);
  assert.equal(searchAssets(catalog, { brand: "brand.test", product: "vial", existingOnly: true }).length, 1);
  const products = listProducts(catalog, "brand.test");
  assert.equal(products[0].product, "TB-VIAL-10");
  assert.equal(products[0].canonical, 1);
});

test("JSON registries are chunked per record so retrieval can return one law or product", () => {
  const chunks = chunkJson("knowledge/learnings/test.json", JSON.stringify({
    schema: "learning-registry/1",
    displayName: "Test Brand",
    laws: [{ id: "learn:test:a", claim: "Cap is purple" }, { id: "learn:test:b", claim: "No neon" }],
    exemplars: [{ id: "ex_1", prompt: "vial on ledge" }],
    stats: { verdicts: { approved: 1 } },
  }), ["learnings"], ["learnings"]);
  const headings = chunks.map((chunk) => chunk.heading);
  assert.ok(headings.includes("Test Brand > laws > learn:test:a"));
  assert.ok(headings.includes("Test Brand > exemplars > ex_1"));
  assert.ok(headings.includes("Test Brand"), "scalars and small objects collapse into one document chunk");
  assert.deepEqual(chunks[0].categories, ["learnings"]);
  const fallback = chunkJson("broken.json", "# Not JSON\ntext", [], []);
  assert.equal(fallback[0].heading, "Not JSON");
});
