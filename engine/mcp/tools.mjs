// MCP tool surface for the content engine. Each tool is a plain {name, description, inputSchema, handler}
// so the same table serves the stdio server (server.mjs), tests, and any future HTTP transport.
// Handlers return JSON-serialisable objects; the server wraps them. Errors are EngineErrors, redacted.
import path from "node:path";
import { spawn } from "node:child_process";
import { z } from "zod";
import { serializeError } from "../core/errors.mjs";
import { loadGraph, relatedNodes, resolveBrand } from "../knowledge/graph.mjs";
import { buildKnowledgeIndex, listCategories, loadKnowledgeIndex } from "../knowledge/indexer.mjs";
import { queryKnowledge } from "../knowledge/retrieval.mjs";
import { executeJob, planJob } from "../pipeline.mjs";
import { reviewImage } from "../quality/openai-judge.mjs";
import { runDoctor } from "../doctor.mjs";
import { buildAssetCatalog, listProducts, searchAssets } from "../assets/catalog.mjs";
import { buildGallery } from "../assets/gallery.mjs";
import { buildContextPack, buildContextPackWithDam } from "../learning/context.mjs";
import { recordFeedback } from "../learning/feedback.mjs";
import { collectLaws, searchLaws } from "../learning/laws.mjs";
import { appendPromptLog, readPromptLog } from "../learning/prompt-log.mjs";
import { listLearningStores, loadLearnings, requireBrand, saveLearnings, upsertLaw } from "../learning/store.mjs";
import { createDamTools } from "../dam/mcp-tools.mjs";

const brandField = z.string().describe("Brand id or alias: nulumin | muha | dialed-health | dialed-moods | dialed-labs | noble-harbor | stanton");
const fileRef = z.union([z.string(), z.object({ path: z.string(), role: z.string().optional(), sha256: z.string().optional() })]);

function brandSummary(root, graph, brandNode) {
  const catalog = buildAssetCatalog(root, graph, { brand: brandNode.id });
  const products = listProducts(catalog, brandNode.id);
  const learnings = listLearningStores(root, graph).find((item) => item.brand === brandNode.id);
  return {
    id: brandNode.id,
    name: brandNode.name,
    aliases: brandNode.aliases || [],
    complianceProfile: brandNode.complianceProfile,
    brandDoc: brandNode.source,
    pack: brandNode.pack || null,
    registries: [...relatedNodes(graph, brandNode.id, "has-products"), ...relatedNodes(graph, brandNode.id, "has-memes")].map((node) => ({ id: node.id, path: node.path || node.source })),
    assets: { total: catalog.items.length, onDisk: catalog.items.filter((item) => item.exists).length, tracked: catalog.items.filter((item) => item.tracked).length, banned: catalog.items.filter((item) => item.banned).length },
    products: products.length,
    learnings: learnings ? { laws: learnings.laws, exemplars: learnings.exemplars, events: learnings.events, verdicts: learnings.verdicts } : null,
  };
}

