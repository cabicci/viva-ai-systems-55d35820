UPDATE public.roadmap_items
SET status = 'done'::roadmap_status,
    completed_at = now(),
    updated_at = now(),
    notes = COALESCE(notes, '') || E'\n[2026-05-28] Removed `(user.user_metadata as any)` in src/routes/dashboard.tsx — now typed as `{ full_name?: string } | null | undefined`. Only call site in the codebase.'
WHERE id = '3d225cb2-6db8-463f-b8c2-a792a1c7835b';