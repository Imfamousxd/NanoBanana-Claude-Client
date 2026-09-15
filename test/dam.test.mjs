import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { CLASS_IDS, IMAGE_ANALYSIS_SCHEMA, VIDEO_ANALYSIS_SCHEMA, mediaKindForName, pathHints, validateAnalysis } from "../engine/dam/taxonomy.mjs";
import { hammingDistance, keyframeTimes, probeFile, ratioLabel } from "../engine/dam/probe.mjs";
import { cameraRead, measureVideo, motionStats, speechStats, shotRhythm } from "../engine/dam/measure.mjs";
import { parseQuery } from "../engine/dam/search.mjs";
import { composeSearchDoc, imagePrompt, shotsFromMeasured, videoPrompt } from "../engine/dam/analyze.mjs";
import { geminiSchema } from "../engine/dam/providers/vision.mjs";
import { normalize, toPgVector } from "../engine/dam/providers/embed.mjs";
import { dropboxEntryToDiscovery, walkLocal } from "../engine/dam/sources.mjs";
import { normalizeEntry } from "../engine/dam/dropbox.mjs";
import { distillLaws } from "../engine/dam/ugc-profile.mjs";
import { isExcludedPath } from "../engine/dam/config.mjs";

const PNG_1x1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
const graph = { nodes: [
  { id: "brand.muha", type: "brand", name: "Muha Meds", aliases: ["muha", "muha meds"] },
  { id: "brand.dialed-moods", type: "brand", name: "Dialed Moods", aliases: ["dialed moods", "moods"] },
] };
const products = [{ id: "DM-blue-glacier", name: "Blue Glacier", aliases: ["blue glacier can"], brand: "brand.dialed-moods" }, { id: "MM-dual-flavor-aio", name: "Dual Flavor", aliases: ["dual flavor", "switch duo"], brand: "brand.muha" }];

test("taxonomy: kinds, hints and record validation", () => {
  assert.equal(mediaKindForName("shot.MOV"), "video");
  assert.equal(mediaKindForName("logo.svg"), "vector");
  assert.equal(mediaKindForName("deck.pdf"), "document");
  assert.ok(pathHints("2025/UGC creators/tiktok take 3.mp4").includes("ugc"));
  assert.ok(pathHints("Packshots/transparent/vial_v2.png").includes("product-ref"));
  assert.ok(CLASS_IDS.includes("ugc-video"));
  assert.deepEqual(validateAnalysis({ class: "ugc-video", form: "talking-head", reference_roles: ["ugc-exemplar"], title: "A creator", summary: "Talks about the product for twenty seconds." }, { video: true }), []);
  assert.ok(validateAnalysis({ class: "nope", title: "x", summary: "short" }).length >= 2);
  assert.ok(isExcludedPath("Muha Meds Accounting/q3.xlsx"));
});

test("gemini schema conversion collapses nullable unions and drops additionalProperties", () => {
  const converted = geminiSchema(IMAGE_ANALYSIS_SCHEMA);
  assert.equal(converted.additionalProperties, undefined);
  assert.equal(converted.properties.brand.type, "string");
  assert.equal(converted.properties.brand.nullable, true);
  assert.equal(geminiSchema(VIDEO_ANALYSIS_SCHEMA).properties.structure.properties.product_reveal_s.nullable, true);
});

test("probe helpers: ratio labels, hamming distance, keyframe spacing", () => {
  assert.equal(ratioLabel(1080, 1920), "9:16");
  assert.equal(ratioLabel(1080, 1350), "4:5");
  assert.equal(ratioLabel(1000, 1000), "1:1");
  assert.equal(ratioLabel(1000, 620), "other");
  assert.equal(hammingDistance("ffffffffffffffff", "fffffffffffffffe"), 1);
  const times = keyframeTimes(30, [5, 12, 20], 6);
  assert.ok(times.length <= 6 && times.every((t) => t < 30));
  assert.ok(times.some((t) => t > 5 && t < 12), "a shot midpoint is sampled");
  assert.deepEqual(keyframeTimes(0, [], 4), [0]);
});

