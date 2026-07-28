import fs from "node:fs";
import path from "node:path";
import { readJson } from "../core/files.mjs";

const UGC_PRESTIGE_TERMS = [
  /\b8k\b/i,
  /\bmasterpiece\b/i,
  /\baward[- ]winning\b/i,
  /\bperfect skin\b/i,
  /\bstudio lighting\b/i,
  /\bcinematic(?: lens| commercial| masterpiece)?\b/i,
];

const HUMAN_USE_PATTERNS = [
  /\b(?:inject|injection|reconstitut(?:e|ion)|administer|ingest|consume|titration)\b/i,
  /\b(?:my|your|a)\s+(?:dose|dosing|protocol|cycle)\b/i,
  /\b(?:take|use)\s+\d+(?:\.\d+)?\s*(?:mg|mcg|ml)\b/i,
];

const OUTCOME_PATTERNS = [
  /\b(?:cure|treat|prevent|reverse)(?:s|d|ing)?\b/i,
  /\b(?:healed|fixed)\s+(?:my|your|their)\b/i,
  /\b(?:safe|effective|clinically proven)\b/i,
  /\b(?:weight[- ]loss|lose weight|before and after)\b/i,
];

const EVIDENCE_CLAIMS = [
  /\b\d+(?:\.\d+)?%\s+purity\b/i,
  /\b(?:cGMP|FDA[- ]approved|certified|third[- ]party tested|made in (?:the )?USA)\b/i,
  /\b(?:HPLC|mass spec)\s+(?:verified|confirmed|tested)\b/i,
];

function push(issues, severity, code, message, field) {
  issues.push({ severity, code, message, field });
}

function positiveCreativeText(job) {
  return [
    job.creative.action,
    job.creative.dialogue,
    ...(job.creative.mustInclude || []),
    ...(job.creative.onImageText || []),
  ].filter(Boolean).join("\n");
}

function validateClaimSources(root, job, issues) {
  const valid = [];
  for (const id of job.compliance.claimSourceIds || []) {
    const filePath = root ? path.join(root, "knowledge", "claims", `${id}.json`) : "";
    if (!filePath || !fs.existsSync(filePath)) {
      push(issues, "error", "CLAIM_SOURCE_NOT_FOUND", `Claim source record not found: ${id}`, "compliance.claimSourceIds");
      continue;
    }
    const record = readJson(filePath);
    if (record.id !== id || record.status !== "approved") {
      push(issues, "error", "CLAIM_SOURCE_NOT_APPROVED", `Claim source ${id} is not an approved matching record.`, "compliance.claimSourceIds");
      continue;
    }
    if (record.reviewAfter && Date.parse(record.reviewAfter) < Date.now()) {
      push(issues, "error", "CLAIM_SOURCE_EXPIRED", `Claim source ${id} passed its review date ${record.reviewAfter}.`, "compliance.claimSourceIds");
      continue;
    }
    const brandAliases = new Set([job.brand, `brand.${job.brand}`]);
    if (record.brand && !brandAliases.has(record.brand)) {
      push(issues, "error", "CLAIM_SOURCE_BRAND_MISMATCH", `Claim source ${id} belongs to ${record.brand}, not ${job.brand}.`, "compliance.claimSourceIds");
      continue;
    }
    valid.push(record);
  }
  return valid;
}

