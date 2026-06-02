UPDATE public.roadmap_items
SET status='done'::roadmap_status, completed_at=now(), updated_at=now(),
    notes=COALESCE(notes,'') || E'\n[2026-05-28] Verified already complete. Writes mirrored via src/lib/cloud-sync.ts (syncBuildLog, syncMissionState). Reads hydrated via src/components/site/CloudHydration.tsx (mounted in __root.tsx). DB tables build_logs + user_mission_state already exist with RLS.'
WHERE id='2100ade5-7a77-4bd5-911b-e50ceafac2fb';