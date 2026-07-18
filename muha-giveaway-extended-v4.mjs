import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview"; // Nano Banana Pro — supports 4:5 + 4K
const stamp = new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);

const OUT = "Muha Giveaway Redesigned/Giveaway Extended/v4";
fs.mkdirSync(OUT, { recursive: true });

// Reference 1 = master art/scene. Reference 2 = the exact gold GTA type treatment we dialed in.
const REFS = [
  "Muha Giveaway Redesigned/Win Cash + Challenger.png",
  "Muha Giveaway Redesigned/Giveaway Extended/v3/2026-07-01T21-24-09_heist-back-on_c1.png",
];

function refPart(fp) {
  const ext = fp.toLowerCase().endsWith(".jpg") || fp.toLowerCase().endsWith(".jpeg") ? "image/jpeg" : "image/png";
  return { inline_data: { mime_type: ext, data: fs.readFileSync(fp).toString("base64") } };
}

const SCENE = `Reference image 1 is the master art style and scene; reference image 2 is the exact gold lettering treatment. Recreate the SAME Grand Theft Auto / Vice City look EXACTLY: the same glossy deep-red Dodge Challenger muscle car on a wet, neon-reflecting Miami street at night; the same red-lit downtown skyline with silhouetted palm trees; the same stacks of $100 bills; the same gold interlocking Muha "M" monogram logo; deep black background, moody red neon glow, cinematic contrast; and the SAME distressed vintage-gold, bold condensed all-caps GTA loading-screen typography with a soft red glow.`;

// NEW layout per client note: logo pulled to the TOP edge (out of the middle so it no longer
// splits the headline from the prize line); hero + prize line grouped together as ONE block; the
// prize line is a proper legible subtitle, NOT a tiny centered line tucked under the logo.
const LAYOUT = `Compose a clean, well-organized 4:5 VERTICAL poster. Layout, strictly top to bottom, with generous even margins:
1) TOP EDGE, centered: the gold Muha "M" monogram logo (medium). Just beneath it, a small gold KICKER line: "{KICKER}".
2) HERO headline, the single largest element, two centered lines that fill most of the width: "GIVEAWAY" then "EXTENDED".
3) Immediately below the hero, grouped tightly WITH it (separated only by a thin gold horizontal rule): the prize subtitle "$25,000 CASH + DODGE CHALLENGER", clearly legible and letter-spaced — noticeably larger than a caption, roughly one-third the height of the hero letters. Do NOT shrink it into a tiny line.
4) LOWER HALF (about 45%): the red Dodge Challenger on the wet neon street with the stacks of cash in front of it.
CRITICAL: the Muha "M" logo sits at the TOP only — it must NOT appear between the headline and the prize subtitle, and must not break up that text block. Keep the headline and prize line together as one unit.`;

const NEG = `Spell every word EXACTLY as written, uppercase. No other text anywhere, no extra taglines, no misspellings, no duplicated or dropped letters, no random characters or gibberish, no watermarks, no logos other than the gold Muha M.`;

const concepts = [
  { key: "heist-back-on",     kicker: "THE HEIST IS BACK ON" },
  { key: "make-the-getaway",  kicker: "STILL TIME TO MAKE THE GETAWAY" },
  { key: "overtime-vice-city",kicker: "OVERTIME IN VICE CITY" },
];

const parts0 = REFS.map(refPart);

for (const c of concepts) {
  const prompt = `${SCENE}\n\n${LAYOUT.replace("{KICKER}", c.kicker)}\n\n${NEG}`;
  const body = {
    contents: [{ parts: [...parts0, { text: prompt }] }],
    generationConfig: { responseModalities: ["TEXT","IMAGE"], imageConfig: { aspectRatio: "4:5", imageSize: "2K" } },
  };

  console.log(`\n[${c.key}] "${c.kicker}" — NB 4:5 2K...`);
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) { console.error(`[${c.key}] ERROR ${res.status}:`, (await res.text()).slice(0,500)); continue; }

  const json = await res.json();
  let n = 0;
  for (const cand of (json.candidates || [])) {
    for (const part of (cand.content?.parts || [])) {
      if (part.text) console.log(`  model: ${part.text.slice(0,120)}`);
      if (part.inlineData) {
        const p = `${OUT}/${stamp}_${c.key}${n>0?`_${n}`:""}.png`;
        fs.writeFileSync(p, Buffer.from(part.inlineData.data, "base64"));
        console.log(`  saved ${p}`);
        n++;
      }
    }
  }
  if (n === 0) console.log(`  [${c.key}] no image returned:`, JSON.stringify(json).slice(0,300));
}

console.log("\nDone.");
