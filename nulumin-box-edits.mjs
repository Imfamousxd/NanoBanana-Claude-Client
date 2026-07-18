#!/usr/bin/env node
// Surgical NB edits on the best render per kit — keep everything, fix listed defects only.
import fs from "fs";
import path from "path";
for (const line of fs.readFileSync(".env", "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const DIR = "NuLumin Influencer Box";
const V1 = "2026-07-08T01-41-41";

const COA_FIX = `redraw the white tilted "Certificate of Analysis" panel printed on the lid so it matches reference image 2 EXACTLY, 1:1 — the same tilted white certificate card with headline "Certificate of Analysis", compound "BPC-157", CAS and MW line, LOT "NH-2604-A-018", SYNTH DATE "2026-04-22", HPLC PURITY "99.2%", MS "1419.5 [M+H]+", APPEARANCE "White lyophilized powder", STORAGE "-20 °C, desiccated", the italic "A. Reyes, QC Analyst" signature line, the green "RESEARCH GRADE / BATCH VERIFIED - LOT 018" sticker at top left, the red "MADE IN U·S·A / NOBLE HARBOR · CA" sticker at top right and the gold "CERTIFIED" seal at bottom right — every word sharp, correctly spelled and legible at print quality`;

const JOBS = [
  {
    slug: "jacked_v3",
    base: "refs/base_jacked.jpg",
    prompt: `Reference image 1 is a finished studio product photograph of an open NuLumin influencer box. Reproduce it EXACTLY — same box, same violet "[ JACKED ]" insert, same four NuLumin cartons in their cutouts, same product labels under the cutouts, same camera angle, same lighting on the box — with exactly TWO changes and nothing else:
(1) Replace the ENVIRONMENT around the box: remove all visible photography equipment (softboxes, stands, dark shapes) and place the box on a pure, empty, seamless warm light-grey studio sweep filling the whole frame, keeping the soft shadow under the box.
(2) ${COA_FIX}.
Do not change the insert, cartons, their printed labels, the lid headline or anything else.`,
  },
  {
    slug: "adameve_v3",
    base: "refs/base_adameve.jpg",
    prompt: `Reference image 1 is a finished studio product photograph of an open NuLumin influencer box. Reproduce it EXACTLY — same box, same pink "Adam & Eve" insert, same three NuLumin cartons in their cutouts (Selank, PT-141, KissPeptin), same product labels under the cutouts, same background, same camera angle, same lighting — with exactly ONE change and nothing else:
(1) ${COA_FIX}.
Do not change anything else in the image.`,
  },
  {
    slug: "shed_v3",
    base: "refs/base_shed.jpg",
    prompt: `Reference image 1 is a finished studio product photograph of an open NuLumin influencer box. Reproduce it EXACTLY — same box, same golden-yellow "shed" insert, same three NuLumin cartons in their cutouts, same product labels under the cutouts ("GLP-3(R)", "Tesamorelin", "CJC-1295"), same background, same camera angle, same lighting — with exactly TWO changes and nothing else:
(1) The MIDDLE carton currently shows the wrong product name: change the printed name on the middle carton's front from "GLP-3 (R) 12mg" to "Tesamorelin 10mg" in the same script typeface, and give its category tab and label accents the same golden-yellow color as the first carton's — so the middle carton correctly reads "Tesamorelin".
(2) ${COA_FIX}.
Do not change anything else in the image.`,
  },
];

function part(p) {
  const data = fs.readFileSync(p).toString("base64");
  const mime = p.endsWith(".jpg") ? "image/jpeg" : "image/png";
  return { inline_data: { mime_type: mime, data } };
}

async function run(job) {
  const body = {
    contents: [{ parts: [part(path.join(DIR, job.base)), part(path.join(DIR, "refs", "coa_ref.png")), { text: job.prompt }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "4:5", imageSize: "4K" } },
  };
  console.log(`→ ${job.slug}...`);
  let res;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
        method: "POST", headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      break;
    } catch (e) {
      console.log(`  ${job.slug} fetch failed (${e.cause?.code || e.message}), attempt ${attempt}/3`);
      if (attempt === 3) return;
      await new Promise(r => setTimeout(r, 10000));
    }
  }
  if (!res.ok) { console.error(`  ${job.slug} API ${res.status}: ${(await res.text()).slice(0, 300)}`); return; }
  const json = await res.json();
  for (const p of json.candidates?.[0]?.content?.parts || []) {
    if (p.inlineData) {
      const out = path.join(DIR, `box_${job.slug}.png`);
      fs.writeFileSync(out, Buffer.from(p.inlineData.data, "base64"));
      console.log(`  ✓ ${out}`);
      return;
    }
  }
  console.error(`  ${job.slug}: no image — ${JSON.stringify(json).slice(0, 200)}`);
}

const want = process.argv.slice(2);
const jobs = want.length ? JOBS.filter(j => want.includes(j.slug)) : JOBS;
for (const j of jobs) await run(j);
console.log("Done.");
