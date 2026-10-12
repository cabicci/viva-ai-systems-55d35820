# Academic native assistant and optional paid add-on

Owner decision, 2026-10-13: use the existing TanStack application server, not a new Edge Function. Admin use has no question quota. Learners may add the assistant to the Academic package: EGP 50/month or 600/year; USD 1/month or 12/year. These are surcharges; the existing Academic base price and Stripe TEST-only mode stay unchanged.

From any AC-BUS lesson, retrieval can use every approved section of AC-BUS in the selected locale. It cannot use another course, another locale, quiz keys, editorial notes or private submissions. The native corpus builder recomputes every source hash before embedding; the service-only importer also compares each section to the current approved stored payload.

Learner quota resolves the current published Pro Plus policy: currently 150 questions per UTC calendar month, at most 6 per open lesson per month. The Academic counters are separate from AI usage. Authenticated database access is checked before providers and again before answer generation. A duplicate learner request ID cannot call providers twice. Admins skip the learner counter.

## Existing payment paths

- Manual orders carry `academicAssistant:true` only when selected. The authoritative quote adds the surcharge after the base discount. The same confirmed order creates both course bindings atomically; an unpaid selection grants nothing. Revoke/refund/expiry use the existing entitlement row, so both permissions end together.
- Stripe uses the existing `academic-stripe-checkout` function and existing webhook. Assistant prices have a stored course ID and `includes_assistant` flag. The server, not browser metadata, determines the permission. Existing base-only prices remain unchanged. LIVE is not enabled by this work.
- Nonstandard-duration complimentary coupons cannot be combined with the monthly/yearly add-on. Standard-duration offers preserve their duration and do not waive the assistant surcharge.
- Question records contain IDs and counts, not prompts or answers, and are deleted in the existing learner-erasure stage. Existing payment retention remains unchanged.

## Owner operations through Lovable only

1. Confirm merged main and target database `abyqqeboyrkkwhjpwmtd` in project `658adce0-747d-4c8e-90e3-d22225070b94`.
2. Rehearse then apply `scripts/academic-education/assistant-native-candidate.sql` once. It depends on the earlier applied assistant candidate. Flags default off.
3. Reuse existing server `OPENAI_API_KEY` for embeddings and `LOVABLE_API_KEY` for the Gemini answer model; never expose or copy values into code.
4. Set AC-BUS review flags for the admin indexing session. Via the native `indexAcademicAssistant` server function, process batches until `nextOffset:null`; retain counts. Source mismatch blocks embeddings. Retry skips unchanged chunks.
5. Verify exact-source coverage of all 160 packages, live answer, course/locale isolation, base-only denial, paid-add-on success, quota, revocation/refund and deletion. The rollback-only SQL smoke script exercises pricing/paid grants/quota without sending messages or charging a provider.
6. Only after these checks, enable `academic_assistant_policy.runtime_enabled`, `sales_enabled` and `academic_courses.assistant_enabled` for AC-BUS. The owner publishes the website. A merged commit, schema application or mocked test alone is not activation.

The historical Edge handler remains an internal shared pure handler; its deployment entry is removed from config. No new Edge Function is required.
