#!/usr/bin/env node
// True mask-based inpaint via gpt-image-2 /v1/images/edits.
// - Source: trio-cans.png (preserved outside the mask)
// - Mask: trio-mask.png (transparent rectangles over the 3 can interiors)
// - Output: ingredients fill ONLY the transparent regions; everything else is
//   preserved pixel-faithfully by the model.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";

const SRC = "Dialed Moods L-Doba Generations/Trio/trio-cans.png";
const MASK = "Dialed Moods L-Doba Generations/Trio/trio-mask.png";
const DST = "Dialed Moods L-Doba Generations/Trio/trio-ingredients-masked.png";

const PROMPT = `In the masked transparent regions (the three can-body areas), render photoreal floating ingredients suspended in mid-air with NOTHING surrounding them (no can body, no glass cylinder, no white surface — just the ingredient items themselves hanging in air).

Per-region ingredient mix (left to right in the image):
- LEFT region (back-left, Black Cherry Vanilla can position): vivid purple-violet mucuna L-Dopa flower clusters on green stems with leaves + scattered raw brown coffee beans + an abundant pile of glossy dark black cherries with stems + two or three whole vanilla bean pods (long dark brown).
- CENTER region (front, Lemonade can position): purple mucuna flower clusters + coffee beans + several fresh lemons (one whole + halved lemons showing juicy yellow flesh and small seeds).
- RIGHT region (back-right, Blue Glacier can position): purple mucuna flower clusters + coffee beans + abundant plump fresh blueberries with their natural silvery bloom.

Mucuna rule: vivid purple-violet drooping flower racemes on green stems with green leaves — NO velvet pods, NO long curved purple seed pods, NO cheeto-shaped purple objects, NO bean-pod shapes. Only flower clusters with stems and leaves.

Rendering: photoreal ingredients, hyper-realistic, glossy crisp finish, sharp lighting matching the surrounding scene's bright soft diffused studio lighting. NO white solid blob, NO powder mound, NO can body of any kind, NO DIALED logo or label artwork — just the colored ingredient items individually floating in the open transparent regions.`;

console.log(`Using ${MODEL} with mask...`);

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", "3072x2304");  // 4:3 aspect at near-max gpt-image-2 res
form.append("quality", "high");
form.append("n", "1");
form.append("image[]", new Blob([fs.readFileSync(SRC)], { type: "image/png" }), "trio-cans.png");
form.append("mask", new Blob([fs.readFileSync(MASK)], { type: "image/png" }), "trio-mask.png");

const res = await fetch("https://api.openai.com/v1/images/edits", {
  method: "POST",
  headers: { Authorization: `Bearer ${API_KEY}` },
  body: form,
});
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`); process.exit(1); }
const data = await res.json();
for (const item of data.data || []) {
  if (item.b64_json) {
    fs.writeFileSync(DST, Buffer.from(item.b64_json, "base64"));
    console.log(`✓ ${DST}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
