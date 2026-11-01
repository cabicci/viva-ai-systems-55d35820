# Unified assistant and scheduled access candidate

This candidate starts at Lovable `f12d0ff6daa70eaa303fc8ca9d4968a72529e774`,
which contains main `14007da6b36557416d4703e9429cd7e2a3e8e1ac`.
It ports reviewed local assistant/currentness changes and free-access commit
`bc503df8812592b860fb892af2a1afc038508adc` through three-way source comparison.
It preserves the current Live payment, offer, portal, risk-hold and consent code.
The exact deployed commit remains unconfirmed. This is a review candidate;
publication and real model/signed-session acceptance are outstanding.

## Resulting behavior

The existing AI, Academic, Technical and Kids lesson engines retain their shared
assistant entry, account/card/profile/locale history and access adapters. The
floating AI entry was exercised through the actual course mount, common
conversation and guarded SDK helper in desktop/mobile Chrome with explicit
fixture authentication and answers. Old async work cannot adopt a new account,
child profile, locale or lesson incarnation. Citations retain chunk/citation IDs.

Approved database source changes enter the existing automatic-preparation queue
through a metadata outbox. Per-card source epochs invalidate stale leases; source
withdrawal closes runtime and prevents stale vector retrieval. Finish readback
matches the exact job, request, offset and receipt, so a lost acknowledgment does
not imply another provider attempt. This does not approve sources or replace the
indexing engine. AI packages still follow the existing compiled release workflow.

Administrators may select multiple current paths/curricula and one fixed Cairo
start/end interval shared by verified registered accounts. Installation creates
no interval. Publication, guardian/child consent, account suspension/deletion,
Live risk holds and AI quotas remain separate mandatory gates. Open Kids delivery
rechecks the protected gate on campaign expiry and retires the old request;
independently paid families remain open. Failed reads close campaign access.

The AI Edge reuses the existing direct OpenAI connection and `OPENAI_API_KEY`
for embeddings and grounded answers. Generation follows the established native
`gpt-4.1-mini-2025-04-14` Chat Completions contract: temperature 0.2, 1,800 output
tokens and a 30-second timeout. Edge answers retain their existing text format;
no server-only or corpus module is imported into the Edge transport. There is
no provider fallback or automatic retry. No new provider account/key is needed.
OpenRouter in original01e613df was an implementation assumption, not a verified
human-selected connection; prior wording claiming an owner's OpenRouter
connection is superseded here. No provider credential is stored in this change.

## Database release order

1. Pin the reviewed candidate and target database. Production is
   `abyqqeboyrkkwhjpwmtd`; the independently checked staging database is
   `rifujqqlqtfmopaukghn` in Lovable project
   `0d675f0a-ecc5-4c62-9217-54973c927902`. Never rely on application fallbacks
   to select staging. Capture target-specific schema/function preimages and a
   recoverable backup before any separately authorized permanent release.
2. Verify cumulative commerce, email access, LC09, Academic native assistant,
   service-role guard and existing locale-index prerequisites. Historical
   Supabase and Drizzle entries overlap: do not replay both systems. Do not
   recreate existing content, users, completed import sessions or vectors.
3. Apply the reviewed Drizzle `0026_assistant_source_events_and_free_access`
   migration exactly once through the established migration mechanism. It
   assembles nine SHA-pinned SQL sources in one transaction. The preflight
   rejects missing prerequisites and partial prior installations rather than
   stacking wrappers. `scripts/release/unified-assistant-migration-sources.json`
   records the exact inputs. The assembler only writes source and never
   connects to a database. The original candidate scripts must not also run.
4. Installation leaves native card runtime and automatic preparation disabled
   and creates empty free-access tables. It adds nullable Academic embedding
   provenance, preserving existing vectors and the existing retrieval endpoint.
   Review/reindex approved sources under their actual ownership before running
   the separate Academic index activation candidate. Missing provenance is not
   permission to label old vectors as verified or to regenerate them blindly.
