#!/usr/bin/env node
// Stanton BAC water label — take the APPROVED c1 and change ONLY the dose 10 mL -> 30 mL.
// Edit the approved image as ground truth, then crop to the exact 65x29 dieline (1536x685 @600dpi).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-image-2";
const SIZE = "1536x1024";       // 1536 wide matches 600dpi width of the 65mm label
const CROP_H = 685;             // 1536 * 29/65 = 685.3 -> exact 65:29 dieline @ ~600 DPI
const C1 = "Stanton Assets/BAC Water Label/2026-06-09T01-50-41_stanton-bac-A-band-top-c1.png";
const outDir = "Stanton Assets/BAC Water Label";

const PROMPT = `Here is an APPROVED, print-ready Stanton Medical Supply BACTERIOSTATIC WATER vial LABEL (reference image 1). Reproduce it EXACTLY — identical layout, identical TEAL top accent band, identical Stanton seal + "Stanton" / "MEDICAL SUPPLY" wordmark at left, identical large navy serif "BACTERIOSTATIC WATER", identical "0.9% Benzyl Alcohol Added", identical teal "Premium Lab-Grade Quality" tagline, identical "For Research Use Only" and "STANTON-MEDICAL-SUPPLY.COM" fine print, the same fonts, the same navy/teal/steel/white colors, the same thin navy hairline keyline, the same proportions, and the same PLAIN WHITE trim margins at the very top and very bottom.

THE ONE AND ONLY CHANGE: in the top teal band the dose callout currently reads "10 mL Multiple-Dose Vial" — change it to read EXACTLY "30 mL Multiple-Dose Vial" (a clean, correct "3"; same font, size, color and position). Change NOTHING else whatsoever.

Output a FLAT 2D printed label artwork (no 3D vial, no bottle, no photo), WIDE-SHORT letterbox proportion ~2.24:1, with the label content in a central band and plain solid white empty margins at top and bottom for trimming to the dieline. Spell exactly: "30 mL Multiple-Dose Vial".`;

fs.mkdirSync(outDir, { recursive: true });
const c1Buf = fs.readFileSync(C1);
const results = [];
for (const c of ["c1-30ml-a", "c1-30ml-b"]) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  console.log(`Generating ${c}...`);
  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", PROMPT);
  form.append("size", SIZE);
  form.append("quality", "high");
  form.append("n", "1");
  form.append("image[]", new Blob([c1Buf], { type: "image/png" }), "approved-c1.png");

  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST", headers: { Authorization: `Bearer ${API_KEY}` }, body: form,
  });
  if (!res.ok) { console.error(`HTTP ${res.status} (${c}): ${(await res.text()).slice(0, 400)}`); continue; }
  const item = ((await res.json()).data || [])[0];
  if (!item?.b64_json) { console.error(`no b64_json (${c})`); continue; }
  const fullPath = `${outDir}/${stamp}_stanton-bac-${c}.png`;
  fs.writeFileSync(fullPath, Buffer.from(item.b64_json, "base64"));
  console.log(`✓ ${fullPath}`);
  results.push(fullPath);
  const cropPath = `${outDir}/${stamp}_stanton-bac-${c}_dieline-65x29.png`;
  try {
    execSync(`sips -c ${CROP_H} 1536 "${fullPath}" --out "${cropPath}"`, { stdio: "ignore" });
    console.log(`✓ ${cropPath}`);
    results.push(cropPath);
  } catch (e) { console.error(`crop failed (${c})`); }
}
console.log(`\nDone — ${results.length} files`);
if (results.length) { try { execSync(`open -a Preview ${results.map(r => `"${r}"`).join(" ")}`); } catch {} }
