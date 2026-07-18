#!/usr/bin/env node
// UFC partnership page hero v2 — REAL Dialed Labs products (from site photos) placed
// in the dark MMA training facility scene. Nano Banana Pro for reference fidelity.
import fs from "fs";
import path from "path";
for (const line of fs.readFileSync(".env", "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const DIR = "email_campaigns/dialed_labs/airbnb_outreach/catalog/images";
const REFS = [`${DIR}/pro-pod.jpg`, `${DIR}/barrel-sauna.jpg`];

const PROMPT =
  "Create a cinematic wide photograph inside a dark elite MMA training facility at night. " +
  "Place the EXACT cold plunge from reference image 1 (matte-black Dialed Pro Pod with wood-top corner, ventilation grilles, and its UFC | DIALED LABS branding, reproduced faithfully) in the left foreground with faint cold mist rising from it. " +
  "Place the EXACT barrel sauna from reference image 2 (black-bodied Dialed barrel sauna with circular glass door and warm-lit wooden interior, reproduced faithfully) on the right, its interior glowing warm amber. " +
  "Behind them, an octagonal MMA training cage blurred deep in the background under dramatic overhead rim lighting. Ember-orange light spilling from the sauna side, ice-blue ambient light on the plunge side, light haze in the air, deep blacks, premium sports-recovery editorial photography. " +
  "Keep both products' proportions, materials and branding exactly as in the references. No people, no faces, no added text or logos beyond what is printed on the two products, no watermarks.";

function part(fp) {
  return { inline_data: { mime_type: "image/jpeg", data: fs.readFileSync(fp).toString("base64") } };
}

async function gen(i) {
  const body = {
    contents: [{ parts: [...REFS.map(part), { text: PROMPT }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "16:9", imageSize: "2K" } },
  };
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent",
    { method: "POST", headers: { "x-goog-api-key": process.env.GEMINI_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );
  if (!res.ok) { console.log(`c${i} API ${res.status}: ${(await res.text()).slice(0, 200)}`); return; }
  const parts = (await res.json()).candidates?.[0]?.content?.parts || [];
  for (const p of parts) {
    if (p.inlineData) {
      fs.writeFileSync(`${DIR}/ufc_recovery_v2_c${i}.png`, Buffer.from(p.inlineData.data, "base64"));
      console.log(`SAVED ufc_recovery_v2_c${i}.png`);
      return;
    }
  }
  console.log(`c${i}: no image`);
}

await Promise.all([gen(1), gen(2)]);
console.log("DONE");
