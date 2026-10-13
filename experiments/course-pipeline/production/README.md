# Full soil-and-crops production

Scope authorized by the owner on 13 October 2026: all 34 curriculum stations in Egyptian Arabic, English, Italian and German, including written explanations, narrated media, activities, formative checks, trainer evidence and curriculum-assistant preparation. The prior pilot remains SOIL-PILOT-01 and is reused at SOIL-U1-L03. No existing platform lesson identities change.

## Production stages

1. A version-bound request selects the 33 new stations. The original 146-page English PDF is represented by its previously verified extraction, encrypted with AES-GCM. The decryption key exists in the repository's GitHub secret; plaintext is ignored and never copied to the learner bundle.
2. Authoring uses Gemini 2.5 Flash against each station's exact source pages and editorial corrections. English is written first, followed by complete course-local localization. Original school branding, source model answers and unnecessary source quotations must not enter public content.
3. Structural checks, an independent model review, targeted correction and re-review precede media. Model reviews do not establish expert, native-speaker, owner or institutional acceptance. Rejected exact content hashes are excluded.
4. Gemini Nano Banana 2.1 generates three shared, text-free 3D illustrations per teaching lesson. A condition-specific review contract allows one image repair. Labels, numbers and motion are authored separately in Remotion, using Cairo and the existing brand palette.
5. Gemini speech generates each narrated scene independently in each locale. The shared engine caches narration by spoken text/style/model; display edits cannot invalidate unchanged audio. Partial artifacts survive downstream failure.
6. Each rendered H.264/AAC 1080p video is checked for codec, dimensions, duration and integrity. Download all outputs to durable local storage, inspect real frames and playback, and keep review states separate.
7. Four assessment/reflection stations receive full teaching/assessment materials; the 29 new teaching lessons receive 116 videos. The four pilot videos are reused. No automatic production video is assumed for every assessment station.

## Machine reference

Honda FQ650 with GP200H is the selected worked machine, following the owner's permission to select a model sold in Egypt. Local supplier listings establish availability, not market share. The Honda owner's manual controls the instructions and overrides contradictory generic source claims. Match the actual machine's nameplate, attachments and market manual before trainer-led practical use. Adult trained operators only for powered practice; younger students observe the stopped and isolated machine.

Official manual: https://cf.hondappsv.com/files/OM/OM001314PHL/42YX4G01_web.pdf

## Assistant

assistant.mjs implements authenticated, course-wide retrieval and follow-up handling. platform-adapter.ts connects model generation to the existing server-side OpenAI provider. The host must supply existing entitlement and quota services, server-owned conversation storage, and retrieval of release-approved learner chunks only.

Do not register a public route with permissive placeholders. Never send private trainer assessments to retrieval. Source IDs and physical PDF pages are returned from validated retrieval, not invented by the model. Locale support is course-scoped; no global platform-language changes.

Live activation remains deferred until integration/publication, as explicitly requested. Mock tests are not evidence of live access or grounding. ASSISTANT.md remains the publication checklist.

OpenAI structured output reference: https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=chat

## Authoring and learning methods

The complete rationale and primary references remain in ../planning/README.ar.md: ILO competence-based training, FAO e-learning design, IES worked examples/retrieval/spacing and CAST UDL. Each new lesson includes six explanatory scenes, a worked example, actual activity cases, four formative questions with explanations, an observable trainer checklist, six glossary entries, follow-up questions, and delayed retrieval. Private transfer assessment instructions and reassessment criteria are archived separately.

Learner release requires review of scientific content, terminology, audible delivery and actual usability. No accreditation is claimed, and review by an external TVET authority is a separate later process.

## Commands

- Authoring is driven by the exact request and the separate soil-course-author workflow.
- build_packages.py materializes only complete, non-rejected reviewed drafts.
- media.py prepare/produce runs one explicitly listed teaching lesson in the separate media workflow.
- Nothing here deploys, merges, indexes production data, uploads to Bunny or activates billing.

The lead-authored controls now include 198 canonical English narration segments, 33 complete simulated activity cases and 87 text-free visual briefs. These take precedence over inconsistent source generalizations and are enforced before localization and media. The run coordinator can transfer completed artifacts, request only the bounded teaching cells and preserve an incremental archive; it stops for failed stages rather than publishing incomplete work.
