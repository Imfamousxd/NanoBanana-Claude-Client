#!/usr/bin/env node
/**
 * video-engine.mjs — brief in, routed/validated/gated generation out. ONE entry point.
 *
 *   node video-engine.mjs --brief briefs/<x>.video.json                  # DRY RUN (default)
 *   node video-engine.mjs --brief <x> --proof                            # 5s proof beat
 *   node video-engine.mjs --brief <x> --go --claims-initialed "<name>"   # the paid run
 *        [--skip-proof "<reason>"]
 *
 * WHAT THIS REPLACES: one hand-written .mjs per job, each re-deriving the same rules and each
 * able to silently forget one. This engine reads the SAME sources every time:
 *   sieve/brands/<B>/campaigns/*.json   what may be CLAIMED (verbatim, or it's a slot)
 *   sieve/products/<B>/*.json           what the product IS (locked labels, geometry)
 *   graph-fragments/house_laws.json     how OUR approved work behaves (bands enforced here)
 *   graph-fragments/seedance25_laws.json  what the model accepts/refuses
 *
 * ROUTING (measured, 2026-08-08/09):
 *   person talking  -> dreamina-seedance-2-5-260628   only photoreal-speech lane; 720p; $0.233/s
 *   product/no-human-> dreamina-seedance-2-0-260128   up to 4K; $0.152/s@720p; 0 fails in 32
 *   artwork (i2v)   -> 2.5 + first_frame + --ratio adaptive + camerafixed; third-party marks
 *                      on the asset are a measured copyright refusal (the Rolex card face)
 *   draft product   -> dreamina-seedance-2-0-mini-260615 (rate UNPROBED — engine says so)
 *
 * REFUSALS THIS ENGINE ENFORCES BEFORE MONEY MOVES (each one already cost a real dollar):
 *   - ref image containing a person (privacy guard, ANY role)     -> exit 2
 *   - campaign claim not SOURCED in the registry                  -> exit 2
 *   - --go with claims and no --claims-initialed                  -> exit 2
 *   - proof required (hands manipulate props) and none on disk    -> exit 2 unless --skip-proof
 *   - w/s outside the lane band, duration off the house ladder    -> exit 2 (fix the script)
 *   - 2.5 with resolution != 720p, or explicit ratio + first_frame-> corrected loudly, not sent
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync, spawnSync } from "child_process";
import { recordGeneration, updateGates } from "./engine-ledger.mjs";
import { repoRoot } from "./lib-repo-root.mjs";

const ENGINE_VERSION = "video-engine 2026-08-09";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = repoRoot();
for (const line of fs.readFileSync(path.join(REPO, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.MODELARK_API_KEY;
const BASE = "https://ark.ap-southeast.bytepluses.com/api/v3/contents/generations/tasks";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const flag = (k) => process.argv.includes(`--${k}`);
// Assets may live in the worktree (generations/, inputs/) or the main repo (Brand Context/).
// Resolve relative paths worktree-first, then REPO — one resolver so no call site drifts.
const resolveAsset = (p) => path.isAbsolute(p) ? p
  : fs.existsSync(path.join(__dirname, p)) ? path.join(__dirname, p) : path.join(REPO, p);

const MODELS = {
  "person": { id: "dreamina-seedance-2-5-260628", resolution: "720p", perSec: 0.2325,
              why: "only photoreal-speech lane; 720p hard ceiling" },
  "product": { id: "dreamina-seedance-2-0-260128", resolution: null, perSec720: 0.1519, perSec1080: 0.3758,
               why: "no human -> 4K-capable, ~35% cheaper, 0 failures in 32 tasks" },
  "product-draft": { id: "dreamina-seedance-2-0-mini-260615", resolution: null, perSec720: null,
                     why: "cheap draft tier — RATE UNPROBED, first run is a measurement" },
  // id verified against the live arkcli catalog 2026-08-09 — a first draft GUESSED -260628 and
  // the real suffix is -260128. Never guess slugs; a wrong one is a bare InvalidParameter.
  "product-fast": { id: "dreamina-seedance-2-0-fast-260128", resolution: null, perSec720: null,
                    why: "speed tier, 'inherits core advantages of 2.0' — RATE+QUALITY UNPROBED" },
  "artwork": { id: "dreamina-seedance-2-5-260628", resolution: "720p", perSec: 0.2325,
               why: "animate approved art i2v, locked camera; mark on the art is pixel-exact" },
  // Soul casting lane: a NAMED avatar's canonical (born on Higgsfield Soul) animated as the
  // first frame. 1.5-pro is the ONLY model that accepts a human first frame — 2.5 and 2.0 both
  // refuse it (measured 2026-08-09). Rates from the live billing table applied to the measured
  // 5s/1080p token count (~49005 tok/s): silent 0.0012/K -> ~$0.059/s, audio 0.0024/K -> ~$0.118/s.
  "person-avatar": { id: "seedance-1-5-pro-251215", resolution: null, perSecSilent: 0.059, perSecAudio: 0.118,
                     why: "same-face-across-pieces: Soul canonical as first frame; only lane that accepts a human frame" },
};
const HOUSE = {
  ladder: [5, 10, 30],
  ugc: { wps: [2.18, 3.1], ratio: "9:16", shots: "one unbroken take" },
  campaign: { wps: [2.8, 3.3], ratio: "9:16 or 4:5", shots: "cuts every ~4.3s" },
};

// ---------------------------------------------------------------- load + validate
const briefPath = arg("brief");
if (!briefPath) { console.error("usage: video-engine.mjs --brief briefs/<x>.video.json [--proof|--go]"); process.exit(1); }
const B = JSON.parse(fs.readFileSync(briefPath, "utf-8"));
const errs = [], warns = [], notes = [];

// -- claims layer
let campaign = null;
if (B.campaign && B.campaign !== "none") {
  const cp = path.join(__dirname, "sieve", "brands", B.brand, "campaigns", `${B.campaign}.json`);
  if (!fs.existsSync(cp)) errs.push(`campaign '${B.campaign}' not in registry (${path.relative(__dirname, cp)}) — resolve the campaign BEFORE the script (intake Q2)`);
  else campaign = JSON.parse(fs.readFileSync(cp, "utf-8"));
}
const claimValues = [];
for (const c of B.claims_used || []) {
  const f = campaign?.[c];
  const status = f?.status || "MISSING";
  if (!String(status).startsWith("SOURCED")) errs.push(`claim '${c}' is ${status} in the registry — it may not be spoken; make it a {{SLOT}} or get it sourced`);
  else { claimValues.push([c, f.value, status]); }
}
if ((B.claims_used || []).length && !B.claims_signoff) warns.push("claims_signoff empty — --go will require --claims-initialed <name>");

// -- refs layer
for (const r of B.refs?.images || []) {
  const p = resolveAsset(r.path);
  if (!fs.existsSync(p)) errs.push(`ref image missing on disk: ${r.path}`);
  if (r.contains_person) errs.push(`ref '${path.basename(r.path)}' contains a person — REFUSED at submit in any image role (privacy guard). Generate people from text.`);
  if (r.third_party_marks) warns.push(`ref '${path.basename(r.path)}' carries third-party marks (${r.third_party_marks}) — measured copyright-refusal risk if prominent`);
}

// -- script layer
const beats = B.script?.beats || [];
const spoken = beats.map((b) => b.line || "").filter(Boolean).join(" ");
const words = spoken.trim().split(/\s+/).filter(Boolean).length;
const wps = words / B.duration;
const lane = B.lane || "ugc";
const band = HOUSE[lane]?.wps;
if (!HOUSE.ladder.includes(B.duration) && !B.off_ladder_reason)
  errs.push(`duration ${B.duration}s is off the house ladder ${HOUSE.ladder.join("/")} — nothing off-ladder has ever shipped; add off_ladder_reason to override deliberately`);
if (band && spoken && (wps < band[0] - 0.15 || wps > band[1] + 0.1))
  errs.push(`script is ${words} words = ${wps.toFixed(2)} w/s; house ${lane} band is ${band[0]}-${band[1]} — rewrite the words, don't stretch the take`);
for (const tk of B.required_tokens || [])
  if (!spoken.toLowerCase().includes(tk.toLowerCase()))
    errs.push(`required token "${tk}" is not in the script`);
if (B.script?.profanity) notes.push("profanity: measured-safe on 2.5 (proof roll 2026-08-09)");

// -- prompt-craft lint + DETAIL SCORE (documented 2.5 rules, craft/PROMPT-2.5.md) — warns/notes,
// never blockers. "Detail = specifics, not adjectives." The score makes "as detailed as possible"
// a number you see before you spend, with the exact gaps named.
const prose = [B.scene?.look, B.scene?.camera, B.scene?.voice,
  ...beats.map((b) => `${b.action || ""} ${b.line || ""}`)].filter(Boolean).join("  ");
const KILLERS = [/\bfast\b/i, /\bcinematic\b/i, /\bamazing\b/i, /\bepic\b/i, /\bbeautiful\b/i, /lots of movement/i];
const killerHits = [...new Set(KILLERS.map((rx) => (prose.match(rx) || [])[0]).filter(Boolean).map((h) => h.toLowerCase()))];
if (killerHits.length) warns.push(`prompt-craft: killer word(s) "${killerHits.join('", "')}" — replace with a specific light / named camera move / concrete action (craft/PROMPT-2.5.md)`);
const CAMERA_OK = /push[- ]?in|pull[- ]?out|dolly|\bpan\b|track|orbit|\barc\b|aerial|drone|handheld|locked[- ]?off|\bfixed\b|\brise\b|\btilt\b|bob|drift|sway|selfie|push in/i;
const LIGHT_OK = /light|sun|golden|window|daylight|neon|\brim\b|backlit|shadow|overcast|lamp|glow|\bdim\b|dusk|dawn|afternoon|morning|fluorescent|candle|moon/i;
const anchorCount = (B.subject?.casting || "").split(/,|\band\b/).map((s) => s.trim()).filter((s) => s.length > 2).length;
// Subject detail is judged differently by type: a PERSON needs ≥4 casting anchors; a PRODUCT/
// artwork has no casting, so it's judged on a concrete reference description instead.
const subjectDetailed = B.subject?.type === "person"
  ? [`subject anchors ≥4 (age/wardrobe/color/expression)`, anchorCount >= 4]
  : [`subject described concretely (a reference describe ≥60 chars)`, (B.refs?.images || []).some((r) => (r.describe || "").length >= 60)];
const checks = [
  subjectDetailed,
  ["one named camera move", Boolean(B.scene?.camera && CAMERA_OK.test(B.scene.camera))],
  ["a specific lighting line", LIGHT_OK.test(B.scene?.look || "")],
  ["no killer words", killerHits.length === 0],
  ["every reference named + described", (B.refs?.images || []).every((r) => (r.name || r.role) && r.describe)],
  ["an action in every beat", beats.length > 0 && beats.every((b) => b.action || b.line)],
];
const passed = checks.filter((c) => c[1]).length;
const missing = checks.filter((c) => !c[1]).map((c) => c[0]);
notes.push(`prompt-craft detail: ${passed}/${checks.length}` + (missing.length ? ` — missing: ${missing.join("; ")}` : " ✓ (maximally specified)"));

// -- routing
const isPerson = B.subject?.type === "person";
const isAvatar = isPerson && Boolean(B.subject?.avatar);   // named avatar -> Soul casting lane
const route = MODELS[isAvatar ? "person-avatar"
  : B.subject?.type === "person" ? "person"
  : B.subject?.type === "artwork" ? "artwork"
  : flag("fast") || B.fast ? "product-fast"
  : flag("draft") || B.draft ? "product-draft" : "product"];
if (!route) errs.push(`subject.type '${B.subject?.type}' unknown — person | product | artwork`);

// -- avatar (Soul lane): resolve the canonical first frame + enforce the casting gate
let avatarFrame = null;
if (isAvatar) {
  const adir = path.join(__dirname, "Avatars", B.subject.avatar);
  if (!fs.existsSync(adir)) errs.push(`avatar '${B.subject.avatar}' not found in Avatars/`);
  else {
    // A scene frame (scene-frame.mjs: avatar + product composed) OVERRIDES the plain canonical.
    avatarFrame = B.subject.avatar_frame
      ? resolveAsset(B.subject.avatar_frame)
      : (() => { const idn = path.join(adir, "identity");
          const pick = fs.existsSync(idn) && fs.readdirSync(idn).find((f) => /\.(png|jpe?g)$/i.test(f));
          return pick ? path.join(idn, pick) : null; })();
    if (!avatarFrame || !fs.existsSync(avatarFrame))
      errs.push(`avatar '${B.subject.avatar}' has no resolvable canonical frame (set subject.avatar_frame or add Avatars/${B.subject.avatar}/identity/*.png)`);
    // Casting gate — the house rule: a casting-status face is refused for paid use.
    const amd = path.join(adir, "AVATAR.md");
    const casting = fs.existsSync(amd) && /STATUS:\s*CASTING|status["']?\s*[:=]\s*["']?casting/i.test(fs.readFileSync(amd, "utf-8"));
    if (casting && flag("go") && !flag("allow-casting"))
      errs.push(`avatar '${B.subject.avatar}' is CASTING — founder must approve the face before paid use (--allow-casting for throwaway tests only)`);
    else if (casting) notes.push(`avatar '${B.subject.avatar}' is CASTING — dry/proof ok; --go needs founder approval or --allow-casting`);
  }
}

// 1.5-pro (avatar lane) DOES 1080p; only 2.5 (text-person) and artwork are pinned to 720p.
const res = isAvatar ? (B.resolution || "1080p")
  : isPerson || B.subject?.type === "artwork" ? "720p" : (B.resolution || "1080p");
if (isPerson && !isAvatar && B.resolution && B.resolution !== "720p")
  notes.push(`resolution forced to 720p — 2.5 rejects ${B.resolution}; for 1080p use a named avatar (1.5-pro lane) or route a no-human subject to 2.0`);
const talking = isPerson && spoken.length > 0;
const genAudio = B.audio?.generate ?? talking;
if (talking && genAudio === false) errs.push("generate_audio:false on a talking head ships a MUTE clip at full price — set audio.generate true");

// -- proof gating
const proofRequired = B.proof?.required ?? Boolean(B.subject?.props);
const outDir = path.join(__dirname, "generations", B.id);
const proofDone = fs.existsSync(outDir) &&
  fs.readdirSync(outDir).some((f) => f.includes("proof") && f.endsWith(".task.json") &&
    JSON.parse(fs.readFileSync(path.join(outDir, f), "utf-8")).status === "succeeded");

// ---------------------------------------------------------------- assemble prompt
const blocks = [];
if (B.scene?.look) blocks.push(B.scene.look);
// REFERENCE MANIFEST — 2.5 cites references with @Image N notation and wants each one's PURPOSE
// named (docs, law sd25:reference-citation-with-at-notation). N is 1-indexed by content[] order.
// The 1.5 avatar lane's first image is a first_frame (not an @Image), so notation is 2.5-only.
const refImgs = B.refs?.images || [];
const citeStyle = arg("cite") || B.refs?.cite_style || "at";   // "at" (@Image N) | "prose"
if (refImgs.length && !isAvatar && citeStyle === "at") {
  const lines = refImgs.map((r, i) =>
    `@Image ${i + 1} is the ${r.name || r.role || "reference"}. ${r.describe || "Reproduce it faithfully."}`.trim());
  blocks.push(`References — use each exactly for its stated purpose:\n${lines.join("\n")}`);
} else {
  for (const r of refImgs) if (r.describe) blocks.push(r.describe);   // prose citation / avatar-1.5 lane
}
if (B.scene?.camera) blocks.push(B.scene.camera);
if (B.scene?.voice) blocks.push(B.scene.voice);
const beatLines = (list) => list.map((b) => `${b.t}: ${b.action || ""}${b.line ? ` He says: "${b.line}"` : ""}`.trim());
const audioBlock = B.audio?.direction ||
  (talking ? "Audio: the voice close on the phone microphone with natural location ambience under it. No instruments, no melody, no song, no soundtrack."
           : "No audio.");
const RULES = B.scene?.rules || "No on-screen text, no captions, no subtitles, no logos overlaid on the picture.";

const hasFirstFrame = Boolean(B.refs?.first_frame) || (isAvatar && avatarFrame);
const buildText = (list, dur) =>
  [...blocks, ...beatLines(list), audioBlock, RULES,
   `--ratio ${hasFirstFrame ? "adaptive" : (B.ratio || "9:16")} --dur ${dur} --resolution ${res}` +
   (B.subject?.type === "artwork" ? " --camerafixed true" : "") + " --watermark false"].join("\n\n");

const dataUri = (p) => {
  const abs = resolveAsset(p);
  return `data:image/${abs.endsWith(".jpg") || abs.endsWith(".jpeg") ? "jpeg" : "png"};base64,${fs.readFileSync(abs).toString("base64")}`;
};
const buildBody = (list, dur) => {
  const content = [{ type: "text", text: buildText(list, dur) }];
  // Avatar lane: the canonical goes in as the FIRST FRAME (1.5-pro accepts a human frame — the
  // only lane that does). It is NOT a refs.images entry, so it bypasses the person-in-ref guard.
  if (isAvatar && avatarFrame) content.push({ type: "image_url", image_url: { url: dataUri(avatarFrame) }, role: "first_frame" });
  for (const r of B.refs?.images || []) content.push({ type: "image_url", image_url: { url: dataUri(r.path) }, role: r.role || "reference_image" });
  if (B.refs?.video) content.push({ type: "video_url", video_url: { url: B.refs.video }, role: "reference_video" });
  return { model: route.id, generate_audio: genAudio, content };
};

const cost = (dur) => {
  if (isAvatar) return dur * (genAudio ? route.perSecAudio : route.perSecSilent);
  if (isPerson || B.subject?.type === "artwork") return dur * 0.2325;
  if (route.id.includes("mini") || route.id.includes("fast")) return NaN;
  return res === "720p" ? dur * 0.1519 : res === "1080p" ? dur * 0.3758 : NaN;
};
const usd = (n) => Number.isNaN(n) ? "UNMEASURED — first run is the measurement" : `$${n.toFixed(2)}`;

// ---------------------------------------------------------------- report
console.log(`\n══ ${B.id} ── lane:${lane} subject:${B.subject?.type}${isAvatar ? `(avatar:${B.subject.avatar})` : ""} ${B.duration}s ${res} ══`);
console.log(`route  : ${route.id}\n         (${route.why})`);
if (isAvatar) console.log(`avatar : ${path.relative(__dirname, avatarFrame || "?")}  ->  first_frame`);
if (spoken) console.log(`script : ${words} words · ${wps.toFixed(2)} w/s · band ${band?.join("-")}`);
for (const [c, v, s] of claimValues) console.log(`claim  : ${c} = "${v}"  [${s}]`);
for (const s of B.slots || []) console.log(`slot   : {{${s}}} — human fills before publish`);
console.log(`cost   : full ${usd(cost(B.duration))}${B.proof?.beats ? ` · proof ${usd(cost(5))}` : ""}`);
notes.forEach((n) => console.log(`note   : ${n}`));
// GOLD TARGETS — anchor this generation to the curated best-in-class references for its creative
// type (from the research loop). Set brief.creative_type (ugc/promo/product/commercial/ad-creative)
// to see the examples to MATCH and the rubric to judge against, right at plan time.
if (B.creative_type) {
  try {
    const gold = JSON.parse(fs.readFileSync(path.join(__dirname, "examples", "sources.json"), "utf-8")).gold || [];
    const toks = String(B.creative_type).toLowerCase().split(/[^a-z]+/).filter((t) => t.length >= 2);
    const hit = gold.filter((g) => toks.some((t) => (g.type || "").toLowerCase().includes(t)));
    if (hit.length) {
      console.log(`gold   : match these for '${B.creative_type}' (rubric: craft/CREATIVE-RUBRICS.md):`);
      for (const g of hit.slice(0, 3)) console.log(`         ${g.path}`);
    } else console.log(`gold   : no curated reference yet for '${B.creative_type}' — a gap worth generating (see CREATIVE-RUBRICS.md)`);
  } catch { /* library optional */ }
}
warns.forEach((w) => console.log(`⚠ warn : ${w}`));
if (errs.length) { errs.forEach((e) => console.log(`✗ REFUSE: ${e}`)); console.log(`\n${errs.length} blocker(s) — nothing submitted.\n`); process.exit(2); }

