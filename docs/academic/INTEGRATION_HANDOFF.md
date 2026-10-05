# Central Integration Handoff — Academic planning slice
Date: 2026-10-05
Status: DRAFT CURRICULUM FOR OWNER REVIEW — NOT IMPLEMENTED OR RELEASE-READY

Repository: cabicci/viva-ai-systems-55d35820
Branch: work/masaarat-academic-20261005
Base commit: 062b5f59dc56fabbce89c2034008fa1d8ef21114
Delivery commit: the commit introducing this handoff and its three sibling planning files; its immutable SHA is supplied in the delivery message (avoids a self-referential commit hash).

## Changed files
- docs/academic/CRITERIA_AND_DECISIONS.md
- docs/academic/CURRICULUM_PROPOSAL.ar.md
- docs/academic/curriculum-proposal.json
- docs/academic/INTEGRATION_HANDOFF.md

## Why / scope
The owner requested a new Academic line using the current platform architecture and a reusable curriculum criteria register. Source headings cover business fundamentals, leadership, small businesses, innovation/feasibility, strategy/business planning, establishment/operations readiness and project management.
The attached advertisement says 40 hours; the owner explicitly chose 30 total learning hours for Masaarat. The proposal is 30 lessons, seven modules, a cumulative project and a first-lesson pilot after curriculum agreement. It is not an accreditation claim.
The assistant is a separately purchased add-on within Academic; it is not automatically included. Academic lessons must remain usable without the assistant.

## Verified evidence
Latest recovery plan v143 and continuation register v73 agree with main through PR154. Technical integration and stored-admin lesson access are already integrated; do not repeat old pending imports or media work.
Read repository line registry, navigation, overview, curriculum and lesson route. Existing switcher excludes active line. No AGENTS.md in the baseline tree.
Attached image inspected and MP4 metadata/frames reviewed. Audio not transcribed or independently verified.
Initial bibliography identifies OpenStax sources; detailed lesson claim-by-claim review remains part of authoring.

## Validation
Planning data validated: seven modules; 30 unique lesson IDs; each activity breakdown totals 60 minutes; all lessons total 1,800 minutes/30 hours; four required locales listed. Workload is a design estimate, not learner timing evidence.
Application build, TypeScript, runtime tests, browser tests and production checks were not run: no runtime code changed. The final delivery separately reports branch diff verification.

## Shared surfaces to coordinate after curriculum approval
- learning-lines registry, Navbar, root line catalogue, account learning overview, intro/curriculum routes, locale copy and logo mapping.
- Existing commerce package selector, entitlement storage, manual receipts/review, coupons/invitations, Stripe TEST, independent assistant add-on, notification templates and retry/idempotency.
- Academic content delivery, private PDFs, Bunny media manifest, line/course/locale RAG isolation and server-side assistant entitlement.
These are future coordination points, not implemented edits or instructions to deploy.

## Preserved
Single account; existing AI Pro/Pro Plus/Builder and Kids/technical rules; admin lesson review; existing mail, receipts, invitations and coupons; four locales; other-lines-only navigation.
No merge, PR opening, publish, production setting, migration, indexing, email, payment, learner-data access or existing-media change. Existing launch pause/Stripe TEST boundaries remain in force.

## Outstanding
Owner curriculum/name/audience review; package scope/prices/periods and assistant usage/dependency; completion policy; final English logo label; first lesson in four locales, visual/audio/workload acceptance; only then full production.
Central integration retains ownership of global register updates and shared release decisions. This handoff does not authorize merging or deployment.
