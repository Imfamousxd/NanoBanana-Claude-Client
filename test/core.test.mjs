import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parseEnv } from "../engine/core/env.mjs";
import { fetchWithRetry } from "../engine/core/http.mjs";
import { normalizeJob, validateJob } from "../engine/core/job.mjs";
import { inspectImageBuffer } from "../engine/quality/asset-inspector.mjs";
import { buildOmniInput, extractOmniVideo } from "../engine/providers/google-omni-video.mjs";

test("parseEnv handles comments, export, quotes, and preserves hashes inside quotes", () => {
  const parsed = parseEnv(`
    # comment
    export OPENAI_API_KEY="sk-test#inside"
    GEMINI_API_KEY = value # trailing comment
    EMPTY=''
  `);
  assert.deepEqual(parsed, {
    OPENAI_API_KEY: "sk-test#inside",
    GEMINI_API_KEY: "value",
    EMPTY: "",
  });
});

test("PNG header inspection returns deterministic dimensions and alpha capability", () => {
  const buffer = Buffer.alloc(26);
  Buffer.from("89504e470d0a1a0a", "hex").copy(buffer, 0);
  buffer.writeUInt32BE(1080, 16);
  buffer.writeUInt32BE(1920, 20);
  buffer[24] = 8;
  buffer[25] = 6;
  assert.deepEqual(inspectImageBuffer(buffer, "image/png"), {
    mime: "image/png",
    width: 1080,
    height: 1920,
    bitDepth: 8,
    alphaChannel: true,
  });
});

test("fetchWithRetry retries a 429 and returns the next successful response", async () => {
  let calls = 0;
  const response = await fetchWithRetry("https://example.test", () => ({}), {
    attempts: 2,
    baseDelayMs: 1,
    fetchImpl: async () => {
      calls += 1;
      return calls === 1
        ? new Response("rate limited", { status: 429, headers: { "retry-after": "0" } })
        : new Response("ok", { status: 200 });
    },
  });
  assert.equal(calls, 2);
  assert.equal(await response.text(), "ok");
});

test("fetchWithRetry does not duplicate a billable submission after an ambiguous network failure", async () => {
  let calls = 0;
  await assert.rejects(
    fetchWithRetry("https://example.test", () => ({ method: "POST" }), {
      attempts: 4,
      retryNetworkErrors: false,
      fetchImpl: async () => {
        calls += 1;
        throw new Error("connection closed after upload");
      },
    }),
    (error) => error.code === "PROVIDER_NETWORK_ERROR",
  );
  assert.equal(calls, 1);
});

test("job validation blocks product work without canon and billable work without approval", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "content-engine-job-"));
  const job = normalizeJob({
    brand: "nulumin",
    mode: "ugc-image",
    objective: "Show a product unboxing",
    provider: { id: "gemini-image" },
    creative: { concept: "unbox", scene: "desk", action: "opens box" },
    output: { directory: "out", basename: "job" },
  });
  const result = validateJob(job, root, { requireApproval: true });
  assert.equal(result.ok, false);
  assert(result.errors.some((issue) => issue.code === "MISSING_PRODUCT_CANON"));
  assert(result.errors.some((issue) => issue.code === "COST_NOT_APPROVED"));
});

test("Gemini Omni inputs bind first-frame and reference roles deterministically", () => {
  const testFile = fileURLToPath(import.meta.url);
  const fake = (role) => ({ role, mime: "image/png", absolutePath: testFile });
  const assets = [fake("first-frame"), fake("product-canon")];
  const input = buildOmniInput("Move naturally.", assets);
  assert.equal(input.length, 3);
  assert.match(input.at(-1).text, /<FIRST_FRAME>@Image1/);
  assert.match(input.at(-1).text, /<IMAGE_REF_0>@Image2/);
  assert.equal(extractOmniVideo({ steps: [{ content: [{ type: "video", data: "abc" }] }] }).data, "abc");
});

test("provider validation rejects unsupported Omni interpolation and GPT Image 2 transparency", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "content-engine-provider-"));
  fs.writeFileSync(path.join(root, "frame.png"), "test");
  const base = {
    brand: "nulumin",
    objective: "Atmospheric abstract campaign",
    creative: { concept: "abstract", scene: "room", action: "light moves" },
    output: { directory: "out", basename: "job" },
  };
  const omni = normalizeJob({
    ...base,
    mode: "campaign-video",
    provider: { id: "google-omni-video" },
    assets: [{ path: "frame.png", role: "last-frame" }],
  });
  assert(validateJob(omni, root).errors.some((issue) => issue.code === "OMNI_LAST_FRAME_UNSUPPORTED"));

  const image = normalizeJob({
    ...base,
    mode: "campaign-image",
    provider: { id: "openai-image", background: "transparent" },
  });
  assert(validateJob(image, root).errors.some((issue) => issue.code === "OPENAI_TRANSPARENCY_UNSUPPORTED"));
});
