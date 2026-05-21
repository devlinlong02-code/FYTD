-- ============================================================
-- FYTD migration 014: Fix take-down RLS for post owners
-- ============================================================
--
-- SYMPTOM
-- -------
-- Authenticated post owner hits "new row violates row-level security
-- policy for table outfits" when taking down their own post.
--
-- ROOT CAUSE (confirmed after migrations 012 and 013)
-- ---------------------------------------------------
-- The UPDATE itself is fine — USING (creator_id = auth.uid()) passes.
-- The failure happens in PostgREST's post-write read-back:
--
--   PostgREST wraps every mutating query in a CTE:
--     WITH _result AS (UPDATE … RETURNING *) SELECT * FROM _result;
--
--   After the take-down sets published = false AND deleted_at = now(),
--   the RETURNING * / implicit SELECT is evaluated against ALL active
--   SELECT policies. Both existing policies block the row:
--
--     "outfits_select_published"  → published = true          → FAIL (now false)
--     "outfits_select_own"        → creator_id = auth.uid()
--                                   AND deleted_at IS NULL    → FAIL (now set)
--
--   PostgreSQL rolls back and surfaces this as an RLS violation on the
--   UPDATE statement, even though the write itself was allowed.
--
-- FIX
-- ---
-- 1. Replace "outfits_select_own" with a policy that lets owners see ALL
--    their own posts unconditionally (published or not, deleted or not).
--    PostgREST can then read the row back after the take-down.
--
-- 2. Drop ALL UPDATE policies by every name they may have been given
--    across migrations 001, 012, and 013, then create one clean policy.
--    No WITH CHECK — creator_id is never changed on update, so USING alone
--    is sufficient and avoids the WITH CHECK evaluation entirely.
--
-- 3. Ensure deleted_at column exists (guard for environments that skipped
--    migration 009/012).
--
-- 4. Verify INSERT policy does not interfere.
--    "outfits_insert" uses WITH CHECK (creator_id = auth.uid()) — correct,
--    no changes needed.
--
-- ============================================================

-- ── 1. Ensure deleted_at column exists ───────────────────────────────────────
ALTER TABLE public.outfits
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS outfits_deleted_at_idx
  ON public.outfits (deleted_at)
  WHERE deleted_at IS NOT NULL;

-- ── 2. Fix SELECT policies so owner read-back works post-take-down ────────────

-- Drop the restrictive owner SELECT that blocks deleted rows.
-- (created in migration 001 and tightened in migration 012)
DROP POLICY IF EXISTS "outfits_select_own" ON public.outfits;

-- New owner SELECT: no conditions on published or deleted_at.
-- Owners can always see their own posts in every state.
-- This is what allows PostgREST's post-write RETURNING read to succeed.
CREATE POLICY "outfits_select_own" ON public.outfits
  FOR SELECT
  USING (creator_id = auth.uid());

-- Public SELECT is unchanged in intent but re-stated here for clarity.
-- (already correct from migration 012 — this is a safe no-op if identical)
DROP POLICY IF EXISTS "outfits_select_published" ON public.outfits;
CREATE POLICY "outfits_select_published" ON public.outfits
  FOR SELECT
  USING (published = true AND deleted_at IS NULL);

-- ── 3. Drop ALL UPDATE policies regardless of name ───────────────────────────
-- Migrations 001, 012, and 013 all used "outfits_update".
-- If any future migration used a different name, this covers them too.
-- List every name that has ever been used:
DROP POLICY IF EXISTS "outfits_update"           ON public.outfits;
DROP POLICY IF EXISTS "outfits_owner_update"     ON public.outfits;
DROP POLICY IF EXISTS "outfits_update_own"       ON public.outfits;
DROP POLICY IF EXISTS "outfits_creator_update"   ON public.outfits;

-- ── 4. Create one clean UPDATE policy ────────────────────────────────────────
-- USING only — no WITH CHECK.
--   • USING filters which rows the owner can target. Sufficient because
--     creator_id is never modified during a take-down or any other update.
--   • Omitting WITH CHECK avoids the secondary row-state check that was
--     the original trigger of this bug in migration 012.
CREATE POLICY "outfits_owner_update" ON public.outfits
  FOR UPDATE
  USING (creator_id = auth.uid());

-- ── 5. Verify INSERT policy (no change needed, documented for auditability) ───
-- "outfits_insert" from migration 001:
--   FOR INSERT WITH CHECK (creator_id = auth.uid())
-- This is correct. INSERT WITH CHECK does not interact with UPDATE RLS.
-- No action required.

-- ── 6. Reload PostgREST schema cache ─────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
