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

## Site-like interactive preview — 2026-10-05

The review entry now uses the actual shared Navbar, Footer, LanguageSelector, DashboardNavigation and CurriculumLayout. Review-only Vite aliases extend the line registry with Academic and provide a clearly labelled in-memory account persona. They cannot be imported by the production build and do not confer any real account or entitlement. Shared source files and live settings remain unchanged. The memory router keeps all navigation inside the isolated fixture; non-pilot pages explicitly report their scope.

`LessonPreview.tsx` contains the pilot lesson interface. `export-preview.py` embeds the built JS/CSS, existing brand images, local fonts and four reviewed PDFs into `review/Masaarat_Academic_Interactive_Preview.html`. Open that file in a browser: all interface assets/downloads are self-contained; Bunny playback needs internet. Build first with Vite. The single-file export is a review artifact and is not tracked or published. Its source stays in this branch.

`media-manifest.json` now records all four existing Bunny identities at status 4, verified read-only in run 37332447947. No rerender or reupload occurred. Actual listening remains pending. `shell-review.mjs` verifies the exported file in four locales at 390/1440 widths, eight lesson sections, one locale selector, three other-line choices, responsive menus, locale switching, embedded PDF downloads and correct non-autoplay Bunny URLs. No account/payment requests are made.

Known review-build warnings: five react-refresh export-shape warnings from fixture entry/provider files and one bundle-size warning because the self-contained review includes four locales and the shared shell in one bundle. These are not production performance acceptance.

## Course expansion review (2026-10-05)

The preview now exposes one course card, 40 lesson drafts, the seven-module curriculum, previous/next navigation, and initial price parity using the existing Pro Plus price catalogue (independent rights; assistant separate). The 39 new drafts reuse LessonView and contain one formative question each. They are NOT at the completed pilot's editorial depth; release review is open. Arabic conceptual text is shared formal Arabic, with contextual interaction prompts.

`course/author.py` contains original bilingual authored briefs; run it before `course/compile.py` to regenerate four contextual review datasets and the planning ledger. Both are deterministic local content packaging, not production migrations. Answer keys in this self-contained review must never be used as the paid production delivery architecture.

Reading diagrams now live in ReadingDiagram.tsx. Video diagrams and already-created videos are unchanged. A missing video cannot inherit the pilot's media; its tab is hidden. Non-video estimated workload is 2000 minutes; not verified learner time.

`course-review.mjs` checks all 40 lessons in each locale and the single-card hierarchy. `review.mjs` supports ACADEMIC_REVIEW_URL for file-based review when a development server is unavailable. Generated PDF output is not committed; source methodology lives in docs/academic.

## Expanded package pipeline — supersedes brief-only depth above

`course/expanded/` contains the full review packages as locale sets are completed. `packages.ts` prefers these over historical concise briefs. Full packages contain six explanation sections, worked steps, six four-option questions, applied tasks/rubrics, three reading visuals, FAQs and summaries. Structural, numeric and browser checks are evidence, not independent academic approval. The final `docs/academic/EXPANSION_VALIDATION.json` and course browser report determine which locale sets passed; do not infer completeness from this README.

Print workbooks now include all formative questions and all three reading visuals, with actual PDF page numbering. Their page count varies with contextual text. Earlier fixed nine-page statements describe only the prior pilot export. The standalone preview intentionally includes review answers and all available locales; it is not a production content-security or bundle-performance design.

The new production candidate in `src/components/academic-education/` reuses the shared shell and server authorization. It is distinct from the offline review fixture and awaits central route registration. The sibling logo candidate is available as a new `public/brand/masaarat-academic.png`; existing brand/media assets are untouched.

## Complete written review delivery

All four `course/expanded/{locale}.json` arrays are now complete, with 39 additional packages each plus the existing pilot. `docs/academic/EXPANSION_VALIDATION.json`, `LOCAL_COMPLETION_RECEIPT.json` and the final course browser/PDF reports replace historical partial counts above. Temporary recovery arrays have been removed. The 40-lesson curriculum is the same course across four contextual locales, not 160 separate course lessons. Editorial acceptance, learner timing and central activation remain separate gates.
