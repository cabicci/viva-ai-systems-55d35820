-- Mark Builder videos Batch 3 as in_progress after dispatching run 26680933486
UPDATE public.roadmap_items
SET status = 'in_progress',
    notes = COALESCE(notes,'') || E'\n[user-edit 2026-05-30]: dispatched Batch 3 — run 26680933486 (10 دروس: builder-m7-rls, m7-sessions-jwt, m8-tables-columns, m8-relations, m8-queries, m9-agents, m9-embeddings, m9-rag, m10-deploy-domain, m10-first-users). serial + Bunny upload + commit بعد كل درس.',
    updated_at = now()
WHERE id = '515a1a24-9f0d-4501-af90-51fe6dcd9692';
