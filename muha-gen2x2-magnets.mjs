#!/usr/bin/env node
/**
 * muha-gen2x2-magnets.mjs — Gen 2x2 magnet mechanic, UGC lane, Seedance 2.5.
 *
 *   node muha-gen2x2-magnets.mjs --dry-run
 *   node muha-gen2x2-magnets.mjs --proof     # 5s, ~$1.17  <- DO THIS FIRST
 *   node muha-gen2x2-magnets.mjs --go        # 30s, ~$6.94
 *
 * THIS IS THE RISKIEST SHOT TYPE IN THE STACK, AND THE PROOF ROLL IS NOT OPTIONAL.
 * Golden rule 10: "Animate faces, not prop still-lifes." Asking a video model to animate HANDS
 * MOVING OBJECTS loses object permanence — a measured two-mug counter scene dropped one mug,
 * swapped the other's shape mid-clip and grew an extra forearm by second 9. The entire creative
 * here is two objects being pulled apart and clicked back together in frame. That is precisely
 * the failure mode, so prove it at 5s ($1.17) before committing 30s ($6.94).
 *
 * CLAIMS — all sourced from sieve/products/Muha_Meds/MM-gen2x2-eurosummer.json
 *   "The two halves are MAGNETIC — they click together, pull apart, flip and reattach.
 *    This mechanic is the creative."                              -> the whole shot
 *   Labels read EXACTLY: CANARY ISLAND PUNCH (black half), DC-10 Diesel (gold half). Never
 *    swapped — the script names which half is which and the prompt states it twice.
 *   Box strings include GIVEAWAY INSIDE! -> the only giveaway reference made, and it is
 *    printed on the product rather than asserted about a promotion.
 *   NO prize, no entry mechanic, no odds: this is a PRODUCT piece, not a giveaway piece, so the
 *    campaign registry's claim surface does not apply and nothing about the raffle is stated.
 *   NEVER depict inhaling or consumption — achieved by giving him nothing to inhale and no
 *    reason to, NOT by writing a negative (golden rule 9: naming it summons it).
 *
 * HOUSE SPEC — house_laws, measured off 01_FINISHED by sieve-corpus.py
 *   30s · ONE unbroken take · 9:16 · ~2.3 w/s · face fills frame cropped at the hairline ·
 *   product held beside the cheek, never over the face · no on-screen text.
 *
 * ROUTE: reference_image with the SKU canonical. Not first_frame — output shape would follow the
 * 1280x1600 4:5 asset instead of 9:16, and the human is generated from text regardless.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = "/Users/Hassoonie/Desktop/CODE PROJECTS/NanoBanana-Client";
for (const line of fs.readFileSync(path.join(REPO, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.MODELARK_API_KEY;
const BASE = "https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks";
const SKU = path.join(REPO, "Brand Context/assets/Muha_Meds/Gen2x2-EuroSummer-front.png");
const OUT = path.join(__dirname, "generations", "muha-gen2x2");

const LOOK =
  "Vertical selfie video shot on a phone propped up in front of him. EXTREME CLOSE-UP: his face " +
  "fills the frame edge to edge, the top of his head and hairline cropped off the top of frame, " +
  "chin near the bottom, eyes in the upper third. He is in the driver's seat of his own car in an " +
  "ordinary parking lot, late afternoon light coming in low through the side window and blowing " +
  "out one edge of frame. A 24-year-old Mexican-American man from Southern California, short dark " +
  "hair, light stubble, plain white t-shirt. Visible skin pores, oil shine on his nose and " +
  "forehead, faint sun-flush on his cheekbones — no beauty filter, no skin smoothing, no grade. " +
  "Full-bleed, fills the frame edge to edge, no border, no mockup.";

const PRODUCT =
  "He is holding the device shown in reference image 1 — reproduce it faithfully. It is a small " +
  "rectangular block made of TWO SEPARATE MAGNETIC HALVES that click together. The LEFT half is " +
  "matte black with a clear window showing amber oil and a tropical sticker label reading " +
  "'CANARY ISLAND PUNCH'. The RIGHT half is polished gold brass with a clear window showing amber " +
  "oil and a red sticker label reading 'DC-10 Diesel'. The black half is ALWAYS the Canary Island " +
  "Punch one and the gold half is ALWAYS the DC-10 Diesel one — never swap them. Both halves stay " +
  "whole and correctly shaped in every frame; nothing melts, merges or changes size. " +
  "He holds it up beside his cheek, palm-sized, so his face stays fully visible and unobstructed.";

const ACTION =
  "His hands do the work in frame: he pulls the two halves apart with a small tug, turns one of " +
  "them over, and clicks them back together so they snap flush. He repeats the pull-apart and " +
  "snap-together once more, idly, the way someone fidgets with a lighter. The mouthpiece tip is " +
  "at the top when assembled. He never brings the device near his mouth and never puts it to his " +
  "lips — it stays up beside his cheek or down at chest level the whole time.";

const CAMERA =
  "The phone is propped and mostly static with tiny natural drift; auto-exposure hunts as the " +
  "light shifts. He glances down at his hands and back to the lens, shifts in his seat, laughs at " +
  "himself. One continuous unbroken take — no cuts, no cutaways, no inserts.";

const VOICE =
  "He speaks in a natural Southern-Californian accent at an unhurried, easy conversational pace — " +
  "he takes his time, lets small pauses sit between thoughts, and does not rush.";

const BEATS = [
  `0-5s: Close on his face, the device already up beside his cheek. He says: "Okay so the MOO-ha ` +
  `Gen two-by-two is actually two separate halves."`,
  `5-9s: He pulls the two halves apart with a small tug and holds one in each hand. He says: ` +
  `"And they're magnetic."`,
  `9-15s: He turns each half toward the lens in turn. He says: "The black one's Canary Island ` +
  `Punch, the gold one's DC-10 Diesel."`,
  `15-21s: He flips one half over and clicks them back together so they snap flush. He says: ` +
  `"You pull 'em apart, flip 'em around, snap 'em back together."`,
  `21-26s: He does it again absent-mindedly, looking at the lens not his hands. He says: "I've ` +
  `been sitting in my car just doing this for like twenty straight minutes."`,
  `26-30s: He laughs and lowers his hands slightly. He says: "It's a whole fidget thing, honestly, ` +
  `I can't stop. And there's a giveaway inside the box."`,
];

const AUDIO =
  "Audio: his voice close on the phone microphone inside the car — a little cabin room tone, " +
  "muffled traffic outside, and a small crisp magnetic click each time the two halves snap " +
  "together. No instruments, no melody, no song, no soundtrack.";

const RULES = "No on-screen text, no captions, no subtitles, no logos overlaid on the picture.";

const PROOF_BEATS = [
  `0-5s: Close on his face, the device up beside his cheek. He pulls the two magnetic halves ` +
  `apart with a small tug and clicks them straight back together so they snap flush. He says: ` +
  `"Okay so this thing is actually two separate halves. And they're magnetic."`,
];

const dataUri = (p) => `data:image/png;base64,${fs.readFileSync(p).toString("base64")}`;
const spoken = (b) => b.join(" ").match(/"([^"]*)"/g).join(" ").replace(/"/g, "");
const wc = (s) => s.trim().split(/\s+/).filter(Boolean).length;

const build = (beats, dur) =>
  `${LOOK}\n\n${PRODUCT}\n\n${ACTION}\n\n${CAMERA}\n\n${VOICE}\n\n${beats.join("\n")}\n\n` +
  `${AUDIO} ${RULES} --ratio 9:16 --dur ${dur} --resolution 720p --watermark false`;

const body = (beats, dur) => ({
  model: "dreamina-seedance-2-5-260628",
  generate_audio: true,
  content: [
    { type: "text", text: build(beats, dur) },
    { type: "image_url", image_url: { url: dataUri(SKU) }, role: "reference_image" },
  ],
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run(label, beats, dur) {
  fs.mkdirSync(OUT, { recursive: true });
  const b = body(beats, dur);
  const w = wc(spoken(beats));
  console.log(`\n=== ${label} — ${dur}s · ${w} words · ${(w / dur).toFixed(2)} w/s · ` +
              `$${(dur * (108633 / 5) * 0.0107 / 1000).toFixed(2)}\n`);
  fs.writeFileSync(path.join(OUT, `${label}.request.json`), JSON.stringify(
    { ...b, content: [b.content[0], { ...b.content[1], image_url: { url: "<base64 elided>" } }] }, null, 2));
  const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
  const res = await fetch(BASE, { method: "POST", headers: H, body: JSON.stringify(b) });
  const txt = await res.text();
  console.log(`SUBMIT HTTP ${res.status} ${txt.trim().slice(0, 150)}`);
  const id = (() => { try { return JSON.parse(txt).id; } catch { return null; } })();
  if (!id) return;
  const t0 = Date.now();
  while ((Date.now() - t0) / 1000 < 1200) {
    const j = await (await fetch(`${BASE}/${id}`, { headers: H })).json();
    if (["succeeded", "failed", "cancelled"].includes(j.status)) {
      console.log(`\nPOLL status=${j.status} after ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      fs.writeFileSync(path.join(OUT, `${label}.task.json`), JSON.stringify(j, null, 2));
      if (j.status !== "succeeded") { console.log(JSON.stringify(j.error, null, 2)); return; }
      console.log(`tokens=${j.usage?.completion_tokens} res=${j.resolution} ratio=${j.ratio} seed=${j.seed}`);
      const buf = Buffer.from(await (await fetch(j.content.video_url)).arrayBuffer());
      fs.writeFileSync(path.join(OUT, `${label}.mp4`), buf);
      console.log(`SAVED ${path.join(OUT, `${label}.mp4`)} (${(buf.length / 1e6).toFixed(1)} MB)`);
      return;
    }
    process.stdout.write(`[${((Date.now() - t0) / 1000).toFixed(0)}s ${j.status}] `);
    await sleep(10000);
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
if (process.argv.includes("--go")) await run(`gen2x2-30s-${stamp}`, BEATS, 30);
else if (process.argv.includes("--proof")) await run(`gen2x2-proof-5s-${stamp}`, PROOF_BEATS, 5);
else {
  for (const [n, b, d] of [["PROOF", PROOF_BEATS, 5], ["FULL", BEATS, 30]]) {
    const w = wc(spoken(b));
    console.log(`\n${n}  ${d}s  ${w} words  ${(w / d).toFixed(2)} w/s  ` +
                `$${(d * (108633 / 5) * 0.0107 / 1000).toFixed(2)}` +
                (d === 30 ? `  house band 2.18-3.1: ${w / d >= 2.0 && w / d <= 3.1 ? "OK" : "OUT"}` : ""));
    console.log(`  ${spoken(b)}`);
  }
  console.log(`\nreference: ${SKU}`);
  console.log(`\nDRY RUN — nothing submitted.\n`);
}
