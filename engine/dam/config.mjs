// DAM configuration — brand scopes (which Dropbox folders belong to which brand), size caps, model
// choices and cost assumptions. Everything env-overridable so the hosted worker and a laptop run the
// same code. Brand ids are the knowledge graph's (brand.muha, brand.nulumin, …) so a DAM row and a
// registry entry mean the same thing by the same name.
import path from "node:path";

export const DEFAULT_SCOPES = [
  // Verified case-correct Dropbox roots from the legacy DAM handoff (2026-06-21). Add roots freely;
  // each becomes its own dam.sources row with its own cursor.
  { id: "dropbox:muha:thc", brand: "brand.muha", root: "/2025 Full Ops/Marketing Operations/01 Muha Meds THC" },
  { id: "dropbox:muha:hemp", brand: "brand.muha", root: "/2025 Full Ops/Marketing Operations/03 Muha Meds Hemp" },
  { id: "dropbox:muha:members-merch", brand: "brand.muha", root: "/2025 Full Ops/Marketing Operations/06 Muha Meds Members & Merch" },
  { id: "dropbox:muha:2025", brand: "brand.muha", root: "/2025 Full Ops/MUHA MEDS" },
  { id: "dropbox:dialed-moods:main", brand: "brand.dialed-moods", root: "/2025 Full Ops/Marketing Operations/02 Dialed Moods" },
  { id: "dropbox:dialed-moods:2025", brand: "brand.dialed-moods", root: "/2025 Full Ops/DIALED MOODS" },
  { id: "dropbox:dialed-labs:main", brand: "brand.dialed-labs", root: "/2025 Full Ops/Marketing Operations/04 Dialed Labs" },
  { id: "dropbox:dialed-labs:defend", brand: "brand.dialed-labs", root: "/2025 Full Ops/Marketing Operations/05 Dialed & Defend" },
  { id: "dropbox:dialed-labs:2025", brand: "brand.dialed-labs", root: "/2025 Full Ops/DIALED LABS" },
  { id: "dropbox:dialed-health:2025", brand: "brand.dialed-health", root: "/2025 Full Ops/DIALED HEALTH" },
  { id: "dropbox:dialed-health:main", brand: "brand.dialed-health", root: "/2025 Full Ops/Marketing Operations/07 Dialed Health" },
  // Moved by the team between 2026-09-27 and 2026-10-27 from "/2025 Full Ops/DIALED HEALTH: Master".
  { id: "dropbox:dialed-health:master", brand: "brand.dialed-health", root: "/CM Headquarters/DIALED HEALTH: Master" },
  // New 2026-10 "source of truth" trees (product renders per SKU, packaging elements, brand vault).
  { id: "dropbox:dialed-moods:master", brand: "brand.dialed-moods", root: "/CM Headquarters/DIALED MOODS: Master" },
  { id: "dropbox:dialed-labs:defend-2025", brand: "brand.dialed-labs", root: "/2025 Full Ops/Dialed & Defend" },
  { id: "dropbox:dialed-health:events", brand: "brand.dialed-health", root: "/Dialed Health Event Content" },
  // The live media library the team uploads into (verified 2026-09-14): one folder per brand with Photos/Videos/Graphics.
  { id: "dropbox:media:dialed-health", brand: "brand.dialed-health", root: "/MEDIA Team/Dialed-Health" },
  { id: "dropbox:media:dialed-moods", brand: "brand.dialed-moods", root: "/MEDIA Team/Dialed-Moods" },
  { id: "dropbox:media:dialed-labs", brand: "brand.dialed-labs", root: "/MEDIA Team/Dialed-Labs" },
  // "/MEDIA Team/Dialed-and-Defend" was moved INSIDE "/MEDIA Team/Dialed-Health" (found 2026-10-27), so the
  // dialed-health media source now lists it; BRAND_PATH_RULES keeps those files on Dialed Labs. Existing
  // databases keep the old source row; discover disables it ("root moved into …") instead of failing forever.
  { id: "dropbox:media:muha", brand: "brand.muha", root: "/MEDIA Team/Muha-Meds" },
  { id: "dropbox:media:muha-members", brand: "brand.muha", root: "/MEDIA Team/Muha-Members" },
  // Finished 2026 deliverables — the richest source of real creator video.
  { id: "dropbox:final-2026:dialed-labs", brand: "brand.dialed-labs", root: "/2026 FINAL CONTENT/Dialed Labs" },
  { id: "dropbox:final-2026:dialed-moods", brand: "brand.dialed-moods", root: "/2026 FINAL CONTENT/Dialed Moods" },
  { id: "dropbox:final-2026:dialed-health", brand: "brand.dialed-health", root: "/2026 FINAL CONTENT/Dialed Health" },
  // The Dropbox "/2026" tree the legacy handoff cited was deleted by 2026-09-14; current-year content lives
  // under "/2026 FINAL CONTENT" and "/MEDIA Team" (mapped below once inspected). NuLumin and Noble Harbor
  // roots are not known yet — add them here or with `dam add-source`.
];

