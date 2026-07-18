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

const SRC = "Muha Giveaway Redesigned/Disclaimer Updated/content 2 ticket-fixed v2.png";
const DST = "Muha Giveaway Redesigned/Disclaimer Updated/content 2 final v2.png";

const PROMPT = `Reference 1 is the BASE. Output an image that is BYTE-FOR-BYTE IDENTICAL to reference 1, with ONE precisely targeted change.

THE ONLY CHANGE: in the bottom-left area there is a raffle ticket with a WHITE RECTANGULAR FRAME around it. Erase that white rectangle and replace those pixels with the dark Vice City night background (deep dark navy with subtle red ambient glow, matching the dark backdrop visible elsewhere in reference 1). Add a very subtle warm-red rim glow around the ticket's outer edges so it grounds on the dark backdrop.

ABSOLUTE PROTECTION LIST — every single pixel in these areas must be IDENTICAL to reference 1, do NOT regenerate or modify:
1. The three iPhone screenshots and ALL the in-app text inside them (every menu item, every prize row, every small label, every status bar character). Do NOT redraw these. Preserve them exactly.
2. The MM gold monogram at the top — preserve exactly.
3. The "HOW TO ENTER THE MUHA MEMBERS" eyebrow + "GIVEAWAY" letterpress headline + "Vice City" italic script — preserve exactly.
4. The "$25,000 CASH PRIZE + ALL-NEW DODGE CHALLENGER" gold letterpress panel — preserve exactly.
5. The red Dodge Challenger photo — preserve exactly.
6. The OCEAN DRIVE small caption — preserve exactly.
7. The numbered step circles and step caption text (1/2/3 + "GO TO MORE", "SELECT GTA GIVEAWAY", "TAP SCAN GIVEAWAY TICKET") — preserve exactly.
8. The "SCAN HERE!" cream italic script callout + curved arrow — preserve exactly.
9. The GRAND THEFT AUTO Vice City logo at bottom-right — preserve exactly.
10. The disclaimer text at the bottom — preserve exactly.
11. The raffle ticket's own internal artwork (red left panel with car + $25,000 + DODGE CHALLENGER, dark/cream right panel with QR code + Your Encrypted Raffle Entry Ticket + WITH SCAN + Scan In Members App + Raffle ID + No Purchase Necessary) — preserve exactly. Only the WHITE FRAME outside the ticket's colored panels gets erased.

The cream/tan colored right half of the ticket is part of the ticket's design and is NOT what you're removing. You are ONLY removing the white rectangle that surrounds the ticket from outside, separating it from the dark Vice City backdrop.

Output must be 4:5 portrait, 4K.

Negative: do NOT regenerate or redraw any of the iPhone screenshot text, do NOT alter any other element, do NOT change the cream/tan ticket panel (that's the ticket itself), do NOT add a different colored frame, do NOT shift any element's position.`;

function inline(p) { return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } }; }

const body = {
  contents: [{ parts: [inline(SRC), { text: PROMPT }] }],
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
