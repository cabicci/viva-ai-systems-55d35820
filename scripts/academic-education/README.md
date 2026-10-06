# Academic production and integration

## Full-course video preparation (2026-10-06)

Run `python scripts/academic-education/media_plan.py` to prepare the 156 additional lesson/locale narration plans under `tmp/academic-course-media/plans`. The manifest binds exact lesson, locale and source checksums. It does not include the four existing pilot videos and cannot call TTS, upload or deploy. Authored visual directions remain review inputs; no claim of completed animated scenes is made. `media_plan_test.py` covers exact coverage, assessment exclusion, lossless numeric text, source changes and no pilot/locale fallback.

Full-course media production remains subject to the actual listening acceptance recorded in `docs/academic/AUDIO_REVIEW.md`. Prepared plans are not videos. The existing pilot-only workflow/request must not be widened implicitly or used to overwrite pilot identities. Review changes to pronunciation against real audio before scaling; keep source wording separate from provider-only pronunciation instructions.

`expand_lessons.py` performs bounded original lesson expansion from committed authored briefs using the existing Gemini credential. Outputs are review-only, never imported or published automatically. The request caps 39 lessons × four locales × two attempts. The pilot is not regenerated. A refusal does not trigger safety-evasion rewriting. Secret values and provider bodies are not logged.

`integration-candidate.sql` is deliberately outside `supabase/migrations`. It is a central-integration review candidate, not an applied migration. It reuses stored account/admin identity and existing commerce entitlement records. It creates inactive course/content, private downloads and server-graded quiz/progress delivery. Academic and assistant rights are independent. Missing video is nullable. Practice submission is not represented as academic grading.

Central dependencies before activation: extend existing commerce package constraints/catalogue and all existing checkout/manual-payment/receipt/mail/coupon/invitation paths for `academic`; do not replace them. Academic uses Pro Plus prices, not rights. `academic_assistant` needs its own approved price/quota and provider gateway; it remains disabled. Add private bucket/import, existing deletion inventory registration, Stripe TEST routing, shared line registration and route integration. Do not enable the course until all 160 packages and required PDFs are editorially accepted and imported. Generated review JSON is not production payload approval.

## Local review and delivery

The durable authored content is `experiments/academic/course/expanded/{locale}.json`. Generation artifacts expire after 14 days; `repair_truncated_drafts.py` documents local recovery from retained drafts and requires those original artifacts if replayed. Do not regenerate already accepted outputs merely because temporary artifacts expired.

For a new bounded production request: normalize only the new artifact directory, apply the exact editorial corrections, then assemble once all 39 additional packages per locale are present:

```sh
python scripts/academic-education/normalize_packages.py INPUT tmp/normalized
python scripts/academic-education/apply_editorial.py tmp/normalized
python scripts/academic-education/assemble.py tmp/normalized
python -m unittest discover -s scripts/academic-education -p '*_test.py'
npx vitest run src/lib/academic-education/integration.test.ts src/components/academic-education/AcademicLessonPage.test.tsx
npx tsc --noEmit
npx tsc -p experiments/academic/tsconfig.json
npx vite build --config experiments/academic/vite.config.ts
python experiments/academic/export-preview.py
ACADEMIC_EXPORT_PDFS=1 node experiments/academic/course-review.mjs
python scripts/academic-education/build_rag_corpus.py
python scripts/academic-education/prepare_delivery.py
```

Set `ACADEMIC_CHROME` and runtime library paths only when required by the installed browser. Course review runs on the exported file. `ACADEMIC_LOCALES` supports bounded local batches; a one-locale report is not four-locale acceptance. Refresh the HTML after generating pilot PDFs so embedded downloads match the final files. Exported content and PDFs are review artifacts; private import remains inactive until central approval.

`commerce-candidate.sql` adds guarded reuse of installed commerce functions/constraints. `integration-candidate.sql` includes LC09 inventory/cleanup integration. These additions supersede earlier README wording that described those candidate implementations as wholly absent. Live integration, TEST checkout/mail journeys and central review remain outstanding.