export function runPreflight({ root, job, prompt, assets, brand }) {
  const issues = [];
  const positiveText = positiveCreativeText(job);
  const positiveUgcStyle = [job.creative.camera, job.creative.lighting, job.creative.style].filter(Boolean).join(" ");
  const regulatedRuo = (job.compliance.profile || brand.complianceProfile) === "regulated-health-ruo";
  const validClaimSources = validateClaimSources(root, job, issues);

  if (regulatedRuo) {
    for (const pattern of HUMAN_USE_PATTERNS) {
      if (pattern.test(positiveText)) push(issues, "error", "HUMAN_USE_CONTENT", "Research-use-only creative cannot depict or instruct human use, dosing, injection, or reconstitution.", "creative");
    }
    for (const pattern of OUTCOME_PATTERNS) {
      if (pattern.test(positiveText)) push(issues, "error", "OUTCOME_CLAIM", "Research-use-only creative cannot make outcome, safety, efficacy, or treatment claims.", "creative");
    }
    const required = "For Research Use Only. Not for Human Consumption.";
    if (!(job.compliance.requiredDisclosures || []).includes(required)) {
      push(issues, "error", "MISSING_RUO_DISCLOSURE", `Add the exact required disclosure: ${required}`, "compliance.requiredDisclosures");
    }
    if (EVIDENCE_CLAIMS.some((pattern) => pattern.test(positiveText)) && !validClaimSources.length) {
      push(issues, "error", "UNSOURCED_CLAIM", "Purity, testing, certification, origin, and regulatory claims require approved source IDs.", "compliance.claimSourceIds");
    }
    if ((job.creative.onImageText || []).some((text) => text === required)) {
      push(issues, "warning", "DETERMINISTIC_DISCLOSURE", "Render the legal disclosure as a deterministic overlay and verify final legibility; model-generated type is not sufficient.", "creative.onImageText");
    }
    if (job.compliance.humanReviewRequired !== true) {
      push(issues, "error", "HUMAN_REVIEW_REQUIRED", "This compliance profile requires explicit human review.", "compliance.humanReviewRequired");
    }
  }

  if (job.mode.startsWith("ugc-")) {
    for (const pattern of UGC_PRESTIGE_TERMS) {
      if (pattern.test(positiveUgcStyle)) push(issues, "warning", "UGC_PRESTIGE_LANGUAGE", `UGC realism is weakened by generic prestige term ${pattern}. Describe observable capture behavior instead.`, "creative.style");
    }
    if (!job.creative.creator) push(issues, "warning", "MISSING_CREATOR_DIRECTION", "UGC needs a specific creator behavior/casting brief, not only a scene.", "creative.creator");
    if (job.mode === "ugc-video" && !(job.creative.beats || []).length) push(issues, "warning", "MISSING_BEAT_SHEET", "UGC video should define observable timed beats.", "creative.beats");
  }

  const productAsset = assets.find((asset) => asset.role === "product-canon");
  for (const asset of assets.filter((item) => item.extensionMismatch)) {
    push(issues, "warning", "MIME_EXTENSION_MISMATCH", `${asset.path} is encoded as ${asset.mime} but named as ${asset.extensionMime}; normalize it before production API use.`, "assets");
  }
  if (productAsset?.media?.kind === "image") {
    const { width, height } = productAsset.media;
    if (width && height && Math.min(width, height) < 768) {
      push(issues, "warning", "LOW_RES_PRODUCT_CANON", "Product canon is below 768px on its short edge; label and geometry fidelity may drift.", "assets");
    }
  }

  if (job.provider.id === "replicate-seedance") {
    for (const asset of assets.filter((item) => item.role === "reference-image")) {
      const longest = Math.max(asset.media.width || 0, asset.media.height || 0);
      if (longest > 1024) push(issues, "warning", "SEEDANCE_REFERENCE_SIZE", "Downscale Seedance reference images to a 1024px longest edge to reduce upload/time-out failures.", asset.path);
    }
  }

  // A verbatim product contract is deliberately long and must not be trimmed, so it does not count
  // toward the prose-bloat heuristic.
  const authoredLength = prompt.length - (job.creative.contract?.length || 0);
  if (authoredLength > 7_500) push(issues, "warning", "PROMPT_TOO_LONG", "Compiled prompt is long; remove repeated or non-operational prose.", "compiledPrompt");
  const errors = issues.filter((issue) => issue.severity === "error");
  return { ok: errors.length === 0, errors, warnings: issues.filter((issue) => issue.severity === "warning"), issues };
}
