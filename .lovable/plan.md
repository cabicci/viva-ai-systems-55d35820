## الهدف
رفع قفل الصيانة عن `/signup` وإرجاع الصفحة تشتغل عادي.

## الخطوات
1. تعديل `src/routes/signup.tsx`: شيل `beforeLoad` اللي بيعمل redirect لـ `/`، ورجّع المكوّن الأصلي للتسجيل (Email/Password + Google عن طريق `lovable.auth.signInWithOAuth`).
2. التأكد إن الراوت بيستخدم نفس الـ AuthShell ونفس نمط `/login` عشان الشكل متناسق.
3. تحقّق إن `supabase.auth.signUp` بيبعت `emailRedirectTo: window.location.origin`.
4. تسجيل العملية في `roadmap_items` ([source:user] + [ai-edit]) وتشغيل `bun run roadmap:log`.

## ملاحظات
- مفيش تغيير في DB أو RLS — auth شغّال بالفعل.
- التأكيد بالإيميل هيفضل مطلوب (مش هنفعّل auto-confirm).
