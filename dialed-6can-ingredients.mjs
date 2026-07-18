#!/usr/bin/env node
// Dialed Moods — same 6-can pyramid composition, but the white can body is
// REMOVED. Only the colored top cap and colored bottom band of each can remain,
// with the actual ingredients of that flavor stacked / floating in the negative
// space between top and bottom. Deconstructed product shot.
import fs from "fs";

const REF_DIR = "Dialed Moods L-Doba Generations/Product REfs";
const PREV = "Dialed Moods L-Doba Generations/6can-nogap-v1.png";

const FLAVORS = [
  {
    name: "Black Cherry Vanilla", file: "black cherry vanilla.png",
    capColor: "deep magenta / berry-pink",
    extra: "an abundant pile of glossy dark black cherries (with stems, multiple cherries), and two or three whole vanilla bean pods (long, dark brown, slightly twisted) — the cherries and vanilla together should be the visual focal point of this column",
  },
  {
    name: "Blue Glacier", file: "Blue glacier.png",
    capColor: "light cyan / sky blue",
    extra: "an abundant cluster of plump fresh blueberries (many berries) with their natural silvery bloom — the blueberries should be the visual focal point of this column",
  },
  {
    name: "Sour Watermelon Candy", file: "Sour watermelon candy.png",
    capColor: "bright lime green",
    extra: "several wedges of juicy red watermelon with visible black seeds and green rind — the watermelon should be the visual focal point of this column",
  },
  {
    name: "Lychee", file: "Lychee.png",
    capColor: "soft baby pink",
    extra: "three or four whole lychee fruits (rough pink-red bumpy shell), one or two cracked open to show the translucent white flesh inside — the lychees should be the visual focal point of this column",
  },
  {
    name: "Secret Juice (Strawberry Kiwi flavor)", file: "SecretJuice_Front.png",
    capColor: "red top, green bottom",
    extra: "several fresh red strawberries with green leaves AND a sliced kiwi fruit (whole and halved, showing its bright green flesh and tiny black seeds) — the strawberries + kiwi should be the visual focal point of this column",
  },
  {
    name: "Lemonade", file: "Lemonade.png",
    capColor: "bright sunshine yellow",
    extra: "several fresh lemons (whole and halved showing juicy yellow flesh and small seeds) — the lemons should be the visual focal point of this column",
  },
];

const ingredientList = FLAVORS.map((f, i) =>
  `- ${f.name} slot (top cap ${f.capColor}): floating between its top cap and bottom band — the common trio (mucuna / L-Dopa plant material, raw coffee beans for caffeine, small mound of fine white L-theanine powder) PLUS ${f.extra}`
).join("\n");

