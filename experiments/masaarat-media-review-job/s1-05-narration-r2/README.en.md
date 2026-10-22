# S1-05 narration r2: first push only

This isolated execution revision preserves every one of the 40 frozen r1 unit objects, including IDs, spoken text, display/caption text, delivery instructions, source bindings and request fingerprints. The four narration scripts and four safe source projections are byte-identical to r1. Existing r1 IDs remain intentional content identities. r1 is unchanged.

The exact public target is `cabicci/viva-ai-systems-55d35820` (repository ID `1272666418`), branch `work/soil-s105-narration-20261022-r2`. Place the frozen package at `experiments/masaarat-media-review-job/s1-05-narration-r2` and its generated workflow at `.github/workflows/s1-05-narration-r2.yml` in the same reviewed commit before the branch's first remote push. Do not pre-create an empty remote branch: subsequent pushes cannot execute this workflow. No main workflow or main-branch change is required or authorized by this package.

Both the workflow job and actual worker require the original public, non-fork repository identity, exact branch/ref, a push event with `created` true, `deleted` false, `forced` false, all-zero `before`, `after` equal to the runner commit, and run attempt 1. Manual dispatch, schedules, repository dispatch, other refs, later pushes and reruns are rejected. `remote-branch-check.json` records a read-only 404 observation only; recheck absence before publication. This package has not been published or executed.

The content preset remains `gemini-3.8-flash-tts`, alternating Charon and Kore by coherent section, with the exact latest Egyptian delivery instruction unchanged. Actual-audio review uses `gemini-4-argon`; locale-specific Whisper ASR is independent. Availability and actual audio quality remain untested for this batch. No listening approval is claimed for future recordings.

All 40 parts are required: 10 each for en, ar-EG, it and de. Bounds are 40 TTS, 40 blind audio reviews, 40 ASR invocations and 2 exact model metadata GETs; each part/kind permits one attempt, automatic retries zero. Write-ahead reservations preserve ambiguous outcomes. Every successful WAV is uploaded immediately before that part's review/ASR/compare. Partial output and attempts are uploaded even on failure. No duration or synchronization is invented.

Only safe explanatory projections are included, with original-source lineage hashes. Assessment prompts, answers, feedback and rubrics are excluded. `PUBLIC-PROJECTION-PATTERN.en.md` explains the separation. Do not copy the private complete course sources into the public package.

Offline checks (no credentials or provider calls):

```text
python freeze_package.py
python offline_tests.py
python worker.py validate
```

Any frozen input change requires re-materializing the freeze/workflow and repeating offline checks. Publish only the exact files listed by the final publication allowlist, plus the workflow at its stated path; exclude synthetic fixtures, caches, private sources and production output. Root owns final review and any later publication. No Git operation, remote mutation, TTS, audio review or ASR production invocation was performed while preparing this package.
