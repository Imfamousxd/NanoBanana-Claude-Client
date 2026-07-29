#!/usr/bin/env node
// Nano Banana (gemini-3-pro-image-preview) localized edit of fixed.png.
// Unlike gpt-image-2, Nano Banana does true source-preserving edits: it keeps
// the input image's pixels intact and only modifies the requested regions.
// We pass fixed.png first (the edit target) followed by the 6 product refs so
// the model knows which fruit pairs with which colored top/bottom combination.
import fs from "fs";

const REF_DIR = "Dialed Moods L-Doba Generations/Product REfs";
const ANCHOR = "Dialed Moods L-Doba Generations/fixed.png";

const FLAVORS = [
  { file: "Lychee.png",                name: "Lychee",
    fruit: "three or four whole lychee fruits (rough pink-red bumpy shell), one or two cracked open showing translucent white flesh" },
  { file: "black cherry vanilla.png",  name: "Black Cherry Vanilla",
    fruit: "abundant pile of glossy dark black cherries with stems plus two or three whole vanilla bean pods (long, dark brown, slightly twisted)" },
  { file: "SecretJuice_Front.png",     name: "Secret Juice (Strawberry Kiwi)",
    fruit: "several fresh red strawberries with green leaves and a sliced kiwi (whole and halved, bright green flesh with tiny black seeds)" },
  { file: "Lemonade.png",              name: "Lemonade",
    fruit: "several fresh lemons (whole and halved showing juicy yellow flesh and small seeds)" },
  { file: "Sour watermelon candy.png", name: "Sour Watermelon Candy",
    fruit: "several wedges of juicy red watermelon with visible black seeds and green rind" },
  { file: "Blue glacier.png",          name: "Blue Glacier",
    fruit: "abundant cluster of plump fresh blueberries with their natural silvery bloom" },
];

const perCan = FLAVORS.map((f, i) =>
  `  ${i + 1}. ${f.name} can (left-to-right position ${i + 1} in the pyramid): inside this can's white body, render ${f.fruit}, mixed with the shared core trio.`
).join("\n");

const jobs = [
  {
    prompt: `Edit reference image 1 (fixed.png). Keep EVERY pixel of reference 1 identical — same camera, same can positions, same can sizes, same can angles, same white background, same contact shadows, same colored TOP CAPS, same colored BOTTOM BANDS. Do NOT regenerate the scene.

The ONLY change: for each of the six cans in reference 1, replace the WHITE CYLINDRICAL BODY (the middle white section between the colored top cap and the colored bottom band, containing the gold DIALED wordmark, the fruit illustration, the vertical flavor ribbon, the QR sticker, the "Prize With Every Can" text, the "COGNITION ELIXIR" text) with a photoreal floating ingredient column that occupies the exact same cylindrical footprint the white body currently occupies.

Per-can ingredients (six cans, left-to-right in the pyramid: back-left peek = Lychee, mid-left peek = Black Cherry Vanilla, front-left = Secret Juice, front-right = Lemonade, mid-right peek = Sour Watermelon Candy, back-right peek = Blue Glacier):
${perCan}

Shared core trio in every can: purple mucuna L-Dopa flower clusters on green stems with green leaves (~30–35% of the column; vivid purple-violet drooping flower racemes — NO velvet pods, NO long curved purple seed pods, NO bean-pod shapes, ONLY flower clusters), raw brown coffee beans scattered through the column, and a small mound of pure white L-theanine powder near the bottom. The signature fruit sits on top of that core trio and occupies ~35–40% of the column.

Strict preservation rules:
- The colored top cap of every can stays IDENTICAL (color, position, size, shape)
- The colored bottom band of every can stays IDENTICAL (color, position, size, shape, including the "DIETARY SUPPLEMENT · 5 CALORIE · ZERO SUGAR · 12 FL OZ" text)
- Can silhouettes, X/Y positions, widths, and heights stay IDENTICAL
- The flat white background stays IDENTICAL
- The two front cans still touch at the dead center with zero gap
- All can bases still sit on the same ground plane
- 16:9 framing stays IDENTICAL

References 2–7 are PURELY for fruit-to-can color matching (so you know lychee fruit goes with the pink-cap can, lemons go with the yellow-cap can, etc.). Do NOT redraw the original DIALED labels from refs 2–7 — those labels are gone in the output.

Style: photoreal deconstructed beverage editorial, sharp ingredients, glossy, isolated on the existing flat white background. No new shadows, no environment, no ledge, no podium.`,
    aspectRatio: "16:9",
    imageSize: "4K",
    refImages: [
      ANCHOR,
      ...FLAVORS.map(f => `${REF_DIR}/${f.file}`),
    ],
    _meta: { name: "dialed-inpaint-nb" },
  },
];

fs.writeFileSync("dialed-inpaint-nb.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job with ${jobs[0].refImages.length} refs`);
