# S1-01 unit024 deliberate followup r2

Preparation only. This package contains one new candidate request for unit024.
It does not authorize replaying the previous five-unit batch. Prior worker inputs,
five candidates and complete raw evidence remain unchanged in their existing
folders; 83 source-file hashes are recorded in prior-batch-preservation.json.

The previous unit024 candidate from run39694914880 has WAV SHA256
ee1da3349dbe097aeecae62ca6266c8bb90eb7c4da388ccfc93d6b023843c561.
Its blind actual-audio Argon review flagged the heard prefix «والمعلومات»
instead of «ولمعلومات» around21.2–23.5seconds. Whisper independently emitted
«والمعلومات». This is a concrete wording diagnosis; the separate low-confidence
qaf claim does not justify formalizing Egyptian pronunciation.

Only this third-check clause changes:

Before: الحماية مناسبة للمهمة ولمعلومات أي مادة كيميائية

After: الحماية مناسبة للمهمة، وبنختارها حسب معلومات السلامة الخاصة بأي مادة كيميائية هنستخدمها

All five checks, their sequence, safety requirements, other clauses, voice,
delivery instructions and source pointer remain unchanged. Scientific originalText
is preserved. The spoken/display text and their SHA256 change together.

Production remains Actions only, exact branch work/soil-s101-unit024-r2-20261022,
run_attempt1. Preferred models remain gemini-3.8-flash-tts with Kore and a blind
gemini-4-argon actual-audio review using high reasoning. Two exact-model metadata
GETs precede generation and fail with no fallback. No key is embedded or read
during preparation; authorized GEMINI_API_KEY is resolved on Actions only.

Caps: one TTS call, one blind actual-audio review, one pinned small-Whisper ASR
invocation and zero retries. Each invocation has an exclusive pre-call ledger.
The new WAV is uploaded immediately before either review; its upload receipt is
mandatory. Review evidence and partial failures are uploaded separately. No
provider failure body, header or credential is printed. Raw successful responses
and original WAV bytes are retained. No assembly or acceptance is produced here.

The standalone audio-unit024-r2.yml file is an integration proposal. Copy it to
.github/workflows/audio-unit024-r2.yml and the package to
experiments/masaarat-media-review-job/audio-unit024-r2 in the original repository.
Keep it separate from the prior request and workflow. The scoped request-path push
trigger is a possible launch route; publishing the branch can execute it. Root
must choose a single route and must not dispatch again after a successful push
trigger. This preparation has not pushed, dispatched or called a provider.

Run python freeze_package.py then python offline_check.py here for local checks.
The 17 adapted checks deny network access and use one synthetic WAV, mock model
metadata and a mock Argon response. Existing vendor bytes, package/model pins,
audio format checks, upload ordering, replay refusal and sanitized errors remain.
Package dependency versions are recorded at execution, rather than claiming a
complete transitive dependency lock.

The new model's candidate still needs a sound/timbre comparison against accepted
Kore audio and root review of its actual transcript, safety terms and measured
timing. No human listening, owner acceptance or pronunciation certification is
claimed. New timestamps must come from the new actual recording, not scaled from
the first candidate.
