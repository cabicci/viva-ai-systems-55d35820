-- Enable RLS on realtime.messages (the broadcast/channel table)
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop any prior policy with the same name (idempotent)
DROP POLICY IF EXISTS "uad_own_topic_select" ON realtime.messages;
DROP POLICY IF EXISTS "uad_own_topic_insert" ON realtime.messages;

-- Allow a user to subscribe to / receive messages ONLY on their own uad:{uid} channel
CREATE POLICY "uad_own_topic_select"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = ('uad:' || auth.uid()::text)
);

-- Allow a user to broadcast ONLY on their own uad:{uid} channel
CREATE POLICY "uad_own_topic_insert"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() = ('uad:' || auth.uid()::text)
);