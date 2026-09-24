-- Draft-only. Raw Kids lessons live in private storage, never public Git or assets.
-- Every approval, including the video access gate, requires an exact content digest.
-- The preceding Kids foundation migration is draft-only and has no approval rows.
ALTER TABLE public.kids_content_approvals
  ADD COLUMN approved_sha256 text NOT NULL
  CHECK (approved_sha256 ~ '^[0-9a-f]{64}$');

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('kids-lesson-content', 'kids-lesson-content', false, 262144, ARRAY['application/json'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Restrictive policy cannot be bypassed by any existing broad permissive policy.
-- Only the trusted service role can upload/read from this bucket.
CREATE POLICY "Kids lesson content requires service role"
ON storage.objects AS RESTRICTIVE FOR ALL TO anon, authenticated
USING (bucket_id <> 'kids-lesson-content')
WITH CHECK (bucket_id <> 'kids-lesson-content');
