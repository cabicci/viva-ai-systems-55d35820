-- Review candidate for central Supabase integration. No production write by this file.
-- Dedicated Academic index; no query uses platform knowledge_chunks.
BEGIN;

CREATE TABLE public.academic_rag_chunks (
  course_id text NOT NULL REFERENCES public.academic_courses(id),
  lesson_id text NOT NULL,
  locale text NOT NULL CHECK (locale IN ('ar-EG','ar-MSA','ar-Gulf','en')),
  section_id text NOT NULL,
  content_version text NOT NULL,
  source_sha256 text NOT NULL CHECK (source_sha256 ~ '^[a-f0-9]{64}$'),
  content_sha256 text NOT NULL CHECK (content_sha256 ~ '^[a-f0-9]{64}$'),
  content text NOT NULL CHECK (length(content) BETWEEN 1 AND 12000),
  embedding extensions.vector(1536) NOT NULL,
  PRIMARY KEY (course_id, lesson_id, locale, section_id, content_version),
  FOREIGN KEY (course_id, lesson_id, locale)
    REFERENCES public.academic_lesson_content(course_id, lesson_id, locale)
);
ALTER TABLE public.academic_rag_chunks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academic_rag_chunks FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.academic_rag_chunks TO service_role;
CREATE INDEX academic_rag_course_locale ON public.academic_rag_chunks(course_id, locale);

-- Exact course bindings for both the base Academic product and its assistant add-on.
-- Neither table is populated by this candidate. Commerce owns atomic grant/revoke.
CREATE TABLE public.academic_content_course_grants (
  entitlement_id uuid NOT NULL REFERENCES billing.commerce_entitlements(id) ON DELETE CASCADE,
  course_id text NOT NULL REFERENCES public.academic_courses(id),
  PRIMARY KEY (entitlement_id, course_id)
);
ALTER TABLE public.academic_content_course_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academic_content_course_grants FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.academic_content_course_grants TO service_role;

CREATE TABLE public.academic_assistant_course_grants (
  entitlement_id uuid NOT NULL REFERENCES billing.commerce_entitlements(id) ON DELETE CASCADE,
  course_id text NOT NULL REFERENCES public.academic_courses(id),
  PRIMARY KEY (entitlement_id, course_id)
);
ALTER TABLE public.academic_assistant_course_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.academic_assistant_course_grants FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.academic_assistant_course_grants TO service_role;

CREATE OR REPLACE FUNCTION public.academic_assistant_allowed(p_course text,p_lesson text,p_locale text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT public.academic_can_access(p_course,p_lesson,p_locale)
    AND EXISTS (SELECT 1 FROM public.academic_courses c
                WHERE c.id=p_course AND c.enabled AND c.assistant_enabled)
    -- Introductory and admin lesson access cannot unlock all-course retrieval.
    AND EXISTS (SELECT 1 FROM billing.commerce_entitlements e
                JOIN public.academic_content_course_grants g ON g.entitlement_id=e.id
                WHERE e.user_id=auth.uid() AND e.package='academic'
                  AND g.course_id=p_course AND e.revoked_at IS NULL
                  AND e.starts_at<=now() AND e.ends_at>now()
                  AND EXISTS (SELECT 1 FROM billing.commerce_control WHERE access_enabled))
    AND EXISTS (SELECT 1 FROM billing.commerce_entitlements e
                JOIN public.academic_assistant_course_grants g ON g.entitlement_id=e.id
                WHERE e.user_id=auth.uid() AND e.package='academic_assistant'
                  AND g.course_id=p_course AND e.revoked_at IS NULL
                  AND e.starts_at<=now() AND e.ends_at>now()
                  AND EXISTS (SELECT 1 FROM billing.commerce_control WHERE access_enabled));
$$;
REVOKE ALL ON FUNCTION public.academic_assistant_allowed(text,text,text) FROM PUBLIC, anon, service_role;
GRANT EXECUTE ON FUNCTION public.academic_assistant_allowed(text,text,text) TO authenticated;

-- Service-only retrieval: filtering occurs before similarity ranking and LIMIT.
-- Only current, approved, exact-source material can be returned.
CREATE FUNCTION public.academic_rag_match(
  p_course text, p_locale text, p_embedding extensions.vector(1536), p_limit integer DEFAULT 6
) RETURNS TABLE (course_id text, lesson_id text, locale text, section_id text,
                 content text, similarity double precision)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
  SELECT r.course_id,r.lesson_id,r.locale,r.section_id,r.content,
         (1-(r.embedding OPERATOR(extensions.<=>) p_embedding))::double precision AS similarity
  FROM public.academic_rag_chunks r
  JOIN public.academic_lesson_content l
    ON l.course_id=r.course_id AND l.lesson_id=r.lesson_id AND l.locale=r.locale
   AND l.source_sha256=r.source_sha256 AND l.approved
  JOIN public.academic_courses c ON c.id=r.course_id AND c.enabled AND c.assistant_enabled
  WHERE r.course_id=p_course AND r.locale=p_locale
    AND p_course IS NOT NULL AND p_locale IN ('ar-EG','ar-MSA','ar-Gulf','en')
    AND p_limit BETWEEN 1 AND 8
    AND 1-(r.embedding OPERATOR(extensions.<=>) p_embedding) >= 0.35
  ORDER BY r.embedding OPERATOR(extensions.<=>) p_embedding ASC
  LIMIT least(p_limit,8);
$$;
REVOKE ALL ON FUNCTION public.academic_rag_match(text,text,extensions.vector,integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.academic_rag_match(text,text,extensions.vector,integer) TO service_role;
COMMIT;