export function createTools(root) {
  const graph = () => loadGraph(root);
  return [
    ...createDamTools(root, graph),
    {
      name: "brand_list",
      title: "List brands",
      description: "Every brand the knowledge graph knows, with aliases, compliance profile, registry paths, asset counts and learning-store size. Call first to resolve a brand id.",
      inputSchema: {},
      handler: () => {
        const g = graph();
        return { brands: g.nodes.filter((node) => node.type === "brand").map((node) => brandSummary(root, g, node)) };
      },
    },
    {
      name: "brand_get",
      title: "Brand profile",
      description: "One brand in depth: prompt profile (positioning, palette, invariants, avoid list), compliance profile, locked rules from its product registry, products with reference counts, known gaps, learning stats.",
      inputSchema: { brand: brandField },
      handler: ({ brand }) => {
        const g = graph();
        const brandNode = requireBrand(g, brand);
        const summary = brandSummary(root, g, brandNode);
        const catalog = buildAssetCatalog(root, g, { brand: brandNode.id });
        const compliance = g.nodes.find((node) => node.type === "compliance-profile" && node.id === `compliance.${brandNode.complianceProfile}`) || null;
        const { pack } = buildContextPack(root, g, { brand: brandNode.id, brief: brandNode.name, limit: 3 });
        return { ...summary, promptProfile: brandNode.promptProfile || null, compliance, locked: pack.locked, gaps: pack.gaps, banned: pack.banned, products: listProducts(catalog, brandNode.id), logos: pack.logos };
      },
    },
    {
      name: "assets_search",
      title: "Search brand assets",
      description: "Find reference images/videos for a brand: canonical product refs, logos, style anchors, approved outputs, cutouts. Filters: product (sku/name substring), role (canonical|logo|style|shape|approved-output|cutout|reference|asset|brand-asset), free-text query. Reports whether each file exists on this disk and is tracked in git. Banned files are hidden unless includeBanned.",
      inputSchema: {
        brand: brandField.optional(),
        product: z.string().optional().describe("Product sku or name substring, e.g. NUL-V-BPC-10, 'blue glacier', 'dual flavor'"),
        role: z.string().optional(),
        query: z.string().optional(),
        existingOnly: z.boolean().optional().default(false),
        includeBanned: z.boolean().optional().default(false),
        withDimensions: z.boolean().optional().default(false).describe("Read image headers for width/height (slower)"),
        limit: z.number().int().min(1).max(200).optional().default(40),
      },
      handler: ({ brand, ...options }) => {
        const g = graph();
        const brandNode = brand ? requireBrand(g, brand) : undefined;
        const catalog = buildAssetCatalog(root, g, { brand: brandNode?.id });
        const items = searchAssets(catalog, { ...options, brand: brandNode?.id });
        return { count: items.length, catalogSize: catalog.items.length, items: items.map(({ absolutePath, ...item }) => ({ ...item, absolutePath })) };
      },
    },
    {
      name: "assets_products",
      title: "List products",
      description: "Products per brand with how many references each has (canonical count, files on disk, roles). Use to pick the exact sku/name before assets_search or context_pack.",
      inputSchema: { brand: brandField.optional() },
      handler: ({ brand }) => {
        const g = graph();
        const brandNode = brand ? requireBrand(g, brand) : undefined;
        return { products: listProducts(buildAssetCatalog(root, g, { brand: brandNode?.id }), brandNode?.id) };
      },
    },
    {
      name: "assets_gallery",
      title: "Build asset gallery",
      description: "Build the browsable HTML gallery of every catalogued asset (thumbnails, product/role filters, search, copy-path) at .content-engine/gallery/index.html. Set open=true to open it in the default browser (macOS).",
      inputSchema: { brand: brandField.optional(), thumbs: z.boolean().optional().default(true), open: z.boolean().optional().default(false) },
      handler: async ({ brand, thumbs, open }) => {
        const g = graph();
        const brandNode = brand ? requireBrand(g, brand) : undefined;
        const result = await buildGallery(root, g, { brand: brandNode?.id, thumbs });
        if (open && process.platform === "darwin") spawn("open", [result.indexPath], { stdio: "ignore", detached: true }).unref();
        return { ...result, indexPath: result.indexPath, relativePath: path.relative(root, result.indexPath) };
      },
    },
    {
      name: "knowledge_query",
      title: "Query knowledge",
      description: "Ranked retrieval over the knowledge graph and brand documents. category is a hard scope (knowledge_categories lists them: product-assets, memes, brand, brand-pack, ugc, compliance, characters, providers, learnings).",
      inputSchema: { query: z.string(), brand: brandField.optional(), category: z.string().optional(), limit: z.number().int().min(1).max(30).optional().default(8) },
      handler: ({ query, brand, category, limit }) => {
        const g = graph();
        const index = loadKnowledgeIndex(root);
        const results = queryKnowledge(index, g, query, { brand, category, limit });
        return { count: results.length, results };
      },
    },
    {
      name: "knowledge_categories",
      title: "List knowledge categories",
      description: "Context categories with chunk counts, descriptions and entry documents.",
      inputSchema: {},
      handler: () => ({ categories: listCategories(loadKnowledgeIndex(root), graph()) }),
    },
    {
      name: "knowledge_rebuild",
      title: "Rebuild knowledge index",
      description: "Force a rebuild of the lexical knowledge index (normally automatic when sources change).",
      inputSchema: {},
      handler: () => {
        const index = buildKnowledgeIndex(root, { write: true });
        return { ok: true, chunks: index.chunks.length, sources: index.sourceStats.length };
      },
    },
    {
      name: "context_pack",
      title: "Context pack for a brief",
      description: "CALL THIS BEFORE WRITING ANY PROMPT. Joins brand invariants, exact reference files for the products the brief mentions, banned files, locked rules, learned laws, approved exemplars (with the prompts that made them), recent rejections, compliance and provider routing into one pack plus a paste-ready promptBlock.",
      inputSchema: {
        brand: brandField,
        brief: z.string().describe("What you are about to make, in plain words"),
        category: z.string().optional().describe("Context category or content kind: product-image | campaign-image | ugc-image | ugc-video | campaign-video | memes | lifestyle | packshot …"),
        mode: z.string().optional().describe("Engine mode if known (product-image, campaign-video, …)"),
        products: z.array(z.string()).optional().describe("Explicit product skus/names when the brief does not name them"),
        limit: z.number().int().min(1).max(20).optional().default(6),
      },
      handler: (args) => buildContextPackWithDam(root, graph(), args),
    },
    {
      name: "prompt_log",
      title: "Log a prompt",
      description: "Log a generation you ran (any provider, any script) so it can receive a verdict later. Returns the log id. Engine runs via job_run log automatically. Include the exact prompt, provider/model, reference files and output files.",
      inputSchema: {
        brand: brandField,
        prompt: z.string(),
        provider: z.string().describe("openai-image | gemini-image | higgsfield-image | replicate-seedance | google-veo | modelark-seedance | minimax | … (free text)"),
        model: z.string().optional(),
        params: z.record(z.string(), z.any()).optional(),
        refs: z.array(fileRef).optional(),
        outputs: z.array(fileRef).optional(),
        category: z.string().optional(),
        product: z.string().optional(),
        jobId: z.string().optional(),
        notes: z.string().optional(),
        costUsd: z.number().optional(),
        negativePrompt: z.string().optional(),
      },
      handler: (args) => {
        const entry = appendPromptLog(root, graph(), { ...args, source: "mcp" });
        if (!entry) throw new Error("prompt log write failed; see server stderr");
        return { id: entry.id, ts: entry.ts, brand: entry.brand, outputs: entry.outputs.length, refs: entry.refs.length };
      },
    },
    {
      name: "prompt_log_search",
      title: "Search the prompt log",
      description: "What has been tried: prompts, providers, refs, outputs and any verdict, newest first. Filter by brand, free text, or verdict (approved|rejected|revise|none).",
      inputSchema: { brand: brandField.optional(), query: z.string().optional(), verdict: z.string().optional(), limit: z.number().int().min(1).max(200).optional().default(25) },
      handler: ({ brand, query, verdict, limit }) => {
        const rows = readPromptLog(root, graph(), { brand, query, limit: verdict === "none" ? 10_000 : limit, verdict: verdict && verdict !== "none" ? verdict : undefined });
        const filtered = verdict === "none" ? rows.filter((row) => !row.verdict).slice(0, limit) : rows;
        return { count: filtered.length, entries: filtered.map((row) => ({ ...row, prompt: String(row.prompt || "").slice(0, 1_200) })) };
      },
    },
    {
      name: "feedback_record",
      title: "Record a verdict (closes the loop)",
      description: "Record the human's call on an output. approved → exemplar with the exact prompt + a tracked copy of the image + an approved-output entry in the product registry. rejected → a law (or a strengthened existing one) with the reason as evidence, and the prompt kept as a negative example. target is a prompt-log id (pl_…) or the output file path; when the generation was never logged, pass prompt/provider/output directly. Always give a concrete reason: it becomes the evidence line.",
      inputSchema: {
        verdict: z.enum(["approved", "rejected", "revise"]),
        reason: z.string().describe("Concrete, observable: 'badge 30% too large and touches the corner', 'label text correct, lighting matches the ledge set'"),
        target: z.string().optional().describe("pl_… log id or output file path (repo-relative)"),
        brand: brandField.optional(),
        product: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        law: z.object({ id: z.string().optional(), claim: z.string(), appliesTo: z.string().optional(), confidence: z.enum(["weak", "moderate", "strong", "measured"]).optional() }).optional().describe("The rule this verdict teaches, stated generally ('Nano Banana will not rescale a badge on a rendered device'). Optional for approvals; rejections without one get a law from the reason."),
        prompt: z.string().optional().describe("Exact prompt, when target is not a logged generation"),
        provider: z.string().optional(),
        model: z.string().optional(),
        refs: z.array(fileRef).optional(),
        output: z.string().optional().describe("Output file path when target is a log id with several outputs, or for unlogged work"),
        copy: z.boolean().optional().default(true).describe("Copy an approved image into Brand Context/assets/<Brand>/approved/ (tracked, ≤2048px)"),
        notes: z.string().optional(),
        by: z.string().optional(),
      },
      handler: (args) => recordFeedback(root, graph(), args),
    },
    {
      name: "laws_search",
      title: "Search laws",
      description: "Search every law bank: per-brand learnings, the Muha meme laws, and the video law banks (house/post/seedance). Use before generating and before adding a law, to avoid duplicates.",
      inputSchema: { query: z.string(), brand: brandField.optional(), category: z.string().optional(), limit: z.number().int().min(1).max(50).optional().default(12) },
      handler: ({ query, brand, category, limit }) => ({ laws: searchLaws(root, graph(), query, { brand, category, limit }) }),
    },
    {
      name: "laws_add",
      title: "Add or strengthen a law",
      description: "Add a distilled rule to a brand's learning store (six-field law contract). A near-duplicate claim is folded into the existing law instead of duplicated. Use confidence 'documented'→'weak' for anything not measured on our own outputs.",
      inputSchema: {
        brand: brandField,
        claim: z.string(),
        evidence: z.string(),
        appliesTo: z.string().optional().default("all"),
        counterexamples: z.string().optional(),
        confidence: z.enum(["weak", "moderate", "strong", "measured"]).optional().default("weak"),
        source: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        id: z.string().optional().describe("Existing law id to update"),
      },
      handler: ({ brand, ...law }) => {
        const g = graph();
        const { store, path: storePath, brandNode } = loadLearnings(root, g, brand);
        const result = upsertLaw(store, brandNode, { ...law, source: law.source || "laws_add" });
        saveLearnings(storePath, store);
        return { ...result, store: path.relative(root, storePath) };
      },
    },
    {
      name: "learning_stats",
      title: "Learning stats",
      description: "How the loop is doing: verdict counts, approval rate per provider and per category, law counts by confidence, newest events. Per brand or all.",
      inputSchema: { brand: brandField.optional(), recent: z.number().int().min(0).max(50).optional().default(5) },
      handler: ({ brand, recent }) => {
        const g = graph();
        const stores = listLearningStores(root, g).filter((item) => !brand || item.brand === resolveBrand(g, brand)?.id);
        const detail = stores.map((item) => {
          const { store } = loadLearnings(root, g, item.brand);
          const byConfidence = {};
          for (const law of store.laws) byConfidence[law.confidence] = (byConfidence[law.confidence] || 0) + 1;
          return { ...item, stats: store.stats, lawsByConfidence: byConfidence, recentEvents: [...store.events].slice(-recent).reverse().map((event) => ({ id: event.id, ts: event.ts, verdict: event.verdict, reason: event.reason, provider: event.provider, product: event.product, category: event.category })) };
        });
        return { brands: detail, totalLaws: collectLaws(root, g).length };
      },
    },
    {
      name: "job_create",
      title: "Create a job from a product and a style",
      description: "The fast path from 'make X about <product>' to a plannable job: pick a style preset (product-hero, packshot-white, transparent-cutout, lifestyle-in-hand, lifestyle-scene, ugc-still, flyer-snapshot, social-ad-copy, web-hero, packaging-mockup, lineup-range, character-scene, meme-card) and a channel (ig-feed, ig-story, tiktok, square, web-hero, web-banner, amazon, print, email); the job gets the right provider, size, three named variations, and — at plan time — the product's references from the library (canonical, device, cutout, label) chosen for the style. Writes jobs/<id>.json and returns its plan. Free; nothing is generated until job_run with execution.approved.",
      inputSchema: { brand: z.string(), style: z.string(), products: z.array(z.string()).min(1).describe("Product / flavour names as the team says them"), objective: z.string().describe("One sentence: what this piece is for"), concept: z.string().optional().describe("The idea in a sentence or two"), channel: z.string().optional(), copy: z.array(z.string()).optional().describe("Exact on-image text, verbatim"), candidates: z.number().int().min(1).max(4).optional(), id: z.string().optional() },
      handler: async (input) => { const { createJobFile } = await import("../core/job-create.mjs"); const created = createJobFile(root, input); const plan = await planJob(root, created.jobPath); return { ...created, checks: plan.checks, provider: plan.job.provider, deliverable: plan.job.deliverable, autoReferences: plan.autoReferences, variants: plan.variants.length, compiledPrompt: plan.prompt }; },
    },
    {
      name: "presets",
      title: "Style presets and channels",
      description: "The kinds of still content the engine makes (style presets with routing, size, references wanted, variation hypotheses) and the delivery channels with their aspect ratios.",
      inputSchema: {},
      handler: async () => { const { STYLE_PRESETS, CHANNELS } = await import("../prompts/presets.mjs"); return { styles: Object.fromEntries(Object.entries(STYLE_PRESETS).map(([id, preset]) => [id, { title: preset.title, mode: preset.mode, provider: preset.provider, channel: preset.channel, candidates: preset.candidates, refs: preset.refs, variations: preset.variations }])), channels: CHANNELS }; },
    },
    {
      name: "job_plan",
      title: "Plan a job (offline)",
      description: "Validate and compile a content job JSON: schema/runtime checks, compiled prompt, retrieved context, inspected assets, preflight warnings. Free; no provider call.",
      inputSchema: { jobPath: z.string().describe("Repo-relative path to the job JSON") },
      handler: async ({ jobPath }) => {
        const plan = await planJob(root, jobPath);
        return { jobPath: plan.jobPath, checks: plan.checks, provider: plan.job.provider, deliverable: plan.job.deliverable, autoReferences: plan.autoReferences, learned: plan.learned, variants: plan.variants.length, compiledPrompt: plan.prompt, context: plan.context.map((item) => ({ id: item.id, source: item.source, heading: item.heading, score: item.score })), assets: plan.assets.map(({ absolutePath: _a, ...asset }) => asset) };
      },
    },
    {
      name: "job_run",
      title: "Run a job (BILLABLE)",
      description: "Execute a content job against its provider. Refuses unless the job file has execution.approved: true — confirm scope and cost with the human first. Writes a manifest and logs the prompt for later feedback.",
      inputSchema: { jobPath: z.string() },
      handler: async ({ jobPath }) => {
        const result = await executeJob(root, jobPath);
        return { ok: true, outputs: result.outputs.map((file) => path.relative(root, file)), manifest: path.relative(root, result.manifestPath), promptLogId: result.promptLogId };
      },
    },
    {
      name: "job_review",
      title: "Automated visual review (advisory, billable)",
      description: "Run the OpenAI visual critic on a candidate against the job and its canonical references. Advisory only; a human owns the final call (feedback_record).",
      inputSchema: { jobPath: z.string(), imagePath: z.string() },
      handler: async ({ jobPath, imagePath }) => {
        const result = await reviewImage(root, jobPath, imagePath);
        return { reviewPath: path.relative(root, result.reviewPath), review: result.review };
      },
    },
    {
      name: "doctor",
      title: "Environment check",
      description: "Node, keys, ffmpeg, Chrome, brand-pack integrity, graph size.",
      inputSchema: {},
      handler: () => runDoctor(root),
    },
  ];
}

export async function callTool(tools, name, args = {}) {
  const tool = tools.find((item) => item.name === name);
  if (!tool) throw new Error(`Unknown tool ${name}`);
  const schema = z.object(tool.inputSchema);
  const parsed = schema.parse(args);
  return tool.handler(parsed);
}

export function toolResult(value) {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }], structuredContent: value && typeof value === "object" && !Array.isArray(value) ? value : { value } };
}

export function toolError(error) {
  const serialized = serializeError(error);
  return { isError: true, content: [{ type: "text", text: JSON.stringify(serialized, null, 2) }] };
}
