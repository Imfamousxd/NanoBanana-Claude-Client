#!/usr/bin/env node
// Rebrand the "rythm" device with the Dialed Health logo.
//  Variant 1: pulse-line only on the black button + pulse on the vial
//  Variant 2: full DIALED HEALTH logo on the black button + pulse on the vial
import fs from "fs";
import path from "path";

for (const line of fs.readFileSync(".env", "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const OUT = "Dialed Rythm Rebrand";
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

const BASE = `${OUT}/_device_base.png`;
const REF_FULL = `${OUT}/_ref_logo_full_on_dark.png`;
const REF_PULSE = `${OUT}/_ref_pulse_only_on_dark.png`;

function part(fp) {
  const ext = path.extname(fp).toLowerCase();
  const mime = ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
  return { inline_data: { mime_type: mime, data: fs.readFileSync(fp).toString("base64") } };
}

const PRESERVE =
  "IMAGE 1 is a studio product photo of a white handheld recovery/therapy massage device: a large dark charcoal glossy CIRCULAR top button, and below it a clear plastic stem holding a small RED vial/cartridge. Reproduce this device EXACTLY as in IMAGE 1 — identical silhouette, proportions, white glossy body, dark button, clear stem, red vial, lighting, soft reflections, drop shadow, and the plain off-white background. Do NOT alter the device geometry or materials. The ONLY edits are the branding below. Keep it fully photorealistic: the new marking must look physically printed/embossed on the surface with matching perspective, gentle curvature and soft reflections.";

const NEG = "No misspellings, no extra text, no 'rythm' anywhere, no watermark, no logo on the white body.";

const VARIANTS = [
  {
    key: "v1-pulse",
    refs: [BASE, REF_PULSE],
    prompt:
      `${PRESERVE} ` +
      "CHANGE 1 — Big dark button: completely REMOVE the existing lowercase 'rythm' wordmark. In its place put ONLY the white heartbeat ECG pulse-line symbol from IMAGE 2 (a thin horizontal line with a single sharp central spike) — absolutely NO letters or words. Center it horizontally on the button at a similar size and position to where 'rythm' was, in clean crisp white, following the button's gentle curve with soft matching highlights. " +
      "CHANGE 2 — Small red vial on the stem: REMOVE the existing vertical white 'rythm' text and replace it with the SAME white heartbeat pulse-line symbol from IMAGE 2, scaled to sit neatly on the red label. " +
      NEG,
  },
  {
    key: "v2-fulllogo",
    refs: [BASE, REF_FULL],
    prompt:
      `${PRESERVE} ` +
      "CHANGE 1 — Big dark button: completely REMOVE the existing lowercase 'rythm' wordmark. In its place reproduce the FULL white 'DIALED HEALTH' logo from IMAGE 2 exactly as designed — the bold word 'DIALED' on the upper line and the thinner word 'HEALTH' on the lower line, joined by the horizontal heartbeat ECG line with one sharp spike between them. Keep the exact layout and letterforms; spell D-I-A-L-E-D and H-E-A-L-T-H. Center it on the button face, sized to sit comfortably inside the circle, clean crisp white, following the button's gentle curve with soft matching highlights. " +
      "CHANGE 2 — Small red vial on the stem: REMOVE the existing vertical white 'rythm' text and replace it with the SAME full white 'DIALED HEALTH' logo from IMAGE 2 so it matches the button. The vial is small and narrow, so scale the logo down and lay it out to fit legibly on the red label (stack 'DIALED' above 'HEALTH' with the heartbeat line if needed). Clean crisp white, spelled exactly D-I-A-L-E-D and H-E-A-L-T-H. " +
      NEG,
  },
];

const CANDIDATES = 2;

async function gen(variant, idx) {
  const body = {
    contents: [{ parts: [...variant.refs.map(part), { text: variant.prompt }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "9:16", imageSize: "2K" } },
  };
  const res = await fetch(URL, {
    method: "POST",
    headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.log(`  [${variant.key} c${idx}] API ${res.status}: ${(await res.text()).slice(0, 300)}`);
    return null;
  }
  const json = await res.json();
  const parts = json.candidates?.[0]?.content?.parts || [];
  for (const p of parts) {
    if (p.text) console.log(`  [${variant.key} c${idx}] model: ${p.text.slice(0, 120)}`);
    if (p.inlineData) {
      const fp = `${OUT}/${stamp}_${variant.key}_c${idx}.png`;
      fs.writeFileSync(fp, Buffer.from(p.inlineData.data, "base64"));
      console.log(`  SAVED ${fp}`);
      return fp;
    }
  }
  console.log(`  [${variant.key} c${idx}] no image returned`);
  return null;
}

const jobs = [];
for (const v of VARIANTS) for (let i = 1; i <= CANDIDATES; i++) jobs.push(gen(v, i));
const saved = (await Promise.all(jobs)).filter(Boolean);
console.log("\nDONE. Saved:", saved.length);
saved.forEach((f) => console.log(" ", f));
fs.writeFileSync(`${OUT}/_last_saved.json`, JSON.stringify(saved, null, 2));
