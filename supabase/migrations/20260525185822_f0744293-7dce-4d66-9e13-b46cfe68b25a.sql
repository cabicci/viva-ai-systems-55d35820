-- Cleanup orphaned rows pointing to lesson_ids no longer in the live catalog (95 lessons).
WITH live_lessons(lesson_id) AS (
  VALUES
    ('ai-can-cannot'),('ai-vs-software'),
    ('analyst-m0-from-automation-to-insight'),('analyst-m1-feeling-to-question'),('analyst-m1-right-question-rule'),
    ('analyst-m2-ai-summarization'),('analyst-m2-three-sources'),('analyst-m3-decision-rule'),('analyst-m3-pattern-vs-outlier'),
    ('analyst-m4-four-numbers-dashboard'),('analyst-m4-weekly-review-ritual'),('analyst-m5-interpretation-mistakes'),
    ('analyst-m5-question-mistakes'),('analyst-m6-from-decisions-to-business'),
    ('automator-m0-where-you-are'),('automator-m1-decide-what-to-automate'),('automator-m1-spot-patterns'),('automator-m1-systems-view'),
    ('automator-m2-filters-routers'),('automator-m2-tools-landscape'),('automator-m2-triggers-actions'),
    ('automator-m3-connect-database'),('automator-m3-error-handling'),('automator-m3-webhooks-api'),
    ('automator-m4-agents'),('automator-m4-llm-in-flow'),('automator-m4-rag-in-n8n'),
    ('automator-m5-follow-up'),('automator-m5-lead-capture'),('automator-m5-whatsapp-flow'),('automator-m6-closing-loop'),
    ('builder-m1-tokens-training'),('builder-m1-what-is-llm'),('builder-m10-deploy-domain'),('builder-m10-first-users'),
    ('builder-m2-instructions-examples'),('builder-m2-prompt-layer'),('builder-m2-style-control'),
    ('builder-m3-context-layer'),('builder-m3-memory-limits'),('builder-m4-parameters'),('builder-m4-temperature'),
    ('builder-m5-backend-api'),('builder-m5-database-intro'),('builder-m5-frontend'),('builder-m5-transition'),
    ('builder-m6-components-routes'),('builder-m6-debugging'),('builder-m6-first-prompt-to-lovable'),('builder-m6-idea-to-page'),
    ('builder-m6-iteration'),('builder-m6-wireframe'),('builder-m7-rls'),('builder-m7-sessions-jwt'),
    ('builder-m8-queries'),('builder-m8-relations'),('builder-m8-tables-columns'),
    ('builder-m9-agents'),('builder-m9-embeddings'),('builder-m9-rag'),
    ('business-m0-from-decisions-to-leadership'),('business-m1-reactive-vs-proactive'),('business-m1-weekly-rhythm'),
    ('business-m2-customer-lifecycle'),('business-m2-retention-flow'),('business-m3-delegate-or-automate'),
    ('business-m3-strategic-operational-admin'),('business-m4-readiness-signals'),('business-m4-system-then-people'),
    ('business-m5-premature-scaling'),('business-m5-reactive-relapse'),('business-m6-full-ecosystem'),
    ('creator-m1-attention-economy'),('creator-m1-why-content'),('creator-m2-cta'),('creator-m2-hook'),('creator-m2-script-structure'),
    ('creator-m3-content-pillars'),('creator-m3-know-audience'),
    ('creator-m4-ai-writing'),('creator-m4-editing'),('creator-m4-mobile-shooting'),('creator-m4-reality-check'),('creator-m4-thumbnails-captions'),
    ('creator-m5-analytics'),('creator-m5-leads'),('creator-m5-platforms'),('creator-m5-scheduling'),
    ('creator-m6-brand-basics'),('creator-m6-grid-consistency'),
    ('intro-choose-your-path'),('intro-first-prompt'),('intro-setup-your-ai'),('learn-without-fear'),('what-is-ai')
)
DELETE FROM public.lesson_progress
WHERE lesson_id NOT IN (SELECT lesson_id FROM live_lessons);

