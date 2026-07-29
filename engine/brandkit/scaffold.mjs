import fs from "node:fs";
import path from "node:path";
import { EngineError } from "../core/errors.mjs";
import { readJson, slugify, writeJsonAtomic } from "../core/files.mjs";
import { packDirectory } from "./kit.mjs";

// `brandkit new` writes a structurally valid, empty pack and registers it in the knowledge graph.
// Adding a brand should be a command, not a checklist someone follows from memory and gets wrong in
// a different way each time.

const ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,40}$/;

const titleCase = (id) => id.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join(" ");
const assetFolder = (name) => name.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

function designSystem(id, name, assetDirectory) {
  return {
    $comment: `${name} design tokens. Read this before writing any layout, prompt, or CSS. Replace every TODO with a value you verified against a real brand source — never a guess, and never a value copied from another brand.`,
    version: 1,
    brand: `brand.${id}`,
    updatedAt: new Date().toISOString().slice(0, 10),
    sources: [{ title: "TODO — where these tokens came from", url: "TODO", retrievedAt: new Date().toISOString().slice(0, 10), covers: "surfaces" }],

    disclosures: {
      $comment: "Exact strings, rendered deterministically, never asked of an image model. Delete this block only if the brand is genuinely unregulated.",
      required: "TODO — the exact disclosure this brand must carry, or remove this key",
      rule: "Required disclosures must be legible in the final pixels, not merely present in the prompt.",
    },

    surfaces: {
      $comment: "Keep surfaces separate. A marketing palette and a packaging palette are different systems and must not be mixed; that mistake is what this structure exists to prevent.",
      marketing: {
        $comment: "Ads, web, email, video overlays.",
        ink: "TODO",
        snow: "TODO",
        accent: "TODO",
      },
    },

    typography: {
      $comment: "Families must be on Google Fonts so `brandkit fonts` can bundle them offline.",
      families: {
        display: { name: "TODO", weights: "400", role: "headings" },
        body: { name: "TODO", weights: "400;600", role: "body copy" },
      },
      bundle: {
        provider: "google-fonts",
        css2: "TODO — https://fonts.googleapis.com/css2?family=...&display=swap",
        fallbacks: {},
      },
      rules: ["TODO — the typographic rules that make this brand recognizable, and why each one is locked"],
    },

    assets: {
      $comment: `Curated, committed artwork that must be present on a fresh clone. Put files in ${assetDirectory}/ and reference them here with repository-relative paths. Never an absolute path, never a scratch directory — those break for everyone but you.`,
    },

    prohibited: ["TODO — what this brand must never look like, and why it was rejected"],
  };
}

function catalog(id, name) {
  return {
    $comment: `${name} products used in creative work, with the facts a prompt or layout must state exactly. This is a CREATIVE subset, not the commercial catalog.`,
    version: 1,
    brand: `brand.${id}`,
    updatedAt: new Date().toISOString().slice(0, 10),
    categories: {
      $comment: "Each category owns an accent color and an eyebrow label.",
    },
    compounds: {
      $comment: "One entry per product. `category` must name a key in `categories`. Add a committed reference asset before generating — text-only prompting is not a fidelity strategy.",
    },
    panels: {
      $comment: "Multi-product groupings, if the brand sells them.",
    },
  };
}

function sellingPoints(id, name) {
  return {
    $comment: `${name} copy matrix. Every factual point names a claim record in knowledge/claims/. Nothing here may be used until that record is approved by an accountable human.`,
    version: 1,
    brand: `brand.${id}`,
    updatedAt: new Date().toISOString().slice(0, 10),
    $formats: "`label`+`sub` is the chip form, `loud` is the single uppercase line, `spec` is the pre-broken two-line pair. Provide all three or a format renders blank.",
    points: {},
    variants: {
      $comment: "Exactly three points each. Vary one hypothesis at a time — variants are experiments, not rerolls.",
    },
    hooks: {
      $comment: "Two clauses: the first roman, the second italic. Keep them short enough to read at thumbnail size.",
    },
    ctas: {},
    prohibited: {
      $comment: "Claims deliberately excluded until a sourced record exists. Historical campaign copy is not evidence of approval.",
      claims: ["TODO"],
    },
  };
}

