-- Add thumbnail_url to outfit_media so video posts can store a generated poster image
ALTER TABLE outfit_media
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
