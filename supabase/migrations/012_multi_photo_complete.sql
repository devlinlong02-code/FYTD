-- ============================================================
-- FYTD: Multi-photo complete setup  (idempotent catch-up)
-- ============================================================
-- Paste this entire file into Supabase SQL Editor and run it.
-- Safe to run on a fresh project or one that already ran
-- migrations 008 – 011 individually.
-- ============================================================

-- ── 1. Add deleted_at to outfits (migration 009) ──────────────────────────
ALTER TABLE public.outfits
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS outfits_deleted_at_idx
  ON public.outfits(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- ── 2. outfit_media table (migration 008) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.outfit_media (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id    uuid        NOT NULL
                           REFERENCES public.outfits(id) ON DELETE CASCADE,
  media_url    text        NOT NULL,
  media_type   text        NOT NULL DEFAULT 'image'
                           CHECK (media_type IN ('image', 'video')),
  storage_path text,
  position     integer     NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS outfit_media_outfit_id_idx
  ON public.outfit_media(outfit_id);

CREATE INDEX IF NOT EXISTS outfit_media_outfit_position_idx
  ON public.outfit_media(outfit_id, position);

ALTER TABLE public.outfit_media ENABLE ROW LEVEL SECURITY;

-- ── 3. outfit_media RLS policies (migrations 008 + 010 + 011) ────────────
-- Drop all policies first so this script is safely re-runnable.
DROP POLICY IF EXISTS "outfit_media_public_read"   ON public.outfit_media;
DROP POLICY IF EXISTS "outfit_media_owner_insert"  ON public.outfit_media;
DROP POLICY IF EXISTS "outfit_media_owner_delete"  ON public.outfit_media;

-- Public SELECT — anyone can read media for published, non-deleted outfits.
-- deleted_at is guaranteed to exist (we added it in step 1 above).
CREATE POLICY "outfit_media_public_read" ON public.outfit_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.outfits
      WHERE  outfits.id          = outfit_media.outfit_id
        AND  outfits.published   = true    
        AND  outfits.deleted_at IS NULL
    )
  );

-- Owner INSERT — creator can add media rows to their own outfits.
CREATE POLICY "outfit_media_owner_insert" ON public.outfit_media
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.outfits
      WHERE  outfits.id         = outfit_media.outfit_id
        AND  outfits.creator_id = auth.uid()
    )
  );

-- Owner DELETE — creator can remove their own media rows.
CREATE POLICY "outfit_media_owner_delete" ON public.outfit_media
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.outfits
      WHERE  outfits.id         = outfit_media.outfit_id
        AND  outfits.creator_id = auth.uid()
    )
  );

-- ── 4. Rebuild outfits RLS to exclude soft-deleted posts (migration 010) ──
DROP POLICY IF EXISTS "outfits_select_published" ON public.outfits;
CREATE POLICY "outfits_select_published" ON public.outfits
  FOR SELECT USING (published = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS "outfits_select_own" ON public.outfits;
CREATE POLICY "outfits_select_own" ON public.outfits
  FOR SELECT USING (creator_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "outfits_update" ON public.outfits;
CREATE POLICY "outfits_update" ON public.outfits
  FOR UPDATE
  USING    (creator_id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (creator_id = auth.uid());

-- outfit_items: public read excludes taken-down posts
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

-- ── 5. Backfill existing posts into outfit_media ──────────────────────────
-- Copies outfits.image_url → outfit_media(position=0) for every post that
-- does not yet have an outfit_media row. Safe to run multiple times.
INSERT INTO public.outfit_media (outfit_id, media_url, media_type, position)
SELECT
  outfits.id,
  outfits.image_url,
  'image',
  0
FROM public.outfits
WHERE image_url IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.outfit_media
    WHERE outfit_media.outfit_id = outfits.id
  );

-- ── 6. Reload PostgREST schema cache ─────────────────────────────────────
-- Tells the running PostgREST process to pick up the new table immediately.
NOTIFY pgrst, 'reload schema';
