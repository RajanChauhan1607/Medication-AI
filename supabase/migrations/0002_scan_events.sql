-- Track 3 — backend hardening: usage log + rate-limit source table.
-- Only the Edge Function (service role) reads/writes this; clients cannot touch it.

create table if not exists public.scan_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,                       -- null while there's no login yet (anonymous scans)
  identity    text not null,              -- user id, or "ip:<addr>" for anonymous callers
  ok          boolean not null default true,
  med_count   int default 0,
  ms          int,                        -- round-trip time to Gemini, for monitoring
  created_at  timestamptz not null default now()
);

create index if not exists scan_events_identity_time
  on public.scan_events (identity, created_at desc);

-- RLS on, no policies → clients (anon/auth) get zero access; the service role bypasses RLS.
alter table public.scan_events enable row level security;
