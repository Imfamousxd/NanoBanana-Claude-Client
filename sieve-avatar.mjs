#!/usr/bin/env node
// sieve-avatar.mjs — the identity system for reusable people.
//
//   node sieve-avatar.mjs list
//   node sieve-avatar.mjs analyze Marcus                    # VLM-tag each anchor (yaw/light/expr)
//   node sieve-avatar.mjs resolve Marcus --yaw 3q-left --light window-left
//   node sieve-avatar.mjs check batches/x.batch.json        # HARD REFUSAL, exit 2
//   node sieve-avatar.mjs verify Marcus --candidates 'generations/<b>/<id>'   # likeness gate
//
// WHAT WAS BROKEN
// An avatar kit was a bag of files. Every kit has exactly two frontal portraits, and those same
// two got pasted into every job regardless of what the shot asked for — so a 3/4-profile shot was
// anchored to a straight-on face, which is precisely when likeness drifts. There was no metadata,
// so nothing could be *retrieved* for a shot; and no check, so a generated frame could never FAIL
// a likeness test. "Consistent character" was a hope, not a mechanism.
//
// WHAT THIS ADDS
//   1. `Avatars/<Name>/identity.json` — the machine twin of AVATAR.md. AVATAR.md stays the
//      human-authored source of truth for prose; this holds what code needs to act on.
//   2. Anchor METADATA (yaw / light / expression) so the right reference is chosen per shot.
//      `analyze` fills it in by actually looking at the images rather than trusting filenames.
//   3. A casting gate. An avatar whose face the founder has not approved is `status:"casting"`
//      and is REFUSED for production. Dialed_Ava's own AVATAR.md says "before any paid use" —
//      this enforces that sentence instead of restating it.
//   4. A likeness gate. `verify` asks a vision model, per candidate, whether it is the same
//      person as the canonical. Something can finally fail.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(ROOT, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const API_KEY = process.env.GEMINI_API_KEY;
const VLM = "gemini-2.5-flash";
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${VLM}:generateContent`;
const AV = path.join(ROOT, "Avatars");

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const has = (n) => process.argv.includes(`--${n}`);

// Controlled vocabularies. Free-text metadata cannot be matched on, so these are closed sets.
const YAW = ["frontal", "3q-left", "3q-right", "profile-left", "profile-right"];
const LIGHT = ["window-left", "window-right", "overhead", "flat-even", "low-key", "outdoor-sun"];
const EXPR = ["neutral", "smile", "talking", "laughing", "serious"];

function kits() {
  if (!fs.existsSync(AV)) return [];
  return fs.readdirSync(AV)
    .filter((d) => !d.startsWith("_") && !d.startsWith("."))
    .filter((d) => fs.statSync(path.join(AV, d)).isDirectory())
    .map((name) => {
      const f = path.join(AV, name, "identity.json");
      if (!fs.existsSync(f)) return { name, __missing: true };
      try { return { ...JSON.parse(fs.readFileSync(f, "utf-8")), name, __file: f }; }
      catch (e) { return { name, __broken: e.message }; }
    });
}

function findKit(name) {
  const all = kits();
  const hit = all.find((k) => k.name.toLowerCase() === String(name || "").toLowerCase());
  if (!hit) { console.error(`No avatar "${name}". Known: ${all.map((k) => k.name).join(", ")}`); process.exit(2); }
  if (hit.__missing) { console.error(`${hit.name} has no identity.json — run: node sieve-avatar.mjs analyze ${hit.name}`); process.exit(2); }
  if (hit.__broken) { console.error(`${hit.name}/identity.json is malformed: ${hit.__broken}`); process.exit(2); }
  return hit;
}

const inline = (p) => {
  const ext = path.extname(p).toLowerCase();
  const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  return { inline_data: { mime_type: mime, data: fs.readFileSync(p).toString("base64") } };
};

async function vlm(parts, attempt = 1) {
  const body = {
    contents: [{ parts }],
    generationConfig: { responseMimeType: "application/json", temperature: 0, mediaResolution: "MEDIA_RESOLUTION_HIGH" },
  };
  let res;
  try {
    res = await fetch(URL, { method: "POST", headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch (e) {
    if (attempt < 3) { await new Promise((r) => setTimeout(r, 2000 * attempt)); return vlm(parts, attempt + 1); }
    return { __error: e.message };
  }
  if (!res.ok) {
    const t = await res.text();
    if ((res.status === 429 || res.status >= 500) && attempt < 4) { await new Promise((r) => setTimeout(r, 5000 * attempt)); return vlm(parts, attempt + 1); }
    return { __error: `HTTP ${res.status}: ${t.slice(0, 140)}` };
  }
  const d = await res.json();
  try { return JSON.parse(d?.candidates?.[0]?.content?.parts?.[0]?.text || ""); }
  catch { return { __error: "unparseable VLM response" }; }
}

// ─── image generation (Nano Banana Pro) ───────────────────────────────────────
const NB = "gemini-3-pro-image-preview";
async function genImage(prompt, refs = [], { ar = "9:16", size = "2K" } = {}) {
  const parts = [...refs.map(inline), { text: prompt }];
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${NB}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: ar, imageSize: size } } }),
  });
  if (!res.ok) return { __error: `HTTP ${res.status}: ${(await res.text()).slice(0, 160)}` };
  const d = await res.json();
  for (const p of d?.candidates?.[0]?.content?.parts || []) {
    if (p.inlineData) return { buf: Buffer.from(p.inlineData.data, "base64"), mime: p.inlineData.mimeType };
  }
  return { __error: "no image in response" };
}

// The coverage matrix a locked avatar must span. Discovered the hard way: Marcus had NINE
// anchors and all nine were frontal/window-left, so `resolve --yaw profile-left` handed back a
// frontal portrait and every off-angle shot drifted. Anchor DIVERSITY holds a face; anchor COUNT
// does not. `lock` generates this set rather than hoping someone shoots it later.
const COVERAGE = [
  { id: "anchor_3q-left",   yaw: "3q-left",  light: "window-left", expr: "neutral", dir: "turned about 30 degrees to their left, three-quarter view" },
  { id: "anchor_3q-right",  yaw: "3q-right", light: "window-left", expr: "neutral", dir: "turned about 30 degrees to their right, three-quarter view" },
  { id: "anchor_flat",      yaw: "frontal",  light: "flat-even",   expr: "smile",   dir: "facing the camera straight on, under soft even overcast light with no strong direction" },
  { id: "anchor_lowkey",    yaw: "frontal",  light: "low-key",     expr: "neutral", dir: "facing the camera straight on, lit low-key from one side with the other side falling into shadow" },
];

// Generate the coverage angles from a locked face, then verify each and discard drift.
// Shared by `lock` (new avatars) and `coverage` (fixing the existing roster).
async function buildCoverage(kitName, canon, descriptor) {
  console.log(`\n  Building anchor coverage (${COVERAGE.length} angles) from ${path.basename(canon)}:`);
  const built = [];
  for (const c of COVERAGE) {
    const dst = path.join(AV, kitName, "identity", `${c.id}.png`);
    if (fs.existsSync(dst)) { console.log(`    ${c.id}  (exists, skipped)`); continue; }
    const p = `Use ONLY the likeness of the person in reference image 1 — the same individual, same
