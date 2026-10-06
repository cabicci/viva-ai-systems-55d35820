# Owner-approved Masaarat path identity and common journey

Scope approved in the owner conversation on 2026-10-06. Base main: e8946bbfe2743f5f1d018d87f8b136908a22f270. Working branch: integration/path-story-20261006.

## Product agreement

Masaarat → Masaarat AI / Kids / TECH / Academic → individual path → optional stations → learning steps. TECH means technical education (التعليم الفني), not vocational education. A station is optional; no new station grouping is invented for Kids. Existing content titles and immutable IDs remain intact.

AI: one path card, «مسار الذكاء الاصطناعي بالتطبيق مش بالكلام», leading to the existing descriptive content. Introduction precedes the five stations in this order: Business, Content, Analysis, Automation, Building. Existing topic groups within those stations are headings, not an additional navigation level.

Kids: three age paths (10–12, 12–14, 14–16), each with twelve steps and no stations. Guardian consent, child profiles and independent paid access stay enforced by the existing server decisions.

TECH: Carpentry and furniture making; seven section headings, 21 stations and 80 steps. Sections remain headings in the contents page.

Academic: Business foundations and building a venture; seven named stations and forty steps. Catalogue availability stays grounded in authorised live metadata; no draft lesson bodies or PDFs are bundled into the public frontend.

## Implemented journey

Each line root is its sole path catalogue. Each card opens its path introduction before contents and individual steps. Definitions share goals, audience, prerequisites, plans and a single contents action. The existing AI descriptive components are preserved at /ai/paths/applied; AI contents keep /curriculum so stored lesson URLs, progress and links remain valid. Previous /kids/curriculum, /technical/curriculum and /academic/curriculum redirect to their roots with the selected locale.

Path contents use /kids/{levelId}/contents, /technical/courses/furniture/contents and /academic/courses/{courseId}/contents. Returns from steps consistently lead to the same path contents, preserving locale. Navigation and catalogues are shared between administrators and learners; subscription status changes access decisions, not the route tree or catalogue version. Technical catalogue lock indicators honour the existing verified admin role. The Kids admin scope no longer gets erased by a parent refresh; focus still rechecks both protected content and playback endpoints and clears denied content.

About Masaarat and the home/definition pages use a shared story: steps connect understanding with practice; related steps can form stations; stations form paths; exploring paths supports intellectual and knowledge growth. About includes vision, mission and values. Egyptian, standard Arabic, Gulf Arabic and English are authored contextually; existing UI translation key sets are preserved.

## Preservation

No source lesson payload, approval, database migration, permission policy, protected account, child profile, billing price or entitlement, private PDF, Bunny mapping, production source or active media job was altered. Pro remains separate from Builder; Kids and Academic/TECH subscriptions remain independent. Stripe remains TEST. No payment, test email, account creation, credential reset or impersonation occurred.

## Verification and remaining gate

Release CI discovered newly reviewed transitive dependency advisories on 2026-10-06. The release branch pins sharp 0.35.5 (GHSA-wq5f-xc86-pv6w) and shell-quote 1.11.0 (GHSA-pqg4-j6r4-53mv), regenerating only their lock entries and sharp platform binaries. The dependency advisory gate remains enforced.

- Production build passed locally (Vite client and server).
- Project TypeScript, scoped ESLint and roadmap guard passed.
- 61 selected journey/locale/access tests passed across nine files, including real nested route navigation and the admin refresh/focus regression.
- 16 marketing/crawler tests passed; every new route is classified and the sitemap lists only canonical public paths.
- No whitespace errors; four UI JSON key sets preserved.
- Browser visual acceptance is NOT completed: Playwright Chromium installation failed while downloading the browser archive. Component tests are not a substitute for visual or production acceptance.
- No main merge, Lovable publication or production verification is claimed. The existing Academic release/payment acceptance gates remain in place. Existing media production and incremental attachment must continue independently.