/**
 * Brand by folder, below the source level: a sub-tree that belongs to another brand than its source. Checked
 * against the source-relative path (case-insensitive) before the source's brand_hint. First match wins.
 */
export const BRAND_PATH_RULES = [
  { pattern: /(^|\/)dialed[ _-]*(and|&)[ _-]*defend(\/|$)/i, brand: "brand.dialed-labs", why: "Dialed & Defend is filed under Dialed Labs" },
  { pattern: /(^|\/)nulumin(\/|$)/i, brand: "brand.nulumin", why: "a NuLumin folder inside another brand's tree (e.g. DIALED HEALTH/Renders/Syringe Bottle/NuLumin)" },
];

/** The brand a file belongs to from where it sits: a BRAND_PATH_RULES sub-tree, else the source's brand_hint. */
export function brandForPath(source, relativePath) {
  for (const rule of BRAND_PATH_RULES) if (rule.pattern.test(String(relativePath || ""))) return rule.brand;
  return source?.brand_hint || null;
}

export const EXCLUDE_PATH_PATTERNS = [
  /00_Video-Effects|00_Sound-Effects|00_LUTS/i,          // stock effects, not brand assets
  /\b(fonts?|fontbook)\b/i,
  /QR ?Codes?|\bQRC\b|\d+ QRs|Barcodes|Verification Codes|App Codes/i,
  /\bCOA'?s?\b/i,
  /12 Pack Kava Seltzer Carrying Case Barcodes/i,
  /3D Renderers Workflow/i,
  /Archmodels|\/textures?\d*\/|\bHDRI?s?\b|\.hdr$/i,               // stock 3D texture / HDRI libraries
  /Accounting/i,
  /FontBook/i,
  /node_modules|\.git\//,
];

/**
 * Supabase's session-mode pooler (port 5432 on the pooler host) allows 15 clients in total, shared by
 * every worker, the UI and the MCP. The transaction-mode pooler (port 6543) multiplexes, so it is the
 * one the DAM should use unless DAM_DATABASE_URL says otherwise.
 */
