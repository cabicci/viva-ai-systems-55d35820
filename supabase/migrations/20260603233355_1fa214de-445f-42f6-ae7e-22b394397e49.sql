BEGIN;
CREATE TEMP TABLE _lesson_renames(old_id text PRIMARY KEY, new_id text) ON COMMIT DROP;
INSERT INTO _lesson_renames(old_id, new_id) VALUES
  ('business-m0-from-decisions-to-leadership','business-m0-l1-from-decisions-to-leadership'),
  ('business-m1-reactive-vs-proactive','business-m1-l1-reactive-vs-proactive'),
  ('business-m1-weekly-rhythm','business-m1-l2-weekly-rhythm'),
  ('business-m2-customer-lifecycle','business-m2-l1-customer-lifecycle'),
  ('business-m2-retention-flow','business-m2-l2-retention-flow'),
  ('business-m3-strategic-operational-admin','business-m3-l1-strategic-operational-admin'),
  ('business-m3-delegate-or-automate','business-m3-l2-delegate-or-automate'),
  ('business-m4-readiness-signals','business-m4-l1-readiness-signals'),
  ('business-m4-system-then-people','business-m4-l2-system-then-people'),
  ('business-m5-reactive-relapse','business-m5-l1-reactive-relapse'),
  ('business-m5-premature-scaling','business-m5-l2-premature-scaling'),
  ('business-m6-full-ecosystem','business-m6-l1-full-ecosystem'),
  ('creator-m1-why-content','creator-m1-l1-why-content'),
  ('creator-m1-attention-economy','creator-m1-l2-attention-economy'),
  ('creator-m3-know-audience','creator-m2-l1-know-audience'),
  ('creator-m3-content-pillars','creator-m2-l2-content-pillars'),
  ('creator-m2-hook','creator-m3-l1-hook'),
  ('creator-m2-script-structure','creator-m3-l2-script-structure'),
  ('creator-m2-cta','creator-m3-l3-cta'),
  ('creator-m4-reality-check','creator-m4-l1-reality-check'),
  ('creator-m4-mobile-shooting','creator-m4-l2-mobile-shooting'),
  ('creator-m4-ai-writing','creator-m4-l3-ai-writing'),
  ('creator-m4-editing','creator-m5-l1-editing'),
  ('creator-m4-thumbnails-captions','creator-m5-l2-thumbnails-captions'),
  ('creator-m5-platforms','creator-m6-l1-platforms'),
  ('creator-m5-scheduling','creator-m6-l2-scheduling'),
  ('creator-m5-analytics','creator-m6-l3-analytics'),
  ('creator-m5-leads','creator-m6-l4-leads'),
  ('creator-m6-brand-basics','creator-m7-l1-brand-basics'),
  ('creator-m6-grid-consistency','creator-m7-l2-grid-consistency'),
  ('analyst-m0-from-automation-to-insight','analyst-m0-l1-from-automation-to-insight'),
  ('analyst-m1-feeling-to-question','analyst-m1-l1-feeling-to-question'),
  ('analyst-m1-right-question-rule','analyst-m1-l2-right-question-rule'),
  ('analyst-m2-three-sources','analyst-m2-l1-three-sources'),
  ('analyst-m2-ai-summarization','analyst-m2-l2-ai-summarization'),
  ('analyst-m3-pattern-vs-outlier','analyst-m3-l1-pattern-vs-outlier'),
  ('analyst-m3-decision-rule','analyst-m3-l2-decision-rule'),
  ('analyst-m4-four-numbers-dashboard','analyst-m4-l1-four-numbers-dashboard'),
  ('analyst-m4-weekly-review-ritual','analyst-m4-l2-weekly-review-ritual'),
  ('analyst-m5-question-mistakes','analyst-m5-l1-question-mistakes'),
  ('analyst-m5-interpretation-mistakes','analyst-m5-l2-interpretation-mistakes'),
  ('analyst-m6-from-decisions-to-business','analyst-m6-l1-from-decisions-to-business'),
  ('automator-m0-where-you-are','automator-m0-l1-where-you-are'),
  ('automator-m1-systems-view','automator-m1-l1-systems-view'),
  ('automator-m1-spot-patterns','automator-m1-l2-spot-patterns'),
  ('automator-m1-decide-what-to-automate','automator-m1-l3-decide-what-to-automate'),
  ('automator-m2-tools-landscape','automator-m2-l1-tools-landscape'),
  ('automator-m2-triggers-actions','automator-m2-l2-triggers-actions'),
  ('automator-m2-filters-routers','automator-m2-l3-filters-routers'),
  ('automator-m3-connect-database','automator-m3-l1-connect-database'),
  ('automator-m3-webhooks-api','automator-m3-l2-webhooks-api'),
  ('automator-m3-error-handling','automator-m3-l3-error-handling'),
  ('automator-m4-llm-in-flow','automator-m4-l1-llm-in-flow'),
  ('automator-m4-rag-in-n8n','automator-m4-l2-rag-in-n8n'),
  ('automator-m4-agents','automator-m4-l3-agents'),
  ('automator-m5-lead-capture','automator-m5-l1-lead-capture'),
  ('automator-m5-whatsapp-flow','automator-m5-l2-whatsapp-flow'),
  ('automator-m5-follow-up','automator-m5-l3-follow-up'),
  ('automator-m6-closing-loop','automator-m6-l1-closing-loop'),
  ('builder-m2-l3-prompt-layer','builder-m2-l1-prompt-layer'),
  ('builder-m2-l4-instructions-examples','builder-m2-l2-instructions-examples'),
  ('builder-m2-l5-style-control','builder-m2-l3-style-control'),
  ('builder-m3-l6-context-layer','builder-m3-l1-context-layer'),
  ('builder-m3-l7-memory-limits','builder-m3-l2-memory-limits'),
  ('builder-m4-l8-parameters','builder-m4-l1-parameters'),
  ('builder-m5-l9-transition','builder-m5-l1-transition'),
  ('builder-m5-l10-frontend','builder-m5-l2-frontend'),
  ('builder-m5-l11-backend-api','builder-m5-l3-backend-api'),
  ('builder-m5-l12-database-intro','builder-m5-l4-database-intro'),
  ('builder-m5-l12b-mini-win','builder-m5-l5-mini-win'),
  ('builder-m6-l13-idea-to-page','builder-m6-l1-idea-to-page'),
  ('builder-m6-l14-wireframe','builder-m6-l2-wireframe'),
  ('builder-m6-l15-first-prompt-to-lovable','builder-m6-l3-first-prompt-to-lovable'),
  ('builder-m6-l16-components-routes','builder-m6-l4-components-routes'),
  ('builder-m6-l17-iteration','builder-m6-l5-iteration'),
  ('builder-m6-l18-debugging','builder-m6-l6-debugging'),
  ('builder-m7-l19-tables-columns','builder-m7-l1-tables-columns'),
  ('builder-m7-l20-relations','builder-m7-l2-relations'),
  ('builder-m7-l21-queries','builder-m7-l3-queries'),
  ('builder-m8-l22-sessions-jwt','builder-m8-l1-sessions-jwt'),
  ('builder-m8-l23-rls','builder-m8-l2-rls'),
  ('builder-m9-l24-rag','builder-m9-l1-rag'),
  ('builder-m9-l25-embeddings','builder-m9-l2-embeddings'),
  ('builder-m9-l26-agents','builder-m9-l3-agents');