-- Same cleanup for the parallel v2 status table.
WITH live_lessons(lesson_id) AS (
  VALUES
    ('ai-can-cannot'),('ai-vs-software'),
    ('analyst-m0-from-automation-to-insight'),('analyst-m1-feeling-to-question'),('analyst-m1-right-question-rule'),
    ('analyst-m2-ai-summarization'),('analyst-m2-three-sources'),('analyst-m3-decision-rule'),('analyst-m3-pattern-vs-outlier'),
    ('analyst-m4-four-numbers-dashboard'),('analyst-m4-weekly-review-ritual'),('analyst-m5-interpretation-mistakes'),
    ('analyst-m5-question-mistakes'),('analyst-m6-from-decisions-to-business'),
    ('automator-m0-where-you-are'),('automator-m1-decide-what-to-automate'),('automator-m1-spot-patterns'),('automator-m1-systems-view'),
    ('automator-m2-filters-routers'),('automator-m2-tools-landscape'),('automator-m2-triggers-actions'),
    ('automator-m3-connect-database'),('automator-m3-error-handling'),('automator-m3-webhooks-api'),
    ('automator-m4-agents'),('automator-m4-llm-in-flow'),('automator-m4-rag-in-n8n'),
    ('automator-m5-follow-up'),('automator-m5-lead-capture'),('automator-m5-whatsapp-flow'),('automator-m6-closing-loop'),
    ('builder-m1-tokens-training'),('builder-m1-what-is-llm'),('builder-m10-deploy-domain'),('builder-m10-first-users'),
    ('builder-m2-instructions-examples'),('builder-m2-prompt-layer'),('builder-m2-style-control'),
    ('builder-m3-context-layer'),('builder-m3-memory-limits'),('builder-m4-parameters'),('builder-m4-temperature'),
    ('builder-m5-backend-api'),('builder-m5-database-intro'),('builder-m5-frontend'),('builder-m5-transition'),
    ('builder-m6-components-routes'),('builder-m6-debugging'),('builder-m6-first-prompt-to-lovable'),('builder-m6-idea-to-page'),
    ('builder-m6-iteration'),('builder-m6-wireframe'),('builder-m7-rls'),('builder-m7-sessions-jwt'),
    ('builder-m8-queries'),('builder-m8-relations'),('builder-m8-tables-columns'),
    ('builder-m9-agents'),('builder-m9-embeddings'),('builder-m9-rag'),
    ('business-m0-from-decisions-to-leadership'),('business-m1-reactive-vs-proactive'),('business-m1-weekly-rhythm'),
    ('business-m2-customer-lifecycle'),('business-m2-retention-flow'),('business-m3-delegate-or-automate'),
    ('business-m3-strategic-operational-admin'),('business-m4-readiness-signals'),('business-m4-system-then-people'),
    ('business-m5-premature-scaling'),('business-m5-reactive-relapse'),('business-m6-full-ecosystem'),
    ('creator-m1-attention-economy'),('creator-m1-why-content'),('creator-m2-cta'),('creator-m2-hook'),('creator-m2-script-structure'),
    ('creator-m3-content-pillars'),('creator-m3-know-audience'),
    ('creator-m4-ai-writing'),('creator-m4-editing'),('creator-m4-mobile-shooting'),('creator-m4-reality-check'),('creator-m4-thumbnails-captions'),
    ('creator-m5-analytics'),('creator-m5-leads'),('creator-m5-platforms'),('creator-m5-scheduling'),
    ('creator-m6-brand-basics'),('creator-m6-grid-consistency'),
    ('intro-choose-your-path'),('intro-first-prompt'),('intro-setup-your-ai'),('learn-without-fear'),('what-is-ai')
)
DELETE FROM public.user_lesson_status
WHERE lesson_id NOT IN (SELECT lesson_id FROM live_lessons);

-- Cleanup downstream tables that reference lesson_id directly.
DELETE FROM public.lesson_quiz_attempts WHERE lesson_id IS NOT NULL
  AND lesson_id NOT IN (SELECT lesson_id FROM public.lesson_progress);
DELETE FROM public.lesson_notes WHERE lesson_id NOT IN (
  SELECT DISTINCT lesson_id FROM public.lesson_progress
);
DELETE FROM public.build_logs WHERE lesson_id IS NOT NULL
  AND lesson_id NOT IN (SELECT DISTINCT lesson_id FROM public.lesson_progress);
DELETE FROM public.mission_submissions WHERE lesson_id IS NOT NULL
  AND lesson_id NOT IN (SELECT DISTINCT lesson_id FROM public.lesson_progress);
-- mission_id format = `${lesson_id}::mission`
DELETE FROM public.user_mission_state
WHERE split_part(mission_id, '::', 1) NOT IN (
  SELECT DISTINCT lesson_id FROM public.lesson_progress
);