#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";

const LAYOUT_REF = "Muha Giveaway Redesigned/Disclaimer Updated/content 2.png";
const TICKET = "Muha Giveaway Assets/gta muha card.png";

const DST = "Muha Giveaway Redesigned/Disclaimer Updated/content 2 regen with ticket.png";

const PROMPT = `Reference 1 is the EXACT layout target — reproduce it pixel-faithfully in every aspect. Reference 2 is the GTA Muha raffle ticket that needs to be a designed-in element of the new render.

Reproduce reference 1 PIXEL-FAITHFULLY — same 4:5 portrait composition, same Vice City Miami-night background with palm tree silhouettes + red glow + Dodge Challenger driving down a wet Miami street with the skyline + ocean drive sign in the distance, same warm-cream/gold letterpress typography throughout.

LAYOUT (keep identical to reference 1):

1) TOP HEADER: small caps "HOW TO ENTER THE MUHA MEMBERS" eyebrow, then the massive cream/gold letterpress display headline "GIVEAWAY" (heavy slab serif with italic, letterpress texture, warm-gold glow), with a flowing cream italic script "Vice City" tucked beneath, flanked by small gold stars.

2) LEFT COLUMN (~upper-middle): the $25,000 CASH PRIZE callout in massive letterpress display caps (gold/cream), "+ ALL-NEW DODGE CHALLENGER" beneath in similar treatment. Below that, the red Dodge Challenger photo on the wet Miami-night street with palm silhouettes, OCEAN DRIVE sign visible to the left.

3) RIGHT COLUMN (numbered steps with phone screenshots):
   - Step 1: large cream numeral "1" + caps eyebrow "GO TO MORE AND TAP 'RAFFLES'" + small phone screenshot showing the in-app menu with Raffles highlighted, with a small cream arrow pointing into the screenshot.
   - Step 2: large cream numeral "2" + caps eyebrow "SELECT 'GTA RAFFLE'" + small phone screenshot showing the raffle list with the GTA Muha card visible.
   - Step 3: large cream numeral "3" + caps eyebrow "TAP 'SCAN RAFFLE TICKET'" + small phone screenshot showing the cash entries view.

4) BOTTOM-LEFT: a white QR code in a cream frame with the flowing cream italic script "SCAN TO FIND OUT!" beside it.

5) BOTTOM-RIGHT: the "GRAND THEFT AUTO Vice City" letterpress logo, exactly as in reference 1.

6) BOTTOM-CENTER FOOTER: "See official rules in app or at muhamembers.com" small caps tracked cream letterpress text.

NEW ELEMENT TO ADD (designed in as a native part of the composition):

7) Between Step 3 and the bottom row (in the lower portion of the right column area, beneath Step 3's phone screenshot), include the GTA Muha raffle TICKET from reference 2 as an integrated hero element. The ticket is a horizontal rectangle (red Challenger photo on the left half showing "CASH PRIZE $25,000 & ALL NEW DODGE CHALLENGER", encrypted ticket / QR scanner area on the right showing "Your Encrypted Raffle Entry Ticket. Scan In Members App To Redeem 10 Entries! No Purchase Necessary"). Render the ticket PIXEL-FAITHFUL to reference 2 — same exact design, same elements, same proportions. Tilt the ticket slightly (~5-8°) for dynamism. Size it so it fits the available right-column lower space cleanly without crowding. Make sure it sits naturally on the dark Vice City background — NO white box, NO bright background panel around it — the ticket's own edges should appear directly on the dark background like a printed card placed on the scene. Add a subtle warm-red rim glow to ground it on the dark backdrop.

CRITICAL: the ticket is part of the design, painted directly into the composition — not pasted on top. It must blend with the Vice City atmosphere. NO white rectangle background, NO separate panel, NO floating cutout look. Just the ticket card itself, integrated.

ASPECT RATIO: 4:5 portrait, 4K resolution.

Negative: do not include a white background or panel behind the ticket, do not overlap any existing element (QR code, GTA logo, footer text, steps), do not change any other element from reference 1, do not change the title, do not change the steps, do not omit the QR code, do not omit the Vice City logo, do not change the disclaimer.`;

function inline(p) { return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } }; }

const body = {
  contents: [{ parts: [inline(LAYOUT_REF), inline(TICKET), { text: PROMPT }] }],
  generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: "4:5", imageSize: "4K" } },
};

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const res = await fetch(url, { method: "POST", headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    fs.writeFileSync(DST, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${DST}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
