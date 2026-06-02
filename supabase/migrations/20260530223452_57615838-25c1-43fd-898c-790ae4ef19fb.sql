UPDATE public.roadmap_items
SET status = 'done'::roadmap_status,
    completed_at = now(),
    updated_at = now(),
    notes = COALESCE(notes, '') || E'\n[ai-edit 2026-05-30]: [scope:infra] #2 done — persona-sim now asks each persona an explicit continue/quit decision after every lesson (voluntary_continue / voluntary_quit events) + expanded lesson lineup from 2 → 12 Builder lessons (m1–m5) so we can measure real drop-off. Report adds avg lessons completed + voluntary quit count.\n[ai-edit 2026-05-30]: [scope:infra] #3 done — assistant-runtime system prompt now has a "دقة تقنية" block clarifying Tokenizer vs Encoding, Embedding vs Token, Fine-tuning vs RAG, Context window vs Memory, Temperature vs Top-p, with a fallback to "مش متأكد 100%" instead of guessing.'
WHERE id = '9927ccd0-f853-4d1f-aee9-6032ca32df81';