#!/usr/bin/env node
// Realtor fliers — one per agent. 3:4 / 4K, gpt-image-2 (AI-generated person,
// no ref). Each: a distinct professional woman, attention-grabbing real-estate
// design, big NAME + "REALTOR" + the EXACT email. No brand name.
import fs from "fs";

const REALISM = `The person is a photorealistic AI-generated professional headshot/half-body portrait — natural skin texture, friendly confident expression, sharp catchlights, studio-quality lighting, business attire (blazer). She must look like a real, polished real-estate agent, not CGI or cartoon.`;

const DESIGN = `Design a modern, attention-grabbing REAL-ESTATE marketing flier, portrait 3:4. Professional agency-grade graphic design: bold clean geometric layout, confident sans-serif typography, strong hierarchy, tasteful use of the accent color, and a clear real-estate motif (e.g. a sleek modern house line-icon, keys, "SOLD"/"FOR SALE" cue, or a contemporary home silhouette) so it instantly reads as a realtor flier. Clean, premium, well-balanced — not cluttered.`;

const TEXT_RULE = (name, email) =>
  `Typography must include, all crisp and correctly spelled with real legible letterforms (NO gibberish, NO missing/extra letters, NO warped text):
- The agent's first name LARGE and prominent: "${name}"
- The title beneath it: "REALTOR"
- The email address, clearly legible, spelled letter-for-letter EXACTLY: "${email}"
Do NOT invent a company name, logo, phone number, or any other text.`;

const AGENTS = [
  { name: "Fernanda", email: "fernanda@irvoflowhq.com",
    look: "Latina woman, early 30s, warm brown eyes, dark wavy hair, navy blazer over white top",
    accent: "deep teal with brushed-gold accents",
    layout: "portrait on the right two-thirds; a bold teal color block on the left holding the name, REALTOR title and email stacked; a thin gold modern-house line icon as accent" },
  { name: "Samara", email: "samara@irvoflowhq.com",
    look: "Black woman, mid 30s, natural voluminous curls, radiant smile, crisp white blazer",
    accent: "emerald green with cream",
    layout: "large circular portrait cutout in the upper area on a cream background; bold emerald banner across the lower third with the name, REALTOR and email; small keys + city-skyline line motif" },
  { name: "Harmony", email: "harmony@irvoflowhq.com",
    look: "East Asian woman, late 20s, sleek straight black hair, elegant, soft-pink blouse under a grey blazer",
    accent: "blush rose with charcoal",
    layout: "diagonal split composition — portrait fills one diagonal half, a blush-rose graphic panel the other; name + REALTOR + email set cleanly in the panel; a minimalist house + sold-tag icon" },
  { name: "Sandra", email: "sandra@puroratehq.com",
    look: "White woman, early 40s, polished shoulder-length blonde-brown hair, approachable, deep-burgundy blazer",
    accent: "rich burgundy with warm beige",
    layout: "classic editorial — portrait on the left half, a beige text panel on the right with an elegant burgundy header bar carrying the name, REALTOR and email; refined home illustration accent" },
  { name: "Mila", email: "mila@puroratehq.com",
    look: "Eastern-European woman, early 30s, light blonde hair in a low bun, sharp, light-grey power suit",
    accent: "ice blue with white",
    layout: "near full-bleed portrait with a frosted ice-blue info bar across the bottom holding the name, REALTOR and email; a sleek modern glass-house line icon top corner" },
  { name: "Lily", email: "lily@puroratehq.com",
    look: "South Asian woman, late 20s, long dark hair, gentle confident smile, lavender blazer",
    accent: "soft lavender purple with white",
    layout: "graphic header band on top with the name + REALTOR in bold, half-body portrait anchored bottom; email on a clean strip; a key-in-door line motif" },
  { name: "Lexi", email: "lexi@oviocrewhq.com",
    look: "White woman, late 20s, trendy long caramel hair, energetic, terracotta-orange blazer",
    accent: "vibrant coral-orange with off-white",
    layout: "bold modern geometric — portrait cut out over big overlapping coral shapes; oversized REALTOR word as a design element; name + email in a tidy contact block; chunky house icon" },
  { name: "Savannah", email: "savannah@oviocrewhq.com",
    look: "Black woman, mid 30s, sleek straight hair, elegant and luxe, black blazer with gold jewelry",
    accent: "matte charcoal with metallic gold",
    layout: "luxury dark theme — dark charcoal background, portrait prominent, gold serif-free name + REALTOR + email; a refined gold luxury-home silhouette" },
  { name: "Calista", email: "calista@oviocrewhq.com",
    look: "Mediterranean (Greek) woman, early 30s, dark wavy hair, sun-kissed, terracotta-and-cream outfit",
    accent: "warm terracotta with sand",
    layout: "warm modern — portrait right, soft terracotta sun-arc graphic behind; name + REALTOR + email on a sand panel left; keys + sun + house line motif" },
];

const jobs = AGENTS.map((a) => ({
  prompt: `${DESIGN}

Accent color palette: ${a.accent}.
Layout: ${a.layout}.

THE PERSON: ${a.look}. ${REALISM}

${TEXT_RULE(a.name, a.email)}`,
  aspectRatio: "3:4",
  imageSize: "4K",
  refImages: [],
  _meta: { name: a.name.toLowerCase() },
}));

fs.writeFileSync("realtor-fliers.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} realtor flier jobs (3:4 / 4K) -> gpt-image.mjs --batch`);
