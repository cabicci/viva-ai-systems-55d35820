# Student learning records — phase 2

Owner scope: one learning file per account/child with a separate record per curriculum; progress, personal notes, reading continuity, assessment/submission history and future teacher/institution joins. AI reports: two each month **per package**, shared across its curricula and children, independent of assistant-question credit. No new Lovable project, repository, database or staging environment.

## Authoritative data and learner experience

Course models are versioned independently: AI missions/notes, question-based courses, exams and practical training can have different required/optional activities and completion/grading authorities. The common record does not impose the AI layout, activities or pass rules on another curriculum. Notes display/save only when that course model enables them. New canonical assessment adapters can record exam/training outcomes through the service-only receipt interface; this does not invent an exam renderer or grader for a future course. Curriculum intake must publish its model alongside its own approved activities.

Owner continuation, 2 November: defer the **mandatory activity-model selection/assignment step** to stage 3, curriculum intake/integration. When an administrator assigns a curriculum, require its student activity model (missions, notes, questions, examinations and/or practical training), required/optional activities, assessment/solution rules and completion criteria before approval. Reuse the common learner record and course-model version contract. Do not build or enforce that intake UI in phase 2. Continue the current phase-2 implementation; this backlog entry does not claim that the intake step exists.

- Existing lesson, Academic, Technical and Kids writers still decide access, grades and completion. Learning events capture only accepted writes. Opening a lesson is distinct from explicit completion, quiz performance and practical work; the existing product completion requirements remain unchanged.
- Account/child/course record IDs provide stable joins. Observed enrollment provenance comes from existing subscription, manual-payment, invitation, free and lifetime authorities. Recording a learning row never creates access. Expiry retains the learner's historical records.
- Personal notes use one current implementation for all four areas, with device-scoped drafts, explicit cloud confirmation, stable command IDs and revision conflicts. Both sides of a conflict remain visible. A stale earlier browser cannot overwrite newer canonical notes through the original public writer. Private note revisions remain available in the learner's export.
- A background cloud refresh cannot discard unsaved in-memory work when browser storage is unavailable. That condition is reported explicitly. Same-account session replacement retires old callbacks and retries the retained operation safely.
- Reading position is stored independently of completion, per learner/course/lesson/locale. Returning to it is explicit; scroll never implies learning or mastery.
- Existing public progress/notes are retained. Known existing facts are backfilled without inventing historical attempts, original enrollment dates, source versions or mastery. Known original timestamps remain in the fact snapshot. Unknown local activity ownership is not reassigned.
- New Academic/Technical command attempts preserve submitted work, canonical outcomes and source hashes. Immutable private content versions preserve the corresponding materials/answer keys. AI quiz attempts retain locale, source version and stable receipt IDs; retries return the original grade. Kids grading persists the exact server-graded, hash-verified source before confirmation. Personal records never expose another child's or another account's data.
- `my-learning` presents records, history, submitted work/recorded grades, personal notes and JSON export. The existing localized curriculum progress cards remain in place. Private sharing rows support future progress/assessment joins to a named viewer/institution; no teacher or institution dashboard or broad read permission is activated here. Notes are not part of that sharing scope.

## Report accounting

- Funding reuses the existing package source, regardless of payment method. Course/child suffixes normalize to the package identity. A package cannot obtain two reports separately for each course or child.
- Monthly windows reuse the installed anniversary calculation, including month-end clamping. Free sources and invitations use their existing activation anchors. Lifetime course report eligibility follows lifetime access beyond the first-month question bonus. This policy applies two monthly reports to every eligible package source, including free/lifetime sources; it changes neither prices nor question balances.
- Reserve/finish use the existing account lifecycle lock. Identity/account checks run after locking. Concurrent reservations include active leases in the two-report cap. Failed generations release capacity; expired claims are fenced; replaying a completed request neither calls a provider nor consumes another report. A retry identity survives reloads when browser storage is available.
- Reports exclude personal notes, drafts and submitted free text. They receive only scoped recorded outcomes, evidence timestamps and version/coverage metadata. The latest 250 relevant facts per course are bounded and explicitly labelled with their total count. Missing evidence remains unknown. A model narrative is not a teacher-certified grade, verified skill mapping or proof of competence.
- Learner/record UUIDs are omitted from the provider prompt. Child processing requires the current profile consent both when reserving and when accepting a finished report.
- Provider output is schema-validated. A report is shown as ready only after its server receipt is saved. Failed provider attempts also share the existing server rate-limit mechanism; they do not consume assistant questions.

## Privacy and compatibility

New tables live in the existing `learning_private` schema, with RLS and no direct learner table grants. Narrow authenticated commands use the verified identity; only service endpoints may archive canonical content or settle a report. Existing private Kids invoker bridge permissions are preserved. Parent ownership and deletion/risk blocking remain authoritative. Account/child foreign keys cascade notes, revisions, commands, positions, events, sharing and reports. Immutable curriculum versions contain author content rather than learner work.

The package reuses the specifically audited shared-drive student recovery, quiz and locale transition improvements. Prior snapshots are not copied wholesale and no archived packet or unrelated stage work is modified.

## Release boundary

Implementation is on `codex/student-learning-records-20261102` based on `da608a49fff44b66478ad054811f45dd1f92e6ab`. This document does **not** assert a production migration, merge, deployment, live login test or paid provider call.

Release order after review: apply the single native Drizzle migration `0031_student_learning_records` through the existing project runner; deploy the modified `kids-lesson-content` function; synchronize the main project source and publish the frontend. Update the actual production roadmap item as part of that approved release. The local roadmap marker explicitly records the pending database update.

Before declaring phase 2 accepted on live, verify ordinary learner and parent accounts across two devices, offline/reconnect and two-note-device conflict; exercise all four locales and curriculum areas; verify report generation against the real deployed provider and the two-report cap. Local verification uses isolated PostgreSQL and controlled provider/identity fixtures. The existing external shadow-read harness is not claimed as tested by the standard local config.

Rollback should preserve learner history and the additive tables. Restoring only an earlier frontend after new canonical note edits is unsafe without reviewing its note writer: the compatibility guard deliberately rejects divergent older writes. Never delete notes, grades, payments or learning events to roll back presentation.
