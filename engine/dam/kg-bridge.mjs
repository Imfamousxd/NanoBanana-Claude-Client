// Knowledge-graph bridge — the DAM and the content engine tie in both directions:
//   DAM → knowledge   product-ref hits become `damCandidates` on the product registry (a human promotes
//                     one to canonical), UGC profiles become laws + real-creator exemplars in the
//                     brand's learning store, so context_pack reads them before a prompt is written.
//   knowledge → DAM   a verdict recorded with feedback_record on a DAM-registered file marks the DAM
//                     row (verdict, reference_roles), so search ranks approved truth first.
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJsonAtomic } from "../core/files.mjs";
import { relatedNodes } from "../knowledge/graph.mjs";
import { loadLearnings, saveLearnings, upsertLaw } from "../learning/store.mjs";
import { getUgcProfile } from "./ugc-profile.mjs";

function registryFile(root, graph, brandId) {
  const registry = relatedNodes(graph, brandId, "has-products")[0];
  if (!registry) return null;
  const file = path.resolve(root, registry.path || registry.source);
  return fs.existsSync(file) ? file : null;
}

/** Product-ref assets with a confident product match become registry candidates (never auto-canonical). */
export async function syncProductCandidates(root, db, graph, brandId, { minConfidence = 0.75, minQuality = 0.6 } = {}) {
  const file = registryFile(root, graph, brandId);
  if (!file) return { brand: brandId, skipped: "no registry" };
  const { rows } = await db.query(`select id, path, source_id, product, product_confidence, quality, reference_roles, proxies, title, has_alpha, orientation, width, height
    from dam.assets where brand = $1 and class in ('product-ref','logo') and product_confidence >= $2 and coalesce(quality,0) >= $3 and deleted_at is null and duplicate_of is null
    and coalesce((flags->>'outdated_or_wrong')::boolean,false) = false order by product, quality desc`, [brandId, minConfidence, minQuality]);
  const registry = readJson(file);
  registry.damCandidates ??= [];
  const existing = new Set(registry.damCandidates.map((item) => item.assetId));
  let added = 0;
  for (const row of rows) {
    if (existing.has(row.id)) continue;
    registry.damCandidates.push({ assetId: row.id, product: row.product, confidence: row.product_confidence, quality: row.quality, roles: row.reference_roles, source: row.source_id, path: row.path, thumb: row.proxies?.thumb || null, title: row.title, alpha: row.has_alpha, size: row.width && row.height ? `${row.width}x${row.height}` : null, addedAt: new Date().toISOString().slice(0, 10), status: "candidate" });
    await db.query("insert into dam.kg_links (asset_id, kg_kind, kg_ref, brand) values ($1,'product-candidate',$2,$3) on conflict do nothing", [row.id, `${path.relative(root, file)}#${row.product}`, brandId]);
    added += 1;
  }
  if (added) { registry.updatedAt = new Date().toISOString().slice(0, 10); writeJsonAtomic(file, registry); }
  return { brand: brandId, candidates: rows.length, added, registry: path.relative(root, file) };
}

/** The measured UGC profile becomes laws + exemplars in the brand's learning store. */
export async function syncUgcProfile(root, db, graph, brandId) {
  const profile = await getUgcProfile(db, brandId);
  if (!profile) return { brand: brandId, skipped: "no ugc profile yet" };
  const { store, path: storePath, brandNode } = loadLearnings(root, graph, brandId);
  let lawsWritten = 0;
  for (const law of profile.laws || []) {
    upsertLaw(store, brandNode, { id: law.id, claim: law.claim, evidence: law.evidence, counterexamples: law.counterexamples, appliesTo: law.applies_to, confidence: law.confidence, source: law.source, category: "ugc-video", tags: ["dam", "real-human", "measured"] });
    lawsWritten += 1;
  }
  let exemplarsWritten = 0;
  store.exemplars ??= [];
  for (const asset of profile.exemplarAssets || []) {
    const id = `dam_${asset.id}`;
    if (store.exemplars.some((item) => item.id === id)) continue;
    store.exemplars.push({ id, eventId: null, createdAt: new Date().toISOString(), category: "ugc-video", product: null, provider: "human", model: null, prompt: null, refs: [], output: { path: asset.path, damAssetId: asset.id }, tracked: asset.proxies?.thumb || null, preview: asset.proxies?.preview || null, tags: ["dam", "real-human", asset.subclass].filter(Boolean), reason: `Real creator content (quality ${asset.quality}); ${asset.title}`, notes: asset.summary, origin: "dam" });
    await db.query("insert into dam.kg_links (asset_id, kg_kind, kg_ref, brand) values ($1,'ugc-exemplar',$2,$3) on conflict do nothing", [asset.id, `${path.relative(root, storePath)}#${id}`, brandId]);
    exemplarsWritten += 1;
  }
  store.ugcProfile = { sampleSize: profile.sample_size, bands: profile.bands, patterns: profile.patterns, computedAt: profile.computed_at, source: "dam.ugc_profiles" };
  saveLearnings(storePath, store);
  return { brand: brandId, laws: lawsWritten, exemplars: exemplarsWritten, sampleSize: profile.sample_size };
}

export async function syncDamToKnowledge(root, db, graph, { brand = undefined } = {}) {
  const brands = brand ? [brand] : graph.nodes.filter((node) => node.type === "brand").map((node) => node.id);
  const out = [];
  for (const brandId of brands) {
    out.push({ products: await syncProductCandidates(root, db, graph, brandId), ugc: await syncUgcProfile(root, db, graph, brandId) });
  }
  return { synced: out };
}

/** A human verdict on a DAM asset (from feedback_record or the gallery) flows back into the index. */
export async function applyVerdictToDam(db, { assetId, verdict, reason, roles = [] }) {
  const set = verdict === "approved" ? "reference_roles = (select array(select distinct unnest(reference_roles || $3::text[])))" : "reference_roles = array_remove(array_remove(reference_roles,'canonical'),'ugc-exemplar')";
  await db.query(`update dam.assets set verdict = $2, verdict_reason = $4, ${set}, flags = flags || jsonb_build_object('do_not_use', $5::boolean) where id = $1`, [assetId, verdict, roles, reason || null, verdict === "rejected"]);
  return db.getAsset(assetId);
}
