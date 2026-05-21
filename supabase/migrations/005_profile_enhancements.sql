-- Phase 4: Profile onboarding + social links
-- Run in Supabase SQL Editor

-- Add missing profile columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS instagram_url TEXT,
  ADD COLUMN IF NOT EXISTS tiktok_url    TEXT,
  ADD COLUMN IF NOT EXISTS website_url   TEXT,
  ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Mark all existing users as already having a completed profile
-- so beta users are not forced through onboarding again
UPDATE profiles
SET profile_completed = TRUE
WHERE profile_completed IS NULL OR profile_completed = FALSE;

-- New signups default to profile_completed = FALSE (handled by column default)

-- ─── Storage: avatars bucket ───────────────────────────────────────────────
-- MANUAL STEP: Before running storage policies below, go to
--   Supabase Dashboard > Storage > New bucket
--   Name: avatars   Public: YES
-- Then run the policies below.

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Public read for all avatars
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatars_public_read'
  ) THEN
    CREATE POLICY "avatars_public_read" ON storage.objects
      FOR SELECT USING (bucket_id = 'avatars');
  END IF;
END $$;

-- Authenticated users can upload to their own folder
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatars_authenticated_upload'
  ) THEN
    CREATE POLICY "avatars_authenticated_upload" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- Users can overwrite their own avatar
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatars_own_update'
  ) THEN
    CREATE POLICY "avatars_own_update" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- Users can delete their own avatar
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'avatars_own_delete'
  ) THEN
    CREATE POLICY "avatars_own_delete" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'avatars' AND
        auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;
