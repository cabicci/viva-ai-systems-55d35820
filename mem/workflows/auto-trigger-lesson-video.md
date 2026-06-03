---
name: Auto-trigger lesson video on content change
description: After ANY edit to a lesson file under src/components/intro/lessons/, immediately trigger the GitHub Action to rebuild the video with the new content
type: preference
---

# ⛔ FROZEN — Content-freeze mode (post-v12)

**Status (2026-06-03 → until v13 sim is green):**
كل توليد فيديو على Bunny و rendering عبر Remotion **متوقف**. السبب: تقرير v12 كشف إن المحتوى محتاج إعادة هيكلة كاملة (إعادة ترتيب المسارات + إعادة كتابة Builder m5+/Automator m3-4). أي rebuild دلوقتي = إهدار credits + فيديوهات هتتعمل تاني بعد أسابيع.

## القواعد خلال الـ freeze
- ❌ ممنوع تشغيل `bash scripts/trigger-lesson.sh` لأي سبب.
- ❌ ممنوع rebuild للـ 9 orphan videos.
- ❌ ممنوع `bunx remotion render` لأي درس.
- ✅ تعديلات على `src/components/intro/lessons/*.ts` مسموحة وبتُسجَّل في roadmap بدون trigger.
- ✅ rename للملفات/الـ GUIDs مسموح بس بدون re-render.

## شرط رفع الـ freeze
بعد ما `run_v13_full.py` يطلع completion ≥ 80% و Builder confusion < 3 → نشيل البانر ده ونعمل bulk trigger لكل الدروس المعدّلة.

---

# Auto-trigger lesson video build (مرجع تاريخي — معطّل دلوقتي)

**Rule (user-stated):** أي تغيير في محتوى درس = AI يبعت تلقائي لـ GitHub Action علشان يعيد توليد الفيديو بالمحتوى الجديد. مفيش انتظار لأمر يدوي.

## How (لما الـ freeze يترفع)

After editing ANY file under `src/components/intro/lessons/*.ts`, run:

```bash
bash scripts/trigger-lesson.sh "<lesson-id-1>,<lesson-id-2>,..." --force-script
```

- Lesson ID = filename without `.ts`.
- Batch all edited lessons in one comma-separated call (≤400 chars total).
- Always pass `--force-script` (cache bypass).
- The script needs `GH_PAT` env var.
