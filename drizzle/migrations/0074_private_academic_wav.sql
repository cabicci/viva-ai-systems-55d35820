-- The audio production course stores its reviewed PCM recordings in this private bucket.
UPDATE storage.buckets
SET allowed_mime_types = array_append(allowed_mime_types, 'audio/wav')
WHERE id = 'academic-downloads'
  AND public IS FALSE
  AND allowed_mime_types IS NOT NULL
  AND NOT ('audio/wav' = ANY(allowed_mime_types));
