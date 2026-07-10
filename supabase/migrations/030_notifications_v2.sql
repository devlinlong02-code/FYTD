-- Add read_at column
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Expand type check to include 'save' and 'reply'
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('like', 'comment', 'follow', 'save', 'reply'));

-- Delete policy
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  USING (auth.uid() = recipient_id);

-- Unread index for badge queries
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (recipient_id, read)
  WHERE read = false;
