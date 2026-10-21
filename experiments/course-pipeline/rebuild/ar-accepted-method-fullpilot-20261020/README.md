# S1-01 Arabic audio — prepared, not dispatched

`dispatch.private.json` is deliberately disabled. The request has no invented speech units; final units will come from the separately reviewed text inventory. Root must inspect the complete text, exact request hash and finite per-unit budget and explicitly authorize execution before any isolated-index commit/push or paid call. Preparation makes no speech, audit, ASR or rendering requests.

The worker reuses the frozen Gemini TTS engine and voices A/Charon and B/Kore. Original accepted A and owner-worded B composite remain immutable local references with actual hashes and timings. They are not regenerated, normalized, re-audited or retranscribed by this worker. The generated-unit list excludes them.

Each new unit has separate spoken/display strings, source references, text hashes, request/output ledger, actual WAV and one-attempt budget. A generated failure is retained while independent units continue. Actual-audio understanding is a fallible review signal; raw responses and limitations are preserved. ASR returns uncorrected estimates and unresolved words, never automatic pronunciation certification. No proportional motion timing or automatic speech repair follows from either model.

Server credentials remain GitHub Actions secrets. No alternate provider, automatic retry, full movie, image generation, Bunny upload, publication or 44-step rollout is included. All outputs are downloaded into the project on D by the root task after execution. Existing source/accepted files and inherited Git changes remain untouched.