const mode = flag("go") ? "go" : flag("proof") ? "proof" : "dry";
if (mode === "dry") {
  console.log(`\nDRY RUN — nothing submitted. Next: ${proofRequired && !proofDone ? "--proof (required: props in hands)" : "--go"}\n`);
  process.exit(0);
}
if (mode === "go") {
  if ((B.claims_used || []).length && !arg("claims-initialed"))
    { console.log(`\n✗ REFUSE: claims in script and no --claims-initialed "<name>" — the compliance gate is a person, not a vibe.\n`); process.exit(2); }
  if (proofRequired && !proofDone && !arg("skip-proof"))
    { console.log(`\n✗ REFUSE: proof roll required (hands manipulate props — measured object-permanence risk) and none succeeded in ${outDir}. Run --proof, or --skip-proof "<reason>".\n`); process.exit(2); }
}

// ---------------------------------------------------------------- fire + gate
// CANDIDATES (--n, capped at 3): the operator's target flow is "here's #1; I made two others but
// the watcher rejected them." Every candidate is generated, saved, LEDGERED (rejects are the most
// valuable training rows), transcript-gated and watcher-gated; only survivors get the post chain.
const list = mode === "proof" ? (B.proof?.beats || beats.slice(0, 1)) : beats;
const dur = mode === "proof" ? 5 : B.duration;
const N = mode === "go" ? Math.max(1, Math.min(3, Number(arg("n", 1)) || 1)) : 1;
if (N > 1) console.log(`\ncandidates: ${N} × ${usd(cost(dur))} — each auto-gated; rejects saved + ledgered, not presented`);
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

