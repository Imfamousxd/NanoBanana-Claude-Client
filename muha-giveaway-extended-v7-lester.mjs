import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const stamp = new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);

const OUT = "Muha Giveaway Redesigned/Giveaway Extended/v7-lester";
fs.mkdirSync(OUT, { recursive: true });

// SINGLE base ref = the approved PHOTOREAL v5 render. We edit this, we do NOT re-style it.
const BASE_REF = "Muha Giveaway Redesigned/Giveaway Extended/v5-lester/2026-07-01T21-48-29_lester-street-distant.png";
function refPart(fp){
  const ext = /\.jpe?g$/i.test(fp) ? "image/jpeg" : "image/png";
  return { inline_data: { mime_type: ext, data: fs.readFileSync(fp).toString("base64") } };
}

const KEEP = `Reproduce this reference image EXACTLY: same PHOTOREALISTIC cinematic render, same glossy deep-red Dodge Challenger, same wet neon Miami street and skyline, same stacks of $100 bills, same gold Muha "M" monogram at the top, same distressed vintage-gold GTA headline typography, same 4:5 layout — kicker "LESTER JUST CALLED", two-line hero "GIVEAWAY" / "EXTENDED", and the prize line "$25,000 CASH + DODGE CHALLENGER".

CRITICAL STYLE LOCK: keep it 100% PHOTOREALISTIC exactly like the reference — a cinematic, photo-real image. Do NOT redraw or restyle it as an illustration, cartoon, comic book, cel-shaded, hand-drawn, or GTA-cover-art look. Every element, including the man, must stay photorealistic and match the reference's rendering, lighting and color.`;

const NEG = `Spell every word EXACTLY, uppercase. The ONLY text is "LESTER JUST CALLED", "GIVEAWAY", "EXTENDED", "$25,000 CASH + DODGE CHALLENGER". No other text, no misspellings, no gibberish, no watermarks, no logos besides the gold Muha M. Photorealistic only — absolutely no illustrated/cartoon/comic style. The man must not cover the car's front, the text, or the logo.`;

const concepts = [
  {
    key: "photoreal-lester-chestup",
    edits: `Make ONLY these three edits, changing nothing else:
1) Enlarge the balding middle-aged man in glasses and a plaid short-sleeve shirt (phone to his ear) who stands on the right behind the car, so he is MORE PROMINENT — a clearly visible PHOTOREALISTIC figure from about the chest up, same photo-real rendering and neon lighting as the rest of the scene. Keep him on the right, beside/behind the car.
2) Remove the thin gold horizontal rule/line between the hero headline and the prize line.
3) Give the prize line "$25,000 CASH + DODGE CHALLENGER" a slightly flashier polished metallic-gold finish with a subtle red neon edge-glow — still photorealistic and legible, not cartoonish.`,
  },
  {
    key: "photoreal-lester-bigger",
    edits: `Make ONLY these three edits, changing nothing else:
1) Enlarge the balding middle-aged man in glasses and a plaid short-sleeve shirt (phone to his ear) on the right behind the car so he is noticeably PROMINENT — a large, clearly visible PHOTOREALISTIC figure standing beside the car, same photo-real rendering and neon lighting as the scene, not overlapping the car's front, the text, or the logo.
2) Remove the thin gold horizontal rule/line between the hero headline and the prize line.
3) Give the prize line "$25,000 CASH + DODGE CHALLENGER" a slightly flashier polished metallic-gold finish with a subtle red neon edge-glow — still photorealistic and legible, not cartoonish.`,
  },
];

for (const c of concepts) {
  const prompt = `${KEEP}\n\n${c.edits}\n\n${NEG}`;
  const body = {
    contents: [{ parts: [refPart(BASE_REF), { text: prompt }] }],
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
