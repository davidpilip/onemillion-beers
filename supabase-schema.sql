-- 1M Beers — Supabase schema
-- Run this in: Supabase dashboard → SQL Editor → New query → paste → Run
-- One-time setup. ~30 seconds.

-- ============================================================
-- ONE TABLE TO RULE THEM ALL: kv_store
-- ============================================================
-- The app uses a key-value model, so the schema is intentionally
-- simple. Shared keys (community:*, beers:*, toasts:*) have user_id NULL.
-- Personal keys (user:*) have user_id = the anonymous client identifier.
-- This makes the data 100% portable: SELECT * FROM kv_store, ship the JSON
-- to any other key-value or document store later.

create table if not exists public.kv_store (
  id          bigserial primary key,
  scope       text not null check (scope in ('shared', 'personal')),
  user_id     text,                    -- null for shared rows
  key         text not null,
  value       jsonb,
  updated_at  timestamptz not null default now(),
  unique (scope, user_id, key)
);

create index if not exists kv_scope_key_idx  on public.kv_store (scope, key);
create index if not exists kv_user_idx       on public.kv_store (user_id);
create index if not exists kv_updated_at_idx on public.kv_store (updated_at desc);

-- Helper: atomic increment for the global counter (last-write-wins safe enough
-- for v1; for hard correctness later you can add an advisory lock).
create or replace function public.kv_increment(p_key text, p_amount int default 1)
returns bigint
language plpgsql
as $$
declare
  v_new bigint;
begin
  insert into public.kv_store(scope, user_id, key, value, updated_at)
    values ('shared', null, p_key, to_jsonb(p_amount), now())
  on conflict (scope, user_id, key) do update
    set value = to_jsonb(coalesce((public.kv_store.value)::int, 0) + p_amount),
        updated_at = now()
  returning (value)::text::bigint into v_new;
  return v_new;
end;
$$;

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================
alter table public.kv_store enable row level security;

-- Anyone with the anon key can read/write SHARED rows.
-- (For a real launch with abuse risk, gate this behind real auth.)
drop policy if exists "shared rw"  on public.kv_store;
create policy "shared rw" on public.kv_store
  for all
  using  (scope = 'shared')
  with check (scope = 'shared');

-- Personal rows: in v1 we use a client-generated user_id that the client
-- includes on every read/write. This is NOT secure — anyone who guesses
-- another user_id could read their data. Acceptable for v1 (nothing
-- sensitive); upgrade to Supabase Auth + auth.uid() when ready.
drop policy if exists "personal rw" on public.kv_store;
create policy "personal rw" on public.kv_store
  for all
  using  (scope = 'personal')
  with check (scope = 'personal');

-- ============================================================
-- That's it. Three things now exist:
--   - kv_store table
--   - kv_increment(key, amount) function
--   - RLS policies that let the anon key read/write
-- ============================================================
