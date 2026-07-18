#!/usr/bin/env node
// Regenerate the email lifestyle imagery anchored to REAL Dialed Labs products
// (site product photos passed as references; NB Pro for likeness fidelity).
import fs from "fs";
for (const line of fs.readFileSync(".env", "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const BASE = "email_campaigns/dialed_labs/airbnb_outreach";
const CAT = `${BASE}/catalog/images`;
const OUT = `${BASE}/assets`;

const KEEP =
  "Reproduce the product's exact proportions, materials, colors and any printed branding faithfully from the reference. Photorealistic premium editorial photography, deep blacks, cinematic. No people, no faces, no added text or logos beyond what is printed on the product, no watermarks.";

const JOBS = [
  {
    out: "hero_sauna_cabin.png",
    refs: [`${CAT}/barrel-sauna.jpg`],
    prompt:
      "Place the EXACT barrel sauna from reference image 1 (black-hooped Dialed barrel sauna with circular tempered-glass door and warm wooden interior) on the wooden deck of an upscale A-frame cabin vacation rental at dusk. Its interior glows warm amber through the round glass door, subtle string lights on the cabin, tall pine forest and deep blue twilight sky behind. Aspirational short-term-rental listing photography. " +
      KEEP,
  },
  {
    out: "hero_plunge_patio.png",
    refs: [`${CAT}/vplunge-black.jpg`],
    prompt:
      "Place the EXACT vertical cold plunge from reference image 1 (matte-black cylindrical Dialed plunge tub with integrated wooden staircase and stainless handrails) on the stone patio of a luxury minimalist desert vacation rental at blue hour. Faint cold mist rising from the open top, cool ice-blue ambient light, warm interior house glow in the background, agave plants. " +
      KEEP,
  },
  {
    out: "pod_sauna_interior.png",
    refs: [`${CAT}/smart-pod.jpg`],
    prompt:
      "Place the EXACT smart pod sauna from reference image 1 (compact Dialed wooden pod sauna with dark shingled roof, glass front and interior bench) on the covered back patio of a modern vacation rental in the evening, its interior glowing warm from within, soft landscape lighting around it, dark moody dusk ambiance. " +
      KEEP,
  },
  {
    out: "redlight_panel.png",
    refs: [`${CAT}/rl-vertical.jpg`],
    prompt:
      "Place the EXACT vertical red light therapy bed from reference image 1 (black Dialed walk-in redlight booth with gold Dialed Labs mark, glowing red-orange light from its interior) against the wall of a dark modern home wellness room, its red glow washing across a wooden bench and dark slat wall beside it. Premium recovery-room photography. " +
      KEEP,
  },
];

function part(fp) {
  return { inline_data: { mime_type: "image/jpeg", data: fs.readFileSync(fp).toString("base64") } };
}

async function gen(job) {
  const body = {
    contents: [{ parts: [...job.refs.map(part), { text: job.prompt }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "3:2", imageSize: "2K" } },
  };
  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent",
    { method: "POST", headers: { "x-goog-api-key": process.env.GEMINI_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );
  if (!res.ok) { console.log(`[${job.out}] API ${res.status}: ${(await res.text()).slice(0, 200)}`); return; }
  const parts = (await res.json()).candidates?.[0]?.content?.parts || [];
  for (const p of parts) {
    if (p.inlineData) {
      fs.writeFileSync(`${OUT}/${job.out}`, Buffer.from(p.inlineData.data, "base64"));
      console.log(`SAVED ${job.out}`);
      return;
    }
  }
  console.log(`[${job.out}] no image`);
}

await Promise.all(JOBS.map(gen));
console.log("DONE");