export function pickDatabaseUrl(env) {
  if (env.DAM_DATABASE_URL) return env.DAM_DATABASE_URL;
  const candidates = [env.DATABASE_URL, env.DIRECT_URL].filter(Boolean);
  const transaction = candidates.find((url) => /:6543\//.test(url));
  if (transaction) return transaction;
  const any = candidates[0];
  if (any && /pooler\.supabase\.com:5432\//.test(any)) return any.replace(/pooler\.supabase\.com:5432\//, "pooler.supabase.com:6543/");
  return any;
}

/** The Storage API of the SAME project the database points at; .env files here carry more than one project. */
export function storageUrlFor(env) {
  if (env.DAM_SUPABASE_URL) return env.DAM_SUPABASE_URL;
  const db = env.DAM_DATABASE_URL || env.DIRECT_URL || env.DATABASE_URL || "";
  const ref = (db.match(/postgres(?:ql)?:\/\/postgres\.([a-z0-9]{20})/) || [])[1];
  if (ref) return `https://${ref}.supabase.co`;
  return env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || null;
}

export function damConfig(root, env = process.env) {
  const number = (key, fallback) => (env[key] !== undefined && env[key] !== "" ? Number(env[key]) : fallback);
  return {
    databaseUrl: pickDatabaseUrl(env),
    workDir: env.DAM_WORK_DIR || path.join(root, ".content-engine", "dam"),
    maxImageBytes: number("DAM_MAX_IMAGE_MB", 80) * 1024 * 1024,
    maxVideoBytes: number("DAM_MAX_VIDEO_MB", 600) * 1024 * 1024,
    maxVideoSeconds: number("DAM_MAX_VIDEO_SECONDS", 900),
    keyframesPerVideo: number("DAM_KEYFRAMES", 10),
    proxyHeight: number("DAM_PROXY_HEIGHT", 720),
    thumbWidth: 512,
    // Providers
    vision: { provider: env.DAM_VISION_PROVIDER || "gemini", model: env.DAM_VISION_MODEL || (env.DAM_VISION_PROVIDER === "openai" ? "gpt-5.6-sol" : "gemini-2.5-flash") },
    transcribe: { provider: "openai", model: env.DAM_TRANSCRIBE_MODEL || "whisper-1" },
    embed: { provider: env.DAM_EMBED_PROVIDER || "gemini", model: env.DAM_EMBED_MODEL || "gemini-embedding-2", dimensions: 768 },
    rerank: { provider: env.DAM_RERANK_PROVIDER || "gemini", model: env.DAM_RERANK_MODEL || "gemini-2.5-flash" },
    // Cost guard: worker refuses to start a paid stage past this many USD per run/day.
    spendCapUsd: number("DAM_SPEND_CAP_USD", 25),
    approved: env.DAM_APPROVED === "1" || env.DAM_APPROVED === "true",
    // Product-render candidates (files inside a Renders / Product Photos / Packshots tree) may be analysed as
    // they arrive, without approving the whole library, under their own daily cap.
    autoProductRefs: env.DAM_AUTO_PRODUCT_REFS === "1" || env.DAM_AUTO_PRODUCT_REFS === "true",
    autoCapUsd: number("DAM_AUTO_CAP_USD", 3),
    // Storage for proxies (Supabase Storage bucket). Falls back to local files under workDir.
    storage: { url: storageUrlFor(env), key: env.SUPABASE_SERVICE_ROLE_KEY, bucket: env.DAM_STORAGE_BUCKET || "dam-proxies" },
    concurrency: number("DAM_CONCURRENCY", 2),
    jobTimeoutMs: number("DAM_JOB_TIMEOUT_S", 600) * 1000,
    workerId: env.DAM_WORKER_ID || `${env.HOSTNAME || "local"}-${process.pid}`,
    longpollSeconds: number("DAM_LONGPOLL_SECONDS", 90),
    // Safety net: every source gets an incremental discover at least this often, longpoll or not.
    rescanHours: number("DAM_RESCAN_HOURS", 6),
    // Liveness: the hosted worker exits (and Railway restarts it) when its queue loop has not written a
    // heartbeat for this long. 0 disables the watchdog.
    watchdogMinutes: number("DAM_WATCHDOG_MINUTES", 15),
  };
}

/** Rough per-call prices used for the spend ledger and the cap (USD). Update when vendors change. */
export const PRICE_ESTIMATES = {
  "gemini-2.5-flash:vision-image": 0.0015,
  "gemini-2.5-flash:vision-video": 0.006,
  "gemini-2.5-flash:rerank": 0.001,
  "gpt-5.6-sol:vision-image": 0.02,
  "gpt-5.6-sol:vision-video": 0.06,
  "whisper-1:transcribe-minute": 0.006,
  "gemini-embedding-2:embed": 0.0002,
  "text-embedding-3-large:embed": 0.0001,
};

export function estimateUsd(model, kind, units = 1) {
  return (PRICE_ESTIMATES[`${model}:${kind}`] ?? 0.005) * units;
}

export function isExcludedPath(relativePath) {
  return EXCLUDE_PATH_PATTERNS.some((pattern) => pattern.test(relativePath));
}
