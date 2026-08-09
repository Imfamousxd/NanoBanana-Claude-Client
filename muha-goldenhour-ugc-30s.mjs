#!/usr/bin/env node
/**
 * muha-goldenhour-ugc-30s.mjs — Golden Hour UGC, built to the HOUSE spec, not to a recipe example.
 *
 *   node muha-goldenhour-ugc-30s.mjs --dry-run
 *   node muha-goldenhour-ugc-30s.mjs --go        # ~$6.97
 *
 * EVERY SPEC BELOW COMES FROM house_laws — measured off the operator's own finished work by
 * sieve-corpus.py, 2026-08-08. The previous build used the Seedance playbook's EXAMPLE prompt and
 * matched two of six house parameters.
 *
 *   30s              house:duration-ladder-is-5-10-30 — the ladder is 5/10/30. 20s ships nowhere.
 *   ONE TAKE         house:ugc-lane-is-one-unbroken-take — 3/3 approved UGC clips are 1 shot, and
 *                    the explainer was REVISED from 7 shots down to 1.
 *   9:16             house:ugc-ships-9x16-only.
 *   ~2.3 w/s         house:ugc-articulation-is-slower-than-the-generic-law. 70 words over 30s.
 *                    NOTE this DELIBERATELY breaks ugc:word-budget-3-2-words-per-second (3.1-3.8),
 *                    because that generic law would have failed the operator's own approved v2 at
 *                    2.18 w/s. House wins over corpus.
 *   EXTREME CU       house:ugc-framing-is-face-fills-frame-cropped-at-the-hairline.
 *   CARD BESIDE      house:card-is-held-beside-the-cheek-never-over-the-face — a paid lesson: the
 *   THE CHEEK        first card-in-hand test put the card over her face.
 *   SKIN             house:skin-carries-the-realism-not-the-grade.
 *   NO TEXT          house:no-on-screen-text-in-the-ugc-lane.
 *
 * THE CARD IS THE REAL ONE, AND THE ROUTE IS reference_image — NOT first_frame.
 * The privacy guard rejects images CONTAINING A PERSON in any role. A card is not a person, so it
 * passes as a reference while the human is generated from text. Use the OWN-BRAND QR side: an i2v
 * attempt on the prize face (card-clean.png, Rolex Yacht-Master) was refused 2026-08-08 with
 * OutputVideoSensitiveContentDetected.PolicyViolation — a prominent rendered third-party mark.
 *
 * SETTING is the operator's call (car, strip-mall parking lot), not the house marina. Casting is
 * the operator's brief: 24, Mexican-American, Southern Californian. Neither is inherited.
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
const CARD = path.join(__dirname, "inputs/card-qr-side.png");
const OUT = path.join(__dirname, "generations", "muha-goldenhour-house");

const LOOK =
  "Vertical selfie video shot on a phone held in one hand. EXTREME CLOSE-UP: his face fills the " +
  "frame edge to edge, the top of his head and hairline are cropped off the top of frame, his chin " +
  "sits near the bottom, his eyes ride in the upper third. He is sitting in the driver's seat of " +
  "his own car in an ordinary strip-mall parking lot, late afternoon sun coming in low through the " +
  "side window and blowing out one edge of frame with a little lens flare; the headrest and the " +
  "defocused parking lot are just visible past his shoulder. " +
  "A 24-year-old Mexican-American man from Southern California, short dark hair, light stubble, " +
  "plain white t-shirt, a thin gold chain. Visible skin pores, oil shine on his nose and forehead, " +
  "faint sun-flush across his cheekbones, forehead lines when he raises his brows, blown highlights " +
  "on the sunlit side of his face — no beauty filter, no skin smoothing, no colour grade. " +
  "Full-bleed, fills the frame edge to edge, no border, no mockup.";

const CARDREF =
  "In his other hand he holds the small glossy card shown in reference image 1 — a black card with " +
  "a gold square code and an ornate gold monogram at its centre, inside a thin gold decorative " +
  "border. Reproduce that card faithfully. It is PALM-SIZED, about the size of a credit card, and " +
  "he holds it up beside his cheek at a natural arm position, angled so the gold code catches the " +
  "low sun. His face stays fully visible and unobstructed the whole time — the card never covers " +
  "his face and never fills the frame.";

const CAMERA =
  "He holds the phone himself so the frame bobs, drifts and re-centres; auto-exposure hunts as the " +
  "light shifts. He glances out the windshield and back to the lens, shifts in his seat, talks with " +
  "the hand holding the card. Casual, mid-conversation energy, like he is telling a friend " +
  "something he just found out. One continuous unbroken take — no cuts, no cutaways, no inserts.";

const VOICE =
  "He speaks in a natural Southern-Californian accent at an unhurried, easy conversational pace — " +
  "he takes his time, lets small pauses sit between thoughts, and does not rush. Open throat, " +
  "slightly clipped consonants.";

const BEATS = [
  `0-5s: Close on his face, the card still down out of frame. He says: "Bro, the little card in ` +
  `your MOO-ha pack? I almost threw that shit out."`,
  `5-10s: He shakes his head, half-laughing. He says: "Straight in the trash, didn't even flip it over."`,
  // "code" came back as "coat" on the first roll. Per defect:brand-term-garble the fix is NOT to
  // respell (measured WORSE: "L-dohpa" scored 2/12 against "L-Dopa" at 13/25) — it is to change the
  // token to one that cannot collapse. "QR code" carries a hard consonant pair and a distinct
  // two-token shape, and it is also more accurate: the card's panel is a QR.
  `10-14s: He says: "Then my boy goes, bro, there's a QR code on the back."`,
  `14-18s: He lifts the card into frame beside his cheek, angling it so the gold catches the ` +
  `light. He says: "This one."`,
  `18-23s: He holds the card steady beside his face. He says: "You scan it in the Members app and ` +
  `it drops ten entries on you."`,
  `23-27s: He raises his eyebrows, glances at the card then back to lens. He says: "Ten. For a ` +
  `thirty-five thousand dollar Rolex Yacht-Master."`,
  `27-30s: He laughs at himself and lowers the card slightly. He says: "Off a card I almost threw ` +
  `away. Check your pack."`,
];

const AUDIO =
  "Audio: his voice close on the phone microphone inside the car — a little cabin room tone, " +
  "muffled traffic outside. No instruments, no melody, no song, no soundtrack.";

const RULES = "No on-screen text, no captions, no subtitles, no brand logos anywhere in frame.";

const spoken = BEATS.join(" ").match(/"([^"]*)"/g).join(" ").replace(/"/g, "");
const words = spoken.trim().split(/\s+/).length;

const text = `${LOOK}\n\n${CARDREF}\n\n${CAMERA}\n\n${VOICE}\n\n${BEATS.join("\n")}\n\n${AUDIO} ` +
  `${RULES} --ratio 9:16 --dur 30 --resolution 720p --watermark false`;

const dataUri = (p) => `data:image/png;base64,${fs.readFileSync(p).toString("base64")}`;

const body = () => ({
  model: "dreamina-seedance-2-5-260628",
  generate_audio: true,
  content: [
    { type: "text", text },
    { type: "image_url", image_url: { url: dataUri(CARD) }, role: "reference_image" },
  ],
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!process.argv.includes("--go")) {
  console.log(`\n30s · ${words} words · ${(words / 30).toFixed(2)} w/s wall-clock`);
  console.log(`house articulation band 2.18-3.1 w/s : ${words / 30 >= 2.0 && words / 30 <= 3.1 ? "OK" : "OUT"}`);
  console.log(`card reference: ${CARD} (${(fs.statSync(CARD).size / 1e6).toFixed(2)} MB, own-brand QR side)`);
  console.log(`\nSPOKEN:\n${spoken}\n`);
  console.log(`cost: $6.97   —  DRY RUN, nothing submitted. --go to spend.\n`);
  process.exit(0);
}

fs.mkdirSync(OUT, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const label = `gh-ugc-house-30s-${stamp}`;
const b = body();
fs.writeFileSync(path.join(OUT, `${label}.request.json`), JSON.stringify(
  { ...b, content: [b.content[0], { ...b.content[1], image_url: { url: "<base64 elided>" } }] }, null, 2));

const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const res = await fetch(BASE, { method: "POST", headers: H, body: JSON.stringify(b) });
const txt = await res.text();
console.log(`SUBMIT HTTP ${res.status} ${txt.trim().slice(0, 160)}`);
const id = (() => { try { return JSON.parse(txt).id; } catch { return null; } })();
if (!id) process.exit(1);

const t0 = Date.now();
while ((Date.now() - t0) / 1000 < 1200) {
  const j = await (await fetch(`${BASE}/${id}`, { headers: H })).json();
  if (["succeeded", "failed", "cancelled"].includes(j.status)) {
    console.log(`\nPOLL status=${j.status} after ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    fs.writeFileSync(path.join(OUT, `${label}.task.json`), JSON.stringify(j, null, 2));
    if (j.status !== "succeeded") { console.log(JSON.stringify(j.error, null, 2)); break; }
    console.log(`tokens=${j.usage?.completion_tokens} res=${j.resolution} ratio=${j.ratio} dur=${j.duration} seed=${j.seed}`);
    const buf = Buffer.from(await (await fetch(j.content.video_url)).arrayBuffer());
    fs.writeFileSync(path.join(OUT, `${label}.mp4`), buf);
    console.log(`SAVED ${path.join(OUT, `${label}.mp4`)} (${(buf.length / 1e6).toFixed(1)} MB)`);
    break;
  }
  process.stdout.write(`[${((Date.now() - t0) / 1000).toFixed(0)}s ${j.status}] `);
  await sleep(10000);
}
