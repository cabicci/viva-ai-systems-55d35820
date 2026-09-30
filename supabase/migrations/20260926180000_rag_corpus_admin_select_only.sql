-- The lesson corpus backs server-side retrieval. A learner's JWT must not
-- allow a direct table scan of every lesson, including gated content.
-- The service role bypasses RLS for ingestion and assistant retrieval.
DROP POLICY IF EXISTS kc_select_authenticated ON public.knowledge_chunks;
DROP POLICY IF EXISTS kc_select_admin ON public.knowledge_chunks;

CREATE POLICY kc_select_admin
  ON public.knowledge_chunks
  FOR SELECT
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));
