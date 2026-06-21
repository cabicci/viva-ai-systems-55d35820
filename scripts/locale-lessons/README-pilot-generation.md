# Locale pilot generation (Phase 2G)

GitHub Actions workflow: `.github/workflows/locale-pilot-generation.yml`

## Trigger (later — Lovable backend only)

Lovable will trigger this workflow later using its **existing** GitHub repository dispatch secret/token. The trigger must stay **backend/server-side in Lovable** — never expose the token or dispatch endpoint from frontend code.

Supported GitHub entry points:

- `workflow_dispatch` (manual / admin)
- `repository_dispatch` with event type `locale-pilot-generation`

Example `repository_dispatch` payload (Lovable backend):

```json
{
  "event_type": "locale-pilot-generation",
  "client_payload": {
    "target": "all",
    "count": 10,
    "mode": "pilot"
  }
}
```

## Workflow behavior

1. Checks out the repo and installs dependencies with Bun.
2. Generates a **capped pilot batch only** (default 10 lessons, max 25) via **OpenAI** — never the full 100-lesson package.
3. Validates localized packages and runs locale-lessons tests.
4. Uploads generated `ar-Gulf` / `en` pilot output as a workflow artifact.
5. Does **not** commit generated JSON or push to `main`.

## Local script

```bash
bun run locale-lessons:generate-pilot -- --target all --count 10 --mode pilot
```

Requires `OPENAI_API_KEY` in the environment. Optional: `LOCALE_ADAPTATION_MODEL` (defaults to `gpt-4o-mini`).

Sample generation (`locale-lessons:generate-samples`) still uses Anthropic when `ANTHROPIC_API_KEY` is set.

## Secrets expected in GitHub

| Secret / env | Required | Purpose |
|--------------|----------|---------|
| `new_openai` → `OPENAI_API_KEY` | yes (pilot workflow) | OpenAI contextual adaptation |
| `LOCALE_ADAPTATION_MODEL` | no | Override default OpenAI model (`gpt-4o-mini`) |
| `ANTHROPIC_API_KEY` | no (pilot path) | Only for local sample generation via Anthropic |

Do not print secrets in workflow logs. Do not map the OpenAI key to `ANTHROPIC_API_KEY`.
