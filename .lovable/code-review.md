# تقرير مراجعة الكود

التاريخ: 24 مايو 2026  
الأداة: knip + فحص يدوي  
**مفيش أي حذف لسه — التقرير ده للمراجعة فقط.**

---

## 1. ملفات الـ shadcn/ui غير المستخدمة (36 ملف) — آمن للحذف

دي مكتبة components اتنزلت كاملة بس الموقع بيستخدم منها جزء صغير. مفيش أي import ليها في الكود.

```
accordion, alert-dialog, alert, aspect-ratio, avatar, breadcrumb, calendar,
carousel, chart, checkbox, collapsible, command, context-menu, dialog,
drawer, dropdown-menu, form, hover-card, input-otp, menubar, navigation-menu,
pagination, radio-group, resizable, scroll-area, select, separator, sidebar,
skeleton, slider, switch, table, tabs, toggle-group, toggle, tooltip
```

**ملاحظة:** `dialog.tsx` و `tooltip.tsx` ممكن نحتاجهم قريب للـ Paywall modal، فممكن نسيبهم.

---

## 2. npm dependencies غير مستخدمة (33 package) — آمن للحذف

معظمها radix-ui للـ components الفوق + مكتبات form/date/chart مش متستخدمة:

```
@hookform/resolvers, react-hook-form, @radix-ui/react-* (22 package),
@react-pdf/renderer, cmdk, date-fns, embla-carousel-react, input-otp,
react-day-picker, react-resizable-panels, recharts, vaul, @tanstack/router-plugin
```

**تحذير:**
- `@react-pdf/renderer` — كنا اتفقنا على PDF certificates للـ Pro tier. لو هنبدأ فيها قريب، نسيبها.
- `react-hook-form` + `@hookform/resolvers` — أي form validation جاية هتحتاجها. نسيبها كـ devDependency أو نضيفها لما نحتاجها.

---

## 3. ملفات Remotion غير مستخدمة (131 ملف) — يحتاج مراجعة

ده مشروع الفيديو المنفصل. فيه نسخ قديمة من الـ scenes والـ cards:

- `remotion/src/m1-l01/` → `m1-l07/` (إصدارات قديمة لدروس Builder M1)
- `remotion/src/v18a/`, `v21/` (محاولات قديمة)
- `remotion/src/scenes/` (scenes قديمة قبل الـ Variant C)
- `remotion/src/lesson-cards/`, `builder-m1-llm/`, `components/`
- `remotion/scripts/render-*.mjs` القديمة (render-m1-l01 → l07, render-v18a, render-v21, render-cutaway, render-ecosystem)
- `remotion/src/lessons-generated/*.gen.ts` (17 ملف — مولّدة آلياً)

**مهم جداً:** `lessons-generated/*.gen.ts` مولّدة من السكريبتات، حذفها هيتعمل re-generate تلقائي. لكن باقي الملفات شغل قديم.

محتاج رأيك: نمسح كل الإصدارات القديمة (m1-l01 → l07, v18a, v21, scenes, lesson-cards, builder-m1-llm) ولا نسيبها كـ reference؟

---

## 4. مكونات Lesson/Narrative غير مستخدمة — يحتاج مراجعة

```
src/components/lesson/LessonEngine.tsx
src/components/lesson/MissionCard.tsx
src/components/lesson/MissionStatusBadge.tsx
src/components/lesson/blocks.tsx
src/components/narrative/NarrativePopup.tsx
src/components/narrative/NarrativeRuntime.tsx
src/components/narrative/narrative-triggers.ts
src/components/narrative/types.ts
src/components/assistant/AssistantFab.tsx
```

- `lesson/*` — شكلها بقايا من نظام دروس قديم اتستبدل بـ `IntroLessonRenderer`
- `narrative/*` — feature اتعملت ومتفعّلتش
- `AssistantFab.tsx` — الـ AssistantPanel معروض من مكان تاني

محتاج تأكيدك إن مفيش خطة قريبة لإحياء أي منهم.

---

## 5. ملفات Retrieval/Search غير مستخدمة — يحتاج مراجعة

