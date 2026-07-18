#!/usr/bin/env node
// EURO SUMMER — BACK v3: let the model PAINT the entire back (stamp frame, ribbon, lettering)
// in the same oil-painted vintage style as the front, leaving the stamp interior BLANK so a
// real QR can be dropped in later. No flat vector graphics fighting the illustration.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const API_KEY = process.env.OPENAI_API_KEY;
const DIR = "AI Fruit VIdeos Muha/Raffle Card Designs/Euro Summer";
const REF = path.join(DIR, "2026-06-08T21-51-49_euro-summer-BACK-map-FULLBLEED.png");

const PROMPT = `Reference image 1 is the BACK of a vintage EURO SUMMER travel raffle card — an oil-painted illustrated map of Europe with a dashed grand-tour route and little landmark vignettes. KEEP the map, the route, the landmark vignettes, the palette and the hand-painted vintage travel-postcard style EXACTLY.

ADD the following, PAINTED in that SAME hand-illustrated vintage style — they must look like part of the same painting (same brushwork, linen texture, golden-hour palette, soft shadows), NOT like flat modern graphics, NOT crisp vector, NOT clip-art:

1) In the calmer golden area on the RIGHT, paint a VINTAGE POSTAGE STAMP: classic white scalloped/perforated stamp edges, a slightly worn printed look, sitting at a tiny natural tilt with a soft painted drop shadow. Across the TOP inside the stamp paint the small words "EURO SUMMER" and across the BOTTOM "$20K TRIP" in vintage type. CRITICAL: the CENTER of the stamp must be a COMPLETELY BLANK, FLAT, PLAIN OFF-WHITE/CREAM square — empty paper. Do NOT paint a QR code, squares, grid, pattern, barcode, portrait or any image inside it. Leave the center empty.

2) Below or beside the stamp, paint an ORNATE GOLD VINTAGE RIBBON BANNER with folded ends and a soft sheen, reading exactly "SCAN TO ENTER" in elegant cream-and-navy vintage lettering (same lettering feel as the front of the card).

Spelling must be EXACT: "EURO SUMMER", "$20K TRIP", "SCAN TO ENTER". No other words, no dates, no URLs, no real barcode/QR. Full-bleed illustration, NO outer frame/border (added separately). Everything stays hand-painted and cohesive.`;

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
console.log("Painting full EURO SUMMER back (stamp + ribbon, blank stamp center)...");
const form = new FormData();
form.append("model", "gpt-image-2"); form.append("prompt", PROMPT); form.append("size", "2048x1024"); form.append("quality", "high"); form.append("n", "1");
form.append("image[]", new Blob([fs.readFileSync(REF)], { type: "image/png" }), "back-map.png");
const res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${API_KEY}` }, body: form });
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const item = ((await res.json()).data || [])[0];
if (!item?.b64_json) { console.error("no image"); process.exit(1); }
const out = `${DIR}/${stamp}_euro-summer-BACK-painted.png`;
fs.writeFileSync(out, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${out}`);
try { execSync(`open -a Preview "${out}"`); } catch {}
