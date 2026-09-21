# Marketing tracking governance

## Ownership

- Google Tag Manager container: `GTM-5BVZ85DR`.
- Meta Pixel: `2165346577381544`.
- The application code is the only owner of Meta Pixel initialization and `PageView`.
- GTM owns GA4 configuration and GA4 event delivery only.
- Meta Pixel must not be installed as a GTM tag.

The identifiers are defined once in `src/lib/analytics.ts`. The automated
marketing-foundation test rejects duplicate identifier literals in `src`.

## Consent lifecycle

Neither GTM nor Meta Pixel is loaded until the visitor grants consent.
The banner supports grant and reject. A persistent privacy-settings control
supports later grant or withdrawal. Withdrawal stops application page-view
events, sends denied consent state to the data layer, revokes Meta consent,
and removes the injected script elements.

The decision is stored under `masaarat.analytics-consent.v1` in local
storage. No tracking fallback is emitted from `noscript` markup because
that would bypass the consent gate.

## Page-view contract

The React router location is the single navigation source. On the first
consented load and every distinct SPA URL, the application emits exactly:

1. one `masaarat_page_view` data-layer event for GA4 through GTM;
2. one direct Meta `PageView` event.

The runtime remembers the last emitted absolute URL, which prevents duplicate
events when React effects are replayed in development.

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

These GTM workspace changes are external to this repository and must be
reviewed and published separately.

## Route visibility

Public and sitemap-eligible routes are `/`, `/curriculum`, `/pricing`,
`/privacy`, and `/terms`.

Utility routes are `/index`, `/login`, `/signup`,
`/forgot-password`, `/reset-password`, and `/onboarding`. They are
usable by visitors but excluded from search indexing.

Private routes are `/account`, `/admin/`, `/ai-assistant`,
`/analytics`, `/assistant-runtime`, `/build-logs`, `/dashboard`,
`/image-gallery`, `/image-gallery/*`, `/learn/*`, `/roadmap/`,
`/roadmap/*`, `/start`, and `/system-state`.

The exhaustive, test-enforced mapping from every route source file is in
`src/lib/seo/route-catalog.ts`.
