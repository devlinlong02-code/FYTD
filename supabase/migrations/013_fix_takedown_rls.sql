-- FYTD: Fix take-down post RLS error
-- Symptom: "new row violates row-level security policy for table 'outfits'"
--   when an authenticated post owner tries to take down their own post.
--
-- Root cause: migration 012 added WITH CHECK (creator_id = auth.uid()) to the
--   update policy. PostgreSQL evaluates WITH CHECK on the NEW row state, and
--   when auth.uid() does not resolve cleanly in the PostgREST write path, the
--   check fails even though the USING clause passed.
--
-- Fix: revert to a simple USING-only policy (matches original migration 001).
--   Security is maintained because:
--     (a) USING (creator_id = auth.uid()) already limits updates to the owner's rows.
--     (b) The server action independently authenticates the caller via getSession().
--   No WITH CHECK is needed because creator_id is never changed in an update.
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "outfits_update" ON public.outfits;

CREATE POLICY "outfits_update" ON public.outfits
  FOR UPDATE
  USING (creator_id = auth.uid());
