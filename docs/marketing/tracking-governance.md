# Marketing tracking governance

## Ownership

- Google Tag Manager container: `GTM-5BVZ85DR`.
- Meta Pixel: `2165346577381544`.
- The application code is the only owner of Meta Pixel initialization and `PageView`.
- GTM owns GA4 configuration and GA4 event delivery only.
- Meta Pixel must not be installed as a GTM tag.

The GA4 measurement ID is `G-MDMNHQCK5G`; it is used for the Google tag opt-out
flag, not for a second GA4 installation. The identifiers are defined once in
`src/lib/analytics.ts`. The automated
marketing-foundation test rejects duplicate identifier literals in `src`.

## Consent lifecycle

Neither GTM nor Meta Pixel is loaded until the visitor grants consent.
The banner supports grant and reject. A persistent privacy-settings control
supports later grant or withdrawal. Withdrawal stops application page-view
events, sets the documented Google tag opt-out flag before sending a denied
Google Consent Mode update, revokes Meta consent, and removes injected script
elements. Removing nodes alone does not unload an already-running tracker.

The application queues one `gtag('consent', 'default', ...)` command with all
four Consent Mode v2 fields denied, before loading GTM. A changed visitor
decision queues the supported `consent/update` command before the compatibility
`masaarat_consent_update` event. This follows Google's documented page-code
fallback for GTM; that custom event alone is not the Consent Mode API. Repeated
SPA effects do not reset defaults or re-emit an unchanged consent decision.
Trackers are initialized once per document, including withdrawal and re-grant.

References: [Google consent setup, including the page-code GTM fallback](https://developers.google.com/tag-platform/security/guides/consent)
and [Google tag opt-out flag](https://developers.google.com/tag-platform/security/guides/privacy).

The decision is stored under `masaarat.analytics-consent.v1` in local
storage. No tracking fallback is emitted from `noscript` markup because
that would bypass the consent gate.

## Page-view contract

The React router location is the single navigation source. On the first
consented load and every distinct SPA URL, the application emits exactly:

1. one `masaarat_page_view` data-layer event for GA4 through GTM;
2. one direct Meta `PageView` event.

The runtime normalizes the router's relative URL before comparing it with the
last emitted absolute URL. Replayed effects do not duplicate events; navigating
away and back still records a new visit.

## Required GTM configuration

Before publishing the container:

1. Remove or pause every Meta Pixel / Facebook tag in GTM.
2. Configure GA4 tags to require analytics consent.
3. Set the GA4 configuration tag not to send an automatic page view.
4. Create one Custom Event trigger named `masaarat_page_view`.
5. Send the GA4 page view from that trigger using `page_location`,
   `page_path`, and `page_title` from the data layer.
6. Remove All Pages and History Change page-view triggers that could create
   a second event.
7. In GTM Preview, verify zero requests before consent, one GA4 page view
   after grant, one per internal navigation, and no further requests after
   withdrawal.
8. Reconcile the draft's consent configuration with the application-owned
   default/update commands; do not publish a conflicting second default.
9. Check GA4 Enhanced Measurement history-based page views as well as GTM
   triggers so they do not duplicate application page views.

These GTM workspace changes are external to this repository and must be
reviewed and published separately.

Unit/router tests prove application command order, opt-out state, deduplication
and rendered metadata. They do not prove actual vendor delivery or stopped
network traffic. C02 must obtain fresh-session, SPA, withdrawal and re-grant
network evidence after an approved deployment and review of the existing GTM
draft. No GTM/GA4 setting is changed by this repository slice.

## Route visibility

Public and sitemap-eligible routes are `/`, `/contact`, `/curriculum`,
`/pricing`, `/privacy`, and `/terms`.

Utility routes are `/index`, `/login`, `/signup`,
`/forgot-password`, `/reset-password`, and `/onboarding`. They are
usable by visitors but excluded from search indexing.

Private routes are `/account`, `/admin/`, `/ai-assistant`,
`/analytics`, `/assistant-runtime`, `/build-logs`, `/dashboard`,
`/image-gallery`, `/image-gallery/*`, `/learn/*`, `/roadmap/`,
`/roadmap/*`, `/start`, and `/system-state`.

The exhaustive, test-enforced mapping from every route source file is in
`src/lib/seo/route-catalog.ts`.

Each public route supplies its own canonical link and matching `og:url`, using
the same language-neutral URLs as the existing sitemap. Locale, campaign and
fragment values are not copied into these identities. Localized titles and
descriptions remain in all four languages. Root metadata does not impose a
homepage canonical on child routes. The five-course structured-data list
continues to exclude the introduction, labels Builder as Pro Plus, and makes no
unsupported certificate claim.
