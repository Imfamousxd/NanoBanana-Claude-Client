#!/usr/bin/env node
// Raffle Ticket — Variation A (Characters only) — v9
// Establishes the LOCKED border + typography + outer card body for the whole set.
// Once A is approved, B, C, D will reuse the exact same border/layout treatment.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-image-2";

const LOGO_REF = "AI Fruit VIdeos Muha/refs/MMembers Logo.png";
const CHAR_DIR = "AI Fruit VIdeos Muha/Generated Characters";
const CHARACTERS = [
  "Aloha Passion Rush.png",
  "Arctic Blueberry.png",
  "Blue Slushie.png",
  "Frosted Mint Cookies.png",
  "Frozen Pomegranate.png",
  "Galactic Diesel.png",
  "Guava Mango.png",
  "Horchata.png",
  "Lemon Cherry Fizz.png",
  "Watermelon Bubblegum.png",
];

const PROMPT = `MUHA MEMBERS GIVEAWAY RAFFLE CARD — VARIATION A (CHARACTERS ONLY).

This artwork establishes the LOCKED border + typography treatment for an entire 4-card raffle set; once approved, the same border + outer card body will be reused on variations B, C, D.

CANVAS — 2048 x 1024 pixels representing a full 90mm x 43mm physical raffle card.

INNER PEEL-OFF STICKER AREA — 82mm x 32mm ≈ 1866 x 762 pixels, centered in the canvas. Leaves ~91 px L/R margin and ~131 px T/B margin between the inner border and the canvas edges.

LOCKED OUTER CARD BODY (~91 px L/R, ~131 px T/B ring outside the inner border) — deep midnight-navy-purple background with subtle gold ornamental pinstripes / tiny gold dot pattern. Premium, quiet, this is the part of the card surrounding the peel-off sticker.

LOCKED ORNATE TICKET BORDER — sits at the boundary of the inner 1866x762 sticker area. The border treatment:
- A thin GOLD inner rule (1-2 px) outlining the full sticker rectangle
- Ornate ART-DECO GOLD CORNER FLOURISHES in all 4 corners (filigree / scrollwork motif, Vegas-jackpot vibe)
- A second thinner gold rule running slightly inside the main border, creating a double-line frame
- Subtle gold dot-bead detail along the edges between the corner flourishes
- NO STARBURST OR STAR ACCENTS at the midpoints of the edges. The top, bottom, left, and right edges of the border are CLEAN with only the double-rule frame + bead detail — no decorative stars / starbursts / sun-rays interrupting the midpoint of any edge.
The border weight, color, and ornament style must be CRISP and CLEARLY READABLE — this is the visual signature that will repeat on every variation in the set.

INSIDE THE INNER STICKER AREA (all hero content lives here, ~30-40px safe-zone inset):

BORDER LAYER ORDER — IMPORTANT: the GOLD TICKET BORDER is the TOPMOST layer of the design. Every character, the hero text, and all scene elements live UNDERNEATH / INSIDE the border. NO character body part, arm, hand, hair, leaf, or accessory may cross over / extend past / break / overlap the border on top. If a character's pose would naturally extend past the border edge, the border CLIPS them at that edge — the border stays unbroken and the character's silhouette ends cleanly at the border line. The character on the far left (Aloha) and the character on the far right (Watermelon Bubblegum or similar) must keep all their limbs INSIDE the border — no arm, elbow, or hand crossing outside.

CHARACTERS — all 10 Muha fruit-drama characters from the reference images, exactly ONE instance of each. Final character count: TEN (10) total, ten distinct individuals. Roster:
1. Aloha Passion Rush — ONE instance (passionfruit head with hibiscus crown, tropical look)
2. Arctic Blueberry — ONLY ONE INSTANCE (chad smooth-talker, deep purple-blue blueberry head with snow tuft, blue button-up). There must be EXACTLY ONE blueberry-headed character in the entire image — NOT two. Do not duplicate this character anywhere in the composition.
3. Blue Slushie — ONE instance (pastel pink/blue cotton-candy slushie hair, brain-freeze drama)
4. Frosted Mint Cookies — ONE instance (cookie-textured head, shy)
5. Frozen Pomegranate — ONE instance (buff red-skinned gym-bro, deep red pomegranate head with crown, red muscle tank)
6. Galactic Diesel — ONE instance (cosmic-purple planet head with Saturn rings, leather jacket)
7. Guava Mango — ONE instance (half-mango-yellow / half-guava-green split head, laughing class-clown, leafy hair, yellow tee + pink overshirt)
8. Horchata — ONE instance (creamy cinnamon-swirl head, cinnamon-stick curls, red flamenco dress, mid-flamenco-pose)
9. Lemon Cherry Fizz — ONE instance (lemon head, tortoiseshell glasses, cherry earrings, book). PLACEMENT: position her adjacent to Frosted Mint Cookies (the cookie-textured-head shy character) — they stand next to each other as a clean side-by-side pair. Do NOT place her front-and-center in front of other characters where she awkwardly overlaps the composition; she belongs neatly next to Cookies, both fitting cleanly into the group.
10. Watermelon Bubblegum — ONE instance (whole green-striped watermelon head with pink bubblegum quiff hair, green bomber + pink crew)

CRITICAL: COUNT exactly 10 characters total. Zero duplicates. Especially: there is ONLY ONE blueberry-blue character in the frame. Verify before finalizing — if you see two blue-blueberry heads, remove one. ALSO CRITICAL: ALL 10 characters MUST be visibly present in the final image — count them one by one: Aloha, Blueberry, Slushie, Cookies, Pomegranate, Diesel, Mango, Horchata, Lemon Cherry Fizz, Watermelon Bubblegum. LEMON CHERRY FIZZ (yellow lemon-head girl with tortoiseshell glasses, cherry earrings dangling from her ears, leafy bob, holding a closed book) MUST be clearly visible — do NOT drop her. She is REQUIRED. Place her next to Frosted Mint Cookies as a clean side-by-side pair.

CHARACTER PROPORTIONS — IMPORTANT: render every character at roughly the SAME visual SCALE / SIZE relative to each other. They should appear as a balanced group of equally-sized peers — no one significantly larger or smaller than the rest, no one cropped tiny in the back. Even depth-staggering for composition is OK but keep proportional sizing consistent across all 10. Horchata gets a clear front-and-center feature spot but at the same overall scale as the others.

HERO TYPOGRAPHY / LOGO LOCKUP — IMPORTANT: do NOT spell out "MUHA MEMBERS" in text. Instead, the top of the two-line hero lockup is the actual MUHA MEMBERS LOGO from reference 1 (the blue verification-checkmark badge + gold "M" monogram + gold cursive "Members" lettering) placed BIG and CENTERED across the top of the hero zone — render the logo pixel-faithful to reference 1, NOT redrawn, NOT garbled, NOT distorted. This logo IS the top half of the hero "title."

Beneath the logo, render the word "GIVEAWAY" alone in chunky 3D vintage-Vegas display lettering: golden-yellow fill with subtle 3D bevel and inner-shine, thick deep magenta-purple drop shadow, slight cream/white outline. Slightly larger than the logo above it. Spell-check: "GIVEAWAY" is exactly G-I-V-E-A-W-A-Y.

So the hero lockup reads visually as: [Muha Members Logo] / GIVEAWAY — logo on top, word "GIVEAWAY" below. NO additional "MUHA MEMBERS" text anywhere — the logo replaces that text. NO subtitle.

BACKGROUND inside the inner area — Miami-neon Vegas-strip palette: deep midnight navy-purple gradient with hot magenta + electric teal light bursts, floating gold sparkles, atmospheric haze. NO Christmas red, NO holiday crimson.

STYLE LOCK — unified PIXAR / CINEMA 4D / OCTANE 3D animated-feature-film style matching the locked design of the 10 character references. Not photoreal, not flat 2D. Cinematic hero-poster lighting.

NEGATIVE — do NOT use Christmas red as a dominant color. Do NOT include phone numbers, dates, URLs, barcodes. Do NOT misspell MUHA. Do NOT duplicate any character. Do NOT include an "ADMIT ONE" stub. Do NOT include real dealership / Ford branding. Do NOT let hero artwork or the gold border bleed into the outer card body — keep the layout exactly as specified. Do NOT redraw the Muha Members logo — reference 1 placed as-is.`;

const SIZE = "2048x1024";

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "1");

const logoBuf = fs.readFileSync(LOGO_REF);
form.append("image[]", new Blob([logoBuf], { type: "image/png" }), "MMembers-Logo.png");
for (const charFile of CHARACTERS) {
  const p = path.join(CHAR_DIR, charFile);
  const buf = fs.readFileSync(p);
  form.append("image[]", new Blob([buf], { type: "image/png" }), charFile);
}

console.log("Generating Raffle A v9 (characters only, locks border)...");
const res = await fetch("https://api.openai.com/v1/images/edits", {
  method: "POST",
  headers: { Authorization: `Bearer ${API_KEY}` },
  body: form,
});
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 400)}`);
  process.exit(1);
}
const data = await res.json();
const item = (data.data || [])[0];
if (!item?.b64_json) { console.error("no b64_json"); process.exit(1); }

const outDir = "AI Fruit VIdeos Muha/Raffle Card Designs";
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outPath = `${outDir}/${stamp}_muha-raffle-A-characters-only-v14.png`;
fs.writeFileSync(outPath, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${outPath}`);