face, same bone structure, same hair, same age. Do not restyle or beautify them.

Re-photograph that same person ${c.dir}. ${descriptor || ""}

Chest-up, plain uncluttered background, real skin texture with visible pores and natural
imperfection, shot on a phone camera, photorealistic, no retouching. No text in the frame.`;
    const r = await genImage(p, [canon], { ar: "3:4", size: "2K" });
    if (r.__error) { console.log(`    ${c.id}: ${r.__error}`); continue; }
    fs.writeFileSync(dst, r.buf); built.push({ ...c, file: dst });
    console.log(`    ${c.id}  (${c.yaw} · ${c.light})`);
  }

  // Verify anchors, but note the prior here is the OPPOSITE of the `verify` gate, deliberately.
  //
  // `verify` judges OUTPUT frames and defaults to IMPOSTER, because a false match ships the wrong
  // face. Here we are judging anchors we asked to be re-shot at a DIFFERENT ANGLE, and a changed
  // angle legitimately changes the apparent nose bridge, jaw line and eye spacing through simple
  // projection. Carrying the default-deny prior over rejected 3 of 4 correct anchors on the first
  // run — including one whose own stated reason was "no discernible differences in bone structure".
  // So: discard only on AFFIRMATIVE evidence of a different person. Absence of proof is a keep.
  if (built.length) console.log(`\n  Verifying each generated anchor (discard needs a named difference):`);
  let kept = 0;
  for (const b of built) {
    const out = await vlm([
      { text: "REFERENCE — the real person:" }, inline(canon),
      { text: "CANDIDATE — the SAME person deliberately re-photographed at a different head angle and/or lighting:" }, inline(b.file),
      { text: `These are INTENDED to be the same person. Your job is to catch the case where the
generator substituted a different individual.

The head angle and the lighting differ ON PURPOSE. A changed angle necessarily changes the
APPARENT width of the nose bridge, the apparent eye spacing, and the apparent jaw line through
projection alone — those are not evidence of a different person and must not be cited as such.

Report a difference ONLY if it survives the angle change: a different face SHAPE, a clearly
different hairline, different ear geometry, a mole or scar that appears or vanishes, an obviously
different age or build.

If you cannot name a specific difference that survives the angle change, they are the same person.
Return ONLY JSON:
{"structural_differences":["<only differences that survive the angle change; empty if none>"],
 "same_person":true|false,
 "drift":"<short note, or empty>"}` },
    ]);
    // Keep unless the model both says no AND can name what actually differs.
    const named = Array.isArray(out.structural_differences) ? out.structural_differences.filter((s) => String(s).trim()) : [];
    const reject = out.same_person === false && named.length > 0;
    if (out.__error) { fs.unlinkSync(b.file); console.log(`    DISCARD ${b.id} — verify failed: ${out.__error}`); continue; }
    if (!reject) { console.log(`    KEEP    ${b.id}${named.length ? `  (noted: ${named[0]})` : ""}`); kept++; }
    else { fs.unlinkSync(b.file); console.log(`    DISCARD ${b.id} — ${named.join("; ").slice(0, 100)}`); }
  }
  return { generated: built.length, kept };
}

function scaffold(name, brief, voice) {
  return `# Avatar: ${name}

Created ${new Date().toISOString().slice(0, 10)} by \`sieve-avatar.mjs\`. **FACE NOT YET APPROVED —
founder picks from candidates before any paid use.** Status stays \`casting\` (and every job using
this avatar is refused) until \`sieve-avatar.mjs lock ${name} --pick <token>\` is run.

## Identity (use this EXACT descriptor in every prompt)
${brief}

## Voice (Seedance descriptor — keep verbatim once locked)
${voice || "TODO — write the voice descriptor before the first talking clip."}

## How to use (the engine workflow)
1. FIRST FRAME — Nano Banana Pro. Get anchors with:
   \`node sieve-avatar.mjs resolve ${name} --yaw <frontal|3q-left|3q-right> --light <...>\`
   Prompt: "Use ONLY the likeness of the person in reference image 1" + the descriptor above.
2. TALKING VIDEO — \`bytedance/seedance-1.5-pro\`, image = the approved first frame,
   \`generate_audio: true\`, duration <= 12, 9:16. Dialogue in quotes, acronyms spelled
   phonetically, PERIODS not em-dashes (dashes render as a vocal tick).
   seedance-2.0 categorically refuses human frames — do not try it.
3. VERIFY — \`node sieve-avatar.mjs verify ${name} --candidates '<dir>'\` before animating.
4. AFTER AN APPROVED TAKE — save first + last frames into \`takes/\`, then re-run
   \`node sieve-avatar.mjs analyze ${name}\` so they become retrievable anchors.
5. NEVER regenerate the face from text alone — always pass anchors (CLAUDE.md golden rule 4).
`;
}