test("measure: motion stats, speech stats and shot rhythm are deterministic", () => {
  const frameSize = 4;
  const frames = [Buffer.alloc(frameSize, 0), Buffer.alloc(frameSize, 0), Buffer.alloc(frameSize, 255), Buffer.alloc(frameSize, 255)];
  const stats = motionStats(Buffer.concat(frames), 2, 2);
  assert.equal(stats.frames, 4);
  assert.deepEqual(stats.series, [0, 1, 0]);
  assert.equal(stats.stillRatio, 0.667);
  assert.equal(cameraRead({ mean: 0.001, jitter: 0.001, stillRatio: 0.9 }), "locked-off");
  const speech = speechStats([{ start: 0.2, end: 1.9, text: "Okay so this is the thing" }, { start: 2.5, end: 4.0, text: "and it works" }]);
  assert.equal(speech.words, 9);
  assert.equal(speech.hook_end_s, 1.9);
  assert.deepEqual(speech.pauses_over_300ms, [0.6]);
  assert.equal(speech.articulation_wps, 2.81);
  assert.deepEqual(shotRhythm(10, []), { shot_count: 1, avg_shot_s: 10, lane: "single-take" });
});

test("measure + probe on a real synthetic clip (ffmpeg)", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dam-clip-"));
  const clip = path.join(dir, "clip.mp4");
  execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "testsrc2=size=180x320:rate=12:duration=3", "-f", "lavfi", "-i", "sine=frequency=440:duration=3", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", clip]);
  const probe = await probeFile(clip, dir);
  assert.equal(probe.kind, "video");
  assert.equal(probe.width, 180);
  assert.equal(probe.orientation, "9:16");
  assert.equal(probe.hasAudio, true);
  assert.ok(probe.phash && probe.contentHash);
  const measured = await measureVideo(clip, { durationS: probe.durationS, hasAudio: true, width: 180, height: 320, fps: 12 });
  assert.equal(measured.shot_count, 1);
  assert.ok(typeof measured.loudness_lufs === "number");
  assert.ok(measured.motion.frames >= 4);
  assert.equal(shotsFromMeasured(measured, [{ t: 1, path: "x" }]).length, 1);
  const image = path.join(dir, "one.png");
  fs.writeFileSync(image, PNG_1x1);
  const imageProbe = await probeFile(image, dir);
  assert.equal(imageProbe.kind, "image");
  assert.equal(imageProbe.width, 1);
  assert.ok(imageProbe.phash);
});

test("query understanding reads brand, product, class, orientation and people off plain language", () => {
  const a = parseQuery("vertical ugc videos of someone talking about the blue glacier can", graph, products);
  assert.equal(a.filters.brand, "brand.dialed-moods");
  assert.equal(a.filters.product, "DM-blue-glacier");
  assert.equal(a.filters.class, "ugc-video");
  assert.equal(a.filters.orientation, "9:16");
  assert.equal(a.filters.people, true);
  const b = parseQuery("muha logo transparent", graph, products);
  assert.equal(b.filters.brand, "brand.muha");
  assert.equal(b.filters.class, "logo");
  assert.equal(b.filters.alpha, true);
  const c = parseQuery("real creator content under 30 seconds", graph, products);
  assert.equal(c.filters.realHuman, true);
  assert.equal(c.filters.maxDuration, 30);
});

