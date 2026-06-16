-- 1M Beers — Migration v3 — fix upsert for shared rows
-- Run this in: Supabase dashboard → SQL Editor → New query → paste → Run
--
-- THE PROBLEM
-- After migration v2 replaced the all-column unique constraint with two
-- partial indexes, Supabase's REST upsert with onConflict='scope,user_id,key'
-- has no matching constraint to target. Shared writes (user_id NULL) silently
-- fail or insert duplicates. Result: toasts don't appear for other users,
-- stats can't aggregate.
--
-- THE FIX
-- A kv_set() function that does the right thing for shared vs personal,
-- and a kv_get_many() function so the client can fetch all toasts in one
-- query instead of one round-trip per key.

CREATE OR REPLACE FUNCTION public.kv_set(
  p_scope text,
  p_user_id text,
  p_key text,
  p_value jsonb
) RETURNS bigint
LANGUAGE plpgsql
AS $$
DECLARE
  v_id bigint;
BEGIN
  IF p_scope = 'shared' THEN
    SELECT id INTO v_id FROM public.kv_store
     WHERE scope = 'shared' AND user_id IS NULL AND key = p_key
     ORDER BY updated_at DESC, id DESC LIMIT 1;
    IF v_id IS NULL THEN
      INSERT INTO public.kv_store(scope, user_id, key, value, updated_at)
        VALUES ('shared', NULL, p_key, p_value, now())
      RETURNING id INTO v_id;
    ELSE
      UPDATE public.kv_store
         SET value = p_value, updated_at = now()
       WHERE id = v_id;
    END IF;
  ELSE
    SELECT id INTO v_id FROM public.kv_store
     WHERE scope = 'personal' AND user_id = p_user_id AND key = p_key
     ORDER BY updated_at DESC, id DESC LIMIT 1;
    IF v_id IS NULL THEN
      INSERT INTO public.kv_store(scope, user_id, key, value, updated_at)
        VALUES ('personal', p_user_id, p_key, p_value, now())
      RETURNING id INTO v_id;
    ELSE
      UPDATE public.kv_store
         SET value = p_value, updated_at = now()
       WHERE id = v_id;
    END IF;
  END IF;
  RETURN v_id;
END;
$$;

-- Bulk fetch — pass a prefix, get all matching shared rows with their values.
-- Used by the Toasts feed + Stats page so they don't make one query per key.
CREATE OR REPLACE FUNCTION public.kv_list_shared(p_prefix text)
RETURNS TABLE(key text, value jsonb, updated_at timestamptz)
LANGUAGE sql
STABLE
AS $$
  SELECT key, value, updated_at
    FROM public.kv_store
   WHERE scope = 'shared' AND user_id IS NULL AND key LIKE p_prefix || '%'
   ORDER BY updated_at DESC
   LIMIT 5000;
$$;

-- Clean up duplicate shared rows that the broken upsert may have created
WITH ranked AS (
  SELECT id, row_number() OVER (
    PARTITION BY key ORDER BY updated_at DESC, id DESC
  ) AS rn
  FROM public.kv_store
  WHERE scope = 'shared' AND user_id IS NULL
)
DELETE FROM public.kv_store
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);
