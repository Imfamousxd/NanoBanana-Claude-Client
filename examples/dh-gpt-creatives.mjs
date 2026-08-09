#!/usr/bin/env node
// Dialed Health — ad creatives generated whole by gpt-image-2.
//
//   env -u OPENAI_API_KEY node dh-gpt-creatives.mjs              # dry run, $0
//   env -u OPENAI_API_KEY node dh-gpt-creatives.mjs --live
//   env -u OPENAI_API_KEY node dh-gpt-creatives.mjs --only N1 --live
//
// The OPENAI_API_KEY strip is MANDATORY on this Mac — ~/.secrets exports an
// older key that silently wins over .env and bills the wrong account.
//
// ── Why this exists ────────────────────────────────────────────────────────
// The previous approach took an existing lander photograph and composited type
// on top. That is a template, not a creative: the *image* carried no idea, so
// every plate looked the same and nothing was memorable. Here each job is a
// VISUAL CONCEPT — a single arresting arrangement that means something before a
// word is read — and gpt-image-2 renders the whole frame, type included.
//
// ── The text question ──────────────────────────────────────────────────────
// CLAUDE.md rule 5 and HANDOFF rule 2 both say never let a model render legible
// text. Both were learned on Nano Banana / Gemini, which garbles small type.
// gpt-image-2 is materially better at text, so this deliberately TESTS that —
// each concept ships one candidate with the line baked in. If it garbles, the
// fallback is unchanged: dh-adsets-build.py composites type deterministically
// over these as base plates. Judge the output, do not assume either way.
//
// ── Compliance, unchanged ──────────────────────────────────────────────────
// Service-level only. No vial may carry a molecule name — the label is the
// DIALED HEALTH mark and nothing else — or the ad falls under Prescription
// Drugs and needs LegitScript. No bodies, so no before/after surface at all.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { lintVoiceover } from "./dh-ad-copy-lint.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const LIVE = process.argv.includes("--live");
const ONLY = arg("only");
const OUT = "Dialed Health GPT Creatives";
const SIZE = "1024x1536";           // portrait; extend to 1080x1920 for Reels
const COST_EACH = 0.19;             // gpt-image-2, high quality, 1024x1536

// ── Brand lock, lifted from Brand Context/Dialed_Health.md via dh-bloodwork-ads
const MARK = `The only marking anywhere is the DIALED HEALTH logo: the word "DIALED" set TOP-LEFT above a thin horizontal rule, a single ECG heartbeat spike at the CENTRE of that rule, and the word "HEALTH" set BOTTOM-RIGHT beneath it, the two words offset diagonally, never centred. Clean white sans-serif on matte black.`;
const NO_MOLECULE = `CRITICAL: no drug name, no molecule name, no dosage figure, no milligram marking anywhere in the frame. Labels carry the logo and nothing else.`;
const LOOK = `Editorial still-life for a premium clinical brand. Photorealistic, shot on a 100mm macro at f/4 with real depth of field and genuine film grain. Single soft key light from the upper left with one honest shadow. Muted palette: near-black, warm grey, bone white, one small warm-gold accent. Calm, restrained, expensive. Generous negative space. Nothing floating, everything resting on a real surface.`;

/**
 * Each concept is a visual IDEA first. The line is what the picture already
 * says — it names the thought, it does not carry it.
 */
