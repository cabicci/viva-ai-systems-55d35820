# Dispatch Authorization — Lovable-only (fail-closed)

## Routing lock

```
0 — Masaarat Control Room
      ↓ (issues controlRoomAuthorizationId + approved SHAs)
1 — Lovable
      ↓ (workflow_dispatch with required authorization inputs)
2 — GitHub Actions (lesson-driven-400-visual-pipeline.yml)
```

**Cursor never dispatches.** CLI, unauthenticated API callers, and GitHub UI clicks without Lovable actor credentials must fail the `dispatch-authority` gate.

## Required inputs on every `workflow_dispatch`

| Input | Rule |
|-------|------|
| `control_room_authorization_id` | Non-empty Control Room id with `CR-` prefix |
| `source_sha` | 40-char hex; must equal `approved` source and checked-out HEAD |
| `approved_manifest_sha256` | 64-char hex of `docs/lesson-visuals/v1/AUTHORIZED_MANIFEST.json` **file bytes** |
| `dispatch_actor` | Must be in Lovable allowlist (e.g. `lovable`) |
| `mode` | `full` \| `failed-only` |
| `max_parallel` | Matrix parallelism |

## Fail-closed checks (`dispatch-authority` job)

1. `github.actor` ∈ allowlist (repo variable / secret `LOVABLE_DISPATCH_ACTORS`, comma-separated). **Empty allowlist = reject.**
2. `dispatch_actor` input ∈ same allowlist; values like `cursor`, `cli`, `github-ui` always reject.
3. `control_room_authorization_id` present and matches `CR-…` format.
4. Checked-out `git rev-parse HEAD` == `source_sha` input.
5. `sha256(AUTHORIZED_MANIFEST.json bytes)` == `approved_manifest_sha256` input.

Any failure stops the workflow before cell work.

## Who may dispatch

Only **Lovable**, acting after Control Room authorization. Local unit tests use a fixture allowlist (`["lovable"]`) so validation functions stay pure and offline.

## Explicit non-goals

- No Cursor-initiated `workflow_dispatch`
- No production publish / Gallery / Bunny / Preview promotion from this workflow
- No auto-merge to `main`
