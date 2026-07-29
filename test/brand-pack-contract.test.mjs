import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { listPacks } from "../engine/brandkit/kit.mjs";
import { validateAllPacks, validatePack } from "../engine/brandkit/validate.mjs";
import { createPack } from "../engine/brandkit/scaffold.mjs";

// The contract every brand pack must satisfy, applied to every pack in the repository. A pack added
// later inherits these checks without anyone remembering to write a test for it.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const describe = (result) => result.errors.map((issue) => `${issue.code}: ${issue.message}`).join("\n");

test("every brand pack in the repository is structurally valid", () => {
  const results = validateAllPacks(root);
  assert(results.length > 0, "no brand packs found; knowledge/brands/ should not be empty");
  for (const result of results) {
    assert(result.ok, `pack "${result.pack}" has structural errors:\n${describe(result)}`);
  }
});

test("a pack holds knowledge only — no code, no binaries", () => {
  for (const pack of listPacks(root)) {
    for (const file of fs.readdirSync(path.join(root, "knowledge", "brands", pack))) {
      assert(
        [".json", ".md"].includes(path.extname(file)),
        `${pack}/${file} is neither .json nor .md. Assets belong in Brand Context/assets, code in engine/.`,
      );
    }
  }
});

/** Build a throwaway repository containing only what the scaffold and validator touch. */
function sandbox() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "brandpack-"));
  fs.mkdirSync(path.join(directory, "knowledge", "brands"), { recursive: true });
  fs.mkdirSync(path.join(directory, "knowledge", "claims"), { recursive: true });
  fs.copyFileSync(path.join(root, "knowledge", "graph.json"), path.join(directory, "knowledge", "graph.json"));
  return directory;
}

test("a scaffolded pack is valid on creation and registers itself in the graph", () => {
  const directory = sandbox();
  const result = createPack(directory, "test-brand", { name: "Test Brand", compliance: "general" });

  assert.equal(result.pack, "test-brand");
  assert(result.files.includes("design-system.json"));
  assert(result.files.includes("FORMATS.md"));

  const validation = validatePack(directory, "test-brand");
  assert(validation.ok, `a freshly scaffolded pack must have no errors:\n${describe(validation)}`);
  // It is incomplete by design, and must say so rather than looking finished.
  assert(validation.warnings.some((issue) => issue.code === "SCAFFOLD_INCOMPLETE"));

  const graph = JSON.parse(fs.readFileSync(path.join(directory, "knowledge", "graph.json"), "utf8"));
  assert(graph.nodes.some((node) => node.id === "brand.test-brand"));
  assert(graph.nodes.some((node) => node.id === "pack.test-brand" && node.type === "brand-pack"));
  assert(graph.edges.some((edge) => edge.from === "brand.test-brand" && edge.relation === "has-pack"));
  assert(graph.sources.some((source) => source.path === "knowledge/brands/test-brand/FORMATS.md"));

  fs.rmSync(directory, { recursive: true, force: true });
});

test("scaffolding refuses to overwrite an existing pack", () => {
  const directory = sandbox();
  createPack(directory, "test-brand", { name: "Test Brand" });
  assert.throws(() => createPack(directory, "test-brand", { name: "Test Brand" }), (error) => error.code === "PACK_EXISTS");
  fs.rmSync(directory, { recursive: true, force: true });
});

test("pack ids must be kebab-case so the directory and the CLI handle agree", () => {
  const directory = sandbox();
  for (const bad of ["Test Brand", "test_brand", "TestBrand", "", "x"]) {
    assert.throws(() => createPack(directory, bad), (error) => error.code === "INVALID_PACK_ID", `"${bad}" should be rejected`);
  }
  fs.rmSync(directory, { recursive: true, force: true });
});

test("validation rejects the mistakes that actually break a render", () => {
  const directory = sandbox();
  createPack(directory, "test-brand", { name: "Test Brand" });
  const packPath = (file) => path.join(directory, "knowledge", "brands", "test-brand", file);
  const patch = (file, mutate) => {
    const value = JSON.parse(fs.readFileSync(packPath(file), "utf8"));
    mutate(value);
    fs.writeFileSync(packPath(file), JSON.stringify(value, null, 2));
  };

  patch("catalog.json", (catalog) => {
    catalog.categories.core = { name: "Core", accent: "#123456" };
    catalog.compounds.widget = { name: "Widget", category: "does-not-exist", vial: "../../../etc/passwd" };
    catalog.panels.kit = { members: ["widget", "ghost"] };
  });
  patch("selling-points.json", (points) => {
    points.points.tested = { label: "Tested", spec: ["one", "two", "three"], claim: "claim.test.missing" };
    points.variants.base = { points: ["tested"] };
  });
  patch("hero-prompts.json", (hero) => {
    hero.blocks.product = "A {name} lit with {invented}.";
  });

  const codes = new Set(validatePack(directory, "test-brand").errors.map((issue) => issue.code));
  for (const expected of [
    "UNKNOWN_CATEGORY",        // a typo in a category key renders the wrong accent everywhere
    "ASSET_OUTSIDE_REPO",      // an absolute or escaping path works only on the author's machine
    "UNKNOWN_PANEL_MEMBER",
    "POINT_INCOMPLETE",        // a missing copy form renders blank in one format only
    "POINT_SPEC_SHAPE",
    "CLAIM_RECORD_MISSING",    // an unsourced factual claim must never reach a render
    "VARIANT_SHAPE",
    "UNKNOWN_PLACEHOLDER",     // a placeholder nothing fills ships literally into the prompt
  ]) {
    assert(codes.has(expected), `validation missed ${expected}; got ${[...codes].join(", ")}`);
  }

  fs.rmSync(directory, { recursive: true, force: true });
});

test("an approved claim with no accountable owner is rejected", () => {
  const directory = sandbox();
  createPack(directory, "test-brand", { name: "Test Brand" });
  fs.writeFileSync(path.join(directory, "knowledge", "claims", "claim.test.unowned.json"), JSON.stringify({
    id: "claim.test.unowned",
    claim: "Independently verified.",
    brand: "brand.test-brand",
    source: { url: "https://example.com", title: "t", retrievedAt: "2026-07-28", support: "stated on the page" },
    status: "approved",
    owner: "unassigned",
    reviewedAt: "2026-07-28",
    reviewAfter: "2027-07-28",
    approvedUses: ["static ad"],
  }, null, 2));

  const pointsPath = path.join(directory, "knowledge", "brands", "test-brand", "selling-points.json");
  const points = JSON.parse(fs.readFileSync(pointsPath, "utf8"));
  points.points.verified = { label: "Verified", loud: "VERIFIED", spec: ["Independently", "verified"], claim: "claim.test.unowned" };
  fs.writeFileSync(pointsPath, JSON.stringify(points, null, 2));

  const codes = validatePack(directory, "test-brand").errors.map((issue) => issue.code);
  assert(codes.includes("CLAIM_APPROVED_WITHOUT_OWNER"));
  fs.rmSync(directory, { recursive: true, force: true });
});
