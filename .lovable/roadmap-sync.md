# Roadmap sync marker

[roadmap:cc83bcf5-3929-45ff-b3a5-8ff8abd7f5bf]
date: 2026-09-25
scope: db
source: ai
summary: Prepare child-specific consent receipts, atomic profile creation and withdrawal; all release gates remain unchanged
sync_status: pending Central roadmap_items update

This change is prepared locally. The matching roadmap_items update is pending Central coordination.
The build's roadmap guard fails on ANY meaningful project change without a fresh marker.

## 2026-09-30 — account recovery email

[roadmap:account-service-email]
scope: other
source: user
summary: Localize password recovery in the four existing locales using the existing verified-recipient profile lookup, preserving SDK signature verification and recovery URLs.
sync_status: source change prepared; roadmap_items and production delivery are not claimed

## 2026-09-30 — LC-09 cumulative review

[roadmap:account-deletion-review]
scope: other
source: user
summary: Synchronize the existing request-only deletion draft with PR #117, update the explicit cumulative migration inventory, and collect manual/policy checks for the final review round.
sync_status: draft only; final deletion, roadmap_items update and production activation are not claimed

The automatic Billing gate found one stale adult-quota inventory assertion.
The review correction scopes that assertion to adult migrations; the complete
cumulative inventory remains checked separately. One corrected-head run is
pending. Kids runtime and payment behavior are unchanged.
