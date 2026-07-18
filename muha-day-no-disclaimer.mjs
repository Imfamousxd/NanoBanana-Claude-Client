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
const SRC_DIR = "Muha Giveaway Redesigned/Disclaimer Styled";
const FINAL_DIR = "Muha Giveaway Redesigned/Final";

const TARGETS = ["1 day.png", "3 day.png"];

const PROMPT = `Edit this poster: REMOVE the bottom disclaimer line entirely — currently reads "★ SEE OFFICIAL RULES IN APP OR AT MUHAMEMBERS.COM ★" with flanking gold stars. Delete the entire disclaimer bar from the bottom of the canvas. Replace it with the same dark Miami nightscape atmospheric background (palm trees / neon / wet street) so the bottom of the canvas continues the scene cleanly with no text.

Keep EVERYTHING ELSE identical: the headline (e.g. "1 DAY LEFT" or "3 DAYS LEFT"), the subtitle line (e.g. "LAST CHANCE TO ENTER" or "NO TURNING BACK"), the row of gold five-point stars at the top, the gold Muha 'M' monogram, the red Dodge Challenger, Miami nightscape, palm trees, neon, atmosphere, color palette, typography, lighting, and aspect ratio.

Output a single edited image at the same dimensions as the input.`;

function mimeForExt(ext) {
  return { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" }[ext.toLowerCase()] || "image/png";
}

async function editOne(filename) {
  const src = path.join(SRC_DIR, filename);
  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", PROMPT);
  form.append("size", "2560x3200");
  form.append("quality", "high");
  form.append("n", "1");
  const buf = fs.readFileSync(src);
  form.append("image[]", new Blob([buf], { type: mimeForExt(path.extname(src)) }), path.basename(src));
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form,
  });
  if (!res.ok) {
    return { ok: false, error: `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}` };
  }
  const data = await res.json();
  const item = (data.data || [])[0];
  if (!item?.b64_json) return { ok: false, error: "no b64_json" };
  fs.writeFileSync(src, Buffer.from(item.b64_json, "base64"));
  fs.copyFileSync(src, path.join(FINAL_DIR, filename));
  return { ok: true };
}

console.log(`Editing ${TARGETS.length} day posters (no disclaimer)...`);
for (const t of TARGETS) {
  console.log(`→ ${t}`);
  const r = await editOne(t);
  if (r.ok) console.log(`  ✓ ${t}`);
  else console.log(`  ✗ ${t}: ${r.error}`);
}
