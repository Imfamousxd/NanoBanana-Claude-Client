import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const stamp = new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);

const OUT = "Muha Giveaway Redesigned/Giveaway Extended/v8-subtext";
fs.mkdirSync(OUT, { recursive: true });

// Base = the client's favorite so far: the v5 "ghost-haze" (Lester prominent upper-right, photoreal scene).
const BASE_REF = "Muha Giveaway Redesigned/Giveaway Extended/v5-lester/2026-07-01T21-48-29_lester-ghost-haze.png";
function refPart(fp){
  const ext = /\.jpe?g$/i.test(fp) ? "image/jpeg" : "image/png";
  return { inline_data: { mime_type: ext, data: fs.readFileSync(fp).toString("base64") } };
}

const KEEP = `Reproduce this reference image EXACTLY and keep it PHOTOREALISTIC — same cinematic photo-real scene, same glossy deep-red Dodge Challenger, same wet neon Miami street and skyline, same stacks of $100 bills, same gold Muha "M" monogram at the top, same kicker "LESTER JUST CALLED", same huge two-line distressed-gold hero "GIVEAWAY" / "EXTENDED" with its red glow, and the SAME prominent balding man in glasses and plaid shirt on the phone in the upper right. Do NOT move, resize, redraw, or restyle Lester, the car, the cash, the logo, the kicker, or the hero headline. Do NOT convert anything to illustration/cartoon/comic — keep the exact same look.`;

const NEG = `Spell every word EXACTLY, uppercase. The ONLY text is "LESTER JUST CALLED", "GIVEAWAY", "EXTENDED", "$25,000 CASH + DODGE CHALLENGER". No other text, no misspellings, no duplicated/dropped letters, no gibberish, no watermarks, no logos besides the gold Muha M, no divider line. Keep everything else identical to the reference.`;

const concepts = [
  {
    key: "subtext-match-hero",
    fix: `Make ONLY these two changes, nothing else:
1) REMOVE the thin gold horizontal rule/line that sits between the hero headline and the prize line.
2) Re-style the prize line "$25,000 CASH + DODGE CHALLENGER" so it looks premium and cohesive: render it in the SAME bold, condensed, distressed vintage-gold GTA loading-screen lettering as the hero headline — same gold texture and same soft red outer glow — just smaller than the hero. Keep it on ONE centered line directly under the hero, well-kerned and clearly legible. It should read as part of the same title family, not thin flat text.`,
  },
  {
    key: "subtext-solid-gold-bevel",
    fix: `Make ONLY these two changes, nothing else:
1) REMOVE the thin gold horizontal rule/line between the hero headline and the prize line.
2) Re-style the prize line "$25,000 CASH + DODGE CHALLENGER" into a clean, premium solid-gold treatment: bold condensed uppercase with a subtle beveled metallic-gold finish and a soft dark outline so it reads crisply against the background, a little larger and heavier than before but still clearly smaller than the hero. Keep it on ONE centered line directly under the hero, well-kerned and legible. Photorealistic, tasteful — not cartoonish, not garish.`,
  },
];

for (const c of concepts) {
  const prompt = `${KEEP}\n\n${c.fix}\n\n${NEG}`;
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
