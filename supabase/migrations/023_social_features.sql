-- saves_count on outfits (trigger fires on saved_outfits table)
ALTER TABLE outfits ADD COLUMN IF NOT EXISTS saves_count INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION update_saves_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE outfits SET saves_count = saves_count + 1 WHERE id = NEW.outfit_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE outfits SET saves_count = saves_count - 1 WHERE id = OLD.outfit_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS saves_count_trigger ON saved_outfits;
CREATE TRIGGER saves_count_trigger
AFTER INSERT OR DELETE ON saved_outfits
FOR EACH ROW EXECUTE FUNCTION update_saves_count();

-- followers_count on profiles (trigger fires on follows table)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;

CREATE OR REPLACE FU  NCTION update_followers_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS followers_count_trigger ON follows;
CREATE TRIGGER followers_count_trigger
AFTER INSERT OR DELETE ON follows
FOR EACH ROW EXECUTE FUNCTION update_followers_count();

-- Comment replies (parent_id self-reference)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  outfit_id uuid REFERENCES outfits(id) ON DELETE CASCADE,
  comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  reported_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (reason IN ('spam','inappropriate','harassment','hate_speech','misinformation','other')),
  details text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can submit reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "admins can view reports" ON reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own blocks" ON blocks FOR ALL USING (auth.uid() = blocker_id);
