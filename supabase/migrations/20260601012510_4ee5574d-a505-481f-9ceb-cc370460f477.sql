UPDATE public.roadmap_items
SET status = 'in_progress',
    notes = notes || E'\n[ai-edit 2026-06-01]: [scope:lessons] أعدت تصميم builder-m1-what-is-llm — hook في ٣٠ ثانية، إضافة Quick Win mission في أول ٦٠ ثانية، تبسيط 3-concepts (شيلت parameters/hallucination/knowledge cutoff من المتن)، تقصير الـ quiz من ٣ أسئلة كثيفة لسؤال واحد بسيط، نقل تفصيل Large+Language+Model لقسم "للفضوليين" في الآخر، تبسيط الـ mission rubric.',
    updated_at = now()
WHERE id = '4e1c297f-977f-4a53-8acc-e14f4855303b';