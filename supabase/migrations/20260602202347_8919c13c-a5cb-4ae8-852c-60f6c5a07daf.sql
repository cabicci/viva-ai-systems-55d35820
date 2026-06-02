DO $$
DECLARE
  mappings TEXT[][] := ARRAY[
    ARRAY['intro-m1-setup-your-ai',     'intro-m1-l3-setup-your-ai'],
    ARRAY['intro-m1-ai-can-cannot',     'intro-m1-l4-ai-can-cannot'],
    ARRAY['intro-m1-ai-vs-software',    'intro-m1-l5-ai-vs-software'],
    ARRAY['intro-m1-learn-without-fear','intro-m1-l6-learn-without-fear'],
    ARRAY['intro-m1-choose-your-path',  'intro-m1-l7-choose-your-path']
  ];
  m TEXT[];
BEGIN
  FOREACH m SLICE 1 IN ARRAY mappings LOOP
    DELETE FROM public.user_lesson_status uls
      WHERE uls.lesson_id = m[2]
        AND EXISTS (SELECT 1 FROM public.user_lesson_status u2 WHERE u2.user_id = uls.user_id AND u2.lesson_id = m[1]);
    UPDATE public.user_lesson_status SET lesson_id = m[2] WHERE lesson_id = m[1];

    DELETE FROM public.lesson_progress lp
      WHERE lp.lesson_id = m[2]
        AND EXISTS (SELECT 1 FROM public.lesson_progress l2 WHERE l2.user_id = lp.user_id AND l2.lesson_id = m[1]);
    UPDATE public.lesson_progress SET lesson_id = m[2] WHERE lesson_id = m[1];

    UPDATE public.learner_events SET lesson_id = m[2] WHERE lesson_id = m[1];
    UPDATE public.mission_submissions SET lesson_id = m[2] WHERE lesson_id = m[1];
    UPDATE public.lesson_notes SET lesson_id = m[2] WHERE lesson_id = m[1];
    UPDATE public.lesson_quiz_attempts SET lesson_id = m[2] WHERE lesson_id = m[1];

    DELETE FROM public.lesson_review_schedule lrs
      WHERE lrs.lesson_id = m[2]
        AND EXISTS (SELECT 1 FROM public.lesson_review_schedule l2 WHERE l2.user_id = lrs.user_id AND l2.lesson_id = m[1]);
    UPDATE public.lesson_review_schedule SET lesson_id = m[2] WHERE lesson_id = m[1];

    UPDATE public.knowledge_chunks SET lesson_id = m[2] WHERE lesson_id = m[1];
  END LOOP;
END $$;