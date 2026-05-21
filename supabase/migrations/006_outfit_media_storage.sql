-- FYTD: outfit-images storage bucket + RLS policies
-- Run in Supabase SQL Editor

-- Create the bucket (public so uploaded media is readable in the feed)
INSERT INTO storage.buckets (id, name, public)
VALUES ('outfit-images', 'outfit-images', true)
ON CONFLICT (id) DO NOTHING;

-- ── Public read (feed + detail pages need to display media) ──────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'outfit_media_public_read'
  ) THEN
    CREATE POLICY "outfit_media_public_read" ON storage.objects
      FOR SELECT USING (bucket_id = 'outfit-images');
  END IF;
END $$;

-- ── Authenticated upload to own folder ───────────────────────────────────────
-- Paths used by the app:
--   outfits/{user_id}/images/{uuid}.ext     (outfit hero image)
--   outfits/{user_id}/videos/{uuid}.ext     (outfit hero video)
--   outfits/{user_id}/{uuid}.ext            (ImageUpload in outfit context)
--   outfit-items/{user_id}/{uuid}.ext       (piece item photo)
-- In all cases the user_id is the 2nd path segment (array index [2]).
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'outfit_media_authenticated_upload'
  ) THEN
    CREATE POLICY "outfit_media_authenticated_upload" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'outfit-images' AND
        auth.role() = 'authenticated' AND
        auth.uid()::text = (storage.foldername(name))[2]
      );
  END IF;
END $$;

-- ── Owner update (replace file at same path) ─────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'outfit_media_owner_update'
  ) THEN
    CREATE POLICY "outfit_media_owner_update" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'outfit-images' AND
        auth.uid()::text = (storage.foldername(name))[2]
      );
  END IF;
END $$;

-- ── Owner delete ─────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'outfit_media_owner_delete'
  ) THEN
    CREATE POLICY "outfit_media_owner_delete" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'outfit-images' AND
        auth.uid()::text = (storage.foldername(name))[2]
      );
  END IF;
END $$;
