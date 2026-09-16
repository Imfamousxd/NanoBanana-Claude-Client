// DAM tools for the content-engine MCP. Registered next to the generation tools so one agent session
// can search real assets, pull a real-creator UGC profile, and record a verdict without switching servers.
import { z } from "zod";
import { resolveBrand } from "../knowledge/graph.mjs";
import { damConfig } from "./config.mjs";
import { DamDb } from "./db.mjs";
import { DamWorker } from "./worker.mjs";
import { brandCards } from "./analyze.mjs";
import { searchAssets, similarAssets, productIndexFromCards } from "./search.mjs";
import { computeUgcProfiles, getUgcProfile } from "./ugc-profile.mjs";
import { applyVerdictToDam, syncDamToKnowledge } from "./kg-bridge.mjs";
import { digestionStatus } from "./status.mjs";
import { runEval } from "./eval.mjs";
import { CLASS_IDS, REFERENCE_ROLES, ROLE_IDS } from "./taxonomy.mjs";

const brandField = z.string().optional().describe("Brand id or alias (nulumin | muha | dialed-health | dialed-moods | dialed-labs | noble-harbor | stanton)");

export function createDamTools(root, graph) {
  let db = null;
  let cards = null;
  const config = damConfig(root);
  const getDb = () => { if (!db) db = new DamDb(config.databaseUrl); return db; };
  const getCards = () => { if (!cards) cards = brandCards(root, graph()); return cards; };
  const brandOf = (value) => (value ? (resolveBrand(graph(), value)?.id || value) : undefined);
  const slim = (row) => ({ id: row.id, path: row.path, source: row.source_id, kind: row.kind, brand: row.brand, class: row.class, form: row.subclass, product: row.product, title: row.title, summary: row.summary, tags: row.tags, roles: row.reference_roles, quality: row.quality, orientation: row.orientation, size: row.width ? `${row.width}x${row.height}` : null, duration_s: row.duration_s, people: row.people_count, realHuman: row.is_real_human, thumb: row.proxies?.thumb || null, preview: row.proxies?.preview || null, contact: row.proxies?.contact || null, flags: row.flags, score: row.score, why: row.why, similarity: row.similarity });

  return [
    {
      name: "dam_search",
      title: "Search the asset library (DAM)",
      description: `Natural-language search over every Dropbox/local asset the DAM has understood: real photos, real creator videos, packshots, logos, shipped ads. Understands brand, product, class (${CLASS_IDS.join(", ")}), orientation, people, duration. Combines lexical, semantic and visual retrieval; each hit says why it matched. Use before generating to find real references and real UGC to imitate.`,
      inputSchema: { query: z.string(), brand: brandField, class: z.enum(CLASS_IDS).optional(), form: z.string().optional(), roles: z.array(z.enum(ROLE_IDS)).optional(), realHumanOnly: z.boolean().optional(), limit: z.number().int().min(1).max(60).optional().default(20), rerank: z.boolean().optional().default(false).describe("LLM rerank of the top hits (small paid call)"), vectors: z.boolean().optional().default(true).describe("Use embeddings for the query (one small paid embed call)") },
      handler: async ({ query, brand, class: cls, form, roles, realHumanOnly, limit, rerank, vectors }) => {
        const cfg = { ...config, searchEmbeddingsAllowed: vectors };
        const result = await searchAssets(getDb(), graph(), query, { filters: { brand: brandOf(brand), class: cls, form, roles, realHuman: realHumanOnly || undefined }, limit, rerank, config: cfg, products: productIndexFromCards(getCards()) });
        return { ...result, results: result.results.map(slim) };
      },
    },
    {
      name: "dam_asset",
      title: "DAM asset detail",
      description: "Everything the DAM knows about one asset: the full structured analysis, measured video facts, transcript, keyframes, proxies, flags, verdict.",
      inputSchema: { id: z.string().uuid() },
      handler: async ({ id }) => {
        const asset = await getDb().getAsset(id);
        if (!asset) throw new Error(`no asset ${id}`);
        const { rows } = await getDb().query("select measured, transcript, read, keyframes from dam.video_analysis where asset_id = $1", [id]);
        const { embedding_text: _t, embedding_visual: _v, tsv: _tsv, search_doc, ...rest } = asset;
        return { ...rest, searchDoc: search_doc, video: rows[0] || null };
      },
    },
    {
      name: "dam_similar",
      title: "Visually similar assets",
      description: "Nearest neighbours of an asset by visual embedding: other angles of a packshot, takes of a shot, the same creative in other sizes.",
      inputSchema: { id: z.string().uuid(), limit: z.number().int().min(1).max(40).optional().default(12), by: z.enum(["visual", "text"]).optional().default("visual") },
      handler: async ({ id, limit, by }) => ({ results: (await similarAssets(getDb(), id, { limit, column: by === "text" ? "embedding_text" : "embedding_visual" })).map(slim) }),
    },
    {
      name: "dam_stats",
      title: "DAM status",
      description: "Sources and cursors, assets by status and by brand/class, queue depth, spend in the last 24h and total.",
      inputSchema: {},
      handler: async () => getDb().stats(),
    },
    {
      name: "dam_product_refs",
      title: "Reference kit for one product",
      description: "Name a product (and optionally what you are making) and get the references chosen for it: the canonical look (packaging with device for Muha, the container for Dialed/NuLumin), the device or container alone, one best file per camera angle, a transparent cutout, flat label artwork, lineups — each with the reason to use it — plus what to avoid and what the library is missing for that product. Free; reads the database only. context_pack already includes this for every product a brief names.",
      inputSchema: { brand: brandField, product: z.string().describe("Product / flavour / SKU name as the team says it, e.g. 'Grape Sherbalato', 'Blue Glacier', 'GHK-Cu 50mg'"), intent: z.string().optional().describe("What you are making: 'device close-up in hand', 'packaging hero', 'flavour lineup', 'label truth', 'website cutout'"), limit: z.number().int().min(1).max(8).optional().default(3), text: z.boolean().optional().default(false) },
      handler: async ({ brand, product, intent, limit, text }) => { const { resolveProductReferences, renderProductKit } = await import("./product-context.mjs"); const result = await resolveProductReferences(getDb(), graph(), root, { brand: brandOf(brand), product, intent: intent || "", limit }); return text ? { text: renderProductKit(result).join("\n") } : result; },
    },
    {
      name: "dam_studio_refs",
      title: "Product references in the video studio's refs shape",
      description: "For the dialed-studio video MCP: name a product (and what you are making) and get [{path, name, role, describe, contains_person, third_party_marks}] ready to pass as refs to create_from_request / scene_frame / image_generate — the files chosen by the DAM kit (canonical, device, cutout, label), brought onto disk under .content-engine/refs. Free; nothing is generated. The studio's own generation logic is untouched.",
      inputSchema: { brand: brandField, product: z.string(), intent: z.string().optional(), materialize: z.boolean().optional().default(true).describe("Fetch the files to disk (needed for video briefs); false returns Dropbox paths only") },
      handler: async ({ brand, product, intent, materialize }) => { const { studioReferences } = await import("./product-context.mjs"); return studioReferences(getDb(), graph(), root, { brand: brandOf(brand), product, intent: intent || "", materialize }); },
    },
    {
      name: "dam_product_directory",
      title: "Product renders per brand and product line",
      description: "The product-render directory built from the Dropbox render folders: for each brand and product line, how many render files exist, how many are analysed, the product names the vision model saw, the best files to pass as references (id, thumb, alpha, roles), what is missing (no transparent cutout / no canonical), and registry products with no render yet. Free; reads the database only.",
      inputSchema: { brand: brandField, since: z.string().optional().describe("ISO date: only files modified on or after it (inbound assets)"), best: z.number().int().min(1).max(20).optional().default(6), text: z.boolean().optional().default(false).describe("Return the compact text rendering instead of JSON") },
      handler: async ({ brand, since, best, text }) => { const { productDirectory, renderDirectoryText } = await import("./product-refs.mjs"); const result = await productDirectory(getDb(), graph(), root, { brand: brandOf(brand), since: since || null, limit: best }); return text ? { text: renderDirectoryText(result) } : result; },
    },
    {
      name: "dam_render_candidates",
      title: "Flag product-render candidates and price their analysis",
      description: "Marks every discovered image inside a Renders / Product Photos / Packshots / Cutouts tree as a product-ref candidate, moves it to the front of every queue, and returns per-brand counts with the estimated USD to analyse what is not analysed yet. Free and idempotent; it never spends. Use dryRun to only count.",
      inputSchema: { brand: brandField, dryRun: z.boolean().optional().default(false) },
      handler: async ({ brand, dryRun }) => { const { flagRenderCandidates } = await import("./product-refs.mjs"); return flagRenderCandidates(getDb(), { brand: brandOf(brand), dryRun, model: config.vision.model, embedModel: config.embed.model }); },
    },
    {
      name: "dam_products",
      title: "Product names the DAM has seen",
      description: "Every product name the vision model identified in analysed assets, per brand, with counts — the vocabulary to use in dam_search when a product is not in the registry.",
      inputSchema: { brand: brandField },
      handler: async ({ brand }) => { const b = brandOf(brand); return { products: (await getDb().query(`select brand, product, count(*)::int as n from dam.assets where product is not null and status in ('analyzed','embedded') and deleted_at is null ${b ? "and brand = $1" : ""} group by 1,2 order by 1, 3 desc`, b ? [b] : [])).rows }; },
    },
    {
      name: "dam_status",
      title: "Digestion health",
      description: "Is ingestion live and keeping up? Per-source cursor age and backlog, throughput per stage in the last hour, queue depth, worker heartbeats, dead jobs by error, spend, and the median latency from a file's Dropbox modification to its index row and probe. Free.",
      inputSchema: {},
      handler: async () => digestionStatus(getDb()),
    },
    {
      name: "dam_eval",
      title: "Search evaluation suite",
      description: "Run the plain-language query suite (engine/dam/eval-queries.json) against the live index and report hit@1 / hit@3 with the misses. Small embed cost per query.",
      inputSchema: { rerank: z.boolean().optional().default(false) },
      handler: async ({ rerank }) => runEval(getDb(), graph(), { config: { ...config, searchEmbeddingsAllowed: true }, products: productIndexFromCards(getCards()), rerank }),
    },
    {
      name: "dam_ugc_profile",
      title: "Real-creator UGC profile",
      description: "What a brand's REAL human creator videos measurably do: duration/articulation/hook/shot/loudness bands, counted framings, hook types, settings, camera behaviour and reality cues, plus the exemplar clips and the laws distilled from them. Read this before writing any UGC brief; compute=true recomputes from the index (free).",
      inputSchema: { brand: z.string(), compute: z.boolean().optional().default(false) },
      handler: async ({ brand, compute }) => {
        const brandId = brandOf(brand);
        if (compute) await computeUgcProfiles(getDb(), graph(), { brand: brandId });
        const profile = await getUgcProfile(getDb(), brandId);
        if (!profile) return { brand: brandId, profile: null, note: "No analysed real-human ugc-video assets for this brand yet." };
        return { brand: brandId, sampleSize: profile.sample_size, computedAt: profile.computed_at, bands: profile.bands, patterns: profile.patterns, laws: profile.laws, exemplars: profile.exemplarAssets.map(slim) };
      },
    },
    {
      name: "dam_sync_knowledge",
      title: "Sync DAM findings into the knowledge graph",
      description: "Push confident product-ref hits into the product registries as candidates and the UGC profile into the brand's learning store as laws + real-creator exemplars, so context_pack sees them. Free.",
      inputSchema: { brand: brandField },
      handler: async ({ brand }) => syncDamToKnowledge(root, getDb(), graph(), { brand: brandOf(brand) }),
    },
    {
      name: "dam_verdict",
      title: "Record a verdict on a DAM asset",
      description: `Human call on a library asset: approved (optionally with roles: ${Object.keys(REFERENCE_ROLES).join(", ")}) promotes it in search and can mark it canonical; rejected flags do_not_use so it never gets passed as a reference.`,
      inputSchema: { id: z.string().uuid(), verdict: z.enum(["approved", "rejected"]), reason: z.string(), roles: z.array(z.enum(ROLE_IDS)).optional() },
      handler: async ({ id, verdict, reason, roles }) => slim(await applyVerdictToDam(getDb(), { assetId: id, verdict, reason, roles: roles || [] })),
    },
    {
      name: "dam_scan",
      title: "Scan a source now",
      description: "Discover new/changed files in one registered source (or all) and queue free probe jobs. Paid analysis only runs from the worker with approval.",
      inputSchema: { sourceId: z.string().optional(), full: z.boolean().optional().default(false) },
      handler: async ({ sourceId, full }) => {
        const worker = new DamWorker(root, { config });
        try {
          const ids = sourceId ? [sourceId] : (await worker.db.listSources()).filter((source) => source.enabled).map((source) => source.id);
          const out = {};
          for (const id of ids) out[id] = await worker.discover(id, { full });
          return out;
        } finally { await worker.close(); }
      },
    },
    {
      name: "dam_work",
      title: "Run queued DAM jobs (probe free; analyze/embed BILLABLE)",
      description: "Drain the job queue once. kinds=['probe'] is free. analyze/embed spend money and run only when approve=true AND the 24h spend cap allows; otherwise those jobs are parked. Confirm scope and cost with the human before approve=true.",
      inputSchema: { kinds: z.array(z.enum(["discover", "probe", "analyze", "embed", "ugc-profile", "link-kg"])).optional(), max: z.number().int().min(1).max(500).optional().default(50), approve: z.boolean().optional().default(false), source: z.string().optional().describe("Only jobs whose source id starts with this, e.g. dropbox:final-2026") },
      handler: async ({ kinds, max, approve, source }) => {
        const worker = new DamWorker(root, { config: { ...config, approved: approve } });
        try { const result = await worker.runQueue({ once: true, kinds, maxJobs: max, sourcePrefix: source }); return { ...result, queue: await worker.db.jobCounts(), spend24hUsd: await worker.db.spendSince(24), capUsd: config.spendCapUsd }; }
        finally { await worker.close(); }
      },
    },
  ];
}
