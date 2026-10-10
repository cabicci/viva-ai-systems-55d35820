# AI production reference

Start at [README](README.md). Current content and Remotion tools are on main. `remotion/scripts/build-lesson.py` uses the source lesson or exact localized package, scene normalization, locale policies, narration generation, Remotion rendering and WebVTT captions. `remotion/src/lessons-generated` stores generated scene modules; the runtime registry and Bunny mappings are separate.

The completed localized batch pinned sources `69ba815e256d6f46382c9f0fa901bb3fea88c85b` (full batch), `6cfd019d315ec3f5a30ffc83bd551f4deb52385c` (pilot), and `71fbe483b931cba91bedb1feadb1941092518890` (repair). Its immutable workflow is preserved in [archive](archive/video-production-batch.yml). Keep source identity and recipe separate from current production acceptance.

- `video-results` archive includes the earlier `remotion/video-pipeline` implementation/runbook and an actual older video/audio/caption output.
- `feat/video-production-pipeline` preserves the separate original pipeline history.
- `feat/video-production-final-v2` preserves its validation/visual-repair history.
- These are historical source references, not three additional unfinished video requirements.

For a future update, choose current or preserved source explicitly. Prepare a NEW bounded batch/version and change only requested lesson/locale cells. Do not replay the completed 300 batch. Its receipts are now authoritative archive evidence under `docs/production/receipts/ai`; the former active batch workflow is offline validation only. The separate `lesson-video.yml` method remains available for specifically authorized new work; it is not run by preservation.

Accepted outputs must skip paid generation when source/narration/render fingerprints are unchanged. A changed output requires a distinct version and retention of the previous GUID until approved replacement. Do not infer current player quality from a finalization receipt alone.
