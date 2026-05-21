-- FYTD: enforce owner-only mutations and exclude deleted posts everywhere
-- Run in Supabase SQL Editor after 009_soft_delete.sql

-- ── Outfits: SELECT ───────────────────────────────────────────────────────────
-- Replace the published-read policy to also exclude soft-deleted posts.
DROP POLICY IF EXISTS "outfits_select_published" ON public.outfits;
CREATE POLICY "outfits_select_published" ON public.outfits
  FOR SELECT USING (published = true AND deleted_at IS NULL);

-- The owner-read policy (used by admin/edit pages) should also exclude deleted posts.
-- Creators do not need to see posts they have taken down.
DROP POLICY IF EXISTS "outfits_select_own" ON public.outfits;
CREATE POLICY "outfits_select_own" ON public.outfits
  FOR SELECT USING (creator_id = auth.uid() AND deleted_at IS NULL);

-- ── Outfits: UPDATE ───────────────────────────────────────────────────────────
-- Add WITH CHECK so the creator_id column cannot be changed to a different user.
-- Also restrict updates to non-deleted posts (can't edit a taken-down post).
DROP POLICY IF EXISTS "outfits_update" ON public.outfits;
CREATE POLICY "outfits_update" ON public.outfits
  FOR UPDATE
  USING    (creator_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (creator_id = auth.uid());

-- ── Outfit items: SELECT ──────────────────────────────────────────────────────
-- Public read: only items whose parent outfit is published AND not deleted.
DROP POLICY IF EXISTS "items_select_published" ON public.outfit_items;
CREATE POLICY "items_select_published" ON public.outfit_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.outfits
      WHERE  id = outfit_id
        AND  published   = true
        AND  deleted_at IS NULL
    )
  );

-- Owner read: only items whose parent outfit is NOT deleted.
DROP POLICY IF EXISTS "items_select_own" ON public.outfit_items;
CREATE POLICY "items_select_own" ON public.outfit_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.outfits
      WHERE  id = outfit_id
        AND  creator_id = auth.uid()
        AND  deleted_at IS NULL
    )
  );

-- ── outfit_media: SELECT ──────────────────────────────────────────────────────
-- Rebuild the public read policy from migration 008 to exclude deleted outfits.
DROP POLICY IF EXISTS "outfit_media_public_read" ON public.outfit_media;
CREATE POLICY "outfit_media_public_read" ON public.outfit_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.outfits
      WHERE  outfits.id = outfit_media.outfit_id
        AND  outfits.published   = true
        AND  outfits.deleted_at IS NULL
    )
  );
