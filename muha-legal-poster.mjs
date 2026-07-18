#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const REF1 = "Muha Giveaway Redesigned/Disclaimer Styled/Muha Members Giveaway.png";
const OUT = "Muha Giveaway Redesigned/Disclaimer Styled/Legal Poster.png";

const PROMPT = `The reference image is the LOCKED aesthetic. Create an extended-format 9:16 portrait poster where the UPPER 60% reproduces the reference image's hero composition virtually unchanged, and the LOWER 40% adds a legal disclaimer block that flows from the same Miami-night atmosphere — like the same scene continuing downward into a fine-print zone.

UPPER 60% — clone the reference hero EXACTLY:
- Same Muha 'M' gold monogram at top
- Same gold star row under the monogram
- Same "CLASSIFIED // MUHA MEMBERS" tagline with thin gold hairlines above and below
- Same massive cream/beige condensed bold display headline reading: "$25,000 CASH" on one line, "+ DODGE CHALLENGER" stacked below — same chunky display sans typography, same warm cream color, same subtle red glow as the reference
- Same dramatic red Dodge Challenger muscle car sitting on the rain-slick wet street
- Same Miami nightscape backdrop: dense neon glow, palm trees flanking, city skyline silhouette, atmospheric red haze, deep moody black/maroon palette
- Same cinematic low-key lighting and rim light on the car
The hero must look like a near-identical poster to the reference — same typography character, same composition, same vibes, same red glow, same atmosphere. Do NOT make this section blander or simpler than the reference.

LOWER 40% — the legal disclaimer block, atmospherically continuous with the hero:
- The Miami atmosphere CONTINUES downward — palm-tree silhouettes still visible faintly at the edges, neon glow bleeding through, rain-slick reflections still present, just darker and dimmer to let the text be readable
- A divider band: thin gold horizontal hairline + ★ on either side ★ + thin gold hairline (decorative separator) right at the boundary between hero and legal
- Then the legal block — fine-print text in clean cream/warm-grey sans-serif, centered, multiple paragraphs separated by small gaps
- The legal block sits in a smoothly transitioned darker zone (not a hard edge — let the rain-slick ground texture and atmospheric haze blend into the legal area)
- A thin warm-gold horizontal hairline rule with two small gold star ornaments flanking it (★ ─── ★) sits at the top of the legal block, separating it elegantly from the hero
- Dense fine-print legal text in small clean cream/warm-grey sans-serif type (lighter weight than the headline; NOT distressed; NOT all caps unless paragraph specifies), centered alignment, comfortable line-height
- Multiple paragraphs separated by a small vertical gap
- The text must read EXACTLY as follows (preserve every word, every punctuation mark, every line break between paragraphs):

PARAGRAPH 1 (slightly emphasized header line, all caps, slightly larger than rest):
NO PURCHASE NECESSARY TO ENTER OR WIN. A PURCHASE WILL NOT INCREASE YOUR CHANCES OF WINNING.

PARAGRAPH 2 (regular fine print):
Open only to legal Michigan residents 21+. Void where prohibited. Giveaway runs May 7, 2026, through July 30, 2026. Prize consists of one Grand Prize of $25,000 cash and one new, previously untitled 2023 Dodge Challenger from available dealer inventory, plus four Secondary Prizes of $1,000 cash each, subject to availability, substitution, taxes, title, registration, insurance, delivery, pickup, mileage, vehicle condition, and other restrictions stated in the Official Rules. Odds depend on eligible entries received. Sponsored by Michigan Investments 10 dba Muha Meds, MI marihuana license no. AU-P-000171 (Adult Use), in conjunction with participating licensed retailers and other properly licensed MI marihuana businesses involved in lawful product supply, distribution, transportation, transfer, sale, advertising, promotion, or administration.

PARAGRAPH 3:
This is a giveaway/sweepstakes-style promotion, not a raffle, lottery, gambling activity, or wagering activity. No cannabis product awarded as a prize. No cannabis purchase, cannabis use, app download, store visit, or purchase of any kind required for free entry. Entry code submissions and free entries have equal odds. See Official Rules at muhamembers.com.

PARAGRAPH 4:
For use only by individuals 21+. Keep out of reach of children. Do not drive under the influence of marihuana. Poison Control: 1-800-222-1222.

PARAGRAPH 5 (all caps warning, slightly emphasized):
WARNING: USE BY PREGNANT OR BREASTFEEDING WOMEN, OR BY WOMEN PLANNING TO BECOME PREGNANT, MAY RESULT IN FETAL INJURY, PRETERM BIRTH, LOW BIRTH WEIGHT, OR DEVELOPMENTAL PROBLEMS FOR THE CHILD.

CRITICAL: render every word of the legal text faithfully, no abbreviations, no paraphrasing, no missing sentences. The legal block dominates the lower half of the image but must remain readable. Use a clean simple sans-serif at small but legible size, with paragraph breaks visible.

Additional design elements: a thin gold horizontal hairline separating the hero section from the legal block, with two small gold star ornaments flanking it. Maintain the consistent Vice City warm gold/cream + neon-night palette throughout — every element must feel cohesive with the three reference images. Sharp focus, high resolution, polished commercial design, premium and cinematic feel.`;

function loadB64(p, mime) {
  return { inline_data: { mime_type: mime, data: fs.readFileSync(p).toString("base64") } };
}

const body = {
  contents: [{
    parts: [
      loadB64(REF1, "image/png"),
      { text: PROMPT },
    ],
  }],
  generationConfig: {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: { aspectRatio: "9:16", imageSize: "4K" },
  },
};

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
console.log("Generating Muha legal poster...");
const res = await fetch(url, {
  method: "POST",
  headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

if (!res.ok) {
  const text = await res.text();
  console.error(`HTTP ${res.status}: ${text.slice(0, 400)}`);
  process.exit(1);
}

const data = await res.json();
const parts = data?.candidates?.[0]?.content?.parts || [];
let saved = false;
for (const part of parts) {
  if (part.inlineData) {
    const buf = Buffer.from(part.inlineData.data, "base64");
    fs.writeFileSync(OUT, buf);
    console.log(`Saved → ${OUT}`);
    saved = true;
  } else if (part.text) {
    console.log(`Model: ${part.text.slice(0, 200)}`);
  }
}
if (!saved) console.error("No image returned");
