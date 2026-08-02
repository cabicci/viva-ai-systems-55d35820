## Independent Full Project Audit — Read-Only (CR-LOVABLE-INDEPENDENT-FULL-AUDIT-20260802-01)

Scope confirmed: inspection + non-mutating validation only. No edits, no commits, no publish, no DB mutation, no Billing/RAG/assistant invocation, no secret exposure.

### Pre-flight identity note (already observed, read-only)
- Lovable workspace branch: `edit/edt-0f8bad60-a411-4d55-ab3c-b5bbe950f483`
- HEAD: `4512d9c18fb385f9158ce3392c7e0553bd97d13b`
- Sandbox `origin/main` resolves to the same SHA, ahead/behind `0/0`, clean tree — meaning the sandbox mirror does not independently evidence GitHub `main` (reported `2800792c…`). Real drift will be established by querying GitHub's API for `main` and comparing, and reported as INSUFFICIENT EVIDENCE where the API is unavailable.

### Step 1 — Identity and drift
Record workspace branch/HEAD, GitHub `main` SHA via read-only API, merge base, ahead/behind, working-tree state, changed paths, Preview identity (served build), Production identity (`masaarat.ai` read-only fetch), backend project ref. Explicitly separate "evidenced" from "assumed".

### Step 2 — Safe validation commands
Run and record exact command, exit code, verdict, output excerpt, artifacts produced:
- `bun install --frozen-lockfile --dry-run` (lockfile consistency)
- `tsgo` type check
- `bun run lint` (no `--fix`)
- `bunx prettier --check .`
- `bun run test:run` (unit)
- localization + curriculum checks (`check:curriculum`, `locale-lessons:validate-localized`, `lesson-visuals:validate`, `controlled-visuals:test-static`)
- `bun run build` (production build)
- dependency vulnerability scan
- Supabase linter + read-only catalog/schema queries
Any script that could reach Production, a provider, or mutate is skipped and reported BLOCKED with the reason.

### Step 3 — Full static review
- **Security/privacy**: auth + redirect handling, fail-open paths, RLS coverage, GRANTs, SECURITY DEFINER `search_path`/ownership, anon exposure, client-side secrets, XSS/unsafe HTML/URL, CORS, rate limiting, PII logging.
- **Billing/entitlements**: `src/lib/entitlements.ts`, generated types, lesson/account gates, the seven public Billing wrappers, private schema boundaries, migration ordering, legacy subscription classification, fail-closed correctness, over-grant vs over-deny risk.
- **RAG/assistant** (static only): reservation integration, wrapper usage, locale isolation, citation contract, release/error paths, quota-leak and unreleased-reservation risk.
- **App correctness**: login/post-login navigation, dashboard skeleton, protected routes, lesson gates, async races, caching/staleness, null handling, responsive/a11y, broken routes/assets, ar-EG/ar-MSA/ar-Gulf/en localization, RTL handling, hardcoded strings.
- **Engineering/release**: dead/duplicated code, unsafe casts, config drift, test gaps, CI gaps, env contract, migration safety, observability, rollback limits, docs-vs-behavior mismatch.

### Step 4 — Lovable-branch impact assessment
Each changed path classified SAFE TO RETAIN / REQUIRES REWORK / REJECT / GENERATED-NOISE / INSUFFICIENT EVIDENCE, with behavioral effect, security+Billing effect, duplication/conflict with merged work, covering tests, smallest safe disposition. Special attention to Login, Dashboard, `entitlements.ts`, generated Supabase types. Nothing copied or merged.

### Evidence format
Each finding: ID, severity, confidence, exact file/line-range or component, reproducible evidence, actual impact, location (origin-main / Lovable-branch-only / Production-only / unlocatable), smallest correction, required tests, conflict risk with Billing/RAG/other audits. Deduplicated by root cause; no speculation reported as confirmed.

### Deliverable
One in-chat report with all sixteen required sections, including rejected false positives, prioritized remediation sequence (not implemented), the first smallest bounded remediation batch, and the zero-mutation attestation, ending with exactly one marker:
`LOVABLE_INDEPENDENT_FULL_AUDIT_COMPLETE` or `LOVABLE_INDEPENDENT_FULL_AUDIT_BLOCKED`.
