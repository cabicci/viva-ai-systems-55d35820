-- Enable RLS on realtime.messages (the broadcast/channel table).
-- Privilege-safe for local/CI supabase resets where the migrator role is not
-- the owner of realtime.messages (SQLSTATE 42501). Production already applied
-- the original statements successfully under cloud ownership.
DO $realtime_uad$
BEGIN
  ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "uad_own_topic_select" ON realtime.messages;
  DROP POLICY IF EXISTS "uad_own_topic_insert" ON realtime.messages;

  CREATE POLICY "uad_own_topic_select"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() = ('uad:' || auth.uid()::text)
  );

  CREATE POLICY "uad_own_topic_insert"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    realtime.topic() = ('uad:' || auth.uid()::text)
  );
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping realtime.messages UAD policies (insufficient_privilege): %', SQLERRM;
  WHEN undefined_table THEN
    RAISE NOTICE 'Skipping realtime.messages UAD policies (undefined_table): %', SQLERRM;
  WHEN OTHERS THEN
    IF SQLSTATE = '42501' THEN
      RAISE NOTICE 'Skipping realtime.messages UAD policies (%): %', SQLSTATE, SQLERRM;
    ELSE
      RAISE;
    END IF;
END;
$realtime_uad$;
