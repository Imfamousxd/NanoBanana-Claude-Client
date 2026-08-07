#!/usr/bin/env node
/**
 * GOLDEN HOUR — the missing beats.
 *
 * Gaps in the first pass, closed here:
 *  1. THE SCAN. A scan-to-enter campaign shipped without the scan on screen. The zip contains a
 *     "hands holding a smartphone" golden-hour plate that is exactly this beat, unused.
 *  2. AMBIENCE. The film had no bed under the VO at all. seedance 2.5 generates audio jointly, and
 *     the earlier copyright refusals were specifically its invented MUSIC — so these ask for
 *     natural ambience only and never a score. A beat that still refuses loses its bed, not its
 *     picture, and can be re-run silent.
 *  3. COVERAGE. Four more plates so there is enough material to cut a longer film and to post
 *     beats individually.
 *
 * Measured constraints unchanged: --ratio adaptive with a first frame, NO resolution parameter
 * (720p ceiling in both i2v and t2v), host ark.ap-southeast.bytepluses.com.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = "/Users/Hassoonie/Desktop/CODE PROJECTS/NanoBanana-Client";
const SRCWT = path.join(REPO, ".claude/worktrees/agent-a7044511e4cba5e6d");
for (const line of fs.readFileSync(path.join(REPO, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.MODELARK_API_KEY;
const BASE = "https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks";
const MODEL = "dreamina-seedance-2-5-260628";
const SUN = path.join(SRCWT, "inputs/golden-hour-source/Sunsets ");
const OUT = path.join(SRCWT, "generations", "golden-hour-30s");
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;

const RULES =
  "Keep the existing composition, colour and grade EXACTLY. The camera is locked and does not pan, " +
  "zoom or tilt. No text, no captions, no logos, no watermarks. Nothing morphs or duplicates.";

// Ambience only. Naming music at all risks the model scoring the shot and then refusing its own
// output for copyright, which is what killed two generations earlier today.
const AMBIENCE =
  "Audio: natural location ambience only — water and a light breeze, as recorded on location. " +
  "Quiet, wide and open. No voices, no instruments, no melody, no song, no soundtrack.";

const BEATS = [
  {
    id: "x1-the-scan",
    plate: path.join(SUN, "2026-07-30T19-15-54_Hands_holding_a_smartphone_in_the_foregr.png"),
    note: "THE SCAN — the mechanic beat that was missing",
    motion:
      "Golden hour. The hands holding the phone are steady, with only the smallest natural " +
      "movement. The ocean and sky behind shimmer and drift, the light warms as the sun drops a " +
      "fraction, and a soft highlight moves across the phone's edge. The screen stays clean and " +
      "unchanged. ",
  },
  {
    id: "x2-terrace",
    plate: path.join(SUN, "2026-07-30T19-01-30_Sun_washed_stone_terrace_table_at_golden.png"),
    note: "terrace — lifestyle",
    motion:
      "Golden hour on a stone terrace above the sea. Condensation glistens on the glass, the water " +
      "far below moves gently, foliage stirs in a light breeze, and the low sun warms the stone as " +
      "it drops. The table and glass stay perfectly still. ",
  },
  {
    id: "x3-wrist",
    plate: path.join(SUN, "2026-07-30T19-04-00_Close_up_of_a_relaxed_wrist_and_forearm.png"),
    note: "wrist on the rail — human, no branded product in frame",
    motion:
      "Golden hour aboard a yacht. The sea beyond moves with a slow swell and the sun's reflection " +
      "glitters and drifts. The linen sleeve stirs slightly in the breeze. The wrist and the rail " +
      "stay relaxed and still. ",
  },
  {
    id: "x4-afterglow",
    plate: path.join(SUN, "2026-07-30T19-25-29_Moments_after_sunset_over_calm_ocean_de.png"),
    note: "afterglow — alternative close",
    motion:
      "Moments after sunset over a calm ocean. The afterglow deepens slowly from amber into rose " +
      "and blue, the water breathes with a very slow swell, and the last light fades a little " +
      "further by the end of the shot. Everything settles. ",
  },
];

const RUN = ONLY ? BEATS.filter((b) => ONLY.includes(b.id)) : BEATS;

function dataUri(p) {
  const buf = fs.readFileSync(p);
  return `data:${buf[0] === 0xff && buf[1] === 0xd8 ? "image/jpeg" : "image/png"};base64,${buf.toString("base64")}`;
}

async function submit(b) {
  const body = {
    model: MODEL,
    generate_audio: true,
    content: [
      { type: "text", text: `${b.motion}${RULES} ${AMBIENCE} --ratio adaptive --dur 5 --camerafixed true --watermark false` },
      { type: "image_url", image_url: { url: dataUri(b.plate) }, role: "first_frame" },
    ],
  };
  const r = await fetch(BASE, {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`${b.id} submit ${r.status}: ${t.slice(0, 200)}`);
  return JSON.parse(t).id;
}

async function poll(id, label) {
  for (let i = 0; i < 200; i++) {
    await new Promise((r) => setTimeout(r, 6000));
    const j = await (await fetch(`${BASE}/${id}`, { headers: { Authorization: `Bearer ${KEY}` } })).json();
    if (j.status === "succeeded") return j;
    if (j.status === "failed" || j.status === "cancelled")
      throw new Error(`${label} ${j.status}: ${JSON.stringify(j.error || {}).slice(0, 180)}`);
    if (i % 15 === 0) console.log(`   ${label}: ${j.status} (${i * 6}s)`);
  }
  throw new Error(`${label}: timed out`);
}

console.log(`\nGOLDEN HOUR — ${RUN.length} additional beat(s), audio ON (ambience only)\n`);
for (const b of RUN) console.log(`  ${b.id.padEnd(14)} ${fs.existsSync(b.plate) ? "✓" : "✗ MISSING"}  ${b.note}`);

fs.mkdirSync(OUT, { recursive: true });
const jobs = [];
for (const b of RUN) {
  try { const id = await submit(b); console.log(`   submitted ${b.id} → ${id}`); jobs.push({ b, id }); }
  catch (e) { console.error(`   ✗ ${e.message}`); }
}
for (const { b, id } of jobs) {
  try {
    const done = await poll(id, b.id);
    const url = done?.content?.video_url;
    if (!url) { console.error(`   ✗ ${b.id}: no url`); continue; }
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    fs.writeFileSync(path.join(OUT, `${b.id}.mp4`), buf);
    console.log(`   ✓ ${b.id}.mp4 (${(buf.length / 1e6).toFixed(1)} MB)`);
  } catch (e) { console.error(`   ✗ ${e.message}`); }
}
console.log(`\n${OUT}`);
