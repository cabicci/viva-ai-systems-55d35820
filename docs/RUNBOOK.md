# RUNBOOK — العمليات الحساسة والطوارئ

> كل سيناريو هنا له خطوات قصيرة ومرتّبة. اقرأ الخطوة كلها قبل ما تنفّذ.

---

## 1. إيقاف فوري لمصاريف الـ AI

لو لاحظت استهلاك مرتفع غير متوقع للـ AI Gateway:

1. ادخل Lovable → **Cloud** → **Secrets**.
2. احذف أو ابدّل قيمة `LOVABLE_API_KEY`.
3. النتيجة: المساعد + retrieval هيرجعوا errors فورًا، بدون استهلاك.
4. لما تتأكد إن كل حاجة مظبوطة، ارجّع المفتاح من Lovable AI settings.

بديل أخف: اخفي الـ Assistant FAB من الـ UI مؤقتًا بتعطيل `<AssistantFab />` في `src/routes/__root.tsx`.

## 2. Rollback إلى إصدار سابق

1. Lovable → أيقونة الساعة (History) أعلى المحرّر.
2. اختار الإصدار اللي قبل المشكلة.
3. اضغط **Restore**.
4. Rollback بيرجّع الكود فقط، **مش بيرجّع DB**. لو كانت في migration، اعمل migration معاكسة يدويًا.

## 3. تصدير بيانات المتعلمين (قبل أي تعديل خطر)

الجداول المهمة:

| الجدول | الغرض |
|---|---|
| `lesson_progress` | حالة كل درس لكل متعلم |
| `user_lesson_status` | حالة الدرس v2 |
| `mission_submissions` | إجابات المهام |
| `user_mission_state` | حالة المهمة |
| `build_logs` | سجل البناء الحقيقي |
| `lesson_notes` | ملاحظات المتعلم |
| `knowledge_chunks` | الـ corpus (يمكن إعادة بنائه) |

**خطوات الـ export:**
1. Lovable → **Cloud** → **Database** → **Tables**.
2. اختار الجدول.
3. اضغط **Export** (CSV).
4. خزّن الـ CSV بره المنصة (Drive / S3 / محلي).

اعمل export كامل قبل أي عملية حذف أو decommission.

## 4. حذف user واحد (طلب GDPR / حذف حساب)

1. Lovable → **Cloud** → **Users**.
2. ابحث بالـ email.
3. اضغط **Delete user** على السطر.
4. الـ cascade هيحذف تلقائيًا الصفوف المرتبطة في الجداول اللي عندها FK لـ `auth.users`.
5. **هام:** الجداول اللي بتربط بـ `user_id` بدون FK رسمي (زي `lesson_notes`, `lesson_progress`) محتاجة حذف يدوي عبر SQL لو لزم:
   ```sql
   delete from public.lesson_notes where user_id = '<UUID>';
   delete from public.lesson_progress where user_id = '<UUID>';
   delete from public.mission_submissions where user_id = '<UUID>';
   delete from public.user_lesson_status where user_id = '<UUID>';
   delete from public.user_mission_state where user_id = '<UUID>';
   delete from public.build_logs where user_id = '<UUID>';
   ```

## 5. إخفاء/تعطيل درس أو مسار من النافيجيشن

**لا تحذف الملف.** بدل كده:

1. افتح `src/lib/curriculum-data.ts`.
2. لاقي الـ `lesson(...)` المطلوب.
3. غيّر `state` من `"available"` إلى `"coming-soon"` وشيل الـ `route`.
4. النتيجة: الدرس هيظهر "قريبًا" في خريطة المنهج، الـ route لو حد وصله مباشرة هيشتغل لكن مش هيكون موصول من الـ UI.

لإخفاء كامل: شيل الـ entry من قائمة الموديول.

## 6. إيقاف نشر الموقع (Unpublish)

1. Lovable → **Publish** (أعلى يمين).
2. **Unpublish** أو حدّد visibility = private.
3. الـ preview URL يفضل شغّال للمحرر، الـ published URL هيرجع 404.

## 7. Decommission كامل (إغلاق المشروع نهائيًا)

بترتيب صارم:

1. **Export كل الجداول** (راجع §3).
2. **Export الكود:** Lovable Code Editor → Download codebase (ZIP) — يتطلب workspace مدفوع.
3. **Unpublish الموقع** (§6).
4. (اختياري) Lovable → Project Settings → احذف المشروع.
5. (اختياري) من Account Settings → Delete Account لو هتقفل الحساب نفسه — قابل للإلغاء خلال 30 يوم.

## 8. الأسرار والمفاتيح

- **مكانها الوحيد:** Lovable → Cloud → Secrets.
- **ممنوع** كتابة أي secret في الكود أو في `.env` يدويًا.
- المفاتيح المستخدمة حاليًا: `LOVABLE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only)، أي webhook secrets مستقبلية.
- لو تسرّب مفتاح: استخدم أداة rotate (مثلًا `ai_gateway--rotate_lovable_api_key`).

## 9. استرجاع كلمة سر مدير

1. اذهب إلى صفحة `/forgot-password` على الموقع.
2. هتستلم لينك إعادة التعيين على البريد.
3. الصفحة `/reset-password` بتستقبل الـ recovery token وتسمح بتعيين كلمة جديدة.
4. لو الـ email provider مش مظبوط، استخدم Lovable → Cloud → Users → ابعت reset link يدويًا.

## 10. تحديث الـ corpus (الكتاب / المعرفة)

لو غيّرت محتوى تعليمي وعايز المساعد يلاقيه:

1. عدّل المصدر (lesson file أو brain data).
2. شغّل edge function: `ingest-curriculum-knowledge` (من Lovable → Cloud → Edge Functions → اضغط Run، أو عبر `supabase--curl_edge_functions`).
3. الـ function هتحدّث `knowledge_chunks` بالـ embeddings الجديدة.
4. اختبر بسؤال للمساعد عن المحتوى الجديد.

## 11. مراقبة الأخطاء

- **Console logs:** Lovable preview console.
- **Network requests:** Lovable preview network tab.
- **Edge function logs:** Lovable → Cloud → Edge Functions → اختار الـ function → Logs.
- **DB queries بطيئة:** Lovable → Cloud → Database → Performance.

## 12. لو الـ build فشل

1. اقرأ رسالة الـ error في Lovable.
2. شغّل محليًا (لو عندك الكود): `bunx tsc --noEmit` للكشف عن أخطاء TypeScript.
3. تأكد إن أي درس جديد لمس الـ 3 ملفات (راجع HANDOFF §8).
4. لو لسه فاشل: rollback (§2) لآخر إصدار شغّال، وحلّل الفرق.

---

**تذكير ذهبي:** قبل أي عملية تخريبية (delete / decommission / migration كبيرة) → **export أولًا** (§3).