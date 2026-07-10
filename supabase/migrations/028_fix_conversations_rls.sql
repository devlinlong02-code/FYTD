-- Ensure participants can update conversations (status, hidden_by, muted_by, etc.)
-- Drop and recreate to guarantee a clean state regardless of prior migration history
DROP POLICY IF EXISTS "users update own conversations" ON conversations;
DROP POLICY IF EXISTS "participants can update conversation" ON conversations;

CREATE POLICY "participants can update conversation"
ON conversations FOR UPDATE
USING (auth.uid() = participant_1 OR auth.uid() = participant_2)
WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);