5. Verify the matching server/Edge implementation with legitimate test accounts,
   real permissions, source/version/language/citations and a small approved
   direct embedding/model request. Reuse the existing `OPENAI_API_KEY` securely
   in each authorized target server/Edge environment;
   never copy keys into source, chat, fixtures, or a client bundle. Native server
   transports also need their existing direct OpenAI configuration. No local fixture test certifies the configured target credential or real model.
6. Only after those checks may an operator explicitly enable reviewed prepared
   cards/worker policy. The existing trusted-main reconciliation job is explicitly default-off.
   Only an owner/operator may set repository variable
   `MASAARAT_ASSISTANT_INDEXING_RELEASE_ENABLED` to exact string `true`, after
   verified production publication and target/policy review. Missing/false
   values skip scheduled, workflow-run and manual invocations alike. This
   release gate preserves the original repository/main/OIDC guards and actual
   indexing implementation; merging code does not activate the job. Do not
   create/set that variable during staging or pre-release integration. Do not
   activate an offer, change dates, start mail, or resume cancelled schedules
   as part of merging this code.

The staged rehearsal applied this exact migration and exercised actual pgvector,
source epoch/withdrawal, queue receipts and SQL-role ACLs inside transactions,
then rolled everything back. Synthetic SQL role claims, supplied vectors and an
executor receipt were clearly labeled. They are not signed JWT, real embedding,
model, live worker, or site concurrency evidence.

## Owner publication sequence

ROOT owns remote push, PR, CI and merge. Review the exact source head and target
head again before merging; changed heads require reconciliation. After matching
database, provider and legitimate-session verification, the human owner opens
the existing Lovable project, confirms GitHub synchronization to the reviewed
merge revision and publishes from inside Lovable. This chat does not publish.
Verify the published revision and real learner journeys afterward before
creating or enabling a campaign. No arbitrary visitor capacity is certified.

## Preservation and rollback

The shared dirty checkout, sealed previous RAG candidate and free-access worktree
are retained. Unselected student/Quiz packages and three local media corrections
remain held with provenance; this change does not silently release them.

Before a permanent migration, record exact installed function definitions,
constraints, grants and source/runtime policies. The staged preimages in the
evidence folder are staging evidence, never production restoration instructions.
If rollout fails, first disable the newly enabled worker/cards and stop only
campaign IDs actually created for this release through their version-checked
administrator command. Restore the previously reviewed application revision.
Keep additive tables, receipts, source events and vectors for reconciliation;
do not drop tables, delete history, replay uncertain provider work or reset leases.
Restoring any previous function requires fresh postimage matching and the exact
target's preimage. A source rollback does not roll back database state.

## Validation and limits

Saved evidence is under the owning chat's
`OUTPUTS/UNIFIED-LAUNCH-20261031T105501Z-fadd50b0` folder. It includes actual
source maps, initial failures, fixes, full normal TypeScript checks, existing
build guard and production Vite build results, current commerce/free-access
rehearsal, source/receipt staging checks and Chrome fixtures with screenshots.
The Windows dependency cache required invoking Vite's existing entry directly
after Bun could not resolve its executable wrapper. No build was deployed.

Two constraint exceptions are explicitly retained in the evidence: an isolated
test dependency installation without an explicit override of the no-install
restriction, and execution of an original build guard that loaded excluded
corpus dependencies. Subsequent explicit owner authorization permitted the necessary isolated
content-loading checks; it does not erase either historical exception. No new
installation was needed for this follow-up. The product guard remains installed.
The staging safety child passed a full build/typecheck with explicit public
fixtures, plus8 target-guard tests and compiled chunk inspection. The subsequent
common correction passed150 provider/handler/release-gate fixtures, the8
combined staging target tests and full TypeScript. These are local fixtures,
not configured-provider, signed-session or deployment evidence. Production schema/configuration,
real provider/JWT verification and measured multi-session capacity remain open.