test("prompts carry the roster, the measurements and the taxonomy; the search doc says everything", () => {
  const cards = [{ id: "brand.muha", name: "Muha Meds", aliases: ["muha"], positioning: "cannabis lifestyle", products: [{ id: "MM-dual-flavor-aio", name: "Dual Flavor", aliases: ["switch duo"] }] }];
  const prompt = imagePrompt({ cards, brandHint: "brand.muha", relativePath: "Packshots/dual.png", probe: { width: 2000, height: 3000, hasAlpha: true } });
  assert.match(prompt, /brand\.muha = Muha Meds/);
  assert.match(prompt, /MM-dual-flavor-aio/);
  assert.match(prompt, /ugc-still/);
  const measured = { duration_s: 12, width: 1080, height: 1920, shot_count: 1, cuts: [], avg_shot_s: 12, loudness_lufs: -16, camera_read: "handheld-erratic", motion: { mean: 0.05, jitter: 0.04 } };
  const transcript = { text: "okay so I finally tried it", words: 6, articulation_wps: 2.6, hook_end_s: 1.4 };
  const vprompt = videoPrompt({ cards, brandHint: "brand.muha", relativePath: "UGC/take1.mp4", measured, transcript, frames: [{ t: 0.2 }, { t: 1 }] });
  assert.match(vprompt, /handheld-erratic/);
  assert.match(vprompt, /okay so I finally tried it/);
  const record = { class: "ugc-video", form: "talking-head", brand: "brand.muha", product: null, title: "Creator tries the device", summary: "A woman films herself.", creator: { count: 1, framing: "arm's-length selfie", energy: "casual", wardrobe: "hoodie" }, capture: { device_read: "phone front camera", camera_behavior: "handheld drift", reframing: "late", exposure: "window blowout", imperfections: ["focus hunt"] }, structure: { hook: "okay so", hook_type: "problem", beats: [{ t: "0-2s", what: "hook" }], cta: null, product_reveal_s: 3 }, performance: "natural pauses", on_screen_text: [{ t: "1s", text: "day 1" }], audio: { speech: "one woman", music: "none", diegetic: ["room tone"] }, reference_roles: ["ugc-exemplar"], usability: { quality: 0.8, watermarked: false, low_resolution: false, outdated_or_wrong: false, notes: "" }, tags: ["ugc", "selfie"] };
  const doc = composeSearchDoc({ record, relativePath: "UGC/take1.mp4", brandName: "Muha Meds", measured, transcript, probe: { orientation: "9:16", width: 1080, height: 1920 } });
  for (const needle of ["Creator tries the device", "arm's-length selfie", "focus hunt", "day 1", "okay so I finally tried it", "single", "9:16", "ugc-exemplar", "UGC/take1.mp4"]) assert.ok(doc.includes(needle), `search doc missing ${needle}`);
});

test("embedding helpers and pgvector literal", () => {
  const v = normalize([3, 4]);
  assert.ok(Math.abs(Math.hypot(...v) - 1) < 1e-9);
  assert.equal(toPgVector([0.5, 0.25]), "[0.5000000,0.2500000]");
});

test("sources: local walk skips hidden/excluded files; dropbox entries normalise relative to the root", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "dam-src-"));
  fs.mkdirSync(path.join(dir, "Brand", "Accounting"), { recursive: true });
  fs.writeFileSync(path.join(dir, "Brand", "a.png"), PNG_1x1);
  fs.writeFileSync(path.join(dir, "Brand", ".hidden.png"), PNG_1x1);
  fs.writeFileSync(path.join(dir, "Brand", "Accounting", "b.png"), PNG_1x1);
  fs.writeFileSync(path.join(dir, "Brand", "notes.txt"), "x");
  const files = [...walkLocal(dir)];
  assert.deepEqual(files.map((f) => f.path), ["Brand/a.png", "Brand/notes.txt"]);
  const entry = normalizeEntry({ ".tag": "file", id: "id:1", name: "take.mp4", path_display: "/2026/Muha Members/UGC/take.mp4", path_lower: "/2026/muha members/ugc/take.mp4", size: 10, server_modified: "2026-09-01T00:00:00Z", content_hash: "abc" });
  const discovery = dropboxEntryToDiscovery(entry, "/2026/Muha Members");
  assert.equal(discovery.path, "UGC/take.mp4");
  assert.equal(discovery.kind, "video");
  assert.equal(discovery.contentHashHint, "abc");
  assert.equal(dropboxEntryToDiscovery(normalizeEntry({ ".tag": "deleted", path_display: "/2026/Muha Members/old.png" }), "/2026/Muha Members").type, "deleted");
});

