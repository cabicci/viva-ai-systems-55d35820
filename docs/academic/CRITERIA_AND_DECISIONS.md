# Masaarat Academic — reusable curriculum criteria and decision register
Date: 2026-10-05
Status: planning only. Owner-authorized isolated branch work; curriculum agreement precedes pilot production; pilot acceptance precedes scale-up.
Repository: cabicci/viva-ai-systems-55d35820
Branch: work/masaarat-academic-20261005
Baseline: 062b5f59dc56fabbce89c2034008fa1d8ef21114

## Verified current-state inputs
- Recovery plan: Masaarat_Current_State_and_Recovery_Plan_2026-09-16.md, version 143, modified 2026-10-05T13:05:27Z. Read the latest leading TECH-INTEGRATION-01 / ADMIN-LESSON-ACCESS-01 entry.
- Continuation register: MASAARAT_CONTINUATION_REGISTER_2026-09-15.xlsx, version 73, modified 2026-10-05T13:05:27Z. Read current commerce/learning-lines row 22, rendered line 233.
- Both registers record PR151–154 integrated, technical/admin changes published, technical videos remaining on Bunny, PDFs in private technical-downloads storage. These supersede older pending technical integration entries.
- GitHub main independently confirmed at 062b5f59, PR154 merge. Production verification is attributed to the registers; no new production test was performed in this task.
- No AGENTS.md appeared anywhere in the complete recursive baseline tree; root fetch returned 404.
- docs/CURRENT_STATUS.md has older October 3 entries; do not elevate them over the newer registers/main.
- Existing docs/rag/ARCHITECTURE.md contains historical corpus counts and an old freeze SHA. Reuse architectural concepts only; re-inspect current runtime before implementation and never import historical counts as current requirements.
- Central integration owns the two global registers. This branch-local register is specific to reusable academic content criteria, not a replacement global project-status register. Global register updates remain with the central integration handoff.

## Owner-confirmed requirements
| ID | Requirement | Acceptance evidence needed |
| --- | --- | --- |
| AC-01 | New learning line: مسارات أكاديمي | Approved line identity and copy |
| AC-02 | Curriculum based on supplied video and headings; academic depth | Outcomes, source mapping, original authored lessons and review |
| AC-03 | 30 total learning hours, including video, reading, practice, assessment | Per-lesson workload ledger; pilot timing, no double counting |
| AC-04 | Curriculum first, then one pilot, then owner acceptance before scaling | Explicit scope and pilot decisions |
| AC-05 | Existing Masaarat identity, components, typography, navigation, intro/curriculum/lesson experience; AI pedagogy and technical presentation | Component reuse map and four-locale responsive visual checks |
| AC-06 | One shared account and independent subscriptions; preserve existing entitlement rules | Server-side permission matrix and revocation tests |
| AC-07 | Academic assistant is separately purchased inside Academic, not bundled automatically | Independent add-on entitlement; academic learning usable without it |
| AC-08 | Four contextual locales ar-EG, ar-MSA, ar-Gulf, en | Aligned outcomes, local examples, RTL/LTR, pronunciation and numeric checks |
| AC-09 | Videos on Bunny; do not move or modify existing media | Dedicated new-media manifest, locale/video IDs, checksums and playback proof when authorized |
| AC-10 | New logo in approved Masaarat logo family | Preserve master mark/colors/composition; section label on visual right; final English label pending approval |
| AC-11 | Administrator lesson access | Stored server-side admin role, existing active/confirmed account checks and content release controls; no client-only bypass |
| AC-12 | Switcher shows other available lines only | Excludes active line, desktop/mobile, keeps selected locale and account |
| AC-13 | Reuse payments/receipts/emails/coupons/invitations | Existing paths preserved; idempotent mail and entitlement grants; no duplicated commerce stack |
| AC-14 | Isolated branch until separate merge decision; no publication/config changes | Scoped diff and English central integration handoff |

