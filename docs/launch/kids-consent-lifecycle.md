# Child-specific consent lifecycle

The seventh prepared migration records a separate consent receipt for each
child profile. It creates no approved policy, guardian verification, country
release, or production data. Existing privacy/editorial/deployment prerequisites
continue to apply. This mechanism is not a legal opinion or proof of guardianship.

## Published notice

Operations must publish the actual reviewed notice and consent wording for the
parent's country and selected locale. The database records a version and a private
review reference. Published text is immutable; changes need a new version. Only
one version per country/locale is enabled. The client renders the exact server
text as plain text; a missing version blocks profile creation. Do not seed the
synthetic test policy in production.

The notice must come from the completed country/privacy decision, including the
real processors, purposes, retention, contact and withdrawal/erasure process.
These texts have deliberately not been invented by the implementation.

## Creation and access

After the existing guardian and country release checks succeed, the parent sees
an unchecked checkbox before entering child profile data. The atomic server RPC
creates the profile and receipt in one transaction. It binds authenticated parent,
profile, published policy, time and the stored guardian verification reference.
Client-created profile inserts and receipt writes are denied. The existing
three-profile limit remains enforced inside the transaction.

Existing profiles lacking a consent receipt cannot access lessons. There is no
automatic grandfathering or policy acceptance. Retiring a policy blocks creation
and lesson use under that version. Policy replacement and re-consent of existing
profiles need a reviewed follow-up flow; this slice does not silently restore a
withdrawn receipt. New policies must not be retired/replaced during launch without
that plan.

## Withdrawal

An authenticated parent can read and withdraw only their own profile receipts,
including when the country or guardian access is closed. Withdrawal is idempotent
and preserves its original timestamp. It prevents future lesson/content/playback
authorizations and profile updates, including free lessons. In-page consumers are
refreshed on withdrawal; other tabs recheck on focus. Already issued video tokens
remain bounded by their existing expiry; this is not an immediate CDN revocation
claim.

Parent read/delete rights remain. Withdrawal does not claim processor/backups
purging, nor start a fresh 90-day paid-expiry timer. Existing explicit-erasure and
paid-retention processes remain separate. Deleting the child profile removes its
linked receipt under the same existing database cascade; no child-related record
is advertised as retained forever.

## Remaining automatic verification integration

There is still no selected/connected external verifier. Normal approval is meant
to be automatic, but a declared adulthood checkbox and email confirmation do not
supply the missing result. The integration must authenticate provider callbacks,
bind their result to the pending parent/country and server-issued request, dedupe
replays, enforce validity/expiry/revocation, and store only the permitted result
reference. Do not turn a browser redirect or client-provided success flag into
parent approval. The legacy admin review RPC is not an automatic verifier.

## Verification

`node scripts/kids/test_consent_migration.mjs` replays the real migration in an
isolated database with synthetic users, policy wording and approval records. It
checks missing/unchecked/wrong-country consent, direct-insert bypass, guardian and
release gates, immutable notice text, cross-family reads/writes/withdrawal, the
family limit, policy retirement, closed-country withdrawal and deletion cascade.

The component tests exercise all four locale variants, unchecked consent, a
missing published policy and withdrawal with a closed country. A test receipt is
not production evidence. Run the existing market and retention SQL gates too.
