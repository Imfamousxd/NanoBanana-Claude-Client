// Feedback — the human step that closes the loop. A verdict on a generation becomes durable memory:
//   approved  -> an exemplar (exact prompt + refs + provider) with a tracked copy of the image under
//                Brand Context/assets/<Brand>/approved/, and an `approved-output` entry in the brand's
//                product registry so the knowledge graph grows with every win
//   rejected  -> a law (or a strengthened existing law) with the reason as evidence, plus the prompt
//                snapshot kept as a negative example
//   revise    -> an event with the reason; a law only if one is supplied
// Stats per provider/category update on every verdict and feed the routing hint in context packs.
import fs from "node:fs";
import path from "node:path";
import { readJson, resolveInside, sha256File, slugify, writeJsonAtomic } from "../core/files.mjs";
import { EngineError } from "../core/errors.mjs";
import { relatedNodes } from "../knowledge/graph.mjs";
import { inspectImageBuffer } from "../quality/asset-inspector.mjs";
import { brandFolder } from "../assets/catalog.mjs";
import { appendVerdictMarker, findPromptLogEntry } from "./prompt-log.mjs";
import { loadLearnings, newEventId, recordStats, saveLearnings, upsertLaw } from "./store.mjs";

export const VERDICTS = new Set(["approved", "rejected", "revise"]);
const MAX_TRACKED_EDGE = 2048;

function relativeInside(root, requested, label) {
  const absolute = resolveInside(root, requested, label);
  return { absolute, relative: path.relative(root, absolute) };
}

async function copyTracked(root, brandNode, eventId, sourceRelative) {
  const source = path.resolve(root, sourceRelative);
  if (!fs.existsSync(source)) return null;
  const extension = path.extname(source).toLowerCase();
  const folder = path.join(root, "Brand Context", "assets", brandFolder(brandNode), "approved");
  fs.mkdirSync(folder, { recursive: true });
  const stem = `${eventId}__${slugify(path.basename(source, extension)).slice(0, 48)}`;
  if (![".png", ".jpg", ".jpeg", ".webp"].includes(extension)) {
    const destination = path.join(folder, `${stem}${extension}`);
    fs.copyFileSync(source, destination);
    return path.relative(root, destination);
  }
  try {
    const { default: sharp } = await import("sharp");
    const image = sharp(source, { failOn: "none" });
    const metadata = await image.metadata();
    const keepPng = metadata.hasAlpha && extension === ".png";
    const destination = path.join(folder, `${stem}.${keepPng ? "png" : "jpg"}`);
    let pipeline = image.rotate().resize({ width: MAX_TRACKED_EDGE, height: MAX_TRACKED_EDGE, fit: "inside", withoutEnlargement: true });
    pipeline = keepPng ? pipeline.png({ compressionLevel: 9 }) : pipeline.jpeg({ quality: 90, mozjpeg: true });
    await pipeline.toFile(destination);
    return path.relative(root, destination);
  } catch (error) {
    console.error(`[feedback] sharp copy failed, copying raw file: ${error.message}`);
    const destination = path.join(folder, `${stem}${extension}`);
    fs.copyFileSync(source, destination);
    return path.relative(root, destination);
  }
}

function registerApprovedOutput(root, graph, brandNode, exemplar) {
  const registries = relatedNodes(graph, brandNode.id, "has-products");
  if (!registries.length) return null;
  const registryNode = registries[0];
  const file = path.resolve(root, registryNode.path || registryNode.source);
  if (!fs.existsSync(file)) return null;
  const registry = readJson(file);
  const entry = { path: exemplar.tracked || exemplar.output.path, role: "approved-output", note: exemplar.reason, exemplar: exemplar.id, approvedAt: exemplar.createdAt.slice(0, 10), ...(exemplar.tracked && exemplar.output?.path !== exemplar.tracked ? { original: exemplar.output.path } : {}) };
  registry.approvedOutputs ??= [];
  registry.approvedOutputs.push({ product: exemplar.product || null, ...entry });
  let attachedTo = null;
  if (exemplar.product) {
    const needle = String(exemplar.product).toLowerCase();
    const product = (registry.products || []).find((item) => [item.sku, item.name, ...(item.aliases || [])].filter(Boolean).some((value) => String(value).toLowerCase() === needle));
    if (product) {
      product.references ??= [];
      product.references.push(entry);
      attachedTo = product.sku || product.name;
    }
  }
  registry.updatedAt = new Date().toISOString().slice(0, 10);
  writeJsonAtomic(file, registry);
  return { registry: path.relative(root, file), attachedTo };
}

/**
 * Record a verdict. `target` is a prompt-log id (pl_…) or an output file path; both are optional when
 * the prompt/provider/output are supplied directly (recording historical work that was never logged).
 */