const cmd = process.argv[2];

// ─── new: invent an avatar and generate candidate faces ───────────────────────
if (cmd === "new") {
  const name = process.argv[3];
  const brief = arg("brief");
  const voice = arg("voice", "");
  const n = parseInt(arg("n", "3"), 10);
  if (!name || !brief) {
    console.error(`usage: sieve-avatar.mjs new <Name> --brief "<who they are>" [--voice "..."] [--n 3]`);
    console.error(`example: sieve-avatar.mjs new Dana --brief "Woman, 34, Midwest, red hair, freckles, plain tee" --n 3`);
    process.exit(2);
  }
  const dir = path.join(AV, name);
  if (fs.existsSync(dir)) { console.error(`Avatars/${name} already exists — pick another name or delete it first.`); process.exit(2); }
  fs.mkdirSync(path.join(dir, "_candidates"), { recursive: true });
  fs.mkdirSync(path.join(dir, "identity"), { recursive: true });
  fs.mkdirSync(path.join(dir, "takes"), { recursive: true });

  console.log(`\nCasting ${name} — ${n} candidate face(s)\n  brief: ${brief}\n`);
  const made = [];
  for (let i = 1; i <= n; i++) {
    // Deliberately VARIED, not re-rolled: each candidate is a different person fitting the brief,
    // which is what a casting call is. Re-rolling one prompt returns the model's average face.
    const p = `A candid, natural photograph of a real person: ${brief}

Chest-up, facing the camera, relaxed neutral expression, soft daylight from the left, plain
uncluttered background. Real skin with visible pores, fine lines and slight unevenness; one
small natural imperfection. Shot on a phone camera — unglamorous, not a studio portrait, no
retouching, no makeup polish. Photorealistic. No text anywhere in the frame.

This is casting option ${i} of ${n}: a DIFFERENT individual from the other options while still
fitting the brief — vary the face shape, the exact hair, and the build.`;
    const r = await genImage(p, [], { ar: "3:4", size: "2K" });
    if (r.__error) { console.log(`  c${i}: ${r.__error}`); continue; }
    const f = path.join(dir, "_candidates", `${name.toLowerCase()}_c${i}.png`);
    fs.writeFileSync(f, r.buf); made.push(f);
    console.log(`  c${i} -> ${path.relative(ROOT, f)}`);
  }
  if (!made.length) { console.error("No candidates generated."); process.exit(2); }

  fs.writeFileSync(path.join(dir, "AVATAR.md"), scaffold(name, brief, voice));
  fs.writeFileSync(path.join(dir, "identity.json"), JSON.stringify({
    name, status: "casting", canonical: null, descriptor: brief, voice: voice || null,
    identityProvider: "refs", anchors: [], approvedTakes: [], notes: [`Cast ${new Date().toISOString().slice(0, 10)} via sieve-avatar new`],
    source: `Avatars/${name}/AVATAR.md`,
  }, null, 2) + "\n");

  console.log(`\nWrote Avatars/${name}/ (AVATAR.md, identity.json, _candidates/)`);
  console.log(`Contact sheet:\n  python3 sieve-sheet.py sieve/sheets/${name}.jpg --title "${name} casting" --group "${name}" ${made.map((f) => `"${path.relative(ROOT, f)}"`).join(" ")}`);
  console.log(`Then lock your pick:\n  node sieve-avatar.mjs lock ${name} --pick ${name.toLowerCase()}_c1\n`);
  process.exit(0);
}

// ─── import: build a kit from photos you already have ────────────────────────
if (cmd === "import") {
  const name = process.argv[3];
  const brief = arg("brief", "");
  const i = process.argv.indexOf("--from");
  const srcs = i > -1 ? process.argv.slice(i + 1).filter((a) => !a.startsWith("--")) : [];
  if (!name || !srcs.length) {
    console.error(`usage: sieve-avatar.mjs import <Name> --brief "<descriptor>" --from <img> [img...]`);
    console.error(`Use for a look you already have: your own photos, a shot you liked, approved frames.`);
    process.exit(2);
  }
  const dir = path.join(AV, name);
  fs.mkdirSync(path.join(dir, "_candidates"), { recursive: true });
  fs.mkdirSync(path.join(dir, "identity"), { recursive: true });
  fs.mkdirSync(path.join(dir, "takes"), { recursive: true });

  const copied = [];
  for (const [j, s] of srcs.entries()) {
    const abs = path.isAbsolute(s) ? s : path.join(ROOT, s);
    if (!fs.existsSync(abs)) { console.log(`  ! missing, skipped: ${s}`); continue; }
    const dst = path.join(dir, "_candidates", `${name.toLowerCase()}_import${j + 1}${path.extname(abs).toLowerCase()}`);
    fs.copyFileSync(abs, dst); copied.push(dst);
    console.log(`  imported ${path.relative(ROOT, dst)}`);
  }
  if (!copied.length) { console.error("Nothing imported."); process.exit(2); }

  if (!fs.existsSync(path.join(dir, "AVATAR.md")))
    fs.writeFileSync(path.join(dir, "AVATAR.md"), scaffold(name, brief || "TODO — describe this person in one paragraph.", ""));
  const idf = path.join(dir, "identity.json");
  const cur = fs.existsSync(idf) ? JSON.parse(fs.readFileSync(idf, "utf-8")) : {};
  fs.writeFileSync(idf, JSON.stringify({
    name, status: "casting", canonical: null, descriptor: brief || cur.descriptor || "", voice: cur.voice || null,
    identityProvider: "refs", anchors: [], approvedTakes: [],
    notes: [`Imported ${copied.length} photo(s) ${new Date().toISOString().slice(0, 10)}`], source: `Avatars/${name}/AVATAR.md`,
  }, null, 2) + "\n");

  console.log(`\nImported as CASTING — nothing uses it until you lock a pick:`);
  console.log(`  node sieve-avatar.mjs lock ${name} --pick ${path.basename(copied[0], path.extname(copied[0]))}\n`);
  process.exit(0);
}

