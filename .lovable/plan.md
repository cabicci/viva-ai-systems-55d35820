## Goal

Fix the fragment-pilot collector so it produces a clean combined 10+10 bundle from existing GitHub artifacts only — no regeneration, no runtime writes, no OpenAI calls.

## Root cause (confirmed by inspecting the artifacts)

1. `writeFragmentPilotLessonPackage` writes lessons directly into the runtime path `src/lib/locale-lessons/<locale>/lessons/` with no sanitization. The collector trusts the per-job `result.json` (`ok: true`) and never re-reads the file from disk.
2. The adapter preserves an internal "Video block (production reference only)" section containing `Bunny` / `لا يُعاد توليده` / `في الإنتاج`.
3. The adapter prefixes quiz options with `Option N:` / `Correct answer (Option N):` / `خيار ١:` / `الإجابة الصحيحة (خيار ٢):` in `quiz.options`, `bullets`, and `contentMarkdown`.
4. Some markdown / table cells are unbalanced (bold/italic markers).
5. The collector has no `--output-dir`, no multi-run artifact merge, and no banned-pattern scan of the written JSON.

## Files to add

- `scripts/locale-lessons/lib/sanitize-final-lesson-package.ts` — pure function that removes production-only sections, strips quiz prefixes (en + ar), balances inline markdown markers, and fixes table-cell markdown.
- `scripts/locale-lessons/lib/validate-final-lesson-package.ts` — banned-pattern scan + markdown-balance check on the **already-written** JSON file (re-read from disk). Exports `BANNED_PATTERNS` and `validateFinalLessonFile(filePath)`.
- `scripts/locale-lessons/lib/__tests__/sanitize-final-lesson-package.test.ts`
- `scripts/locale-lessons/lib/__tests__/validate-final-lesson-package.test.ts`
- `scripts/locale-lessons/lib/__tests__/collect-fragment-pilot-artifacts.test.ts` — integration test that runs collect against two fixture run dirs and asserts merge + sanitize + validate.

## Files to change

- `scripts/locale-lessons/collect-fragment-pilot-artifacts.ts`
  - Add `--artifacts-dirs <dir1,dir2,...>` (newer wins on duplicates), keep `--artifacts-dir` for back-compat.
  - Add `--output-dir <dir>` (required when not writing to runtime). When set, packages, manifest, report, and `combined-manifest.{json,csv}` go there instead of the runtime locale dir.
  - Track `sourceRunId` per lesson (derived from artifact dir name).
  - After writing each file: re-read from disk, run `validateFinalLessonFile`. If any banned pattern present → push to `failed`, do NOT count as passed.
  - Stop trusting `jobResult.ok` alone — sanitize + final-validate is the gate.
- `scripts/locale-lessons/lib/fragment-output-writer.ts`
  - Accept optional `outputDir` so writer no longer hard-codes runtime path.
  - Emit `combined-manifest.json` + `.csv` with `{locale, lesson_id, source_run_id}` rows.
- `scripts/locale-lessons/lib/source-package.ts` — add `outputDirOverride` helper (no behavior change when unset).

Runtime files (`src/lib/locale-lessons/**`, learner UI, Supabase, Bunny, Remotion, RAG, assistant, mission, Egyptian/MSA lessons) are NOT touched.

## Sanitizer rules

- Drop any section where `role` or `heading` contains `Video block (production reference only)` OR `contentMarkdown` matches `/Bunny|لا يُعاد توليده|في الإنتاج/`.
- For each `quiz` section: strip leading `^(\*\*)?(Correct answer \(Option \d+\):\*\*|Option \d+:|الإجابة الصحيحة \(خيار [٠-٩]+\):\*\*|خيار [٠-٩]+:)\s*` from `quiz.options[]`, `bullets[]`, and matching lines in `contentMarkdown`.
- Balance `**` and `*` in every string field by appending a closing marker when odd count; same for `«»`.
- For tables: same strip/balance on every cell.

## Final-validator rules

After write, re-open the file, JSON-parse, and stringify; fail if any of the banned patterns appear anywhere, or any string field has unbalanced `**`.

## Validation steps (in order)

1. `bunx vitest run scripts/locale-lessons/lib/__tests__/` — sanitizer + validator + collect integration.
2. `bunx tsc --noEmit`.
3. Run `bun scripts/locale-lessons/collect-fragment-pilot-artifacts.ts --target all --count 10 --artifacts-dirs /tmp/pilot/runs/27921287280,/tmp/pilot/runs/27922072659 --output-dir /tmp/pilot/clean-bundle` against the existing downloaded artifacts.
4. Zip `/tmp/pilot/clean-bundle` → `/mnt/documents/locale-fragment-pilot-combined-clean.zip`.

## Roadmap log

Insert one `roadmap_items` row with `[source:ai]` + `[scope:infra]` marker, then `bun run roadmap:log` so `roadmap:guard` passes.

## Commit

`fix(locale): validate final combined fragment artifacts` → push to `origin/main` only if step 1–3 all pass.

## What I will NOT do

- No workflow trigger, no regeneration, no OpenAI call.
- No publish, no runtime import (writer is redirected to `/tmp/pilot/clean-bundle`).
- No UI change, no DB schema change (only one roadmap row insert).
- No edits to `src/lib/locale-lessons/**`, Egyptian/MSA lessons, Bunny/Remotion, assistant, mission, or Supabase config.

## Estimate

~6 file additions, 3 file edits, ~15 min of work. Bundle size ≈ same 70 KB zip but with sanitized content and a `source_run_id` column.

Ready to implement on approval.