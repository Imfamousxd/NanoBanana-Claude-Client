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
const SRC = "Muha Giveaway Redesigned/Disclaimer Updated/content 2.png";
const TICKET = "Muha Giveaway Assets/gta muha card.png";
const DST = "Muha Giveaway Redesigned/Disclaimer Updated/content 2 with ticket v2.png";

const PROMPT = `Reference 1 is the layout TARGET. Reference 2 is the GTA Muha raffle ticket asset to ADD into reference 1. Reproduce reference 1 PIXEL-FAITHFULLY in every aspect — same title, same Vice City script, same $25,000 + Challenger callouts, same car photo, same 3 numbered steps with phone screenshots, same QR code, same SCAN TO FIND OUT callout, same Grand Theft Auto Vice City logo, same disclaimer, same background, same composition. Every existing element stays in its existing position at its existing size.

ONLY CHANGE: ADD the GTA Muha raffle ticket from reference 2 as a new element placed in an empty area of the layout where it does NOT overlap or conflict with any existing element. Render the ticket PIXEL-FAITHFUL to reference 2 (red Challenger photo on the left half, $25,000 + ALL NEW DODGE CHALLENGER text in the middle, encrypted ticket / QR scanner area on the right) — just drop the ticket in as-is. Size it appropriately to fit cleanly in available empty space (roughly 25-35% of canvas width). Pick whichever empty zone fits cleanest without overlapping any existing element. Do NOT add any callout text, label, glow, halo, or any other accompanying element — just the ticket itself.

CRITICAL: do NOT cover, crop, displace, resize, or alter ANY existing element. The title, Vice City script, $25,000 + Challenger callouts, car photo, 3 numbered steps, phone screenshots, QR code, SCAN callout, GTA Vice City logo, and disclaimer all remain exactly as they were in reference 1. The ticket is purely ADDITIVE — it goes into empty negative space only.

Negative: do NOT overlap any existing text or graphic, do NOT shrink or move any existing element, do NOT change the title, do NOT change the steps, do NOT change the QR code, do NOT change the car photo, do NOT change the background, do NOT alter the disclaimer.`;

function inline(p) { return { inline_data: { mime_type: "image/png", data: fs.readFileSync(p).toString("base64") } }; }

const body = {
  contents: [{ parts: [inline(SRC), inline(TICKET), { text: PROMPT }] }],
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
