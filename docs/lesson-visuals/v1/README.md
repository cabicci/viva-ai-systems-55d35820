# Lesson-driven 400-visual pipeline (v1)

Authoritative production scope: **100 lesson masters × 4 locales = 400 cells**.

There is **no** authoritative 12-asset pilot. Do not invent subset modes.

## Scope

| In scope | Out of scope |
|----------|--------------|
| Master briefs from locale packages | Arbitrary cell/lesson subsets |
| Authorized 400-cell manifest | Invented 12-asset pilot |
| Provider-neutral production adapter contract | Cursor / local workflow dispatch |
| Offline dry-run mocks / fixtures for tests | Paid image generation in this candidate |
| Receipts, mappings, rights, validation artifacts | Auto-commit to Gallery / main / Bunny |
| Budget/quota fail-closed gates | Legacy visual asset reuse |

## Locales

| Locale | Package source |
|--------|----------------|
| ar-EG | `src/components/intro/lessons/{id}.ts` |
| ar-MSA | `src/lib/locale-lessons/ar-MSA/lessons/{id}.json` |
| ar-Gulf | `src/lib/locale-lessons/ar-Gulf/lessons/{id}.json` |
| en | `src/lib/locale-lessons/en/lessons/{id}.json` |

## Layout

```
docs/lesson-visuals/v1/
  README.md
  CONFIGURATION.md
  DISPATCH_AUTHORIZATION.md
  schemas/
  masters/                 # exactly 100 *.master.json
  AUTHORIZED_MANIFEST.json # exactly 400 cells
  ledgers/

src/lib/lesson-visuals/v1/
  constants.ts             # AUTHORITATIVE_BASE_SOURCE_SHA
  production/              # provider contract, budget, validation, receipts
  dispatch/
  adapters/                # method adapters (authoring / local)
  scripts/                 # repin_source_sha, preflight, cell, aggregate
```

## Authoritative base pin

Masters and the authorized manifest are deterministically pinned to:

`1041fae1a6db81c1cfdcb4f7904850df418b93b3`

Never pin to a candidate tip SHA (circular). Repin / validate:

```bash
bun run lesson-visuals:repin
bun run lesson-visuals:repin:check
```

## Supported workflow modes

`.github/workflows/lesson-driven-400-visual-pipeline.yml` is **workflow_dispatch only**.

| Mode | Behavior |
|------|----------|
| `full` | Entire 400-cell matrix |
| `failed-only` | Same 400-cell matrix; skip cells with fingerprint-matched ACCEPTED receipts |

Smallest valid production scope: the **full 400-cell** authorized matrix.

## Lovable-only dispatch

Control Room → Lovable → Actions. Cursor/CLI/unauthenticated sources fail closed.
See `DISPATCH_AUTHORIZATION.md` and `CONFIGURATION.md`.

**Do not dispatch from Cursor or local scripts.**

## Provider adapter contract

Typed request/response in `src/lib/lesson-visuals/v1/production/`:

- Rejects missing credentials, unexpected provider identity, empty bytes, URL-only without secure fetch, MIME spoof, wrong dimensions, malformed metadata, missing request IDs, cost over ceiling, identity/locale mismatch, incomplete rights, checksum mismatch
- **dry-run**: offline mock transport (no network)
- **production**: mock transport rejected; paid network generation is not enabled in this candidate

## Artifacts (per cell / per run)

| Artifact | Path pattern |
|----------|----------------|
| Output bytes | `artifacts/cells/{cellId}/output.png` |
| Receipt | `artifacts/receipts/{cellId}.receipt.json` |
| Mapping (accepted only) | `artifacts/mappings/{cellId}.mapping.json` |
| Rights | `artifacts/rights/{cellId}.rights.json` |
| Output validation | `artifacts/validations/{cellId}.validation.json` |
| Aggregate report | `artifacts/qa/aggregate-validation.json` (+ `.sha256`) |
| Run summary | `artifacts/qa/run-summary.json` |

Accepted receipts and mappings are 1:1. Failed cells produce failure artifacts and **no** mapping.

## Greenfield / no-legacy

- Fresh generation only; `prohibitedLegacySource` must be `false`
- Workflow never publishes to Gallery, Bunny, Lovable runtime, or production storage

## QA / launch sequence (expected)

1. Independent read-only QA of candidate vs base `1041fae1…`
2. Configure GitHub variables/secrets (see `CONFIGURATION.md`) — **not assumed present**
3. Lovable-only `workflow_dispatch` with Control Room authorization (after config proven)
4. Manual serialized promotion stage (separate; not this workflow)

## Scripts

```bash
bun run lesson-visuals:validate
bun run lesson-visuals:test
bun run lesson-visuals:repin:check
```