-- Per-user tables with composite unique on (user_id, lesson_id): delete old-id row if new-id row already exists for that user.
DELETE FROM public.lesson_progress o USING _lesson_renames r, public.lesson_progress n
  WHERE o.lesson_id = r.old_id AND n.lesson_id = r.new_id AND n.user_id = o.user_id;
UPDATE public.lesson_progress t SET lesson_id = r.new_id FROM _lesson_renames r WHERE t.lesson_id = r.old_id;

DELETE FROM public.user_lesson_status o USING _lesson_renames r, public.user_lesson_status n
  WHERE o.lesson_id = r.old_id AND n.lesson_id = r.new_id AND n.user_id = o.user_id;
UPDATE public.user_lesson_status t SET lesson_id = r.new_id FROM _lesson_renames r WHERE t.lesson_id = r.old_id;

DELETE FROM public.lesson_review_schedule o USING _lesson_renames r, public.lesson_review_schedule n
  WHERE o.lesson_id = r.old_id AND n.lesson_id = r.new_id AND n.user_id = o.user_id;
UPDATE public.lesson_review_schedule t SET lesson_id = r.new_id FROM _lesson_renames r WHERE t.lesson_id = r.old_id;

-- Tables without composite unique on (user_id, lesson_id) — straight update:
UPDATE public.lesson_feedback t SET lesson_id = r.new_id FROM _lesson_renames r WHERE t.lesson_id = r.old_id;
UPDATE public.lesson_notes t SET lesson_id = r.new_id FROM _lesson_renames r WHERE t.lesson_id = r.old_id;
UPDATE public.lesson_quiz_attempts t SET lesson_id = r.new_id FROM _lesson_renames r WHERE t.lesson_id = r.old_id;
UPDATE public.mission_submissions t SET lesson_id = r.new_id FROM _lesson_renames r WHERE t.lesson_id = r.old_id;
UPDATE public.learner_events t SET lesson_id = r.new_id FROM _lesson_renames r WHERE t.lesson_id = r.old_id;
COMMIT;