// ─── lock: the Soul-ID equivalent — promote a pick and BUILD the anchor set ───
if (cmd === "lock") {
  const k = findKit(process.argv[3]);
  const pick = arg("pick");
  if (!pick) { console.error(`usage: sieve-avatar.mjs lock <Name> --pick <candidate-token>`); process.exit(2); }
  const cdir = path.join(AV, k.name, "_candidates");
  const hit = fs.existsSync(cdir) && fs.readdirSync(cdir).find((f) => path.basename(f, path.extname(f)) === pick);
  if (!hit) {
    console.error(`No candidate "${pick}" in Avatars/${k.name}/_candidates/`);
    if (fs.existsSync(cdir)) console.error(`Available: ${fs.readdirSync(cdir).map((f) => path.basename(f, path.extname(f))).join(", ")}`);
    process.exit(2);
  }
  const src = path.join(cdir, hit);
  const ext = path.extname(hit).toLowerCase();
  const canonRel = `identity/portrait_neutral${ext}`;
  const canon = path.join(AV, k.name, canonRel);
  fs.mkdirSync(path.dirname(canon), { recursive: true });
  fs.copyFileSync(src, canon);
  console.log(`\nLocking ${k.name} to ${pick}\n  canonical -> ${path.relative(ROOT, canon)}`);

  // Generate the missing coverage FROM the picked face. This is the whole point: a locked
  // avatar leaves this command spanning several yaws and lighting setups, instead of two
  // frontals that every future shot gets anchored to regardless of what it needs.
  const { kept } = await buildCoverage(k.name, canon, k.descriptor);

  const idf = path.join(AV, k.name, "identity.json");
  const cur = JSON.parse(fs.readFileSync(idf, "utf-8"));
  fs.writeFileSync(idf, JSON.stringify({ ...cur, status: "locked", canonical: canonRel,
    lockedAt: new Date().toISOString().slice(0, 10), lockedFrom: pick }, null, 2) + "\n");

  console.log(`\n${k.name} is LOCKED — canonical + ${kept} verified anchor(s).`);
  console.log(`Tag them:  node sieve-avatar.mjs analyze ${k.name}`);
  if (kept < COVERAGE.length) console.log(`Note: ${COVERAGE.length - kept} anchor(s) drifted and were discarded — re-run lock to retry those angles.`);
  console.log();
  process.exit(0);
}

