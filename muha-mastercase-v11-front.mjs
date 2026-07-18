#!/usr/bin/env node
// Muha Members Giveaway — MASTER CASE — v9 FRONT PANEL
// LAYOUT-LOCKED RESTYLE: pass the APPROVED v5 FRONT as image 0 (structural ground truth) and
// edit it — preserve the EXACT template dieline/grid (coordinate-locked prompt from workflow),
// change ONLY (1) the visual style -> Pixar Miami-Vice neon, and (2) the central hero-zone
// content -> the 10 fruit-drama characters gathered around the F-150 XLT prize.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-image-2";

const STRUCT_REF = "AI Fruit VIdeos Muha/Master Case Designs/2026-05-31T02-28-28_muha-mastercase-v5-FRONT.png"; // image 0 = structural ground truth
const LOGO_REF = "AI Fruit VIdeos Muha/refs/MMembers Logo.png";
const TRUCK_REF = "AI Fruit VIdeos Muha/refs/truck frront.png";
const CREST_REF = "AI Fruit VIdeos Muha/refs/mm-gold.png";
const CHAR_DIR = "AI Fruit VIdeos Muha/Generated Characters";
const CHARACTERS = [
  "Aloha Passion Rush.png",
  "Arctic Blueberry.png",
  "Blue Slushie.png",
  "Frosted Mint Cookies.png",
  "Frozen Pomegranate.png",
  "Galactic Diesel.png",
  "Guava Mango.png",
  "Horchata.png",
  "Lemon Cherry Fizz.png",
  "Watermelon Bubblegum.png",
];

