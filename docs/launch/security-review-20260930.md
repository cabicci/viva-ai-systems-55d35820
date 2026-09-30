# LC-08 / LC-35 — available security review, 30 September 2026

Scope: the remaining RAG direct-read gate, installed dependency advisories,
and the existing auth, grounding and server-boundary regression tests. This
does not reopen accepted media/content/payment acceptance. The owner declined
installing Codex Security; no result from that plugin is claimed.

## Dependency remediation

The initial `bun audit --json` returned findings for 16 package names,
including critical Seroval deserialization and the affected TanStack server
adapter. The upstream advisories are:

- <https://github.com/lxsmnsyc/seroval/security/advisories/GHSA-mv8w-475r-vwqw>
- <https://github.com/TanStack/router/security/advisories/GHSA-9m65-766c-r333>

Update affected compatible transitive versions and Vite/Vitest within their
existing major ranges. Explicit Bun overrides resolve the pinned transitive
server adapter to `1.167.30`, Seroval to `1.6.8`, Undici to `7.29.1`, WebSocket
to `8.21.0`, Sharp to `0.35.4`, and esbuild to `0.28.1`. Preserve the existing
pnpm `entities` override. These two 0.x tool changes require build/compatibility
verification; they are not interpreted as no-risk patch releases. The base
React Start/Lovable integration versions remain fixed. No credential rotation,
secret inspection, payment, corpus indexing or Kids source edit occurs.

The first build exposed a compatibility mismatch: forcing the minimum patched
Seroval 1.5.3 removed the `isStream` export required by the resolved plugin.
The targeted correction uses the previously resolved, patched 1.6.8 version;
the final build and frozen-lockfile install must validate that correction.

The post-remediation audit returned `{}` and exit 0 on 30 September.
This proves no findings in that registry response for the candidate lockfile;
it is not proof that the application contains no vulnerabilities. Reproduction:
`bun install --frozen-lockfile` followed by `bun audit --json`.

## Direct corpus access

Read-only production catalog evidence:

- `knowledge_chunks` has RLS enabled. Its only policy is SELECT for
  authenticated users with `has_role(auth.uid(), 'admin')`.
- `anon` and `authenticated` have table SELECT grants. RLS still denies
  ordinary learner rows; table privilege alone is not access to the corpus.
- Both `match_knowledge_chunks` and `match_locale_knowledge_chunks` deny EXECUTE
  to anon/authenticated and permit service role.

The new isolated PostgreSQL test applies the actual shipped
`20260926180000_rag_corpus_admin_select_only.sql` twice. It proves anonymous
and ordinary learner direct reads return no rows, a forged admin JWT claim
does not replace the database role assignment, genuine administrator/service
reads work, and learner mutations are denied. It reads no production content
and does not reindex, run an assistant question, or change live policies.
The fixture uses a minimal corpus/auth-role foundation; it does not rehearse
the complete vector schema or a browser session against production.

## Validation and disposition

59 focused tests passed across seven files: the new corpus policy, existing
RAG migration/grounding security, server boundary hardening, signup/recovery
email localization and initial Auth session. The corrected Seroval 1.6.8 build passed with the existing 6 GB Node heap.
TypeScript, changed-file lint/format and four synthetic key-custody utility
tests passed. CI includes the corpus policy, key conversion and advisory gate.
Exact-head CI receipts must be recorded in the PR before merge. A local result is not a merged/deployed result.

The dependency findings have a concrete code/lockfile remediation. No known
unresolved dependency P0/P1 is present in the final audit response. The old
account-deletion flow remains a separate unresolved design/runtime gate in
PR #53; its request-only draft is not final erasure. Do not declare broad
security acceptance or commercial GO from this document. The final manual
round covers the changed sign-in/session/routing runtime on the published
candidate. Keep Stripe TEST and Kids changes paused.
