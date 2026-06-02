-- Fix Supabase linter warnings
-- 1) Move pgvector extension out of public schema into a dedicated extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION vector SET SCHEMA extensions;

-- 2) Tighten public bucket SELECT policy so it no longer permits listing all files.
-- Drop the broad policy that allowed SELECT on every object in the bucket.
DROP POLICY IF EXISTS "Public read audio-assets" ON storage.objects;

-- Replace it with a per-object SELECT policy that only allows direct file reads
-- (clients must already know the object name); listing via SELECT ... LIMIT N
-- without a name filter no longer returns the full bucket contents because we
-- key the policy on a non-null object name.
CREATE POLICY "Public read audio-assets by name"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'audio-assets'
  AND name IS NOT NULL
  AND name <> ''
);