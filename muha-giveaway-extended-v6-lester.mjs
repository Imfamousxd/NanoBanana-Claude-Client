import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const stamp = new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);

const OUT = "Muha Giveaway Redesigned/Giveaway Extended/v6-lester";
fs.mkdirSync(OUT, { recursive: true });

// Ref 1 = master art/scene. Ref 2 = the approved v5 Lester layout (clean text, logo-at-top, Lester on right).
const REFS = [
  "Muha Giveaway Redesigned/Win Cash + Challenger.png",
  "Muha Giveaway Redesigned/Giveaway Extended/v5-lester/2026-07-01T21-48-29_lester-street-distant.png",
];
function refPart(fp){
  const ext = /\.jpe?g$/i.test(fp) ? "image/jpeg" : "image/png";
  return { inline_data: { mime_type: ext, data: fs.readFileSync(fp).toString("base64") } };
}
const parts0 = REFS.map(refPart);

const LESTER = `the balding middle-aged man with a thin combover, thick square glasses, a gaunt pale face, a rumpled short-sleeve checked plaid button-up shirt, holding an old cellphone up to his ear (the heist-planner "he just called you" character)`;

const BASE = `Reference image 2 is the approved layout — reproduce it: a 4:5 vertical Grand Theft Auto / Vice City poster; gold interlocking Muha "M" monogram at the TOP; a small gold kicker line reading exactly "LESTER JUST CALLED"; the huge two-line gold hero headline "GIVEAWAY" / "EXTENDED"; then the prize line "$25,000 CASH + DODGE CHALLENGER" grouped directly beneath the hero; lower half = the glossy deep-red Dodge Challenger on the wet neon-reflecting Miami street at night with stacks of $100 bills in front; distressed vintage-gold GTA loading-screen typography, deep-black background, moody red neon glow.

THREE CHANGES from the reference:
1) REMOVE the thin gold horizontal rule/divider between the hero headline and the prize line. The prize line sits directly under the hero with NO separating line.
2) Make the prize line "$25,000 CASH + DODGE CHALLENGER" FLASHIER and more eye-catching: glossy polished metallic-gold / chrome lettering with a bright specular shine and a red neon outer glow, a little larger and bolder so it pops — while staying perfectly legible and on one line.
3) Make ${LESTER} MORE PROMINENT and clearly recognizable (larger and better-lit than a faint background figure), positioned as described below.`;

const NEG = `Spell every word EXACTLY, uppercase. The ONLY text is "LESTER JUST CALLED", "GIVEAWAY", "EXTENDED", and "$25,000 CASH + DODGE CHALLENGER". No other text, no misspellings, no duplicated/dropped letters, no gibberish, no watermarks, no logos other than the gold Muha M. Lester must NOT cover or overlap the headline, the prize line, the logo, or the front/body of the car — keep him beside/behind the car.`;

const concepts = [
  {
    key: "lester-right-chestup",
    place: `Place Lester on the RIGHT side of the frame beside and slightly behind the car, shown from the chest up, clearly lit by the red neon, phone to his ear — a prominent, obvious presence (roughly a third of the frame height) but still behind the car so the Challenger stays the hero.`,
  },
  {
    key: "lester-left-halfbody",
    place: `Place Lester on the LEFT side of the frame, stepping into view from the mid-ground, shown from roughly the waist up, clearly lit and recognizable, phone to his ear — prominent and eye-catching without covering the headline or the front of the car.`,
  },
  {
    key: "lester-right-large",
    place: `Place Lester prominently on the RIGHT, a large clearly-lit figure standing on the wet street just behind the car, nearly half the frame height, phone to his ear, unmistakably recognizable — but not overlapping the text, logo, or the front of the car.`,
  },
];

for (const c of concepts) {
  const prompt = `${BASE}\n\nPLACEMENT: ${c.place}\n\n${NEG}`;
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
