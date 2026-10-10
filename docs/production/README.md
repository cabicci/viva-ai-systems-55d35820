# Masaarat production guide

This is the single entry point for content/video production methods and preserved source code. The two existing Library handoff registers remain authoritative for project status and acceptance. This guide does not replace them.

## Current boundary and future decisions

- Existing published video identities and mappings, learner content, accounts, access and billing are unchanged by preservation.
- AI localized receipt coverage is an accepted completed batch, not an outstanding production queue. Historical failures and partial counts must not trigger regeneration.
- The owner may later request changes to ANY videos: AI, Kids, Technical, Academic, one lesson, a set, a whole domain or the whole platform. Preservation does not freeze content permanently.
- A possible new Remotion presentation for Technical and Academic is **UNDECIDED**. This is not approval to render, generate narration, upload, change mappings, publish or regenerate accepted content.
- Technical/Academic listening and presentation acceptance remain separate from technical delivery. No new acceptance is claimed here.
- Khalil performs publication and checks Lovable by default. This operation does not publish or check production playback.

## Where to start

| Domain | Current written content / platform source | Production source | Recipe |
| --- | --- | --- | --- |
| AI | `src/lib/locale-lessons/{locale}`, canonical adult lessons, `remotion/src/lessons-generated` | Current `remotion/scripts` and preserved historical source refs | [AI](AI.md) |
| Kids | Production private-content integration under `scripts/kids` and `src/lib/kids` | Preserved `experiments/masaarat-kids` source refs | [Kids](KIDS.md) |
| Technical | `scripts/technical-education/source`, private assets and platform integration | Preserved `remotion/scripts/build-technical-lesson.py`, `remotion/src/furniture` and experiment authoring sources | [Technical](TECHNICAL.md) |
| Academic | `experiments/academic/course`, `scripts/academic-education`, `remotion/src/academic-course` | Main source plus preserved recovery source ref | [Academic](ACADEMIC.md) |

[Source index](sources.json) binds exact branch heads and archive tag names. Archive tags preserve FULL source commits and history, not just copies of selected scripts. Verify the tag SHA against the index before use; never move an archive tag. Preserve the original methods rather than applying an old branch's application tree to main.

[Receipt index](receipt-index.json) records every original receipt blob and byte checksum. Exact raw receipts are under `receipts/ai/{lessonId}__{locale}/finalization-receipt.json`. These 300 receipts cover 100 lessons in English, MSA and Gulf Arabic. Egyptian production is a separate workflow/history.

The old localized AI workflow is retained byte-for-byte at [archive/video-production-batch.yml](archive/video-production-batch.yml). The active workflow of the same path now validates the archive offline only, preventing an obsolete completed batch from silently producing duplicates after branch removal. It is not the entry point for a new authorized video batch.

## Updating videos later

1. Obtain the owner's requested scope and acceptance criteria. Treat a discussion or possible future decision as undecided.
2. Check current main and the existing registers. Start an isolated work branch; retain the current video GUIDs, content hashes, sources and publication evidence.
3. Select the domain's preserved source, narration policy and renderer. Archive methods are reproducibility references, not automatically approved modern presentation choices.
4. Prepare changed scripts/scenes and a bounded manifest: lesson + locale + written source SHA + narration fingerprint + render fingerprint + previous GUID. Use separate display, spoken and caption text. Never fall back to Egyptian for another locale.
5. Reuse accepted unchanged outputs. A new approved change needs a new content/render version; do not use a completed old batch ID or force-rebuild every existing video merely to update a subset.
6. Generate/render only authorized changed cells. Retain the original narration, captions, evidence and new media in durable storage; GitHub Actions artifacts with expiration are working transfers, not a verified permanent archive.
7. Review actual sound/presentation and the affected mobile/desktop/localized journeys as requested. Technical readiness does not establish listening acceptance.
8. Upload a separately identified replacement only when authorized. Keep the previous GUID and mapping available until the new output is accepted. Replace only exact approved mappings; do not delete the previous hosted media incidentally.
9. Merge the reviewed mapping change, then Khalil publishes/checks by default. Update the existing two registers with actual receipts and distinguish generated, uploaded, mapped, merged, published and verified.

## Preserving and restoring source branches

- A deleted branch name can be recreated from its exact archive tag in `sources.json`; the source and commit history remain retained.
- Create a NEW working branch from the archived source only for the approved domain/task. Do not merge the archive's old application snapshot wholesale into current main.
- The Academic source branch is retained for now because main workflows still name it. Its existence is not evidence of unfinished video production and does not authorize new production.
- Unrelated branches, the Twilio draft PR165, contact automation and Stripe LIVE preparation remain outside this cleanup.

## Offline archive check

```sh
python3 scripts/maintenance/preserve_production.py verify
```

This checks all 300 exact identities, original bytes, Git blob fingerprints and accepted lesson-manifest coverage. It does not call Bunny, generate media, alter mappings, send messages, activate payments, publish or establish current playback acceptance.

## Archive completeness limit

The source commits and indexed AI finalization receipts are preserved. There is NO claim that every historical WAV/MP4/transcript/cache for all four domains has a complete permanent original-media archive. Committed hosted-media GUIDs and an expiring Actions artifact are not proof of that. Assess any required original artifact specifically before a future correction; do not regenerate already accepted content solely because temporary artifacts expired.
