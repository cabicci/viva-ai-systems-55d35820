# Masaarat Academic — current integration handoff

## 2026-10-07 failed-only media recovery authorized

Original run 37451264552 completed with 137 successful new uploads and 19 failed media jobs. Its collection verified 140 ready videos including the four existing pilots; AC-BUS-M07-L08__en was still processing. The 19 failures occurred before upload: 18 failed the original audio duration gate, and AC-BUS-M01-L04__ar-MSA exhausted TTS retries with finishReason OTHER. Recovery audio artifacts were preserved for all 19.

The owner authorized recovery on 2026-10-07 at 15:02 +03:00. The dedicated failed-only workflow restores each original receipt and WAV cache, verifies exact source/fingerprint, preserves valid WAV bytes, regenerates missing/invalid segments with bounded retries, then invokes the unchanged production renderer/uploader. Four jobs maximum; original voice, prompt, lesson text, production fingerprints and duration gate remain unchanged. A no-audio OTHER failure may be retried as two word-preserving chunks with the same voice/prompt and PCM concatenation; explicit editorial rejections are not bypassed.

Recovery results include an audit of retained hashes and regenerated scene IDs. Collection combines original ready receipts, the previously pending English upload and new recovery receipts; playback readiness remains separate from output listening acceptance and live website mapping. Eight focused local regression tests passed. Recovery run https://github.com/cabicci/viva-ai-systems-55d35820/actions/runs/37618948414 started from `8bf102519ab0c14eab6e94c4742905b71ff7c622`. Its preparation passed all eight recovery tests and validated all 19 original production fingerprints. Per-video recovery and output acceptance remain in progress. No shared platform files, main merge, production mapping or publication are part of this recovery.


## 2026-10-06 written-first integration authorized; media runs independently

The owner explicitly asked central integration to merge the written work now while videos finish independently. The written deliverables remain 40 lessons, 160 contextual packages and 160 PDFs. Start central integration now; remaining media is not a written-release prerequisite. Merge is distinct from publication: the authorization, editorial and TEST integration gates below still apply.

The owner accepted the actual four pilot voices with “تمام زي الفل كمل” on 2026-10-06 at 13:25:53 +03:00. This closes the pilot listening gate for scaling; it does not certify every future rendered video. The four existing Bunny Stream pilot identities in library 670679 are preserved.

Active production: https://github.com/cabicci/viva-ai-systems-55d35820/actions/runs/37451264552 at immutable source commit `f6617cfcf7ac7aa72284b0144baeb4bda81f753b`. Preparation passed 19 Python checks, isolated renderer TypeScript and actual four-locale silent frame rendering. At handoff, the four AC-BUS-M01-L02 locale jobs are in progress; no additional completed-upload count has been verified. If those succeed, the remaining 152 requested identities run automatically, maximum four in parallel. This is a running workflow, not a promise that all outputs will succeed.

Keep `work/masaarat-academic-20261005` and the active run available through media collection. Do not cancel/restart successful production, delete/rebase/reset the branch, replace existing Bunny media, or change in-flight narration/source/voice/render policy as part of the written merge. Queue subsequent content corrections separately with exact affected lesson/locale identities.

The run uploads new videos to Bunny and retains exact receipts. It does not activate production database records or automatically commit the media manifest. Collect the `academic-course-media-collection` artifact (14-day retention), validate exact lesson/locale/source hashes and playback readiness, and apply a small follow-up media mapping update. Only ready exact matches may display. Missing/unready video tabs stay hidden; no pilot fallback or autoplay. A follow-up mapping deployment may be needed, but the written curriculum does not need rebuilding or regenerating.

The preview now consumes the exact course registry, and its checks handle partial video availability. Two lookup regression tests and both preview/project TypeScript checks passed. The written 160-lesson browser report below remains the previous checkpoint; this update is not a fresh full browser acceptance claim.

`MEDIA_PREPARATION.json` records this production snapshot. Shared routes, SQL review/private import, entitlements and TEST journeys remain central ownership. Academic assistant remains disabled until its separate price/quota and provider decisions are approved. No merge, production import or publication has been performed by this Academic room.

## Ownership and delivery boundary

Repository: cabicci/viva-ai-systems-55d35820. Branch: `work/masaarat-academic-20261005`. Current main inspected: `062b5f59dc56fabbce89c2034008fa1d8ef21114`. Recovery register v144 and continuation register v74, modified 2026-10-05 19:37:06Z, supersede historical Technical integration/admin pending items. Those completed platform capabilities are reused, not reopened.

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

Existing four pilot Bunny assets were verified ready in run 37332447947. The earlier browser playback attempt encountered ERR_EMPTY_RESPONSE. Owner pilot voice acceptance subsequently closed the listening gate as recorded above; new-video playback and pronunciation checks remain per-output acceptance work.

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

## Final written delivery checkpoint

Content commit: `e23804c6859bbaeaa61694b28fcd697d9ca66ba6`. Branch: `work/masaarat-academic-20261005`. The later handoff-only commit is identified in the delivery message and branch history. `CHANGED_FILES.txt` lists every branch path against main `062b5f59dc56fabbce89c2034008fa1d8ef21114`.

All 160 contextual review packages are present: 40 lessons in each of ar-EG, ar-MSA, ar-Gulf and en. There are no missing written packages. The course comprises 40 lessons, not 160 separate curriculum lessons. All 156 additional packages pass structural validation, with six explanation sections, six formative questions and three reading visuals each; the four original pilots remain separate identities.

Two additional rendering tests verify LTR arithmetic isolation inside Arabic text and inert HTML/link handling. Worked steps and reading/quiz expressions use the same safe presentation helper in the preview and production candidate.

The final exported-file browser check passed 160 lesson visits, 936 additional-lesson quiz questions and 468 reading visuals. It verified the one-card catalogue, curriculum, locale preservation, mobile overflow and absence of runtime errors. All 160 workbooks were regenerated. `PDF_REVIEW.json` records the page/text scan and selected visual review; it is not an assertion that every page received independent academic review.

The separate reusable methodology PDF and the updated interactive HTML/workbook bundle are review deliverables. The HTML intentionally contains answers and is unsuitable for paid production delivery. The private preparation receipt contains 160 unapproved payloads and 160 workbook manifests, all inactive; RAG staging contains 960 section chunks with no answer keys or internal references. No files, embeddings or content were imported into production.

The exact correction ledger contains 197 corrections, including answer indices, arithmetic, period/unit consistency, contribution versus variable cost, resource scheduling, author-commentary removal and explicit fictional-case labels. Review findings are retained rather than silently treating generated drafts as academically approved.

English recovery used run 37371816157, retained-draft repairs and one original local lesson completion. Gulf recovery used the dedicated run 37374230148 after runnerless matrix attempts: five provider-valid outputs, thirteen retained drafts completed locally and one original local contextual lesson. These provider runs ended with failed raw-draft validation; their workflow conclusions are not represented as passing CI. Final compiled packages passed the local assembly and rendering gates. Completed outputs were not regenerated. Compiled locale arrays are the durable source; obsolete partial recovery arrays have been removed. Existing media were not modified.

The remaining requirements are central integration and acceptance, not missing written content: shared routes/navigation, candidate SQL/private import review, complete TEST commerce/mail journeys, independent contextual/academic acceptance, learner timing, the assistant price/quota and gateway, and remaining-video acceptance. Written release need not wait for all videos. No merge, publication or production setting change occurred.

