#!/usr/bin/env node
// new-job.mjs — compile a creative brief into an ENGINE BATCH.
//
//   node new-job.mjs --brief briefs/dh-recovery.json          # compile only
//   node new-job.mjs --brief briefs/dh-recovery.json --run     # compile + hand to the engine
//
// ── The chain ──────────────────────────────────────────────────────────────
//
//     founder  →  Claude  →  new-job.mjs  →  batch.json  →  nanobanana.mjs  →  API
//                                                            gpt-image.mjs
//
// Claude never calls an image API. It compiles a brief into the engine's own
// batch contract and hands it over; the engine owns every provider call.
//
// This is a correction. The first cut of this file emitted a job script with
// its own `fetch` baked in — which put a generator in front of the bypass
// instead of removing it. `dh-gpt-creatives.mjs` and `dh-video-ads.mjs` have
// the same defect: hand-rolled endpoints that reimplement, worse, what
// gpt-image.mjs and nanobanana.mjs already do (ratio→resolution mapping, ref
// handling, edits-vs-generations routing, candidate saving, Preview open).
//
// ── What compiling means ───────────────────────────────────────────────────
// The engine is deliberately thin — README: "the intended way to use this repo
// is with Claude Code." There is no prompt compiler because the OPERATOR is
// meant to be it, reading Brand Context/<Brand>.md and folding it into each
// prompt by hand. Measured 2026-07-27: zero scripts in this repo have ever
// read a brand doc. `dh-bloodwork-ads.mjs` declares VIAL_ANCHOR then passes
// `refs:[]` on all five jobs. A step that lives only in discipline gets
// skipped by everyone, so it is a build step now:
//
//   1. parse Brand Context/<Brand>.md — locked rules + container→ref table
//   2. resolve refs BY BASENAME (the doc records paths from another machine)
//   3. inject locked global specs from 00_ENGINE.md
//   4. emit the engine's batch contract: {prompt, aspectRatio, imageSize, refImages}
//   5. refuse to compile anything the brand law forbids
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const RUN = process.argv.includes("--run");

/** Index every image by basename so a ref that moved machines still resolves. */
function indexImages(dir, acc = new Map(), depth = 0) {
  if (depth > 4) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) indexImages(p, acc, depth + 1);
    else if (/\.(png|jpe?g|webp)$/i.test(e.name) && !acc.has(e.name)) acc.set(e.name, p);
  }
  return acc;
}

