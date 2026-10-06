# Academic shared integration contract

Status: central integration requirements. Guarded commerce and delivery candidates are implemented on the isolated branch; they are not activated or deployment authorization.

## Ownership and sequence
The Academic branch owns curriculum, original lesson packages and the isolated pilot. Central integration owns edits to the shared line registry, navigation, account overview, billing, receipt/email/coupon/invitation paths and global registers. This document is a handoff for that chat; no message has been sent on the owner's behalf.

Sequence: review the completed branch candidates against then-current main; coordinate shared surfaces; register through the existing architecture; complete integration and regression checks; record the central merge/release decision. Base Academic price parity and written release before remaining videos are already agreed. Assistant price and allowance remain separate outstanding requirements.

## Required access matrix
| Session / entitlement | Academic lessons | Academic assistant |
| --- | --- | --- |
| Anonymous | Only explicitly configured previews, once preview policy is agreed | No paid assistant access |
| Active confirmed account, no Academic access | Existing purchase/access-required behavior | No implicit grant |
| Academic content subscription only | Applicable released content | Separate add-on purchase required |
| Academic content and assistant add-on | Applicable released content | Authorized course/locale scope, within agreed quota |
| Other-line subscription only | No inherited Academic grant | No inherited Academic grant |
| Stored administrator role | Existing lesson-review rules, account checks and release controls | No automatic unlimited paid model calls |
| Expired/refunded/revoked access | Existing server-side revocation behavior | No stale retrieval/cache grant |

Whether an assistant-only buyer can use it without an active Academic content subscription is unresolved. Do not implement a permissive default. The Academic base uses the canonical Pro Plus price catalogue, with independent rights. Assistant price, billing allowance/quota, catalogue-versus-course scope and cancellation/refund interactions remain unresolved. Do not ask again for the already-agreed base price parity.

## Shared product surfaces
- Add Academic through `src/lib/learning-lines.ts` and the existing route/component family; reuse introductory section order, curriculum hierarchy, lesson layout, typography and one locale selector.
- Preserve one account. Do not add a second identity table or sign-up flow.
- Preserve the line switcher's existing active-line exclusion. Test it on all four locales and mobile/desktop after central integration adds Academic.
- Keep Academic content and the optional assistant as distinct entitlements through the existing purchase/review/webhook mechanisms. Existing receipts, emails, coupons and invitations must retain their current behavior and idempotency.
- Keep lesson delivery server-authorized; client route guards alone are insufficient. Production must move formative answer keys and grading behind the established authorization boundary; the offline review fixture is not a production delivery bundle.
- Video stays on Bunny with autoplay disabled. Add only newly verified Academic identities to a dedicated manifest. Workbooks should use the existing private signed-download architecture under a namespace agreed centrally, not a public bundled download.
- Preserve contextual locale meaning and examples, not only translation. Never substitute a different locale's audio or PDF silently.

## RAG boundary
Use only approved Masaarat learner lesson content. Internal academic references, editorial notes, quiz answer keys and private learner submissions are excluded. Retrieval/caches bind line, course, locale, content version and the caller's permitted scope. Server checks the separately paid assistant entitlement before retrieval/model use. Learner answers may refer to authorized Masaarat lesson sections, without showing the external editorial source list. The assistant cannot supply required study hours or prerequisites for a lesson-only buyer.

## Required integration tests
Test the access matrix with actual server handlers, not mocked client flags. Cover purchase grant/replay, receipt review/replay, add-on-only state, expiry/refund/revocation, admin lesson access, locale switching, private PDF denial, cross-line/course RAG denial, stale cache denial and existing AI/Kids/Technical commerce regressions. These are future integration gates, not tests claimed as passed by the isolated pilot.
