import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { EngineError, redact } from "../core/errors.mjs";
import { writeJsonAtomic, timestamp } from "../core/files.mjs";
import { downloadToBuffer } from "../core/http.mjs";
import { publicProviderResult, saveOutput } from "./common.mjs";

const execFileAsync = promisify(execFile);
const RATIOS = new Set(["auto", "1:1", "4:3", "3:4", "16:9", "21:9", "9:16", "3:2", "2:3"]);

// CLI auth stays in Higgsfield's credential store. Never put credentials in a job.
async function cli(args, { root, timeoutMs = 120_000 }) {
  let stdout;
  try {
    ({ stdout } = await execFileAsync("higgsfield", [...args, "--json"], {
      cwd: root, timeout: timeoutMs, maxBuffer: 8 * 1024 * 1024,
    }));
  } catch (error) {
    // execFile errors include the full command. Do not log those or retry a create.
    throw new EngineError("HIGGSFIELD_CLI_FAILED", `Higgsfield ${args.slice(0, 2).join(" ")} failed. Check account status and the saved receipt before retrying; submission may have succeeded.`, { reason: redact(String(error.stderr || "No CLI error detail.")).slice(0, 2000) });
  }
  try { return JSON.parse(stdout); }
  catch { throw new EngineError("HIGGSFIELD_RESPONSE", "Higgsfield returned invalid JSON; inspect account jobs before retrying."); }
}

export function higgsfieldArguments({ job, prompt, assets }) {
  const model = job.provider.model;
  if (model !== "gpt_image_2") throw new EngineError("HIGGSFIELD_MODEL", "This adapter currently supports the verified gpt_image_2 schema only.");
  const ratio = job.provider.aspectRatio || job.deliverable.aspectRatio;
  const resolution = (job.deliverable.imageSize || "2K").toLowerCase();
  const quality = job.deliverable.quality || "high";
  if (!RATIOS.has(ratio) || !["1k", "2k", "4k"].includes(resolution) || !["low", "medium", "high"].includes(quality)) {
    throw new EngineError("HIGGSFIELD_PARAMS", "Unsupported Higgsfield ratio, resolution, or quality. Use auto for a source-shaped master and apply final margins after generation.");
  }
  if (assets.some(a => a.role === "mask" || a.media.kind !== "image")) throw new EngineError("HIGGSFIELD_MEDIA", "This adapter accepts image references only; explicit masks are not yet supported.");
  if (job.provider.isInpaint === true) throw new EngineError("HIGGSFIELD_MASK_REQUIRED", "Higgsfield requires a mask for is_inpaint. Use ordinary reference edits with this adapter.");
  const args = [model, "--prompt", prompt, "--aspect-ratio", ratio, "--resolution", resolution, "--quality", quality];
  for (const asset of assets) args.push("--image", asset.absolutePath);
  return args;
}

export async function runHiggsfieldImage(context, dependencies = {}) {
  const { root, job } = context;
  const call = dependencies.cli || cli;
  const download = dependencies.download || downloadToBuffer;
  if (job.execution?.approved !== true) throw new EngineError("COST_NOT_APPROVED", "Approve scope and credits before Higgsfield execution.");
  const cap = job.provider.maxCredits;
  if (!Number.isFinite(cap) || cap <= 0) throw new EngineError("HIGGSFIELD_CREDIT_CAP", "provider.maxCredits must hold the approved positive credit cap for this job.");
  if (job.deliverable.candidates !== 1) throw new EngineError("HIGGSFIELD_CANDIDATES", "Use one candidate per job, with a distinct hypothesis and credit cap for each.");
  const args = higgsfieldArguments(context);
  const quote = await call(["generate", "cost", ...args], { root });
  if (!Number.isFinite(quote.credits) || quote.credits < 0 || quote.credits > cap) {
    throw new EngineError("HIGGSFIELD_CREDIT_CAP", "Current quote is missing or exceeds the approved job cap.", { quotedCredits: quote.credits ?? null, cap });
  }
  const receiptPath = path.join(root, job.output.directory, `${timestamp()}_${job.id}.higgsfield.json`);
  const receipt = { provider: "higgsfield-image", model: job.provider.model, jobId: job.id, quotedCredits: quote.credits, maxCredits: cap, status: "submitting", remoteJobs: [] };
  writeJsonAtomic(receiptPath, receipt);
  try {
    // A create is never automatically retried: a lost response can still incur a charge.
    const submission = await call(["generate", "create", ...args], { root });
    receipt.submission = publicProviderResult(submission);
    writeJsonAtomic(receiptPath, receipt);
    const rawJobs = Array.isArray(submission) ? submission : submission.jobs || submission.job_set?.jobs || [submission];
    const jobs = rawJobs.map(j => typeof j === "string" ? { id: j } : j);
    if (jobs.length !== 1 || !/^[0-9a-f-]{36}$/i.test(jobs[0]?.id || "")) throw new EngineError("HIGGSFIELD_RESPONSE", "Unexpected submission shape; inspect account jobs and do not resubmit automatically.");
    receipt.remoteJobs = jobs.map(({ id, status }) => ({ id, status }));
    receipt.status = "submitted";
    writeJsonAtomic(receiptPath, receipt);
    const finished = await call(["generate", "wait", jobs[0].id, "--timeout", "20m", "--interval", "5s", "--quiet"], { root, timeoutMs: 1_230_000 });
    const item = Array.isArray(finished) ? finished[0] : finished;
    if (item?.status !== "completed" || !item.result_url) throw new EngineError("HIGGSFIELD_OUTPUT", "Higgsfield job did not return a completed image. Use the saved remote job ID to inspect it.");
    const url = new URL(item.result_url);
    if (url.protocol !== "https:") throw new EngineError("HIGGSFIELD_OUTPUT", "Expected an HTTPS image result.");
    const buffer = await download(item.result_url);
    const ext = buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? "png"
      : buffer[0] === 255 && buffer[1] === 216 ? "jpg"
      : buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" ? "webp" : null;
    if (!ext) throw new EngineError("HIGGSFIELD_OUTPUT", "Downloaded result is not a recognized PNG, JPEG, or WebP.");
    const output = saveOutput(root, job, 0, ext, buffer);
    receipt.status = "completed";
    receipt.remoteJobs[0].status = "completed";
    receipt.output = path.relative(root, output);
    writeJsonAtomic(receiptPath, receipt);
    return { outputs: [output], provider: { id: "higgsfield-image", model: job.provider.model, transport: "official-cli", remoteJobIds: jobs.map(j => j.id) }, usage: { quotedCredits: quote.credits, maxCredits: cap, receipt: path.relative(root, receiptPath) } };
  } catch (error) {
    receipt.status = "needs-inspection";
    receipt.errorCode = error.code || "UNEXPECTED_ERROR";
    writeJsonAtomic(receiptPath, receipt);
    throw error;
  }
}