/** `- **"Vial"** → description … `ref.png` …` */
function parseContainers(md) {
  const out = {};
  const re = /-\s+\*\*"([^"]+)"\*\*\s*(?:→|->)\s*([\s\S]*?)(?=\n-\s+\*\*"|\n\n|\n\*\*)/g;
  let m;
  while ((m = re.exec(md))) {
    const [, name, body] = m;
    out[name.toLowerCase()] = {
      description: body.replace(/\s+/g, " ").split(". ").slice(0, 2).join(". ").trim(),
      refs: [...body.matchAll(/`([^`]+\.(?:png|jpe?g|webp))`/gi)].map((r) => path.basename(r[1])),
    };
  }
  return out;
}

function parseLockedRules(md) {
  const sec = md.match(/##\s*\d*\.?\s*Locked visual rules[\s\S]*?(?=\n## |$)/i);
  if (!sec) return [];
  return [...sec[0].matchAll(/^\d+\.\s+\*\*(.+?)\*\*([\s\S]*?)(?=^\d+\.\s+\*\*|\Z)/gm)]
    .map((r) => (r[1] + " " + r[2]).replace(/\s+/g, " ").trim());
}

/**
 * The GRAPHIC law — Brand Context/<Brand>_DesignSystem.html.
 *
 * The brand .md governs the PRODUCT (vial geometry, label rules, scale, blur).
 * This governs everything drawn around it: palette, type, buttons, radii. Two
 * separate sources, both binding, and nothing read this one until now — which
 * is how a gold accent (#c7ac46) ended up on every ad plate and in the GPT
 * briefs. The palette is strictly monochromatic; gold was invented.
 */
function parseDesignSystem(brand) {
  const p = path.join(ROOT, "Brand Context", `${brand}_DesignSystem.html`);
  if (!fs.existsSync(p)) return null;
  const t = fs.readFileSync(p, "utf8");

  const vars = {};
  const root = t.match(/:root\s*\{([\s\S]*?)\}/);
  if (root) for (const m of root[1].matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();

  const strip = (x) => x.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
  const labels = [...t.matchAll(/class="type-label"[^>]*>([\s\S]*?)<\//g)].map((m) => strip(m[1]));
  const specs = [...t.matchAll(/class="type-spec[s]?"[^>]*>([\s\S]*?)<\//g)].map((m) => strip(m[1]));
  const scale = labels.map((l, i) => `${l}: ${specs[i] ?? ""}`).filter((s) => s.includes(":"));

  const grays = Object.entries(vars)
    .filter(([k]) => /^(white|black|gray-\d+)$/.test(k))
    .map(([k, v]) => `${k} ${v}`);

  return { vars, scale, grays };
}

function parseEngineSpecs(md, wanted) {
  const found = {};
  for (const [key, label] of Object.entries(wanted)) {
    const m = md.match(new RegExp(`^\\d+\\.\\s+\\*\\*${label}[^*]*\\*\\*([\\s\\S]*?)(?=^\\d+\\.\\s+\\*\\*|\\Z)`, "m"));
    if (m) found[key] = m[1].replace(/\s+/g, " ").trim();
  }
  return found;
}

// ── Brief ──────────────────────────────────────────────────────────────────
const briefPath = arg("brief");
if (!briefPath) {
  console.error(`
new-job.mjs — compile a brief into an engine batch

  node new-job.mjs --brief <brief.json> [--run]

{
  "name": "dh-recovery",
  "brand": "Dialed_Health",
  "backend": "nanobanana",          // nanobanana | gpt-image
  "ratio": "9:16", "size": "4K",
  "container": "vial",              // resolved from the brand doc; omit for unbranded
  "engineSpecs": ["motionBlur"],
  "look": "one line of art direction",
  "jobs": [ { "id": "R1", "line": "on-image copy", "scene": "..." } ]
}`);
  process.exit(1);
}

const brief = JSON.parse(fs.readFileSync(briefPath, "utf8"));
const brandPath = path.join(ROOT, "Brand Context", `${brief.brand}.md`);
if (!fs.existsSync(brandPath)) { console.error(`✗ no brand doc: ${brandPath}`); process.exit(1); }

const brandMd = fs.readFileSync(brandPath, "utf8");
const enginePath = path.join(ROOT, "Brand Context", "00_ENGINE.md");
const engineMd = fs.existsSync(enginePath) ? fs.readFileSync(enginePath, "utf8") : "";

const containers = parseContainers(brandMd);
const lockedRules = parseLockedRules(brandMd);
const ds = parseDesignSystem(brief.brand);
const specs = parseEngineSpecs(engineMd, {
  motionBlur: "Motion-blur spec", logoZone: "Logo-zone language pitfalls",
  safety: "Safety-filter phrasing", realism: "Video realism anchors",
});

const images = indexImages(ROOT);
const container = brief.container ? containers[brief.container.toLowerCase()] : null;
if (brief.container && !container) {
  console.error(`✗ no container "${brief.container}". Known: ${Object.keys(containers).join(", ")}`);
  process.exit(1);
}

const refImages = [];
const missing = [];
for (const ref of container?.refs ?? []) {
  const hit = images.get(ref);
  if (hit) refImages.push("./" + path.relative(ROOT, hit));
  else missing.push(ref);
}

console.log(`\nbrand       ${brief.brand}`);
console.log(`containers  ${Object.keys(containers).join(", ") || "(none)"}`);
console.log(`locked      ${lockedRules.length} rule(s) · ${Object.keys(specs).length} engine spec(s)`);
console.log(`design sys  ${ds ? `${ds.grays.length} palette steps · ${ds.scale.length} type styles · ${ds.vars["font-display"]} / ${ds.vars["font-body"]}` : "✗ none — palette and type will be invented"}`);
if (container) {
  console.log(`container   "${brief.container}"`);
  refImages.forEach((r) => console.log(`   ✓ ref   ${r}`));
  missing.forEach((r) => console.log(`   ✗ ref   ${r}  NOT FOUND`));
}

// ── Gates ──────────────────────────────────────────────────────────────────
// Naming a container but resolving no reference is dh-bloodwork-ads.mjs's
// `refs:[]` bug, and it makes the model invent the product.
if (brief.container && refImages.length === 0) {
  console.error(`\n✗ REFUSING: container "${brief.container}" resolved zero references.`);
  console.error(`  Text-only prompts invent the product (golden rule 4).`);
  console.error(`  Supply ${missing.join(", ")}, or drop "container" to compile deliberately unbranded.`);
  process.exit(2);
}
// Mono palette is law. Briefing an accent colour is how gold got in.
if (ds) {
  // Match an accent only when it is being ASKED FOR. The first cut fired on
  // "never styled or graded" — the negation is the whole point of the phrase.
  const look = brief.look ?? "";
  const asks = [...look.matchAll(/\b(gold accent|amber accent|accent colou?r|neon|colou?r wash|duotone|graded)\b/gi)]
    .filter((m) => !/\b(no|never|not|without|avoid)\b[^.]{0,40}$/i.test(look.slice(0, m.index)));
  if (asks.length) {
    console.error(`\n✗ REFUSING: the brief asks for "${asks[0][0]}" — an invented brand accent.`);
    console.error(`  The gray ramp governs type/chips/buttons. Photography takes natural colour`);
    console.error(`  from the real world, never a styling tint. Remove it from "look".`);
    process.exit(2);
  }
}
// Brand law locked rule 3: never composite a product render into a scene.
if (/composite|paste|overlay the (vial|bottle|product)/i.test(brief.look ?? "")) {
  console.error(`\n✗ REFUSING: the brief asks to composite a product render into a scene.`);
  console.error(`  Brand law locked rule 3 — regenerate in-scene with references instead.`);
  process.exit(2);
}

// ── Compile the prompt ─────────────────────────────────────────────────────
const graphicLaw = ds ? [
  `PALETTE — the ramp ${ds.grays.join(", ")} governs TYPE, CHIPS, BUTTONS and any drawn element. It does NOT govern photography: shoot in natural colour, as the brand's own lander imagery does. What is forbidden is an INVENTED brand accent — no gold, no neon, no graded colour wash, no coloured tint applied as styling. Colour must come from the real world in front of the lens: skin, daylight, wood, fabric, sky.`,
  `TYPE — two families only. Display/headings: ${ds.vars["font-display"] ?? "Barlow"}, weights 600-800, ALWAYS UPPERCASE, tight tracking. Body: ${ds.vars["font-body"] ?? "Inter"}, weight 400. Scale: ${ds.scale.join(" · ")}.`,
  `BUTTONS/PILLS — fully rounded (radius ${ds.vars["radius-full"] ?? "100px"}), label set UPPERCASE in the display face.`,
].join("\n") : "";

const law = [
  container ? `PRODUCT (reproduce EXACTLY as the reference images show; re-light it to this scene, never paste it flat): ${container.description}` : null,
  ...lockedRules.map((r) => `LOCKED: ${r}`),
  graphicLaw || null,
  ...(brief.engineSpecs ?? []).map((k) => specs[k]).filter(Boolean),
].filter(Boolean).join("\n");

const batch = brief.jobs.map((job) => ({
  prompt: [
    `Vertical ${brief.ratio ?? "9:16"} advertising image, full bleed, edge to edge. No border, no device mockup, no frame within the frame.`,
    job.scene,
    brief.look ?? "",
    law,
    // Case follows the design system, not habit. Dialed Health is uppercase
    // Barlow; the lowercase deadpan register belongs to Dialed Moods.
    job.line
      ? `Set the words "${ds ? job.line.toUpperCase() : job.line}" in the lower-left, ${ds ? `${ds.vars["font-display"] ?? "Barlow"} 600-700, UPPERCASE, tight letter-spacing` : "clean lowercase sans-serif"}, white, small and quiet — about one eighteenth of the image height. Spell EXACTLY as given, no other words anywhere in the image.`
      : `No text anywhere in the frame.`,
    refImages.length ? `Use the reference images ONLY for the product's exact geometry, colour, cap, band and label artwork — the label is sacred, invent no new text.` : "",
  ].filter(Boolean).join("\n\n"),
  aspectRatio: brief.ratio ?? "9:16",
  imageSize: brief.size ?? "4K",
  refImages,
  _id: job.id,
}));

fs.mkdirSync(path.join(ROOT, "batches"), { recursive: true });
const batchFile = path.join(ROOT, "batches", `${brief.name}.batch.json`);
fs.writeFileSync(batchFile, JSON.stringify(batch, null, 2));

const cli = (brief.backend ?? "nanobanana") === "nanobanana" ? "nanobanana.mjs" : "gpt-image.mjs";
const rel = path.relative(ROOT, batchFile);

console.log(`\n✓ compiled ${batch.length} job(s) → ${rel}`);
console.log(`  ${brief.ratio ?? "9:16"} · ${brief.size ?? "4K"} · ${refImages.length} ref(s) · ${cli}`);
console.log(`\n  env -u OPENAI_API_KEY node ${cli} --batch ${rel}\n`);

if (RUN) {
  console.log(`── handing off to the engine ──\n`);
  const env = { ...process.env };
  delete env.OPENAI_API_KEY;   // ~/.secrets exports a stale key that outranks .env
  const r = spawnSync("node", [cli, "--batch", rel], { cwd: ROOT, stdio: "inherit", env });
  process.exit(r.status ?? 0);
}
