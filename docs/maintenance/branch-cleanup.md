# Reviewed branch cleanup

This manual workflow operates only on the 104 branch names and exact commit SHAs
in `branch-cleanup-2026-10-10.json`. It cannot discover or add deletion targets.
It never merges, publishes, changes repository settings, or deletes files.

After this change is merged, open **Actions → Clean reviewed merged branches →
Run workflow**, keep branch **main**, select **delete**, and enter
`DELETE MERGED BRANCHES`. The default **preview** mode performs no deletion.

Every run first checks all candidates and saves its preflight plus exact SHAs as
a 90-day Actions artifact. If that upload fails, deletion cannot start. Before
each deletion it rechecks the branch, current main, open PRs, unfinished Actions
runs, deployments and workflow references. It skips changed, protected, unmerged
or in-use branches. It stops on an unexpected error or a moving main branch.

Git deletes each ref with `--force-with-lease=refs/heads/NAME:EXPECTED_SHA`.
An intervening commit therefore causes rejection, not deletion of new work.
No retry follows a rejected or uncertain delete. Every successful delete is
independently checked for absence. The final artifact includes partial results
if a later operation fails.

The workflow uses the short-lived repository `GITHUB_TOKEN`, with only contents
write and Actions, pull-request and deployment read. It needs no new stored
credentials. Git credentials are supplied through the child process environment,
never through a remote URL, command arguments or printed transport output.

External unpublished work that leaves no GitHub PR, workflow or deployment
record cannot be discovered by this job. The conservative manifest excludes
Lovable sync, video results, experimental, preservation, rollback, RAG and
recovery branch groups. Coordinate any unrecorded work before deleting its ref.

The deleted heads remain reachable through `main`. If a branch must be restored,
use its saved name and SHA to create that branch again without resetting main.
No production verification is implied by this maintenance workflow.
