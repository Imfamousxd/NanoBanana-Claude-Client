#!/usr/bin/env node
// Lily — regenerate FRESH (no ref) so the email renders lowercase. Anchor-derive
// kept copying the uppercase domain from the source image. Original lavender
// design + photoreal person + lowercase email. 3 takes.
import fs from "fs";

const PHOTOREAL = `THE PERSON MUST LOOK LIKE A REAL PHOTOGRAPH OF A REAL WOMAN — a genuine professional headshot, NOT an AI render, NOT CGI, NOT a 3D character, NOT airbrushed. South Asian woman, late 20s, long dark hair, gentle confident smile. Shot on a full-frame camera with an 85mm portrait lens: authentic skin with visible pores and natural texture, real catchlights, soft true-to-life studio lighting. NO plastic or waxy over-smoothed skin, no doll-like symmetry, no glossy CGI sheen. She wears a soft lavender blazer over a white top — polished and approachable.`;

const jobs = [1, 2, 3].map((take) => ({
  prompt: `Design a modern, attention-grabbing REAL-ESTATE marketing flier, portrait 3:4 — soft lavender-purple (#8E73C7) and white palette. Layout: a bold lavender graphic header band across the top holding the name and title; a half-body portrait of the realtor anchored at the bottom; a clean white contact strip along the very bottom for the email; a minimalist key-in-door / keys line-icon as an accent. Clean confident sans-serif typography, strong hierarchy, generous spacing.

${PHOTOREAL}

Typography, all crisp and correctly spelled with real legible letterforms (no gibberish, no warped or doubled text):
- The first name LARGE and bold: "Lily"
- The title: "REALTOR"
- The email on the bottom contact strip, in ALL LOWERCASE with no spaces and no capital letters, exactly: "lily@puroratehq.com"
Do NOT invent a company name, logo, or phone number.`,
  aspectRatio: "3:4",
  imageSize: "4K",
  refImages: [],
  _meta: { name: `lily-redo-take${take}` },
}));

fs.writeFileSync("realtor-redo-lily.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} Lily fresh redo jobs`);