// ─── voice: cast, harvest and clone the avatar's permanent voiceprint ────────
// WHY IT WORKS THIS WAY (E12, verified 2026-07-28)
// Seedance generates voice and face JOINTLY. That is why its lip-sync is loose — the mouth is a
// byproduct of sampling — but it is also why the voice it invents SUITS the person on screen: it
// derived one from the other. A generic TTS voice_id has never seen the face and cannot match it
// (measured similarity to the character: "none"). A voice cloned from the avatar's own Seedance
// audio measured "strong" — "captures the timbre, vocal weight, resonance and accent very well,
// sounding like the same person" — AND kept the disfluency.
// So: let Seedance CAST the voice, then make that casting permanent. No real person's voice is
// involved; it is the avatar's own generated voice, made stable and controllable.
if (cmd === "voice") {
  const k = findKit(process.argv[3]);
  const takesDir = path.join(AV, k.name, "takes");
  const voiceDir = path.join(AV, k.name, "voice");
  fs.mkdirSync(voiceDir, { recursive: true });
  const print = path.join(voiceDir, "voiceprint.wav");

  if (fs.existsSync(print) && !has("force")) {
    console.log(`\n${k.name} already has voice/voiceprint.wav — pass --force to re-cast.\n`);
    process.exit(0);
  }
  if (k.status !== "locked") { console.error(`${k.name} is casting — lock a pick before casting a voice.`); process.exit(2); }

  const { execFileSync } = await import("child_process");

  // ── --from-source: a REAL recorded human voice. Strongly preferred. ────────
  // Cloning a Seedance-cast voice gives a voice that MATCHES THE FACE but is still synthetic —
  // a clone inherits whatever it clones. Five TTS engines were judged synthetic at high
  // confidence, so a real recording is the only thing that clears the bar.
  // See Avatars/_VOICE-RECORDING-SPEC.md for what to record and how.
  if (has("from-source")) {
    const src = path.join(AV, k.name, "voice", "source");
    if (!fs.existsSync(src)) {
      console.error(`No ${path.relative(ROOT, src)}/ — see Avatars/_VOICE-RECORDING-SPEC.md`);
      process.exit(2);
    }
    // pass1 (conversational body) + pass2 (range) make the voiceprint. pass3 (texture) is a
    // splice library, NOT clone material — cloning coughs teaches the model to cough.
    const wanted = ["pass1_body", "pass2_range"];
    const found = fs.readdirSync(src).filter((f) => /\.(wav|flac|m4a|mp3)$/i.test(f))
      .filter((f) => wanted.some((w) => f.toLowerCase().startsWith(w)));
    if (!found.length) {
      console.error(`No pass1_body/pass2_range files in ${path.relative(ROOT, src)}/`);
      console.error(`Found: ${fs.readdirSync(src).join(", ") || "(empty)"}`);
      process.exit(2);
    }
    const norm = [];
    for (const [i, f] of found.entries()) {
      const w = path.join(voiceDir, `_s${i}.wav`);
      execFileSync("ffmpeg", ["-y", "-v", "error", "-i", path.join(src, f), "-ac", "1", "-ar", "24000", w]);
      norm.push(w);
      console.log(`  + ${f}`);
    }
    const lst = path.join(voiceDir, "_l.txt");
    fs.writeFileSync(lst, norm.map((w) => `file '${path.basename(w)}'`).join("\n"));
    execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", print], { cwd: voiceDir });
    norm.forEach((w) => fs.unlinkSync(w)); fs.unlinkSync(lst);

    const d = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
      "-of", "default=nw=1:nk=1", print]).toString().trim());
    console.log(`\n  voiceprint: ${d.toFixed(1)}s of REAL recorded voice -> ${path.relative(ROOT, print)}`);
    if (d < 45) console.log(`  ! spec asks for ~135s (90s body + 45s range). Clones get more stable with more.`);

    const idf2 = path.join(AV, k.name, "identity.json");
    const cur2 = JSON.parse(fs.readFileSync(idf2, "utf-8"));
    fs.writeFileSync(idf2, JSON.stringify({
      ...cur2, voiceprint: "voice/voiceprint.wav", voiceEngine: "resemble-ai/chatterbox",
      voiceSource: "recorded-human",
      voiceNotes: "Cloned from a REAL recorded voice per Avatars/_VOICE-RECORDING-SPEC.md. This is the "
        + "only source that clears the human-believability bar — every synthetic source tested failed. "
        + "Texture samples (breaths/coughs/sniffles) live in voice/source/pass3_texture.wav and are "
        + "spliced in, never cloned.",
    }, null, 2) + "\n");
    console.log(`  identity.json updated (voiceSource: recorded-human).`);
    console.log(`\n  Speak:   node sieve-speak.mjs --avatar ${k.name} --text "..." --out line.wav`);
    console.log(`  Then:    python3 sieve-phonemic.py line.wav line_phone.wav --room <clip.mp4>\n`);
    process.exit(0);
  }

  // ── fallback: let Seedance cast a voice from the face ─────────────────────
  // Gives face/voice MATCH but not human believability. Use until real audio exists.
  console.log(`\n  NOTE: casting a synthetic voice from ${k.name}'s face. It will match the face but`);
  console.log(`  will still read as synthetic. For believable audio record a real voice and use`);
  console.log(`  --from-source (see Avatars/_VOICE-RECORDING-SPEC.md).`);
  let clips = fs.existsSync(takesDir) ? fs.readdirSync(takesDir).filter((f) => /\.mp4$/i.test(f)).map((f) => path.join(takesDir, f)) : [];

  if (!clips.length) {
    console.log(`\nNo take videos for ${k.name} — generating ONE casting clip so Seedance can cast the voice.`);
    const canon = path.join(AV, k.name, k.canonical);
    const job = {
      prompt: `${k.voice || ""} They talk straight to the phone camera, relaxed and natural. `
        + `They say: "Honestly I wasn't sure this was going to be for me at first, but I gave it a real shot and I'm glad I did." `
        + `Shot-on-phone look. Quiet room ambience, no music, no on-screen text.`,
      out: path.join(voiceDir, "casting_clip.mp4"),
      image: path.relative(ROOT, canon),
      duration: 10, aspect_ratio: "9:16", resolution: "1080p",
      generate_audio: true, camera_fixed: true,
    };
    const jf = path.join(voiceDir, "casting_job.json");
    fs.writeFileSync(jf, JSON.stringify(job, null, 2));
    execFileSync("node", [path.join(ROOT, "seedance-run.mjs"), jf], { stdio: "inherit", cwd: ROOT });
    clips = [job.out];
  }

  // Concatenate up to 3 clips' audio into a voiceprint. More source = a more stable clone.
  console.log(`\n  Harvesting from ${Math.min(clips.length, 3)} clip(s):`);
  const wavs = [];
  for (const [i, c] of clips.slice(0, 3).entries()) {
    const w = path.join(voiceDir, `_src${i}.wav`);
    execFileSync("ffmpeg", ["-y", "-v", "error", "-i", c, "-vn", "-ac", "1", "-ar", "24000", w]);
    wavs.push(w); console.log(`    ${path.basename(c)}`);
  }
  const list = path.join(voiceDir, "_list.txt");
  fs.writeFileSync(list, wavs.map((w) => `file '${path.basename(w)}'`).join("\n"));
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", print], { cwd: voiceDir });
  for (const w of wavs) fs.unlinkSync(w);
  fs.unlinkSync(list);

  const dur = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
    "-of", "default=nw=1:nk=1", print]).toString().trim());
  console.log(`  voiceprint: ${dur.toFixed(1)}s -> ${path.relative(ROOT, print)}`);
  if (dur < 8) console.log(`  ! short — clones are more stable from 20s+. Add takes and re-run with --force.`);

  const idf = path.join(AV, k.name, "identity.json");
  const cur = JSON.parse(fs.readFileSync(idf, "utf-8"));
  fs.writeFileSync(idf, JSON.stringify({
    ...cur, voiceprint: "voice/voiceprint.wav", voiceEngine: "resemble-ai/chatterbox",
    voiceNotes: "Cast by Seedance from this avatar's face, then cloned. Use as chatterbox audio_prompt; "
      + "a generic voice_id does NOT match the face (measured similarity: none). See E12.",
  }, null, 2) + "\n");
  console.log(`  identity.json updated.\n\nUse it:  node sieve-speak.mjs --avatar ${k.name} --text "..." --out line.wav\n`);
  process.exit(0);
}

