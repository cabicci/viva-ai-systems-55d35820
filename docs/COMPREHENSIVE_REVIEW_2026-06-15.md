# مراجعة شاملة عميقة — 2026-06-15

> **⚠️ Historical audit only — NOT current source of truth.**  
> Many Critical/High findings below were resolved or were false positives as of 2026-06.  
> For launch status use `docs/CURRENT_STATUS.md` and `docs/playbooks/P0_LAUNCH_CONSTITUTION.md`.  
> Do not treat blocker tables here as active work items.

> **الخلاصة:** المشروع في وضع صحي عام (104 درس + فيديو، 24 جدول مع RLS مفعّل، طبقة الـ design tokens منظّمة)، بس فيه **4 مشاكل حرجة** لازم تتعالج فوراً، و**12 مشكلة عالية**، و**18 متوسطة/منخفضة**. أبرز الـ blockers: تكرار lesson ID في Business، صلاحيات `anon` واسعة على كل الجداول، rate-limit function بدون حماية، و`min-h-screen` على الموبايل.

نطاق المراجعة (read-only): المحتوى/الدروس + الكود/المعمارية + قاعدة البيانات/الـRLS + الـUI/UX.
المراجعة اتعملت بـ 4 subagents بالتوازي + `supabase--linter` + security scan.

---

## 🔴 Blockers (Critical) — يتعالجوا فوراً

| # | المحور | المشكلة | الموقع |
|---|---|---|---|
| **DB-C1** | DB | `consume_rate_limit` SECURITY DEFINER بدون فحص هوية المستخدم — أي مستخدم يقدر يستنزف rate limit بتاع غيره | `public.consume_rate_limit` |
| **DB-C2** | DB | دور `anon` معاه صلاحيات كاملة `arwdDxtm` على كل الـ24 جدول — RLS هو الحاجز الوحيد | كل جداول `public.*` |
| **CONTENT-C1** | محتوى | درسين مختلفين بنفس الـID `business-m2-l2` (build-your-offer + retention-flow) — تضارب runtime | `index.ts`, `bunny-videos.ts` |
| **CONTENT-C2** | محتوى | 4 دروس Business مسجلة في الـregistry والـBunny لكن مش متاحة في `curriculum-data.ts` — محتوى مدفون | `business-m1-l3`, `m2-l4`, `m3-l4`, `m4-l5` |
| **CODE-C1** | كود | `src/routes/[index].tsx` مسار وهمي `/index` بـbracket-syntax غلط — إما redirect loop أو 404 | `src/routes/[index].tsx:3` |
| **CODE-C2** | كود | `rate-limit.server.ts` بيستورد `client.server` على top-level — خطر تسريب service-role key لو دخل client bundle | `src/lib/rate-limit.server.ts:1` |
| **UI-C1** | UI | `min-h-screen` مستخدم في 17+ route — على الموبايل بيتقصّ المحتوى ورا address bar | كل الـroutes تقريباً |
| **UI-C2** | UI | `fixed left-4` على زرار العودة في RTL — الزرار بيظهر في الناحية الغلط | `learn.$pathId.$lessonId.tsx:252,266` |
| **UI-C3** | UI | hex hardcoded `#ffffff/#e5e7eb/#f3f4f6` في print overrides | `routes/system-state.tsx:71-86` |

---

## 1️⃣ المحتوى والدروس

### الجرد
- إجمالي **104 درس** + كل فيديوهات Bunny موجودة (0 orphans).
- توزيع: Intro 7، Builder 29، Creator 19، Automator 18، Analyst 14، Business 17.

### High
- **H1 (Naming):** 4 ملفات مكسرة الـnaming convention `{path}-m{n}-l{n}-{slug}` (مفقود `-l{n}`):
  - `analyst-m4-automated-dashboard.ts`
  - `analyst-m5-ab-testing.ts`
  - `automator-m3-testing-automation.ts`
  - `creator-m4-repurposing.ts`
- **H2:** Builder M7/M8 — أسماء الـconstants متعاكسة عن أسماء الملفات (الـkeys صح، الأسماء بس مربكة).
- **H3:** كل Business constants أسماؤها متعاكسة عن الـmodule numbers الحالية.
- **H4:** Creator M4–M6 constants off-by-one في الأسماء.
- **H5:** 30+ مرجع `lessonId: "..._apply"` لـIDs مش موجودة في أي registry — silent failures.

### Medium
- **M1:** `scripts/lesson-audit/output/cross-path-issues.md` قديم (2026-06-03) وبيرجّع 278 issue معظمها false positives.
- **M2:** `analyst-m1` فيه درس واحد بس — فجوة بصرية في الـcurriculum.
- **M3:** `business-m2` ترتيب الـslugs متضارب داخلياً (متعلق بـC1).

