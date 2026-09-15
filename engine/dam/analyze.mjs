// Analyse — where a file becomes understanding. The model is given what a new colleague would be
// given: the brand roster with aliases, the product list for the folder's brand, path hints, and for
// video the MEASURED facts (cuts, loudness, transcript) so it reads the picture and never guesses the
// numbers. Output is a structured record plus a retrieval document that says everything the record
// says in plain words, because that document is what search embeds and what a person reads.
import fs from "node:fs";
import path from "node:path";
import { readJson } from "../core/files.mjs";
import { relatedNodes } from "../knowledge/graph.mjs";
import { ANALYSIS_SCHEMA_VERSION, CLASSES, IMAGE_ANALYSIS_SCHEMA, REFERENCE_ROLES, SUBCLASSES, VIDEO_ANALYSIS_SCHEMA, VIDEO_FORMS, pathHints, validateAnalysis } from "./taxonomy.mjs";
import { contactSheet, extractAudio, extractKeyframes, extractKeyframesFromUrl, keyframeTimes, modelImage } from "./probe.mjs";
import { measureVideo, speechStats } from "./measure.mjs";
import { analyzeImages } from "./providers/vision.mjs";
import { transcribeAudio } from "./providers/transcribe.mjs";
import { estimateUsd } from "./config.mjs";

/** Brand roster + product lists from the knowledge graph, rendered once per worker run. */
export function brandCards(root, graph) {
  const cards = [];
  for (const brand of graph.nodes.filter((node) => node.type === "brand")) {
    const products = [];
    for (const registry of relatedNodes(graph, brand.id, "has-products")) {
      const file = path.resolve(root, registry.path || registry.source);
      if (!fs.existsSync(file)) continue;
      const data = readJson(file);
      for (const product of data.products || []) products.push({ id: product.sku || product.name, name: product.name, aliases: product.aliases || [] });
      const skuIndex = data.skuRegistry?.index;
      if (skuIndex && fs.existsSync(path.resolve(root, skuIndex))) {
        for (const sku of readJson(path.resolve(root, skuIndex)).skus || []) products.push({ id: sku.sku, name: `${sku.compound} ${sku.dose}`, aliases: [sku.compound] });
      }
    }
    cards.push({ id: brand.id, name: brand.name, aliases: brand.aliases || [], positioning: brand.promptProfile?.positioning || null, products });
  }
  return cards;
}

function rosterText(cards, focusBrand) {
  const lines = ["BRANDS (use the id exactly; null if none of these):"];
  for (const card of cards) lines.push(`- ${card.id} = ${card.name}${card.aliases.length ? ` (aka ${card.aliases.join(", ")})` : ""}${card.positioning ? ` — ${card.positioning}` : ""}`);
  const focus = cards.find((card) => card.id === focusBrand);
  if (focus?.products?.length) {
    lines.push("", `PRODUCTS of ${focus.name} (use the id when you can identify one; otherwise describe the product in words):`);
    const seen = new Set();
    for (const product of focus.products) {
      if (seen.has(product.id)) continue;
      seen.add(product.id);
      lines.push(`- ${product.id}: ${product.name}${product.aliases?.length ? ` (${product.aliases.slice(0, 4).join(", ")})` : ""}`);
      if (seen.size >= 120) { lines.push("- …"); break; }
    }
  }
  return lines.join("\n");
}

function taxonomyText({ withSubclasses = true } = {}) {
  return [
    "CLASSES (pick exactly one, then the subclass that belongs to it):",
    ...Object.entries(CLASSES).map(([id, text]) => `- ${id}: ${text}${withSubclasses && SUBCLASSES[id] ? `\n    subclasses: ${SUBCLASSES[id].join(", ")}` : ""}`),
    "",
    "REFERENCE ROLES (zero or more — what this file could do for a future brief):",
    ...Object.entries(REFERENCE_ROLES).map(([id, text]) => `- ${id}: ${text}`),
  ].join("\n");
}

