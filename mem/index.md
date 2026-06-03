# Project Memory

## Core
🚫 **ABSOLUTE BAN (user repeated 10+ times)**: NEVER use `spawn_agent` / `acp_subagent--spawn_agent` AND NEVER use Lovable AI Gateway (chat/completions, embeddings, image gen via gateway). Both burn credits. Do ALL research/edits directly with parallel tool calls. For any AI generation use user's own GEMINI_API_KEY / OPENROUTER_API_KEY only. Violating = serious failure.
Path lineup: Builder, Creator, Automator, Analyst, Business — all 5 complete & published. Never label as "coming soon".
Path integration / visual journey map deferred until further notice.
Lesson IDs follow {path}-{module}-{slug} (e.g. `automator-m1-systems-view`). The id itself encodes path + module + order within the path — do NOT invent a global lesson number like "الدرس 22".
Roadmap items: NEVER delete any roadmap_items row. Update status/notes only — no DELETE under any circumstance.
Roadmap auto-tracking: ANY new suggestion (mine or user's) → insert into roadmap_items as `todo` immediately, even if not executed yet. If executed in same turn → mark `done` with completed_at=now() and notes summarizing result. If deferred → leave as `todo` for later. Never lose a suggestion.
Multi-batch work (Batch 1/2/3, multi-part renders/dispatches): EACH batch gets its OWN roadmap_items row the moment it's planned — even if pending. Never lump pending batches inside another batch's notes.
ENFORCEMENT: Before ending ANY turn that produced code edits, migrations, file changes, or executed scripts → run a roadmap check. If the work isn't already logged, INSERT it now in the same turn — do NOT wait for the user to ask. The user asking "كل حاجة اتسجلت؟" or "سجلت؟" means I already failed. Apologizing without changing behavior = repeat failure.
Lesson references (MANDATORY format): `<path> · M<module> · درس <order-in-path> (<lesson-id>)` — e.g. `Intro · M0 · درس 2 (intro-what-is-ai)`. NEVER use "L1/L2/L3" — it's ambiguous and caused confusion before.
Per-lesson approval workflow (OVERRIDES auto-trigger rule): For content revision work, edit lesson → show user the changes → WAIT for explicit approval → only then trigger GitHub render via scripts/trigger-lesson.sh. No render before approval. The old auto-trigger-lesson-video rule is suspended during the v2 content revision project.
Content v2 rebuild (Intro first, then path-by-path): Scope L1-L30 only. Rules: Tension-First (مفيش مفهوم نظري قبل ما المستخدم يحس بمشكلة) → Quick Win → مثال حسي قبل المصطلح → مصطلح تقني واحد لكل درس → Mission ≤10 دقايق وأبسط من الحالي. Metrics: boring/confusing/momentum(1-10). Target: 65-75% completion (مش 90%).
Lesson ID naming (NEW): `<path>-m<module#>-l<lesson#>-<slug>` e.g. `intro-m1-l1-what-is-ai`. الرقم بقى صريح في الـ id. الاسم القديم بدون رقم درس مهجور.
AI generation policy (v2 rebuild): استخدم GEMINI_API_KEY بتاع المستخدم مباشرة — مش Lovable AI Gateway. توفيراً للـ API credits.
Roadmap logging — FAST MODE (per-lesson work): During content revision, skip per-lesson SQL note updates. Run only `bun run roadmap:log -- --title "<lesson-id>" --summary "<one-line>" --source ai|user` (≤10s). Full notes + parent rollup happen ONCE at end of each path (Intro/Builder/etc) — not per lesson. Non-lesson edits still follow the full rule above.
Lesson edit = full rebuild with new name from the start: أي تعديل على محتوى درس = rename كامل (ملف + صور + Bunny GUID + DB + كل references) بالاسم الجديد `{path}-m{module}-l{lesson}-{slug}` من أول مرة. والصورة كمان تتولّد من جديد لو المحتوى اتغيّر وبقت مش معبّرة. ممنوع نسيب أي جزء للتعديل بعدين.

## Memories
- [Egyptian Arabic prompt rules](mem://design/egyptian-arabic-prompt-rules) — Full phonetic/grammar/vocab rules + words-to-avoid list + prompt structure for Veo/TTS
- [Batch roadmap logging](mem://rules/batch-roadmap-logging) — Every batch/run is its own roadmap_items row, logged when planned not when started
- [Auto-trigger lesson video](mem://workflows/auto-trigger-lesson-video) — SUSPENDED during v2 content revision. Default flow now: edit → approval → render
- [Lesson naming + approval workflow](mem://rules/lesson-naming-and-approval) — Mandatory lesson reference format + edit→approve→render flow
- [Content revision plan v2](mem://design/content-revision-plan-v2) — Full v2 doc: Tension-First + Momentum + L1-L30 scope + per-lesson workflow
- [Builder reframing glossary](mem://design/builder-reframing-glossary) — Binding analogy dictionary for m5–m8 (Frontend→واجهة، Backend→مخ، JWT→إسورة، RLS→حارس) + 3-phase mental anchors + forbidden terms. Apply to every Builder m5–m8 edit.
