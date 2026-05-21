-- FYTD Phase 2 — Initial Schema
-- Run this in Supabase SQL Editor or via supabase db push

-- ─── Profiles ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username       TEXT UNIQUE NOT NULL,
  display_name   TEXT NOT NULL DEFAULT '',
  avatar_url     TEXT,
  bio            TEXT DEFAULT '',
  location       TEXT,
  style_tags     TEXT[] DEFAULT '{}',
  is_creator     BOOLEAN DEFAULT FALSE,
  is_admin       BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Outfits ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outfits (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT DEFAULT '',
  image_url      TEXT NOT NULL,
  tags           TEXT[] DEFAULT '{}',
  published      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Outfit items ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS outfit_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_id      UUID REFERENCES outfits(id) ON DELETE CASCADE NOT NULL,
  name           TEXT NOT NULL,
  brand          TEXT NOT NULL,
  category       TEXT NOT NULL,
  price          NUMERIC(10,2),
  image_url      TEXT,
  shop_link      TEXT,
  shop_type      TEXT DEFAULT 'exact' CHECK (shop_type IN ('exact', 'similar')),
  display_order  INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Saved outfits ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_outfits (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  outfit_id      UUID REFERENCES outfits(id) ON DELETE CASCADE NOT NULL,
  saved_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, outfit_id)
);

-- ─── Click events ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS click_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outfit_item_id UUID REFERENCES outfit_items(id) ON DELETE SET NULL,
  outfit_id      UUID REFERENCES outfits(id) ON DELETE SET NULL,
  user_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  clicked_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfits      ENABLE ROW LEVEL SECURITY;
ALTER TABLE outfit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_outfits ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_events ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, owner can update
CREATE POLICY "profiles_select"  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update"  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Outfits: published outfits are public; creators manage their own
CREATE POLICY "outfits_select_published" ON outfits FOR SELECT USING (published = true);
CREATE POLICY "outfits_select_own"       ON outfits FOR SELECT USING (creator_id = auth.uid());
CREATE POLICY "outfits_insert"           ON outfits FOR INSERT WITH CHECK (creator_id = auth.uid());
CREATE POLICY "outfits_update"           ON outfits FOR UPDATE USING (creator_id = auth.uid());
CREATE POLICY "outfits_delete"           ON outfits FOR DELETE USING (creator_id = auth.uid());

-- Outfit items: readable if parent outfit is published or owned by current user
CREATE POLICY "items_select_published" ON outfit_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM outfits WHERE id = outfit_id AND published = true)
);
CREATE POLICY "items_select_own" ON outfit_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM outfits WHERE id = outfit_id AND creator_id = auth.uid())
);
CREATE POLICY "items_insert" ON outfit_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM outfits WHERE id = outfit_id AND creator_id = auth.uid())
);
CREATE POLICY "items_delete" ON outfit_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM outfits WHERE id = outfit_id AND creator_id = auth.uid())
);

-- Saved outfits: users manage their own
CREATE POLICY "saved_select" ON saved_outfits FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "saved_insert" ON saved_outfits FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "saved_delete" ON saved_outfits FOR DELETE USING (user_id = auth.uid());

-- Click events: anyone can insert (anonymous tracking); creators can read their outfit clicks
CREATE POLICY "clicks_insert" ON click_events FOR INSERT WITH CHECK (true);
CREATE POLICY "clicks_select" ON click_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM outfits WHERE id = outfit_id AND creator_id = auth.uid())
);

-- ─── Auto-create profile on signup ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
