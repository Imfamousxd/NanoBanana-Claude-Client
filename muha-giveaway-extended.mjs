import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}

const stamp = new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);
const REF = "Muha Giveaway Redesigned/Win Cash + Challenger.png"; // approved GTA/Vice City poster = style + scene anchor
const OUT = "Muha Giveaway Redesigned/Giveaway Extended";
fs.mkdirSync(OUT, { recursive: true });

// Shared scene lock — reproduce the approved poster EXACTLY, only the headline changes.
const SCENE = `This is a Grand Theft Auto / Vice City-style MUHA MEMBERS giveaway poster. Reproduce the reference image's scene and art style EXACTLY: the same glossy deep-red Dodge Challenger muscle car parked on a wet, neon-reflecting city street at night; the same red-lit Miami downtown skyline with silhouetted palm trees; the same stacks of $100 bills piled in the foreground; the same gold interlocking Muha "M" monogram logo; deep black background, moody red neon glow, cinematic contrast. Keep the EXACT same distressed vintage-gold, bold condensed all-caps GTA loading-screen typography with a soft red glow. Portrait poster, same layout: big headline across the top, the gold M monogram in the middle, the car and cash below.`;

const NEG = `Spell every word EXACTLY as written, uppercase. No other text anywhere, no extra words, no taglines, no misspellings, no duplicated or dropped letters, no random characters or gibberish, no watermarks, no logos other than the gold Muha M.`;

const concepts = [
  {
    key: "mission-extended",
    text: `Replace ALL of the headline text with this exact copy, rendered in the same gold GTA lettering:
- Small eyebrow line at the very top: MISSION EXTENDED
- Large two-line hero headline directly below it: "GIVEAWAY" on one line, "EXTENDED" on the next
- A medium line just below the gold M monogram: $25,000 CASH + DODGE CHALLENGER`,
  },
  {
    key: "cheat-code",
    text: `Replace ALL of the headline text with this exact copy, rendered in the same gold GTA lettering:
- Small eyebrow line at the very top: CHEAT CODE ACTIVATED
- Large two-line hero headline directly below it: "GIVEAWAY" on one line, "EXTENDED" on the next
- A short line under the headline: + MORE TIME TO SECURE THE BAG
- A medium line just below the gold M monogram: $25,000 CASH + DODGE CHALLENGER`,
  },
];

const N = "2"; // candidates per concept

for (const c of concepts) {
  const prompt = `${SCENE}\n\n${c.text}\n\n${NEG}`;
  const form = new FormData();
  form.append("model", "gpt-image-2");
  form.append("prompt", prompt);
  form.append("size", "1024x1536");
  form.append("quality", "high");
  form.append("n", N);
  form.append("image[]", new Blob([fs.readFileSync(REF)], { type: "image/png" }), "ref.png");

  console.log(`\n[${c.key}] generating ${N} candidate(s)...`);
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });
  if (!res.ok) {
    console.error(`[${c.key}] ERROR ${res.status}:`, await res.text());
    continue;
  }
  const data = (await res.json()).data || [];
  data.forEach((it, i) => {
    const p = `${OUT}/${stamp}_${c.key}_c${i + 1}.png`;
    fs.writeFileSync(p, Buffer.from(it.b64_json, "base64"));
    console.log(`  saved ${p}`);
  });
}

console.log("\nDone. Opening output folder...");
