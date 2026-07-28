import fs from "node:fs";
import path from "node:path";
import { EngineError } from "./errors.mjs";
import { readJson, resolveInside, slugify } from "./files.mjs";

const MODES = new Set(["ugc-image", "ugc-video", "product-image", "campaign-image", "campaign-video"]);
const PROVIDERS = new Set(["openai-image", "gemini-image", "google-omni-video", "google-veo", "replicate-seedance"]);
const IMAGE_PROVIDERS = new Set(["openai-image", "gemini-image"]);
const VIDEO_PROVIDERS = new Set(["google-omni-video", "google-veo", "replicate-seedance"]);
const IMAGE_RATIOS = new Set(["1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"]);

export function normalizeJob(input) {
  const job = structuredClone(input);
  job.version ??= 1;
  job.id ||= slugify(job.objective || "content-job");
  job.assets ??= [];
  job.audience ??= {};
  job.creative ??= {};
  job.creative.mustInclude ??= [];
  job.creative.mustAvoid ??= [];
  job.creative.onImageText ??= [];
  job.deliverable ??= {};
  job.deliverable.candidates ??= 2;
  job.deliverable.aspectRatio ??= job.mode?.includes("video") ? "9:16" : "4:5";
  job.provider ??= {};
  if (job.mode?.includes("video")) {
    job.deliverable.durationSeconds ??= job.provider.id === "google-veo" ? 8 : 5;
    job.deliverable.resolution ??= "1080p";
  }
  job.compliance ??= { profile: "general" };
  job.compliance.requiredDisclosures ??= [];
  job.execution ??= {};
  job.execution.approved ??= false;
  job.output ??= {};
  job.output.directory ??= `generations/${job.id}`;
  job.output.basename ??= job.id;
  return job;
}

