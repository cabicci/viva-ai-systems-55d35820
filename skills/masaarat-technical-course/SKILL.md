---
name: masaarat-technical-course
description: Author and produce Masaarat technical or vocational course lessons from a supplied curriculum, with observed practical competencies, course-scoped localization and the shared resumable media pipeline. Use for new technical course pilots or approved batches, not ordinary platform maintenance.
---

# Masaarat technical course production

If the current workspace does not contain the production entry points, read [the saved workspace locations](references/workspace.md) first.

Treat the current user's course decisions as authoritative. The soil pilot is an example, not a mandatory structure for every trade.

## Establish scope

Read AGENTS instructions and docs/production/README.md. Inspect the actual branch, existing lesson/media identities and source material. Keep originals read-only. Use a separate branch and preview when requested. Existing course completion does not authorize reproducing its media.

Record source language, learners, practical setting, requested course-only locales, source hashes and unresolved technical issues. Do not assume every course needs four languages. Distinguish source facts, authoring decisions, simulations and expert-reviewed claims.

## Design practical learning

Start with observable work: what learners must produce or perform, the conditions, acceptable evidence and what a trainer must observe. Match explanation, demonstration, guided practice, independent application and feedback to that competence.

Include tools, setup, safe operating limits, procedural decisions, common errors and when to stop and ask the trainer. Resolve technical contradictions using primary references. For equipment-specific instruction, use the exact model's manual. Do not invent settings, measurements or observations.

An online quiz checks understanding; it does not certify physical competence. A trainer record starts unobserved, without a signature or pass by default.

## Author and localize

Read experiments/course-pipeline/README.md, course/manifest.json and one locale package for the schema. Separate display text, narration and captions. Preserve semantic IDs, numerical meaning, units, feedback and practical evidence criteria across locales. Do not silently turn Egyptian Arabic into formal or Gulf Arabic.

Keep source branding out of student content when instructed, while retaining lawful internal provenance. Label simulations. A multilingual draft is not proof of native-speaker or subject-specialist review.

Create visuals explaining the actual skill. The soil Diagram component is not universal: extend it or supply suitable compositions for another trade.

The current visual direction is stylized 3D with realistic materials. GitHub Actions orchestrates Gemini image generation as well as Gemini speech. Generate text-free illustrations, then add exact localized text, numbers and progressive callouts in Remotion. Preserve separate image prompt/model hashes and speech hashes so a visual correction never causes fresh TTS calls. Do not replace the requested Gemini production stage with manually generated images from another provider; exploratory images must be identified as such.

Specify the batch's visual/scientific contract before generation, including the condition of each object at its procedural stage. Use that contract for automated inspection, with at most one targeted repair per asset and a clear failure report. Do not build a workflow that depends on the owner manually reviewing every image. Review the completed pilot and escalate only unresolved exceptions; preserve the user's final pilot review gate.

## Execute the shared engine

Use python experiments/course-pipeline/pipeline.py validate --package <package>, then plan. A package contains a manifest and complete locale JSON files. Use request --batch-id <unique-id> --package <package> only for scope already authorized by the user.

The workflow .github/workflows/soil-course-pilot.yml is restricted to one soil lesson on its isolated branch. For another course, create an equally bounded workflow; do not broaden the soil request in place.

Audio keys include spoken words, locale delivery, voice and model. Display-only edits reuse unchanged audio. Preserve partial WAVs after failure; never regenerate speech to repair a later delivery failure. Provider refusal does not authorize rewriting scientific meaning. Record any authorized model change explicitly.

Measure audio, render and mux. Verify codecs, dimensions and duration. Inspect frames and play outputs. Sentence-proportional captions are not forced alignment. Download temporary Actions outputs to the agreed durable archive.

## Report and hand off

Use REPORT.ar.md as an example: named educational methods, primary links, where each appears, conflicts and resolutions, localization choices, tests and remaining reviews. Do not claim institutional accreditation.

Keep generated, reviewed, uploaded, mapped, merged, published and playback-verified states separate. Describe the local lesson guide honestly if the authenticated OpenAI assistant is not integrated. Database, indexing and deployment through the existing Lovable project are separate integration steps.

Show the pilot before extending the curriculum when requested. Preserve existing Bunny identities. Skill invocation does not supply missing permission to publish, merge, send messages or operate equipment.

## Platform identity and editable overlays

Before rendering, inspect the actual platform brand source and approved logo. Use the exact theme tokens from `src/styles.css` for text, controls and overlays. Match the typography reference selected by the user: this pilot uses Tajawal for the platform preview UI and Cairo for video, matching the existing AI video theme in `remotion/src/theme.ts`. Do not infer that the site and video necessarily use the same font. Natural subject colors in the illustrations can remain distinct from UI branding. Bind font, logo and palette sources into the render fingerprint. Keep visible text separate from generated images: display-only edits rerender the video without regenerating pictures or narration; spoken edits regenerate only affected speech segments. An exported MP4 still requires rendering after its baked-in text changes.
