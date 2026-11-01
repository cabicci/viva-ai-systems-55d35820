# Read-only deployment-readiness report (no implementation)

This file only holds the diagnosis report, because plan mode requires one. It proposes no new work.

| # | Check | Evidence | Status |
|---|---|---|---|
| 1 | Backend binding | `supabase/config.toml` project_id = original ref; all queries ran against it. The staging ref was not referenced. | Verified (original) |
| 1b | Source head | Local HEAD 852ddfa5 / tree 39a1b3fb, matching the merge you gave | Verified |
| 2 | Admitted-source-ID fix in source | Present in `supabase/functions/assistant-runtime/{index,handler,direct-model,answer-contract}.ts` | Verified (source) |
| 2b | Deployed assistant-runtime revision | No read-only revision or hash facility was available, and I made no invoke | Unverified |
| 3 | Active shared index/release | 1 current release row, 2 index versions, 4917 knowledge chunks, 4128 card chunks. I did not compare these to the reviewed lesson content | Counts verified; match unverified |
| 4 | Control RPCs/schema | Present: activate_rag_index_version, assistant_auto_register/claim/finish/status, card_assistant_match, academic_rag_match, assistant_card_content_access. Latest applied migration 20261021120000 = newest in repo | Verified applied; no missing migration found |
| 4b | Student persistence/auth tables | Listed in the database (lesson_progress, user_lesson_status, academic_progress, etc.). I did not check their policies one by one | Partially verified |
| 5 | Auto-indexing endpoint/identity | Workflow file `assistant-auto-index.yml` exists; assistant_auto_jobs has 0 rows. I did not check the deployed endpoint or identity | Unverified |

## Remaining application steps
- Confirm which assistant-runtime revision is deployed. Redeploy only if it predates the fix (needs your explicit approval).
- Compare the active release against reviewed content, using a read-only content-hash check.
- Check the trusted indexing endpoint and identity before you re-enable the workflow.
- Publish the website (your decision).
