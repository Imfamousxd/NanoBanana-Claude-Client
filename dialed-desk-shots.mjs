#!/usr/bin/env node
// Hyper-real 1:1 4K desk lifestyle shots — someone working at their desk with
// ONE Dialed (L-Doba) can sitting NEXT TO them on the desktop (not held).
// The SAME batch JSON is run through BOTH gpt-image.mjs (gpt-image-2) and
// nanobanana.mjs (Nano Banana Pro) for a true side-by-side comparison.
// Blue Glacier single can = product-fidelity anchor.
import fs from "fs";

const CAN_REF = "Dialed Moods L-Doba Generations/Single Cans/single-blue-glacier.png";

const CAN_LOCK = `Resting upright ON the desk, next to the person and within easy arm's reach (NOT held, NOT being touched), stands exactly ONE tall slim 12 fl oz "Dialed" cognition drink can — match the REFERENCE can EXACTLY: the same glossy blue-and-white aluminium body, the bold gold 3D "DIALED" wordmark, the small "MOODS" under it, the vertical "BLUE GLACIER" flavor tab, the blueberry + purple velvet-bean flower graphic, "CLEAN ENERGY & CALM FOCUS" near the top and "COGNITION ELIXIR / DIETARY SUPPLEMENT / 5 CALORIE - ZERO SUGAR / 12 FL OZ (355 mL)". Keep the label crisp, upright and correct, with a faint natural condensation sheen catching the room light. ONLY ONE can — no duplicates, no extra cans.`;

const REALISM = `PHOTOGRAPHIC REALISM — this MUST read as a genuine candid lifestyle PHOTOGRAPH a friend snapped on a full-frame camera, NOT an ad, NOT CGI, NOT an AI render. Shot on a full-frame DSLR with a 50mm f/1.8 prime: shallow natural depth of field (the can and the subject's hands tack-sharp, the background falling into creamy bokeh), true-to-life slightly imperfect white balance, natural soft window daylight with believable directional shadows and gentle falloff. Authentic human skin with visible pores, faint redness, fine flyaway hairs, a stray strand or two, subtle under-eye texture and tiny imperfections; realistic fabric weave and natural wrinkles; faint sensor grain, mild lens vignetting and a touch of chromatic fringing at high-contrast edges. Slightly off-center, un-posed, lived-in framing — as if caught mid-moment. ABSOLUTELY NO plastic or waxy skin, no airbrushed over-retouching, no sterile studio perfection, no symmetrical "stock photo" posing, no extra or fused fingers, no warped or duplicated text, no glossy CGI sheen on skin.`;

const SCENES = [
  {
    name: "scene1-woman-laptop",
    prompt: `Hyper-realistic candid lifestyle photograph, 1:1 square.

A woman in her late 20s genuinely absorbed in work at a desk in a sunlit modern home office, framed from across the desk at a natural three-quarter angle (head, shoulders, hands and the desktop all visible). Both hands are on her own work — one resting on the open laptop trackpad, the other holding a pen over a notebook — with a relaxed, authentically focused expression and the faintest candid half-smile. Casual everyday outfit (a soft oatmeal knit sweater). Soft morning daylight rakes in from a window to camera-left.

${CAN_LOCK}

A real, lived-in desktop: open laptop, an open notebook and pen, a small potted plant, a couple of loose papers, a phone face-down, a pair of glasses — tidy but believable, never staged. Warm neutral home-office tones, a softly blurred window and shelves behind her.

${REALISM}`,
  },
  {
    name: "scene2-man-desk",
    prompt: `Hyper-realistic candid lifestyle photograph, 1:1 square.

A man in his late 20s working at a warm wooden desk beside a large window, leaning slightly toward his laptop and typing with both hands, mid-thought with a calm, naturally focused expression as he reads his screen. Casual outfit (a plain heather-grey tee, or an open flannel over a tee). Late-afternoon golden sunlight pours across the scene from camera-right and warmly glints off the can on the desk.

${CAN_LOCK}

Around him a real, slightly messy working setup: the laptop or a monitor with a soft glow, scattered handwritten notes, a half-full coffee mug, earbuds, a desk lamp, a tangled charging cable. Cozy golden-hour home-office mood.

${REALISM}`,
  },
];

const jobs = SCENES.map((s) => ({
  prompt: s.prompt,
  aspectRatio: "1:1",
  imageSize: "4K",
  refImages: [CAN_REF],
  _meta: { name: s.name },
}));

fs.writeFileSync("dialed-desk-shots.json", JSON.stringify(jobs, null, 2));
console.log(`Wrote ${jobs.length} desk-shot jobs (run through BOTH gpt-image.mjs and nanobanana.mjs)`);
