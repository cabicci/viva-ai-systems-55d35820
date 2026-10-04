# Positions 71–80: M19, M20 and M21

This scoped checkpoint adds M19-L01–L03, M20-L01–L04 and M21-L01–L03 to base `1595cfd9`. The coordinator owns aggregate registers, integrated build, media production and publication. Only these ten lessons and their assets/evidence changed.

## Deliverables

- 40 independently contextualized packages: Egyptian Arabic, Modern Standard Arabic, Gulf Arabic and English. Each includes three explanatory sections, a worked case and decision, an explained quiz, a practical assignment with three fields and criteria, and a contextual FAQ.
- 30 distinct concept diagrams and 120 localized SVG exports using the unchanged renderer and palette.
- 80 PDFs: 40 three-page workbooks and 40 one-page worksheets, totaling 160 rendered pages.
- 40 six-scene video-text files. Arabic display arithmetic uses directional isolates and nonbreaking spaces; spoken text strips both. No audio/video was generated in this workstream.

All 324 baseline PDF files retain their SHA-256 hashes. All previous diagram and PDF-revision entries are unchanged; only the owned 30 and 80 keys were added. See `m19-m21-evidence/preservation.json` and the baseline/current asset hashes.

## Teaching and sources

`m19-m21-evidence/source-anchors.json` records source identity, scoped pages, supplemental primary sources and original cases. All 55 scoped source pages were rendered and visually inspected. These pages supply conceptual anchors; learner text and diagrams are original. Source furniture measurements and old reference charts are not adopted as universal requirements.

M19 includes substantive supplemental commercial cases. A 12-room hotel needs 24 bedside units including reference units; an inaccessible replacement front prevents batch release. Moving one restaurant table changes guest/staff route conflicts despite keeping 24 chairs. Reception decisions connect visitor/staff tasks, occupied routes, screen sightlines and rear cable access. U.S. Access Board primary materials inform distinctions between surface height, task and approach; they are not represented as globally applicable law and no numeric code values are imported. Manufacturer care documents support linking cleaning to the actual product and finish, not a universal treatment.

M20 links a bespoke brief to alternatives, a curved-drawer interference mock-up, named sections and mirrored parts. The material-stack example uses one explicitly defined 40 mm assembly-depth axis: 40 − 18 − 6 − 2 = 14 mm remaining. This is a geometric exercise, not an approved installation allowance. Open/closed projections of 950/350 mm give 600 mm additional projection, excluding the user envelope and simultaneous storage access.

M21 integrates earlier foundations through one continuing reception and storage project. The two units C-A/C-B start with three shelves each; changing to four changes the count from six to eight, adding two. Drawings, schedules, support references and specifications must agree. A final register retains two open issues after three of five close. Survey-dependent release, actual performance, specialist review and human final approval remain distinct from arithmetic or quiz success.

Arabic, Gulf, MSA and English versions preserve these decisions and numeric facts while adapting phrasing. Parent content review covered all ten Egyptian drafts; requested Arabic digit spacing, arithmetic isolation and the same-axis M20-L03 wording were applied before final export.

## Verification and corrections

- The existing targeted Vitest suite passed 17 tests across three files; TypeScript `--noEmit` passed. Structural validation passed locally with 50 authored lessons (40 baseline plus these 10); the other workstreams are absent from this worktree, so this is not an aggregate 80-lesson claim.
- All 120 SVG exports passed browser text bounds checks against the 400 × 270 viewBox. Arabic and English concept contact sheets were visually reviewed. Fixed the mixed-material depth proportions/axis, made the handle collision visible, kept the before/after drawer the same size, and corrected seated table/counter interfaces. Final changed drawings were re-exported and visually rechecked.
- All 160 PDF pages were rasterized and reviewed through four-locale contact sheets. Final Arabic material-stack and shelf-change pages were also inspected individually for math direction, captions and legibility.
- Browser gates passed 80 lesson/locale/width visits (10 × 4 × 390/1440). Each reading view has three distinct diagrams and valid matching zoom SVGs, one header language selector, no extra selector, two real PDF downloads, no horizontal overflow/page errors, and truthful pending-video copy.
- The four lessons affected by geometry corrections then passed 16 additional Egyptian/English desktop/mobile visits. Browser screenshots/contact sheets were refreshed. Evidence includes the initial complete matrix and final geometry matrix.

PDF/SVG export command, from this worktree:

```sh
TECHNICAL_CHROME_PATH=/tmp/technical-chrome/chromium /tmp/technical-tools/node_modules/.bin/bun scripts/technical-education/build-pdfs.tsx
```

Reusable scoped authoring/QA scripts are in `checkpoint-tools/m19-m21/`. The coordinator runs the integrated production build; no runtime, renderer, media manifest or Site deployment was changed here.

## Audio acceptance

Pronunciation remains pending actual listening independently for Egyptian Arabic, MSA, Gulf Arabic and English. Text readiness, rendering success and file creation do not constitute listener approval. No global qaf replacement or other blanket pronunciation substitution was introduced.
