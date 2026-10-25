BEGIN;
CREATE TABLE IF NOT EXISTS public.technical_video_replacement_batches(
 batch_id text PRIMARY KEY,source_sha text NOT NULL CHECK(source_sha ~ '^[a-f0-9]{40}$'),
 baseline jsonb NOT NULL CHECK(jsonb_array_length(baseline)=320),enabled boolean NOT NULL DEFAULT false,
 expires_at timestamptz NOT NULL);
CREATE TABLE IF NOT EXISTS public.technical_video_replacement_receipts(
 batch_id text NOT NULL REFERENCES public.technical_video_replacement_batches(batch_id),
 lesson_id text NOT NULL,locale text NOT NULL CHECK(locale IN ('ar-EG','ar-MSA','ar-Gulf','en')),
 old_guid uuid NOT NULL,new_guid uuid NOT NULL,source_sha256 text NOT NULL,
 video_sha256 text NOT NULL,audio_sha256 text NOT NULL,backup_sha256 text NOT NULL,
 backup_artifact_id text NOT NULL,run_id text NOT NULL,duration_seconds numeric NOT NULL,
 status text NOT NULL CHECK(status IN ('ready','linked')),linked_at timestamptz,
 PRIMARY KEY(batch_id,lesson_id,locale),UNIQUE(new_guid));
ALTER TABLE public.technical_video_replacement_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_video_replacement_receipts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.technical_video_replacement_batches,public.technical_video_replacement_receipts FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.technical_video_replacement_batches,public.technical_video_replacement_receipts TO service_role;
COMMIT;
