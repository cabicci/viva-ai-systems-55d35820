UPDATE public.roadmap_items
SET status = 'done',
    completed_at = now(),
    notes = COALESCE(notes,'') || E'\n\n[ai-edit 2026-05-31]: [scope:lessons] Ahmed sim v4 PASSED all targets: confidence 6.5 (≥6), overwhelm 4.88 (≤6), drop rate 0% (≤25%), 0/4 drops on edited lessons. Outputs at /mnt/documents/ahmed-sim-v4-m3-m5.json + ahmed-sim-v4-summary.md. Closing as done.',
    updated_at = now()
WHERE id = '32617d02-5dcf-44e7-bc92-39b22e578215';

INSERT INTO public.roadmap_items (title, phase, status, completed_at, notes)
VALUES (
  'Ahmed simulation v4 — m3→m5 validation',
  'inbox',
  'done',
  now(),
  E'[source:ai]\n\nRan persona simulation v4 on 8 m3-m5 lessons after jargon simplification. Used google/gemini-3-flash-preview with same Ahmed persona. Confirmed fix: confidence 4.38→6.5, overwhelm 7.88→4.88, drop rate 50%→0%. All 4 edited lessons (m3-connect-database, m3-webhooks-api, m4-llm-in-flow, m4-agents) passed with felt_reassured=true. Outputs at /mnt/documents/ahmed-sim-v4-m3-m5.json + ahmed-sim-v4-summary.md.'
);