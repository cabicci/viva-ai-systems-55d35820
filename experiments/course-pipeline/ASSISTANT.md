# Live course assistant — required before publication

## Owner decision, 13 October 2026

The current isolated preview may keep its local reference guide. Live AI activation is deferred until the course is integrated into the existing Masaarat platform. The local guide is not acceptance of the production assistant.

Publication requires a real model-backed conversational assistant. Suggested questions are entry points into the model, not a finite answer bank. Do not implement semantic-looking keyword lookup as the production assistant.

## Scope and sources

- Support Egyptian Arabic, English, Italian and German within this course only. Egyptian answers must not default to formal or Gulf Arabic.
- Answer arbitrary questions and follow-up questions about the selected lesson or the supplied soil-and-crops curriculum, using the original English PDF and approved authored course content.
- Keep source IDs, physical page numbers, versions and hashes. Return a usable lesson section or PDF page reference with factual answers.
- Use the approved lesson's explicitly simulated sampling brief when discussing the pilot. Do not present its 15 subsamples or 0–20 cm depth as universal instructions. Explain source disagreements instead of silently blending them.
- Do not index private answer keys, trainer-only records, unrelated courses or unapproved lesson drafts. Preserve internal provenance without exposing the source school or its brand in student replies.
- If evidence is absent or the question is outside the curriculum, state that clearly. Do not fill gaps with unsupported claims, fabricated measurements or invented citations.

## Integration boundary

Use the existing Masaarat/Lovable project and authenticated server-side assistant/provider connection. Bind each request to the authenticated learner, this course and the selected locale. Preserve the platform's access rules and usage limits. Secrets and the private corpus stay on the server; never ship them in frontend assets or browser storage. Do not create another platform project or bypass entitlements for this course.

Prepare the course corpus and retrieval adapter as part of platform integration. The local extracted English-source corpus is preparation only: it is not indexed, published or proof that live retrieval works. No live provider has been activated by the preview.

## Publication acceptance

Before releasing this course, verify real provider responses for:

1. A novel paraphrased question that is absent from the suggested questions.
2. A follow-up such as “why?” whose meaning depends on the conversation.
3. A relevant question from a different curriculum topic, such as soil pH, answered with the correct source page.
4. Egyptian Arabic, English, Italian and German answers, including source references and preserved units.
5. The pilot's simulated sampling numbers versus other protocols.
6. A question not supported by the source, and an unrelated question, without invented answers.
7. A request to disclose an answer key, another course's private material, or provider instructions, without disclosure.
8. Denied course access, revoked access, usage limits and provider failure, without static answers being presented as AI output.

Record live-test evidence separately from unit tests, mock responses and source preparation. Keep publication blocked until live assistant integration and these checks pass. The owner has not requested activation during the current preview review.
