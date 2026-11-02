-- Anti-guessing and anti-spam counters (hashed visitor, never the raw IP).
create table if not exists public.rate_events (
  id bigserial primary key,
  kind text not null,
  key text not null,
  created_at timestamptz not null default now()
);
create index if not exists rate_events_lookup on public.rate_events (kind, key, created_at);
alter table public.rate_events enable row level security;
