#!/usr/bin/env node
// NuLumin Bio-Sciences launch flyers v6 — REAL/grounded editorial photography
// angles, not the AI-floating-splash look. Two concepts: real hand hold (A)
// and morning-ritual countertop (B). Both 3:4 4K via Nano Banana.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(__dirname, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";
const OUT_DIR = "NuLumin Assets/Launch";
fs.mkdirSync(OUT_DIR, { recursive: true });

const ASSETS = "NuLumin Assets";
const LOGO = `${ASSETS}/NuLumin-logo-nobg-black.png`;
const BPC = `${ASSETS}/NuL_BPC_10mg.png`;
const GLP1 = `${ASSETS}/NuL_GLP1_10mg.png`;
const IPA = `${ASSETS}/NuL_Ipamorelin_10mg.png`;

const SHARED = `Reproduce the NuLumin Bio-Sciences lockup FAITHFULLY from reference 1 (the wordmark "NuLumin" with "Nu" bold + "Lumin" thin, divider line, "BIO-SCIENCES" tracked-out caps tagline, and the signature 5-segment color spectrum band of lavender / blue / mint / gold / coral on the LEFT of the wordmark). Vial labels must match their product reference images one-to-one.`;

const PHOTO_LANG = `Shot on a Leica Q3 at f/1.7, ISO 400, natural daylight only, subtle Kodak Portra 400 film grain, mild lens vignetting at the corners, gentle highlight rolloff. Real-world editorial product photography — NOT a glossy studio render, NOT a hero floating composition, NOT splashes, NOT levitating objects, NOT chrome reflections, NOT AI-perfect symmetry. Imperfect, lived-in, photographic.`;

const jobs = [
  // ── A — Real hand hold ───────────────────────────────────────────────────────
  {
    prompt: `Editorial 3:4 vertical product photograph for NuLumin Bio-Sciences launch — REAL, GROUNDED, photojournalistic.

SCENE: a real human hand (Caucasian, mid-30s, slight veining on the back of the hand, a small simple silver watch peeking from the cuff of a cream linen sleeve, natural skin texture with fine pores and one small natural mole) holds the NuLumin BPC-157 10mg vial (reference 2) vertically between thumb and index finger near a north-facing kitchen window. Morning daylight falls in from frame-right, gently spilling across the vial's pastel-lavender cap and the printed label — the NuLumin Bio-Sciences mini-lockup on the label is sharp and readable. The hand and vial occupy the upper-middle 60% of the frame. Background: softly out-of-focus kitchen — a hint of an old white-painted wall, a brass faucet at the edge of focus, a single dried eucalyptus stem in a slim ceramic vase. Shallow depth of field (~f/1.7), bokeh blur on the background. A tiny condensation droplet rolls down the vial side. Everything reads PHOTOGRAPHIC and HONEST — no floating elements, no glow halo, no neon, no splash.

TYPOGRAPHY (LOWER 25% of canvas — a narrow editorial caption block that does NOT compete with the photo):
- ${SHARED} Place this NuLumin lockup centered horizontally near the BOTTOM of the frame at ~88% from top, sized so the wordmark spans ~32% of canvas width.
- Just above the lockup, a single thin horizontal hairline in soft warm-gray, ~22% canvas width, centered.
- Below the lockup, one small line of tracked-out caps copy: "NOW AVAILABLE  ·  31 RESEARCH PEPTIDES" in a clean modern sans, warm-gray #6B6258 at 80% opacity.
- NO huge headline, NO oversized "ARRIVED", NO heavy graphic blocks. Editorial restraint.

${PHOTO_LANG}

Negative: no chrome studio shine, no levitating vial, no water splash arcs, no neon, no cosmic background, no dramatic colored gradient, no AI-perfect hand, no warped logo, no missing BIO-SCIENCES tagline, never write "32" or "RAFFLE".`,
    aspectRatio: "3:4",
    imageSize: "4K",
    refImages: [LOGO, BPC],
    _meta: { name: "nulumin-launch-real-A-hand-hold" },
  },

  // ── B — Morning ritual countertop ────────────────────────────────────────────
  {
    prompt: `Editorial 3:4 vertical photograph for NuLumin Bio-Sciences launch — Wirecutter / Kinfolk-grade still life on a real countertop.

SCENE: a light-oak butcher-block countertop in a quiet home kitchen, shot from a slight 3/4 high angle. Sitting on the countertop in a casual but composed arrangement:
- THREE NuLumin vials standing in a tight cluster, slightly staggered (front-center, back-left, back-right): BPC-157 10mg (reference 2, lavender cap), GLP-1 10mg (reference 3, gold cap), Ipamorelin 10mg (reference 4, coral cap) — labels facing camera, mini NuLumin Bio-Sciences lockup readable on each, real subtle reflections of the oak grain in the glass body
- A clear water glass (lightly fingerprint-marked) half full of room-temperature water, condensation just starting to bead on its side, sitting just behind and right of the vials
- A folded ivory linen napkin with one corner softly creased, draped behind the vials
- A small leather-bound notebook (cracked spine, hand-worn) closed flat to the left, with a slim brass-tipped fountain pen resting on it
- A faint coffee-cup ring stain on the oak just below the napkin (real, lived-in)
A window casts soft morning daylight from the LEFT, throwing a clean angled rectangle of light and the gridded shadow of an old wooden window-frame across the countertop. The vials sit within the bright patch of light.

The background falls into soft focus — a hint of a beige wall, a wooden cabinet edge, no clutter, no clutter signage. Restrained, calm, grown-up.

TYPOGRAPHY (TOP-LEFT corner, tight editorial caption):
- ${SHARED} Place this NuLumin lockup in the TOP-LEFT, sized so the wordmark spans ~30% of canvas width.
- Below the lockup, a small kicker in two lines: line 1 "NOW AVAILABLE" tracked-out caps bold, line 2 "31 research-grade peptides" in a clean light serif. Both in deep warm-gray #4A433D.
- NO huge headline, NO oversized headline graphic. Like a print-magazine subtitle.

${PHOTO_LANG}

Negative: no chrome studio shine, no levitating vials, no water splash arcs, no flying ice, no neon, no cosmic background, no dramatic colored gradient, no AI-perfect symmetry, no warped logo, no missing BIO-SCIENCES tagline, no extra logos, no flying objects in mid-air, never write "32" or "RAFFLE".`,
    aspectRatio: "3:4",
    imageSize: "4K",
    refImages: [LOGO, BPC, GLP1, IPA],
    _meta: { name: "nulumin-launch-real-B-countertop" },
  },
];

function loadInline(p) {
  const buf = fs.readFileSync(p);
  return { inline_data: { mime_type: "image/png", data: buf.toString("base64") } };
}

async function runJob(job, attempt = 1) {
  const parts = [
    ...job.refImages.map(loadInline),
    { text: job.prompt },
  ];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { aspectRatio: job.aspectRatio, imageSize: job.imageSize },
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await new Promise(r => setTimeout(r, 5000 * attempt));
      return runJob(job, attempt + 1);
    }
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  for (const part of data?.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const dst = path.join(OUT_DIR, `${job._meta.name}.png`);
      fs.writeFileSync(dst, Buffer.from(part.inlineData.data, "base64"));
      console.log(`✓ ${dst}`);
      return dst;
    }
  }
  throw new Error("no image in response");
}

const results = await Promise.allSettled(jobs.map(j => runJob(j)));
for (let i = 0; i < results.length; i++) {
  if (results[i].status === "rejected") console.error(`✗ ${jobs[i]._meta.name}: ${results[i].reason.message}`);
}
