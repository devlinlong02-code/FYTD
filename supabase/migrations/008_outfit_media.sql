-- FYTD: outfit_media table — multiple photos/videos per outfit post
-- Run in Supabase SQL Editor after 006_outfit_media_storage.sql

-- ── Table ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outfit_media (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id   uuid        NOT NULL REFERENCES outfits(id) ON DELETE CASCADE,
  media_url   text        NOT NULL,
  media_type  text        NOT NULL DEFAULT 'image'
                          CHECK (media_type IN ('image', 'video')),
  storage_path text,
  position    integer     NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS outfit_media_outfit_id_idx ON outfit_media(outfit_id);
CREATE INDEX IF NOT EXISTS outfit_media_position_idx  ON outfit_media(outfit_id, position);

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE outfit_media ENABLE ROW LEVEL SECURITY;

-- Public read — anyone can read media for published outfits
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'outfit_media'
      AND policyname = 'outfit_media_public_read'
  ) THEN
    CREATE POLICY "outfit_media_public_read" ON outfit_media
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM outfits
          WHERE outfits.id = outfit_media.outfit_id
            AND outfits.published = true
        )
      );
  END IF;
END $$;

-- Owner insert — only the outfit's creator can add media
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'outfit_media'
      AND policyname = 'outfit_media_owner_insert'
  ) THEN
    CREATE POLICY "outfit_media_owner_insert" ON outfit_media
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM outfits
          WHERE outfits.id = outfit_media.outfit_id
            AND outfits.creator_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Owner delete
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'outfit_media'
      AND policyname = 'outfit_media_owner_delete'
  ) THEN
    CREATE POLICY "outfit_media_owner_delete" ON outfit_media
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM outfits
          WHERE outfits.id = outfit_media.outfit_id
            AND outfits.creator_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ── Backfill existing posts ───────────────────────────────────────────────────
-- One-time: copies outfits.image_url into outfit_media as position 0.
-- Skips any outfit that already has an outfit_media row (idempotent).
INSERT INTO outfit_media (outfit_id, media_url, media_type, position)
SELECT
  id,
  image_url,
  COALESCE(media_type, 'image'),
  0
FROM outfits
WHERE image_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM outfit_media WHERE outfit_media.outfit_id = outfits.id
  );
