-- FYTD Phase 4 — Beta prep
-- Run in Supabase SQL Editor before private beta launch

-- Make all existing users creators so they can post outfits
UPDATE profiles SET is_creator = true;

-- Make new signups creators by default (beta: everyone can post)
ALTER TABLE profiles ALTER COLUMN is_creator SET DEFAULT true;

-- Optional: basic beta feedback table
CREATE TABLE IF NOT EXISTS beta_feedback (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message     TEXT NOT NULL,
  page        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;

-- Users can submit feedback
CREATE POLICY "users_insert_feedback" ON beta_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Only service role can read feedback (admin use)
CREATE POLICY "service_read_feedback" ON beta_feedback FOR SELECT
  USING (auth.role() = 'service_role');