export function validateJob(job, root, { requireApproval = false } = {}) {
  const errors = [];
  const warnings = [];
  const add = (collection, code, message, field) => collection.push({ code, message, field });

  if (job.version !== 1) add(errors, "UNSUPPORTED_VERSION", "Only content job version 1 is supported.", "version");
  if (!job.brand) add(errors, "REQUIRED", "brand is required.", "brand");
  if (!job.objective) add(errors, "REQUIRED", "objective is required.", "objective");
  if (!MODES.has(job.mode)) add(errors, "INVALID_MODE", `mode must be one of: ${[...MODES].join(", ")}.`, "mode");
  if (!PROVIDERS.has(job.provider?.id)) add(errors, "INVALID_PROVIDER", `provider.id must be one of: ${[...PROVIDERS].join(", ")}.`, "provider.id");

  const isVideo = job.mode?.includes("video");
  if (isVideo && !VIDEO_PROVIDERS.has(job.provider?.id)) add(errors, "CAPABILITY_MISMATCH", "Video jobs require a video provider.", "provider.id");
  if (!isVideo && job.mode && !IMAGE_PROVIDERS.has(job.provider?.id)) add(errors, "CAPABILITY_MISMATCH", "Image jobs require an image provider.", "provider.id");

  const candidates = job.deliverable?.candidates;
  if (!Number.isInteger(candidates) || candidates < 1 || candidates > 4) {
    add(errors, "INVALID_CANDIDATE_COUNT", "deliverable.candidates must be an integer from 1 to 4.", "deliverable.candidates");
  }
  if (!job.deliverable?.aspectRatio) add(errors, "REQUIRED", "deliverable.aspectRatio is required.", "deliverable.aspectRatio");
  if (!isVideo && !IMAGE_RATIOS.has(job.deliverable?.aspectRatio)) {
    add(errors, "UNSUPPORTED_IMAGE_RATIO", `Image aspect ratio must be one of: ${[...IMAGE_RATIOS].join(", ")}.`, "deliverable.aspectRatio");
  }
  if (isVideo && job.provider?.id === "replicate-seedance" && !(job.deliverable?.durationSeconds === -1 || (Number.isInteger(job.deliverable?.durationSeconds) && job.deliverable.durationSeconds >= 1 && job.deliverable.durationSeconds <= 15))) {
    add(errors, "INVALID_DURATION", "Seedance duration must be -1 (automatic) or an integer from 1 to 15.", "deliverable.durationSeconds");
  }
  if (isVideo && candidates > 1) {
    add(warnings, "VIDEO_COST", `${candidates} video candidates can be expensive; start with one identity/physics test.`, "deliverable.candidates");
  }
  if (job.provider?.id === "google-veo") {
    if (!["9:16", "16:9"].includes(job.deliverable?.aspectRatio)) add(errors, "VEO_ASPECT_RATIO", "Veo supports 9:16 or 16:9 output.", "deliverable.aspectRatio");
    if (![4, 6, 8].includes(job.deliverable?.durationSeconds)) add(errors, "VEO_DURATION", "Veo 3.1 supports 4, 6, or 8 second generations.", "deliverable.durationSeconds");
    if (["1080p", "4k"].includes(job.deliverable?.resolution) && job.deliverable.durationSeconds !== 8) {
      add(errors, "VEO_HIGH_RES_DURATION", "Veo 1080p and 4k generation requires an 8-second duration.", "deliverable");
    }
    if (job.assets.some((asset) => asset.role === "reference-image") && job.deliverable.durationSeconds !== 8) {
      add(errors, "VEO_REFERENCE_DURATION", "Veo reference-image generation requires an 8-second duration.", "deliverable.durationSeconds");
    }
    if (job.assets.some((asset) => asset.role === "last-frame") && !job.assets.some((asset) => asset.role === "first-frame")) {
      add(errors, "VEO_LAST_FRAME", "Veo last-frame interpolation requires a first frame.", "assets");
    }
  }
  if (job.provider?.id === "google-omni-video") {
    if (!["9:16", "16:9"].includes(job.deliverable?.aspectRatio)) add(errors, "OMNI_ASPECT_RATIO", "Gemini Omni Flash supports 9:16 or 16:9 output.", "deliverable.aspectRatio");
    if (job.assets.some((asset) => asset.role === "last-frame")) add(errors, "OMNI_LAST_FRAME_UNSUPPORTED", "Gemini Omni Flash does not support last-frame interpolation; use Veo for this job.", "assets");
    if (job.assets.some((asset) => asset.role === "reference-audio")) add(errors, "OMNI_AUDIO_REFERENCE_UNSUPPORTED", "Gemini Omni Flash does not currently support uploaded audio references.", "assets");
    if (job.assets.some((asset) => asset.role === "reference-video")) add(errors, "OMNI_VIDEO_REFERENCE_UNRELIABLE", "Gemini Omni Flash currently does not correctly process reference-video inputs; use images or another provider.", "assets");
  }

  const seenRoles = new Set();
  for (let index = 0; index < job.assets.length; index += 1) {
    const asset = job.assets[index];
    if (!asset.path || !asset.role) {
      add(errors, "INVALID_ASSET", "Every asset needs path and role.", `assets.${index}`);
      continue;
    }
    if (seenRoles.has(asset.role) && ["product-canon", "logo-canon", "mask", "first-frame", "last-frame"].includes(asset.role)) {
      add(warnings, "DUPLICATE_SINGLETON_ROLE", `Multiple assets use singleton role ${asset.role}.`, `assets.${index}.role`);
    }
    seenRoles.add(asset.role);
    try {
      const resolved = resolveInside(root, asset.path, `assets.${index}.path`);
      if (!fs.existsSync(resolved)) add(asset.required === false ? warnings : errors, "ASSET_NOT_FOUND", `Asset not found: ${asset.path}`, `assets.${index}.path`);
    } catch (error) {
      add(errors, error.code || "INVALID_ASSET_PATH", error.message, `assets.${index}.path`);
    }
  }

  if ((job.mode === "product-image" || /product|unbox|package|vial|bottle/i.test(`${job.objective} ${job.creative?.concept || ""}`)) && !seenRoles.has("product-canon")) {
    add(errors, "MISSING_PRODUCT_CANON", "Product-led work requires an asset with role product-canon.", "assets");
  }
  const seedanceReferenceRoles = new Set(["reference-image", "creator-canon", "character-canon", "product-canon", "style-reference", "environment-reference"]);
  if (job.provider?.id === "replicate-seedance" && seenRoles.has("first-frame") && job.assets.some((asset) => seedanceReferenceRoles.has(asset.role))) {
    add(errors, "SEEDANCE_INPUT_CONFLICT", "Seedance cannot combine a first frame with reference images.", "assets");
  }
  if (job.provider?.id === "replicate-seedance" && seenRoles.has("last-frame") && !seenRoles.has("first-frame")) {
    add(errors, "SEEDANCE_LAST_FRAME", "Seedance last-frame input requires a first frame.", "assets");
  }
  if (job.provider?.id === "gemini-image") {
    const imageReferenceCount = job.assets.filter((asset) => asset.role !== "mask").length;
    if (imageReferenceCount > 14) add(errors, "GEMINI_REFERENCE_LIMIT", "Gemini Pro Image accepts at most 14 total input images.", "assets");
    else if (imageReferenceCount > 5) add(warnings, "GEMINI_FIDELITY_LIMIT", "Gemini Pro Image supports up to 14 inputs, but use five or fewer when every reference needs high fidelity.", "assets");
  }
  if (job.provider?.id === "openai-image") {
    const model = job.provider.model || process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
    if (model.startsWith("gpt-image-2") && job.provider.background === "transparent") {
      add(errors, "OPENAI_TRANSPARENCY_UNSUPPORTED", "GPT Image 2 does not support transparent backgrounds.", "provider.background");
    }
    if (job.provider.outputFormat && !["png", "jpeg", "webp"].includes(job.provider.outputFormat)) {
      add(errors, "OPENAI_OUTPUT_FORMAT", "OpenAI image outputFormat must be png, jpeg, or webp.", "provider.outputFormat");
    }
    const size = job.provider.size;
    if (size && size !== "auto") {
      const match = /^(\d+)x(\d+)$/.exec(size);
      if (!match) add(errors, "OPENAI_IMAGE_SIZE", "OpenAI image size must be auto or WIDTHxHEIGHT.", "provider.size");
      else {
        const width = Number(match[1]);
        const height = Number(match[2]);
        const pixels = width * height;
        const ratio = Math.max(width, height) / Math.min(width, height);
        if (width % 16 || height % 16 || Math.max(width, height) > 3_840 || ratio > 3 || pixels < 655_360 || pixels > 8_294_400) {
          add(errors, "OPENAI_IMAGE_SIZE", "GPT Image 2 dimensions must be multiples of 16, at most 3840px per edge and 3:1, with 655,360–8,294,400 total pixels.", "provider.size");
        }
      }
    }
  }
  if (seenRoles.has("mask") && !job.assets.some((asset) => asset.role !== "mask" && asset.role !== "logo-canon")) {
    add(errors, "MASK_WITHOUT_BASE", "An edit mask requires at least one editable base/reference image.", "assets");
  }

  const copyWords = job.creative.onImageText.join(" ").trim().split(/\s+/).filter(Boolean).length;
  if (copyWords > 12 || job.creative.onImageText.length > 2) {
    add(warnings, "DETERMINISTIC_TYPE_RECOMMENDED", "Long or multi-block copy should be applied as a deterministic overlay after generation.", "creative.onImageText");
  }

  if (requireApproval && job.execution.approved !== true) {
    add(errors, "COST_NOT_APPROVED", "Billable execution is locked. Confirm scope/cost, then set execution.approved to true.", "execution.approved");
  }

  try {
    resolveInside(root, job.output.directory, "output.directory");
  } catch (error) {
    add(errors, error.code || "INVALID_OUTPUT_PATH", error.message, "output.directory");
  }
  return { errors, warnings, ok: errors.length === 0 };
}

export function loadJob(root, requestedPath) {
  const filePath = resolveInside(root, requestedPath, "job path");
  if (!fs.existsSync(filePath)) throw new EngineError("JOB_NOT_FOUND", `Job not found: ${requestedPath}`);
  return { path: filePath, job: normalizeJob(readJson(filePath)) };
}

export const providerCapabilities = { IMAGE_PROVIDERS, VIDEO_PROVIDERS };