```
src/lib/retrieval/chunking.ts
src/lib/retrieval/embedding-adapter.ts
src/lib/retrieval/semantic-search.ts
src/lib/retrieval/types.ts
supabase/functions/ingest-curriculum-knowledge/index.ts
supabase/functions/semantic-search/index.ts
supabase/functions/assistant-runtime/index.ts
```

ده نظام RAG/Semantic Search كامل (frontend + edge functions). شكله مش متفعّل في الموقع دلوقتي. **مهم:** الـ edge functions ممكن تكون لسه شغالة على Supabase. محتاج نتأكد قبل الحذف.

---

## 6. ملفات أخرى تبدو غير مستخدمة لكنها مطلوبة — اتركها

knip ما بيعرفش الـ framework entry points. الملفات دي **لا تحذف**:

```
src/router.tsx           ← entry للـ TanStack Router
src/server.ts            ← SSR entry
src/start.ts             ← startup config (لازم لـ attachSupabaseAuth)
src/integrations/supabase/auth-attacher.ts    ← middleware لازم لـ serverFn auth
src/integrations/supabase/client.server.ts    ← admin client للـ server routes
src/hooks/use-mobile.tsx ← ممكن نستخدمه قريب
src/lib/error-capture.ts, error-page.ts       ← error boundaries
```

---

## 7. Exports غير مستخدمة داخل ملفات مستخدمة — آمن للحذف

- `src/components/intro/diagrams/AnalystBusinessDiagrams.tsx` — 21 diagram export مش متستخدمين
- `src/components/intro/diagrams/LessonDiagrams.tsx` — 9 diagram exports
- `src/components/intro/lesson-continuity.ts` — `LESSON_CONTINUITY`
- `src/components/ui/badge.tsx` — `badgeVariants`
- `src/components/ui/button.tsx` — `buttonVariants`
- `src/components/ui/card.tsx` — `CardHeader, CardFooter, CardTitle, CardDescription, CardContent`
- `src/components/ui/popover.tsx` — `PopoverAnchor`
- `src/components/ui/sheet.tsx` — أجزاء كتير من sheet

**ملاحظة:** أجزاء shadcn (Card sub-components, buttonVariants) ممكن نحتاجها أي وقت، فالأفضل نسيبها.

---

## 8. Scripts قديمة (3 ملفات)

```
scripts-extract.ts
scripts/extract.ts
scripts/gen-chunks.ts
```

شكلها سكريبتات استخدمت مرة واحدة لتجهيز بيانات RAG. آمن للحذف لو مش هنرجع للـ retrieval feature.

---

# ملخّص الحذف المقترح

| الفئة | عدد | الحالة |
|------|------|---------|
| shadcn/ui ملفات | 34 (نستثني dialog, tooltip) | آمن |
| npm dependencies | 28 (نستثني pdf, hook-form, hookform/resolvers, router-plugin, recharts احتمال) | آمن |
| Remotion قديم | ~100 ملف | محتاج تأكيدك |
| lesson/narrative components | 9 | محتاج تأكيدك |
| retrieval + edge functions | 7 | محتاج تأكيدك (خصوصاً الـ edge functions) |
| diagrams unused exports | 30 export | آمن لكن منخفض الأولوية |
| scripts قديمة | 3 | محتاج تأكيدك |

**مكسب تقديري:** تقليل ~200 ملف + ~28 npm dependency = build أسرع، codebase أنضف.

---

# المطلوب منك

قولّي على كل قسم:
1. shadcn/ui الـ 34 ملف → **احذف؟** (نسيب dialog + tooltip)
2. npm dependencies الـ 28 → **احذف؟**
3. Remotion القديم → **احذف الإصدارات m1-l0X و v18a و v21؟**
4. lesson/narrative/AssistantFab → **حذف ولا في خطة لإحيائهم؟**
5. retrieval + 3 edge functions → **حذف؟** (لو في خطة لـ AI search مستقبلاً نسيبها)
6. scripts/extract.ts و gen-chunks.ts → **حذف؟**

لما ترد، نمشي على دفعات صغيرة مع build verification بعد كل دفعة.