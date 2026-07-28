import fs from "node:fs";
import path from "node:path";
import { requireEnv } from "../core/env.mjs";
import { EngineError } from "../core/errors.mjs";
import { resolveInside, writeJsonAtomic } from "../core/files.mjs";
import { fetchWithRetry } from "../core/http.mjs";
import { retryLogger } from "../providers/common.mjs";
import { planJob } from "../pipeline.mjs";
import { inspectAsset } from "./asset-inspector.mjs";

const reviewSchema = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "summary", "scores", "defects", "iterationPrompt", "humanChecks"],
  properties: {
    verdict: { type: "string", enum: ["pass", "revise", "reject"] },
    summary: { type: "string" },
    scores: {
      type: "object",
      additionalProperties: false,
      required: ["briefCompliance", "brandFidelity", "productFidelity", "realism", "composition", "textIntegrity", "complianceSafety"],
      properties: {
        briefCompliance: { type: "integer", minimum: 0, maximum: 100 },
        brandFidelity: { type: "integer", minimum: 0, maximum: 100 },
        productFidelity: { type: "integer", minimum: 0, maximum: 100 },
        realism: { type: "integer", minimum: 0, maximum: 100 },
        composition: { type: "integer", minimum: 0, maximum: 100 },
        textIntegrity: { type: "integer", minimum: 0, maximum: 100 },
        complianceSafety: { type: "integer", minimum: 0, maximum: 100 }
      }
    },
    defects: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "severity", "evidence", "action"],
        properties: {
          category: { type: "string" },
          severity: { type: "string", enum: ["minor", "major", "critical"] },
          evidence: { type: "string" },
          action: { type: "string" }
        }
      }
    },
    iterationPrompt: { type: "string" },
    humanChecks: { type: "array", "items": { type: "string" } }
  }
};

function outputText(response) {
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && content.text) return content.text;
    }
  }
  return response.output_text || "";
}

export async function reviewImage(root, jobPath, imagePath) {
  const plan = planJob(root, jobPath);
  if (!plan.prompt || !plan.checks.ok) throw new EngineError("INVALID_REVIEW_JOB", "The job does not pass preflight; fix it before review.", plan.checks);
  const candidatePath = resolveInside(root, imagePath, "review image");
  if (!fs.existsSync(candidatePath)) throw new EngineError("REVIEW_ASSET_NOT_FOUND", `Review image not found: ${imagePath}`);
  const candidate = inspectAsset(root, { path: imagePath, role: "candidate" });
  if (candidate.media.kind !== "image") throw new EngineError("INVALID_REVIEW_ASSET", "The review candidate must be a supported image.");
  const apiKey = requireEnv("OPENAI_API_KEY", "OpenAI visual review");
  const model = process.env.CONTENT_REVIEW_MODEL || "gpt-5.6-sol";
  const content = [
    {
      type: "input_text",
      text: [
        "Act as a strict senior creative director, production retoucher, and compliance spot-checker.",
        "Evaluate observable evidence only. Do not reward polish when product geometry, text, realism, or compliance fails.",
        "Compare Candidate (first image) against each labeled canonical reference. Never invent unreadable text.",
        "A pass requires every score >= 85 and no major/critical defect. Legal/medical approval remains human.",
        `\nJOB\n${JSON.stringify(plan.job)}`,
        `\nCOMPILED BRIEF\n${plan.prompt}`,
        "\nCANDIDATE IMAGE FOLLOWS",
      ].join("\n"),
    },
    { type: "input_image", image_url: `data:${candidate.mime};base64,${fs.readFileSync(candidatePath).toString("base64")}`, detail: "original" },
  ];
  for (const asset of plan.assets.filter((item) => item.media.kind === "image").slice(0, 8)) {
    content.push({ type: "input_text", text: `CANONICAL REFERENCE — ${asset.role}: ${asset.path}` });
    content.push({ type: "input_image", image_url: `data:${asset.mime};base64,${fs.readFileSync(asset.absolutePath).toString("base64")}`, detail: "original" });
  }

  const response = await fetchWithRetry("https://api.openai.com/v1/responses", () => ({
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      reasoning: { effort: "high" },
      input: [{ role: "user", content }],
      text: { format: { type: "json_schema", name: "creative_review", strict: true, schema: reviewSchema } },
    }),
  }), { timeoutMs: 300_000, attempts: 4, retryNetworkErrors: false, onRetry: retryLogger("OpenAI review") });
  const data = await response.json();
  const text = outputText(data);
  if (!text) throw new EngineError("INVALID_REVIEW_RESPONSE", "OpenAI review returned no structured text.");
  let review;
  try {
    review = JSON.parse(text);
  } catch (error) {
    throw new EngineError("INVALID_REVIEW_RESPONSE", "OpenAI review was not valid JSON.", { text: text.slice(0, 1_000) }, error);
  }
  const result = {
    schemaVersion: 1,
    reviewedAt: new Date().toISOString(),
    model,
    jobPath,
    imagePath,
    automatedReviewIsAdvisory: true,
    ...review,
  };
  const reviewPath = path.join(path.dirname(candidatePath), `${path.basename(candidatePath)}.review.json`);
  writeJsonAtomic(reviewPath, result);
  return { reviewPath, review: result };
}