test("ugc laws are distilled from bands with sample-size confidence", () => {
  const bands = { duration_s: { n: 14, min: 8, p25: 12, median: 18, p75: 27, max: 41 }, articulation_wps: { n: 12, p25: 2.4, median: 2.8, p75: 3.1 }, hook_end_s: { n: 12, median: 1.6, p75: 2.2 }, shot_count: { n: 14, p25: 1, median: 1, p75: 2 } };
  const laws = distillLaws("brand.muha", bands, { framings: [{ value: "arm's-length selfie", n: 9 }], hook_types: [{ value: "question", n: 6 }], imperfections: [{ value: "focus hunt", n: 5 }] }, 14);
  assert.ok(laws.length >= 6);
  assert.ok(laws.every((law) => law.claim && law.evidence && law.applies_to === "ugc-video"));
  assert.equal(laws[0].confidence, "strong");
  assert.equal(distillLaws("brand.muha", bands, {}, 3)[0].confidence, "weak");
});

test("product-refs: render trees are recognised and parsed; textures, logos and lifestyle folders are not", async () => {
  const { isRenderCandidate, renderPathFacts } = await import("../engine/dam/product-refs.mjs");
  assert.equal(isRenderCandidate("Renders/Disposables/MI/MI Magnetic_Dispo/Magnetic Dispos Devices_Only/Blue Slushie.png"), true);
  assert.equal(isRenderCandidate("DAM 2, Muha THC  = Asset Receiving/Approved Renders/Renders/CA/Flower/Glass Jar/Gush Mintz.png"), true);
  assert.equal(isRenderCandidate("Website Assets/August 2026 SKU Images/Product Renders/Collagen/Displayboxes/box.png"), true);
  assert.equal(isRenderCandidate("3D files/Gym/textures1/Archmodels v169/Am169_026_reflect_02.jpg"), false);
  assert.equal(isRenderCandidate("Renders/Something/LOGOS/mm.png"), false);
  assert.equal(isRenderCandidate("Renders/Disposables/MI/device.mp4"), false);
  assert.equal(isRenderCandidate("Lifestyle/Photos/JAS_1.jpg"), false);
  const facts = renderPathFacts("DAM 2, Muha THC  = Asset Receiving/Approved Renders/Renders/CA/Flower/Glass Jar/v2/Gush Mintz.png");
  assert.equal(facts.approved, true);
  assert.equal(facts.market, "CA");
  assert.equal(facts.category, "Flower");
  assert.equal(facts.line, "Glass Jar");
  assert.equal(facts.version, 2);
  assert.equal(facts.group, "Flower / Glass Jar");
  const old = renderPathFacts("Renders/Discontinued/Disposables/Display Boxes/x.png");
  assert.equal(old.discontinued, true);
  assert.equal(old.group, "Discontinued / Disposables");
});

test("product-context: composition and angle fall back from subclass/title; scoring sinks discontinued and lifts approved", async () => {
  const { compositionOf, angleOf, referenceScore } = await import("../engine/dam/product-context.mjs");
  assert.equal(compositionOf({ analysis: { composition: "device-only" }, subclass: "packaging-render" }), "device-only");
  assert.equal(compositionOf({ analysis: {}, subclass: "device-render" }), "device-only");
  assert.equal(compositionOf({ analysis: {}, class: "packaging-collateral", subclass: "dieline" }), "label-flat");
  assert.equal(compositionOf({ analysis: {}, class: "packaging-collateral", subclass: "display-box" }), "packaging-only");
  assert.equal(angleOf({ analysis: { angle: "side" } }), "side");
  assert.equal(angleOf({ analysis: {}, title: "Three-quarter view of the box", path: "x.png" }), "three-quarter");
  const approved = referenceScore({ verdict: "approved", quality: 8, flags: { render: { approved: true, version: 3 } }, path: "Approved Renders/Renders/CA/Flower/x.png", reference_roles: ["canonical"] });
  const discontinued = referenceScore({ quality: 9, flags: { render: { discontinued: true } }, path: "Renders/Discontinued/x.png", reference_roles: [] });
  assert.ok(approved > 100 && discontinued < 0, `${approved} vs ${discontinued}`);
});
