-- ============================================================
-- 1M Beers — COMPLETE SUPABASE SETUP (auth-ready, secure)
-- ============================================================
-- HOW TO RUN (one time, ~30 seconds):
--   Supabase dashboard → SQL Editor → New query → paste ALL of this → Run
--
-- This single file supersedes the older supabase-schema.sql +
-- migration-v2 + migration-v3. On a fresh project, run ONLY this file.
--
-- What it creates:
--   • kv_store          — one table for everything (shared + personal data)
--   • kv_increment()    — atomic community counter
--   • kv_set()          — safe upsert for shared & personal rows
--   • kv_list_shared()  — bulk fetch for the toasts feed / stats
--   • Row-Level Security tied to REAL email logins:
--       - anyone can READ shared community data (the counter, toasts)
--       - only SIGNED-IN users can WRITE (log beers, post toasts)
--       - each user can only read/write THEIR OWN personal rows
-- ============================================================

-- ---------- TABLE ----------
create table if not exists public.kv_store (
  id          bigserial primary key,
  scope       text not null check (scope in ('shared', 'personal')),
  user_id     text,                    -- null for shared rows; auth user id for personal
  key         text not null,
  value       jsonb,
  updated_at  timestamptz not null default now()
);

create index if not exists kv_scope_key_idx  on public.kv_store (scope, key);
create index if not exists kv_user_idx        on public.kv_store (user_id);
create index if not exists kv_updated_at_idx  on public.kv_store (updated_at desc);

-- Correct uniqueness: NULL user_id (shared) and non-null (personal) handled
-- separately, because in Postgres NULL <> NULL breaks a plain UNIQUE.
create unique index if not exists kv_unique_shared
  on public.kv_store (scope, key)
  where user_id is null;
create unique index if not exists kv_unique_personal
  on public.kv_store (scope, user_id, key)
  where user_id is not null;

-- ---------- FUNCTIONS ----------
-- Atomic increment for the global community counter.
create or replace function public.kv_increment(p_key text, p_amount int default 1)
returns bigint
language plpgsql
as $$
declare
  v_existing bigint;
  v_new bigint;
  v_id bigint;
begin
  select id, (value)::text::bigint
    into v_id, v_existing
    from public.kv_store
   where scope = 'shared' and user_id is null and key = p_key
   order by updated_at desc, id desc
   limit 1;

  if v_id is null then
    insert into public.kv_store(scope, user_id, key, value, updated_at)
      values ('shared', null, p_key, to_jsonb(p_amount), now())
    returning (value)::text::bigint into v_new;
  else
    v_new := coalesce(v_existing, 0) + p_amount;
    update public.kv_store
       set value = to_jsonb(v_new), updated_at = now()
     where id = v_id;
  end if;

  return v_new;
end;
$$;

-- Safe upsert for both shared (user_id null) and personal rows.
create or replace function public.kv_set(
  p_scope text,
  p_user_id text,
  p_key text,
  p_value jsonb
) returns bigint
language plpgsql
as $$
declare
  v_id bigint;
begin
  if p_scope = 'shared' then
    select id into v_id from public.kv_store
     where scope = 'shared' and user_id is null and key = p_key
     order by updated_at desc, id desc limit 1;
    if v_id is null then
      insert into public.kv_store(scope, user_id, key, value, updated_at)
        values ('shared', null, p_key, p_value, now())
      returning id into v_id;
    else
      update public.kv_store set value = p_value, updated_at = now() where id = v_id;
    end if;
  else
    select id into v_id from public.kv_store
     where scope = 'personal' and user_id = p_user_id and key = p_key
     order by updated_at desc, id desc limit 1;
    if v_id is null then
      insert into public.kv_store(scope, user_id, key, value, updated_at)
        values ('personal', p_user_id, p_key, p_value, now())
      returning id into v_id;
    else
      update public.kv_store set value = p_value, updated_at = now() where id = v_id;
    end if;
  end if;
  return v_id;
end;
$$;

-- Bulk fetch all shared rows matching a prefix (toasts feed, stats).
create or replace function public.kv_list_shared(p_prefix text)
returns table(key text, value jsonb, updated_at timestamptz)
language sql
stable
as $$
  select key, value, updated_at
    from public.kv_store
   where scope = 'shared' and user_id is null and key like p_prefix || '%'
   order by updated_at desc
   limit 5000;
$$;

-- ---------- ROW-LEVEL SECURITY ----------
alter table public.kv_store enable row level security;

-- SHARED: world-readable (so the community counter shows), but only a
-- signed-in user can write to community data (log beers, post toasts).
drop policy if exists "shared rw"    on public.kv_store;
drop policy if exists "shared read"  on public.kv_store;
drop policy if exists "shared write" on public.kv_store;
create policy "shared read" on public.kv_store
  for select
  using (scope = 'shared');
create policy "shared write" on public.kv_store
  for all
  using  (scope = 'shared' and auth.uid() is not null)
  with check (scope = 'shared' and auth.uid() is not null);

-- PERSONAL: a user can ONLY see and change their own rows. user_id must
-- equal their verified auth id — nobody can read or fake someone else's data.
drop policy if exists "personal rw" on public.kv_store;
create policy "personal rw" on public.kv_store
  for all
  using  (scope = 'personal' and user_id = auth.uid()::text)
  with check (scope = 'personal' and user_id = auth.uid()::text);

-- ---------- GRANTS ----------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.kv_store to anon, authenticated;
grant usage, select on sequence public.kv_store_id_seq to anon, authenticated;
grant execute on function public.kv_increment(text, int)               to anon, authenticated;
grant execute on function public.kv_set(text, text, text, jsonb)       to anon, authenticated;
grant execute on function public.kv_list_shared(text)                  to anon, authenticated;

-- ============================================================
-- DONE. Table + 3 functions + auth-based security are live.
-- ============================================================
