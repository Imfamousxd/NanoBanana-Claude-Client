#!/usr/bin/env node
// Localized edit: take the approved "Secure The Bag" 9:16 (bigger version) and
// remove ONLY the "WIN THE GRAND PRIZE" red rounded-rectangle pill subhead.
// Keep the MM monogram, the "SECURE THE BAG" cream letterpress headline, the
// night-Challenger background, and every other element pixel-faithful.
import fs from "fs";

const SOURCE = "Muha Giveaway Redesigned/Secure The Bag v2 9x16 bigger.png";

const jobs = [
  {
    prompt: `Edit reference image 1. Keep EVERY pixel of reference 1 identical — same MM gold/cream monogram logo at the top, same "SECURE THE BAG" cream letterpress headline (both lines, exact same position, size, glow, typography), same red Dodge Challenger night background, same navy sky with stars, same street-light flare, same black tire foreground, same asphalt with motion-blur, same aspect ratio (9:16), same color palette, same composition.

THE ONLY CHANGE: REMOVE the "WIN THE GRAND PRIZE" subhead pill entirely — the small horizontal red-outlined rounded-rectangle that sits BELOW the "SECURE THE BAG" headline containing the cream text "WIN THE GRAND PRIZE". Erase the pill outline, the red glow around it, and the "WIN THE GRAND PRIZE" text inside it. Fill the area where the pill used to be with the SAME night-scene background that surrounds it (extend the asphalt/tire/motion-blur naturally into that area as if the pill was never there) — seamless inpainting so the area looks like it was always part of the photo.

Preserve everything else byte-for-byte. The MM logo stays. The "SECURE THE BAG" two-line headline stays exactly as it is. The background composition stays. The vertical centering of the remaining lockup (logo + headline) stays as it currently is — do NOT re-center or re-stack the elements after removing the pill; the empty space where the pill was should simply be background.

Style: pixel-faithful localized removal of one specific element. Negative: no shifting of remaining elements, no changes to the logo, no changes to the headline, no new text, no extra graphics, no recoloring, no background changes outside the small pill region.`,
    aspectRatio: "9:16",
    imageSize: "4K",
    refImages: [SOURCE],
    _meta: { name: "secure-bag-no-pill" },
  },
];

fs.writeFileSync("muha-secure-bag-remove-pill.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job`);
