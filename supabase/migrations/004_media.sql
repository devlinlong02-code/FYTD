-- FYTD — Add media_type to outfits for photo + video support
-- Run in Supabase SQL Editor

ALTER TABLE outfits
  ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image'
    CHECK (media_type IN ('image', 'video'));

-- Backfill existing rows
UPDATE outfits SET media_type = 'image' WHERE media_type IS NULL;
