# Bounded S1-01 five-unit audio repair

Prepared only. No provider request, ASR or listening review was executed locally.
request.original-20261022.json is a byte copy of the owner's frozen five-unit request.
The effective request updates only model-selection metadata per the subsequent
explicit instruction to use the highest Gemini model. The engine
and course manifest are exact byte snapshots from the prior accepted voice worker.

Only workflow_dispatch or a request-path push to the exact fresh authorized
branch may execute this worker. GitHub run_attempt must be 1. The parent must
choose exactly one launch route; do not dispatch after a successful push trigger.
The workflow has no pull-request, schedule or workflow-run trigger. Each
unit reserves at most one TTS call, one blind actual-audio Gemini review and one
Whisper transcription, with global caps of five each and no retries. A failed or
ambiguous call is terminal. A fresh manual dispatch is a new paid attempt and
requires explicit authorization; this package does not authorize redispatch.

Each candidate WAV and original provider data are uploaded before either review
starts. The worker requires the upload action's artifact ID and digest receipt.
Review and ASR results are uploaded for that unit before proceeding to the next.
Any missing diagnostic stops subsequent units. An upload failure stops reviews.
The final evidence artifact preserves partial work even when a step fails.

Preferred TTS is gemini-3.8-flash-tts and blind audio review is gemini-4-argon.
Official model and API documentation references are in model-evidence.json.
Two bounded model-metadata GETs run before TTS; absent model/method metadata
stops production with no silent fallback. Actual returned WAV/model metadata
remain the execution evidence; a model index does not prove account access.
Production requires the original repository's authorized GEMINI_API_KEY secret.
The current preparation does not configure, inspect or expose credentials.
Provider/model unavailability fails closed, without a model/voice substitution.
Errors retain types and HTTP status only; raw error bodies are not logged.
Successful original provider audio and raw review responses are preserved.

Blind review receives the actual WAV and a generic acoustic-review prompt only;
neither the script nor the repaired terms are supplied. Whisper receives the WAV
without an initial/reference prompt and emits approximate word timestamps. An
independent subsequent text comparison retains differences against the frozen
script, including any uncertain scientific words or safety conditions. Neither
machine output nor transcript agreement certifies pronunciation, accent, voice
continuity, owner acceptance or synchronization. These candidates still need
actual repair review against accepted same-voice recordings before assembly.

Run `python audio-repair/offline_check.py` from the job root for offline checks.
Tests deny network access and use synthetic audio, never the accepted recordings.
The unchanged vendor snapshot supplies no-retry request transport and WAV
validation; its legacy synthesize entry point is not invoked. The new adapter
uses the documented Interactions REST API with speech_metadata, exact text and
voice configuration. Same voice names across models do not establish matching
perceived timbre, so these new-model candidates require a same-voice sound check.
The faster-whisper wheel hash, package version and small-model revision match the
prior unit022 worker. Actual dependency versions and model bytes are recorded on
Actions; a complete transitive dependency lock is not claimed.

Freeze.json binds the exact worker, request, runtime, copied engine, copied
manifest and offline checker. Workflow environment pins the request, worker and
freeze hashes. Hash receipt also records the workflow bytes. Local output and
cache folders are ignored and are not input assets. Keep the existing R2 video,
frames, accepted narration and source inventories unchanged.
