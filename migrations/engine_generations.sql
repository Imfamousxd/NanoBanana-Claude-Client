-- engine_generations — the generation ledger. Every run of video-engine.mjs lands here:
-- prompt, full engineering, cost, gate results, and the operator's verdict. Rejects included
-- (they are the enhancement backlog). Dumped from the live schema 2026-08-09.
--
-- Run against a NEW Supabase project with:
--   psql "$DIRECT_URL" -f migrations/engine_generations.sql
-- (DIRECT_URL = the session-mode pooler string, port 5432, from the project's DB settings.)

create table if not exists public.engine_generations (
  id               uuid primary key default gen_random_uuid(),
  task_id          text unique,
  created_at       timestamptz default now(),
  generated_at     timestamptz,
  brand            text,
  campaign         text,
  brief_id         text,
  lane             text,
  model            text,
  duration_s       numeric,
  resolution       text,
  ratio            text,
  prompt_text      text,
  request_json     jsonb,
  response_json    jsonb,
  seed             bigint,
  tokens           integer,
  cost_usd         numeric,
  status           text,
  error_code       text,
  gates            jsonb,
  operator_verdict text default 'pending',
  rejected_by      text,
  file_path        text,
  engine_version   text
);

-- RLS ON with NO policies: only the service-role key can read/write. The ledger holds prompts
-- and spend — it must not be visible through the anon/publishable key.
alter table public.engine_generations enable row level security;

create index if not exists engine_generations_brand_idx            on public.engine_generations (brand);
create index if not exists engine_generations_status_idx           on public.engine_generations (status);
create index if not exists engine_generations_operator_verdict_idx on public.engine_generations (operator_verdict);
create index if not exists engine_generations_created_at_idx       on public.engine_generations (created_at);