function heroPrompts(id, name) {
  return {
    $comment: `Verbatim generative prompt blocks for ${name}. These are the surviving text after real rejected rounds — edit only with a reason, and record the reason in the pack's markdown document.`,
    version: 1,
    brand: `brand.${id}`,
    updatedAt: new Date().toISOString().slice(0, 10),
    provider: { id: "gemini-image", model: "gemini-3-pro-image", imageSize: "2K" },
    references: {
      $comment: "Reference order is load-bearing. State what each reference is and what the model must take from it.",
    },
    blocks: {
      $comment: "Long, verbatim contracts. Placeholders {name} {dose} {rules} {cap} {cake} are filled from catalog.json.",
    },
    composition: {
      $comment: "One block per aspect ratio. Brief placement as a geometric rule, not a percentage — percentage-only briefs get ignored.",
    },
    styles: {
      $comment: "Approved scene styles. Each needs a `prompt` and a `why`.",
    },
    dropped: {
      $comment: "Styles that were tried and rejected, with the reason. Keeping these is what stops the next person re-proposing them.",
    },
  };
}

function formatDoc(name, id) {
  return `# ${name} creative system

The approved formats, the layout law behind them, and the rejection history that produced each rule.
Read this before designing anything for ${name}.

Tokens live in \`design-system.json\`. Products live in \`catalog.json\`. Copy lives in
\`selling-points.json\`. Prompt blocks live in \`hero-prompts.json\`. This document is the *reasoning*;
those files are the *data*. Do not duplicate values here — they drift.

---

## 1. How work is built

Most creative splits in two. Fill this in for ${name}:

| Half | Tool | Why |
|---|---|---|
| The scene | TODO | |
| The layout — logo, copy, CTA, disclosure | HTML/CSS → headless Chrome | Exact copy, exact hexes, free per render, and incapable of hallucinating a claim into the artwork. |

Never ask an image model to render legal copy, a logo, a certificate, a QR code, or a table.

## 2. The invariant spine

The element order every format shares. Rearranging it is what makes a creative stop reading as
${name}.

\`\`\`
TODO
\`\`\`

## 3. Approved formats

TODO — one section per format. Say what makes it *different in texture* from the others, not just
different in content. Re-skins get rejected as "too similar".

## 4. Rejection history — do not regress

| What was tried | Verdict | Rule it produced |
|---|---|---|
| TODO | | |

A rule without its rejection history gets undone by the next person. This table is the most valuable
part of the document.

## 5. Before you ship

1. Every selling point maps to an **approved** claim record.
2. Required disclosures are legible in the final pixels.
3. Every CTA and QR code resolves to what its caption says.
4. A qualified human owns final legal, brand, and platform approval.

---

Validate the pack after any change: \`npm run content -- brandkit validate ${id}\`
`;
}

