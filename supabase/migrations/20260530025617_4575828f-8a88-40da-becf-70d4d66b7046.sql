UPDATE roadmap_items 
SET status='done', 
    completed_at=now(),
    updated_at=now(),
    notes = COALESCE(notes,'') || E'\n\n[Done] أضفت JSON-LD في src/routes/__root.tsx عبر TanStack head().scripts:\n- EducationalOrganization (organization root)\n- WebSite (linked to organization)\n- ItemList بـ 5 Courses (Builder/Creator/Automator/Analyst/Business) مع اسم، وصف، اللغة العربية، courseMode=Online، workload تقديري، availability=InStock.\nملاحظة: الـ Course schemas جوّا ItemList واحد على الـ root، فلو في المستقبل اتضافت per-path routes نقدر ننقل كل Course لصفحته.'
WHERE id='ad9b09a7-f5db-43f2-93c8-0d77886f2919';