# Masaarat Kids — local pilot
One lesson: **Turn your idea into a clear prompt**, level 1 (ages 10–12).
Curriculum bands reserved in the manifest: 10–12, 12–14, 14–16. Shared boundary ages are placement decisions, not automatic access rules.
## Scope
Four authored locale packages: Egyptian Arabic, Modern Standard Arabic, neutral Gulf Arabic, and English. Objectives, scenario logic and rubric are equivalent; narration, examples and UI copy are written naturally per locale.
Each package contains 12 scenes, 3 objectives, 5 explained quiz questions, one practical mission, its self-review rubric, and 4 sourced hints.
Official logo and Cairo font are copied from the repository; their checksums are recorded in evidence/brand-provenance.json. Colours derive from remotion/src/theme.ts and the platform stylesheet. The mascot is an original SVG animated by Remotion frames.
## Review
Open dist/index.html on Dell after building. It is a standalone local prototype, with no production route, database, user accounts, billing, analytics, persistence of learner input, or changes to the existing video registry.
The four 48-second MP4s are **silent visual previews** of all 12 scenes, not complete narrated lessons. The page and videos label this limitation. Each locale also has 12 PNG scene stills.
Full scripts are available in the page transcript and content/*.json. The prompt builder combines text locally; it does not query an AI service. Example model responses are authored teaching examples.
The assistant demonstrates curated, locale/lesson/level-scoped retrieval with source links. The 48 source chunks are prepared, but a generative RAG service is **not connected**.
## Reproduce
From this directory: bun install --frozen-lockfile
Then: bun run assets; bun run check; bun test; bun x tsc --noEmit
Visual previews and stills: bun run render --preview --stills
Local page: bun run build
Browser checks (Chrome installed): bun scripts/browser-qa.ts
## Narration gate
The existing platform uses Gemini TTS. The pilot targets the same model/voice family and explicit locale-specific narration instructions.
Provide GEMINI_API_KEY or GOOGLE_API_KEY through an approved secure local environment, then run bun run narrate. No credential values are logged or committed.
The generator stops on provider refusal or errors; it does not rewrite to evade safety checks or rotate credentials. Unchanged completed audio segments are reused.
After narration: bun run render --stills, then bun run build. Text hashes prevent rendering stale narration against changed lesson content.
**Narration is currently blocked:** no Gemini credential is available on Dell. No TTS request or production upload was made. Full narrated videos, captions alignment and listening QA are not completed.
## Remaining acceptance
Owner review of content/mascot/motion; native-speaker and child-education review; Gemini narration and listening QA; final audio/video/captions checks; separate child-appropriate provider/privacy controls before generative RAG or child access.
The existing production workflow is pinned to its adult corpus and authorized dispatch path; it was not repurposed or triggered for this pilot.
No push, merge, website publication, Supabase operation or Bunny upload is part of this local experiment.