// ─── coverage: fix an ALREADY-locked avatar's anchor set ─────────────────────
if (cmd === "coverage") {
  const k = findKit(process.argv[3]);
  if (k.status !== "locked") { console.error(`${k.name} is casting — lock a pick first.`); process.exit(2); }
  const canon = path.join(AV, k.name, k.canonical || "identity/portrait_neutral.png");
  if (!fs.existsSync(canon)) { console.error(`Canonical missing: ${canon}`); process.exit(2); }
  console.log(`\nExtending ${k.name}'s anchor coverage from ${path.basename(canon)}`);
  const { generated, kept } = await buildCoverage(k.name, canon, k.descriptor);
  if (!generated) { console.log(`\nNothing to generate — all coverage angles already exist.\n`); process.exit(0); }
  console.log(`\n${kept}/${generated} new anchor(s) verified and kept.`);
  console.log(`Tag them:  node sieve-avatar.mjs analyze ${k.name}\n`);
  process.exit(0);
}

// ─── list ─────────────────────────────────────────────────────────────────────
if (cmd === "list" || !cmd) {
  const all = kits();
  console.log(`\n${all.length} avatar kit(s):\n`);
  for (const k of all) {
    if (k.__missing) { console.log(`  ?  ${k.name.padEnd(12)} no identity.json`); continue; }
    if (k.__broken) { console.log(`  !  ${k.name.padEnd(12)} malformed`); continue; }
    const anchors = k.anchors || [];
    const takes = anchors.filter((a) => a.role === "take").length;
    // Distinct (yaw, light) is the number that matters — 9 frontal/window-left anchors give
    // exactly as much pose coverage as 1, and that was the original defect.
    const spread = new Set(anchors.filter((a) => a.yaw && a.light).map((a) => `${a.yaw}|${a.light}`)).size;
    const mark = k.status === "locked" ? "L" : "C";
    console.log(`  ${mark}  ${k.name.padEnd(12)} status=${(k.status || "?").padEnd(8)} anchors=${String(anchors.length).padEnd(3)} coverage=${spread} distinct (yaw,light)  takes=${takes}`);
    if (k.status === "locked" && spread < 3) console.log(`     ^ thin coverage — run: node sieve-avatar.mjs coverage ${k.name}`);
    if (k.status !== "locked") console.log(`     ^ CASTING — refused for production use until the founder approves the face`);
  }
  console.log(`\n  L = locked (usable)   C = casting (refused; see AVATAR.md)\n`);
  process.exit(0);
}

// ─── analyze: fill anchor metadata by LOOKING, not by trusting filenames ──────
if (cmd === "analyze") {
  const k = findKit(process.argv[3]);
  const dir = path.join(AV, k.name, "identity");
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)) : [];
  const takesDir = path.join(AV, k.name, "takes");
  const takes = fs.existsSync(takesDir) ? fs.readdirSync(takesDir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)) : [];
  if (!files.length) { console.error(`${k.name} has no identity/ images`); process.exit(2); }

  console.log(`\nAnalyzing ${k.name}: ${files.length} identity + ${takes.length} take(s)\n`);
  const anchors = [];
  for (const [rel, sub] of [...files.map((f) => [f, "identity"]), ...takes.map((f) => [f, "takes"])]) {
    const abs = path.join(AV, k.name, sub, rel);
    const out = await vlm([
      inline(abs),
      { text: `Describe the head pose, lighting and expression of the person in this image.
Return ONLY JSON: {"yaw":"<one of ${YAW.join("|")}>","light":"<one of ${LIGHT.join("|")}>","expr":"<one of ${EXPR.join("|")}>","framing":"<headshot|chest-up|waist-up|full>","usable_as_identity_anchor":true|false,"note":"<one short clause; say if the face is obscured, tiny, or turned too far to read>"}
Pick the closest value from each list; never invent a new one.` },
    ]);
    if (out.__error) { console.log(`  ! ${rel}: ${out.__error}`); continue; }
    anchors.push({ file: `${sub}/${rel}`, yaw: out.yaw, light: out.light, expr: out.expr,
      framing: out.framing, role: sub === "identity" ? "canonical" : "take",
      usable: out.usable_as_identity_anchor !== false, note: out.note || "" });
    console.log(`  ${rel.padEnd(38)} ${out.yaw} · ${out.light} · ${out.expr} · ${out.framing}${out.usable_as_identity_anchor === false ? "  [NOT usable as anchor]" : ""}`);
  }

  const file = path.join(AV, k.name, "identity.json");
  const cur = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf-8")) : {};
  fs.writeFileSync(file, JSON.stringify({ ...cur, anchors, analyzedAt: new Date().toISOString().slice(0, 10) }, null, 2) + "\n");
  console.log(`\nWrote ${path.relative(ROOT, file)} — ${anchors.length} anchor(s) tagged.\n`);
  process.exit(0);
}

