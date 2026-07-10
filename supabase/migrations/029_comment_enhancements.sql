-- Allow GIF-only comments (content becomes nullable)
ALTER TABLE comments ALTER COLUMN content DROP NOT NULL;

-- Add replies, GIF fields, and likes counter
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS parent_id      uuid REFERENCES comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS likes_count    integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gif_url        text,
  ADD COLUMN IF NOT EXISTS gif_preview_url text,
  ADD COLUMN IF NOT EXISTS gif_width      integer,
  ADD COLUMN IF NOT EXISTS gif_height     integer;

-- Enforce: every comment must have text or a GIF
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_has_content;
ALTER TABLE comments ADD CONSTRAINT comments_has_content
  CHECK (content IS NOT NULL OR gif_url IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- Comment likes
CREATE TABLE IF NOT EXISTS comment_likes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);

ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comment_likes_select_all"
  ON comment_likes FOR SELECT USING (true);
CREATE POLICY "comment_likes_insert_own"
  ON comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comment_likes_delete_own"
  ON comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Keep likes_count in sync via trigger
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comment_likes_count_trigger ON comment_likes;
CREATE TRIGGER comment_likes_count_trigger
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();
