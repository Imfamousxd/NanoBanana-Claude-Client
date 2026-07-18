#!/usr/bin/env node
// Stanton Prep Kit — STANDALONE product graphic (just the prep supplies, no label text/layout),
// on a clean seamless white studio background. Two arrangement variants. Opens in Preview.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const API_KEY = process.env.OPENAI_API_KEY;
const outDir = "Stanton Assets/Product Graphic";
fs.mkdirSync(outDir, { recursive: true });

const PRODUCTS = `A premium, tastefully styled PRODUCT RENDER of GENERIC, UNBRANDED sterile injection-prep supplies arranged together on a CLEAN SEAMLESS WHITE studio background (pure white, soft gradient floor, gentle realistic contact shadows, soft premium studio lighting, subtle shallow depth-of-field). Elevated product styling — NOT a clinical hospital-supply photo. Include ONLY these three product types and NOTHING else:
- plain U-100 INSULIN SYRINGES with the standard realistic ORANGE needle CAPS (a few, at varied heights);
- a clear glass VIAL with a metallic crimp cap and a CLEAN, SIMPLE white label with minimal on-brand text "Bacteriostatic Water for Injection, USP" (navy text with a small clinical-teal accent, tasteful, legible, NOT cluttered);
- a few white ALCOHOL PREP PAD sachets, each with a clean simple label "Sterile Alcohol Prep Pad" (navy/teal on white).
ABSOLUTELY NO luer-lock draw syringes, NO larger syringes, NO other items. The products carry NO big brand name and NO logo. Aside from the realistic ORANGE insulin needle caps (the one allowed color exception), everything stays on the clinical palette — navy #0F1C34, clinical teal #1A9AA6, steel gray, on white. The arrangement fills the frame as a confident hero composition, centered with clean white space around it. NO headline text, NO label layout, NO eyebrows, NO contents list, NO footer — JUST the product render on white.`;

const VARIANTS = [
  { slug: "a-fan", art: `ARRANGEMENT — a pleasing soft DIAGONAL FAN: the insulin syringes fanned with slight overlap, the vial standing upright as the centerpiece, two prep-pad sachets leaning nearby. Three-quarter elevated camera angle.` },
  { slug: "b-flatlay", art: `ARRANGEMENT — a tidy top-down FLAT-LAY: the syringes laid parallel on a slight diagonal, the vial and a couple of prep-pad sachets grouped beside them with even spacing. Clean overhead camera, crisp soft shadows.` },
];

const results = [];
for (const v of VARIANTS) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  console.log(`Generating Stanton product graphic: ${v.slug}...`);
  const PROMPT = `${PRODUCTS}\n\n${v.art}\n\nSquare composition, photoreal premium product render, clean seamless white background.`;
  const form = new FormData();
  form.append("model", "gpt-image-2"); form.append("prompt", PROMPT); form.append("size", "1024x1024"); form.append("quality", "high"); form.append("n", "1");
  const res = await fetch("https://api.openai.com/v1/images/generations", { method: "POST", headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "gpt-image-2", prompt: PROMPT, size: "1024x1024", quality: "high", n: 1 }) });
  if (!res.ok) { console.error(`HTTP ${res.status} (${v.slug}): ${(await res.text()).slice(0, 300)}`); continue; }
  const item = ((await res.json()).data || [])[0];
  if (!item?.b64_json) { console.error(`no image (${v.slug})`); continue; }
  const out = `${outDir}/${stamp}_stanton-product-${v.slug}.png`;
  fs.writeFileSync(out, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${out}`); results.push(out);
}
console.log(`\nDone — ${results.length}/${VARIANTS.length}`);
if (results.length) { try { execSync(`open -a Preview ${results.map(r => `"${r}"`).join(" ")}`); } catch {} }
