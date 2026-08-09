#!/usr/bin/env node
/**
 * muha-goldenhour-card.mjs — the Golden Hour card as a hero insert, Seedance 2.5 i2v.
 *
 *   node muha-goldenhour-card.mjs --dry-run
 *   node muha-goldenhour-card.mjs --go        # ~$1.16
 *
 * WHY THIS IS A SEPARATE SHOT AND NOT THE CREATOR HOLDING THE CARD
 * A photoreal human is refused in ANY image role at submit (privacy guard, image-scoped). So the
 * card cannot be composed into the talking-head frame — there is no image input available on a
 * shot containing a person. The alternative, describing the card in the text prompt, makes the
 * model IMITATE it: garbled type, an invented watch, and a rendered third-party mark generated
 * from scratch. Both worse.
 *
 * So: recipe `branded-artwork`. Animate the client's OWN approved artwork with a locked camera.
 * That is simultaneously the fidelity fix (the Rolex and the Golden Hour script are pixel-exact,
 * not an imitation) and the moderation fix (nothing branded is being generated).
 *
 * PARAMS
 *   --ratio adaptive   MANDATORY with a first frame. Any explicit ratio is a hard error, and the
 *                      output shape follows the image: this card is 1500x1000, so the clip comes
 *                      back ~3:2 LANDSCAPE. It is an insert to cut into the 9:16 piece, not a
 *                      full-bleed vertical. Checked before spending, per the law.
 *   --camerafixed true the parameter beats any "the camera does not move" prompt suffix.
 *   generate_audio false — nothing speaks in this shot. This is the one place `false` is correct.
 *
 * KNOWN RISK, OPERATOR-ACCEPTED 2026-08-08
 *   The card renders a Rolex Yacht-Master II, prominently. A prominent rendered third-party mark
 *   is the measured trigger for OutputVideoSensitiveContentDetected.PolicyViolation — billed,
 *   output withheld. This shot is the cheap way to find out: $1.16, and the answer is reusable.
 */
import fs from "fs";
import path from "path";

const REPO = "/Users/Hassoonie/Desktop/CODE PROJECTS/NanoBanana-Client";
for (const line of fs.readFileSync(path.join(REPO, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.MODELARK_API_KEY;
const BASE = "https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks";
const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const OUT = path.join(REPO, ".claude/worktrees/gen-image/generations/muha-eurosummer");

const CARD = path.join(REPO,
  ".claude/worktrees/agent-a7044511e4cba5e6d/inputs/golden-hour-plates/card-clean.png");

const PROMPT =
  "Reproduce this card EXACTLY as it is. Do not redraw, restyle or re-letter anything on it — " +
  "every word, the script header, the watch and the gold QR panel stay pixel-identical. " +
  "The only motion: the warm light rakes slowly across the card's surface so the gold catches and " +
  "travels, the metal bracelet glints once, and a faint highlight drifts over the QR panel. " +
  "The card itself does not move, rotate or lift. Locked-off camera on a tripod, no push in, no " +
  "pan, no parallax. " +
  "--ratio adaptive --dur 5 --resolution 720p --camerafixed true --watermark false";

const body = () => {
  const b64 = fs.readFileSync(CARD).toString("base64");
  return {
    model: "dreamina-seedance-2-5-260628",
    generate_audio: false,
    content: [
      { type: "text", text: PROMPT },
      { type: "image_url", image_url: { url: `data:image/png;base64,${b64}` }, role: "first_frame" },
    ],
  };
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (!process.argv.includes("--go")) {
  const st = fs.statSync(CARD);
  console.log(`\nCARD  ${CARD}`);
  console.log(`      ${(st.size / 1e6).toFixed(2)} MB · 1500x1000 (3:2 LANDSCAPE — insert, not vertical)`);
  console.log(`\nPROMPT\n${PROMPT}\n`);
  console.log(`5s i2v, locked camera, no audio  =  $1.16`);
  console.log(`\nDRY RUN — nothing submitted. --go to spend.\n`);
  process.exit(0);
}

fs.mkdirSync(OUT, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const label = `gh-card-5s-${stamp}`;
const b = body();
fs.writeFileSync(path.join(OUT, `${label}.request.json`),
  JSON.stringify({ ...b, content: [b.content[0], { ...b.content[1], image_url: { url: "<base64 elided>" } }] }, null, 2));

const res = await fetch(BASE, { method: "POST", headers: H, body: JSON.stringify(b) });
const txt = await res.text();
console.log(`SUBMIT HTTP ${res.status} ${txt.trim().slice(0, 200)}`);
let id;
try { id = JSON.parse(txt).id; } catch { process.exit(1); }
if (!id) process.exit(1);

const t0 = Date.now();
while ((Date.now() - t0) / 1000 < 900) {
  const r = await fetch(`${BASE}/${id}`, { headers: H });
  const j = await r.json();
  if (["succeeded", "failed", "cancelled"].includes(j.status)) {
    console.log(`\nPOLL status=${j.status} after ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    fs.writeFileSync(path.join(OUT, `${label}.task.json`), JSON.stringify(j, null, 2));
    if (j.status !== "succeeded") { console.log(JSON.stringify(j.error, null, 2)); break; }
    console.log(`tokens=${j.usage?.completion_tokens} res=${j.resolution} ratio=${j.ratio} dur=${j.duration}`);
    const mp4 = await fetch(j.content.video_url);
    const buf = Buffer.from(await mp4.arrayBuffer());
    fs.writeFileSync(path.join(OUT, `${label}.mp4`), buf);
    console.log(`SAVED ${path.join(OUT, `${label}.mp4`)} (${(buf.length / 1e6).toFixed(1)} MB)`);
    break;
  }
  process.stdout.write(`[${((Date.now() - t0) / 1000).toFixed(0)}s ${j.status}] `);
  await sleep(10000);
}
