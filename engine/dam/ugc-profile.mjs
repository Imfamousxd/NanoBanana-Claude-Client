// UGC profile — what the brand's REAL human content actually does, measured across every ugc-video
// the DAM has read: duration and ratio bands, articulation rate, hook timing, shot rhythm, loudness,
// plus counted patterns (forms, hook types, framings, settings, camera behaviour, imperfections).
// The bands become six-field laws the generation side can be gated by, the same contract as
// graph-fragments/house_laws.json — but derived from the client's own human content, continuously.
import { ANALYSIS_SCHEMA_VERSION } from "./taxonomy.mjs";

function band(values) {
  const clean = values.filter((value) => typeof value === "number" && Number.isFinite(value)).sort((a, b) => a - b);
  if (!clean.length) return null;
  const at = (q) => clean[Math.min(clean.length - 1, Math.floor(q * (clean.length - 1)))];
  return { n: clean.length, min: clean[0], p25: at(0.25), median: at(0.5), p75: at(0.75), max: clean.at(-1) };
}

function count(values, top = 8) {
  const counts = new Map();
  for (const value of values.flat().filter(Boolean)) { const key = String(value).toLowerCase().trim(); counts.set(key, (counts.get(key) || 0) + 1); }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, top).map(([value, n]) => ({ value, n }));
}

function confidenceFor(n) { return n >= 12 ? "strong" : n >= 5 ? "moderate" : "weak"; }

export function distillLaws(brand, bands, patterns, sampleSize) {
  const laws = [];
  const conf = confidenceFor(sampleSize);
  const source = `dam.ugc_profiles/${brand} (n=${sampleSize}, ${new Date().toISOString().slice(0, 10)})`;
  if (bands.duration_s) laws.push({ id: `ugc:${brand}:duration-band`, claim: `Real ${brand} creator videos run ${bands.duration_s.p25}-${bands.duration_s.p75}s (median ${bands.duration_s.median}s); a generated piece outside ${bands.duration_s.min}-${bands.duration_s.max}s is off the house corpus.`, evidence: `measured on ${bands.duration_s.n} real ugc-video assets`, counterexamples: "none recorded", applies_to: "ugc-video", confidence: conf, source });
  if (bands.articulation_wps) laws.push({ id: `ugc:${brand}:articulation-band`, claim: `Real creators for ${brand} speak at ${bands.articulation_wps.p25}-${bands.articulation_wps.p75} words per second of speech (median ${bands.articulation_wps.median}); scripts should be paced to that, not to wall-clock.`, evidence: `transcript-measured on ${bands.articulation_wps.n} assets`, counterexamples: "none recorded", applies_to: "ugc-video", confidence: conf, source });
  if (bands.hook_end_s) laws.push({ id: `ugc:${brand}:hook-lands-early`, claim: `The first spoken sentence in real ${brand} creator videos ends by ${bands.hook_end_s.median}s (p75 ${bands.hook_end_s.p75}s); a hook that has not landed by then is late.`, evidence: `first-segment end time across ${bands.hook_end_s.n} assets`, counterexamples: "none recorded", applies_to: "ugc-video", confidence: conf, source });
  if (bands.shot_count) laws.push({ id: `ugc:${brand}:shot-rhythm`, claim: `Real ${brand} creator videos carry ${bands.shot_count.p25}-${bands.shot_count.p75} shots (median ${bands.shot_count.median}); ${bands.shot_count.median <= 1 ? "the house register is a single unbroken take" : "cuts are part of the register"}.`, evidence: `scene-detect on ${bands.shot_count.n} assets`, counterexamples: "none recorded", applies_to: "ugc-video", confidence: conf, source });
  if (bands.loudness_lufs) laws.push({ id: `ugc:${brand}:loudness-band`, claim: `Real ${brand} creator audio sits at ${bands.loudness_lufs.p25} to ${bands.loudness_lufs.p75} LUFS integrated; deliver generated pieces in that band.`, evidence: `EBU R128 on ${bands.loudness_lufs.n} assets`, counterexamples: "none recorded", applies_to: "ugc-video", confidence: conf, source });
  const topFraming = patterns.framings?.[0];
  if (topFraming) laws.push({ id: `ugc:${brand}:dominant-framing`, claim: `The dominant real-creator framing for ${brand} is "${topFraming.value}" (${topFraming.n} of ${sampleSize}); default generated UGC to it.`, evidence: "model read of contact sheets", counterexamples: "none recorded", applies_to: "ugc-video", confidence: conf, source });
  const topHook = patterns.hook_types?.[0];
  if (topHook) laws.push({ id: `ugc:${brand}:dominant-hook-type`, claim: `Real ${brand} creators open with a "${topHook.value}" hook most often (${topHook.n} of ${sampleSize}).`, evidence: "model read of first 2s + transcript", counterexamples: "none recorded", applies_to: "ugc-video", confidence: conf, source });
  if (patterns.imperfections?.length) laws.push({ id: `ugc:${brand}:reality-cues`, claim: `The reality cues that recur in real ${brand} creator content are: ${patterns.imperfections.slice(0, 5).map((item) => item.value).join("; ")}. Use two or three of these, not a generic list.`, evidence: "counted across the corpus", counterexamples: "none recorded", applies_to: "ugc-video", confidence: conf, source });
  return laws;
}

