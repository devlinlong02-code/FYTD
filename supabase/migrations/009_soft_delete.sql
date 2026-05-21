-- FYTD: soft delete for outfit posts
-- Run in Supabase SQL Editor after 008_outfit_media.sql

-- Add deleted_at timestamp (NULL = active, non-NULL = taken down)
ALTER TABLE public.outfits
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS outfits_deleted_at_idx ON public.outfits(deleted_at)
  WHERE deleted_at IS NOT NULL;
