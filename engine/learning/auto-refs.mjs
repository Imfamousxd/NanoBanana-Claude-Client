// Automatic references: a job that names a product gets its reference images from the library.
//
// The DAM's product kit chooses the files (identity / device / packaging / cutout / label / lineup, ranked
// by verdict, approved folder, quality, version); this module turns the chosen files into job assets:
// it fetches a model-sized proxy (or the original when transparency matters), caches it under
// .content-engine/refs/, and maps each kit slot to a job role with an instruction the prompt compiler
// renders verbatim. Nothing here calls a generation model. If the DAM is unreachable the job keeps
// whatever assets it declared and the plan says so.
import fs from "node:fs";
import path from "node:path";
import { resolveBrand } from "../knowledge/graph.mjs";

const REFS_DIR = path.join(".content-engine", "refs");

const SLOT_ROLE = {
  identity: { role: "product-canon", instructions: "The product exactly as sold: label geometry, colours, proportions and every printed string come from this image; any drift is a rejection." },
  device: { role: "reference-image", instructions: "The device / container alone: use it for the product's shape, materials and finish; keep the label from the canonical." },
  packaging: { role: "reference-image", instructions: "The packaging as printed: panel layout, artwork placement and colours come from this image." },
  cutout: { role: "reference-image", instructions: "A clean cutout of the product: its silhouette and edges." },
  label: { role: "reference-image", instructions: "Flat label / dieline artwork: the truth for printed copy, typography and colour values." },
  lineup: { role: "reference-image", instructions: "The range standing together: relative scale and which products belong side by side." },
  "angle:three-quarter": { role: "reference-image", instructions: "A second angle of the same product so its geometry is understood in three dimensions." },
  "angle:front": { role: "reference-image", instructions: "The straight-on front view: label layout and proportions as printed." },
  "angle:side": { role: "reference-image", instructions: "The side view: depth and silhouette of the product." },
  logo: { role: "logo-canon", instructions: "The brand logo exactly as this file; place it once, never redraw it." },
};

function safeName(value) {
  return String(value).replace(/[^a-z0-9._-]+/gi, "_").slice(0, 80);
}

