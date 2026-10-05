# Academic pilot — isolated review environment

One original Masaarat business-foundations lesson in four contextual locales. This folder is outside production routes and is not imported by the application. It reuses the platform CSS/font assets and Button/Progress primitives, and the technical lesson's sidebar/section presentation. It has no authentication, database writes, billing, account persistence or connected assistant. Do not deploy it as a paid runtime.

Run from the repository root:

```sh
python3 experiments/academic/validate.py
npx tsc -p experiments/academic/tsconfig.json
npx vite --config experiments/academic/vite.config.ts
```

Open localhost:4178 with ?locale=ar-EG, ar-MSA, ar-Gulf or en. The single header selector resets session-only quiz/practice state to prevent locale leakage. The print view creates an original Masaarat workbook without external references. Formative answers are intentionally local to this offline review fixture; production must separate grading and private answer keys on the server. This fixture is excluded from RAG and production delivery.

## Media

The dedicated workflow is limited to this branch and the explicit production-request file. It renders only the first pilot in four locales using the existing Gemini voices and pinned Remotion project. The updated TTS helper is vendored from repository commit 87728437970170a0cb28bda536fddcaf6c1340ee because main's legacy helper does not support the necessary per-call Egyptian policy. Existing helpers and voice policies remain untouched. The vendored copy removes the legacy content-softening fallback for every locale: rejected narration stops for editorial review. The academic policy keeps all written words intact; contextual pronunciation instructions never apply universal letter substitutions. Cache identity binds source text, policy, voice and model. Full output directories bind source/render fingerprints for all locales.

The uploader reuses transport functions from the existing Bunny uploader, but deliberately does not call its registry update or delete functions. It creates only a new academic pilot identity or reuses an exact title/fingerprint already uploaded. Failed or ambiguous previous deliveries stop safely for review. Receipts are GitHub Actions artifacts; successful delivery is not speech acceptance. Existing media remain untouched. Final review requires real listening, with word/context/timestamp notes; no prompt or text test can establish naturalness.

## Integration

No shared navigation or commerce change is made here. Central integration must add the new line and optional independent assistant add-on after the pilot and commercial scope are agreed. The current logo is the existing master mark beside a text label; a new sibling logo candidate is in assets/ and awaits acceptance. PDFs are review outputs, not uploaded to production storage.

## Review evidence — 2026-10-05

`review.mjs` exercised four locales, desktop and mobile widths, and eight lesson sections: 64 visits, no page errors or horizontal overflow. It also checks six reading sections, all quiz controls and score feedback. Four nine-page workbooks were exported and visually reviewed; generated PDFs are review deliverables, not production downloads or tracked source assets. Browser evidence is in `review/browser-checks.json`.

To regenerate using an installed Playwright Chromium, start Vite as above, then run `node experiments/academic/review.mjs`. Set `ACADEMIC_CHROME` only when a custom Chromium executable is necessary. The script requires a running localhost:4178 server.
