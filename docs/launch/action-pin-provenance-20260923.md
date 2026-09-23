# Workflow action pin provenance — 23 September 2026

The seven upstream refs below were resolved using read-only `git ls-remote`
against each upstream repository before replacing workflow `uses` entries.
`supabase/setup-cli@v1` is an upstream branch, with the same commit as its
`v1.7.1` tag at the time of resolution. This is a snapshot, not a claim that
future upstream tags or branches remain at the same commit.

| Existing ref | Verified upstream commit |
| --- | --- |
| `actions/checkout@v4` | `11d5960a326750d5838078e36cf38b85af677262` |
| `actions/download-artifact@v4` | `d3f86a106a0bac45b974a628896c90dbdf5c8093` |
| `actions/setup-node@v4` | `49933ea5288caeca8642d1e84afbd3f7d6820020` |
| `actions/setup-python@v5` | `a26af69be951a213d495a4c3e4e4022e16d87065` |
| `actions/upload-artifact@v4` | `ea165f8d65b6e75b540449e92b4886f43607fa02` |
| `oven-sh/setup-bun@v2` | `0c5077e51419868618aeaa5fe8019c62421857d6` |
| `supabase/setup-cli@v1` | `ab058987d8d6c725971f6cf9d0b5c98467e30bd1` |

CI installs pinned `PyYAML==6.0.3` after a pinned `actions/setup-python`
action, runs focused positive/negative tests, and then parses every workflow
as YAML to reject any external `uses` reference that is not a full commit SHA.
The parser sees compact flow mappings and reusable job workflows as well as
ordinary step mappings. Local tests are not a substitute for a PR CI run.