export function imagePrompt({ cards, brandHint, relativePath, probe }) {
  const hints = pathHints(relativePath);
  return [
    "You are the archivist for a marketing studio's asset library. Read the image and fill the JSON schema precisely. Be concrete and literal: name objects, read every piece of text verbatim, describe the light and the surface. Never invent text you cannot read; never guess a real person's identity.",
    "",
    `FILE: ${relativePath}`,
    `FOLDER BRAND HINT: ${brandHint || "unknown"} (the folder this came from; confirm from the picture — a file can be misfiled)`,
    `PATH HINTS: ${hints.length ? hints.join(", ") : "none"}`,
    `TECH: ${probe.width}x${probe.height}${probe.hasAlpha ? ", has transparency" : ""}${probe.format ? `, ${probe.format}` : ""}`,
    "",
    rosterText(cards, brandHint),
    "",
    taxonomyText(),
    "",
    "Guidance: a 3D render of a product or device is product-ref/render-3d or device-render; a transparent PNG of the product is product-ref/cutout-transparent (role canonical or shape); flat label artwork is product-ref/label-art. A studio photograph of the product with no layout is lifestyle-photo/photoshoot-product; a photographed person with the product in a real setting is lifestyle-photo/lifestyle-scene, or ugc-still if it reads as the person's own phone photo. A finished ad with copy is marketing-still (pick the subclass by format) with role layout-exemplar if it looks shipped. Mark outdated_or_wrong when packaging, spelling or product obviously conflicts with the brand's current products.",
  ].join("\n");
}

export function videoPrompt({ cards, brandHint, relativePath, measured, transcript, frames }) {
  const hints = pathHints(relativePath);
  const speech = transcript?.text ? `TRANSCRIPT (verbatim, ${transcript.words} words, articulation ${transcript.articulation_wps ?? "n/a"} w/s, hook ends ${transcript.hook_end_s ?? "n/a"}s):\n${transcript.text.slice(0, 4000)}` : "TRANSCRIPT: no speech detected";
  return [
    "You are the archivist for a marketing studio's video library. You are looking at a CONTACT SHEET of keyframes from ONE video (frames numbered in time order with timestamps) plus measured facts and a verbatim transcript. Read what is on screen; do not restate the numbers you were given as if you measured them.",
    "The most valuable thing you can do is describe REAL HUMAN creator content precisely — framing, capture behaviour, setting entropy, performance, structure — because generated UGC will be judged against it.",
    "",
    `FILE: ${relativePath}`,
    `FOLDER BRAND HINT: ${brandHint || "unknown"}`,
    `PATH HINTS: ${hints.length ? hints.join(", ") : "none"}`,
    `MEASURED: duration ${measured.duration_s}s, ${measured.width}x${measured.height}, ${measured.shot_count} shot(s) (cuts at ${measured.cuts.slice(0, 20).join(", ") || "none"}), avg shot ${measured.avg_shot_s}s, loudness ${measured.loudness_lufs ?? "n/a"} LUFS, camera read ${measured.camera_read}, motion mean ${measured.motion?.mean} jitter ${measured.motion?.jitter}`,
    `FRAMES: ${frames.map((frame, index) => `#${index + 1}=${frame.t}s`).join(" ")}`,
    "",
    speech,
    "",
    rosterText(cards, brandHint),
    "",
    taxonomyText(),
    "",
    `VIDEO FORMS: ${VIDEO_FORMS.join(", ")}`,
    "",
    "Guidance: is_real_human_creator is true only for a filmed person (not an avatar, animation, or product-only clip). ugc-video needs a real person speaking to or performing for the camera in a creator register. An edited promo with music, graphics and cuts is marketing-video. Beats are what you can SEE across the frames, timed with the frame timestamps. Put every legible caption/overlay in on_screen_text verbatim.",
  ].join("\n");
}

