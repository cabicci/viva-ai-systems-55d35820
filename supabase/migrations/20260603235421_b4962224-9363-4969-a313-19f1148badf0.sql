UPDATE public.roadmap_items
SET notes = COALESCE(notes, '') || E'\n[ai-edit 2026-06-03]: [scope:content] fixed curriculum source-of-truth module orders so Automator/Analyst/Business modules start at M1 instead of M0; synced gallery/system labels.',
    updated_at = now()
WHERE id = '557581c0-c746-44ce-8df6-fb76570c8ea0';