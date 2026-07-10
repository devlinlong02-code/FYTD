-- Add deleted_at to messages for time-window enforcement
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Ensure hidden_by and initiated_by exist on conversations
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS hidden_by uuid[] DEFAULT '{}';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS initiated_by uuid REFERENCES profiles(id);

-- Index for fetching non-deleted messages efficiently
CREATE INDEX IF NOT EXISTS idx_messages_deleted
  ON messages(conversation_id, deleted)
  WHERE deleted = false;