/** The retrieval document: everything the record knows, in the words people search with. */
export function composeSearchDoc({ record, relativePath, brandName, measured = null, transcript = null, probe = {} }) {
  const lines = [];
  lines.push(record.title);
  lines.push(record.summary);
  lines.push(`Type: ${record.class}${record.subclass ? ` / ${record.subclass.replace(/-/g, " ")}` : record.form ? ` / ${record.form}` : ""}. Brand: ${brandName || record.brand || "unknown"}. Product: ${record.product || "none identified"}.`);
  if (record.scene) lines.push(`Scene: ${record.scene}`);
  if (record.setting) lines.push(`Setting: ${record.setting}`);
  if (record.subjects?.length) lines.push(`Shows: ${record.subjects.join(", ")}.`);
  if (record.people?.count) lines.push(`People: ${record.people.count} (${record.people.framing || "framing unknown"}${record.people.visible_face ? ", face visible" : ""}${record.people.apparent_role ? `, ${record.people.apparent_role}` : ""}).`);
  if (record.creator?.count) lines.push(`Creator: ${record.creator.count} person, ${record.creator.framing || ""}, ${record.creator.energy || ""}, ${record.creator.wardrobe || ""}.`);
  if (record.capture) lines.push(`Capture: ${record.capture.device_read}; camera ${record.capture.camera_behavior}; reframing ${record.capture.reframing}; exposure ${record.capture.exposure}; imperfections ${(record.capture.imperfections || []).join(", ") || "none"}.`);
  if (record.structure) lines.push(`Hook (${record.structure.hook_type}): ${record.structure.hook}. Beats: ${(record.structure.beats || []).map((beat) => `${beat.t} ${beat.what}`).join("; ")}. CTA: ${record.structure.cta || "none"}.`);
  if (record.performance) lines.push(`Performance: ${record.performance}`);
  if (record.audio) lines.push(`Audio: speech ${record.audio.speech}; music ${record.audio.music}; sounds ${(record.audio.diegetic || []).join(", ") || "none"}.`);
  if (record.style) lines.push(`Look: ${record.style.look}; finish ${record.style.finish}${record.style.is_generated ? "; AI-generated or rendered" : ""}${record.style.is_photograph ? "; photograph" : ""}.`);
  if (record.colors?.length) lines.push(`Colours: ${record.colors.join(", ")}.`);
  const text = record.on_image_text?.length ? record.on_image_text : (record.on_screen_text || []).map((item) => item.text);
  if (text.length) lines.push(`Text on screen: ${text.join(" | ")}`);
  if (record.logos_present?.length) lines.push(`Logos: ${record.logos_present.join(", ")}.`);
  if (transcript?.text) lines.push(`Transcript: ${transcript.text.slice(0, 2000)}`);
  if (measured) lines.push(`Measured: ${measured.duration_s}s, ${measured.shot_count === 1 ? "single take, no cuts" : `${measured.shot_count} shots (avg ${measured.avg_shot_s}s)`}, ${measured.ratio}, ${measured.loudness_lufs ?? "silent"} LUFS, camera ${measured.camera_read}.`);
  if (probe.orientation) lines.push(`Orientation ${probe.orientation}${probe.width ? ` (${probe.width}x${probe.height})` : ""}${probe.hasAlpha ? ", transparent background" : ""}.`);
  lines.push(`Usable as: ${(record.reference_roles || []).join(", ") || "reference only"}. Quality ${record.usability?.quality ?? "?"}${record.usability?.watermarked ? ", watermarked" : ""}${record.usability?.outdated_or_wrong ? ", OUTDATED OR WRONG" : ""}. ${record.usability?.notes || ""}`);
  lines.push(`Tags: ${(record.tags || []).join(", ")}`);
  lines.push(`Path: ${relativePath}`);
  return lines.filter(Boolean).join("\n");
}

/**
 * Analyse one image file. Returns {record, searchDoc, ocrText, analyzer, images, usage, usd}.
 * `filePath` is the local copy; `relativePath` is the source path (for hints and the doc).
 */
