#!/usr/bin/env node
// v3 — be aggressive about drawing the capsule clearly visible INSIDE the bag.
// The bag is clear/translucent so the capsule reads as a solid line-art shape
// behind the bag's front face, sitting inside the sealed pouch.
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

const PRIOR = "DIaled Health Instruction Graphics/generations/2026-05-21T23-06-15_bag-into-mailer-v2.jpg";
const TUBE_REF = "DIaled Health Instruction Graphics/Product Refs/protector tube.png";
const TUBE_TOP_REF = "DIaled Health Instruction Graphics/Product Refs/protector tube top.png";
const STEP17_REF = "DIaled Health Instruction Graphics/Approved/17.png";

const PROMPT = `Take reference image 1 (the prior generation showing a hand sliding a clear DIALED HEALTH-branded zip-seal bag into a poly bubble mailer with a shipping label). Reproduce reference 1 PIXEL-FAITHFULLY — same composition, same hand position, same bag position, same mailer silhouette, same shipping label, same DH logo on the bag, same QR code, same line-art style, same 1:1 framing.

CRITICAL CORRECTION — the prior generation forgot to draw the protector capsule inside the bag. ADD the DIALED HEALTH protector capsule clearly visible INSIDE the bag now. The bag is a CLEAR TRANSLUCENT zip-seal pouch — you SEE the capsule through the plastic just like in reference 4 (step 17, where the capsule is visible going into the bag). Draw the capsule as a clean LINE-ART SHAPE positioned in the LOWER-MIDDLE of the visible bag area (the portion of the bag still sticking out above the mailer's open top).

CAPSULE SPEC (use references 2 and 3 for visual ref):
- Vertical cylindrical capsule, stubby pill-bottle proportions (total height ≈ 1.5x diameter)
- TOP 40% of the capsule: black cylindrical cap with the word "DIALED" embossed/printed across its side wall in bold sans-serif. The cap is filled with SOLID BLACK in line-art.
- BOTTOM 60% of the capsule: white cylindrical body with the word "HEALTH" embossed/printed across its side wall in bold sans-serif. The body is a clean outline (no fill).
- When assembled the brand reads "DIALED HEALTH" across the joined cap+body.
- The capsule is positioned in the visible portion of the bag that is ABOVE the mailer's open top edge (so the viewer sees both the bag's logo + QR area AND the capsule inside).
- Bag plastic is translucent — show the capsule's full outline distinctly through the bag (NOT ghosted, NOT faint — clean firm line-art).

ZIP-SEAL: clearly CLOSED at the top of the bag — show the zip-seal as two parallel thin horizontal lines (a sealed continuous closure), not pinched open.

Everything else from reference 1 stays IDENTICAL: the hand, the mailer (silhouette, bubble texture, open top), the shipping label (header, TO/FROM blocks, barcode), the DH logo on the bag, the QR code, the line-weights, the white background.

Negative: do NOT draw the capsule OUTSIDE the bag or floating elsewhere — it must be visibly INSIDE the bag. Do NOT make the capsule faint or invisible. Do NOT show the bag open at the top. Do NOT add color. Do NOT redraw the hand or mailer. Do NOT add a second capsule or a vial alongside. No captions/numbers/arrows.`;

function inline(p) {
  return { inline_data: { mime_type: p.endsWith(".png") ? "image/png" : "image/jpeg", data: fs.readFileSync(p).toString("base64") } };
}

const body = {
  contents: [{ parts: [inline(PRIOR), inline(TUBE_REF), inline(TUBE_TOP_REF), inline(STEP17_REF), { text: PROMPT }] }],
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
    const dst = path.join(OUT, `${ts}_bag-into-mailer-v3.jpg`);
    fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
    console.log(`✓ ${dst}`);
    process.exit(0);
  }
}
console.error("no image in response"); process.exit(1);
