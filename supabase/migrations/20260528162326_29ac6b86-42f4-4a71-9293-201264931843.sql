
-- Create private bucket for DNA reports archive
INSERT INTO storage.buckets (id, name, public)
VALUES ('dna-reports', 'dna-reports', false)
ON CONFLICT (id) DO NOTHING;

-- Admins can list & read DNA reports
CREATE POLICY "dna_reports_admin_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'dna-reports'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can upload DNA reports
CREATE POLICY "dna_reports_admin_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dna-reports'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can delete DNA reports
CREATE POLICY "dna_reports_admin_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'dna-reports'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);
