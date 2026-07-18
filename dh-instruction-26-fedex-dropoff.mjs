#!/usr/bin/env node
// Final step — the poly bubble mailer from step 25 being dropped off at a
// FedEx drop box. Hand inserting the mailer into the drop-box slot. Black
// line-art on white, 1:1, 4K. Refs: step 25 (so the mailer matches), mailer
// texture, DH logo (in case any branding shows).
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
const OUT = "DIaled Health Instruction Graphics/generations";

const STEP25 = "DIaled Health Instruction Graphics/Approved/25.png";
const MAILER_REF = "DIaled Health Instruction Graphics/mailer.jpeg";

const PROMPT = `A generic medical-product instruction illustration in simple black line-art on a pure white background, in the universal patient-information-leaflet style. Uniform medium-weight black ink lines on clean white, NO COLOR anywhere. Minimal short parallel hatching only for soft shadow / volume. No frame, no border, no captions, no numbers, no extra arrows, no decorative elements. Subject centered in a 1:1 square composition with generous clean white margins. Drawn-by-hand line work.

SCENE — depict a hand dropping the sealed poly bubble mailer (from reference 1, step 25 — the white padded mailer with the shipping label on its front face) into the slot of a FedEx drop box at a FedEx drop-off location.

THE FEDEX DROP BOX (right two-thirds of frame, standing tall):
A recognizable freestanding FedEx drop box — rectangular box with rounded/chamfered top and sides, standing on a small base, with a horizontal pull-down LETTER SLOT door near the top. The slot is shown OPEN — the door pulled outward as a small hinged drawer, exposing the dark interior. Drawn entirely in clean black line-art on the white background (no orange/purple fill). On the FRONT face of the drop box, BELOW the open slot, the wordmark "FedEx" printed cleanly in the iconic FedEx typography (the lowercase 'e' in 'Fed' adjacent to the capital 'E' in 'Ex' — same recognizable lockup as the real FedEx wordmark). Beneath the wordmark in smaller line-art type, the phrase "EXPRESS DROP OFF" in tracked caps. The box body has a subtle vertical seam line indicating the door panel where the slot is.

THE HAND + MAILER (left and upper portion of frame):
A hand enters from the LEFT side of the frame holding the POLY BUBBLE MAILER from reference 1 — the white padded mailing pouch with the bubble-wrap texture suggested by light irregular line work, and a SHIPPING LABEL on its visible face (rectangular label outline with bold caps header, TO/FROM placeholder bars, and a horizontal barcode at the bottom — exactly as drawn on the mailer in reference 1). The hand grips the mailer with thumb-on-top fingers-underneath in a natural lateral push, and the FRONT END of the mailer is mid-action passing INTO the open drop-box slot — roughly the leading 40% of the mailer already inside the slot, the trailing 60% still visible outside in the hand. The mailer is angled at a slight downward tilt as it enters the slot.

KEY VISUAL RULES (locked from prior approved instruction graphics):
- The FedEx wordmark must be CLEARLY DRAWN and recognizable — the iconic 'FedEx' lockup, NOT generic placeholder text.
- The mailer's shipping label must remain visible on the trailing portion of the mailer still in the hand — drawn the same as in reference 1.
- Black line-art ONLY — NO color anywhere (no orange, no purple, no FedEx brand colors filled in). Just black ink on white.
- Hand-drawn instruction-illustration style consistent with the existing approved set.

Negative: no color anywhere (no FedEx orange/purple fills, no skin tones, no gray fills), no biohazard, no second mailer, no second hand, no extra people, no FedEx truck or storefront (just the freestanding drop box), no captions/numbers/arrows in the illustration, no FedEx logo warped or misspelled.`;

function inline(p) {
  return { inline_data: { mime_type: p.endsWith(".png") ? "image/png" : "image/jpeg", data: fs.readFileSync(p).toString("base64") } };
}

const body = {
  contents: [{ parts: [inline(STEP25), inline(MAILER_REF), { text: PROMPT }] }],
  generationConfig: {
    responseModalities: ["TEXT", "IMAGE"],
    imageConfig: { aspectRatio: "1:1", imageSize: "4K" },
  },
};

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const res = await fetch(url, {
  method: "POST",
  headers: { "x-goog-api-key": GEMINI_KEY, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`); process.exit(1); }
const data = await res.json();
for (const part of data?.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const dst = path.join(OUT, `${ts}_fedex-dropoff.jpg`);
    fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${dst}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
