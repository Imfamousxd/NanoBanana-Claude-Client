#!/usr/bin/env node
// Redo Lexi — same bold coral design, but a far more PHOTOREAL person (the
// previous one looked artificial). Fresh generation (no ref), lowercase email.
// 3 takes to choose from.
import fs from "fs";

const PHOTOREAL = `THE PERSON MUST LOOK LIKE A REAL PHOTOGRAPH OF A REAL WOMAN — a genuine professional headshot, NOT an AI render, NOT CGI, NOT a 3D character, NOT airbrushed. White woman, late 20s, trendy long caramel-brown hair with natural flyaways, warm genuine smile. Shot on a full-frame camera with an 85mm portrait lens: authentic skin with visible pores, fine texture, subtle natural blemishes and faint under-eye lines, real catchlights in the eyes, soft true-to-life studio lighting, natural color. Absolutely NO plastic or waxy over-smoothed skin, no doll-like symmetry, no glossy CGI sheen, no uncanny eyes. She wears a tailored terracotta-orange blazer over a white top — confident, approachable, real.`;

const jobs = [1, 2, 3].map((take) => ({
  prompt: `Design a modern, attention-grabbing REAL-ESTATE marketing flier, portrait 3:4 — bold modern geometric layout in a vibrant coral-orange (#E8552B) and off-white palette. The realtor's photo is cut out cleanly and placed over big overlapping coral-orange shapes; an oversized "REALTOR" word is used as a graphic element; a chunky modern house line-icon anchors the lower-left; clean confident sans-serif type.

${PHOTOREAL}

Typography, all crisp and correctly spelled with real legible letterforms (no gibberish, no warped or doubled text):
- The first name LARGE and bold: "Lexi"
- The title: "REALTOR"
- The email in a tidy contact block, in ALL LOWERCASE with no spaces, exactly: "lexi@oviocrewhq.com"
Do NOT invent a company name, logo, or phone number.`,
  aspectRatio: "3:4",
  imageSize: "4K",
  refImages: [],
  _meta: { name: `lexi-redo-take${take}` },
}));

fs.writeFileSync("realtor-fix-lexi.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} Lexi photoreal redo jobs`);