### Low
- **L1:** كلمة `قرار` متكررة 300+ مرة في 18 ملف (TTS rule: استخدم `اختيار`). Top offenders: `analyst-m7-l1` (35)، `analyst-m5-l2` (26)، `analyst-m2-l2` (25).
- **L2:** كلمات MSA متفرقة (`هذا`/`هذه`) في 3 ملفات.

---

## 2️⃣ الكود والمعمارية

### High
- **H1 (Auth):** الـroutes المحمية (`dashboard`, `analytics`, `ai-assistant`, `onboarding`, `account`) بتعمل auth gate بـclient-side `useNavigate` بدل `beforeLoad` + `_authenticated/` layout. SSR بيرندر shell للـunauth قبل ما الـclient يـredirect.
- **H2:** `admin.functions.ts` بيـcall `assertAdmin` بـuser-scoped client، بعدها بيـquery بـ`supabaseAdmin` (service-role). تباين في auth clients — لو RLS اتعطّل، الـrole check ممكن يفشل بصمت.
- **H3:** `head()` ناقص description/og في `forgot-password`, `reset-password`, `onboarding`, `roadmap.$id`, `dashboard`.
- **H4:** `requireAdminBeforeLoad` بتفشل دايماً في SSR (مفيش bearer token) → flash redirect.

### Medium
- **M1:** `MissionRubricSubmit.tsx` (584 سطر)، `IntroLessonRenderer.tsx` (558 سطر) محتاجين split.
- **M2:** مفيش rate limit على `getAdminOverview/Activity/Insights`، `getDueReviews`.
- **M3:** `inputValidator` ناقص على بعض GET server functions.
- **M4:** `index.tsx` + `learn.$pathId.$lessonId.tsx` بدون `og:image` على مستوى الـroute.
- **M5:** `verbatimModuleSyntax: false` في tsconfig.
- **M6:** `noUnusedLocals`/`noUnusedParameters` كلهم false + ESLint rule off → مفيش dead-code detection.
- **M7:** `auth-attacher.ts` + `auth-middleware.ts` فيهم تعليق "auto-generated" غلط (الملفين hand-written).

### Low
- **L1:** Filename `[index].tsx` syntax غلط (dynamic vs static).
- **L2:** `roadmap.$id.tsx` `head()` static مش dynamic.
- **L3:** `nitro` في `dependencies` بدل `devDependencies` + version beta.
- **L4:** `@radix-ui/react-toggle` يبدو unused.
- **L5:** `__root.tsx` فيه canonical hardcoded `https://masaarat.ai` — كل الصفحات بتشاركه (SEO harmful).
- **L6:** root OG title 54 حرف بس عرضه أوسع للعربي.
- **L7:** `globals.browser` مطبّق على كل الـTS files بما فيهم `*.functions.ts`.

### Linter Warnings (Supabase)
30 تحذير كلها `SECURITY DEFINER function publicly executable` — أغلبها متعمد (RPCs)، بس محتاج individual review لتأكيد كل واحدة.

---

## 3️⃣ قاعدة البيانات والـRLS

### Critical
- **DB-C1:** `consume_rate_limit(p_user_id, ...)` SECURITY DEFINER بدون فحص `auth.uid() = p_user_id`. أي auth user يقدر يستنزف bucket مستخدم تاني.
- **DB-C2:** `anon` معاه ACL كامل `arwdDxtm` على كل 24 جدول. RLS هو الحاجز الوحيد.

### High
- **H1:** `client_error_logs` دور `authenticated` ماعندوش SELECT grant — policy `admins can read error logs` ميتة (admin هيرجع 0 rows).
- **H2:** `knowledge_chunks` policy `kc_select_authenticated USING (true)` — أي مستخدم مسجل (مجاني/مشترك) يقدر يقرا كل الـembeddings بدون فحص اشتراك.
- **H3:** 3 UPDATE policies ناقصة `WITH CHECK` (lqa, uls, bl) — مستخدم يقدر يحوّل صفوفه لـuser_id تاني.
- **H4:** Storage bucket `dna-reports` ماعندوش SELECT policy للـowner — المستخدم مقدرش يقرا تقريره الشخصي عبر Storage API.

### Medium
- **M1:** `user_validation_sessions.user_id` nullable مع إنه مستخدم في RLS.
- **M2:** `client_error_logs` بتسمح للـauthenticated بـINSERT بـ`user_id = NULL` (log flooding vector).
- **M3:** indexes ناقصة على columns مهمة: `client_error_logs.user_id`, `user_validation_sessions.user_id`, `build_logs.lesson_id`, `mission_submissions.lesson_id`.
- **M4:** `has_role` STABLE بيـquery `user_roles` مرتين (مرة في الـguard ومرة في الـreturn) — performance footgun على admin queries كبيرة.
- **M5:** `audio_assets_admin_insert` USING فاضي (مش خطر دلوقتي بس fragile).

