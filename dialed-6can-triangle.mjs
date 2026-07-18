#!/usr/bin/env node
// Dialed Moods — 6 cans staggered pyramid, low up-angle, TRANSPARENT background.
// Secret Juice replaces Strawberry Kiwi (red+green dual-tone can).
import fs from "fs";

const REF_DIR = "Dialed Moods L-Doba Generations/Product REfs";

const FLAVORS = [
  { file: "black cherry vanilla.png",  color: "deep magenta / berry pink" },
  { file: "Blue glacier.png",          color: "light cyan / sky blue" },
  { file: "Sour watermelon candy.png", color: "bright lime green" },
  { file: "Lychee.png",                color: "soft baby pink" },
  { file: "SecretJuice_Front.png",     color: "red top band + green bottom band, mostly white body, bold black diagonal SECRET JUICE banner" },
  { file: "Lemonade.png",              color: "bright sunshine yellow" },
];

const jobs = [
  {
    prompt: `Hero product photograph — 16:9 landscape — of SIX Dialed Moods Cognition Elixir cans (12 fl oz tall slim format) arranged in a staggered pyramid, photographed from a LOW upward camera angle. The cans are ISOLATED on a PURE FLAT SOLID WHITE background (#FFFFFF, uniform, no gradient, no texture, no environment, no ledge, no podium, no shelf, no surface, no floor, no reflection). The background is a single uniform white field behind and below the cans so the image is trivially removable / maskable in Photoshop. Only the cans themselves and the smallest possible soft contact shadow directly under each can's base are non-white.

CAMERA:
- Low up-angle (~15° tilt upward) — viewer looks UP at the cans, the cans tower above the camera, the bottoms of the cans are slightly visible
- All can labels face the camera (front-facing)

FORMATION — staggered pyramid (NOT a single straight row, NOT a 1+2+3 stack). CRITICAL: ALL SIX CANS SHARE THE SAME PHYSICAL BASE PLANE — every can's base touches the same invisible horizontal floor (the floor itself is hidden / white, no ledge visible). The cans are NOT stacked, NOT floating, NOT on shelves at different heights. They are all standing on ONE shared ground plane, identical in height (12 fl oz tall slim format, all same size). The staggering is in DEPTH (front-to-back along the Z axis), NOT in vertical height. Because of the low up-angle perspective, cans further back appear slightly higher up the frame than front cans — but this is camera foreshortening only; their bases are physically on the same horizontal plane:
- FRONT ROW (closest to camera): 2 cans side-by-side, centered, sides DIRECTLY TOUCHING each other with NO gap between them — the inner edges of the two front cans should be in contact (zero space between them). Their bases sit at the lowest visible position.
- MIDDLE ROW (one can-depth behind front row, bases on the SAME plane): 2 cans offset OUTWARD — one peeking on the LEFT of the front pair, one on the RIGHT. Each shows ~60–70% of its body, inner side hidden by a front can.
- BACK ROW (one more can-depth behind, bases STILL on the SAME plane): 2 cans offset further OUTWARD — one peeking left of middle-left, one peeking right of middle-right. Each shows ~50% of its body.
- Result: triangular pyramid silhouette, apex at top-back-center, widening as it comes forward — but every can rests on the SAME invisible ground at the same physical height.

THE SIX CANS — use references 1 through 6 for EXACT label artwork: typography, the gold "DIALED" wordmark, label layout, top/bottom colored bands, fruit illustration, "Prize With Every Can" vertical text, and overall design. Each label MUST match its reference one-to-one (hyperrealistic, sharp, legible). Placement is chosen so the can colors flow in a rainbow from outermost-left through the front pair to outermost-right:
- Back-row LEFT peek (outermost left): Lychee (ref 4, ${FLAVORS[3].color})
- Middle-row LEFT peek: Black Cherry Vanilla (ref 1, ${FLAVORS[0].color})
- Front-row LEFT can: Secret Juice (ref 5, ${FLAVORS[4].color}) — this is the dual-tone red+green hero can, prominently placed in the front-left spotlight slot
- Front-row RIGHT can: Lemonade (ref 6, ${FLAVORS[5].color})
- Middle-row RIGHT peek: Sour Watermelon Candy (ref 3, ${FLAVORS[2].color})
- Back-row RIGHT peek (outermost right): Blue Glacier (ref 2, ${FLAVORS[1].color})

LIGHTING:
- Bright, soft, evenly diffused studio lighting from above-front
- Subtle highlights running down each can's edges (cylindrical specular)
- Soft contact shadow directly under each can (small, tight, beneath the base only — no large cast shadows)

Style: clean modern beverage commercial, magazine-grade product photography, hyper-realistic can rendering, glossy crisp finish, isolated on a pure flat white background ready for compositing. No extra text, no people, no extra logos beyond what is on the cans, no environment, no gradient, no ledge, no surface visible. Negative: no duplicate cans, no warped typography, no incorrect label colors, no straight single-row arrangement, no off-white tinting, no colored background, no visible podium / ledge / table / shelf / floor, no marble or wood, NO cans floating above other cans, NO cans on different shelf heights — every can stands on the same invisible ground plane. NO gap between the two front-row cans — they must be touching side-by-side at the center of the frame.`,
    aspectRatio: "16:9",
    imageSize: "4K",
    refImages: FLAVORS.map(f => `${REF_DIR}/${f.file}`),
    _meta: { name: "dialed-6can-isolated" },
  },
];

fs.writeFileSync("dialed-6can-triangle.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job with ${jobs[0].refImages.length} refs, transparent bg`);
