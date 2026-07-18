#!/usr/bin/env node
// NuLumin master 30x70 poster — NO-LOGO / NO-FOOTER variant. Same layout as the master poster,
// but the top logo area (purple band) and the bottom "MANUFACTURED BY / nulumin.org" footer
// (green band) are left as EMPTY reserved space (clusters stay put). gpt-image-2, portrait 1024x1536.
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = "gpt-image-2";
const SIZE = "1024x1536";
const outDir = "Nulumin Booth/30x70 Master Poster";
fs.mkdirSync(outDir, { recursive: true });

// NOTE: logo ref removed on purpose — vials are now REFERENCE IMAGE 1..5.
const REFS = [
  "NuLumin Assets/NuL_BPC_10mg.png",
  "NuLumin Assets/NuL_Ipamorelin_5mg.png",
  "NuLumin Assets/NuL_NAD_500mg.png",
  "NuLumin Assets/NuL_GLP1_10mg.png",
  "NuLumin Assets/NuL_Semax_10mg.png",
];

const PROMPT = `Design a tall portrait NuLumin Bio-Sciences master poster intended for 30×70 inch print, composed for clean side-cropping to that aspect ratio.

CROP-SAFETY (THE SINGLE MOST IMPORTANT RULE): the finished poster is cropped to a NARROW 30×70 ratio, which trims roughly the OUTER 20% of the WIDTH off BOTH the left and right sides. Therefore ALL TEXT and ALL VIALS must sit INSIDE THE CENTRAL 60% of the image width — between 20% and 80% from the left. Specifically: every eyebrow's text starts no closer to the left than ~24% of the width and every vial ends by ~76% of the width, with a LARGE empty band-color margin (~20%+) on BOTH the left of the text and the right of the vial. NOTHING important — above all the eyebrow text — may sit in the outer 20% on the left or right, or it WILL be cut off when scaled to 30×70 in. The colored band backgrounds may bleed to the full width, but the eyebrow text and vials stay centered in the middle 60%. Keep ~4% empty margin top and bottom as well.

TOP OF PURPLE BAND — RESERVED EMPTY (NO LOGO): Leave the top area of the purple Tissue Research band COMPLETELY EMPTY. The same space the NuLumin logo would normally occupy stays as clean purple band background (with its soft atmospheric glow only) and contains NOTHING — NO logo, NO 'NuLumin' wordmark, NO multi-color spectrum/pill bar, NO 'BIO-SCIENCES' text, NO horizontal rule, NO text or mark of any kind. Keep this empty reserved zone the SAME HEIGHT it had with the logo; do NOT move the eyebrow + vial cluster up to fill it — the cluster still sits BELOW this empty top area exactly where it was.

FIVE HORIZONTAL HERO BANDS stacked top→bottom in spectrum order, FILLING THE ENTIRE INNER CONTENT AREA edge-to-edge with NO white strips between them and no white above or below — the bands occupy 100% of the inner zone. The TOP FOUR bands (purple, pink, blue, gold) are EXACTLY EQUAL in height. The bottom GREEN band is the TALLEST band: its CONTENT area (where the eyebrow + vial sit) is the SAME height as the other four bands, but extra EMPTY GREEN space is added BELOW that content (see green band note). The green band is therefore taller than the others — it must NEVER be shorter, thinner, smushed, or compressed; its larger height comes from empty green added beneath the cluster, never from shrinking the cluster or vial. Inside each band, the eyebrow + vial together form a UNIFIED CENTERED CLUSTER that sits AT THE HORIZONTAL MIDDLE of the band (NOT at the left edge). Layout within each band: the eyebrow + vial form a CENTERED cluster sitting in the MIDDLE 60% of the width. The category EYEBROW (BOLD WHITE UPPERCASE wide-tracked Libre Franklin, 2 stacked lines) starts at about 24–26% from the left (a LARGE empty band-color margin on its left), then a comfortable gap, then ONE single hero VIAL directly to its right, the vial ending by about 74% from the left (a LARGE empty band-color margin on its right). The eyebrow text must be pulled toward center — NOT near the left band edge — so the narrow 30×70 side-crop never clips it. The EYEBROW TEXT is VERTICALLY CENTERED within its colored band — its vertical midpoint aligned to the band's vertical center AND level with the vial's vertical midpoint (eyebrow and vial share the same centerline; neither high nor low). This applies to ALL FIVE bands identically. The cluster's MIDPOINT sits at the horizontal center of the band. The whole eyebrow-+-vial pair is pulled toward the horizontal middle of the band with comfortable equal whitespace on BOTH the left side (between the band's left edge and the eyebrow) AND the right side (between the vial and the band's right edge). Behind/around the cluster, an atmospheric category-themed graphic glows softly. The TOP band (Purple/Tissue) keeps the EMPTY reserved area at its very top (no logo, described above), with the eyebrow + vial cluster sitting beneath it (centered, indented from the left). The BOTTOM band (Green/Neural) holds the eyebrow + vial cluster pushed UP into its UPPER portion, deliberately leaving a GENEROUS EMPTY reserved strip across its very bottom (the footer/link space, described below) — the green cluster must NOT be vertically centered in its band and must NOT extend down into that bottom strip.

VIAL FIDELITY (CRITICAL): each band's hero vial must reproduce the matching product reference image PIXEL-FAITHFULLY — same clear glass body, same TALL SLIM PROPORTIONS (the NuLumin vial is taller than it is wide, with a ~2.2:1 height-to-width ratio — never squished, never compressed vertically), same wrap-label, same 'NuLumin · BIO-SCIENCES' brand bar at the top of the label, same italic BLACK serif product name, same dose in the band color, same tiny 'Manufactured by NuLumin' fine print at the base of the VIAL LABEL (this small print is part of the product label and stays), same metallic cap in the band color. Do NOT redraw, do NOT improvise, do NOT squish, do NOT compress vertically. ALL FIVE VIALS share the SAME identical height-to-width proportions — the Semax (green band) vial, BPC-157 (purple), Ipamorelin (pink), NAD+ (blue), and GLP-1 (gold) must all look like the same vial silhouette photographed at the same scale. The Semax vial in particular must NOT be squished/shorter than the others.

BANDS:

1. PURPLE (#6A2BAF radial). Eyebrow 'TISSUE / RESEARCH'. Centered vial: REFERENCE IMAGE 1 (BPC-157 10mg, purple cap) reproduced faithfully. Atmospheric graphic: glowing translucent muscle-fiber strands and collagen helix bundles in lighter lavender, soft cinematic depth.

2. PINK (#DB3A8E radial). Eyebrow 'ENDOCRINE / RESEARCH'. Centered vial: REFERENCE IMAGE 2 (Ipamorelin 5mg, pink cap). Atmospheric graphic: glowing DNA double helix + floating hormone-molecule orbs in lighter rose tones.

3. BLUE (#2D90D3 radial). Eyebrow 'CELLULAR / RESEARCH'. Centered vial: REFERENCE IMAGE 3 (NAD+ 500mg, blue cap). Atmospheric graphic: glowing translucent cell cross-sections with mitochondria and nuclei in lighter sky-cyan tones.

4. GOLD (#DBA32C radial). Eyebrow 'METABOLIC / RESEARCH'. Centered vial: REFERENCE IMAGE 4 (GLP-1 10mg, gold cap). Atmospheric graphic: glowing metabolic-pathway diagram with glucose/ATP icons and flowing energy arrows in lighter amber tones.

5. GREEN (#2E9F6E radial). Eyebrow 'NEURAL / RESEARCH'. Centered vial: REFERENCE IMAGE 5 (Semax 10mg, green cap). Atmospheric graphic: glowing neurons firing synaptic light pulses with branching dendrites in lighter mint tones.

Each atmospheric graphic is luminous, ambient, premium and LIVES STRICTLY BEHIND the eyebrow and vial — NEVER drawn over, on top of, or obscuring the eyebrow text or vial. The eyebrow text and vial sit in the FOREGROUND with full opacity; the graphic occupies the band's outer flanks (especially the LEFT side of the eyebrow and the RIGHT side of the vial), fading toward the center where the cluster lives. Every letter of every eyebrow ('TISSUE RESEARCH', 'ENDOCRINE RESEARCH', 'CELLULAR RESEARCH', 'METABOLIC RESEARCH', 'NEURAL RESEARCH') is fully visible, crisp, and unobstructed. Thin white hairline dividers separate adjacent bands.

GREEN BOTTOM BAND — TALLER, WITH AN EMPTY GREEN FOOTER ZONE (CRITICAL, NO SQUISH): The bottom green Neural Research band is the TALLEST band, made of two stacked parts, both solid green:
(1) a TOP CONTENT part the SAME height as a normal band, holding the 'NEURAL RESEARCH' eyebrow + Semax vial cluster — vertically centered within this content part and the SAME SIZE as the other bands' clusters (the Semax vial is identical in size/height/proportions to the other four vials);
(2) DIRECTLY BELOW it, still the same green, an EMPTY GREEN FOOTER ZONE about 14% of the total poster height that contains ABSOLUTELY NOTHING — no text, no footer, no 'MANUFACTURED BY', no URL, no bar, no mark — a clean empty green area reserved for a link to be added later.
So the green simply EXTENDS DOWNWARD as empty space beneath the vial. The cluster and vial are NOT shrunk, squished, or moved — the extra space is purely added green BELOW them. The empty green footer zone must be clearly visible at the very bottom of the poster.

STRICT: Do NOT render any NuLumin logo, wordmark, spectrum/pill bar, 'BIO-SCIENCES' text, footer, 'MANUFACTURED BY' line, or URL anywhere on the poster — the top of the purple band and the bottom of the green band are intentionally left as empty reserved band-colored space. The ONLY small text allowed is the category eyebrows and the faithful print that already exists on each vial's own label.

Photorealistic, clinical, premium, luxury science-brand campaign poster.`;

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
console.log(`Generating NuLumin master poster — NO-LOGO/NO-FOOTER (gpt-image-2)...`);

const form = new FormData();
form.append("model", MODEL);
form.append("prompt", PROMPT);
form.append("size", SIZE);
form.append("quality", "high");
form.append("n", "1");
for (const ref of REFS) {
  const buf = fs.readFileSync(ref);
  form.append("image[]", new Blob([buf], { type: "image/png" }), path.basename(ref));
}

const res = await fetch("https://api.openai.com/v1/images/edits", {
  method: "POST", headers: { Authorization: `Bearer ${API_KEY}` }, body: form,
});
if (!res.ok) { console.error(`HTTP ${res.status}: ${(await res.text()).slice(0, 500)}`); process.exit(1); }
const item = ((await res.json()).data || [])[0];
if (!item?.b64_json) { console.error("no b64_json"); process.exit(1); }
const out = `${outDir}/${stamp}_nulumin-master-30x70-nologo.png`;
fs.writeFileSync(out, Buffer.from(item.b64_json, "base64"));
console.log(`✓ ${out}`);
try { execSync(`open -a Preview "${out}"`); } catch {}
