# خطة: تقرير Bus Factor — Viva AI / masaarat.ai

## الخلاصة المبدئية
من `git log`: مساهم بشري واحد فقط (**khalil lotfy** — 151 commit)، والباقي بوتات (gpt-engineer 754، github-actions 197). يعني **Bus Factor = 1** على كل المستويات. التقرير هيوثّق ده بالتفصيل ويحدد نقاط الخطر والتوصيات.

## محاور التقرير

### 1) الكود (Frontend + Server functions)
- توزيع الـ commits على الملفات الحساسة (routes, server functions, integrations).
- تحديد الملفات اللي ليها مالك واحد بس (كلها متوقع).
- المناطق التقنية اللي محتاجة معرفة متخصصة: TanStack Start, Supabase RLS, auth middleware.

### 2) المحتوى (الدروس + السكريبتات)
- 5 مسارات × موديولز × دروس — كلها مكتوبة بصوت/أسلوب واحد (مصري مخصوص).
- نظام الـ IDs والـ rename workflow.
- معرفة قواعد الـ Egyptian Arabic prompt (موجودة في mem://).

### 3) البنية التحتية والعمليات
- Supabase (RLS, migrations, roles).
- Bunny Stream + Remotion + GitHub Actions (`lesson-video.yml`).
- AI Gateway (gemini-only policy) + credit tracking.
- Roadmap logging + build guard.
- النشر (Lovable + custom domain masaarat.ai).

### 4) نقاط الاعتماد الحرجة (Single Points of Failure)
- شخص واحد يعرف كل القرارات المعمارية والمحتوى.
- حسابات/مفاتيح: Bunny, Supabase, Lovable, GitHub, domain registrar.
- المعرفة الضمنية في mem:// (موثّقة لكن محتاجة قراءة).

### 5) المخاطر
- لو المساهم البشري الوحيد غاب: مفيش حد يقدر يكمل دروس، يصلح bugs، يدير النشر، أو يجدد المفاتيح.
- المحتوى بصوت/لهجة مخصوصة صعب يتقلّد بسهولة.

### 6) التوصيات العملية (مرتبة بالأولوية)
1. **توثيق الـ runbook** (مفاتيح، حسابات، خطوات النشر، استرجاع الكوارث) في ملف خاص.
2. **Onboarding doc** لأي مساهم جديد (architecture overview + كيف يضيف درس).
3. **مشاركة الـ secrets** في password manager مع شخص ثاني موثوق.
4. **Backup**: تصدير دوري لقاعدة البيانات + نسخة من الـ Bunny library.
5. **توثيق صوت المحتوى** (موجود جزئياً في mem://، يتحوّل لدليل style guide).
6. على المدى الطويل: مساهم ثاني (تقني أو محتوى) حتى لو part-time.

## شكل التسليم
التقرير كله **رد واحد في الشات بالعربي**، منظّم بعناوين قصيرة وبدون ملفات في الريبو. مفيش تغييرات كود.
