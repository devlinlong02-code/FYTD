-- FYTD: repair outfit_media_public_read policy
-- Run this if multi-photo posts are showing only 1 image.
--
-- Root cause: if 010_rls_owner_and_deleted.sql was applied before
-- 009_soft_delete.sql, the DROP removed the old policy but the new CREATE
-- (which references outfits.deleted_at) silently failed, leaving NO read
-- policy on outfit_media — so RLS blocks every SELECT.
--
-- This migration recreates the correct policy for whichever schema is present.

DROP POLICY IF EXISTS "outfit_media_public_read" ON public.outfit_media;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE  table_schema = 'public'
      AND  table_name   = 'outfits'
      AND  column_name  = 'deleted_at'
  ) THEN
    -- Migration 009 is applied: include deleted_at guard
    CREATE POLICY "outfit_media_public_read" ON public.outfit_media
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.outfits
          WHERE  outfits.id          = outfit_media.outfit_id
            AND  outfits.published   = true
            AND  outfits.deleted_at IS NULL
        )
      );
  ELSE
    -- Migration 009 not yet applied: simpler policy without deleted_at
    CREATE POLICY "outfit_media_public_read" ON public.outfit_media
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.outfits
          WHERE  outfits.id        = outfit_media.outfit_id
            AND  outfits.published = true
        )
      );
  END IF;
END $$;
