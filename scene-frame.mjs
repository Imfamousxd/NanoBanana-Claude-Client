#!/usr/bin/env node
/**
 * scene-frame.mjs — build the first frame for an AVATAR-lane UGC shot: the avatar + real
 * reference files (product / card / brand asset) composed into ONE frame at delivery ratio,
 * which the video engine then animates.
 *
 *   node scene-frame.mjs --avatar Sol \
 *        --ref inputs/card-qr-side.png:card \
 *        --scene "sitting in his car, holding the card up beside his cheek" \
 *        --ar 9:16 --n 2 [--id my-scene]
 *
 * WHY THIS EXISTS (the repo's deepest law, Pattern E/H): Seedance carries 100% of a person's
 * identity in the FIRST FRAME, and `image` (first frame) CANNOT be combined with reference_images.
 * So you cannot pass "avatar + product" to the video model as two inputs — you COMPOSE them into
 * one frame first (Nano Banana Pro, best reference fidelity), review the cheap frame (a frame is
 * ~cents, a clip is ~$0.59+), THEN animate the winner. This is compose-at-image, animate-at-video.
 *
 * The load-bearing rules baked into the prompt (all measured in this repo):
 *   - name each reference by ROLE ("reference image 1 is THE PERSON", "…2 is THE CARD")
 *   - "do not beautify, slim, or change his features" (identity drift guard)
 *   - reproduce the product faithfully; it is the one axis with real ground truth
 *   - build at the DELIVERY ratio — a first frame's shape wins; aspect_ratio is ignored downstream
 *   - never name a device to describe a look; describe artifacts positively
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { repoRoot } from "./lib-repo-root.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = repoRoot();
for (const line of fs.readFileSync(path.join(REPO, ".env"), "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-pro-image-preview";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const argAll = (k) => process.argv.reduce((a, v, i) => (process.argv[i - 1] === `--${k}` ? [...a, v] : a), []);

const avatarName = arg("avatar");
if (!avatarName) { console.error("need --avatar <Name>"); process.exit(1); }
const adir = path.join(__dirname, "Avatars", avatarName);
const idn = path.join(adir, "identity");
const canonical = fs.existsSync(idn) && fs.readdirSync(idn).find((f) => /\.(png|jpe?g)$/i.test(f));
if (!canonical) { console.error(`no canonical in Avatars/${avatarName}/identity/`); process.exit(1); }
const canonicalPath = path.join(idn, canonical);

// --ref path:role  (role names the object in the prompt; defaults to "product")
const refSpecs = argAll("ref").map((s) => {
  const idx = s.lastIndexOf(":");
  const hasRole = idx > 0 && !s.slice(idx + 1).includes("/") && !s.slice(idx + 1).includes(".");
  return hasRole ? { path: s.slice(0, idx), role: s.slice(idx + 1) } : { path: s, role: "product" };
});
const scene = arg("scene", "sitting in his car in late-afternoon sun, looking into the phone");
const ar = arg("ar", "9:16");
const n = Math.max(1, Math.min(4, Number(arg("n", 2))));
const id = arg("id", `${avatarName.toLowerCase()}-scene`);

// role list: reference image 1 is ALWAYS the person; refs follow. Relative paths resolve against
// the worktree (where inputs/ lives) first, then the main repo root.
const resolveRef = (rp) => {
  if (path.isAbsolute(rp)) return rp;
  const inWt = path.join(__dirname, rp);
  return fs.existsSync(inWt) ? inWt : path.join(REPO, rp);
};
const refPaths = [canonicalPath, ...refSpecs.map((r) => resolveRef(r.path))];
for (const p of refPaths) if (!fs.existsSync(p)) { console.error(`ref missing: ${p}`); process.exit(1); }

const roleLines = [
  `Reference image 1 is THE PERSON. His face, hair, stubble, build and skin are EXACTLY this ` +
  `man — reproduce his likeness precisely. Do NOT beautify, slim, smooth, or change his features.`,
];
refSpecs.forEach((r, i) => roleLines.push(
  `Reference image ${i + 2} is THE ${r.role.toUpperCase()}. Reproduce it faithfully — its exact ` +
  `shape, colors, markings and any text stay as shown; it is a real product, not a redesign.`));

const PROMPT = [
  `A casual handheld vertical selfie photo — a single still frame from a UGC phone video.`,
  ...roleLines,
  `Scene: the person ${scene}. Real skin texture with visible pores and a little oil shine, ` +
  `natural uneven daylight with true shadows, no beauty filter, no studio lighting. His face ` +
  `stays fully visible and unobstructed. Full-bleed, fills the frame edge to edge, no border, ` +
  `no phone mockup, no bezel.`,
  `No on-screen text, no captions, no subtitles, no watermark, no logos overlaid on the picture.`,
].join("\n\n");

async function one(ci) {
  const parts = [...refPaths.map((p) => ({
    inline_data: { mime_type: p.endsWith(".png") ? "image/png" : "image/jpeg",
                   data: fs.readFileSync(p).toString("base64") } })), { text: PROMPT }];
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST", headers: { "x-goog-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: ar, imageSize: "2K" } } }),
  });
  if (!res.ok) { console.error(`c${ci} API ${res.status}: ${(await res.text()).slice(0, 200)}`); return null; }
  const j = await res.json();
  const img = (j.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData);
  if (!img) { console.error(`c${ci}: no image returned`); return null; }
  const outDir = path.join(__dirname, "generations", id);
  fs.mkdirSync(outDir, { recursive: true });
  const out = path.join(outDir, `frame_c${ci}.png`);
  fs.writeFileSync(out, Buffer.from(img.inlineData.data, "base64"));
  console.log(`  c${ci} -> ${path.relative(__dirname, out)}`);
  return out;
}

console.log(`\nscene-frame: ${avatarName} + ${refSpecs.map((r) => r.role).join(", ") || "(no refs)"} · ${ar} · ${n} candidate(s)`);
console.log(`refs: ${refPaths.map((p) => path.relative(REPO, p)).join("  |  ")}`);
const outs = [];
for (let ci = 1; ci <= n; ci++) { const o = await one(ci); if (o) outs.push(o); }
if (!outs.length) { console.error("no frames produced"); process.exit(1); }
console.log(`\nReview, then animate the winner via the avatar lane:`);
console.log(`  briefs: set subject.avatar "${avatarName}" and subject.avatar_frame "<chosen frame path>"`);
console.log(`  (a scene frame overrides the plain canonical as first_frame)\n`);
try { const { execFileSync } = await import("child_process"); execFileSync("open", ["-a", "Preview", ...outs]); } catch {}
