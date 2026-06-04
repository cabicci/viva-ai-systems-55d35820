## الخلاصة
الخطأ `Missing Supabase environment variable(s): SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY` بييجي من `src/integrations/supabase/client.ts` لما يشتغل في الـ server (SSR) من غير ما يلاقي `process.env.SUPABASE_URL`. تحققت من الـ sandbox: الـ `.env` اتحدّث الساعة 2:12pm وفيه القيم الـ 5 المطلوبة، والـ home route بيرجّع HTTP 200 دلوقتي.

## السبب الجذري المحتمل
- الـ preview كان شغّال قبل ما Lovable Cloud يحقن الـ env vars (server-side: `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`). الـ Vite عمل restart الساعة 2:12 لما الـ `.env` اتغيّر.
- لو الخطأ لسه بيظهر بعد reload كامل → فيه روت معيّن بيـ SSR ويلمس supabase من loader/serverFn.

## الخطوات
1. **تأكيد بسيط من المستخدم**: hard reload (Ctrl+Shift+R) للـ preview، وتجربة الروت اللي ظهر فيه الخطأ.
2. لو لسه بيحصل، أحدد الروت من المستخدم وأفحص:
   - أي `loader` بينادي `createServerFn` بيستخدم supabase على روت public (مش تحت `_authenticated/`).
   - أي ملف بيقرا `process.env.SUPABASE_*` على module scope بدل جوّا `.handler()`.
3. **مفيش تعديل على `.env` أو `client.ts`** — دول auto-generated وممنوع نلمسهم.
4. لو الخطأ ثابت في الـ Published بس مش الـ Preview → نطلب من المستخدم Republish عشان الـ Worker ياخد الـ env vars الجديدة.

## لازم أعرف
- الخطأ ظاهر دلوقتي بعد reload؟ ولا كان فقط قبل الـ restart الساعة 2:12؟
- لو لسه ظاهر — على أنهي صفحة بالظبط؟ (مثلاً `/dashboard`, `/learn/business/...`, `/admin/...`)

من غير الإجابتين دول، الخطوة العملية الوحيدة هي طلب hard reload + جواب على السؤالين.
