import { EngineError } from "../core/errors.mjs";
import { resolveBrand } from "../knowledge/graph.mjs";

function bullets(values) {
  return values.filter(Boolean).map((value) => `- ${value}`).join("\n");
}

function referenceSection(job) {
  const references = job.assets.filter((asset) => asset.role !== "mask");
  if (!references.length) return "No reference assets supplied.";
  return references.map((asset, index) => {
    const role = asset.role.toUpperCase().replaceAll("-", " ");
    const instruction = asset.instructions ? ` ${asset.instructions}` : "";
    return `- Reference ${index + 1} — ${role}: ${asset.path}.${instruction}`;
  }).join("\n");
}

function brandSection(brand) {
  const profile = brand?.promptProfile;
  if (!profile) return `Brand: ${brand?.name || "Use only supplied brand facts and references."}`;
  return [
    `Brand positioning: ${profile.positioning || brand.name}`,
    profile.palette?.length ? `Palette: ${profile.palette.join("; ")}` : "",
    profile.visualLanguage?.length ? `Visual language: ${profile.visualLanguage.join("; ")}` : "",
    profile.mustPreserve?.length ? `Brand invariants: ${profile.mustPreserve.join("; ")}` : "",
  ].filter(Boolean).join("\n");
}

function compileUgc(job, brand) {
  const { creative, audience, deliverable } = job;
  const isVideo = job.mode === "ugc-video";
  const beats = (creative.beats || []).map((beat) => {
    const parts = [`${beat.time}: ${beat.action}`];
    if (beat.camera) parts.push(`Camera: ${beat.camera}`);
    if (beat.sound) parts.push(`Sound: ${beat.sound}`);
    return `- ${parts.join(" ")}`;
  }).join("\n");

  const avoid = [...(brand?.promptProfile?.avoid || []), ...(creative.mustAvoid || [])];
  return [
    `Create one ${isVideo ? `${deliverable.durationSeconds}-second ` : ""}${audience.platform || "platform-native"} creator-led ${isVideo ? "video" : "image"} in ${deliverable.aspectRatio}.`,
    "",
    "SOCIAL PURPOSE",
    creative.concept,
    `Audience: ${audience.persona || "specified target creator audience"}. Motivation: ${audience.motivation || "show one credible observation"}.`,
    "",
    "CREATOR AND PERFORMANCE",
    creative.creator || "An adult creator who naturally belongs in this setting and has a clear reason to record.",
    `Observable action: ${creative.action}`,
    creative.dialogue ? `Exact spoken dialogue: "${creative.dialogue}"` : "",
    "",
    "ENVIRONMENT",
    creative.scene,
    creative.lighting ? `Lighting behavior: ${creative.lighting}` : "",
    "",
    "CAPTURE BEHAVIOR",
    creative.camera || "Handheld phone capture whose framing reacts to the creator's movement.",
    `Finish: ${creative.style || "natural platform-native phone rendering with coherent, causally correct imperfections"}`,
    creative.sound ? `Sound: ${creative.sound}` : "",
    isVideo && beats ? `\nTIMED BEATS\n${beats}` : "",
    "",
    "REFERENCE CONTRACT",
    referenceSection(job),
    "Treat each role literally. Preserve declared identity/product invariants; do not copy unrelated content from a reference.",
    "",
    "BRAND CONTRACT",
    brandSection(brand),
    "",
    "MUST INCLUDE",
    bullets(creative.mustInclude || []) || "- A physically believable, coherent captured moment.",
    creative.onImageText?.length ? `\nEXACT VISIBLE TEXT\n${bullets(creative.onImageText.map((text) => `Render exactly: ${JSON.stringify(text)}`))}\nNo other invented copy.` : "",
    job.compliance.requiredDisclosures?.length ? `\nCOMPLIANCE PLACEMENT\n${bullets(job.compliance.requiredDisclosures.map((text) => `Keep a calm, legible placement for exact disclosure: ${JSON.stringify(text)}`))}` : "",
    "",
    "DO NOT INTRODUCE",
    bullets(avoid) || "- Unrequested text, logos, products, people, or claims.",
    "- Do not turn this into glossy commercial key art. Do not add generic cinematic prestige effects.",
  ].filter((line) => line !== "").join("\n");
}

function compileStandard(job, brand) {
  const { creative, deliverable } = job;
  const avoid = [...(brand?.promptProfile?.avoid || []), ...(creative.mustAvoid || [])];
  return [
    `Create one ${job.mode.replace("-", " ")} in ${deliverable.aspectRatio}.`,
    `Objective: ${job.objective}`,
    `Concept: ${creative.concept}`,
    `Scene and composition: ${creative.scene}`,
    `Primary action: ${creative.action}`,
    creative.camera ? `Camera/framing: ${creative.camera}` : "",
    creative.lighting ? `Lighting: ${creative.lighting}` : "",
    creative.style ? `Finish: ${creative.style}` : "",
    "",
    "REFERENCE CONTRACT",
    referenceSection(job),
    creative.contract ? `\nPRODUCT CONTRACT — reproduce verbatim, do not paraphrase\n${creative.contract}` : "",
    "",
    "BRAND CONTRACT",
    brandSection(brand),
    "",
    "MUST INCLUDE",
    bullets(creative.mustInclude || []) || "- Fulfill the stated objective without inventing details.",
    creative.onImageText?.length ? `\nEXACT VISIBLE TEXT\n${bullets(creative.onImageText.map((text) => `Render exactly: ${JSON.stringify(text)}`))}\nNo other invented copy.` : "",
    "",
    "DO NOT INTRODUCE",
    bullets(avoid) || "- Unrequested text, marks, or objects.",
  ].filter((line) => line !== "").join("\n");
}

export function compilePrompt(job, graph) {
  const brand = resolveBrand(graph, job.brand);
  if (!brand) throw new EngineError("UNKNOWN_BRAND", `Brand ${job.brand} is not registered in knowledge/graph.json.`);
  const prompt = job.mode.startsWith("ugc-") ? compileUgc(job, brand) : compileStandard(job, brand);
  return {
    prompt,
    brand,
    retrievalQuery: [brand.name, job.mode, job.objective, job.audience?.persona].filter(Boolean).join(" "),
  };
}
