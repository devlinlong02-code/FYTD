-- Message reactions (jsonb: { userId: "❤️" })
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reactions jsonb DEFAULT '{}';

-- Soft delete for messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted boolean DEFAULT false;

-- Message type (text | post_share) — post_share is future
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text';

-- Conversation status (active | request | declined)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS initiated_by uuid REFERENCES profiles(id);

-- Hidden conversations per user (soft delete from inbox)
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS hidden_by uuid[] DEFAULT '{}';

-- Muted conversations per user
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS muted_by uuid[] DEFAULT '{}';

-- Profile message settings
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS read_receipts_enabled boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allow_message_requests boolean DEFAULT true;

-- Hide conversation function (security definer so array_append works under RLS)
CREATE OR REPLACE FUNCTION hide_conversation_for_user(
  conversation_id uuid,
  user_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE conversations
  SET hidden_by = array_append(COALESCE(hidden_by, '{}'), user_id)
  WHERE id = conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policy for the new columns (already covered by existing conversation/message policies)
-- messages: UPDATE allowed for own messages (for delete + reactions)
DROP POLICY IF EXISTS "users update own messages" ON messages;
CREATE POLICY "users update messages in own conversations" ON messages FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id
    AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
  )
);

-- messages: DELETE allowed for own messages only
DROP POLICY IF EXISTS "users delete own messages" ON messages;
CREATE POLICY "users delete own messages" ON messages FOR DELETE USING (sender_id = auth.uid());