async function fetchToFile(url, destination) {
  if (fs.existsSync(destination) && fs.statSync(destination).size > 0) return destination;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fetch ${response.status} for ${url.slice(0, 80)}`);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
  return destination;
}

/** Bring one DAM asset onto disk as a reference. Transparent cutouts fetch the original; everything else the model proxy. */
export async function materializeReference(root, db, item, { preferOriginal = false, dropbox = null, maxBytes = 25 * 1024 * 1024 } = {}) {
  const dir = path.join(root, REFS_DIR);
  const wantOriginal = preferOriginal || item.alpha;
  if (wantOriginal && dropbox) {
    try {
      const asset = (await db.query("select a.path, a.bytes, a.extension, s.root as source_root from dam.assets a join dam.sources s on s.id = a.source_id where a.id = $1", [item.id])).rows[0];
      if (asset && Number(asset.bytes) <= maxBytes) {
        const destination = path.join(dir, `${item.id}.${asset.extension || "png"}`);
        if (!fs.existsSync(destination)) { fs.mkdirSync(dir, { recursive: true }); await dropbox.downloadToFile(`${asset.source_root}/${asset.path}`, destination, { maxBytes }); }
        return { path: path.relative(root, destination), source: "original" };
      }
    } catch (error) {
      // fall through to the proxy
      item.note = `original unavailable (${String(error.message).slice(0, 80)}); proxy used`;
    }
  }
  const url = item.model || item.thumb;
  if (!url) throw new Error(`asset ${item.id} has no proxy to fetch`);
  if (!/^https?:/.test(url)) return { path: path.relative(root, path.resolve(root, url)), source: "local-proxy" };
  const destination = path.join(dir, `${item.id}${item.model ? "-model" : "-thumb"}.jpg`);
  await fetchToFile(url, destination);
  return { path: path.relative(root, destination), source: item.model ? "model-proxy" : "thumb-proxy" };
}

/**
 * Resolve the job's `references` block into concrete assets.
 * job.references = { auto: true, products: ["Grape Sherbalato"], intent: "…", max: 5, wants: [...] }
 */
export async function resolveAutoReferences(root, graph, job, preset) {
  const spec = job.references || {};
  const notes = [];
  if (spec.auto === false) return { assets: [], kits: [], notes: ["references.auto is false"] };
  const products = [...new Set([...(spec.products || []), ...(job.products || [])].filter(Boolean))];
  if (!products.length) return { assets: [], kits: [], notes: ["no product named; declare references.products or job.assets by hand"] };
  const brand = resolveBrand(graph, job.brand);
  if (!brand) return { assets: [], kits: [], notes: [`unknown brand ${job.brand}`] };

  let db = null;
  let dropbox = null;
  try {
    const [{ damConfig }, { DamDb }, { resolveProductReferences }] = await Promise.all([import("../dam/config.mjs"), import("../dam/db.mjs"), import("../dam/product-context.mjs")]);
    const config = damConfig(root);
    if (!config.databaseUrl) return { assets: [], kits: [], notes: ["DAM database not configured"] };
    db = new DamDb(config.databaseUrl);
    try { const { DropboxClient } = await import("../dam/dropbox.mjs"); dropbox = DropboxClient.fromEnv(process.env); } catch { dropbox = null; }
    const wants = spec.wants || preset?.refs?.wants || ["identity", "device"];
    const max = spec.max || (job.provider?.id === "gemini-image" ? 5 : 6);
    const assets = [];
    const kits = [];
    const seen = new Set((job.assets || []).map((asset) => asset.path));
    for (const product of products) {
      const kit = await resolveProductReferences(db, graph, root, { brand: brand.id, product, intent: spec.intent || job.objective || "", limit: 3 });
      kits.push({ product, found: kit.found, usable: kit.usable, missing: kit.coverage?.missing || [], note: kit.note || null });
      if (!kit.kit) { notes.push(`${product}: ${kit.note}`); continue; }
      const chosen = [];
      const take = (slot, item) => { if (item && !chosen.some((entry) => entry.item.id === item.id)) chosen.push({ slot, item }); };
      for (const want of wants) {
        if (want.startsWith("angle:")) take(want, kit.kit.angles?.[want.slice(6)]);
        else if (want === "identity") take(want, kit.kit.recommended[0] || kit.kit.identity[0]);
        else take(want, kit.kit[want]?.[0]);
      }
      // Always carry the identity reference for a product-led job, even if the preset did not ask for it.
      if (!chosen.some((entry) => entry.slot === "identity") && kit.kit.identity[0]) chosen.unshift({ slot: "identity", item: kit.kit.identity[0] });
      for (const { slot, item } of chosen.slice(0, max)) {
        if (assets.length >= max) break;
        try {
          const file = await materializeReference(root, db, item, { dropbox, preferOriginal: slot === "cutout" || slot === "label" });
          if (seen.has(file.path)) continue;
          seen.add(file.path);
          const mapping = SLOT_ROLE[slot] || SLOT_ROLE.device;
          const role = mapping.role === "product-canon" && assets.some((asset) => asset.role === "product-canon") ? "reference-image" : mapping.role;
          assets.push({ path: file.path, role, instructions: `${mapping.instructions} (${product}: ${item.composition}${item.angle && item.angle !== "n/a" ? `, ${item.angle}` : ""}${item.verdict === "approved" ? ", team-approved" : item.approvedFolder ? ", approved folder" : ""})`, auto: { damAssetId: item.id, slot, product, composition: item.composition, angle: item.angle, alpha: item.alpha, source: file.source, dropboxPath: item.path, note: item.note || null } });
        } catch (error) {
          notes.push(`${product} / ${slot}: could not fetch ${item.path.split("/").pop()} (${String(error.message).slice(0, 100)})`);
        }
      }
      if (kit.coverage?.missing?.length) notes.push(`${product}: the library has ${kit.coverage.missing.join("; ")} — do not invent what is missing; work with the references given`);
    }
    if (wants.includes("logo") && !assets.some((asset) => asset.role === "logo-canon")) {
      const logo = (await db.query("select id, path, proxies->>'model' as model, proxies->>'thumb' as thumb, has_alpha as alpha, title from dam.assets where brand = $1 and class = 'logo' and status in ('analyzed','embedded') and deleted_at is null order by (verdict = 'approved') desc, has_alpha desc, quality desc nulls last limit 1", [brand.id])).rows[0];
      if (logo) { try { const file = await materializeReference(root, db, logo, { dropbox, preferOriginal: true }); assets.push({ path: file.path, role: "logo-canon", instructions: SLOT_ROLE.logo.instructions, auto: { damAssetId: logo.id, slot: "logo", source: file.source, dropboxPath: logo.path } }); } catch (error) { notes.push(`logo: ${String(error.message).slice(0, 80)}`); } }
    }
    return { assets, kits, notes };
  } catch (error) {
    return { assets: [], kits: [], notes: [`DAM unavailable: ${String(error.message).slice(0, 160)}`] };
  } finally {
    if (db) await db.end().catch(() => {});
  }
}
