-- The curriculum intake accepts reviewed raster images in its two private
-- download buckets. Keep the existing size limits and append only missing types.
UPDATE storage.buckets AS b
SET allowed_mime_types = b.allowed_mime_types || ARRAY(
  SELECT mime FROM unnest(ARRAY['image/jpeg','image/png','image/webp']) AS supported(mime)
  WHERE NOT (mime = ANY(b.allowed_mime_types))
)
WHERE b.id IN ('academic-downloads','technical-downloads')
  AND b.public IS FALSE
  AND b.allowed_mime_types IS NOT NULL
  AND NOT (b.allowed_mime_types @> ARRAY['image/jpeg','image/png','image/webp']);