export async function analyzeImageFile({ filePath, relativePath, probe, brandHint, cards, config, workDir, brandName }) {
  const modelPath = await modelImage(filePath, path.join(workDir, "model", `${probe.contentHash.slice(0, 16)}.jpg`));
  const prompt = imagePrompt({ cards, brandHint, relativePath, probe });
  const result = await analyzeImages({ provider: config.vision.provider, model: config.vision.model, prompt, images: [modelPath], schema: IMAGE_ANALYSIS_SCHEMA, name: "dam_image" });
  const problems = validateAnalysis(result.record);
  if (problems.length) throw new Error(`vision record invalid: ${problems.join("; ")}`);
  const record = result.record;
  const searchDoc = composeSearchDoc({ record, relativePath, brandName, probe });
  return {
    record, searchDoc, ocrText: (record.on_image_text || []).join("\n") || null,
    analyzer: { schema_version: ANALYSIS_SCHEMA_VERSION, vision: { provider: result.provider, model: result.model }, analyzed_at: new Date().toISOString() },
    modelImage: modelPath, usage: result.usage, usd: estimateUsd(result.model, "vision-image"),
  };
}

/** Analyse one video: measure → keyframes + contact sheet → transcript → model read. */
export async function analyzeVideoFile({ filePath, relativePath, probe, brandHint, cards, config, workDir, brandName, onSpend = async () => {} }) {
  const stem = probe.contentHash.slice(0, 16);
  const maxSeconds = Math.min(config.maxVideoSeconds, probe.durationS || config.maxVideoSeconds);
  const measured = await measureVideo(filePath, { durationS: probe.durationS, hasAudio: probe.hasAudio, width: probe.width, height: probe.height, fps: probe.fps, maxSeconds });
  const times = keyframeTimes(Math.min(probe.durationS || 0, maxSeconds), measured.cuts, config.keyframesPerVideo);
  const frames = await extractKeyframes(filePath, times, path.join(workDir, "frames", stem));
  const sheet = frames.length ? await contactSheet(frames, path.join(workDir, "sheets", `${stem}.jpg`)) : null;

  let transcript = null;
  let transcribeUsd = 0;
  if (probe.hasAudio) {
    try {
      const audioPath = await extractAudio(filePath, path.join(workDir, "audio", `${stem}.mp3`), { maxSeconds });
      const raw = await transcribeAudio(audioPath, { model: config.transcribe.model });
      transcript = { model: raw.model, language: raw.language, segments: raw.segments, ...speechStats(raw.segments) };
      transcribeUsd = estimateUsd(config.transcribe.model, "transcribe-minute", Math.max(0.25, (Math.min(probe.durationS || 0, maxSeconds)) / 60));
      await onSpend({ provider: "openai", model: config.transcribe.model, kind: "transcribe", usd: transcribeUsd });
    } catch (error) {
      transcript = { error: String(error.message).slice(0, 300) };
    }
  }

  const prompt = videoPrompt({ cards, brandHint, relativePath, measured, transcript, frames });
  const images = sheet ? [sheet] : frames.slice(0, 6).map((frame) => frame.path);
  const result = await analyzeImages({ provider: config.vision.provider, model: config.vision.model, prompt, images, schema: VIDEO_ANALYSIS_SCHEMA, name: "dam_video" });
  const problems = validateAnalysis(result.record, { video: true });
  if (problems.length) throw new Error(`vision record invalid: ${problems.join("; ")}`);
  const record = result.record;
  const searchDoc = composeSearchDoc({ record, relativePath, brandName, measured, transcript, probe });
  const visionUsd = estimateUsd(result.model, "vision-video");
  await onSpend({ provider: result.provider, model: result.model, kind: "vision", usd: visionUsd, tokensIn: result.usage?.tokensIn, tokensOut: result.usage?.tokensOut });
  return {
    record, searchDoc, measured, transcript, frames, sheet,
    ocrText: [(record.on_screen_text || []).map((item) => item.text).join("\n"), transcript?.text || ""].filter(Boolean).join("\n") || null,
    analyzer: { schema_version: ANALYSIS_SCHEMA_VERSION, vision: { provider: result.provider, model: result.model }, transcribe: transcript?.model ? { provider: "openai", model: transcript.model } : null, analyzed_at: new Date().toISOString() },
    usage: result.usage, usd: visionUsd + transcribeUsd,
  };
}

