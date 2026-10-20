# Automated pronunciation review system v1

Scope: project-local, Arabic L01 first. This system analyzes actual audio before rendering; it never labels a well-spelled transcript as proof of good pronunciation. It is not a new registry, platform deployment or cross-project policy change.

## Required stages and automation

1. **Script preflight.** Keep display spelling, spoken text and delivery directions separate. Bind their SHA256, locale, model, voice and audio format. Extract numbers, units, negation and glossary terms. Record potential written-register/case-ending problems for Egyptian delivery without silently changing the accepted scientific script. A global qaf-to-hamza replacement is prohibited.
2. **Technical audio check.** Measure actual decoded duration, peak, clipping and low-energy intervals. Hash the exact source audio and any rendered soundtrack inspected. A long pause is an alert to review, not automatic proof of a defect.
3. **Blind sound pass.** Analyze complete coverage in measured 20-second core windows plus 700ms context. No reference script is provided. Retain actually heard words, uncertainty and acoustic observations.
4. **Reference sound pass.** A separate prompt analyzes the same actual audio against the approved reference, specifically checking vowels, stress, shadda, consonants, omissions/repetitions, numbers, units and joins. The same model in two prompts is not two independent human reviewers. Full scene text is context; words outside a clip must not be labeled omitted.
5. **Automatic validation and reconciliation.** Reject absent/failed responses, invalid/out-of-bounds timestamps, missing scene coverage and identity changes. Preserve all raw output. Core-window ownership removes duplicate overlap alerts. Clip-edge truncation alerts are excluded from defect counts but retained in an audit trail. Natural Egyptian omission of MSA case endings is not an error. Acoustic or lexical uncertainty remains a hold; it must not be converted to an accent PASS.
6. **Automatic release gate.** `gate.py` exits 2 unless the exact audio/script/delivery/model/voice identity is reviewed, every expected analysis is successful, no unresolved finding/owner rejection remains, and required owner listening approval is recorded for that audio. An owner rejection always overrides an automated no-findings response. Missing report fails closed. Test fixtures must never be used as actual approval evidence.
7. **Bounded repair.** The system outputs a sentence/segment repair queue, not whole-course regeneration. Record the observed word, intended word/phonetics, absolute timestamp, reason and exact original hash. Generate only affected complete sentences/passages, preserving good audio. One attempt before a new review; never replay an ambiguous request automatically. No repair is accepted solely because the transcript looks correct.
8. **Recheck changed audio.** Repeat actual-audio review and refresh the exact identity, then use actual recording timings for affected animation. A visual-only repair reuses unchanged accepted audio and its matching approval. Do not stretch audio to an old estimated duration.
9. **Integration.** Before Remotion bundling in the project-specific renderer, validate Arabic `render-data` against the current gate report and actual public WAV plus manifest. Unrelated courses and English are out of the current gate scope. A reviewed source WAV and a reviewed exported MP4 are different identities; retain their production-chain link. A new WAV cannot inherit approval for an old WAV.
10. **Delivery.** Every scene review uploads as soon as it completes; receive it immediately. Preserve requests, responses, attempts, outputs, checksums, rejected candidates, corrections and gate results in the portable project. Durable records are English; owner review UI may be Egyptian Arabic. Never delete an old original to hide a defect.

## States

`pending_analysis` → `analysis_complete_pending_triage` or `analysis_failed` → `repair_required` / `uncertain_needs_review` / `ready_for_listening` → `accepted_for_exact_audio`.

Only the last state with matching hashes can pass the rendering gate when listening approval is required. Automatic analysis is the primary detection step; human review is a final approval and resolution of ambiguous acoustic cases, not a substitute for running the checks. No numerical accent score is presented as truth.

## Severity and corrective handling

- Critical: wrong number/unit/negation or a change to scientific meaning. Stop affected output immediately.
- Major: wrong/missing word, syllable or pronunciation affecting understanding; an explicit owner rejection. Stop affected output.
- Minor: audible repetition, awkward pause or delivery defect. Keep the original and propose a localized repair.
- Uncertain: the model cannot resolve the actual sound, passes disagree, timestamp is invalid, or a clip boundary could explain it. Hold; inspect contextual audio or one bounded additional review. Do not auto-regenerate uncertain speech.

## Review identity and approvals

Every result links source video hash, exact scene WAV hash, approved speech source hash, text/delivery/model/voice identity, full coverage, run/commit and review version. Local review-board exports are draft human observations only; they do not automatically unlock production. Import only after verifying the owner/reviewer identity, matching audio hashes and actual reviewed evidence through the normal guarded workflow. Never trust an arbitrary edited JSON as owner approval.

## Current audit and known limitation

Initial application uses the exact delivered Arabic L01 video, SHA256 `cc3a5a4b181951fbffb92ce3afb24ada32c22fa6282a611aa471f9acda7b8c71`, 459.438 seconds, ten scenes, 29 windows, up to 58 analysis calls. Existing tomato correction is still an unapproved candidate and is not in that video. The already rejected original must remain blocked even if a model normalizes its spelling or reports no pronunciation issue.

All analysis and gate execution run on GitHub Actions. Local code authoring, receiving, evidence triage and static review-board preparation are allowed. No TTS or video rendering is authorized by this audit request alone. Existing full-course rollout/publication gates remain.