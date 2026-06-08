## Goal

Run the 18-point Mission B1+B2 QA checklist on the live Preview (branch `mission-b1-b2-qa`, commit `82e1db59`) for account `khalil@intersectstudio.net`, using a clean (non-polluted) lesson, and return the requested final report only.

## Constraints honored

- No code edits, no deploy, no schema migration, no secret rotation.
- Read-only Supabase queries for verification.
- If any blocker appears (bug, pollution, branch mismatch), stop and report instead of editing.

## Steps

1. **Pre-flight (read-only)**
  - Query `mission_submissions` for `user_id` of `khalil@intersectstudio.net` → list all `(lesson_id, mission_id, status, attempt_count)` rows.
  - Pick the first lesson where the user has **no row** (cleanest), or where row exists but `status != 'passed'` AND `attempt_count = 0`. Prefer an `intro` lesson close to m1 to keep gating semantics identical to the requested target.
  - Snapshot current row count for that user+lesson+mission (baseline = 0 ideally).
  - Snapshot `user_lesson_status` for the candidate lesson and the next lesson (must be locked).
  - Capture current DB schema fingerprint for `mission_submissions` columns to confirm "no schema change" at the end.
2. **Browser session**
  - Open Preview, confirm logged-in as `khalil@intersectstudio.net` (if not, stop and ask).
  - Navigate to the chosen lesson, scroll to mission form.
3. **Attempt #1 (weak answer)**
  - Submit a clearly weak Arabic answer (e.g. "مش عارف").
  - Wait for AI evaluation to finish.
  - Read `mission_submissions` → confirm exactly 1 row, `attempt_count = 1`, `status != 'passed'`.
4. **Attempt #2 (weak answer)**
  - Submit a second weak answer.
  - Confirm same row updated: `attempt_count = 2`, still 1 row total (no duplicate insert).
  - Confirm "شوف مثال يساعدك" button appears in UI.
5. **Reveal**
  - Click "شوف مثال يساعدك".
  - Read row: confirm `status != 'passed'`, score below pass threshold.
  - Read `user_lesson_status` for next lesson: confirm still locked.
  - Confirm mission form still rendered/editable.
6. **Persistence**
  - Hard refresh page.
  - Confirm reveal/example still visible, form still open, next lesson still locked.
7. **Improved answer**
  - Submit a strong, detailed Arabic answer matching the mission rubric.
  - If AI returns `passed=true` → confirm `user_lesson_status` for next lesson becomes unlocked.
  - If AI returns `passed=false` → confirm next lesson remains locked (correct gating).
8. **Skip behavior**
  - Verify skip button (if present) behaves same as main: skip ≠ pass, does not mark mission passed.
  - Proceed with this QA plan, but modify Step 8:
    Do not click or trigger Skip during this QA.
    Only verify skip behavior by inspection / existing behavior notes.
    Do not create skip records or change lesson status through skip.
9. **Schema check**
  - Re-snapshot `mission_submissions` columns + index list, compare to step-1 fingerprint → confirm no change.
10. **Final report** (only output to user, no other narration):
  - QA passed? / Branch+commit / Account+lesson / attempt_count after #1 and #2 / row reuse / reveal button / reveal unlocked next? / status+score after reveal / form open? / persisted after refresh? / resubmit-unlock-only-after-pass? / skip unchanged? / bugs / recommendation (merge | fix branch | stop).

## Stop conditions (report immediately, do not continue)

- Preview is not on commit `82e1db59` or branch identifier mismatches (best-effort detect via build metadata/version endpoint if exposed; if not detectable, note it as a warning and proceed).
- Logged-in user is not `khalil@intersectstudio.net`.
- No clean candidate lesson available → report and ask.
- Any of bugs from previous QA reproduces (attempt_count stuck at 0, duplicate rows, reveal sets passed, next unlocks on reveal) → stop, do not continue subsequent steps, include exact DB snapshots in the bug report.

## Notes (technical)

- Read-only queries use `supabase--read_query` on `mission_submissions`, `user_lesson_status`, `auth.users` (id lookup only).
- Browser actions use `browser--view_preview` + `browser--act` (one action per call), `browser--observe` before clicks on Arabic UI text.
- No writes to DB from QA itself; all writes happen via the app's own server functions exercised through the UI.