#!/usr/bin/env node
/**
 * GOLDEN HOUR — GENERATED, not animated.
 *
 * Everything before this animated the client's approved posters. This does the opposite: it takes
 * the CONCEPTS (Muha Members giveaway, $35,000 Rolex Yacht-Master, scan the insert card, golden
 * hour yacht world) and generates fresh video from text, to find out what seedance 2.5 can
 * actually do.
 *
 * THIS IS ALSO AN EXPERIMENT AGAINST OUR OWN RULEBOOK.
 * CLAUDE.md states flatly: "seedance-2.0 CATEGORICALLY REFUSES photoreal human first frames —
 * E005 ... 1.5-pro is not a preference for people, it is the only option." The recon fleet then
 * found Higgsfield shipping iPhone-style UGC talking heads, unboxings and try-ons ON Seedance 2.0,
 * which contradicts that. The reconciliation was always: our E005 case was about a supplied
 * photoreal first FRAME, not about text-to-video. Nothing here supplies a frame, so if these
 * return people the rule is confirmed as frame-scoped and a whole category opens up on this model.
 *
 * NATIVE DIALOGUE. 2.5 generates audio and video jointly, so speech goes in the prompt in double
 * quotes and comes back lip-synced rather than assembled. That is the capability worth testing —
 * it is the thing our stack has never had (memory: video-layer-is-the-unsolved-layer).
 *
 * SCRIPTS ARE WRITTEN TO THE ugc_laws CORPUS (57 laws, 29 winners):
 *   ugc:hook-3-to-14-words-complete-by-3s   every hook is <=14 words and lands inside ~3.5s
 *   the hook carries the CONCRETE NOUN the viewer self-selects on ("Rolex", "$35,000"), not a
 *     category word like "giveaway"
 *   ugc:gate-articulation-not-wallclock     written to be SPOKEN at ~4 w/s, the measured winner median
 *   ugc:cta-under-6-words-fused-no-outro    closes fused, never a separate outro card
 *   ugc:zero-filler-informality-in-contractions  contractions carry the informality, not "um"
 *
 * MEASURED CONSTRAINTS: no first_frame here, so --ratio IS settable (the adaptive rule is
 * first-frame-only). `resolution` is still rejected on 2.5 in both modes -> 720p ceiling.
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
const OUT = path.join(__dirname, "generations", "gh-generated");
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;

const JOBS = [
  // ── UGC lane — can 2.5 do a photoreal talking head from text, with its own voice? ──────────
  {
    id: "ugc-01-selfie-marina",
    kind: "UGC",
    dur: 10,
    prompt:
      `Vertical selfie video, shot on a phone at arm's length, golden hour at a marina with yachts ` +
      `and warm low sun behind her. A woman in her late twenties, sun-flushed skin, hair moving in ` +
      `the breeze, holds the phone herself so the framing bobs very slightly. She is excited and ` +
      `talking fast, like she is telling a friend something she just found out.\n` +
      `0-4s: close on her face, she grins and says: "Muha is giving away a thirty-five thousand ` +
      `dollar Rolex."\n` +
      `4-10s: she turns the phone slightly toward the marina behind her, then back, and says: ` +
      `"You scan the card in the Members app, and that's ten entries. I've scanned four already."\n` +
      `Natural handheld movement, real skin texture with visible pores, no beauty filter, ambient ` +
      `marina sound and light wind under her voice. No on-screen text, no captions, no logos.`,
  },
  {
    id: "ugc-02-card-in-hand",
    kind: "UGC",
    dur: 10,
    prompt:
      `Vertical phone video, golden hour on a wooden dock. A man in his early thirties in a linen ` +
      `shirt holds a small glossy insert card up toward the camera between his fingers, turning it ` +
      `slowly so the low sun catches it. He is casual and amused, talking to the camera he is ` +
      `holding in his other hand.\n` +
      `0-3s: he lifts the card into frame and says: "This little card is worth ten entries."\n` +
      `3-10s: he flips it over to show the back, glances at it, then back to camera: "Scan it in ` +
      `the Members app. Takes two seconds. And the prize is an actual Rolex Yacht-Master."\n` +
      `Handheld, slightly imperfect framing, real skin, warm rim light from behind, ambient water ` +
      `and dock sounds. No on-screen text, no captions, no brand logos anywhere.`,
  },
  // ── EDUCATIONAL lane — explainer, multi-shot inside ONE generation ────────────────────────
  {
    id: "edu-01-how-it-works",
    kind: "EDU",
    dur: 15,
    prompt:
      `Vertical explainer video at golden hour, clean and premium, three shots in sequence, warm ` +
      `navy-and-gold palette throughout.\n` +
      `0-5s: overhead shot of a small glossy card lying on a teak yacht deck beside a coil of rope ` +
      `and a brass cleat, low sun raking across. A calm confident male voice says: "Every Muha ` +
      `Members pack has an insert card inside."\n` +
      `5-10s: close on a pair of hands holding a phone over that card, the phone's camera pointed ` +
      `at it, sunset water blurred behind. The voice continues: "Open the Members app, and scan it."\n` +
      `10-15s: wide shot of a luxury motor yacht crossing a sunset ocean, long golden wake behind ` +
      `it. The voice says: "That's ten entries, instantly. Every card you scan is ten more."\n` +
      `Cinematic, tripod-steady, shallow depth of field, ambient ocean and light wind under the ` +
      `voice. No on-screen text, no captions, no logos.`,
  },
  {
    id: "edu-02-what-you-win",
    kind: "EDU",
    dur: 15,
    prompt:
      `Vertical premium product film at golden hour, two shots, warm gold and deep navy.\n` +
      `0-7s: extreme close macro of a stainless steel luxury sailing chronograph with a blue ` +
      `ceramic rotating bezel, lying on dark varnished teak, low sun travelling across the polished ` +
      `case and bracelet, sunset marina bokeh far behind. A calm male voice says: "This is what a ` +
      `golden hour is worth."\n` +
      `7-15s: the camera holds as the light warms and a navy pennant ripples out of focus behind ` +
      `the watch. The voice says: "Thirty-five thousand dollars, on one wrist, at the end of ` +
      `summer. Members only."\n` +
      `Locked tripod, no camera movement, real metal reflections, ambient marina sound under the ` +
      `voice. No on-screen text, no captions, no brand names or logos visible anywhere.`,
  },
  // ── CINEMATIC lane — regenerate the campaign's world from scratch, no client art ───────────
  {
    id: "cine-01-yacht-run",
    kind: "CINE",
    dur: 10,
    prompt:
      `Aerial drone shot, vertical framing, golden hour. A white luxury motor yacht cuts across a ` +
      `deep navy ocean directly toward a low orange sun sitting on the horizon, throwing a long ` +
      `glittering path over the water and a wide white wake behind it. The drone holds a steady ` +
      `altitude and does not move; the yacht travels through frame. Warm haze, scattered gold ` +
      `clouds. Cinematic, high dynamic range. Audio: open ocean wind and distant water only, no ` +
      `music. No text, no captions, no logos.`,
  },
  {
    id: "cine-02-deck-ritual",
    kind: "CINE",
    dur: 10,
    prompt:
      `Vertical cinematic shot at golden hour on the aft deck of a yacht. A coil of white rope, a ` +
      `polished brass cleat and a folded navy pennant lie on warm varnished teak, low sun raking ` +
      `hard from the left and throwing long shadows across the planks. The pennant lifts and ` +
      `settles in the breeze, the light slowly warms and deepens, and the ocean glitters out of ` +
      `focus beyond the rail. The camera is locked on a tripod and never moves. Audio: water ` +
      `against the hull and light wind only, no music. No text, no captions, no logos.`,
  },
];

const RUN = ONLY ? JOBS.filter((j) => ONLY.includes(j.id)) : JOBS;

async function submit(j) {
  const body = {
    model: MODEL,
    generate_audio: true, // the point of the test: joint audio, including speech
    content: [
      { type: "text", text: `${j.prompt} --ratio 9:16 --dur ${j.dur} --watermark false` },
    ],
  };
  const r = await fetch(BASE, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${j.id} submit ${r.status}: ${t.slice(0, 220)}`);
  return JSON.parse(t).id;
}

async function poll(id, label) {
  for (let i = 0; i < 220; i++) {
    await new Promise((r) => setTimeout(r, 6000));
    const j = await (await fetch(`${BASE}/${id}`, { headers: { Authorization: `Bearer ${KEY}` } })).json();
    if (j.status === "succeeded") return j;
    if (j.status === "failed" || j.status === "cancelled")
      throw new Error(`${label} ${j.status}: ${JSON.stringify(j.error || {}).slice(0, 200)}`);
    if (i % 15 === 0) console.log(`   ${label}: ${j.status} (${i * 6}s)`);
  }
  throw new Error(`${label}: timed out`);
}

console.log(`\nGOLDEN HOUR — GENERATED FROM TEXT, ${RUN.length} job(s), audio ON incl. dialogue\n`);
for (const j of RUN) console.log(`  ${j.id.padEnd(22)} ${String(j.dur).padStart(2)}s  ${j.kind}`);

fs.mkdirSync(OUT, { recursive: true });
const jobs = [];
for (const j of RUN) {
  try { const id = await submit(j); console.log(`   submitted ${j.id} → ${id}`); jobs.push({ j, id }); }
  catch (e) { console.error(`   ✗ ${e.message}`); }
}
const verdict = [];
for (const { j, id } of jobs) {
  try {
    const done = await poll(id, j.id);
    const url = done?.content?.video_url;
    if (!url) { console.error(`   ✗ ${j.id}: no url`); verdict.push([j.id, "no url"]); continue; }
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    fs.writeFileSync(path.join(OUT, `${j.id}.mp4`), buf);
    console.log(`   ✓ ${j.id}.mp4 (${(buf.length / 1e6).toFixed(1)} MB)`);
    verdict.push([j.id, "ok"]);
  } catch (e) {
    console.error(`   ✗ ${e.message}`);
    verdict.push([j.id, e.message.slice(0, 90)]);
  }
}
console.log(`\n--- verdict ---`);
for (const [id, v] of verdict) console.log(`  ${id.padEnd(22)} ${v}`);
console.log(`\n${OUT}`);
