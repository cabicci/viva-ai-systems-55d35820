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

## Verified checkpoint: afac41c8d79ce5bc3cb10c0a67e48527ce6d7fdd

Egyptian and MSA each have all 40 expanded/pilot lessons. Latest browser run exercised 80 lesson visits, 468 additional-lesson quiz questions and 234 reading visuals, exporting 80 workbooks. Shared-shell checks pass four locales/mobile/desktop, three other-line choices and zero account/payment calls. Gulf has 20 expanded additional lessons and English 19, plus each pilot; their complete assembly remains blocked on 39 missing contextual packages. Recovery arrays preserve successful output and corrections.

Selected repair run 37364538469 failed before generation: the selection job was cancelled with no executed steps. One retry of that job was requested at 20:02Z. No provider calls or new output are inferred from a queued run. Final status must be verified before claiming 160 complete packages.

## Delivered review artifacts and recovery boundary

Content/recovery commit: `b47eb636c4de516c8e4f9f5cecb79c5d2e6411cc`; implementation checkpoint: `afac41c8d79ce5bc3cb10c0a67e48527ce6d7fdd`. `CHANGED_FILES.txt` enumerates exact branch paths against main `062b5f59`; `FINAL_CHECKPOINT.json` records verified counts, tests and outstanding requirements. Root and isolated TypeScript checks pass; candidate-source lint has no errors/warnings; isolated Vite build passes with the expected large offline-review bundle warning.

Saved review HTML version 2 contains full Egyptian/MSA course packages and historical concise briefs for the two not-yet-completed locales. The separate workbook ZIP contains exactly 80 PDFs, clearly labelled Egyptian/MSA review only. The separate reusable methodology PDF remains available. None is represented as a complete four-locale production release.

Recovery: retrieve only output from run 37364538469 attempt 2 if it becomes available; normalize successful packages and review retained failed drafts. Seed normalized staging from committed expanded Egyptian/MSA arrays and recovery Gulf/English arrays. Apply the exact correction ledger idempotently, then run complete-set assembly. Do not rerun successful content. The final 160-package private delivery and 960-chunk RAG staging cannot pass until the missing 39 contextual packages and their workbooks are complete. No autonomous follow-on review, merge or publication is claimed.