export async function recordFeedback(root, graph, input) {
  const verdict = String(input.verdict || "").toLowerCase();
  if (!VERDICTS.has(verdict)) throw new EngineError("INVALID_VERDICT", `verdict must be one of ${[...VERDICTS].join(", ")}.`);
  if (!input.reason || String(input.reason).trim().length < 3) throw new EngineError("REASON_REQUIRED", "Every verdict needs a reason; it becomes the evidence line of the law or exemplar.");

  let entry = null;
  let outputRelative = null;
  if (input.target && String(input.target).startsWith("pl_")) {
    entry = findPromptLogEntry(root, graph, { id: input.target, brand: input.brand });
    if (!entry) throw new EngineError("LOG_ENTRY_NOT_FOUND", `No prompt-log entry ${input.target}.`);
  } else if (input.target) {
    outputRelative = relativeInside(root, input.target, "target").relative;
    entry = findPromptLogEntry(root, graph, { outputPath: outputRelative, brand: input.brand });
  }
  if (input.output) outputRelative = relativeInside(root, input.output, "output").relative;
  if (!outputRelative && entry?.outputs?.length) outputRelative = entry.outputs[0].path;

  const brandRequested = input.brand || entry?.brand;
  if (!brandRequested) throw new EngineError("BRAND_REQUIRED", "brand is required when the target is not a logged generation.");
  const { store, path: storePath, brandNode } = loadLearnings(root, graph, brandRequested);

  const prompt = input.prompt || entry?.prompt || null;
  if (!prompt && verdict !== "revise") throw new EngineError("PROMPT_REQUIRED", "No prompt found for this target; pass prompt (the exact text that produced the output) so the memory is reproducible.");
  const eventId = newEventId();
  const now = new Date().toISOString();
  const refs = (input.refs || entry?.refs || []).map((item) => (typeof item === "string" ? { path: item } : item));
  const provider = input.provider || entry?.provider || null;
  const model = input.model || entry?.model || null;
  const category = input.category || entry?.category || null;
  const product = input.product || entry?.product || null;

  let output = null;
  if (outputRelative) {
    const absolute = path.resolve(root, outputRelative);
    output = { path: outputRelative };
    if (fs.existsSync(absolute)) {
      output.sha256 = sha256File(absolute);
      const info = /\.(png|jpe?g|webp)$/i.test(absolute) ? inspectImageBuffer(fs.readFileSync(absolute)) : null;
      if (info) { output.width = info.width; output.height = info.height; }
    }
  }

  const event = {
    id: eventId, ts: now, verdict, reason: String(input.reason).trim(), tags: input.tags || [], category, product,
    provider, model, logEntryId: entry?.id || null, jobId: entry?.jobId || input.jobId || null,
    prompt, refs, output, notes: input.notes || null, by: input.by || process.env.USER || null,
  };
  store.events.push(event);
  recordStats(store, { verdict, provider, model, category });

  const result = { event, store: path.relative(root, storePath), brand: brandNode.id };
  if (verdict === "approved") {
    if (!output) throw new EngineError("OUTPUT_REQUIRED", "An approval needs the output file (target path or output) so the exemplar can be saved.");
    const tracked = input.copy === false ? null : await copyTracked(root, brandNode, eventId, output.path);
    const exemplar = {
      id: `ex_${eventId.slice(3)}`, eventId, createdAt: now, category, product, provider, model, prompt, refs, output, tracked,
      tags: input.tags || [], reason: event.reason, notes: input.notes || null, params: input.params || entry?.params || null,
    };
    store.exemplars.push(exemplar);
    event.exemplarId = exemplar.id;
    result.exemplar = exemplar;
    result.registry = registerApprovedOutput(root, graph, brandNode, exemplar);
    if (input.law?.claim) {
      const { law, created } = upsertLaw(store, brandNode, { ...input.law, appliesTo: input.law.appliesTo || category || product, evidence: `approved ${output.path}: ${event.reason}`, category, tags: input.tags, eventId, source: `feedback:${eventId}` });
      event.lawId = law.id;
      result.law = { ...law, created };
    }
  } else {
    const lawInput = input.law?.claim ? input.law : verdict === "rejected" ? { claim: event.reason } : null;
    if (lawInput) {
      const { law, created } = upsertLaw(store, brandNode, {
        ...lawInput,
        appliesTo: lawInput.appliesTo || category || product || "all",
        evidence: `${verdict} ${output?.path || entry?.id || "unlogged output"}${provider ? ` (${provider}${model ? `/${model}` : ""})` : ""}: ${event.reason}`,
        category, tags: input.tags, eventId, source: `feedback:${eventId}`,
      });
      event.lawId = law.id;
      result.law = { ...law, created };
    }
  }
  saveLearnings(storePath, store);
  appendVerdictMarker(root, graph, { brand: brandNode.id, logEntryId: entry?.id, verdict, reason: event.reason, eventId });
  return result;
}
