UPDATE public.roadmap_items
SET
  status = 'in_progress',
  notes = notes || E'\n[ai-edit 2026-05-30]: [scope:ui] shipped #1 Value Hook — added src/components/intro/value-hooks.ts (registry keyed by path+module) + ValueHookBanner injected at top of IntroLessonRenderer. Covers all 95 lessons via prefix match, additive (no lesson file touched). #2 voluntary continuation & #3 technical accuracy fix لسه todo.'
WHERE id = '9927ccd0-f853-4d1f-aee9-6032ca32df81';