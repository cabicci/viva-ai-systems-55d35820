# Lesson-driven 400-visual pipeline (v1)

Fresh candidate pipeline: **100 lesson masters × 4 locales = 400 cells**.

This tree documents authoring contracts only. It does **not** ship production assets.

## Scope

| In scope | Out of scope |
|----------|--------------|
| Master briefs from locale packages | Generating the final 400 assets locally |
| Authorized 400-cell manifest | Dispatching GitHub Actions from authoring |
| Local validators + fixture adapters | Paid AI generation |
| Skip/retry receipts | Auto-commit to Gallery / main / Bunny |
| Method decision + rights ledgers | Legacy visual asset mutation |

## Layout

```
docs/lesson-visuals/v1/
  README.md
  schemas/          # master, manifest, receipt JSON Schema
  masters/          # exactly 100 *.master.json
  AUTHORIZED_MANIFEST.json
  ledgers/          # method, screenshot rights, factual evidence

src/lib/lesson-visuals/v1/
  types.ts
  fonts/            # vendored Tajawal (validators only — never Segoe UI)
  adapters/         # deterministic / screenshot / ai / hybrid
  validators/
  receipts/
  scripts/          # author_masters, validate_local, build_manifest
```

## Methods (no quotas)

1. **Deterministic SVG** — processes, systems, comparisons, decisions, data relationships
2. **AI text-free illustration** — conceptual scene only; paid refused without auth id + cost ceiling
3. **Authentic screenshot** — only with package Screenshot intent + allowlisted Masaarat public URL
4. **Hybrid** — illustration base + deterministic labels from locale packs

If a package has screenshot intent but no safe public Masaarat URL, fall back to method 1 or 4 and record `assessed-not-used` in the screenshot rights ledger.

## Locales

| Locale | Package source |
|--------|----------------|
| ar-EG | `src/components/intro/lessons/{id}.ts` (block TS for all paths) |
| ar-MSA | `src/lib/locale-lessons/ar-MSA/lessons/{id}.json` |
| ar-Gulf | `src/lib/locale-lessons/ar-Gulf/lessons/{id}.json` |
| en | `src/lib/locale-lessons/en/lessons/{id}.json` |

Arabic labels and alt texts **must** come from each locale package — never English literal translation.

## Banned chrome labels

Reject: `Core idea`, `Option A/B`, `Before/After`, `Step 1/2`, `Input/Check/Output`, empty cards.

## Checksums

Master `checksum` = SHA-256 of canonical JSON **without** the `checksum` field.

## Workflow

`.github/workflows/lesson-driven-400-visual-pipeline.yml` is **workflow_dispatch only**.

- Inputs: `source_sha` (required), `mode` (`full` \| `failed-only`), `max_parallel`
- Matrix over immutable authorized manifest (400 cells, `fail-fast: false`)
- Skip only on valid `ACCEPTED` receipt fingerprint match
- Emits comparison sheets, contact sheets, ledgers, QA artifact + sha256 sidecar
- **Never** auto-commits mappings / Gallery / main / publish
- Promotion to production is a **separate manual/serialized** stage after approval

## Scripts (Bun)

```bash
bun run lesson-visuals:validate
bun run lesson-visuals:test
```

## Fonts

Validators measure text with vendored **Tajawal** under `src/lib/lesson-visuals/v1/fonts/`. Segoe UI is forbidden for validation.