// Supabase ledger row (sidecars stay; the ledger is an ADDITION, and it never throws — a
// ledger outage must not cost a paid generation).
const ledgerRow = (j, savedPath, body, redactedBody) => ({
  task_id: j.id,
  generated_at: j.created_at ? new Date(j.created_at * 1000).toISOString() : new Date().toISOString(),
  brand: B.brand ?? null,
  campaign: B.campaign && B.campaign !== "none" ? B.campaign : null,
  brief_id: B.id ?? null,
  lane,
  model: route.id,
  duration_s: j.duration ?? dur,
  resolution: j.resolution || res,
  ratio: j.ratio || (B.refs?.first_frame ? "adaptive" : (B.ratio || "9:16")),
  prompt_text: body.content.find((c) => c.type === "text")?.text ?? null,
  request_json: redactedBody,
  response_json: j,
  seed: j.seed ?? null,
  tokens: j.usage?.completion_tokens ?? null,
  // Per-1K-token rate is MODEL-specific — do not hardcode the 2.5 rate for every lane. 1.5-pro
  // (avatar lane) bills at 0.0024/K with audio, 0.0012/K silent; 2.5/2.0 at 0.0107/K (the basis
  // the backfill reconciled against sd25-cost). Using 0.0107 for a 1.5-pro clip overcharges 4.5x.
  cost_usd: j.usage?.completion_tokens != null
    ? j.usage.completion_tokens * (isAvatar ? (genAudio ? 0.0024 : 0.0012) : 0.0107) / 1000 : null,
  status: j.status,
  error_code: j.error?.code ?? null,
  file_path: savedPath,
  engine_version: ENGINE_VERSION,
});

