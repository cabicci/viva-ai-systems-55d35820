update public.roadmap_items
set notes = notes || E'\n[ai-edit 2026-05-30]: [scope:other] شغلت السيم — junior-learner أول مرة، سأل سؤالين بدائيين (parameters / token) والإجابات وصلت clarity=clear helpful=True. التقرير في /mnt/documents/persona-sim-report.md',
    updated_at = now()
where id = '2227477b-cd13-4d41-bddf-4ae3eb3562b3';