// Hardened, coordinate-locked prompt (from mastercase-layout-lock workflow).
// image 0 = the v5 front structural ground truth; remaining refs = logo, truck, crest, 10 chars.
const PROMPT = `FORD F-150 XLT GIVEAWAY — Muha master-case FRONT PANEL. This is a LAYOUT-LOCKED RESTYLE / EDIT of the supplied primary image (image 0), NOT a redesign and NOT a new layout. Image 0 is the absolute STRUCTURAL GROUND TRUTH. You must reproduce its dieline, its zone geometry, its element positions, its element sizes, its alignments, and its text — ALL IDENTICAL to image 0. The things you are permitted to change are: (1) the visual STYLE (re-render the existing black / chrome / Von-Dutch KUSTOM pinstripe look as Pixar/C4D Miami-Vice neon), (2) the INTERIOR CONTENT of the single central hero zone (swap the lone truck for the 10-fruit-character-plus-truck ensemble), and (3) the TOP banner: it now shows ONLY the single centered MUHA MEMBERS logo — REMOVE the second/right winged-M "MUHA" crest that was up top (the winged-M coin stays ONLY at the bottom). Nothing else may move, resize, rotate, reshape, duplicate, merge, appear, or disappear.

=== ABSOLUTE GEOMETRY LOCK (read this as a non-negotiable constraint, not a suggestion) ===
- KEEP THE EXACT DIELINE of image 0: portrait canvas, ~0.7:1 width-to-height. An angled TRAPEZOIDAL TOP DUST-FLAP that narrows toward the very top edge; below it the main RECTANGULAR FACE; two FULL-HEIGHT VERTICAL SIDE RAILS pinned to the extreme left and right edges; a CURVED / TRAPEZOIDAL BOTTOM TUCK-FLAP with a die-cut ROUNDED bottom edge. The two top corners are upward-pointing triangular dust-flap wings exactly as in image 0.
- The canvas border, the four flap shapes, and the two side rails define the frame. Do NOT crop, do NOT add margin, do NOT zoom in, do NOT zoom out, do NOT re-center, do NOT change the aspect ratio. Output occupies the same pixels as image 0.
- USE THESE NORMALIZED COORDINATES (origin = top-left, values are fractions of the full canvas width/height as [x, y, w, h]) AS HARD POSITIONS. Each element must land in its box, at its size. Do not nudge:

  1. TOP DUST-FLAP inverted fine-print tagline band — [0.10, 0.00, 0.80, 0.07]. Spans the upper trapezoid, small UPSIDE-DOWN (inverted) Latin-script serif fine print, centered. Stays entirely on the dust flap; never reads right-side-up; never grows into the face below.
  2. LEFT winged-eagle corner crest — [0.05, 0.07, 0.15, 0.12], facing outward, top-left corner, wings trailing down toward the left rail.
  3. RIGHT winged-eagle corner crest (mirror of left) — [0.80, 0.07, 0.15, 0.12], top-right corner.
  4. TOP EMBLEM = the MUHA MEMBERS logo, reproduced EXACTLY from the provided logo reference image, single and CENTERED — [0.30, 0.11, 0.40, 0.10]. Paste/composite the logo reference AS-IS, pixel-faithful: the blue circular verification-checkmark badge + the gold "M" monogram + the gold cursive "Members®" wordmark, in its real proportions and colors. Do NOT redraw, restyle, recolor, re-letter, neon-ify, or add any extra text to it — it stays the clean original logo. It is the ONLY emblem in the top banner row, flanked just by the two corner eagle crests. (The logo already contains its own wordmark — do NOT add a separate "MUHA MEMBERS" text line above/below/around it.)
  5. (REMOVED) There is NO second/right emblem in the top banner. Do NOT place any winged-M crest, lozenge, or "MUHA" wordmark beside the Muha Members logo up top. The space [0.56, 0.11, 0.26, 0.10] is now just background ornament.
  6. STACKED HEADLINE block "FORD" (line 1) / "F-150 XLT" (line 2) — [0.10, 0.22, 0.80, 0.13]. Two lines, centered, heavy serif, the dominant typographic element, with a thin ornamental divider directly above and directly below.
  7. Gold "GIVEAWAY" ribbon flanked by stars — [0.24, 0.36, 0.52, 0.07]. Centered, sits IMMEDIATELY under the F-150 XLT line, a small gold star at each end. It is BELOW the headline and ABOVE the truck — it must never sit on top of, behind, or beside the hero scene.
  8. CENTRAL HERO ZONE (the dominant container, the ONLY zone whose interior content changes) — [0.10, 0.43, 0.80, 0.24]. This is the framed/filigreed region that in image 0 holds the lone truck. Its ornate pinstripe/scrollwork border keeps its EXACT footprint and shape; only what is rendered INSIDE it changes.
  9. MM COIN — gold winged-M crest MEDALLION — [0.38, 0.66, 0.24, 0.10]. The Muha "MM" coin: a circular gold medallion with the winged-M monogram and symmetric wings, centered, sits BELOW the central hero zone. This is the bottom emblem (the ONLY winged-M coin on the panel). Untouched in position and size.
  10. "ALL-IN-ONE" script line — [0.22, 0.78, 0.56, 0.05]. White brush-script, centered, above the spec band.
  11. Checkered spec band "100 UNITS | 10 CASES | 10 STRAINS" — [0.10, 0.84, 0.80, 0.06]. Horizontal bar with black-and-white CHECKERBOARD end-caps at both ends and the gold pipe-separated text centered between them.
  12. 21+ regulatory fine-print band — [0.10, 0.91, 0.80, 0.04]. Centered small print, on the bottom tuck flap region.
  13. BOTTOM TUCK-FLAP with curved decorative ribbon — [0.00, 0.88, 1.00, 0.12]. Rounded die-cut bottom; gold decorative band along its top fold edge; side rails continue down into it.
  14. LEFT vertical side rail — [0.02, 0.07, 0.05, 0.91]. Full-height ornate gold/white pinstripe + diamond-lattice filigree, pinned to the left edge.
  15. RIGHT vertical side rail (mirror of left) — [0.93, 0.07, 0.05, 0.91]. Full-height ornate filigree, pinned to the right edge.

- VERTICAL STACKING ORDER, top to bottom, must be exactly: dust-flap tagline → eagle corner crests + the SINGLE centered MUHA MEMBERS logo (same row) → FORD / F-150 XLT headline → GIVEAWAY ribbon → central hero zone → MM coin (winged-M medallion) → ALL-IN-ONE script → checkered spec band → 21+ fine print → bottom tuck flap. Do not reorder. Nothing from a lower zone may rise into a higher zone and nothing from a higher zone may drop into a lower one.

=== NO-BLEED / NO-SPILL ENFORCEMENT ===
- Treat every zone boundary AND every fold line (dust-flap fold, both rail folds, bottom-tuck fold) as a hard wall. No element, ornament, glow, character, limb, wheel, bumper, antenna, shadow, sparkle, or bloom may cross a fold line or spill from one zone into another.
- The central hero zone [0.10,0.43,0.80,0.24] is a sealed container. The truck and all 10 characters, including every limb, hand, leaf, tail, and prop, must be FULLY CONTAINED inside that box. Nothing in the hero scene may touch or overlap the GIVEAWAY ribbon above it, the winged-M medallion below it, or either side rail. If the ensemble does not fit, scale the ensemble DOWN to fit — never enlarge the zone, never push content past its edges.
- The side rails must remain unbroken full-height bands at the extreme edges; do not let the hero scene, headline, or background art overrun them. The bottom tuck flap must remain present, curved, and rounded; do not flatten or delete it.

=== STYLE CHANGE (apply to the WHOLE panel, geometry untouched) ===
Re-render the ENTIRE panel as a unified glossy high-fidelity 3D image — Pixar / Cinema 4D / Octane, rich global illumination, soft cinematic depth — in a MIAMI-VICE retro-80s NEON aesthetic. Completely REMOVE the black-chrome Von-Dutch pinstripe look: drop all black chrome and all pinstripe lattice as a color/material treatment and re-skin those same shapes as luminous neon-and-gold 3D ornament. Palette: deep navy-purple base, magenta-to-orange sunset gradient, teal/cyan neon accents, glowing gold. Background mood (behind and around the ornament, never crossing into other zones): subtle retro-Miami sunset with palm and skyline silhouettes and a faint neon grid, kept dim so the gold ornament and the hero zone read clearly. Keep all text crisp and legible.

=== TEXT (verbatim, correctly spelled, same positions as image 0) ===
- "FORD" / "F-150 XLT" (headline, two lines)
- "GIVEAWAY" (gold ribbon)
- "ALL-IN-ONE"
- "100 UNITS | 10 CASES | 10 STRAINS" (pipe separators)
- 21+ fine print line (small)
- Inverted tagline on the top dust flap (small)
The TOP MUHA MEMBERS logo is an IMAGE, not text you type — reproduce it exactly from the logo reference (it already includes its own "Members" wordmark). Do NOT type the words "MUHA MEMBERS" or "MUHA" anywhere as separate rendered text. No other text. No Von Dutch wordmark anywhere. Spell everything exactly as written.

=== HERO ZONE CONTENT (the only new content) ===
Inside the central hero zone ONLY: the Ford F-150 XLT (glossy blackout pickup, the prize) with the 10 Muha fruit-drama characters gathered around and in front of it as an excited ensemble — characters are the heroes, the truck is the trophy behind them. Render all 10 as distinct Pixar-3D fruit-headed figures at consistent scale; exactly ONE blueberry-blue character; no duplicates, no extra figures. Keep the whole ensemble fully inside the hero-zone box.

NEGATIVE: no layout change, no zone moved or resized, no cropping/zooming, no aspect-ratio change, no missing side rails, no missing bottom tuck flap, no content crossing fold lines, no truck or character overlapping the headline / ribbon / medallion / rails, no black chrome, no Von-Dutch pinstripe style, no Von Dutch text, no duplicate characters, no extra brands, no phone numbers / URLs / barcodes / dates, no misspellings. Do NOT garble, redraw, recolor, or neon-ify the Muha Members logo; do NOT add a separate "MUHA MEMBERS" or "MUHA" text label near it — composite the logo reference exactly as-is.`;

