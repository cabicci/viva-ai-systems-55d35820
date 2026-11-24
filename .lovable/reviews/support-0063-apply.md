# Applying 0063 — what the native tool will do

The only native way to apply migrations here creates **one new migration entry** and then applies everything pending in order:

1. `0063_support_meta_reply_quota.sql` — the reviewed file, byte-exact (sha256 `c0ffaee0…be9d`, when `1794991200000`).
2. One new entry with the SQL below — read-only, it only checks and changes nothing.

Proposed name: `support_meta_reply_quota_postcondition`

```sql
DO $support_meta_reply_quota_postcondition$
DECLARE f oid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM drizzle.__drizzle_migrations
                 WHERE created_at = 1794991200000
                   AND hash = 'c0ffaee055eeed65d9a7c84f6d7c80d1c57915b7a1559a5e79eaa597ec59be9d') THEN
    RAISE EXCEPTION 'SUPPORT_0063_PROOF_MISSING';
  END IF;
  f := to_regprocedure('public.support_claim_meta_event(text,text,text)');
  IF f IS NULL
     OR NOT (SELECT prosecdef FROM pg_catalog.pg_proc WHERE oid = f)
     OR NOT has_function_privilege('service_role', f, 'EXECUTE')
     OR has_function_privilege('anon', f, 'EXECUTE')
     OR has_function_privilege('authenticated', f, 'EXECUTE') THEN
    RAISE EXCEPTION 'SUPPORT_0063_FUNCTION_POSTCONDITION';
  END IF;
END $support_meta_reply_quota_postcondition$;
```

Side effects in the repository: a new `0064_…` file, its journal entry and snapshot, and regenerated database types. I would restore the types file to the reviewed PR #347 version afterwards so unrelated declarations don't come back.
