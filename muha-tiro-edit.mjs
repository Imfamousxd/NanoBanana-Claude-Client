#!/usr/bin/env node
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
const SRC = "Muha Giveaway Redesigned/Disclaimer Styled/Time is Running Out.png";

const PROMPT = `Edit this poster with TWO changes:

1. The subtitle line beneath the "TIME IS RUNNING OUT" headline: currently reads "WINNER ANNOUNCED SOON" — change it to read exactly "ANNOUNCED SOON" (drop "WINNER"). Keep same typography, color, letter-spacing, centering, size, position. Keep the gold underline rule beneath the subtitle if present.

2. REMOVE the bottom disclaimer line entirely — currently reads "★ SEE OFFICIAL RULES IN APP OR AT MUHAMEMBERS.COM ★" with flanking gold stars. Delete the entire disclaimer bar from the bottom of the canvas. Replace it with the same dark Miami nightscape atmospheric background (palm trees / neon / wet street) so the bottom of the canvas has a clean continuation of the scene with no text.

Keep EVERYTHING ELSE identical: the gold Muha 'M' monogram, the gold star row, the chunky cream "TIME IS RUNNING OUT" headline with its bevel/glow treatment, the red Dodge Challenger, the Miami nightscape, palm trees, neon, atmosphere, color palette, lighting, and the aspect ratio.

Output a single edited image at the same dimensions as the input.`;

function mimeForExt(ext) {
  return { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" }[ext.toLowerCase()] || "image/png";
}

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", "2560x3200");
form.append("quality", "high");
form.append("n", "1");
const buf = fs.readFileSync(SRC);
form.append("image[]", new Blob([buf], { type: mimeForExt(path.extname(SRC)) }), path.basename(SRC));

const res = await fetch("https://api.openai.com/v1/images/edits", {
  method: "POST",
  headers: { Authorization: `Bearer ${API_KEY}` },
  body: form,
});
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}
const data = await res.json();
const item = (data.data || [])[0];
if (!item?.b64_json) { console.error("no b64_json"); process.exit(1); }
fs.writeFileSync(SRC, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${SRC}`);