const CONCEPTS = [
  // ── RECOVERY — the lead line. Deepest eligible catalog, least policed
  //    category, and the one Hims has no answer to at all.
  {
    id: "R1-never-came-back",
    line: "the shoulder never fully came back",
    scene: `A single roll of white athletic tape, partly used with the loose end trailing, resting alone on a dark stone surface. Beside it, slightly behind and softly out of focus, a small matte-black vial. Nothing else in frame. The tape is the subject; the vial is the answer waiting.`,
  },
  {
    id: "R2-healed-wrong",
    line: "it healed. it just healed wrong.",
    scene: `A bone-white ceramic bowl on dark stone, cleanly broken into two pieces and rejoined slightly out of true, so the seam does not quite line up. A thin warm-gold line runs along the join, kintsugi-style. Lit from the upper left so the misalignment casts one honest shadow.`,
  },

  // ── ENERGY
  {
    id: "E1-not-caffeine",
    line: "the 3pm thing that isn't caffeine",
    scene: `An empty espresso cup on a saucer, tipped very slightly on its side on dark stone, a dried coffee ring beside it. Behind it, upright and in focus, one small matte-black vial. The cup is spent; the vial is not.`,
  },

  // ── PERFORMANCE
  {
    id: "P1-slower-rebound",
    line: "same training. slower rebound.",
    scene: `A single well-worn training shoe on dark stone, photographed from the side, its heel visibly compressed and worn down on one edge while the rest of the shoe looks nearly new. One small matte-black vial stands behind it, in focus. Honest, unstyled, a little bit sad.`,
  },
];

function audit() {
  const rows = CONCEPTS.filter((c) => !ONLY || c.id.startsWith(ONLY)).map((c) => {
    const { errors } = lintVoiceover(c.line, { tier: "rx", medium: "text" });
    return { c, errors };
  });

  console.log(`\nDialed Health — gpt-image-2 creatives   ${rows.length} concepts x 2 candidates\n`);
  for (const { c, errors } of rows) {
    console.log(`${errors.length ? "GATED" : "ready"}  ${c.id}   "${c.line}"`);
    errors.forEach((e) => console.log(`         ✗ ${e}`));
  }
  const runnable = rows.filter((r) => !r.errors.length);
  console.log(`\nWould generate ${runnable.length * 2} images at ${SIZE}`);
  console.log(`Estimated spend  $${(runnable.length * 2 * COST_EACH).toFixed(2)}`);
  if (!LIVE) console.log(`\nDRY RUN — nothing billed. Pass --live to generate.\n`);
  return runnable.map((r) => r.c);
}

/**
 * Two candidates per concept, per CLAUDE.md golden rule 3: one with the line
 * rendered by the model, one clean plate for deterministic compositing. That
 * way the text experiment is settled by looking, and the safe path always
 * exists.
 */
function buildPrompt(concept, withText) {
  // Always specify the mark. Verified 2026-07-27: instructing "no logo" made
  // gpt-image-2 invent a decorative gold leaf emblem on the label rather than
  // leave it bare. An unspecified surface gets filled, so specify it.
  const type = `Set the words "${concept.line}" in the ${withText ? "lower-left" : "lower-centre"} of the frame, in a clean lowercase white sans-serif, small and quiet — roughly one fifteenth of the image height. Spell it EXACTLY as given, all lowercase, no other words anywhere in the image. ${MARK}`;

  return `Vertical 9:16 advertising image, full bleed, filling the frame edge to edge with no border and no device mockup.

${concept.scene}

${LOOK}

${type}

${NO_MOLECULE} No people, no hands, no bodies. No before-and-after. No clutter, no props beyond those described.`;
}

async function generate(concept, withText, idx) {
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-image-2", prompt: buildPrompt(concept, withText), size: SIZE, quality: "high", n: 1 }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(json).slice(0, 220)}`);
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("no image returned");

  const name = `${concept.id}_${withText ? "withtype" : "plate"}.png`;
  fs.writeFileSync(path.join(OUT, name), Buffer.from(b64, "base64"));
  console.log(`  ✓ ${name}`);
  return name;
}

const runnable = audit();
if (!LIVE) process.exit(0);
fs.mkdirSync(OUT, { recursive: true });

for (const concept of runnable) {
  console.log(`\n${concept.id}`);
  for (const withText of [true, false]) {
    try {
      await generate(concept, withText);
    } catch (e) {
      console.log(`  ✗ ${concept.id} ${withText ? "withtype" : "plate"}: ${e.message}`);
    }
  }
}

console.log(`\nOutput: ${OUT}/`);
console.log(`Compare the withtype and plate candidates before scaling. If the model's type holds up,`);
console.log(`use it. If it garbles, composite over the plates with dh-adsets-build.py.\n`);