const SIZE = "1024x1536"; // portrait ~0.66:1 to match the template dieline

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "1");

// image 0 = structural ground truth (v5 front), then logo, truck, crest, 10 chars
form.append("image[]", new Blob([fs.readFileSync(STRUCT_REF)], { type: "image/png" }), "00-structure-ground-truth.png");
form.append("image[]", new Blob([fs.readFileSync(LOGO_REF)], { type: "image/png" }), "MMembers-Logo.png");
form.append("image[]", new Blob([fs.readFileSync(TRUCK_REF)], { type: "image/png" }), "truck-front.png");
form.append("image[]", new Blob([fs.readFileSync(CREST_REF)], { type: "image/png" }), "mm-gold-crest.png");
for (const charFile of CHARACTERS) {
  const buf = fs.readFileSync(path.join(CHAR_DIR, charFile));
  form.append("image[]", new Blob([buf], { type: "image/png" }), charFile);
}

console.log("Generating Master Case v11 FRONT (logo composited exactly, no garbled wordmark)...");
const res = await fetch("https://api.openai.com/v1/images/edits", {
  method: "POST",
  headers: { Authorization: `Bearer ${API_KEY}` },
  body: form,
});
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`);
  process.exit(1);
}
const data = await res.json();
const item = (data.data || [])[0];
if (!item?.b64_json) { console.error("no b64_json"); process.exit(1); }

const outDir = "AI Fruit VIdeos Muha/Master Case Designs";
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = `${outDir}/${stamp}_muha-mastercase-v11-FRONT.png`;
fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${outPath}`);
