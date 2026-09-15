-- DAM schema — the content-intelligence index. Lives in its own Postgres schema (`dam`) inside the
-- engine's Supabase project so nothing here touches the ledger or the legacy DAM's tables.
-- Idempotent: safe to re-run. Apply with `npm run content -- dam init-db`.
--
-- Design rules:
--   * Originals stay in Dropbox (source of truth). We keep hashes, proxies and understanding.
--   * Every model-derived field is versioned (analyzer, model, schema_version) so a better model is a
--     re-analysis job, not a migration. The raw model record is kept in `analysis` JSONB.
--   * Two embeddings per asset: a rich text document (what it is, what it says, what it's for) and a
--     visual embedding (what it looks like), because the two answer different queries.

create extension if not exists vector;
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

create schema if not exists dam;

create table if not exists dam.sources (
  id            text primary key,                 -- e.g. dropbox:muha_meds:thc  | local:brand-context
  kind          text not null check (kind in ('dropbox','local')),
  root          text not null,                    -- dropbox path or absolute local dir
  brand_hint    text,                             -- brand id the folder belongs to, if known
  cursor        text,                             -- dropbox list_folder cursor
  enabled       boolean not null default true,
  last_sync_at  timestamptz,
  last_error    text,
  created_at    timestamptz not null default now()
);

create table if not exists dam.assets (
  id                  uuid primary key default gen_random_uuid(),
  source_id           text not null references dam.sources(id) on delete cascade,
  external_id         text,                       -- dropbox file id
  path                text not null,              -- source-relative path (dropbox path_display or local relative)
  name                text not null,
  extension           text,
  mime                text,
  kind                text not null,              -- image | video | document | audio | vector | other
  bytes               bigint,
  content_hash        text,                       -- sha256 of the file
  phash               text,                       -- 64-bit perceptual hash (hex), images + video first frame
  width               integer,
  height              integer,
  orientation         text,
  duration_s          double precision,
  fps                 double precision,
  has_audio           boolean,
  has_alpha           boolean,
  dominant_colors     jsonb,
  modified_at         timestamptz,                -- source modification time
  -- understanding (latest analysis, denormalised for filtering)
  brand               text,
  brand_confidence    real,
  class               text,
  subclass            text,                       -- video form
  product             text,
  product_confidence  real,
  people_count        integer,
  is_real_human       boolean,
  ocr_text            text,
  title               text,
  summary             text,
  search_doc          text,                       -- the full retrieval document
  tags                text[] not null default '{}',
  reference_roles     text[] not null default '{}',
  quality             real,
  flags               jsonb not null default '{}'::jsonb,   -- watermarked, low_resolution, outdated_or_wrong, do_not_use, duplicate_of
  analysis            jsonb,                      -- the full structured model record
  analyzer            jsonb,                      -- {schema_version, vision:{provider,model}, transcribe:{...}, embed:{...}, analyzed_at}
  embedding_text      vector(768),
  embedding_visual    vector(768),
  proxies             jsonb not null default '{}'::jsonb,   -- {thumb, contact, preview, keyframes:[…]} storage URLs or local paths
  status              text not null default 'discovered',  -- discovered | probed | analyzed | embedded | failed | skipped
  error               text,
  verdict             text,                       -- human: approved | rejected | null
  verdict_reason      text,
  duplicate_of        uuid references dam.assets(id),
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  analyzed_at         timestamptz,
  tsv                 tsvector generated always as (
                        setweight(to_tsvector('english', coalesce(title,'')), 'A') ||
                        setweight(to_tsvector('english', coalesce(product,'')), 'A') ||
                        setweight(to_tsvector('english', coalesce(ocr_text,'')), 'B') ||
                        setweight(array_to_tsvector(tags), 'B') ||
                        setweight(to_tsvector('english', coalesce(summary,'')), 'C') ||
                        setweight(to_tsvector('english', coalesce(search_doc,'')), 'D') ||
                        setweight(to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(path,'')), 'D')
                      ) stored,
  unique (source_id, path)
);

create index if not exists ix_dam_assets_brand_class on dam.assets (brand, class) where deleted_at is null;
create index if not exists ix_dam_assets_status on dam.assets (status) where deleted_at is null;
create index if not exists ix_dam_assets_hash on dam.assets (content_hash);
create index if not exists ix_dam_assets_phash on dam.assets (phash);
create index if not exists ix_dam_assets_tsv on dam.assets using gin (tsv);
create index if not exists ix_dam_assets_tags on dam.assets using gin (tags);
create index if not exists ix_dam_assets_roles on dam.assets using gin (reference_roles);
create index if not exists ix_dam_assets_name_trgm on dam.assets using gin (name gin_trgm_ops);
create index if not exists ix_dam_assets_emb_text on dam.assets using hnsw (embedding_text vector_cosine_ops) with (m = 16, ef_construction = 64);
create index if not exists ix_dam_assets_emb_visual on dam.assets using hnsw (embedding_visual vector_cosine_ops) with (m = 16, ef_construction = 64);

