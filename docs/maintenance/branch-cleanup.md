# Reviewed branch cleanup

The current workflow is limited to the 112 exact branch names, head SHAs and
preservation proofs in `branch-cleanup-2026-10-10-batch2.json`. A fixed digest
rejects any expanded or changed target list. The review covered all 496 branches,
all 171 pull requests and all 28 current workflows at main
`e989902e4e70025d0d6c96b36b38d71ccc5e527e`.

The earlier 104-target batch completed in Actions run 37995134613. Its manifest
and tests remain for historical evidence; the current workflow does not rerun it.
Batch 2 includes 56 heads already ancestral to main and 56 exact heads of merged
PRs. For a squash merge, the runner verifies the same-repository PR, exact head,
base main, merged state and reviewed merge SHA, then verifies that merge SHA is
ancestral to current main. An authenticated Git read independently confirms that
the exact original head remains in `refs/pull/NUMBER/head` before any deletion.
Those retained refs plus saved names and SHAs permit restoration of squash heads.

The owner requested cleanup using the GitHub plugin and GitHub Actions. One
automatic deletion run is limited to a push changing this workflow whose prior
main is exactly `e989902e4e70025d0d6c96b36b38d71ccc5e527e` and whose commit title
starts with `chore: execute reviewed branch cleanup batch 2`. Later pushes cannot
reuse the trigger. PRs run offline safety tests with contents-read permission;
they cannot delete branches. No production publication is part of this change.

Manual execution: **Actions → Clean reviewed merged branches → Run workflow**,
branch **main**, mode **delete**, confirmation `DELETE MERGED BRANCHES`.
Default **preview** mode performs no deletion. The runner cannot discover or add
new deletion targets, merge work, change settings, or activate payments.

Each run saves its complete preflight and recovery manifest as a 90-day Actions
artifact before deletion can start. If upload fails, deletion cannot start.
Before each deletion it rechecks current main, the exact branch head, protection,
open PRs using it as head or base, unfinished Actions, active/unresolved
deployments, workflow references and preservation proof. Changed, protected,
unmerged or in-use branches are skipped. Unexpected errors or a moving main stop
the job; partial results are retained.

Git deletes with `--force-with-lease=refs/heads/NAME:EXPECTED_SHA`, preserving any
intervening commit. No retry follows a rejected or uncertain mutation. Successful
transport acknowledgement is saved before an independent authenticated Git
`ls-remote` absence check. Read failures never count as absence. The final
artifact distinguishes deletion from successful verification.

The job uses only the short-lived repository `GITHUB_TOKEN`, with contents-write
and Actions, PR and deployment read. It requests no passwords or new credentials.
Credentials enter child-process environments, never URLs, arguments or logs.

The active drafts #165, #60 and #52, 301 independent media-evidence branches,
one Academic workflow-source branch and 78 unproved independent branches are
outside the 112-target scope. Nine Lovable sync heads that are wholly ancestral
to main are explicitly included; other sync heads remain outside the scope.
External work absent from GitHub PR, workflow or deployment records cannot be
detected. No acceptance test or production verification is implied by cleanup.
