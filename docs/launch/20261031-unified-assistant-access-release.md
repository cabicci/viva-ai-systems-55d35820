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

The existing AI Edge model now uses the owner's direct OpenRouter connection,
with no Lovable AI Gateway fallback. Its existing Gemini model, a 1,800-token
output limit, timeout and no automatic retry are explicit. Missing direct
configuration fails closed. Existing native Academic/Technical generation and
embedding transports continue using their configured direct OpenAI capability.
No provider credential is stored in this change.

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
   direct embedding/model request. Configure `OPENROUTER_API_KEY` and the
   existing embedding `OPENAI_API_KEY` securely in the target server environment;
   never copy keys into source, chat, fixtures, or a client bundle. Native server
   transports also need their existing direct OpenAI configuration. The current
   local process has no configured provider key and cannot certify this step.
6. Only after those checks may an operator explicitly enable reviewed prepared
   cards/worker policy. The existing trusted-main reconciliation workflow can
   invoke the maintenance endpoint after main CI; the release owner must verify
   its actual target and disabled policy before remote integration. Do not
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
corpus dependencies. No further installs or corpus-loading rechecks follow.
The product guard remains installed. These checks are not described as clean
execution within every retained boundary. Production schema/configuration,
real provider/JWT verification and measured multi-session capacity remain open.
