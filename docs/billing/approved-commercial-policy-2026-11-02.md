# Approved commercial policy — 2026-11-02

Authority: direct owner decisions in ROOT1.1, including the 2026-11-01 approved policy and the individual 2026-11-02 choices. This is an implementation brief, not evidence of deployment.

## Release boundaries

- Same repository: cabicci/viva-ai-systems-55d35820, branch codex/packages-policy-20261102 based on main da69a7ba44395f8e06632c0c6143b38447d3d32f.
- Implementation and local tests authorized. No merge or site publication until owner reviews the result.
- No new Lovable project, cloud database project, Stripe account or sandbox. Existing project cleanup is deferred.
- Owner explicitly authorized adding missing products/prices in the existing Stripe LIVE account. Reuse matching existing objects; do not charge customers or change existing subscriptions during preparation.
- Existing subscribers retain BOTH their current price and their current allowance until their next renewal; the new policy applies after that renewal. No immediate quota refresh.

## Monthly plans (EGP)

| Plan | Monthly price | Questions |
| --- | ---: | ---: |
| AI Free | 0 | 10, free lessons only |
| AI Pro | 169 | 150 |
| AI Pro Plus | 309 | 300 |
| Academic | 309 per subscribed curriculum/package | 300 per subscribed curriculum/package |
| Technical | 309 per subscribed curriculum/package | 300 per subscribed curriculum/package |
| Kids family | 199; 179.10 with eligible AI discount | 100 per child, up to 3 children |

- Academic and Technical include the assistant; no separate Academic assistant activation fee.
- No per-lesson question limit for the paid plans above. Preserve each plan's existing permitted content unless expressly changed here.
- Prices and allowance changes apply at next renewal for existing subscribers. Other existing currencies/annual offers are not assigned invented new prices.
- Paid monthly allowance renews on the subscription anniversary. Free and invitation allowance renew on their activation anniversary. Preserve the original day when short months require month-end clamping.
- Unused monthly allowance does not carry forward.

## Lifetime single-curriculum purchase

- 75 EGP, one payment, one selected curriculum accessible for life.
- Available in every path, including AI, Academic, Technical and Kids. AI curriculum is the existing complete curriculum, not a newly invented product for each internal learning path.
- For Kids, guardian selects ONE owned child; the right is scoped to that child and curriculum.
- 100 questions for the first month only; not a recurring monthly allowance.
- Purchased question topups remain available at any time. End of the initial question allowance does not remove lifetime content access.
- Exact curriculum/child must be bound by the server to the purchase and verified at fulfillment; a price alone never grants all curricula.

## Invitations

- A recipient does not need a paid subscription. Invitation access and questions last for the invitation's own validity.
- Administrator can issue a single-curriculum invitation for any path: one selected curriculum with 100 questions each month throughout its validity. Multiple curriculum invitations may be issued to the same email; each keeps its own scope, anniversary and balance.

- Comprehensive invitation supplies 300 monthly questions in ONE aggregate pool for curricula granted by that invitation, not the sum of fictitious plan allowances.
- Multiple invitations/access grants may be issued to the same email/account. Each valid accepted comprehensive invitation has its own 300-question monthly pool; a single-curriculum invitation has 100. Eligible pools add together and add to any paid subscription allowance. Revoking or expiring one invitation removes only that invitation's rights and remaining allowance.
- Invitation allowance is ADDITIONAL to paid subscription allowance. Example: AI Pro 150 plus comprehensive invite 300, with each pool retaining its authorized scope.
- Administrator chooses a duration starting at acceptance, or an invitation without an expiry.
- Invitation must remain valid for its access and recurring monthly allowance. Preserve paid rights independently.

## Purchased question credit

- 50 EGP buys 100 questions. Purchasable at any time, repeat purchases accumulate, no expiry.
- Credit survives subscription/invitation expiry but may only be used within content currently authorized to the account.
- Monthly allowances are consumed before purchased credit; after renewal the new monthly allowance is used first.
- Kids purchased credit is a shared family pool. Each child consumes their own monthly allowance before drawing on family credit. A child's purchases/access do not authorize another household.

## Charging

- Additional owner instruction: authenticated platform administrators have full platform administration and assistant access across all curricula, without monthly, per-lesson, daily or hourly question-count limits. Determine administrator status from the protected role, never from an email or browser-supplied flag. Administrator requests are nonbillable, and revoked administrator privileges must take effect before a pending answer is released.

- Successful grounded answer: 1. New answered follow-up: 1.
- System failure or insufficient course information: 0.
- First TWO out-of-course attempts per account per Cairo calendar day: 0. Third and subsequent: 1, even if refused.
- Daily boundary is midnight Africa/Cairo. Closing the assistant or changing lessons never resets it.
- Stable request identity and server-bound fingerprint; automatic retries must never debit twice. Persist and validate outcome before exposing a charged answer. Preserve provider/rate/access/risk guards.
- Show current balance and approved usage guidance with the Arabic action “فهمت، ابدأ”.
- On the first assistant opening in a user session, show an actual popup with the account's assistant access, question balance and charging rules. Acknowledging “فهمت، ابدأ” prevents repeating the popup in that same session; never carry acknowledgement across different accounts.

## Discounts and coupons

- Apply ONE eligible discount: whichever saves the customer more. Never stack automatic discounts with coupons.
- Administrator configures each coupon for the first payment, a specified number of months, or the lifetime of the subscription.
- A coupon can discount question topups ONLY when the administrator explicitly configures that scope. Subscription coupons never apply to topups implicitly.
- Preserve existing redemption identity, capacity, validity and cross-payment-rail protections.

## Implementation acceptance

- Every package presents its actual benefits as clear, concise bullet points in all four supported locales: Egyptian Arabic, Modern Standard Arabic, Gulf Arabic and English. Include relevant access scope, questions and validity/renewal, without inventing prices or terms.

- One authoritative service-side access and charging decision shared by AI, Academic, Technical and Kids; do not leave competing debit paths active.
- Preserve suspension, refund, dispute, ownership, publication and curriculum-scoping restrictions.
- Test month-end/leap-year anniversaries, Cairo daily boundaries, renewal grandfathering, paid+invitation addition, exhausted/expired pools, family ownership, lifetime scope, concurrent last-unit requests, retry fingerprint conflicts, nonbillable failures, coupon duration and best-discount selection.
- Test checkout and webhook fulfillment with local fixtures; no live test charges or provider generations simply to claim success.
- Local test success and Stripe catalogue creation do not imply deployment, published availability or a verified live purchase.
