#!/usr/bin/env node
// Assemble the 20 authored NuLumin themed-lifestyle prompts into nanobanana batch files.
// Fixes the curator's off-by-one split (was 9 blur / 11 no-blur) by converting pick #13
// (Turkish get-up, a movement shot) from a held still into its dynamic press phase w/ camera-motion blur.
// Splits into parallel batches; blur -> "Blur" dir, no-blur -> "No Blur" dir (set via OUTPUT_DIR at run time).
import fs from "fs";

const SRC = process.argv[2];
if (!SRC) { console.error("usage: node nulumin-themed-assemble.mjs <workflow.output.json>"); process.exit(1); }
const data = JSON.parse(fs.readFileSync(SRC, "utf-8"));
const jobs = data.result.jobs;

// --- Fix #13: no-blur Turkish get-up -> blur (dynamic rise), to hit exactly 10/10 ---
const j13 = jobs.find(j => j.id === 13);
j13.mode = "blur";
j13.slug = "nul-theme-performance-blur-13";
j13.prompt = `nul-theme-performance-blur-13: A 4:5 editorial photograph capturing the powerful mid-rise of a Turkish get-up. An East Asian man in his early 60s, sinewy and lean with close-cropped silver hair, drives up off one braced hand toward standing, a kettlebell locked dead overhead in one straight arm, hips surging upward, every stabilizer firing, eyes pinned hard on the bell. He wears a soft cream henley and charcoal joggers, barefoot, a thin lavender (#B89BE2) mat edge slicing the lower frame. A quiet loft studio at golden hour: warm window light rakes from one side over a weathered oak floor, dust motes drifting in the beam, deep cool shadow behind. House look: clinical-modern NuLumin grainy grungy documentary film, low-key painterly warm/cool contrast, shallow depth of field, raw and refined, never glossy or stocky. Camera-in-motion: a slow-shutter (~1/30s) lateral track pan, directional motion blur permeating the ENTIRE frame across foreground and background, the studio behind smeared into directional streaks, the lifter the relative anchor yet still softer than tack-sharp, a 6-degree Dutch tilt; nothing rigorously sharp, the surging press still reading clearly. Fine Cinestill 35mm grain, subtle halation, low-key painterly grade, premium and cinematic, no text, no logos.`;

const blur = jobs.filter(j => j.mode === "blur");
const noBlur = jobs.filter(j => j.mode === "no-blur");
console.log(`Split: ${blur.length} blur / ${noBlur.length} no-blur (total ${jobs.length})`);
if (blur.length !== 10 || noBlur.length !== 10) { console.error("!! split is not 10/10 — aborting"); process.exit(1); }

const toBatch = j => ({ prompt: j.prompt, aspectRatio: j.aspect, imageSize: "4K", refImages: [] });
const half = arr => [arr.slice(0, Math.ceil(arr.length / 2)), arr.slice(Math.ceil(arr.length / 2))];

const [b1, b2] = half(blur);
const [n1, n2] = half(noBlur);
fs.writeFileSync("nulumin-themed-blur-p1.json", JSON.stringify(b1.map(toBatch), null, 2));
fs.writeFileSync("nulumin-themed-blur-p2.json", JSON.stringify(b2.map(toBatch), null, 2));
fs.writeFileSync("nulumin-themed-noblur-p1.json", JSON.stringify(n1.map(toBatch), null, 2));
fs.writeFileSync("nulumin-themed-noblur-p2.json", JSON.stringify(n2.map(toBatch), null, 2));

// manifest for reference
const manifest = jobs.map(j => ({ id: j.id, theme: j.theme, mode: j.mode, aspect: j.aspect, slug: j.slug }));
fs.writeFileSync("nulumin-themed-manifest.json", JSON.stringify(manifest, null, 2));

console.log("Wrote: nulumin-themed-blur-p1.json (" + b1.length + "), blur-p2.json (" + b2.length + "), noblur-p1.json (" + n1.length + "), noblur-p2.json (" + n2.length + ")");
console.log("\nManifest:");
for (const m of manifest) console.log(`  #${String(m.id).padStart(2,"0")}  ${m.mode.padEnd(7)}  ${m.theme.padEnd(14)}  ${m.aspect}  ${m.slug}`);
