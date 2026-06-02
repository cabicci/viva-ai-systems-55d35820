UPDATE public.roadmap_items
SET notes = COALESCE(notes,'') || E'\n[ai-edit 2026-05-31]: [scope:lessons] بسّطت m3-webhooks-api أكتر — قللت المصطلحات من 7 لـ 3 (API/Webhook/Payload)، أضفت reassurance block، بسّطت الـ comparison والـ mission لتسليم 3 سطور.'
WHERE id = '32617d02-5dcf-44e7-bc92-39b22e578215';