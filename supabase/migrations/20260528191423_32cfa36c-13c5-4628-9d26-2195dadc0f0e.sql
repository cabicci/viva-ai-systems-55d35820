UPDATE public.roadmap_items
SET status = 'done'::roadmap_status,
    completed_at = now(),
    updated_at = now(),
    notes = COALESCE(notes, '') || E'\n[2026-05-28] Verified already implemented in src/routes/admin.tsx (Prev/Next buttons, page counter with total, hasMore-based disable). Server fn already returns total + hasMore. No code change needed.'
WHERE id = '4bba9f4d-c8bc-4f7b-811e-ba2fbb8044e7';