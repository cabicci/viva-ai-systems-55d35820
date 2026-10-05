# Masaarat Academic — reusable curriculum criteria and decision register
Date: 2026-10-05
Status: isolated pilot production authorized by owner on 2026-10-05; full-course scale-up still follows pilot acceptance.
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

## Owner refinement — 2026-10-05: academic grounding and Egyptian pronunciation
This requirement supersedes any interpretation of "original authored" as unsupported invention.

### Academic grounding gate
- Before writing full lessons, identify a specific published university curriculum/syllabus or internationally recognized academic framework appropriate to this course. Verify its issuing institution, level, learning outcomes, coverage and authoritative URL. Verify any accreditation claim separately; do not infer it from a textbook publisher or institutional reputation.
- Present the selected curriculum basis and a mapping from its outcomes/topics to the seven modules and proposed lessons. The present OpenStax bibliography is an initial source list, not proof that a specific accredited curriculum has been selected or that Masaarat is accredited.
- Build explanations and assessments from verified academic references. Record edition/date and chapter/section or page for each lesson; distinguish supported concepts, contextual adaptations and clearly labelled hypothetical examples.
- Original wording, local cases and visuals are allowed; invented theories, unsupported claims, fabricated references or unverified accreditation are not.
- The 30-hour outline remains provisional until this alignment check; revise its coverage and sequence if the selected academic basis requires it. Do not force a source to fit the current lesson count.
- The owner said "ماشي" to proceeding, with these binding quality conditions. This does not resolve unpriced packages, certificates or other unspecified commercial decisions.

### Egyptian Arabic audio gate
- Treat ar-EG pronunciation as word- and context-dependent. Do not apply universal letter substitutions (including ق/ج/ث/ذ/ظ) across all words, technical terms, names or quoted formal language.
- Maintain a reusable pronunciation lexicon: written word, intended meaning/context, desired Egyptian spoken form, disambiguating vocalization or provider-supported phonetic hint, and accepted audio reference when available.
- Keep learner-facing spelling separate from TTS-only pronunciation hints. Preserve academic terminology and natural Egyptian explanation; avoid accidental switching to MSA or Gulf pronunciation.
- Check ambiguous unvowelled words, stress, consonants, numbers, abbreviations, foreign names, technical terms, pauses and sentence meaning in the rendered audio.
- Produce a short pronunciation sample before the full pilot narration. Listen to actual rendered audio, then the complete pilot. Text review, successful generation or automated transcript matching alone do not establish pronunciation acceptance.
- Log errors by timestamp/word/context and regenerate only affected segments, then check joins and synchronization. Do not scale production before the owner's pilot audio acceptance.
- No audio has been generated or marked accepted by this update.

## Owner decision — brand-only learner content and continuation
The owner confirmed that all learner-facing lessons, videos and PDFs must be original Masaarat production without external source lists or source-brand references. Academic mapping and verification remain internal editorial records, outside the learner bundle and RAG corpus. Do not copy material whose mandatory attribution would be removed. No accreditation claim is authorized.
The owner's latest instruction authorizes continuing through the first pilot without repeated interim questions. Four contextual pilot packages and an isolated review UI are being prepared. Price, add-on limits and production merge remain outside this slice. Earlier requirements to display references in learner lessons/PDFs are superseded; internal references remain mandatory.

## Pilot evidence — 2026-10-05
- Internal academic mapping now records verified MIT syllabi and concept checks, without any claim of Masaarat accreditation or transferable university credit. The learner files contain original Masaarat wording/cases and no external source list.
- Authored AC-BUS-M01-L01 in all four locales; built an isolated review UI reusing platform typography/tokens and shared primitives. No production route, shared navigation, account or commerce implementation changed.
- Offline workload/content/numeric checks, isolated TypeScript/Vite build, 64 browser section visits and four nine-page PDF exports passed. PDF pages were visually reviewed. These checks do not validate academic credit or actual student completion time.
- New ACADEMIC logo candidate generated as a sibling asset; master and existing line assets unchanged. Candidate label/fidelity still needs acceptance.
- Media workflow run 37322389925 produces only this pilot's four locale variants. Full pilot drafts were queued before a separately accepted pronunciation sample; they remain provisional. This is a recorded deviation from the earlier sample-first editorial sequence, not evidence that the pronunciation gate passed. Real listening and timestamped corrections are mandatory before acceptance or scaling.
- All prices, subscription periods, assistant quota/dependency, certificate terms and shared integration remain open. The instruction to continue does not invent those commercial values.

## Latest delivery state — AC-PILOT-01 / AC-MEDIA-01
Only AC-BUS-M01-L01 is fully authored. The other 29 lessons are outlines; no complete 30-lesson content claim is authorized. The 30-hour total is a curriculum planning target, not measured study time or academic-credit equivalence.

Actual Egyptian and MSA pilot files passed render/stream/checksum checks and sampled visual frame review. Their measured durations are 310.308 and 342.228 seconds. Bunny accepted new identities, but both initial readiness checks and read-only follow-up 37324850367 observed processing status 2. They are not marked playable. Original media were neither replaced nor deleted. Playback readiness remains AC-MEDIA-01, independent of pending owner audio acceptance.

The hardened isolated TTS helper now stops for editorial review on provider content rejection for every locale; no automatic source-word replacement fallback remains. This revision does not retroactively change the provenance of already rendered pilot files. See AUDIO_REVIEW.md and review/media-receipts.json.

Final AC-PILOT-01 observation: all four pilot MP4s have been produced and uploaded as new Bunny identities. ar-Gulf is 294.188 seconds and en is 317.628 seconds. All four initial readiness steps expired at processing status 2; none is marked playable. Ten sampled actual video frames were reviewed across the four locales; full listening and playback remain open. This completes the authored pilot review package, not the other 29 lessons or the integrated Academic product.
