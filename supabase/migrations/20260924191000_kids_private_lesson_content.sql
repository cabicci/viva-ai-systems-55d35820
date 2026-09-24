-- Draft-only. Raw Kids lessons live in private storage, never public Git or assets.
-- Every approval, including the video access gate, requires an exact content digest.
-- The preceding Kids foundation migration is draft-only and has no approval rows.
-- Cloud SQL runs as postgres, not the owner of storage.objects. Inspect every
-- permissive Storage policy before creating the Kids bucket; any policy that
-- cannot be proved to target another bucket blocks the migration.
DO $kids_storage_policy_guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies policy
    WHERE policy.schemaname = 'storage'
      AND policy.tablename = 'objects'
      AND policy.permissive = 'PERMISSIVE'
      AND policy.roles && ARRAY['public', 'anon', 'authenticated']::name[]
      AND (
        (
          policy.cmd IN ('ALL', 'SELECT', 'UPDATE', 'DELETE')
          AND (
            COALESCE(policy.qual, '') !~ '^[[:space:]()]*bucket_id[[:space:]]*=[[:space:]]*''[^'']+'''
            OR substring(policy.qual FROM 'bucket_id[[:space:]]*=[[:space:]]*''([^'']+)''') = 'kids-lesson-content'
            OR COALESCE(policy.qual, '') ~* '\mOR\M'
          )
        )
        OR (
          policy.cmd IN ('ALL', 'INSERT', 'UPDATE')
          AND (
            COALESCE(policy.with_check, policy.qual, '') !~ '^[[:space:]()]*bucket_id[[:space:]]*=[[:space:]]*''[^'']+'''
            OR substring(COALESCE(policy.with_check, policy.qual) FROM 'bucket_id[[:space:]]*=[[:space:]]*''([^'']+)''') = 'kids-lesson-content'
            OR COALESCE(policy.with_check, policy.qual, '') ~* '\mOR\M'
          )
        )
      )
  ) THEN
    RAISE EXCEPTION 'Kids private storage requires bucket-scoped Storage policies';
  END IF;
END
$kids_storage_policy_guard$;

ALTER TABLE public.kids_content_approvals
  ADD COLUMN approved_sha256 text NOT NULL
  CHECK (approved_sha256 ~ '^[0-9a-f]{64}$');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('kids-lesson-content', 'kids-lesson-content', false, 262144, ARRAY['application/json'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Existing bucket-scoped policies grant no anon/authenticated access to Kids.
-- Re-run this policy guard if managed Storage policies change after deployment.
