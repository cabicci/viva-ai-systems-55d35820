UPDATE public.roadmap_items
SET notes = '[source:user]
Fixed Runtime Error: Invalid Compact JWS for DNA report archive/list/download/delete.
[ai-edit 2026-05-30]: استغرق 3 محاولات متتالية:
1. ضفت enabled: !!user على useQuery في roadmap.index.tsx (عشان ما تنادي السيرفر من غير session).
2. ضفت guard في auth-context.tsx بيعمل signOut لو الـ access_token مش 3 segments.
3. الحل النهائي: استبدال supabaseAdmin.storage SDK calls بنداءات REST مباشرة (storageFetch helper) للـ list/upload/download/delete في src/lib/dna-report.functions.ts — السبب الجذري كان SDK بيبعت service role key بشكل بيتفسر كـ JWT.
[ai-self-note]: ما قريتش الرودماب قبل ما أبدأ — كسرت قاعدة Core. لازم أبدأ كل session بقراية كاملة.',
updated_at = now()
WHERE id = 'cb75757a-a11e-4fdb-a48a-6f1fece4c21b';