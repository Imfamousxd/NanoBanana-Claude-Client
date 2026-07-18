#!/usr/bin/env node
// Inpaint-style edit of fixed.png: keep every can's exact position/size/angle and
// its colored TOP CAP + colored BOTTOM BAND, but replace the WHITE cylindrical
// body of each can with the same deconstructed ingredient column we used before
// (purple L-Dopa flowers + raw coffee beans + white L-theanine powder + the
// flavor's signature fruit). gpt-image-2 /v1/images/edits has no mask field, so
// this is prompt-driven inpainting — the prompt strongly constrains the model to
// only modify the white interiors and leave everything else pixel-identical.
import fs from "fs";

const REF_DIR = "Dialed Moods L-Doba Generations/Product REfs";
const ANCHOR = "Dialed Moods L-Doba Generations/fixed.png";

const FLAVORS = [
  { file: "Lychee.png",                name: "Lychee",
    fruit: "three or four whole lychee fruits (rough pink-red bumpy shell), one or two cracked open showing translucent white flesh" },
  { file: "black cherry vanilla.png",  name: "Black Cherry Vanilla",
    fruit: "abundant pile of glossy dark black cherries (with stems) plus two or three whole vanilla bean pods (long, dark brown, slightly twisted)" },
  { file: "SecretJuice_Front.png",     name: "Secret Juice (Strawberry Kiwi)",
    fruit: "several fresh red strawberries with green leaves AND a sliced kiwi (whole and halved, bright green flesh with tiny black seeds)" },
  { file: "Lemonade.png",              name: "Lemonade",
    fruit: "several fresh lemons (whole and halved showing juicy yellow flesh and small seeds)" },
  { file: "Sour watermelon candy.png", name: "Sour Watermelon Candy",
    fruit: "several wedges of juicy red watermelon with visible black seeds and green rind" },
  { file: "Blue glacier.png",          name: "Blue Glacier",
    fruit: "abundant cluster of plump fresh blueberries with their natural silvery bloom" },
];

const perCan = FLAVORS.map((f, i) =>
  `  - Can #${i + 1} (${f.name}, left-to-right position ${i + 1}): inside this can's white body, render ${f.fruit}, MIXED with the shared core trio (purple mucuna / L-Dopa flower clusters on green stems, raw brown coffee beans, small white L-theanine powder mound).`
).join("\n");

const jobs = [
  {
    prompt: `INPAINT EDIT — reference image 1 (fixed.png) is the EXACT base image. DO NOT regenerate the scene, DO NOT change camera, DO NOT change can positions, DO NOT change can sizes, DO NOT change can angles, DO NOT change the colored top caps, DO NOT change the colored bottom bands, DO NOT change the white background, DO NOT change the contact shadows. This is a pixel-preserving edit: every pixel outside the white cylindrical body of each can must remain IDENTICAL to reference 1.

THE ONLY CHANGE: for each of the six cans visible in reference 1, replace the WHITE CYLINDRICAL BODY portion (the middle section of the can between the colored top cap and the colored bottom band — currently containing the "DIALED" gold wordmark, "CLEAN ENERGY & CALM FOCUS" banner, fruit illustration, vertical flavor ribbon, QR code, "Prize With Every Can" text, "COGNITION ELIXIR" text) with a photoreal deconstructed ingredient column. The colored top cap (with its black sipping mouth) and the colored bottom band (with its small "DIETARY SUPPLEMENT · 5 CALORIE · ZERO SUGAR · 12 FL OZ" text) MUST REMAIN UNCHANGED — same color, same position, same size, same shape, pixel-identical to reference 1.

The replacement ingredient column occupies the EXACT same cylindrical footprint that the white body currently occupies in reference 1 — same width, same height, same horizontal X position, same vertical Y span, same perspective tilt as the rest of that can. Within that footprint the ingredients appear suspended / floating / mid-pour, photoreal, sharply lit, isolated against the same flat white background that is already there. No new shadows beyond what already exists in reference 1.

PER-CAN INGREDIENT MAPPING (six cans in reference 1, left-to-right in the staggered pyramid: back-left peek = Lychee, mid-left peek = Black Cherry Vanilla, front-left = Secret Juice, front-right = Lemonade, mid-right peek = Sour Watermelon Candy, back-right peek = Blue Glacier):
${perCan}

CORE TRIO IN EVERY CAN (every can shares these three): (1) purple mucuna / L-Dopa flower clusters — vivid purple-violet drooping flower racemes on green stems with green leaves, occupying ~30–35% of the column; NO velvet pods, NO long curved purple seed pods, NO cheeto-shaped purple objects, NO bean-pod shapes — ONLY flower clusters with stems and leaves. (2) raw brown coffee beans scattered through the column. (3) a small mound of pure-white L-theanine powder near the bottom of the column. The signature fruit for each can (listed above) sits on top of that core trio and occupies ~35–40% of the column so the flavor reads clearly.

PIXEL-PRESERVATION RULES (CRITICAL):
- Every colored top cap (red/pink/green/cyan/yellow/magenta etc.) — UNCHANGED, pixel-identical to reference 1
- Every colored bottom band — UNCHANGED, pixel-identical to reference 1
- Can outlines, can edges, can silhouettes — UNCHANGED
- Can positions (X, Y on canvas) — UNCHANGED
- Can sizes (width, height) — UNCHANGED
- The staggered pyramid layout (which can is front, which peeks behind) — UNCHANGED
- The flat white background — UNCHANGED
- The contact shadow under each can — UNCHANGED
- Aspect ratio and framing — UNCHANGED (still 16:9)
- The two front cans still TOUCH at the dead center of the frame with ZERO gap — UNCHANGED
- All can bases still rest on the same invisible ground plane — UNCHANGED

References 2–7 are PURELY for matching the flavor-specific fruit accuracy (which fruit goes inside which can). DO NOT redraw the can labels from refs 2–7 — those labels are GONE in the output (replaced by ingredients). Use refs 2–7 only to confirm which fruit pairs with which colored top/bottom combination in reference 1.

Style: photoreal magazine-grade deconstructed product photography, sharp ingredients, glossy crisp finish, isolated on the same flat white as reference 1. Negative: no full white can bodies anywhere, no DIALED wordmark, no fruit-illustration labels, no QR codes, no "Prize With Every Can" text, no can repositioning, no can resizing, no perspective change, no camera change, no new shadows, no environment, no ledge, no podium, no gradient, NO altered top caps, NO altered bottom bands.`,
    aspectRatio: "16:9",
    imageSize: "4K",
    refImages: [
      ANCHOR,
      ...FLAVORS.map(f => `${REF_DIR}/${f.file}`),
    ],
    _meta: { name: "dialed-inpaint-ingredients" },
  },
];

fs.writeFileSync("dialed-inpaint-ingredients.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job with ${jobs[0].refImages.length} refs`);
