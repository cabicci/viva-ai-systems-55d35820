## خطة إكمال v4 — المراحل الـ3 المتبقية

### Phase 3B — Mini-Win lesson بعد m5
**الهدف:** إعطاء المتعلم إحساس نصر سريع بعد ما خلّص الجزء التقني الصعب (m5).

- إنشاء lesson جديد: `src/components/intro/lessons/builder-m5-l12b-mini-win.ts`
  - ID: `builder-m5-l12b-mini-win` (نضيفه بعد l12 من غير ما نكسر ترتيب الموديول)
  - المحتوى: "إنت دلوقتي عارف إزاي التطبيق بيشتغل من جوه — تعالى نشوف ده بيتترجم لإيه في Lovable" (مثال بصري قصير: form → backend → database)
  - مدة قصيرة (~60-90 ثانية script)
- تسجيله في `src/lib/curriculum-data.ts` ضمن module 5
- توليد الـ script عبر `GEMINI_API_KEY` مباشرة (skill/ai-gateway script)
- Trigger Bunny render

### Phase 4 — Jargon lint pass
**الهدف:** ضمان تطبيق glossary (Frontend=واجهة، Backend=الكواليس، API=ساعي البريد...) على كل دروس Builder.

- كتابة سكريبت `scripts/jargon-lint.mjs`:
  - يقرأ كل `src/components/intro/lessons/builder-*.ts`
  - يفحص ظهور مصطلحات إنجليزية (Frontend/Backend/API/Database/JWT/RLS/Schema/Query) من غير ما يكون قبلها التشبيه العربي في أول 200 حرف من الـ block
  - يطبع تقرير: `lesson → term → line`
- المراجعة يدوياً: تعديل كل lesson فيها مخالفة (متوقع 5-10 ملفات)
- Re-render للدروس المعدّلة فقط (batch ≤400 chars)

### Phase 5B — m9 كـ Reward
**الهدف:** تأطير m9 (RAG/embeddings) كمكافأة "خلّي تطبيقك ذكي بجد" بدل ما يبان كموديول تقني تاني.

- تحديث عنوان m9 في `src/lib/curriculum-data.ts`:
  - من: "Embeddings & RAG" → إلى: "خلّي تطبيقك ذكي زي ChatGPT"
  - subtitle يحتفظ بالاسم التقني
- تعديل opener لـ `builder-m9-l24-rag.ts`:
  - شيل أي مقدمة عن "vectors/chunks/embeddings"
  - افتح بـ: "بعد الدرس ده تطبيقك هيقدر يجاوب على أسئلة من بياناتك إنت — مش بس معلومات عامة"
  - المصطلحات التقنية تتأخر للنص الثاني
- تعديل خفيف لباقي دروس m9 (l25, l26 لو موجودين): opener فايدة-أولاً
- Re-render m9 lessons المعدّلة

### قواعد ثابتة (من غير تغيير)
- ❌ ممنوع `spawn_agent` أو Lovable AI Gateway
- ✅ كل توليد نص عبر `GEMINI_API_KEY` مباشرة (skill ai-gateway مع `--model google/gemini-3.5-flash`)
- ✅ كل تعديل → roadmap log + `bun run roadmap:log`
- ✅ Bunny re-render إجباري لأي درس اتعدل محتواه
- ✅ Batch lesson IDs ≤400 chars في `scripts/trigger-lesson.sh`

### الترتيب المقترح للتنفيذ
1. **Phase 5B أولاً** (الأسرع، تأثير framing فوري — 1 lesson rewrite + title)
2. **Phase 3B** (lesson جديد — أطول شوية)
3. **Phase 4 أخيراً** (lint pass شامل + إصلاحات يدوية)

### Deliverables
- 2 lessons جديدة/معدّلة (m5-l12b, m9-l24)
- 1 سكريبت lint
- 0-10 lessons معدّلة من نتيجة الـ lint
- curriculum-data.ts: عنوان m9
- Bunny renders للدروس المعدّلة
- roadmap log entries

**تأكيد:** أبدأ بالترتيب ده (5B → 3B → 4)؟ ولا تفضّل ترتيب تاني؟
