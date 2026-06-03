DO $$
DECLARE
  paths text[] := ARRAY['automator','analyst','business'];
  p text;
  n int;
  old_id text;
  new_id text;
BEGIN
  FOREACH p IN ARRAY paths LOOP
    FOR n IN REVERSE 6..0 LOOP
      old_id := p || '-m' || n || '-';
      new_id := p || '-m' || (n+1) || '-';

      -- For unique-constraint tables: delete old rows where (user_id, new_id) already exists
      DELETE FROM public.user_lesson_status u
        WHERE u.lesson_id LIKE old_id || '%'
          AND EXISTS (SELECT 1 FROM public.user_lesson_status u2
                      WHERE u2.user_id = u.user_id
                        AND u2.lesson_id = replace(u.lesson_id, old_id, new_id));
      UPDATE public.user_lesson_status SET lesson_id = replace(lesson_id, old_id, new_id) WHERE lesson_id LIKE old_id || '%';

      DELETE FROM public.lesson_progress u
        WHERE u.lesson_id LIKE old_id || '%'
          AND EXISTS (SELECT 1 FROM public.lesson_progress u2
                      WHERE u2.user_id = u.user_id
                        AND u2.lesson_id = replace(u.lesson_id, old_id, new_id));
      UPDATE public.lesson_progress SET lesson_id = replace(lesson_id, old_id, new_id) WHERE lesson_id LIKE old_id || '%';

      DELETE FROM public.lesson_review_schedule u
        WHERE u.lesson_id LIKE old_id || '%'
          AND EXISTS (SELECT 1 FROM public.lesson_review_schedule u2
                      WHERE u2.user_id = u.user_id
                        AND u2.lesson_id = replace(u.lesson_id, old_id, new_id));
      UPDATE public.lesson_review_schedule SET lesson_id = replace(lesson_id, old_id, new_id) WHERE lesson_id LIKE old_id || '%';

      -- Non-unique tables: just update
      UPDATE public.build_logs SET lesson_id = replace(lesson_id, old_id, new_id) WHERE lesson_id LIKE old_id || '%';
      UPDATE public.knowledge_chunks SET lesson_id = replace(lesson_id, old_id, new_id) WHERE lesson_id LIKE old_id || '%';
      UPDATE public.learner_events SET lesson_id = replace(lesson_id, old_id, new_id) WHERE lesson_id LIKE old_id || '%';
      UPDATE public.lesson_feedback SET lesson_id = replace(lesson_id, old_id, new_id) WHERE lesson_id LIKE old_id || '%';
      UPDATE public.lesson_notes SET lesson_id = replace(lesson_id, old_id, new_id) WHERE lesson_id LIKE old_id || '%';
      UPDATE public.lesson_quiz_attempts SET lesson_id = replace(lesson_id, old_id, new_id) WHERE lesson_id LIKE old_id || '%';
      UPDATE public.mission_submissions SET lesson_id = replace(lesson_id, old_id, new_id) WHERE lesson_id LIKE old_id || '%';
      UPDATE public.v9_apply_decisions SET lesson_id = replace(lesson_id, old_id, new_id) WHERE lesson_id LIKE old_id || '%';
      UPDATE public.learner_triage SET entry_lesson_id = replace(entry_lesson_id, old_id, new_id) WHERE entry_lesson_id LIKE old_id || '%';
    END LOOP;
  END LOOP;
END $$;