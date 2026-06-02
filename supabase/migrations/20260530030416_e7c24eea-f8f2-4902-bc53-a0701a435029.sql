INSERT INTO public.roadmap_items (title, description, phase, status, sort_order, notes)
VALUES (
  'Fix Bunny video 404 — First Prompt aliases',
  'توحيد GUID فيديو first-prompt و intro-first-prompt بعد ظهور 404 داخل مشغل Bunny في درس /learn/intro/first-prompt.',
  'inbox',
  'done',
  999,
  'تم التأكد أن GUID القديم للـ first-prompt كان بيرجع صفحة title=404 داخل iframe رغم HTTP 200. تم توحيد alias first-prompt على نفس GUID الصحيح المستخدم في intro-first-prompt: e85aaa0f-4468-4bb5-9333-8abb9887d81b، واختبار الرابط أكد أنه لم يعد يعرض 404.'
);
