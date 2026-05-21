-- FYTD Phase 3 — outfit_views, social_links, view_count, save_count
-- Run this in Supabase SQL Editor or via supabase db push

-- ─── outfit_views ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outfit_views (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id      UUID REFERENCES outfits(id) ON DELETE CASCADE NOT NULL,
  user_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── social_links on profiles ─────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- ─── view_count on outfits ────────────────────────────────────────────────────
ALTER TABLE outfits
  ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;

-- ─── save_count on outfits ────────────────────────────────────────────────────
ALTER TABLE outfits
  ADD COLUMN IF NOT EXISTS save_count INT DEFAULT 0;

-- ─── Trigger: increment view_count on outfit_views INSERT ─────────────────────
CREATE OR REPLACE FUNCTION increment_outfit_view_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE outfits
    SET view_count = view_count + 1
    WHERE id = NEW.outfit_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_outfit_view_increment ON outfit_views;
CREATE TRIGGER on_outfit_view_increment
  AFTER INSERT ON outfit_views
  FOR EACH ROW EXECUTE FUNCTION increment_outfit_view_count();

-- ─── Trigger: increment save_count on saved_outfits INSERT ───────────────────
CREATE OR REPLACE FUNCTION increment_outfit_save_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE outfits
    SET save_count = save_count + 1
    WHERE id = NEW.outfit_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_outfit_saved_increment ON saved_outfits;
CREATE TRIGGER on_outfit_saved_increment
  AFTER INSERT ON saved_outfits
  FOR EACH ROW EXECUTE FUNCTION increment_outfit_save_count();

-- ─── Trigger: decrement save_count on saved_outfits DELETE ───────────────────
CREATE OR REPLACE FUNCTION decrement_outfit_save_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE outfits
    SET save_count = GREATEST(save_count - 1, 0)
    WHERE id = OLD.outfit_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_outfit_saved_decrement ON saved_outfits;
CREATE TRIGGER on_outfit_saved_decrement
  AFTER DELETE ON saved_outfits
  FOR EACH ROW EXECUTE FUNCTION decrement_outfit_save_count();

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_outfit_views_outfit_id ON outfit_views (outfit_id);
CREATE INDEX IF NOT EXISTS idx_outfit_views_user_id   ON outfit_views (user_id);
CREATE INDEX IF NOT EXISTS idx_outfit_views_viewed_at ON outfit_views (viewed_at DESC);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE outfit_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "views_insert" ON outfit_views FOR INSERT WITH CHECK (true);

CREATE POLICY "views_select_own" ON outfit_views FOR SELECT USING (
  EXISTS (SELECT 1 FROM outfits WHERE id = outfit_id AND creator_id = auth.uid())
);