## Proposed reusable lesson quality contract (not yet owner-approved)
1. Assign stable line/course/module/lesson IDs, locale, content version, source references and checksum.
2. Define observable learning outcomes and link each to explanation, example, learner output and assessment.
3. Include a prerequisite statement, realistic opening problem, academic explanation, glossary, worked example, application with rubric, quiz with feedback, summary, FAQ, references and downloadable PDF.
4. Give each illustration a teaching purpose, alt text and source/rights record. Avoid decorative repetition and unrelated imagery.
5. Maintain a workload ledger by activity. Optional assistant conversations do not supply mandatory hours or required answers.
6. Use a cumulative project to demonstrate transfer of knowledge. Clearly label hypothetical examples; verify factual and numerical claims.
7. Cite original authoritative/academic sources by section. Do not present the advertising video as academic substantiation.
8. Localize examples and speech contextually, preserving outcomes and correct calculations. Keep one platform language selector. Review Arabic consonants and technical terms by locale.
9. Reuse player behavior including no autoplay. Keep shared header and consistent back/previous/next navigation. Keep server authorization checks without introducing visible redundant consent/login prompts.
10. Generate PDFs from approved locale content, with meaningful type-plus-lesson filenames; proposed storage is a dedicated private academic location following the technical signed-download pattern, subject to central integration. No assumption that PDFs go to Bunny.
11. Track content review, visual review, audio acceptance, media upload and live release as distinct states. Never call a generated asset uploaded or released without evidence.
12. Pilot all four contextual versions of the same lesson; check smartphone/desktop, keyboard, RTL/LTR, text contrast, print/PDF, captions, playback and practical task clarity before scaling.

## Future RAG boundary — design requirements only
- Separate academic line/course corpus identity from AI, Kids and technical. Never copy the AI corpus and treat it as academic knowledge.
- Server verifies authentication, independent assistant add-on, applicable academic content access and course/locale/release/version before retrieval and model use.
- Whether active academic subscription is required for assistant use remains an owner decision. Until specified, no permissive fallback or implementation.
- Retrieval and cache identity must bind user/access scope, line, course, locale and content version. Do not leak cross-line paid content through answers or citations.
- Answers cite authorized academic lesson/section sources and admit insufficient evidence. User prompts and retrieved documents cannot change entitlement decisions.
- Exclude assessment answer keys, hidden rubrics, private learner submissions and internal notes from the general corpus.
- Preserve current AI assistant access rules. Administrator access to lessons does not silently imply unlimited paid assistant calls.
- Do not index, embed, reindex or call paid generation services during this planning slice.

## Reuse map inspected at the baseline
| Surface | Existing evidence | Integration implication |
| --- | --- | --- |
| Line registry/routes/logos/copy | src/lib/learning-lines.ts | Extend existing typed registry after scope approval; no parallel registry |
| Shared navigation | src/components/site/Navbar.tsx | Existing LEARNING_LINES.filter(item => item !== line); preserve rule, add academic only when available |
| Introductory page | src/components/site/LineOverview.tsx | Existing AI-derived section order and platform pastel/token styling |
| Curriculum layout | src/components/site/LineCurriculum.tsx and its CurriculumLayout imports | Reuse layout and lesson/module hierarchy |
| Lesson page | src/routes/technical.learn.$lessonId.tsx | Existing auth, locale, shared header/footer, server delivery, learner navigation |
| Lesson renderer | TechnicalLessonView imported from src/components/technical-education/TechnicalJourney | Inspect renderer in pilot implementation; do not build a competing UI system |
| Commerce and permissions | docs/technical-education-integration.md and current register | Separate package/add-on through existing commerce only; prices not inherited from technical |
| RAG | docs/rag/ARCHITECTURE.md | Locale/source/citation concepts useful; historical data not current runtime proof |

## Decisions still open
- Course name, target audience and prerequisites; 30-lesson proposal and detailed assessment structure.
- Academic catalogue billing scope (line vs course), price, period, free preview policy and add-on pricing/usage limits.
- Add-on dependency on a current academic subscription; expiry, cancellation and refund interactions.
- Certificate/completion wording and assessment threshold; no official university credit or accreditation implied.
- Final English logo label (ACADEMIC/ACADEMY not automatically selected).
- Final media production durations/voices after pilot and PDF namespace agreement.

## Stage log
2026-10-05: reviewed latest register entries, repository baseline, attached image and video frames. Created isolated branch and planning documents. Source audio transcription unverified. No application code, migrations, dependencies, media, billing/configuration or existing files changed. Curriculum proposal ready for owner review; pilot not produced.
