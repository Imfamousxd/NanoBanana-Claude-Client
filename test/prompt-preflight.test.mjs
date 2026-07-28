import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { normalizeJob } from "../engine/core/job.mjs";
import { compilePrompt } from "../engine/prompts/compiler.mjs";
import { runPreflight } from "../engine/quality/preflight.mjs";

const graph = {
  nodes: [{
    id: "brand.nulumin",
    type: "brand",
    name: "NuLumin",
    aliases: ["nulumin"],
    complianceProfile: "regulated-health-ruo",
    promptProfile: {
      positioning: "Clinical-modern research brand.",
      mustPreserve: ["product geometry"],
      avoid: ["invented certifications"],
    },
  }],
};

function safeJob() {
  return normalizeJob({
    brand: "nulumin",
    mode: "ugc-image",
    objective: "Creator shows package craft without human-use implication.",
    audience: { persona: "Verifier", platform: "Reels", motivation: "inspect packaging" },
    deliverable: { aspectRatio: "9:16", candidates: 2 },
    provider: { id: "gemini-image" },
    assets: [],
    creative: {
      concept: "A creator pauses during an unboxing.",
      scene: "Lived-in home office.",
      creator: "Adult documentation-focused creator.",
      action: "Turns the sealed package to inspect its construction.",
      camera: "Handheld phone with a small exposure recovery.",
      style: "Natural phone rendering.",
      mustInclude: ["believable hand contact"],
      mustAvoid: ["human use"],
      onImageText: ["For Research Use Only. Not for Human Consumption."],
    },
    compliance: {
      profile: "regulated-health-ruo",
      requiredDisclosures: ["For Research Use Only. Not for Human Consumption."],
      humanReviewRequired: true,
      claimSourceIds: [],
    },
    output: { directory: "out", basename: "test" },
  });
}

test("UGC compiler emits operational layers and exact reference contract language", () => {
  const { prompt } = compilePrompt(safeJob(), graph);
  assert.match(prompt, /SOCIAL PURPOSE/);
  assert.match(prompt, /CAPTURE BEHAVIOR/);
  assert.match(prompt, /REFERENCE CONTRACT/);
  assert.match(prompt, /For Research Use Only/);
  assert.doesNotMatch(prompt, /8K|masterpiece/);
});

test("regulated preflight blocks dosing and outcome claims", () => {
  const job = safeJob();
  job.creative.action = "She explains my dosing protocol and says it cured her injury.";
  const { prompt, brand } = compilePrompt(job, graph);
  const result = runPreflight({ job, prompt, assets: [], brand });
  assert.equal(result.ok, false);
  assert(result.errors.some((issue) => issue.code === "HUMAN_USE_CONTENT"));
  assert(result.errors.some((issue) => issue.code === "OUTCOME_CLAIM"));
});

test("safe regulated preflight preserves mandatory human review and disclosure warning", () => {
  const job = safeJob();
  const { prompt, brand } = compilePrompt(job, graph);
  const result = runPreflight({ job, prompt, assets: [], brand });
  assert.equal(result.ok, true);
  assert(result.warnings.some((issue) => issue.code === "DETERMINISTIC_DISCLOSURE"));
});

test("claim IDs cannot bypass evidence checks without an approved current record", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "content-engine-claim-"));
  const job = safeJob();
  job.creative.onImageText.push("Third-party tested");
  job.compliance.claimSourceIds = ["claim.nulumin.missing"];
  const { prompt, brand } = compilePrompt(job, graph);
  const result = runPreflight({ root, job, prompt, assets: [], brand });
  assert.equal(result.ok, false);
  assert(result.errors.some((issue) => issue.code === "CLAIM_SOURCE_NOT_FOUND"));
  assert(result.errors.some((issue) => issue.code === "UNSOURCED_CLAIM"));
});
