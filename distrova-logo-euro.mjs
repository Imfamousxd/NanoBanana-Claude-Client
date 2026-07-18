#!/usr/bin/env node
import fs from "fs";

// Distrova in the EURO-LUXURY CREST aesthetic of the Muha euro-music badges:
// gold-foil engraving on deep saturated grounds, ornate dimensional frames,
// premium serif/script lettering, contained emblem on white. NON-cannabis.
// Delivery motif = Hermes/Mercury wings (god of delivery/speed/commerce).
const LUX = `Rendered in a premium EURO-LUXURY badge/crest style: rich GOLD FOIL engraving with genuine embossed dimension, fine ornamental linework, decorative flourishes and filigree, dramatic luxe lighting with subtle metallic sheen and depth (like a fine liquor / perfume / fashion-house heritage label). The whole emblem is a single CONTAINED centered badge with comfortable margin on a pure white #FFFFFF background (NOT a full-page poster, NOT full-bleed). The wordmark text is integrated INTO the crest, not floated separately. Crisp, high-craft, the work of a world-class luxury brand studio. Absolutely NO cannabis, NO leaf, NO smoke imagery of any kind.`;

const CONCEPTS = [
  {
    name: "navy-gold-winged",
    desc: "Concept 1 — Navy + gold winged crest",
    prompt: `Distrova — "Navy Winged Crest" logo. A luxury heritage emblem for "DISTROVA," a premium delivery service.

Format: an ornate scalloped vertical luxury LABEL with a fine double gold border on a deep midnight-navy #0B1733 ground. At the top center, a refined pair of outstretched Hermes/Mercury COURIER WINGS in gold flanking a small gold five-point star (signifying swift premium delivery). Below the wings, the wordmark "DISTROVA" set in elegant gold high-contrast serif capitals, generously tracked, with delicate deco flourishes and a thin ornamental rule beneath. Tasteful gold filigree in the corners. ${LUX}`,
  },
  {
    name: "crimson-gold-script",
    desc: "Concept 2 — Crimson + gold ornate script shield",
    prompt: `Distrova — "Crimson Script Shield" logo. A luxury heritage emblem for "Distrova," a premium delivery service.

Format: a rounded heraldic SHIELD/cartouche with an embossed gold frame on a deep crimson-burgundy #6E0F1A ground (Prague-label richness). The hero is the wordmark "Distrova" rendered in lavish flowing gold ENGRAVED SCRIPT calligraphy with elegant swashes and dimensional foil shine, centered. Above the word, a small gold winged-wheel courier emblem (a classic delivery/express motif). A refined ornamental flourish underlines the word. ${LUX}`,
  },
  {
    name: "black-gold-deco",
    desc: "Concept 3 — Black + gold Art Deco emblem",
    prompt: `Distrova — "Black Gold Deco" logo. A modern-luxury Art Deco emblem for "DISTROVA," a premium delivery service.

Format: a geometric Art-Deco medallion on a matte black #0A0A0A ground — symmetrical gold sunburst / fan rays radiating from a central monogram. The central motif is an elegant interlocking gold "D" monogram with a subtle pair of stylized deco wings or upward chevrons built into it (motion + delivery). The wordmark "DISTROVA" runs beneath in sleek extended gold deco capitals with wide tracking, framed by thin gold deco lines. Gatsby-era luxury, clean and geometric rather than busy. ${LUX}`,
  },
  {
    name: "emerald-gold-seal",
    desc: "Concept 4 — Emerald + gold circular seal",
    prompt: `Distrova — "Emerald Seal" logo. A luxury circular SEAL emblem for "DISTROVA," a premium delivery service.

Format: a round medallion/seal with an embossed gold rope-and-bead border on a deep emerald-green #0C3B2E ground. The wordmark "DISTROVA" is curved along the TOP inside the ring in gold serif capitals, with a small decorative gold star and laurel sprigs along the bottom of the ring (text wrapped INTO the seal). At the center, a refined gold Hermes/Mercury winged emblem or a winged compass-star, embossed with dimension. Balanced, premium, heritage. ${LUX}`,
  },
];

const jobs = CONCEPTS.map((c) => ({
  prompt: c.prompt,
  aspectRatio: "1:1",
  imageSize: "4K",
  refImages: [],
  _meta: { name: c.name, desc: c.desc },
}));

fs.writeFileSync("distrova-logo-euro.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} concept jobs`);
