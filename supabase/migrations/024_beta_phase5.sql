-- onboarding_completed flag for new app intro flow
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- beta_feedback table
CREATE TABLE IF NOT EXISTS beta_feedback (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('bug', 'feedback', 'feature')),
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE beta_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can submit feedback" ON beta_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "admins can view feedback" ON beta_feedback FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
