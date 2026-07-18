#!/usr/bin/env node
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
const ASSETS = "Muha Giveaway Assets";
const OUT = "Muha Giveaway Redesigned/Disclaimer Styled/content 3.png";

const REFS = [
  `${ASSETS}/mm-gold.png`,
  `${ASSETS}/raffles SS.png`,
  `${ASSETS}/raffle ss 2.png`,
  `${ASSETS}/scan prod modified.png`,
  `${ASSETS}/_internal/headline-reference.png`,
];

const PROMPT = `You are designing the Muha Members "GIVEAWAY Vice City" giveaway poster — content variant 3, a 4:5 portrait social-feed layout.

FIVE reference images (in order):
1) MUHA 'M' GOLD MONOGRAM — render the Muha 'M' from this exactly; do NOT redraw it freehand.
2) PHONE SCREENSHOT — Step 1 (account menu, "Raffles" highlighted)
3) PHONE SCREENSHOT — Step 2 (RAFFLES tab, $25,000 GTA Raffle card)
4) PHONE SCREENSHOT — Step 3 (prize tiers + "Scan raffle ticket" highlighted, subtitle "Scan your raffle ticket inside your Muha Meds product box to earn entries")
5) WORDMARK REFERENCE — copy the "GIVEAWAY" + cursive "Vice City" treatment pixel-faithfully (cream beveled letters, amber glow halo, layered red drop shadow, gold cursive script tail).

THE PHONE SCREENSHOTS are LITERAL CONTENT — render each phone mockup LARGE and copy each ref's pixel content directly inside the phone frame. Every word on each screenshot must be crisp and readable. Do not redraw or hallucinate.

THEME: deep moody Miami nightscape, palm trees, neon, rain-slick streets, red Challenger as the only fully saturated object, warm cream/gold typography, no pink/cyan/teal — strictly red/maroon/cream/gold/black. Cinematic depth, premium movie-poster grade.

CRITICAL — CLEAN PROFESSIONAL SPACING. Treat the canvas as a vertical grid with FIVE clearly separated horizontal zones, each with its OWN breathing room. Do NOT let elements overlap, crowd, or touch each other across zones. Each zone has clear vertical padding above and below.

ZONE 1 — LOGO ZONE (top ~10%):
- The gold Muha 'M' monogram (from ref #1), CENTERED horizontally, sitting in clean dark Miami atmospheric background.
- Generous empty space (≥4% canvas height) above and below the monogram before any other element.
- Below it, a single neat row of 5-7 small gold five-point stars, centered.

ZONE 2 — HEADLINE ZONE (~10-30% from top):
- Small spaced cream caps tagline "HOW TO ENTER THE MUHA MEMBERS", centered.
- A clear gap, then the canonical "GIVEAWAY" headline (from ref #5) — MASSIVE, all-caps cream, beveled, amber-glow halo. Centered.
- The gold cursive italic "Vice City" script tail overlapping the lower-right of the headline, slightly tilted.
- ≥3% canvas height of empty space below the wordmark before the next zone begins.

ZONE 3 — HERO ZONE (~30-58%):
- LEFT third: a vintage gold-bordered call-out box reading "$25,000 CASH PRIZE + ALL-NEW DODGE CHALLENGER" (NO 'SRT', NO trim suffix) in stacked cream/gold caps, with a small gold star ornament between the lines.
- CENTER half: glossy red regular Dodge Challenger (NOT SRT/Hellcat) with strong red glow on the wheel rims and brake calipers, three-quarter low-angle pose, on rain-slick wet street with reflections, atmospheric haze and red neon glow behind it.
- RIGHT third: a clean QR code (cream/white background with black QR pattern, no border or frame) sized moderate, with small gold cursive "Scan to Find Out!" text and a small gold crown ornament above the QR. The QR + "Scan to Find Out!" sit vertically stacked, centered in the right third, at a height that aligns roughly with the Challenger's center mass — they feel like they belong to the same hero composition.
- Generous horizontal gaps between the three sections (callout / Challenger / QR) so nothing crowds.
- ≥3% canvas height of empty space below the hero before the next zone begins.

ZONE 4 — STEPS ZONE (~55-85%):
- A small gold cursive italic line "Muha Members — Your journey starts here" centered above the steps, with comfortable gap above and below.
- Three numbered steps in a horizontal row, each step in its own COLUMN with equal horizontal spacing.
- Each step column has, top-to-bottom: a big gold display numeral "1" / "2" / "3", a small spaced cream caps step caption ("GO TO MORE AND TAP 'RAFFLES'" / "SELECT 'GTA RAFFLE'" / "TAP 'SCAN RAFFLE TICKET'"), and a phone mockup with the corresponding screenshot.
- CRITICAL PHONE SIZING — each phone mockup must be FULLY CONTAINED within its column AND fully contained vertically within the steps zone. Top of each phone is below its caption with comfortable margin. Bottom of each phone ends at least 5% of canvas height ABOVE the footer zone. ALL THREE PHONES must be the SAME size, aligned on the same top edge AND the same bottom edge. NO phone is cut off, cropped by the canvas edge, or extends beyond its column. If the phone's natural aspect ratio is too tall to fit the column at the desired width, scale the entire phone DOWN proportionally so it fits — never crop or stretch. Each phone must show its FULL frame from top status bar to bottom navigation bar.
- Phone 1 = ref #2; Phone 2 = ref #3; Phone 3 = ref #4. All three at the SAME scale, perfectly aligned.

ZONE 5 — FOOTER ZONE (bottom ~5%):
- ONLY the disclaimer in small refined cream type, centered horizontally — THE ONLY DISCLAIMER: "See official rules in app or at muhamembers.com". No QR code in the footer, no other disclaimers, no GTA/Vice City credit text anywhere. Comfortable vertical margin above the disclaimer (separating it from the steps zone).

NO Art-Deco corner ornaments / corner brackets / corner flourishes anywhere on the canvas. The four corners are clean dark background with no decoration.

Sharp focus, high resolution, premium movie-poster aesthetic. Each element has clear breathing room, the composition feels intentionally laid out on a grid, NOTHING is crowded or slapped on.`;

function mimeForExt(ext) {
  return { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" }[ext.toLowerCase()] || "image/png";
}

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", "2560x3200");
form.append("quality", "high");
form.append("n", "1");
for (const refPath of REFS) {
  const buf = fs.readFileSync(refPath);
  form.append("image[]", new Blob([buf], { type: mimeForExt(path.extname(refPath)) }), path.basename(refPath));
}

const res = await fetch("https://api.openai.com/v1/images/edits", {
  method: "POST",
  headers: { Authorization: `Bearer ${API_KEY}` },
  body: form,
});
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}
const data = await res.json();
const item = (data.data || [])[0];
if (!item?.b64_json) { console.error("no b64_json"); process.exit(1); }
fs.writeFileSync(OUT, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${OUT}`);