export async function computeUgcProfiles(db, graph, { brand = undefined } = {}) {
  const brands = brand ? [brand] : graph.nodes.filter((node) => node.type === "brand").map((node) => node.id);
  const results = [];
  for (const brandId of brands) {
    const { rows } = await db.query(`select a.id, a.duration_s, a.orientation, a.quality, a.subclass, v.measured, v.transcript, v.read
      from dam.assets a join dam.video_analysis v on v.asset_id = a.id
      where a.brand = $1 and a.class = 'ugc-video' and a.is_real_human = true and a.deleted_at is null and a.duplicate_of is null`, [brandId]);
    if (!rows.length) continue;
    const bands = {
      duration_s: band(rows.map((row) => row.duration_s)),
      articulation_wps: band(rows.map((row) => row.transcript?.articulation_wps)),
      words: band(rows.map((row) => row.transcript?.words)),
      hook_end_s: band(rows.map((row) => row.transcript?.hook_end_s)),
      shot_count: band(rows.map((row) => row.measured?.shot_count)),
      avg_shot_s: band(rows.map((row) => row.measured?.avg_shot_s)),
      loudness_lufs: band(rows.map((row) => row.measured?.loudness_lufs)),
      motion_mean: band(rows.map((row) => row.measured?.motion?.mean)),
      ratios: count(rows.map((row) => row.orientation)),
    };
    const patterns = {
      forms: count(rows.map((row) => row.subclass)),
      hook_types: count(rows.map((row) => row.read?.structure?.hook_type)),
      framings: count(rows.map((row) => row.read?.creator?.framing)),
      energies: count(rows.map((row) => row.read?.creator?.energy)),
      settings: count(rows.map((row) => row.read?.setting?.split(/[,.;]/)[0])),
      camera_behaviors: count(rows.map((row) => row.read?.capture?.camera_behavior)),
      camera_reads: count(rows.map((row) => row.measured?.camera_read)),
      imperfections: count(rows.map((row) => row.read?.capture?.imperfections || []), 10),
      music: count(rows.map((row) => row.read?.audio?.music)),
      cta_present: { with: rows.filter((row) => row.read?.structure?.cta).length, without: rows.filter((row) => !row.read?.structure?.cta).length },
    };
    const exemplars = rows.filter((row) => (row.quality || 0) >= 0.6).sort((a, b) => (b.quality || 0) - (a.quality || 0)).slice(0, 12).map((row) => row.id);
    const laws = distillLaws(brandId, bands, patterns, rows.length);
    await db.query(`insert into dam.ugc_profiles (brand, schema_version, sample_size, bands, patterns, exemplars, laws, computed_at) values ($1,$2,$3,$4,$5,$6,$7,now())
      on conflict (brand) do update set schema_version = excluded.schema_version, sample_size = excluded.sample_size, bands = excluded.bands, patterns = excluded.patterns, exemplars = excluded.exemplars, laws = excluded.laws, computed_at = now()`,
      [brandId, ANALYSIS_SCHEMA_VERSION, rows.length, JSON.stringify(bands), JSON.stringify(patterns), exemplars, JSON.stringify(laws)]);
    results.push({ brand: brandId, sampleSize: rows.length, laws: laws.length, exemplars: exemplars.length });
  }
  return { profiles: results };
}

export async function getUgcProfile(db, brandId) {
  const { rows } = await db.query("select * from dam.ugc_profiles where brand = $1", [brandId]);
  if (!rows[0]) return null;
  const profile = rows[0];
  const { rows: exemplars } = await db.query("select id, path, title, summary, duration_s, orientation, quality, proxies, subclass from dam.assets where id = any($1::uuid[]) order by quality desc nulls last", [profile.exemplars]);
  return { ...profile, exemplarAssets: exemplars };
}
