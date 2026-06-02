UPDATE public.roadmap_items
SET status='done'::roadmap_status, completed_at=now(), updated_at=now(),
    notes=COALESCE(notes,'') || E'\n[2026-05-28] SEO baseline shipped: (1) root twitter:card upgraded to summary_large_image, (2) og:title/og:description/twitter:title/twitter:description added to /, /curriculum, /journey, (3) /learn/:path/:lesson now emits per-lesson description + og:type=article + twitter cards, (4) canonical link added to home. Root already had og:image; leaf pages inherit unless they override.'
WHERE id='d6638437-7ef5-4a07-88d3-51a6e36dc7ca';