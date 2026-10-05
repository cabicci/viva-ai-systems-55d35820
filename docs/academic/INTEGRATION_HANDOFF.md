# Masaarat Academic — current integration handoff

Updated 2026-10-05. This document replaces historical status sections; git history retains them.

## Ownership and delivery boundary

Repository: cabicci/viva-ai-systems-55d35820. Branch: `work/masaarat-academic-20261005`. Current main inspected: `062b5f59dc56fabbce89c2034008fa1d8ef21114`. Recovery register v143 and continuation register v73, modified 2026-10-05 13:05:27Z, supersede historical Technical integration/admin pending items. Those completed platform capabilities are reused, not reopened.

No merge, publication, production migration/settings change, existing media replacement, payment, email or central-chat message was performed. Shared navigation, routes and billing remain central-integration ownership. SQL candidates are intentionally outside `supabase/migrations` and must not be executed as an automatic release.

## Agreed product

Academic is a catalogue of course cards. AC-BUS is its first course, comprising seven subject areas and 40 lessons. Its 2000 planned non-video study minutes (33h20) are a planning estimate, not measured learner time, academic accreditation or university credit equivalence. Reading and assessment can release before remaining videos, once written acceptance gates pass.

One shared account; independent Academic entitlement; base price reads the canonical Pro Plus price catalogue without inheriting Pro Plus rights. The optional assistant is separately subscribed within Academic. Its price and usage allowance are unspecified: no invented product, purchase route or active assistant is introduced.

## Implemented architecture

- Original expanded lesson packages build on committed course briefs and the existing four-locale pilot. Six explanation sections, worked cases, six four-option formative questions, five-field applied tasks with rubrics, FAQs, summaries and three reading visuals per additional lesson. Four contextual locales remain separate review packages.
- Review UI reuses the platform Navbar, Footer, locale controls and curriculum layout; course card opens the curriculum and lessons. The offline review includes answers and must never serve as paid production delivery.
- Production candidate components obtain protected bodies and grades from server commands. Public catalogue RPC exposes only approved course/lesson metadata. Stored account/admin identity, exact locale and active entitlements authorize access. Progress is account-scoped; practice submission is explicitly not automatic academic grading.
- Private workbook download authorizations use exact manifest paths and short-lived signed URLs. Losing access prevents new URLs; an already-issued URL may remain valid until its expiry.
- Nullable exact lesson/locale video prevents pilot fallback. Unready video tabs stay hidden. Existing Bunny media and video illustrations are unchanged. Reading diagrams use separate compositions.
- Guarded commerce candidate extends the existing package paths for Academic and aliases canonical Pro Plus prices. Existing coupons, invitations, manual receipts and commerce wrappers are retained. LC09 candidate registers and removes Academic progress through the existing deletion chain while retaining financial records under existing rules.
- RAG preparation uses an explicit section-title/body allowlist with course, lesson, locale, version and hash. No answer keys, private rubrics or internal research enter retrieval. Staging is not indexing, embedding, assistant activation or editorial approval.
- Offline delivery preparation emits inactive, unapproved content and private asset manifests; it never contacts a database or storage service.

## Evidence and limitations

Disposable database/frontend tests cover 19 cases: price parity and independent rights, introductory/paid/stored-admin access, revocation, locale/approval gates, server scoring and forged progress, practice validation, private downloads, coupon/invitation/receipt behavior, deletion and public catalogue boundaries. Seven Python tests cover structural rejection, safe normalization and RAG exclusions. These are local/disposable tests, not live Stripe, email, production RLS or complete payment end-to-end acceptance.

Generation produced structural and content errors. Selected failed packages were repaired without rerunning successes; retained drafts were completed locally where practical. Exact before/after corrections in `scripts/academic-education/editorial-corrections.json` record arithmetic, answer-index and causal-inference corrections. Automated structural checks and numeric review do not constitute independent full academic editorial acceptance.

Browser/PDF/content counts and final validation status are recorded in the companion validation reports produced by this branch. Do not substitute old brief-only browser checks for the expanded-content report.

Existing four pilot Bunny assets were verified ready in run 37332447947. Browser playback encountered ERR_EMPTY_RESPONSE in this environment; full listening, Egyptian per-word pronunciation and player acceptance remain open. No new media generation was triggered in this continuation.

## Central integration requirements

1. Review and register shared Academic routes/line metadata; preserve four locale contexts and other-lines-only switching. Current production components are not routed into the live application.
2. Review guarded SQL against the integration branch's current schema, then import only editorially accepted payloads and private PDFs. Provision private storage and verify production authorization using TEST accounts. Course and assistant flags default off.
3. Extend existing checkout surfaces and verify the complete Stripe TEST, receipt, email, coupon and invitation journeys. Local candidate tests do not close those integration gates.
4. Obtain independent academic/contextual review and learner timing evidence. Learner-facing materials remain original Masaarat output; internal reference verification remains internal. No accreditation claim is authorized.
5. Obtain assistant price/quota decision, then integrate the existing secure retrieval/provider gateway and independent entitlement. Do not make assistant purchase necessary for written study completion.
6. Complete media and Egyptian pronunciation acceptance separately. Remaining videos do not block an otherwise accepted written release.
7. Central integration owns eventual merge/publication and authoritative register updates. This handoff is prepared for that chat; no message has been sent.

## Reproduction and changed files

Use `scripts/academic-education/README.md` for the bounded generation, normalization, editorial correction, assembly, tests and delivery commands. Historical raw generation artifacts expire; compiled reviewed drafts are the durable content source. Do not re-run paid generation to reproduce an already committed package.

Source groups: `docs/academic/`, `experiments/academic/`, `scripts/academic-education/`, `src/components/academic-education/`, `src/lib/academic-education/`, `.github/workflows/academic-written-*.yml`, and the new `public/brand/masaarat-academic.png`. No pre-existing brand/media file is overwritten. An exact changed-file manifest and final commit are supplied with the final delivery checkpoint.
