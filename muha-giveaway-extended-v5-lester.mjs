import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const stamp = new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);

const OUT = "Muha Giveaway Redesigned/Giveaway Extended/v5-lester";
fs.mkdirSync(OUT, { recursive: true });

// Ref 1 = master art/scene. Ref 2 = the APPROVED v4 4:5 layout + type treatment to match exactly.
const REFS = [
  "Muha Giveaway Redesigned/Win Cash + Challenger.png",
  "Muha Giveaway Redesigned/Giveaway Extended/v4/2026-07-01T21-39-45_heist-back-on.png",
];
function refPart(fp){
  const ext = /\.jpe?g$/i.test(fp) ? "image/jpeg" : "image/png";
  return { inline_data: { mime_type: ext, data: fs.readFileSync(fp).toString("base64") } };
}
const parts0 = REFS.map(refPart);

const BASE = `Reference image 2 is the APPROVED layout and art style — reproduce it EXACTLY: 4:5 vertical poster; gold interlocking Muha "M" monogram at the TOP; a small gold kicker line under the logo; the huge two-line gold hero headline "GIVEAWAY" / "EXTENDED"; a thin gold horizontal rule; then the legible prize line "$25,000 CASH + DODGE CHALLENGER" grouped directly beneath the hero; and the lower half showing the glossy deep-red Dodge Challenger on the wet neon-reflecting Miami street at night with stacks of $100 bills in front. Same distressed vintage-gold GTA loading-screen typography, same red neon glow, same deep-black background.

CHANGE #1 — the top kicker line now reads exactly: LESTER JUST CALLED`;

// A subtle Lester Crest easter egg worked into the dark background.
const LESTER = `a balding middle-aged man with a thin combover over a shiny bald head, thick square glasses, a gaunt pale sickly face, wearing a rumpled short-sleeve checked plaid button-up shirt, hunched posture, holding an old cellphone up to his ear (the mastermind "planner" character who calls to set up a heist)`;

const NEG = `Spell every word EXACTLY as written, uppercase. The ONLY text is: "LESTER JUST CALLED", "GIVEAWAY", "EXTENDED", and "$25,000 CASH + DODGE CHALLENGER". No other text, no misspellings, no duplicated or dropped letters, no gibberish, no watermarks, no logos other than the gold Muha M. Keep the man subtle and in the background — he must NOT cover the car, the cash, the logo, or any text.`;

const concepts = [
  {
    key: "lester-street-distant",
    add: `CHANGE #2 — add ${LESTER} as a SUBTLE, distant, backlit figure standing on the wet neon street in the mid-background, off to one side behind the car, small and low-contrast so it reads as a hidden easter egg you only catch on a second look.`,
  },
  {
    key: "lester-ghost-haze",
    add: `CHANGE #2 — add ${LESTER} as a large, faint, semi-transparent ghosted presence blended into the dark neon haze of the upper background beside the headline, very low opacity like a watermark so it never competes with the text or the car.`,
  },
  {
    key: "lester-corner-neon",
    add: `CHANGE #2 — add ${LESTER} as a SUBTLE shadowy figure in the lower-background corner, lit by the red neon of a building, small and understated so it feels like a background easter egg.`,
  },
];

for (const c of concepts) {
  const prompt = `${BASE}\n\n${c.add}\n\n${NEG}`;
  const body = {
    contents: [{ parts: [...parts0, { text: prompt }] }],
    generationConfig: { responseModalities: ["TEXT","IMAGE"], imageConfig: { aspectRatio: "4:5", imageSize: "2K" } },
  };
  console.log(`\n[${c.key}] NB 4:5 2K...`);
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) { console.error(`[${c.key}] ERROR ${res.status}:`, (await res.text()).slice(0,600)); continue; }
  const json = await res.json();
  let n = 0;
  for (const cand of (json.candidates || [])) {
    for (const part of (cand.content?.parts || [])) {
      if (part.text) console.log(`  model: ${part.text.slice(0,160)}`);
      if (part.inlineData) {
        const p = `${OUT}/${stamp}_${c.key}${n>0?`_${n}`:""}.png`;
        fs.writeFileSync(p, Buffer.from(part.inlineData.data, "base64"));
        console.log(`  saved ${p}`);
        n++;
      }
    }
  }
  if (n === 0) console.log(`  [${c.key}] no image:`, JSON.stringify(json).slice(0,400));
}
console.log("\nDone.");
