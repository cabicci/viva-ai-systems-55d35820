---
name: Image policy (all paths)
description: No placeholder images anywhere. Every image is either a real platform screenshot or AI-generated in a pastel palette matching the lesson context. Applies to all 5 paths.
type: constraint
---

**Rule:** No placeholder images in any lesson, anywhere in the project.

Every image must be ONE of:
1. **Real platform screenshot** — captured from inside the actual platform/tool being taught (Lovable, ChatGPT, Claude, etc.) demonstrating the concept.
2. **AI-generated image** — generated to match the lesson context, using a **pastel palette** (soft, low-saturation) consistent with the project's visual identity.

**Why:** Placeholders break learner trust and signal unfinished work. Real screenshots prove the concept; pastel AI images keep visual cohesion across the curriculum.

**How to apply:**
- Never ship a `screenshot` block without a real `src` asset.
- When generating images, use `imagegen` with a pastel color brief tied to the lesson's topic — not generic stock visuals.
- Applies to all 5 paths: Intro, Builder, Creator, Automator, Analyst, Business.