const jobs = [
  {
    prompt: `Hero product photograph — 16:9 landscape — a DECONSTRUCTED / CUTAWAY version of the previous Dialed Moods 6-can hero shot (reference 1 shows the exact prior composition: 6 cans in a staggered pyramid with two front cans touching, two middle cans peeking outward, two back cans peeking further outward, low up-angle, isolated on flat white).

THE KEY CHANGE — for each of the SIX cans:
- KEEP only the COLORED TOP CAP (the small flavor-colored ring with the black sipping mouth on top) and the COLORED BOTTOM BAND (the wider colored ring at the bottom of the can, with the tiny "DIETARY SUPPLEMENT, 5 CALORIE, ZERO SUGAR, 12 FL OZ" text). Both colored rings retain the EXACT colors from the can refs (refs 2–7).
- REMOVE the entire white label / body of the can — the gold "DIALED" wordmark, the "CLEAN ENERGY & CALM FOCUS" banner, the QR sticker, the fruit illustration, "Prize With Every Can" vertical text — all gone. The white cylindrical body is REMOVED entirely so there is OPEN AIR between the top cap and the bottom band.
- In the negative space between the top cap and the bottom band — where the can body used to be — render the ACTUAL INGREDIENTS of that flavor's drink, arranged as a tasteful floating still-life column that occupies roughly the same volume the can body would have. The ingredients appear to be falling / suspended / mid-pour, organized loosely vertical.
- The top cap floats at the same height as it would on the original can; the bottom band sits on the same ground plane. They are vertically aligned (the top cap directly above the bottom band, separated by the ingredient column).

INGREDIENT CONTENT — balanced composition where every ingredient gets roughly equal visual weight (no single element dominates). Every flavor contains the SAME CORE TRIO: (1) mucuna pruriens / L-Dopa plant material rendered as TWO OR THREE MODERATE purple flower clusters on green stems with green leaves — vivid purple-violet drooping flower racemes, present and visible but NOT dominating. The mucuna should occupy roughly 30–35% of the ingredient column — substantial enough to read as a featured ingredient, but not cascading or overwhelming. CRITICAL: NO velvet pods, NO long curved purple seed pods, NO cheeto-shaped purple objects, NO dark purple bean-pod shapes — ONLY purple flower clusters with their stems and leaves. (2) a GENEROUS scatter of raw coffee beans (caffeine source, brown — visible as multiple beans suspended throughout the column). (3) a small mound of pure-white powder (L-theanine, prominent near the bottom of the column). On TOP of that core trio, each flavor adds an ABUNDANT amount of its own signature fruit / ingredient — the flavor-specific fruit should still read clearly as the most distinctive identifying element in each column, taking up roughly 35–40% of the ingredient column. Per flavor:
${ingredientList}

COMPOSITION (identical pyramid placement to reference 1):
- Back-row LEFT (outermost left, ~50% visible): Lychee slot
- Middle-row LEFT (~60–70% visible): Black Cherry Vanilla slot
- Front-row LEFT (closest to camera, fully visible, TOUCHING the front-right): Secret Juice slot
- Front-row RIGHT (closest to camera, fully visible, TOUCHING the front-left): Lemonade slot
- Middle-row RIGHT (~60–70% visible): Sour Watermelon Candy slot
- Back-row RIGHT (outermost right, ~50% visible): Blue Glacier slot

CAMERA & STAGING:
- LOW UP-ANGLE — the camera is positioned BELOW the slots looking UP at them at roughly a 15–20° upward tilt. The viewer is at ground level looking up; the colored top caps tilt slightly toward us, the underside / bottom face of each bottom band is partially visible, and you can see beneath each ring as if standing under a row of glass cylinders. This is identical to the camera angle in reference 1 — NOT a straight eye-level shot.
- All six "slots" share the same invisible ground plane (bottom bands all rest at the same height); due to the low up-angle perspective, the bottom bands cluster across the bottom of the frame, the ingredient columns rise vertically, and the top caps sit higher and tilt slightly forward toward camera.
- Front pair touching with no gap (their bottom bands touch sides at the center of the frame); middle row peeks outward behind them; back row peeks further outward and slightly higher in the frame due to perspective foreshortening.
- Pure flat white background (#FFFFFF) everywhere — no ledge, no surface, no environment, no gradient

LIGHTING:
- Soft, bright, evenly diffused studio lighting
- Each ingredient is photographically lit, sharp and crisp
- Minimal contact shadow under each bottom band ring

Style: high-end deconstructed beverage editorial — like a magazine cutaway "what's actually inside" feature. Photoreal ingredients, photoreal colored rings, isolated on flat white, ready for Photoshop masking. Camera angle must match reference 1's low-up-angle hero shot — NOT a flat eye-level row. Negative: no full white can bodies, no DIALED wordmark, no fruit illustrations from the label, no QR codes, no logos, no environment, no podium, no shadows beyond a tiny contact shadow, no duplicate ingredients across slots beyond the core trio, NO flat straight-on eye-level perspective, NO velvet bean pods of any color (no long curved purple, brown, or black pod shapes hanging from the plant — only flower clusters remain).`,
    aspectRatio: "16:9",
    imageSize: "4K",
    refImages: [
      PREV,
      ...FLAVORS.map(f => `${REF_DIR}/${f.file}`),
    ],
    _meta: { name: "dialed-6can-ingredients" },
  },
];

fs.writeFileSync("dialed-6can-ingredients.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} job with ${jobs[0].refImages.length} refs`);