function registerInGraph(root, id, name, { compliance, assetDirectory }) {
  const graphPath = path.join(root, "knowledge", "graph.json");
  const graph = readJson(graphPath);
  const added = [];

  const docSource = `knowledge/brands/${id}/FORMATS.md`;
  if (!graph.sources.some((source) => source.path === docSource)) {
    graph.sources.push({ path: docSource, tags: [id, "brand-pack", "playbook"] });
    added.push(`source ${docSource}`);
  }

  const brandId = `brand.${id}`;
  const brand = graph.nodes.find((node) => node.id === brandId);
  if (!brand) {
    graph.nodes.push({
      id: brandId,
      type: "brand",
      name,
      aliases: [id, name.toLowerCase()],
      source: `Brand Context/${assetFolder(name)}.md`,
      complianceProfile: compliance,
      pack: `knowledge/brands/${id}`,
    });
    added.push(`node ${brandId}`);
  } else if (!brand.pack) {
    brand.pack = `knowledge/brands/${id}`;
    added.push(`pack pointer on ${brandId}`);
  }

  const packId = `pack.${id}`;
  if (!graph.nodes.some((node) => node.id === packId)) {
    graph.nodes.push({
      id: packId,
      type: "brand-pack",
      name: `${name} brand pack`,
      aliases: [`${id} pack`, `${id} brandkit`],
      source: docSource,
      directory: `knowledge/brands/${id}`,
      provides: ["TODO — what this pack gives a generator that Brand Context does not"],
      commands: [`npm run content -- brandkit kit ${id}`, `npm run content -- brandkit validate ${id}`],
    });
    added.push(`node ${packId}`);
  }

  const assetsId = `assets.${id}-ads`;
  if (!graph.nodes.some((node) => node.id === assetsId)) {
    graph.nodes.push({
      id: assetsId,
      type: "asset-collection",
      name: `${name} creative artwork`,
      paths: [assetDirectory],
      selectionRule: "TODO — how to choose the right asset, and what makes one canonical.",
    });
    added.push(`node ${assetsId}`);
  }

  const edges = [
    { from: brandId, relation: "has-pack", to: packId },
    { from: brandId, relation: "has-assets", to: assetsId },
  ];
  const complianceNode = `compliance.${compliance}`;
  if (graph.nodes.some((node) => node.id === complianceNode)) {
    edges.push({ from: packId, relation: "uses", to: complianceNode });
  }
  for (const edge of edges) {
    if (!graph.edges.some((existing) => existing.from === edge.from && existing.relation === edge.relation && existing.to === edge.to)) {
      graph.edges.push(edge);
      added.push(`edge ${edge.from} -${edge.relation}-> ${edge.to}`);
    }
  }

  graph.updatedAt = new Date().toISOString().slice(0, 10);
  const { path: _path, nodeById: _nodeById, ...serializable } = graph;
  writeJsonAtomic(graphPath, serializable);
  return added;
}

/** Scaffold a new brand pack and register it. Never overwrites an existing pack. */
export function createPack(root, requestedId, { name: requestedName, compliance = "general" } = {}) {
  const id = String(requestedId || "").trim();
  // Reject rather than silently normalize: this string becomes a permanent directory name and the
  // CLI handle for the brand, so quietly turning "DialedHealth" into "dialedhealth" would hand back
  // an id nobody would have chosen. Suggest the right one instead.
  if (!ID_PATTERN.test(id)) {
    const suggestion = slugify(requestedId, "");
    throw new EngineError(
      "INVALID_PACK_ID",
      `Pack id must be lowercase kebab-case, 2-41 characters${suggestion ? `. Did you mean "${suggestion}"?` : "."}`,
      { received: requestedId, suggestion: suggestion || undefined },
    );
  }
  const directory = packDirectory(root, id);
  if (fs.existsSync(directory)) {
    throw new EngineError("PACK_EXISTS", `knowledge/brands/${id} already exists.`, {
      fix: `Edit it directly, then run: npm run content -- brandkit validate ${id}`,
    });
  }

  const name = requestedName || titleCase(id);
  const assetDirectory = `Brand Context/assets/${assetFolder(name)}/creative`;

  fs.mkdirSync(directory, { recursive: true });
  const files = {
    "design-system.json": designSystem(id, name, assetDirectory),
    "catalog.json": catalog(id, name),
    "selling-points.json": sellingPoints(id, name),
    "hero-prompts.json": heroPrompts(id, name),
  };
  for (const [file, value] of Object.entries(files)) writeJsonAtomic(path.join(directory, file), value);
  fs.writeFileSync(path.join(directory, "FORMATS.md"), formatDoc(name, id));

  const graphChanges = registerInGraph(root, id, name, { compliance, assetDirectory });

  return {
    ok: true,
    pack: id,
    name,
    directory: path.relative(root, directory),
    assetDirectory,
    files: [...Object.keys(files), "FORMATS.md"],
    graphChanges,
    nextSteps: [
      `1. Fill in every TODO in knowledge/brands/${id}/ — verified values only, never guesses.`,
      `2. Commit the brand's artwork under ${assetDirectory}/ and declare it in design-system.json under "assets".`,
      `3. Create a claim record in knowledge/claims/ for every factual selling point.`,
      `4. Run: npm run content -- brandkit validate ${id}`,
      `5. Run: npm run knowledge:build`,
      `6. Read CONTRIBUTING.md before changing anything in engine/ — a pack should need no engine change.`,
    ],
  };
}