/**
 * Light analysis for videos over the download cap: keyframes are pulled from the Dropbox temporary link
 * with ranged seeks (megabytes, not gigabytes), the model reads the contact sheet, and the measured
 * layer is limited to what Dropbox metadata gives. Marked analysis_depth = "light" so a later pass with
 * a higher cap can upgrade it.
 */
export async function analyzeVideoLight({ url, relativePath, probe, brandHint, cards, config, workDir, brandName, onSpend = async () => {} }) {
  const stem = (probe.contentHash || "nohash").slice(0, 16);
  const durationS = probe.durationS || 60;
  const times = keyframeTimes(durationS, [], Math.min(config.keyframesPerVideo, 8));
  const frames = await extractKeyframesFromUrl(url, times, path.join(workDir, "frames", stem));
  if (!frames.length) throw new Error("light analysis: no keyframes could be read from the temporary link");
  const sheet = await contactSheet(frames, path.join(workDir, "sheets", `${stem}.jpg`));
  const measured = { duration_s: probe.durationS ? Math.round(probe.durationS * 100) / 100 : null, width: probe.width, height: probe.height, fps: null, ratio: probe.width && probe.height ? `${probe.width}x${probe.height}` : null, has_audio: null, cuts: [], shot_count: null, avg_shot_s: null, lane: "unmeasured", loudness_lufs: null, motion: { mean: null, jitter: null, stillRatio: null }, camera_read: "unmeasured", analysis_depth: "light" };
  const prompt = videoPrompt({ cards, brandHint, relativePath, measured: { ...measured, shot_count: "unmeasured (file too large for scene detection)", cuts: [], avg_shot_s: "n/a" }, transcript: null, frames });
  const result = await analyzeImages({ provider: config.vision.provider, model: config.vision.model, prompt, images: [sheet], schema: VIDEO_ANALYSIS_SCHEMA, name: "dam_video" });
  const problems = validateAnalysis(result.record, { video: true });
  if (problems.length) throw new Error(`vision record invalid: ${problems.join("; ")}`);
  const record = result.record;
  const searchDoc = composeSearchDoc({ record, relativePath, brandName, measured, transcript: null, probe });
  const usd = estimateUsd(result.model, "vision-video");
  await onSpend({ provider: result.provider, model: result.model, kind: "vision", usd, tokensIn: result.usage?.tokensIn, tokensOut: result.usage?.tokensOut });
  return { record, searchDoc, measured, transcript: null, frames, sheet, ocrText: (record.on_screen_text || []).map((item) => item.text).join("\n") || null,
    analyzer: { schema_version: ANALYSIS_SCHEMA_VERSION, depth: "light", vision: { provider: result.provider, model: result.model }, transcribe: null, analyzed_at: new Date().toISOString() }, usage: result.usage, usd };
}

/** Shot list from cuts + frames, for the shot-level index. */
export function shotsFromMeasured(measured, frames) {
  const boundaries = [0, ...measured.cuts, measured.duration_s || 0];
  const shots = [];
  for (let i = 0; i < boundaries.length - 1; i += 1) {
    const start = boundaries[i];
    const end = boundaries[i + 1];
    if (end - start < 0.2) continue;
    const frame = frames.find((item) => item.t >= start && item.t < end) || null;
    shots.push({ start: round(start), end: round(end), keyframe: frame?.path || null });
  }
  return shots.slice(0, 60);
}

function round(value) { return Math.round(value * 100) / 100; }
