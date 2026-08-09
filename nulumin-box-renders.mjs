#!/usr/bin/env node
// NuLumin influencer box — studio renders, one per insert design (NuLumin-inserts_A.pdf).
// Nano Banana Pro, refs = real open-box photo (geometry/lid) + insert design crop. 4:5, 4K.
// usage: node nulumin-box-renders.mjs <kit|all> [kit...]
import fs from "fs";
import path from "path";
for (const line of fs.readFileSync(".env", "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const REFS = "NuLumin Influencer Box/refs";
const OUT = "NuLumin Influencer Box";
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

const KITS = [
  {
    slug: "jacked", insert: "insert_jacked.png", color: "muted violet-purple",
    title: '"[ JACKED ]" in white monospaced capitals with square brackets',
    slots: ["CJC-1295 + Ipamorelin Blend", "Tesamorelin", "AOD-9604", "KissPeptin"],
  },
  {
    slug: "adameve", insert: "insert_adameve.png", color: "vivid magenta-pink",
    title: '"Adam & Eve" in elegant white serif with a decorative ampersand',
    slots: ["Selank", "PT-141", "KissPeptin"],
  },
  {
    slug: "reverseglow", insert: "insert_reverseglow.png", color: "fresh medium green",
    title: '"REVERSE GLOW" in bold white capitals',
    slots: ["Glow Blend", "NAD+", "Epithalon", "Melanotan II"],
  },
  {
    slug: "shed", insert: "insert_shed.png", color: "warm golden yellow",
    title: '"shed" in bold white lowercase with a short white underline',
    slots: ["GLP-3(R)", "Tesamorelin", "CJC-1295"],
  },
  {
    slug: "supercharge", insert: "insert_supercharge.png", color: "bright sky blue",
    title: '"SUPER·CHARGE" in bold white italic capitals with a short white underline',
    slots: ["Klow Blend", "MOTS-C", "NAD+"],
  },
];

function makePrompt(k) {
  const n = k.slots.length;
  const slotList = k.slots.map((s, i) => `${i + 1}. "${s}"`).join("  ");
  const cartonMap = k.slots.map((s, i) => `the carton in opening ${i + 1} is labeled "${s}"`).join("; ");
  return `Ultra-high-quality professional studio product photograph, photorealistic.

Reference image 1 is an approved studio render of the NuLumin Bio-Sciences influencer presentation box. Recreate the box with EXACTLY the same camera angle, perspective, box position, opening angle and premium soft lighting as reference image 1 — a matte white rigid magnetic gift box standing open, photographed from that same slightly elevated three-quarter front angle. Change the BACKGROUND to a pure WHITE seamless studio sweep — bright, airy, clean white filling the entire frame edge to edge, with only a soft neutral shadow under the box. Absolutely NO studio equipment, props or clutter anywhere. Editorial product photography, tack sharp, high-end catalog quality. Keep the outer box matte white with the color-block spectrum stripe on the edge.

The INSIDE OF THE LID uses the NEW printed artwork shown in reference image 2 — reproduce this lid design EXACTLY (ignore any thin colored guide lines in reference 2, they are print guides, not part of the design): the spectrum band of five solid color blocks (violet, blue, green, yellow, pink) along the hinge edge; a soft lilac-to-white gradient field; on the left the headline "A New Light in" in violet-blue and "Peptide Research" in orange-to-green gradient; beneath the headline four small feature items arranged in two columns, each with a tiny icon and two lines of dark text: a blue flask icon with "3rd-Party Lab Tested" / "≥99% Verified Purity", a small US flag icon with "Made in USA" / "Quality Verified", a violet document icon with "Public COA's" / "Documentation on every order", and a yellow shipping icon with "Fast Shipping" / "Same-Day Dispatch". On the right side of the lid: the tilted white Certificate of Analysis card shown clean and sharp in reference image 4 — reproduce that certificate EXACTLY 1:1: headline "Certificate of Analysis", compound "GLP-3 (R)", "CAS · 2381089-83-2   MW · 4731.34", LOT "NH-2606-C-063", SYNTH DATE "2026-06-25", HPLC PURITY "99.2%", MS (M/Z) "4732.3 [M+H]+", APPEARANCE "White lyophilized powder", STORAGE "-20 °C, desiccated", italic signature "A. Reyes, QC Analyst" — with the green "RESEARCH GRADE" sticker at its top left, the red "MADE IN U·S·A" sticker at its top right and the gold "CERTIFIED" seal overlapping its lower right. Every word on the lid must be sharp, correctly spelled and legible at print quality.

The base tray holds the insert design shown in reference image 3, reproduced faithfully: a flat printed ${k.color} paper insert filling the base, with the kit title ${k.title} centered at the top of the insert, and ${n} rounded-top rectangular die-cut openings in a row. IMPORTANT: every one of the ${n} cutouts is FILLED with a white NuLumin Bio-Sciences retail peptide box sitting snugly in the opening, exactly like the boxes shown in reference image 3 — small white cartons with the vertical rainbow spectrum micro-stripe, the "NuLumin BIO-SCIENCES" logo at top, the product name and dose in colored script with a small colored category tab, a faint vial illustration, and "Purity ≥ 99% / Research Use Only" fine print. Each carton's printed product name MUST match its slot: ${cartonMap}. No two cartons show the same product name. Under the cutouts, print the product names in clean white sans-serif, one centered directly under each opening, reading left to right: ${slotList}. Spell every product name EXACTLY as written; no other text, no misspellings, no invented labels, no empty cutouts.`;
}

function ref(p) {
  const data = fs.readFileSync(path.join(REFS, p)).toString("base64");
  const mime = p.endsWith(".jpg") ? "image/jpeg" : "image/png";
  return { inline_data: { mime_type: mime, data } };
}

import { execFileSync } from "child_process";
import os from "os";

async function gen(k) {
  const body = {
    contents: [{ parts: [ref("base_adameve.jpg"), ref("lid_art_new.png"), ref(k.insert), ref("coa_glp3_ref.jpg"), { text: makePrompt(k) }] }],
    generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "4:5", imageSize: "4K" } },
  };
  console.log(`→ ${k.slug}...`);
  const reqFile = path.join(os.tmpdir(), `nb_req_${k.slug}.json`);
  const resFile = path.join(os.tmpdir(), `nb_res_${k.slug}.json`);
  fs.writeFileSync(reqFile, JSON.stringify(body));
  try {
    execFileSync("curl", ["-s", "--max-time", "900", "-X", "POST",
      "-H", `x-goog-api-key: ${API_KEY}`, "-H", "Content-Type: application/json",
      "--data-binary", `@${reqFile}`, "-o", resFile,
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`]);
  } catch (e) { console.error(`  ${k.slug} curl failed: ${e.message.slice(0, 200)}`); return; }
  const json = JSON.parse(fs.readFileSync(resFile, "utf-8"));
  if (json.error) { console.error(`  ${k.slug} API error: ${JSON.stringify(json.error).slice(0, 300)}`); return; }
  let saved = false;
  for (const part of json.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const out = path.join(OUT, `box_${k.slug}_${stamp}.png`);
      fs.writeFileSync(out, Buffer.from(part.inlineData.data, "base64"));
      console.log(`  ✓ ${out}`);
      saved = true;
    }
  }
  if (!saved) console.error(`  ${k.slug}: no image returned — ${JSON.stringify(json).slice(0, 300)}`);
}

const want = process.argv.slice(2);
const run = want.includes("all") || want.length === 0 ? KITS : KITS.filter(k => want.includes(k.slug));
for (const k of run) await gen(k);   // sequential — NB 4K is heavy
console.log("Done.");
