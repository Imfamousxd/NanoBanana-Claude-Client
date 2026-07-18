#!/usr/bin/env node
// Edit the Members Only Giveaway poster — consolidate "MEMBERS / ONLY / GIVEAWAY" 3-line stack into "MEMBERS ONLY" (1 line) + "GIVEAWAY" (below).
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
const SRC = "Muha Giveaway Redesigned/Members Only Giveaway/2026-06-01T21-39-13_members-only-giveaway-2line.png";

const PROMPT = `Edit this poster — make the central headline text BIGGER and clean up the overall placement. Keep everything else identical (Muha M monogram, star row, gold rules, subhead, red Dodge Challenger, smoke, background).

CURRENT TEXT LAYOUT (in the source): hero text is on TWO lines reading "MEMBERS ONLY" on top + "GIVEAWAY" below. Currently sized too small for the canvas space.

EDIT — make the hero text BIGGER and tighter:
- Line 1: "MEMBERS ONLY" — render this in BIG chunky uppercase gold textured display serif lettering, both words on ONE single line, side-by-side with a normal space between them. Make this line significantly LARGER than the current rendering — it should fill roughly 85-90% of the canvas width and feel bold and dominant.
- Line 2: "GIVEAWAY" — directly beneath "MEMBERS ONLY", in the SAME big chunky gold display style, sized to match approximately the same overall width as "MEMBERS ONLY" above it (so both lines visually align in width). Bold and dominant.

The two lines together form a tight, balanced two-line headline block — minimal gap between lines, both lines roughly the same width across, both BIG and POWERFUL.

CLEAN PLACEMENT:
- Move the headline block UP slightly so it sits closer to the "MUHA MEMBERS // EXCLUSIVE" subhead with comfortable but tight spacing (~30-40 px between the subhead's bottom rule and the top of "MEMBERS ONLY").
- The headline block sits comfortably in the upper-middle of the canvas with clear breathing room above (between star-row/subhead and the headline) and below (between "GIVEAWAY" and the top of the Dodge Challenger).
- Both headline lines centered horizontally.
- The Dodge Challenger stays at the bottom in the same position.

Typography style preserved EXACTLY: chunky uppercase bold display serif, warm gold cream-textured letterfill, subtle inner-glow / texture, soft red-black ambient halo. Same look as the original — just bigger and better-placed.

Keep EVERYTHING ELSE identical from the source:
- The gold Muha "M" monogram at the top
- The star row beneath it
- The thin gold rules above and below "MUHA MEMBERS // EXCLUSIVE" subhead
- The subhead text and styling
- The red Dodge Challenger FRONT view at the bottom (glowing headlights, smoke around it)
- The dark moody black background, wet asphalt reflection
- The aspect ratio and overall dimensions

Output a single edited image at the same dimensions as the input.`;

function mimeForExt(ext) {
  return { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" }[ext.toLowerCase()] || "image/png";
}

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", "1024x1536");
form.append("quality", "high");
form.append("n", "1");
const buf = fs.readFileSync(SRC);
form.append("image[]", new Blob([buf], { type: mimeForExt(path.extname(SRC)) }), path.basename(SRC));

console.log("Editing poster: collapse MEMBERS / ONLY / GIVEAWAY to MEMBERS ONLY / GIVEAWAY...");
const res = await fetch("https://api.openai.com/v1/images/edits", {
  method: "POST",
  headers: { Authorization: `Bearer ${API_KEY}` },
  body: form,
});
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);
  process.exit(1);
}
const data = await res.json();
const item = (data.data || [])[0];
if (!item?.b64_json) { console.error("no b64_json"); process.exit(1); }

const outDir = "Muha Giveaway Redesigned/Members Only Giveaway";
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = `${outDir}/${stamp}_members-only-giveaway-2line-bigger.png`;
fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${outPath}`);