// ─── resolve: pick the nearest anchors for a shot ─────────────────────────────
if (cmd === "resolve") {
  const k = findKit(process.argv[3]);
  const wantYaw = arg("yaw"), wantLight = arg("light"), wantExpr = arg("expr");
  const n = parseInt(arg("n", "3"), 10);

  if (k.status !== "locked" && !has("allow-casting")) {
    console.error(`REFUSED: ${k.name} is status="${k.status}" (casting).`);
    console.error(`Its AVATAR.md says the founder must approve the face before use.`);
    console.error(`Approving locks every downstream artifact to that baseline — anchors, gate`);
    console.error(`thresholds, any future LoRA — so relocking later invalidates all of them.`);
    console.error(`Override for a throwaway test only: --allow-casting`);
    process.exit(2);
  }

  const pool = (k.anchors || []).filter((a) => a.usable !== false);
  if (!pool.length) { console.error(`${k.name} has no usable anchors — run: node sieve-avatar.mjs analyze ${k.name}`); process.exit(2); }

  // Cheap ordinal distance. Yaw dominates: anchoring a profile shot to a frontal portrait is
  // the single biggest cause of likeness drift, so it is weighted above light and expression.
  const yi = (v) => Math.max(0, YAW.indexOf(v));
  const score = (a) => (wantYaw ? Math.abs(yi(a.yaw) - yi(wantYaw)) * 3 : 0)
    + (wantLight && a.light !== wantLight ? 2 : 0)
    + (wantExpr && a.expr !== wantExpr ? 1 : 0)
    + (a.role === "canonical" ? -0.5 : 0);   // tie-break toward canonical portraits

  const picked = [...pool].sort((a, b) => score(a) - score(b)).slice(0, Math.min(n, 3));
  console.error(`${k.name} — ${picked.length} anchor(s) for yaw=${wantYaw || "any"} light=${wantLight || "any"} expr=${wantExpr || "any"}:`);
  for (const a of picked) console.error(`  ${a.file}  (${a.yaw} · ${a.light} · ${a.expr})`);
  console.error(`descriptor: ${k.descriptor || "(none)"}`);
  for (const p of picked) console.log(path.join("Avatars", k.name, p.file));
  process.exit(0);
}

// ─── check: hard refusal on batches ──────────────────────────────────────────
if (cmd === "check") {
  const file = process.argv[3];
  if (!file) { console.error("usage: sieve-avatar.mjs check <batch.json>"); process.exit(2); }
  const abs = path.isAbsolute(file) ? file : path.join(ROOT, file);
  if (!fs.existsSync(abs)) { console.error(`Batch not found: ${file}`); process.exit(2); }
  let jobs = JSON.parse(fs.readFileSync(abs, "utf-8"));
  if (!Array.isArray(jobs)) jobs = [jobs];

  const all = kits().filter((k) => !k.__missing && !k.__broken);
  const REF_KEYS = ["refImages", "refs", "reference_images", "image", "identity"];
  const violations = [];
  console.log(`\nsieve-avatar check — ${path.basename(file)} · ${jobs.length} job(s)\n`);

  jobs.forEach((job, i) => {
    const label = job._id || job.id || `job ${i + 1}`;
    const text = [job.prompt, job.avatar, job._id, job.id].filter(Boolean).join(" ").toLowerCase();
    const refs = REF_KEYS.flatMap((kk) => {
      const v = job[kk];
      return typeof v === "string" ? [v] : Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
    }).map((r) => r.replace(/\\/g, "/").toLowerCase());

    for (const k of all) {
      const named = job.avatar?.toLowerCase() === k.name.toLowerCase()
        || new RegExp(`(^|[^a-z0-9])${k.name.toLowerCase().replace(/_/g, "[ _]")}([^a-z0-9]|$)`, "i").test(text);
      if (!named) continue;

      if (k.status !== "locked") {
        violations.push(label);
        console.log(`  FAIL  ${label} uses ${k.name}, which is status="${k.status}" (face not approved)`);
        continue;
      }
      const anchored = refs.some((r) => r.includes(`avatars/${k.name.toLowerCase()}/`));
      if (anchored) console.log(`  OK    ${label} uses ${k.name} and attaches its anchors`);
      else {
        violations.push(label);
        console.log(`  FAIL  ${label} uses ${k.name} but attaches NO anchor from Avatars/${k.name}/`);
        console.log(`          resolve one: node sieve-avatar.mjs resolve ${k.name} --yaw frontal`);
      }
    }
  });

  if (!violations.length) { console.log(`\nAll avatar references resolve.\n`); process.exit(0); }
  console.error(`\nREFUSED — ${violations.length} job(s). Text-only prompts drift the likeness`);
  console.error(`(CLAUDE.md golden rule 4); an unapproved face contaminates every artifact locked after it.\n`);
  process.exit(2);
}