### Low
- **L1:** جداول read-only للمستخدمين (`user_subscriptions`, `user_streaks`, etc.) محتاجة `COMMENT` يوضح إن الكتابة عمداً مقصورة على service_role.
- **L2:** indexes مكررة على `learner_events` (2 sets من نفس الـindexes).
- **L3:** Storage buckets بدون `file_size_limit`.

---

## 4️⃣ الـUI/UX والتصميم

### Critical
شوف الجدول فوق (UI-C1, C2, C3).

### High
- **H1:** Skip-link `<a href="#main-content">` في `__root.tsx` بس `id="main-content"` موجود في 3 routes بس من ~20 — keyboard users بيهبطوا على anchor مكسور.
- **H2:** `rgba(255,140,60,...)` hardcoded في `@keyframes flame-flicker` — لون منعزل عن tokens.
- **H3:** فئات `ml-/mr-/pr-/pl-` فيزيكية بدل `ms-/me-/ps-/pe-` logical في 8+ مواقع RTL (`admin.index.tsx`, `Hero.tsx`, `behavior-architecture.tsx`, `operational-layers.tsx`, إلخ).
- **H4:** فئات Tailwind palette مباشرة (`text-red-200`, `bg-rose-400/...`, `bg-amber-400/15`, `text-white`, `bg-black/80`) في 8+ ملفات — تجاوز للـsemantic tokens.
- **H5:** `IBM Plex Sans Arabic` مرجع في الـSVG diagrams بس مش محمّل في أي مكان — fallback صامت.
- **H6:** `src/assets/fonts/Cairo.ttf` متضمّن (~300KB) بدون `@font-face` — dead asset.

### Medium
- **M1:** مفيش dark mode (`.dark {}` block غير معرّف) رغم إن variant معدّ. شيلوه أو اعمله.
- **M2:** background blob divs مش `aria-hidden`.
- **M3:** Sidebar mobile hamburger `<SheetTrigger>` بدون `aria-label`.
- **M4:** `<img>` بدون `alt` في `admin.icons-preview.tsx` (3 مرات) + `GalleryGrid.tsx`.
- **M5:** Gallery lightbox overlay div بـ`onClick` بدون role/keyboard handler/Escape.
- **M6:** مفيش `pendingComponent` على routes تقيلة (`dashboard`, `analytics`, `learn`).
- **M7:** `text-right` بدل `text-start` في 3 مواقع.

### Low
- **L1:** `::selection` contrast ضعيف.
- **L2:** `border-r-2` فيزيكي بدل `border-s-2` في `IntroLessonRenderer.tsx:424`.
- **L3:** decorative blobs مش `aria-hidden`.
- **L4:** `font-feature-settings: "ss01","ss02"` على body — Tajawal ميدعمش الـtags دي (dead code).
- **L5:** `<BackToDashboard>` بتترندر global بدون contextual guard.

---

## ✅ حاجات شغّالة كويس (Positive Findings)

- **DB:** كل الـ24 جدول RLS مفعّل + GRANTs أساسية موجودة.
- **Security scans:** مفيش critical findings.
- **Bunny registry:** 100% consistent — 104 درس / 104 فيديو، صفر orphans.
- **Auth pattern:** `requireSupabaseAuth` middleware + `attachSupabaseAuth` صح في `start.ts`.
- **Design tokens:** `styles.css` منظّم بـoklch + semantic layers + `prefers-reduced-motion` + RTL base.
- **Triggers:** كل الـ19 trigger نظيفة، مفيش auto-grant roles أو bypasses.
- **Storage:** bucket policies للـadmin على الاتنين موجودة.

---

## 🎯 أولوية التنفيذ المقترحة

**Sprint 1 (الحرج):**
1. DB-C1 — حماية `consume_rate_limit`
2. DB-C2 — `REVOKE ALL ... FROM anon` ثم re-grant المحتاج فقط
3. CONTENT-C1 — حل التضارب `business-m2-l2`
4. CODE-C1, CODE-C2 — حذف `[index].tsx` + تأمين `rate-limit.server.ts`
5. UI-C1 — استبدال `min-h-screen` بـ`min-h-dvh`

**Sprint 2 (High):**
6. DB-H1..H4 (client_error_logs grant، knowledge_chunks USING، WITH CHECK على 3 policies، dna-reports owner policy)
7. CODE-H1 — `_authenticated/` layout للـprotected routes
8. CONTENT-H1, H5 — rename الـ4 ملفات + تنظيف `-apply` references
9. UI-H1, H3, H4 — skip-link IDs + logical RTL classes + إزالة raw palette colors

**Sprint 3 (Medium/Low):** الباقي.

---

## 📝 ملاحظات

- كل المشاكل المرصودة هنا اتسجلت كـ `roadmap_items` بـsource marker `[source:ai]`.
- المراجعة دي **read-only** — مفيش تعديل ولا commit. تنفيذ الفِكسات في sprints منفصلة بعد اعتماد الأولويات.
- التقرير ده يتراجع كل ~30 يوم.
