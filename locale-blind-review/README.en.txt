Four existing S1-01 WAV blind diagnostics, public original repository.

Latest explicit owner instruction: use the original public repository and cease
private use. owner-authority.json scopes this package to exactly four unchanged
existing WAVs: IT checklist, DE checklist, DE chemical, DE communication. Earlier
private-only preparation remains historical and is not overwritten.

This package performs at most one Gemini4Argon/high blind diagnostic per WAV:
four total, zero TTS, zero ASR, zero retries and zero automatic reruns. It uses
the exact successful Interactions audio/text request protocol retained in the
provenance worker snapshot. It performs one fresh model-availability metadata
GET before any review and records supported methods/version without fallback.

Expected wording and criteria are isolated in expected-criteria.NOT-FOR-MODEL.json.
The model receives only the exact WAV and its frozen locale/window-specific
blind prompt. Expected scripts, old QA transcripts and disputed terms are never
included in the model request. Criteria comparison is a later root review.

Publication layout: package as locale-blind-review/ and generated workflow as
.github/workflows/s101-locale-blind-review.yml in cabicci/viva-ai-systems-55d35820.
The workflow has exactly one launch route: the first push creating fresh branch
work/soil-s101-locale-blind-review-20261022 with request.json added. It rejects
later pushes, manual events, other branches/repositories/private state and
run_attempt>1. The branch must not already exist when root publishes. There is
no dispatch step in this preparation. Root owns protected publication.

The original repository's existing GEMINI_API_KEY secret is referenced directly
by only the preflight and review steps. No key is read locally, copied, printed
or added to files. Missing/invalid credentials or unresolved model availability
stop the preflight and allow no review calls.

Each WAV is uploaded before its review. A hash/run-bound artifact receipt is
required. Each provider attempt is exclusively reserved before invocation;
success, failure and unknown outcomes are terminal. Complete raw successful
responses and sanitized failure state are retained. Each clip result is uploaded
immediately before the next clip; final artifacts preserve the whole receipt set.

Model results are diagnostics, not human listening, pronunciation certification,
automatic acceptance or repair authorization. A model timing error or uncertain
transcript is not proof of defective speech. No source/audio changes occur.

Run freeze_package.py then offline_check.py before publication. Offline tests
deny real network, inject fake responses and exercise failed model preflight,
terminal provider failure, malformed raw response preservation, upload ordering,
finite budgets, duplicate prevention, scope/freeze/actual PCM identities and
sanitized errors. No actual provider call occurs during these tests.
