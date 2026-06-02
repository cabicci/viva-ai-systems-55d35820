-- Unique identity for upserts in knowledge_chunks ingestion
-- (source_type + source_id is the stable chunk identity used by the
-- ingestion pipeline; metadata->blockType/order are encoded in source_id
-- by the chunking utility, e.g. "lesson-id#order").
ALTER TABLE public.knowledge_chunks
  ADD CONSTRAINT knowledge_chunks_source_identity_unique
  UNIQUE (source_type, source_id);