CREATE TABLE IF NOT EXISTS follows (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Anyone can read follow relationships (public social graph)
CREATE POLICY "follows_select_all"  ON follows FOR SELECT USING (true);
-- Users can only create follows as themselves
CREATE POLICY "follows_insert_own"  ON follows FOR INSERT WITH CHECK (follower_id = auth.uid());
-- Users can only delete their own follows
CREATE POLICY "follows_delete_own"  ON follows FOR DELETE USING (follower_id = auth.uid());

-- Indexes for the two high-frequency filter directions
CREATE INDEX IF NOT EXISTS idx_follows_follower_id  ON follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows (following_id);

-- Enable realtime so follower counts update live
ALTER PUBLICATION supabase_realtime ADD TABLE follows;
