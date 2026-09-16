-- Allow an active locale RAG version and its replacement staging version to
-- contain the same stable chunk source_id at the same time.
--
-- The original global UNIQUE(source_type, source_id) constraint predates
-- index_version. It prevents the additive staging workflow even though the
-- version-aware partial unique index already protects locale chunk identity.

CREATE UNIQUE INDEX IF NOT EXISTS knowledge_chunks_unversioned_source_identity_unique
  ON public.knowledge_chunks (source_type, source_id)
  WHERE source_type <> 'locale_lesson' OR index_version IS NULL;

ALTER TABLE public.knowledge_chunks
  DROP CONSTRAINT IF EXISTS knowledge_chunks_source_identity_unique;

-- Existing version-aware protection remains authoritative for locale RAG rows:
--   knowledge_chunks_locale_version_identity
--   UNIQUE (index_version, source_id)
--   WHERE source_type = 'locale_lesson' AND index_version IS NOT NULL
