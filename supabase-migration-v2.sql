-- 1M Beers — Migration v2 — FIX MULTI-USER BUG
-- Run this in: Supabase dashboard → SQL Editor → New query → paste → Run

-- ============================================================
-- THE PROBLEM
-- ============================================================
-- The original schema used:
--   UNIQUE (scope, user_id, key)
-- But in PostgreSQL, NULL ≠ NULL, so the unique constraint NEVER fires
-- for shared rows (where user_id is NULL). Every upsert with a NULL
-- user_id inserted a duplicate row instead of updating.
--
-- Result: the global counter, toasts feed, beer database, etc all
-- accumulated duplicate rows. Each user's reads then failed (because
-- .maybeSingle() throws on multiple rows) and they saw an empty feed.
--
-- This migration fixes everything in three steps:
--   1. Dedupe existing rows (keep newest)
--   2. Replace the unique constraint with two partial indexes
--      that correctly handle NULL user_id
--   3. Patch the kv_increment function so it picks one row reliably

-- ============================================================
-- STEP 1: Dedupe (keep newest row per logical key)
-- ============================================================
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY scope, COALESCE(user_id, '__shared__'), key
           ORDER BY updated_at DESC, id DESC
         ) AS rn
  FROM public.kv_store
)
DELETE FROM public.kv_store
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- ============================================================
-- STEP 2: Replace constraint with proper partial unique indexes
-- ============================================================
ALTER TABLE public.kv_store DROP CONSTRAINT IF EXISTS kv_store_scope_user_id_key_key;

CREATE UNIQUE INDEX IF NOT EXISTS kv_unique_shared
  ON public.kv_store (scope, key)
  WHERE user_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS kv_unique_personal
  ON public.kv_store (scope, user_id, key)
  WHERE user_id IS NOT NULL;

-- ============================================================
-- STEP 3: Patch kv_increment to be order-stable
-- ============================================================
CREATE OR REPLACE FUNCTION public.kv_increment(p_key text, p_amount int default 1)
RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  v_existing bigint;
  v_new bigint;
  v_id bigint;
BEGIN
  -- Find the most recent shared row for this key
  SELECT id, (value)::text::bigint
    INTO v_id, v_existing
    FROM public.kv_store
   WHERE scope = 'shared' AND user_id IS NULL AND key = p_key
   ORDER BY updated_at DESC, id DESC
   LIMIT 1;

  IF v_id IS NULL THEN
    INSERT INTO public.kv_store(scope, user_id, key, value, updated_at)
      VALUES ('shared', null, p_key, to_jsonb(p_amount), now())
    RETURNING (value)::text::bigint INTO v_new;
  ELSE
    v_new := COALESCE(v_existing, 0) + p_amount;
    UPDATE public.kv_store
       SET value = to_jsonb(v_new), updated_at = now()
     WHERE id = v_id;
  END IF;

  RETURN v_new;
END;
$$;

-- ============================================================
-- DONE. Now the unique constraint actually fires, upserts work,
-- and the counter / toasts feed / beer database stay in one row
-- each instead of duplicating.
-- ============================================================
