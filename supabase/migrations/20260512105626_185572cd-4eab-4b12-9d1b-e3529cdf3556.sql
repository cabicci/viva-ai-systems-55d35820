-- Enable pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge chunks: source-of-truth for retrievable curriculum slices
CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL,
  source_id text NOT NULL,
  path_id text,
  module_id text,
  lesson_id text,
  title text NOT NULL,
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Filtered lookups
CREATE INDEX IF NOT EXISTS knowledge_chunks_lesson_idx ON public.knowledge_chunks (lesson_id);
CREATE INDEX IF NOT EXISTS knowledge_chunks_module_idx ON public.knowledge_chunks (module_id);
CREATE INDEX IF NOT EXISTS knowledge_chunks_path_idx ON public.knowledge_chunks (path_id);
CREATE INDEX IF NOT EXISTS knowledge_chunks_source_idx ON public.knowledge_chunks (source_type, source_id);

-- Vector index for cosine-distance semantic search (effective after embeddings are populated)
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
  ON public.knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- updated_at trigger
DROP TRIGGER IF EXISTS knowledge_chunks_set_updated_at ON public.knowledge_chunks;
CREATE TRIGGER knowledge_chunks_set_updated_at
  BEFORE UPDATE ON public.knowledge_chunks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: read for any signed-in learner; writes restricted to service role only
ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kc_select_authenticated ON public.knowledge_chunks;
CREATE POLICY kc_select_authenticated
  ON public.knowledge_chunks
  FOR SELECT
  TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies for authenticated/anon roles → blocked by default.
-- Service role bypasses RLS, so server-side ingestion still works.