// ─── verify: the likeness gate ───────────────────────────────────────────────
if (cmd === "verify") {
  const k = findKit(process.argv[3]);
  const spec = arg("candidates");
  if (!spec) { console.error("usage: sieve-avatar.mjs verify <Name> --candidates <glob|dir>"); process.exit(2); }
  const sabs = path.isAbsolute(spec) ? spec : path.join(ROOT, spec);
  let files = [];
  if (fs.existsSync(sabs) && fs.statSync(sabs).isDirectory())
    files = fs.readdirSync(sabs).filter((f) => /\.(png|jpe?g|webp)$/i.test(f) && !/^HERO\./i.test(f)).sort().map((f) => path.join(sabs, f));
  else { try { files = [...fs.globSync(sabs)].filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort(); } catch { files = []; } }
  if (!files.length) { console.error(`No candidates matched: ${spec}`); process.exit(2); }

  const canon = path.join(AV, k.name, k.canonical || "identity/portrait_neutral.png");
  if (!fs.existsSync(canon)) { console.error(`Canonical missing: ${canon}`); process.exit(2); }

  console.log(`\nsieve-avatar verify — ${k.name} · ${files.length} candidate(s) vs ${path.basename(canon)}\n`);
  const results = [];
  for (const f of files) {
    const out = await vlm([
      { text: "REFERENCE — this is the real person:" }, inline(canon),
      { text: "CANDIDATE — judge this image:" }, inline(f),
      { text: `You are checking for an IMPOSTER. Assume by default these are TWO DIFFERENT PEOPLE
who merely look similar, and try to CONFIRM that. Only conclude they are the same individual if
you genuinely cannot find a structural difference.

This matters because the failure mode is specific and known: two people of the same age, sex,
build and colouring read as "the same type", and a casual comparison then calls them the same
person. They are not. Demographic and stylistic similarity is NOT identity.

Work through these BEFORE deciding, and fill in what you actually observe for each:
  1. nose — bridge width, tip shape, nostril shape
  2. eyes — spacing relative to eye width, lid shape, brow position
  3. jaw and chin — width, angle, chin shape
  4. ears — size, protrusion, lobe attachment (if visible)
  5. philtrum and mouth — width, lip fullness, resting shape
  6. permanent marks — moles, scars, asymmetries

Hair, beard, expression, wardrobe, lighting and camera angle can all legitimately change between
shots, so they cannot PROVE a match — but a difference in them is still evidence worth noting.
Bone structure is what decides it.

DEFAULT TO false. If the evidence is ambiguous, if the face is too small or turned too far to
read, or if you are relying mainly on general resemblance, answer false with confidence "low".
A wrongly-approved imposter ships an asset with the wrong person's face; a wrongly-rejected match
costs one re-roll. The errors are not symmetric — prefer rejecting.

Return ONLY JSON:
{"observations":{"nose":"<compare>","eyes":"<compare>","jaw_chin":"<compare>","ears":"<compare>","mouth":"<compare>","marks":"<compare>"},
 "structural_differences":["<each concrete difference found>"],
 "same_person":true|false,
 "confidence":"high"|"medium"|"low",
 "drift":"<what differs, or empty if none>"}` },
    ]);
    const ok = out.same_person === true;

    // SECOND, SEPARATE CHECK — descriptor conformance.
    // The identity check above judges BONE STRUCTURE and deliberately ignores build, hair and
    // wardrobe, because those change legitimately between shots. That leaves a real hole: the
    // model can return the correct FACE on a body it has quietly "improved". Measured 2026-07-28
    // (E5): asked for Renee, whose locked descriptor is "visibly plus-size ... full round face and
    // full figure", the generator returned her face on a slimmed body and the identity check
    // passed it at high confidence. A locked descriptor is part of who the avatar IS, so it gets
    // its own gate rather than being folded into the likeness question.
    let conf = null;
    if (k.descriptor) {
      conf = await vlm([
        inline(f),
        { text: `This image should depict a person matching this LOCKED description exactly:

"${k.descriptor}"

Check ONLY conformance to that description — body type and build, age, hair, skin tone, wardrobe,
and any specific trait it names. Ignore pose, expression, lighting and background.

Be specific about build: if the description says plus-size, full-figured, heavy-set, slim, athletic
or similar, verify the body in the image actually matches. Generators routinely slim, youthen or
otherwise "improve" people away from the brief, and that silently destroys a locked character.

Return ONLY JSON: {"conforms":true|false,"violations":["<each trait that does not match>"]}` },
      ]);
    }
    const violations = Array.isArray(conf?.violations) ? conf.violations.filter((v) => String(v).trim()) : [];
    const conforms = !conf || conf.conforms !== false;

    results.push({ file: f, ...out, descriptor_conforms: conforms, descriptor_violations: violations });
    console.log(`  ${ok ? "MATCH " : "IMPOSTER"} ${path.basename(f)}${out.confidence ? `  (${out.confidence})` : ""}`
      + (conf ? `  · descriptor: ${conforms ? "OK" : "VIOLATED"}` : ""));
    if (!conforms) console.log(`           descriptor drift: ${violations.join("; ").slice(0, 170)}`);
    if (out.drift) console.log(`           drift: ${String(out.drift).slice(0, 150)}`);
    if (out.__error) console.log(`           error: ${out.__error}`);
  }

  // A frame only ships if it is BOTH the right person AND still matches the locked descriptor.
  const matched = results.filter((r) => r.same_person === true && r.descriptor_conforms !== false);
  const faceOnly = results.filter((r) => r.same_person === true && r.descriptor_conforms === false);
  if (faceOnly.length) console.log(`\n  ${faceOnly.length} candidate(s) had the right FACE but violated the locked descriptor — rejected.`);
  const outDir = path.join(ROOT, "sieve/reports"); fs.mkdirSync(outDir, { recursive: true });
  const rf = path.join(outDir, `identity_${k.name}_${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.jsonl`);
  fs.writeFileSync(rf, results.map((r) => JSON.stringify(r)).join("\n"));
  console.log(`\nMATCH ${matched.length} / ${results.length}   report: ${path.relative(ROOT, rf)}`);
  if (!matched.length) { console.error(`\nNo candidate is the same person. Re-anchor with a closer yaw and regenerate.\n`); process.exit(2); }
  console.log();
  process.exit(0);
}

console.error(`unknown command "${cmd}"

CREATE
  new <Name> --brief "<who they are>" [--voice "..."] [--n 3]   invent an avatar, cast N faces
  import <Name> --brief "..." --from <img> [img...]              build a kit from photos you have
  lock <Name> --pick <token>                                     approve a face + build its anchor set
  coverage <Name>                                                extend a locked avatar's anchor set

USE
  list                                                           roster + status + anchor coverage
  analyze <Name>                                                 tag anchors by looking at them
  resolve <Name> [--yaw --light --expr] [--n 3]                  nearest anchors for a shot
  check <batch.json>                                             refuse unanchored / casting jobs
  verify <Name> --candidates <glob|dir>                          likeness gate (defaults to IMPOSTER)`);
process.exit(2);