-- Video understanding: the measured layer (ffmpeg arithmetic) + transcript + the model's read.
create table if not exists dam.video_analysis (
  asset_id        uuid primary key references dam.assets(id) on delete cascade,
  schema_version  integer not null,
  measured        jsonb not null,     -- {duration_s, ratio, fps, cuts:[…], shot_count, avg_shot_s, loudness_lufs, motion:{mean, p90, jitter, still_ratio}, has_audio}
  transcript      jsonb,              -- {text, segments:[{start,end,text}], words, speaking_s, articulation_wps, hook_end_s, pauses_over_300ms:[…], model}
  read            jsonb,              -- VIDEO_ANALYSIS_SCHEMA record
  keyframes       jsonb,              -- [{t, url}]
  created_at      timestamptz not null default now()
);

-- Shot-level index so a query can land on a moment, not a file.
create table if not exists dam.shots (
  id               bigserial primary key,
  asset_id         uuid not null references dam.assets(id) on delete cascade,
  idx              integer not null,
  start_s          double precision not null,
  end_s            double precision not null,
  keyframe         text,
  description      text,
  embedding_visual vector(768),
  unique (asset_id, idx)
);
create index if not exists ix_dam_shots_emb on dam.shots using hnsw (embedding_visual vector_cosine_ops) with (m = 16, ef_construction = 64);

-- Durable job queue (SKIP LOCKED claim). Kinds: discover | probe | analyze | embed | ugc-profile | link-kg
create table if not exists dam.jobs (
  id          bigserial primary key,
  kind        text not null,
  source_id   text references dam.sources(id) on delete cascade,
  asset_id    uuid references dam.assets(id) on delete cascade,
  payload     jsonb not null default '{}'::jsonb,
  status      text not null default 'pending',   -- pending | running | done | failed | dead
  priority    integer not null default 100,
  attempts    integer not null default 0,
  max_attempts integer not null default 3,
  run_after   timestamptz not null default now(),
  locked_by   text,
  locked_at   timestamptz,
  error       text,
  created_at  timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists ix_dam_jobs_claim on dam.jobs (status, priority, run_after) where status = 'pending';
create unique index if not exists ux_dam_jobs_open on dam.jobs (kind, coalesce(asset_id::text, ''), coalesce(source_id, '')) where status in ('pending','running');

drop function if exists dam.claim_jobs(text, integer);
drop function if exists dam.claim_jobs(text, integer, text[]);
drop function if exists dam.claim_jobs(text, integer, text[], text);
create or replace function dam.claim_jobs(p_worker text, p_limit integer, p_kinds text[] default null, p_source_prefix text default null, p_auto_only boolean default false)
returns setof dam.jobs language plpgsql as $$
begin
  return query
  with picked as (
    select id from dam.jobs
    where status = 'pending' and run_after <= now() and (p_kinds is null or kind = any(p_kinds))
      and (p_source_prefix is null or source_id like p_source_prefix || '%')
      and (not p_auto_only or kind in ('discover','probe') or coalesce(payload, '{}'::jsonb) ? 'auto')
    order by priority asc, created_at asc
    for update skip locked
    limit p_limit
  )
  update dam.jobs j set status = 'running', locked_by = p_worker, locked_at = now(), attempts = attempts + 1
  from picked where j.id = picked.id
  returning j.*;
end $$;

-- Every paid call, so the loop is auditable and cap-able.
create table if not exists dam.spend (
  id          bigserial primary key,
  asset_id    uuid references dam.assets(id) on delete set null,
  provider    text not null,
  model       text not null,
  kind        text not null,      -- vision | transcribe | embed | rerank
  usd         numeric(10,5) not null default 0,
  tokens_in   integer,
  tokens_out  integer,
  created_at  timestamptz not null default now()
);
create index if not exists ix_dam_spend_created on dam.spend (created_at);

-- Per-brand UGC profile distilled from real human content: the bands a generated piece must land in.
create table if not exists dam.ugc_profiles (
  brand           text primary key,
  schema_version  integer not null,
  sample_size     integer not null,
  bands           jsonb not null,   -- {duration_s:{min,max,median}, articulation_wps:{…}, hook_end_s:{…}, shot_count:{…}, loudness_lufs:{…}, ratios:{…}}
  patterns        jsonb not null,   -- counted: forms, hook_types, framings, settings, camera_behaviors, imperfections, cta presence
  exemplars       uuid[] not null default '{}',
  laws            jsonb not null default '[]'::jsonb,   -- six-field laws derived from the bands
  computed_at     timestamptz not null default now()
);

-- Knowledge-graph links: which DAM asset became which registry ref / exemplar / law, and back.
create table if not exists dam.kg_links (
  id          bigserial primary key,
  asset_id    uuid not null references dam.assets(id) on delete cascade,
  kg_kind     text not null,     -- product-candidate | product-canonical | ugc-exemplar | law | approved-output
  kg_ref      text not null,     -- e.g. knowledge/products/muha-meds.json#MM-dual-flavor-aio | learn:muha:…
  brand       text,
  created_at  timestamptz not null default now(),
  unique (asset_id, kg_kind, kg_ref)
);

-- Worker liveness
create table if not exists dam.workers (
  id           text primary key,
  activity     text,
  last_seen_at timestamptz not null default now(),
  started_at   timestamptz not null default now()
);

create or replace function dam.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_dam_assets_touch on dam.assets;
create trigger trg_dam_assets_touch before update on dam.assets for each row execute function dam.touch_updated_at();
