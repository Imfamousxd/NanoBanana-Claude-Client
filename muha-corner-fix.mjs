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
const OUT_DIR = "Muha Giveaway Redesigned/Disclaimer Styled";

const TARGETS = ["content 3.png"];

const PROMPT = `Edit this poster: REMOVE the small Art-Deco gold ornamental corner flourishes / corner brackets / corner decorations from all four corners of the canvas. The corners should be clean — no decorative geometric ornaments, no gold L-shaped brackets, no corner flourishes of any kind.

Keep EVERYTHING ELSE in the image identical: same Muha 'M' monogram, same "GIVEAWAY" headline + "Vice City" cursive script, same red Dodge Challenger, same phone screenshots with all their text exactly as shown, same QR code, same step labels and captions, same disclaimer text "See official rules in app or at muhamembers.com", same Miami nightscape background, same color palette, same lighting, same composition, same aspect ratio.

Output a single edited image at the same dimensions as the input.`;

function mimeForExt(ext) {
  return { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" }[ext.toLowerCase()] || "image/png";
}

async function editOne(filename) {
  const src = path.join(OUT_DIR, filename);
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
  return { ok: true };
}

console.log(`Removing corner ornaments from ${TARGETS.length} images...`);
for (const t of TARGETS) {
  console.log(`→ ${t}`);
  const r = await editOne(t);
  if (r.ok) console.log(`  ✓ ${t}`);
  else console.log(`  ✗ ${t}: ${r.error}`);
}
