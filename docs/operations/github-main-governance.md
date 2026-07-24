# GitHub `main` governance — P0

**Authorization ID:** `CR-PG-GITHUB-GOVERNANCE-20260724-01`  
**Repository:** `cabicci/viva-ai-systems-55d35820`  
**Authorized live `main` at creation:** `6202e9ef8f7dc2f3c1266d3c0812015fd8557447`  
**Owner of this contract:** repository administrator `@cabicci`

This document describes the authorized Production-governance controls for the default branch. It does not authorize changes to Production hosting, Supabase, Lovable, Cloudflare, secrets, variables, environments, backups, staging, or monitoring.

---

## Ruleset identity

| Field | Value |
|---|---|
| Name | `Masaarat main protection — P0` |
| Enforcement | Active |
| Target type | Branch |
| Exact include pattern | `refs/heads/main` |
| Feature branches | Excluded (not matched by the include pattern) |
| Tags | Not targeted |

Only `main` is protected by this ruleset. Feature-branch creation and pushes remain permitted outside `refs/heads/main`.

---

## Pull-request policy

All changes to `main` must occur through pull requests.

Required PR controls:

1. Exactly **one** approving review.
2. Stale approvals are **dismissed** after new commits are pushed.
3. **Code Owner** review is required (see `.github/CODEOWNERS`).
4. The most recent reviewable push must be approved by someone **other than** its pusher.
5. All review conversations must be **resolved**.
6. The exact successful CI check **`verify`** must pass.
   - Workflow name: `CI`
   - Workflow file: `.github/workflows/ci.yml`
   - Job / check-run name: `verify`
   - Integration: GitHub Actions (`integration_id` `15368`)
7. The branch must be **current with `main`** before merge (strict required-status policy).

Do not rename the CI job `verify` without a coordinated ruleset update and a documented check-name drift review.

---

## History protection

| Control | Policy |
|---|---|
| Direct pushes to `main` | Prohibited (including for administrators) |
| Force pushes / non-fast-forward updates | Prohibited |
| Deletion of `main` | Prohibited |
| Merge commits | Supported (linear history is **not** required) |
| Signed commits | **Not** required under this authorization |

Administrators cannot directly push to `main`. Break-glass access is pull-request-only (below).

---

## Emergency bypass

### Sole authorized bypass

| Field | Value |
|---|---|
| Actor category | Verified repository **administrator** role |
| Actor type | `RepositoryRole` |
| Actor ID | `5` (GitHub repository role: admin) |
| Mode | `pull_request` only |
| Direct push | Never permitted |
| Force push | Never permitted |
| Branch deletion | Never permitted |

There must be:

- no `always` bypass;
- no unrestricted administrator exemption;
- no second bypass actor under this authorization;
- no app, team, or unverified-user bypass unless separately authorized by Control Room.

### Permitted emergency reasons (narrow)

Use the PR-only administrator bypass only for:

- critical Production security remediation;
- repository governance recovery;
- CI platform failure preventing an urgent corrective PR;
- verified Production outage where normal reviewers cannot respond.

### Required emergency PR contents

Every emergency PR must include:

- incident or emergency reason;
- affected systems;
- exact commit and diff;
- risk assessment;
- validation evidence;
- rollback steps;
- bypass actor;
- timestamps;
- post-incident review commitment;
- Control Room reference or authorization when available.

### Explicit prohibitions

Do **not** use the bypass for:

- convenience;
- bypassing failed product tests;
- skipping CI because a check is slow;
- merging incomplete work onto `main`.

---

## Ownership and review

| Responsibility | Owner |
|---|---|
| Ruleset configuration | Repository administrator `@cabicci` |
| CODEOWNER for repository paths | `@cabicci` (see `.github/CODEOWNERS`) |
| Periodic ruleset review | `@cabicci` |
| Check-name drift review | `@cabicci` (after any change to `.github/workflows/ci.yml` job names) |
| Collaborator-access review | `@cabicci` |
| Emergency-bypass audit review | `@cabicci` |

Review cadence:

- After any CI workflow rename affecting the `verify` check.
- After collaborator permission changes.
- After any emergency-bypass merge.
- At least once per Production launch closure cycle.

---

## Ruleset recovery (non-destructive)

If the ruleset causes a genuine lockout:

1. Identify the exact ruleset by its **immutable ID**.
2. Capture its full JSON before changing it.
3. Prove the lockout with API evidence (do not force-push).
4. Obtain repository-owner authorization.
5. Disable or delete **only** the affected ruleset by that verified ID.
6. Restore the last verified ruleset contract.
7. Retain PR and audit evidence.
8. Revalidate `main` protection via:

```bash
gh api repos/cabicci/viva-ai-systems-55d35820/rulesets
gh api repos/cabicci/viva-ai-systems-55d35820/rules/branches/main
git ls-remote origin refs/heads/main
```

Direct-push recovery is **not** an approved workflow under this authorization.

---

## Related artifacts

- `.github/CODEOWNERS` — repository ownership map
- `.github/workflows/ci.yml` — source of the required `verify` check
- Authorization: `CR-PG-GITHUB-GOVERNANCE-20260724-01`
