# Furniture lesson pilot — temporary branch

Branch: `experiment/furniture-pilot-20261003`. Route: `/experiments/furniture-pilot?locale=ar-EG` (also `ar-MSA`, `ar-Gulf`, `en`). Lesson: M1 — from a cabinet drawing to a cut list, ID `furniture-m1-cut-list`.

This is an original planning exercise inspired by the owner-supplied Metwood PDF (planning p3, furniture details p25, materials p97). It does not copy or validate the reference's dimensions. All source-drawing dimensions below are authored for this pilot.

## Construction brief

Open-front cabinet: W600 × H600 × D300 mm. Two full-height sides, top/bottom/middle shelf fitted between them, overlay back included in overall depth. Nominal body thickness18 mm, back6 mm. No doors, legs, grooves, rebates, hardware, machining allowances or approved load/fixing specification. Side panels600 ×294 ×18; top/bottom/shelf564 ×294 ×18; back600 ×600 ×6. Six pieces. Two equal clear openings273 mm.

The new practice task changes W/H/D to800/700/350 mm: internal width764, body depth344, opening323. Automated grading covers arithmetic only. A person must review the drawing, cut list, assumptions, construction and workshop allowances before fabrication. Machine competence is outside the scope ([HSE](https://www.hse.gov.uk/woodworking/training.htm)).

## Implemented scope

- Four locale views using the existing Masaarat shell, palette and typography.
- Goals, prerequisites, six explanation sections, three dimensioned SVGs per locale, live panel calculator, four-question quiz, arithmetic practice, review rubric and dated supplier-cost worksheet.
- Seven-page PDF and machine-readable JSON cut list per locale.
- Fixed lesson FAQ explicitly labelled as reference answers, with no generative-AI claim.
- Session progress separated into reading, knowledge and arithmetic; reload clears it. No account data, answer uploads, database writes, catalogue changes or entitlements added.

Rebuild assets from repository root: `bun scripts/furniture-pilot/generate-assets.ts` (installed Playwright Chromium required). Assets are original vector drawings, not generated photographs.

## Photorealistic practical video production brief — NOT GENERATED

The owner requested lifelike AI video, not an animated drawing. The owner confirmed Higgsfield as the intended provider. Its plugin is available but not installed/connected at the last confirmed check. Select the underlying model from the connected account catalog, check credits/cost and generate a short continuity sample before the remaining shots. No new subscription, credit spend, rendering job, external reference upload or production publishing has occurred.

Target: 60–90-second practical planning demonstration in a realistic workshop, assembled from short independently reviewed shots. Keep one instructor, one cabinet, identical neutral lighting/material and six panel IDs throughout. Deliver16:9 landscape1080p if the selected model supports it, plus Arabic voiceover, Arabic captions, transcript and a reviewed master. Do not generate written measurements inside footage: composite verified dimensions and labels in postproduction. The first generation must be a short continuity sample; only accepted samples proceed to the rest.

| Shot | Action and reference                                                                                                                                  | Egyptian Arabic voiceover                                                                                               | Acceptance check                                                                                   |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1    | Slow view of the finished open-front cabinet on a bench. Two equally sized openings. No door/feet.                                                    | «قبل ما نبدأ التصنيع، هنحوّل الرسم لقائمة قطع واضحة. نموذجنا عرضه وارتفاعه ستين سنتيمتر، وعمقه تلاتين.»                 | Exactly two openings and correct construction; proportions W:H:D=2:2:1.                            |
| 2    | Instructor points at the two full-height sides; overlay A1/A2 in post. Reference front.svg/side.svg.                                                  | «الجانبين كاملين في الارتفاع. السقف والقاع والرف في النص راكبين بين الجانبين.»                                          | No top overhang, no panel merging, consistent thickness.                                           |
| 3    | Caliper checks a sample body panel; then ruler points across the internal span. No unreadable generated numerals.                                     | «سمك كل جنب تمنتاشر ملّي. نطرح السمكين من العرض الخارجي: ستمية ناقص ستة وتلاتين، يساوي خمسمية أربعة وستين.»             | Plausible hands/tool contact; verified564 overlay and 600−2×18 formula.                            |
| 4    | Side-on demonstration of the separate overlay back using precut samples.                                                                              | «العمق النهائي تلتمية ملّي، وشامل ظهر خارجي ستة ملّي. يبقى عمق الهيكل تلتمية ناقص ستة، يساوي ميتين أربعة وتسعين.»       | Back overlays rear; does not slide into a groove. Verified300−6 overlay added in post.             |
| 5    | Bench layout of six precut, numbered panels, then instructor matches each to a printed list.                                                          | «عندنا ست قطع: جانبين، سقف، قاع، رف، وظهر. أرقام القطع لازم تتطابق في الرسم والقائمة.»                                  | Six pieces exactly, no duplicates or vanishing panels; IDs applied in post.                        |
| 6    | Dry positioning against the reference drawing, checklist beside the cabinet. No drilling/sawing and no unsupported claims of final assembly strength. | «نراجع الوحدة والكمية والسمك وطريقة الظهر. قبل التنفيذ الفعلي، المختص يعتمد السماحات والخامة والوصلات والتثبيت والحمل.» | Clear distinction between planning demonstration and approved fabrication; no operating machinery. |

Global prompt: photorealistic documentary workshop, calm static closeups, adult instructor measuring and identifying precut panels only, natural tool contact, no time-lapse construction, no panel morphing, no extra fingers, no floating tools, no readable generated text, no cutting machinery. References should be created for this original cabinet; do not upload the entire supplied408-page PDF. Technical review must reject visual errors even when the footage looks realistic.

## Remaining gates

Realistic video generation/continuity review, Arabic voice/caption QA, and connected lesson-grounded AI assistant remain unimplemented. The fixed FAQ is not that assistant. Human portfolio assessment is not implemented. Local source validation and branch push will be recorded below; CI, merge, deployment, payment and production acceptance are separate and not requested by this experiment.

## Local validation — 2026-10-03

Base main commit: `68928fa902730926ed7e8a1c5851d46c593003c9`. The candidate passed22 focused tests (geometry, impossible inputs, independent knowledge/practice state, four locale rendering and RTL arithmetic isolation), TypeScript, scoped ESLint, Prettier and production build. The build preserved the existing400 contextual assets/100 lessons/4 locales and passed the roadmap guard. Existing build deprecation/chunk warnings are not claimed resolved.

Local Chromium checks returned200 for the experiment in all four locales, with correct title/direction, noindex metadata, three loaded drawings and three working download links per locale. Desktop1440 and mobile390 layouts had no document overflow or page errors. External browser requests were blocked during the local check; this is not live account, analytics, provider, production-font or deployment acceptance. Local test consent was declined. All four PDFs have7 pages; rendered Arabic/English content and diagram pages were visually reviewed, including LTR mathematical spans within Arabic text.

No PR, CI run, main merge or production publication was requested. Remaining video, connected generative guide and human-assessment gates above remain open.