const H = { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runCandidate(ci) {
  const citeTag = (refImgs.length && !isAvatar) ? `-${citeStyle}` : "";
  const label = `${B.id}-${mode}-${dur}s-${stamp}${citeTag}${N > 1 ? `-c${ci}` : ""}`;
  const body = buildBody(list, dur);
  const redactedBody = { ...body, content: body.content.map((c) => c.image_url ? { ...c, image_url: { url: "<base64 elided>" } } : c) };
  fs.writeFileSync(path.join(outDir, `${label}.request.json`), JSON.stringify(redactedBody, null, 2));
  const res1 = await fetch(BASE, { method: "POST", headers: H, body: JSON.stringify(body) });
  const txt = await res1.text();
  console.log(`\n[c${ci}] SUBMIT HTTP ${res1.status} ${txt.trim().slice(0, 140)}`);
  const id = (() => { try { return JSON.parse(txt).id; } catch { return null; } })();
  if (!id) return null;
  const t0 = Date.now();
  while ((Date.now() - t0) / 1000 < 1200) {
    const j = await (await fetch(`${BASE}/${id}`, { headers: H })).json();
    if (["succeeded", "failed", "cancelled"].includes(j.status)) {
      console.log(`\n[c${ci}] POLL ${j.status} after ${((Date.now() - t0) / 1000).toFixed(0)}s`);
      fs.writeFileSync(path.join(outDir, `${label}.task.json`), JSON.stringify(j, null, 2));
      if (j.status !== "succeeded") {
        console.log(JSON.stringify(j.error, null, 2));
        await recordGeneration(ledgerRow(j, null, body, redactedBody)); // failures are rows too
        return null;
      }
      console.log(`[c${ci}] tokens=${j.usage?.completion_tokens} res=${j.resolution} seed=${j.seed}`);
      const buf = Buffer.from(await (await fetch(j.content.video_url)).arrayBuffer());
      const saved = path.join(outDir, `${label}.mp4`);
      fs.writeFileSync(saved, buf);
      console.log(`[c${ci}] SAVED ${saved} (${(buf.length / 1e6).toFixed(1)} MB)`);
      await recordGeneration(ledgerRow(j, saved, body, redactedBody));
      return { ci, id, saved, j };
    }
    process.stdout.write(`[c${ci} ${((Date.now() - t0) / 1000).toFixed(0)}s] `);
    await sleep(10000);
  }
  return null;
}

// Gates per candidate. ONE updateGates call at the end — a jsonb PATCH replaces the whole
// column, so building the object incrementally and writing twice would clobber the first gate.
async function gateCandidate(cand) {
  const gates = {};
  let rejected_by = null;
  let heardWords = null;
  if (talking && (B.required_tokens || []).length) {
    console.log(`\n[c${cand.ci}] — transcript gate (${(B.required_tokens).join(", ")}) —`);
    const py = `
import sys
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
segs,_ = m.transcribe(sys.argv[1], vad_filter=True)
print(" ".join(s.text.strip() for s in segs))`;
    const r = spawnSync("python3", ["-c", py, cand.saved], { encoding: "utf-8", timeout: 600000 });
    const transcript = (r.stdout || "").trim();
    heardWords = transcript ? transcript.split(/\s+/).length : null;
    console.log(`heard: ${transcript.slice(0, 260)}`);
    const missed = [];
    for (const tk of B.required_tokens) {
      const hit = transcript.toLowerCase().includes(tk.toLowerCase());
      console.log(`  ${hit ? "✓" : "✗ MISSED"} "${tk}"`);
      if (!hit) missed.push(tk);
    }
    gates.transcript = { pass: !missed.length, required_tokens: B.required_tokens, missed,
                         heard: transcript.slice(0, 1000) };
    if (missed.length) rejected_by = "transcript-gate";
  }
  // Tier-1 watcher — arithmetic on the bytes, authoritative. Exit codes are LOAD-BEARING and must
  // not be conflated (this cost a $2.32 campaign clip on 2026-08-10): sieve-watch.py exits
  //   0 = PASS/WARN (keep) · 1 = real content FAIL (reject) · 2 = the tool itself errored
  // (argparse/crash). A crashing gate is NOT a verdict on the clip — treating exit≠0 as FAIL threw
  // away a good paid asset when we handed it a --modality it doesn't accept. Only exit 1 rejects.
  //
  // MODALITY VOCABULARY: the engine's lanes are ugc|campaign but the watcher speaks
  // ugc|cinema|ad|product — only "ugc" overlaps, so passing `lane` verbatim crashed every campaign
  // run. Map here. "ad" is right for campaign work twice over: it doesn't fail on flat contrast
  // (correct for stylised illustration) and it treats scene cuts as WARN not FAIL (campaign cuts
  // every ~4.3s by house rule — a cut is intended, not a defect).
  if (mode === "go" && fs.existsSync(path.join(__dirname, "sieve-watch.py"))) {
    const watcherModality = lane === "ugc" ? "ugc"
      : B.subject?.type === "product" ? "product" : "ad";
    const wargs = [path.join(__dirname, "sieve-watch.py"), cand.saved,
                   "--modality", watcherModality, "--expect-dur", String(dur)];
    if (res === "720p" && (B.ratio || "9:16") === "9:16") wargs.push("--expect-w", "720", "--expect-h", "1280");
    // Scored-in-post pieces are silent ON PURPOSE (genAudio false) — tell the watcher so its
    // mandatory-audio check doesn't reject a deliberately-silent campaign clip (it killed gh-scan).
    if (!genAudio) wargs.push("--silent-ok");
    const w = spawnSync("python3", wargs, { encoding: "utf-8", timeout: 300000 });
    const tail = ((w.stdout || "") + (w.stderr || "")).trim().split("\n").slice(-12).join("\n");
    const code = w.status;   // null if python never ran (ENOENT/timeout) — treat as ERROR, not FAIL
    const verdict = code === 0 ? "PASS_OR_WARN" : code === 1 ? "FAIL" : "ERROR";
    gates.watcher = { exit: code, modality: watcherModality, verdict, tail: tail.slice(0, 1200) };
    console.log(`[c${cand.ci}] watcher: ${verdict} (modality ${watcherModality})` +
      (verdict === "ERROR" ? " — gate CRASHED; clip kept, not counted as a content fail" : ""));
    if (verdict === "FAIL") rejected_by = rejected_by || "watcher";
  }
  await updateGates(cand.id, gates, rejected_by);
  return { ...cand, gates, rejected_by, heardWords };
}

// Generate every candidate CONCURRENTLY. Each candidate is a long submit-then-poll (median ~120s,
// p90 ~157s of pure model wait), and running them serially multiplied that by N for no reason —
// they are independent ByteDance tasks. Promise.all overlaps the polls: a 3-candidate --go run
// drops from ~3× to ~1× the model wait. Gating stays SEQUENTIAL below: the gates spawn CPU-bound
// python (whisper + watcher) and running N of those at once would thrash the box, undoing the win.
const generated = (await Promise.all(
  Array.from({ length: N }, (_, i) => runCandidate(i + 1))
)).filter(Boolean);
const results = [];
for (const cand of generated) results.push(await gateCandidate(cand));
if (!results.length) process.exit(1);
const survivors = results.filter((r) => !r.rejected_by);

// post chain — SURVIVORS only; a rejected take is kept raw as training data, never finished
for (const s of survivors) {
  if (mode !== "go") continue;
  const postDir = path.join(outDir, "_post");
  fs.mkdirSync(postDir, { recursive: true });
  let src = s.saved;
  if (B.post?.loudnorm !== false) {
    const out = path.join(postDir, path.basename(s.saved).replace(".mp4", "_lufs.mp4"));
    try {
      execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", s.saved,
        "-af", "loudnorm=I=-16.5:TP=-2.0:LRA=11", "-c:v", "copy", out]);
      console.log(`\n[c${s.ci}] post: loudness normalized to -16.5 LUFS (raw kept)`);
      src = out;
    } catch { console.log(`\n[c${s.ci}] post: loudnorm failed — normalize by hand`); }
  }
  // CONFORM-UP, measured not guessed (post_laws): lanczos param0=5, NO sharpening — PSNR 45.457
  // vs 39.866 for lanczos+unsharp (6x the halos); beats raw 720p even after the platform
  // re-encode (41.933 vs 41.498). Sharpening is the tell, not the fix.
  if (B.post?.conform1080 !== false && res === "720p" && (B.ratio || "9:16") === "9:16") {
    const out = path.join(postDir, path.basename(s.saved).replace(".mp4", "_1080.mp4"));
    try {
      execFileSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-i", src,
        "-vf", "scale=1080:1920:flags=lanczos:param0=5",
        "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "copy", out]);
      s.deliver = out;
      console.log(`[c${s.ci}] post: conformed to 1080x1920 (lanczos p5, unsharpened)`);
    } catch { console.log(`[c${s.ci}] post: conform-up failed — deliver 720 raw, never hand-sharpen`); }
  }
}

// ---------------------------------------------------------------- the engine's account
console.log(`\n══ RESULT — ${results.length}/${N} generated · ${survivors.length} survivor(s) ══`);
for (const r of results) {
  const w = r.heardWords != null ? ` · heard ~${r.heardWords} words (${(r.heardWords / dur).toFixed(2)} w/s vs band ${band ? band.join("-") : "n/a"})` : "";
  if (r.rejected_by) console.log(`  c${r.ci}  REJECTED by ${r.rejected_by} — saved for the ledger, not presented${w}\n      ${r.saved}`);
  else console.log(`  c${r.ci}  SURVIVOR${w}\n      ${r.deliver || r.saved}${r.deliver ? "  <- DELIVER THIS ONE" : ""}`);
}
if (survivors.length) {
  console.log(`\nrecord your call (feeds the flywheel):`);
  for (const s of survivors) console.log(`  node gen-verdict.mjs ${s.id} approved|rejected`);
}
console.log(`\nnext: node sd25-cost.mjs drain\n`);
