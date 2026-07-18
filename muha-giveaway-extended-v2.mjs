import fs from "fs";
for (const line of fs.readFileSync(".env","utf-8").split("\n")){const m=line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);if(m&&!process.env[m[1]])process.env[m[1]]=m[2];}

const stamp = new Date().toISOString().replace(/[:.]/g,"-").slice(0,19);
const REF = "Muha Giveaway Redesigned/Win Cash + Challenger.png"; // approved GTA/Vice City poster = style + scene anchor
const OUT = "Muha Giveaway Redesigned/Giveaway Extended/v2";
fs.mkdirSync(OUT, { recursive: true });

// Reproduce the approved scene/style EXACTLY — only the headline copy + LAYOUT change.
const SCENE = `This is a Grand Theft Auto / Vice City-style MUHA MEMBERS giveaway poster. Reproduce the reference image's scene and art style EXACTLY: the same glossy deep-red Dodge Challenger muscle car parked on a wet, neon-reflecting city street at night; the same red-lit Miami downtown skyline with silhouetted palm trees; the same stacks of $100 bills piled in the foreground; the same gold interlocking Muha "M" monogram logo; deep black background, moody red neon glow, cinematic contrast. Keep the EXACT same distressed vintage-gold, bold condensed all-caps GTA loading-screen typography with a soft red glow.`;

// Cleaner composition is the whole point of this round.
const LAYOUT = `LAYOUT IS THE PRIORITY — make it clean, organized and uncluttered with a clear hierarchy and generous breathing room, on a tidy CENTERED vertical grid with even side margins:
1) One small gold KICKER line at the very top.
2) The two-line HERO headline "GIVEAWAY" / "EXTENDED" as the single largest element — both words the SAME width so the block reads as a clean rectangle, evenly kerned, centered.
3) The gold Muha "M" monogram centered directly beneath, acting as a divider.
4) One smaller, letter-spaced PRIZE line on its own clean row.
Place ALL text over the DARK upper sky so it never overlaps the bright neon buildings; keep the Challenger and the cash stacks in the lower half with clear open space around them. Consistent type sizes, balanced even spacing, nothing crowded, nothing overlapping, nothing cut off at the edges.`;

const NEG = `Spell every word EXACTLY as written, uppercase. No other text anywhere, no extra taglines, no misspellings, no duplicated or dropped letters, no random characters or gibberish, no watermarks, no logos other than the gold Muha M.`;

const concepts = [
  {
    // Easter egg: 5-star GTA "wanted level"
    key: "wanted-stars",
    text: `Headline text, all in the gold GTA lettering:
- KICKER (top): a centered row of FIVE small gold five-pointed stars, exactly like a Grand Theft Auto wanted-level meter (no words on this line).
- HERO (two lines): GIVEAWAY / EXTENDED
- PRIZE line: $25,000 CASH + DODGE CHALLENGER`,
  },
  {
    // Easter egg: HESOYAM = the classic GTA San Andreas money/health cheat code
    key: "cheat-hesoyam",
    text: `Headline text, all in the gold GTA lettering:
- KICKER (top, smaller): CHEAT CODE: HESOYAM
- HERO (two lines): GIVEAWAY / EXTENDED
- PRIZE line: $25,000 CASH + DODGE CHALLENGER`,
  },
  {
    // Easter egg: GTA mission-marker language
    key: "new-objective",
    text: `Headline text, all in the gold GTA lettering:
- KICKER (top, smaller): NEW OBJECTIVE — SECURE THE BAG
- HERO (two lines): GIVEAWAY / EXTENDED
- PRIZE line: $25,000 CASH + DODGE CHALLENGER`,
  },
];

const N = "2"; // candidates per concept

for (const c of concepts) {
  const prompt = `${SCENE}\n\n${LAYOUT}\n\n${c.text}\n\n${NEG}`;
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

console.log("\nDone.");
