#!/usr/bin/env node
/**
 * MUHA MEMBERS — GOLDEN HOUR — UGC EXPLAINER v2.
 * One continuous 30s take. She holds the REAL entry card. No cutaways.
 *
 * WHAT CHANGED FROM v1, and why each change is possible now
 *  1. SHE HOLDS THE ACTUAL CARD. v1 cut away to animated poster art because a first attempt with
 *     the card as a reference was refused. That refusal has since been isolated: it was the
 *     THIRD-PARTY watch printed on the card front, not the reference mechanism. The card's own-brand
 *     QR side passes and renders faithfully (sd25:reference-image-passes-for-own-brand-assets).
 *     The compose-a-frame-in-Nano-Banana alternative is CLOSED — 2.5 refuses human first frames on
 *     privacy grounds (sd25:first-frame-refuses-real-people).
 *  2. NO CUTAWAYS. One take, one person, her hands doing the work.
 *  3. PHONETIC BRAND NAME. v1 delivered "MUHU". Written "MOO-ha" here per
 *     sd25:spell-brand-names-phonetically — this run is also the test of that law, which is
 *     currently only moderate because the fix was prescribed by analogy and never measured.
 *  4. FRAMING FIX. The card-in-hand test put the card over her face. It is now specified as
 *     palm-sized, held beside her cheek, with her face fully visible.
 *
 * SCRIPT is written to ugc_laws: hook 10 words landing ~3.1s carrying the concrete noun; ~3.2 w/s
 * ARTICULATION across the speaking portion (wall-clock is the wrong gate); CTA fused at 4 words
 * with no outro; informality via contractions, not filler.
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
const MODEL = "dreamina-seedance-2-5-260628";
const CARD = path.join(__dirname, "inputs/card-qr-side.png");
const OUT = path.join(__dirname, "generations", "gh-explainer");

const LOOK =
  "Vertical selfie video, shot on a phone at arm's length, golden hour at a marina. Warm low sun " +
  "behind her, moored white yachts and glittering water out of focus behind. A woman in her late " +
  "twenties with sun-flushed skin, visible pores and natural oil shine on her nose and forehead, " +
  "freckles and faint sunburn across her cheeks — no beauty filter, no skin smoothing. She holds " +
  "the phone in one hand so the frame bobs, drifts and re-centres, and the auto-exposure hunts as " +
  "she moves relative to the sun. She squints into the low light, blinks naturally, and pushes " +
  "hair off her face when the wind catches it. Hard low sun puts a hot edge on one cheek and blows " +
  "out the highlights on the water behind. She is excited and talking fast, like she is telling a " +
  "friend something she just found out.";

// FRAMING — the v1 card test put the card over her face. Size and position are now explicit.
const CARDREF =
  "In her other hand she holds the small glossy card shown in reference image 1 — a black card " +
  "with a gold square code and an ornate gold monogram at its centre, inside a thin gold " +
  "decorative border. Reproduce that card faithfully. It is PALM-SIZED, about the size of a credit " +
  "card, and she holds it up beside her cheek at a natural arm position, angled so the gold code " +
  "catches the low sun. Her face stays fully visible and unobstructed the whole time — the card " +
  "never covers her face and never fills the frame.";

const SCRIPT =
  "0-6s: Close on her face, card down out of shot. She grins and says: \"There's a card in your " +
  "MOO-ha pack worth ten entries. And the prize is a Rolex.\"\n" +
  "6-13s: She lifts the card up beside her cheek and tilts it toward the lens so the gold catches " +
  "the sun. She says: \"Golden Hour Edition — that's the one. Thirty-five thousand dollar " +
  "Yacht-Master.\"\n" +
  "13-20s: She turns the card so the gold code faces the lens and taps it once with a fingertip. " +
  "She says: \"You scan this code in the MOO-ha Members app. That is honestly the whole thing.\"\n" +
  "20-26s: She lowers the card slightly, eyebrows up. She says: \"Ten entries, instantly. And " +
  "every single card you scan is another ten. I've done four already.\"\n" +
  "26-30s: Card drops out of frame, sun flaring behind her. She shrugs and laughs and says: " +
  "\"Check your pack. Seriously, go look.\"";

const AUDIO =
  "Audio: her own voice, recorded on the phone's own microphone so it is close, a little " +
  "compressed and slightly wind-buffeted, with marina ambience underneath — water, rigging, " +
  "distant gulls. No music, no instruments, no soundtrack.";

const RULES =
  "No on-screen text, no captions, no subtitles, no graphics and no added logos anywhere. She " +
  "stays the same person throughout with the same hair, clothing and face, and the card stays the " +
  "same card. Real handheld phone footage, not cinematic, not colour graded.";

function dataUri(p) {
  const buf = fs.readFileSync(p);
  return `data:${buf[0] === 0xff && buf[1] === 0xd8 ? "image/jpeg" : "image/png"};base64,${buf.toString("base64")}`;
}

async function submit() {
  const body = {
    model: MODEL,
    generate_audio: true,
    content: [
      { type: "text", text: `${LOOK}\n\n${CARDREF}\n\n${SCRIPT}\n\n${AUDIO} ${RULES} --ratio 9:16 --dur 30 --watermark false` },
      { type: "image_url", image_url: { url: dataUri(CARD) }, role: "reference_image" },
    ],
  };
  const r = await fetch(BASE, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`submit ${r.status}: ${t.slice(0, 320)}`);
  return JSON.parse(t).id;
}

async function poll(id) {
  for (let i = 0; i < 300; i++) {
    await new Promise((r) => setTimeout(r, 6000));
    const j = await (await fetch(`${BASE}/${id}`, { headers: { Authorization: `Bearer ${KEY}` } })).json();
    if (j.status === "succeeded") return j;
    if (j.status === "failed" || j.status === "cancelled")
      throw new Error(`${j.status}: ${JSON.stringify(j.error || {}).slice(0, 300)}`);
    if (i % 15 === 0) console.log(`   ${j.status} (${i * 6}s)`);
  }
  throw new Error("timed out");
}

fs.mkdirSync(OUT, { recursive: true });
console.log(`\nUGC EXPLAINER v2 — 30s, one take, real card in hand, phonetic brand name\n`);
const id = await submit();
console.log(`   submitted → ${id}`);
const done = await poll(id);
const url = done?.content?.video_url;
if (!url) { console.error("no video_url"); process.exit(1); }
const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
const f = path.join(OUT, "explainer-v2-30s.mp4");
fs.writeFileSync(f, buf);
console.log(`   ✓ ${f} (${(buf.length / 1e6).toFixed(1)} MB)`);
