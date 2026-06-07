# Viva AI Systems — Master Blueprint

## 1. Vision & Launch Philosophy

### Purpose

Viva AI Systems is an Arabic-first learning platform that teaches people how to use AI practically in everyday life and work.

The product is not a path to becoming a software engineer. Its purpose is to help learners make better decisions, create useful content, analyze information, automate repetitive work, and build simple solutions with AI assistance—starting from zero background and growing real capability step by step.

Success means a learner leaves a lesson knowing what to do next, not just what a term means.

### Who We Serve

We serve Arabic-speaking beginners who may have:

- No coding experience
- No prior AI experience
- Low confidence with technology
- Uneven English comfort with AI product language

Many learners are professionals, creators, operators, or small-business owners who want practical outcomes—not a computer science curriculum. Some will later choose deeper technical paths; most will not. The platform must work for both without assuming engineering ambition.

### Beginner-first principle

Every lesson, mission, screen, and explanation must assume the learner is seeing the idea for the first time.

That means:

- No hidden prerequisites
- No implied tools, accounts, or workflows the learner has not been shown
- No jargon without immediate plain-language support
- No mission that feels impossible on the first attempt

Complexity is allowed only after confidence is earned. If a learner feels lost, confused, or stupid, the product failed—not the learner.

### Arabic-first principle

Arabic is the primary language of learning, thinking, and instruction.

English appears where the real AI world uses it—tool names, product labels, common industry terms—but never as a barrier. When an English term appears for the first time, it must be explained immediately in simple Arabic. After that, reuse is fine.

The tone should feel natural to an Egyptian and broader Arab learner: direct, respectful, practical, and free of academic or translated stiffness.

### AI confidence before technical depth

Viva must build AI confidence before technical depth.

Learners should first believe they can use AI, then understand when to use it, then learn how to use it well. Technical concepts—APIs, databases, workflows, builders—come after trust, clarity, and small wins.

Builder is optional depth for learners who want to go further. It is not the default promise of the platform. The default promise is practical AI capability anyone can apply.

### Launch philosophy

We do not chase perfection, but we do not launch with broken trust.

A lesson, path, or feature is not ready for real users if it creates:

- Confusing missions
- Weak or misleading assistant behavior
- Intimidating lesson flow
- Hidden assumptions about tools, skill, or prior lessons

Internal AI and persona review comes before real user exposure. Content stability comes before video regeneration. We ship when the learning experience is clear, winnable, and trustworthy—not when every visual or edge case is perfect.

Launch means learners can progress with confidence. Polish can follow; trust cannot be repaired easily after it is lost.

## 2. Non-Negotiable Rules

### Beginner-safe rule

Every lesson must protect the learner's dignity and confidence.

If a learner is confused, the content or product failed—not the learner. Copy, missions, UI labels, and assistant responses must never imply the learner is slow, careless, or unprepared. Instructions must be forgiving, explicit, and recoverable.

When friction appears, fix the lesson or flow before asking the learner to try harder.

### English-term first-use rule

Rule:
Any English term used for the first time in a lesson must immediately include a simple Arabic explanation or translation.
After first explanation, reuse is allowed without repetition.

English is part of the real AI world, but it must never become a hidden test. Tool names, product labels, and common industry terms are allowed only when they help the learner operate in real tools. The first appearance must be explained in simple Arabic right away. Later reuse does not need repetition.

### No hidden prerequisites

Do not assume tools, accounts, concepts, workflows, or prior knowledge unless they were already taught in the product.

A lesson may not require:

- A paid tool the learner was never introduced to
- A prior lesson the UI does not clearly unlock
- Coding, dashboards, automations, or data the learner has not been shown how to obtain
- Cultural or business context that was never explained

If a prerequisite exists, state it plainly before the learner needs it.

### One Aha per lesson

Each lesson should deliver one main Aha moment.

That means one central insight the learner can remember, repeat, and apply. Supporting examples, glossary items, and side notes are allowed, but they must serve the same Aha—not compete with it.

If a lesson tries to teach three big ideas at once, split the lesson or cut scope.

### Mission must feel winnable

Missions must feel possible, small, and clear on the first honest attempt.

A good mission tells the learner:

- What to do
- With what kind of input
- In roughly how much effort
- What "good enough" looks like

Missions must not feel like exams, trick questions, or vague creative tests. The learner should believe success is reachable before they submit.

### Mobile-first learning

Mobile is the primary learning surface.

Lessons must remain readable, tappable, and completable on a phone before they are optimized for desktop. That affects paragraph length, block density, mission input size, button placement, and scroll length.

If a lesson only works comfortably on a wide screen, it is not ready.

### Lesson energy curve

A lesson should move through this energy curve:

1. **Orientation** — why this matters now
2. **Explanation** — the core idea in plain language
3. **Example** — something concrete the learner recognizes
4. **Action** — a mission or step they can do
5. **Confidence** — proof they made progress and can continue

The curve should rise, not flatten. Avoid long explanation blocks with no action, and avoid dropping the learner into action with no orientation.

### Max cognitive load per screen

Limit what the learner must process on one screen.

Each visible block should ask for one main kind of attention: read, compare, watch, answer, or act. Do not stack multiple new concepts, long lists, dense diagrams, and mission instructions in the same visual moment.

When in doubt, split content into another block or shorten the screen.

### No persona overreaction

Persona feedback should guide decisions, not trigger panic edits.

A single isolated complaint does not automatically mean the lesson is broken. Look for patterns, severity, and repetition thresholds before rewriting content. Persona review exists to improve judgment—not to create endless reactive churn.

Fix real blockers. Ignore noise. Document the decision.

### Anti perfection-loop rule

Do not keep revising the same lesson forever.

When evidence is strong enough—persona review, audit findings, build stability, and beginner clarity—freeze the decision and move on. Perfection loops delay launch, burn review energy, and often improve wording while breaking lesson rhythm.

Good enough, verified, and stable beats endlessly polished and still moving.

## 3. Phase Roadmap

The project moves in order. Do not skip phases to chase polish, video, or launch pressure.

### Phase 1 — Content Stabilization

- **Goal:** Stabilize lesson content, mission clarity, terminology, and beginner safety before large testing.
- **Inputs:** Existing lessons, prior reviews, known friction points, platform DNA.
- **Outputs:** Reviewed lesson set, revised missions where needed, terminology consistency, known issues list.
- **Exit criteria:** Each path has been reviewed against beginner clarity, mission quality, and cognitive load.
- **Blockers:** Unresolved lesson contradictions, unclear missions, assistant gaps that prevent lesson completion.

### Phase 2 — Persona Diagnostic Review

- **Goal:** Run structured AI/persona diagnostics after content is stable—not before.
- **Inputs:** Stabilized lessons, persona framework, scoring model.
- **Outputs:** Repeated patterns, severity-ranked issues, path-level findings.
- **Exit criteria:** Issues are grouped by severity and repetition, not treated as random comments.
- **Blockers:** Unstable content, unclear scoring, overreacting to isolated feedback.

### Phase 3 — Full Content Revision

- **Goal:** Apply diagnostic findings across Intro, Business, Creator, Analyst, Automator, and Builder.
- **Inputs:** Persona findings, content review system, severity model.
- **Outputs:** Revised lessons, improved missions, reduced intimidation, cleaner flow.
- **Exit criteria:** High and critical content issues are resolved or explicitly accepted with documented rationale.
- **Blockers:** Unresolved curriculum structure decisions.

### Phase 4 — Technical & Product Audit

- **Goal:** Audit app behavior, assistant runtime, security, UX, performance, and production readiness.
- **Inputs:** Current codebase, Supabase policies, assistant behavior, UX flows, logs.
- **Outputs:** Prioritized technical and product issues with fixes.
- **Exit criteria:** Critical security and product blockers are resolved before real user exposure.
- **Blockers:** Unknown AI runtime behavior, weak observability, unresolved auth/security gaps.

### Phase 5 — Content Freeze

- **Goal:** Stop content churn before media regeneration and final polish.
- **Inputs:** Revised content, accepted review findings, decision gates.
- **Outputs:** Frozen lesson text, frozen missions, frozen terminology rules.
- **Exit criteria:** No active critical or high content blockers remain open.
- **Blockers:** Continued rewrites, unresolved path strategy, unstable mission rules.

### Phase 6 — Video Generation Readiness

- **Goal:** Regenerate videos only after content and visual rules are stable.
- **Inputs:** Frozen lesson content, visual standards, video timing rules.
- **Outputs:** Video-ready lesson scripts and regeneration plan.
- **Exit criteria:** Content lock and visual lock are both confirmed.
- **Blockers:** Unfinished lesson revisions, unstable visual design, unresolved video placement rules.

## 4. Content Review System

Every lesson review uses the same framework. A lesson does not pass because it "sounds good." It passes because it survives structured checks.

### Lesson review framework

Review each lesson in this order:

1. **Scope** — one main Aha, one main action
2. **Clarity** — beginner can follow without guessing
3. **Terms** — English handled correctly on first use
4. **Mission** — winnable, specific, aligned with lesson promise
5. **Flow** — block order supports energy curve
6. **Load** — no screen overloads the learner
7. **Trust** — no contradictions, hidden prerequisites, or blame

Record findings with severity. Do not rewrite during review unless the issue is a clear blocker.

### Beginner clarity review

Ask:

- Can a zero-background learner understand what this lesson is asking for?
- Are instructions concrete, not abstract?
- Does the lesson explain where to click, what to open, or what to paste when action is required?
- Does any sentence assume business, coding, or tool knowledge not yet taught?

Fail the lesson if the learner would need to guess the next step.

### English term handling

Check every English term in the lesson:

- Is it necessary for real tool use?
- Is it explained in simple Arabic on first appearance?
- Is later reuse consistent without re-explaining every time?

Fail if English appears as a speed bump instead of a bridge.

### Mission quality review

A mission must be:

- Small enough to finish in one sitting
- Clear about input, effort, and success
- Aligned with the lesson's one Aha
- Winnable without hidden expert knowledge

Fail missions that feel like exams, vague creative prompts, or tests of courage.

### Emotional pacing

The lesson should move the learner from curiosity to confidence—not fatigue to doubt.

Watch for:

- Long explanation before any payoff
- Sudden difficulty spikes
- Repeated "you should already know" energy
- Endings that feel punishing instead of encouraging

A lesson should end with momentum, not relief that it is over.

### Cognitive load review

For each major screen or block group, count what the learner must do at once:

- Read new concepts
- Compare options
- Watch media
- Answer questions
- Submit a mission

If more than one major demand competes on the same screen, reduce scope or split blocks.

### Block ordering standards

Default order unless a lesson has a documented reason to differ:

1. Orientation (Hero / why now)
2. Core explanation
3. Example or comparison
4. Supporting glossary or diagram
5. Reinforcement (quiz/light recap if used)
6. Mission / action
7. Confidence close (what they can do next)

Do not place the mission before the learner understands what to do. Do not bury the action under optional depth.

## 5. Visual Lesson Flow Standards

Visual design exists to reduce learning friction—not to decorate the lesson.

### Visual hierarchy

Each screen should make one thing obvious first:

- What this block is for
- What the learner should read, watch, or do
- What matters most on mobile

Headings, spacing, and emphasis must guide attention. If everything looks equally important, nothing is.

### Block rhythm

Alternate thinking and doing.

Use a rhythm of:

- Short orientation
- Compact explanation
- Concrete example
- Single action moment

Avoid long identical block types stacked back-to-back without relief.

### Density rules

Limit text density per block:

- Prefer short paragraphs
- Break long lists into steps
- One diagram should support one idea
- Glossary entries should not become mini-lessons

If a block needs scrolling fatigue management, it is probably too dense.

### Scroll fatigue prevention

On mobile, the learner should never feel lost in an endless wall.

Rules:

- Insert action or visual relief before scroll exhaustion
- Keep mission inputs visible without excessive hunting
- Split oversized explanation sequences
- Avoid burying the next step below too much optional content

### Video timing rules

Video supports the Aha—it does not replace lesson structure.

- Place video after orientation, before or during explanation—not as a mystery opener
- Keep videos aligned to one lesson idea
- Do not require the learner to extract the mission instructions only from video
- If video is missing or skipped, the lesson must still work

### Diagram timing rules

Diagrams clarify one relationship or process at a time.

- Introduce the idea in words before showing the diagram
- Caption diagrams in plain Arabic
- Do not stack multiple complex diagrams without explanation between them
- Diagrams must not introduce new prerequisites the text never taught

### Mission timing rules

The mission appears after the learner has enough context to try.

- Mission intro must say what to do in plain steps
- Input area must feel approachable on mobile
- Submission feedback must preserve confidence
- Do not gate the next lesson on perfection; gate on honest effort with clear guidance

### Mobile readability

Mobile readability is mandatory, not optional polish.

Check:

- Font size and line length on phone
- Tap targets for buttons and inputs
- RTL flow consistency
- Mission text area usability
- No critical instruction hidden off-screen or below heavy content

### CTA placement

CTAs must appear where the learner is ready—not where the designer wants decoration.

- Primary CTA follows the main action of the block
- Mission CTA comes after mission instructions, not before
- Secondary actions must not compete with the main next step
- Path and lesson navigation must not create dead ends after completion

## 6. UX & Product Audit System

Audit the product as a beginner would experience it—not as the team imagines it.

The core question: can a new learner enter, understand where they are, know what to do next, recover from confusion, and trust the platform?

### Onboarding

Check whether first-time entry is calm and orienting.

- Is the first screen clear about what Viva is and is not?
- Does onboarding avoid asking for decisions the learner cannot yet understand?
- Are path choices explained without hidden future consequences?
- Does the learner know Intro must come before career paths if that is the product rule?

Fail if onboarding creates false confidence or immediate confusion.

### Dashboard

Check whether the dashboard answers three questions instantly:

- Where am I?
- What can I do now?
- What unlocks next?

The dashboard must not feel like an admin panel. Progress, next lesson, and locked paths must be visible without hunting.

### Path unlocks

Path unlocks must be understandable before they are encountered.

- Are lock reasons visible in plain Arabic?
- Does the learner know how many Intro lessons remain?
- Are paid or Pro gates explained without surprise?
- Is there a clear next action from every locked state?

Fail if a locked path feels like rejection instead of guidance.

### Assistant usage

The assistant must support learning—not replace it, bypass missions, or create dependency.

Check:

- Is the assistant easy to find when needed but not distracting when not?
- Does it stay within curriculum context?
- Can a learner complete the lesson without the assistant if instructions are clear?
- Does assistant behavior build trust rather than mystery or overpromising?

Fail if the assistant becomes the only way to understand the lesson.

### Navigation

Navigation must be predictable on mobile and desktop.

- Can the learner return to dashboard, current path, and next lesson without getting lost?
- Are back/next actions consistent across lesson types?
- Does RTL layout remain coherent across routes?

Fail if the learner needs product memory to move around.

### Progress clarity

Progress must feel earned and legible.

- Can the learner see completed vs available vs locked lessons?
- Do missions clearly affect progression?
- Are streaks or counts motivating rather than confusing?
- Is partial progress preserved and visible after reload?

Fail if the learner cannot tell whether they moved forward.

### Dead-end detection

Hunt for screens where the learner has no obvious next step.

Common dead ends:

- Mission failed with no recovery guidance
- Locked next lesson with no explanation
- Empty states with no CTA
- Completed lesson with no forward path
- Assistant or auth errors with no way back to learning

Every dead end is a product defect until fixed or explicitly messaged.

### Loading/error states

Loading and errors must protect trust.

- Loading states should explain what is happening in simple language
- Errors must not blame the learner
- Auth, network, mission evaluation, and assistant failures need recovery paths
- Retry actions must be visible and safe

Fail if an error feels like the platform broke or the learner did something wrong.

## 7. Technical Audit System

Technical audit confirms production readiness, user safety, data protection, cost control, and stable AI/product behavior.

### Security

Review the system for trust-breaking exposure.

- Secrets never belong in client code or public repos
- Admin and roadmap surfaces must be protected
- Client-write paths to sensitive tables must be justified and constrained
- Security fixes take priority over feature polish

Fail open only where explicitly designed; otherwise fail closed.

### Auth

Auth must be simple, recoverable, and predictable for beginners.

- Signup, login, reset, and session recovery flows must work cleanly
- Auth gates on missions or progress must be explained before blocking action
- Logged-out and logged-in states must not corrupt lesson progress expectations

### Roles & RLS

Roles and Row Level Security must match real product intent.

- Learners can only read/write what belongs to them
- Admin privileges are narrow and auditable
- Service-role paths are server-only
- No policy assumes trust in the client

Audit every table that stores learner progress, submissions, notes, or logs.

### API exposure

Expose only what the product truly needs.

- Public endpoints must be intentional
- Server functions and edge functions must have clear ownership
- Sensitive operations stay off the client
- Generated or internal routes must not leak admin behavior

### Rate limiting

Rate limiting protects cost, abuse, and stability.

- AI evaluation, assistant calls, and error logging need sane caps
- Limits should fail safely without breaking core learning when possible
- Abuse patterns should be detectable and throttleable

### Abuse prevention

Prevent predictable misuse without punishing normal beginners.

Watch for:

- Spam submissions
- Automated assistant abuse
- Client-side trust in unauthenticated writes
- Expensive loops triggered by UI or retry behavior

### Logging & observability

The team must be able to see what failed and why.

- Client errors should be logged with restraint
- Server failures need enough context to debug
- AI runtime failures must be traceable
- Logging must not leak secrets or learner-sensitive content

No observability means no confident launch.

### Performance

Performance affects trust, especially on mobile.

- Lesson pages should load without painful delay
- Heavy assets must not block first understanding
- Mission submission feedback must feel responsive enough to preserve confidence
- Build and runtime performance regressions must be caught before release

### Architecture review

Architecture must stay understandable and maintainable.

- Curriculum, lesson content, routing, assistant, and auth boundaries stay separate
- Generated files remain generated
- Legacy surfaces are not silently expanded
- New work follows existing platform patterns unless a documented decision says otherwise

### Edge cases

Test the uncomfortable paths:

- First visit vs returning learner
- Logged out mid-mission
- Failed mission twice
- Reload during submission
- Mobile keyboard covering mission input
- Locked path after partial Intro completion
- Assistant unavailable

Edge-case failure is still launch failure if it blocks trust or completion.

## 8. Persona Diagnostic Framework

Personas are diagnostic tools—not final truth.

They simulate how different Arabic-speaking beginners may experience the product. Their purpose is to produce decisions, not endless comments.

### Persona philosophy

Use personas to stress-test clarity, trust, and flow—not to win arguments or force rewrites from one imagined opinion.

Rules:

- Look for repeated patterns, not isolated complaints
- Score consistently using the same dimensions
- Separate product defects from preference
- End every diagnostic cycle with a decision: continue, revise, pause, or freeze

### Egypt segmentation

Represent learners who prefer direct Egyptian Arabic, practical examples, mobile-first usage, and low tolerance for academic or English-heavy friction.

Test for:

- Natural tone
- Tool instructions that feel realistic locally
- Missions that do not assume business sophistication

### Gulf segmentation

Represent learners who may have stronger formal exposure, higher service expectations, and comfort with business-oriented examples.

Test for:

- Clarity without oversimplification that feels childish
- Professional trust signals
- Respectful tone and clean progression

### Levant segmentation

Represent learners sensitive to dialect naturalness, social tone, and explanation style.

Test for:

- Whether Arabic feels human rather than translated
- Whether examples feel culturally plausible
- Whether emotional pacing stays encouraging

### North Africa segmentation

Represent learners who may face mixed French/English exposure, varied tool access, and strong mobile dependence.

Test for:

- Terminology load
- Tool availability assumptions
- Mission feasibility without premium infrastructure

### Arab diaspora segmentation

Represent learners who may be more comfortable with English product language but still need Arabic-first learning and beginner-safe pacing.

Test for:

- Whether English terms help or alienate
- Whether the product still feels built for Arab learners, not imported Western courseware
- Whether mobile and mission clarity remain strong

### Persona scoring model

Score each lesson or flow from 1–5 on:

- **Clarity:** Does the learner understand what this screen or lesson is saying?
- **Flow:** Can they move forward without guessing the next step?
- **Fatigue:** Does the experience feel too long, dense, or draining?
- **Motivation:** Do they want to continue after this section?
- **Mission understanding:** Do they understand what the mission requires before submitting?
- **UI understanding:** Do buttons, locks, progress, and navigation make sense?
- **Trust:** Does the product feel safe, honest, and reliable?
- **Mobile readability:** Is the experience viable on phone?

Low scores across multiple personas matter more than one dramatic quote from a single persona.

### Severity model

Persona findings inherit the project severity model.

- Repeated low scores or trust breaks become High or Critical
- One-off tone preferences stay Low or Ignore
- Mission misunderstanding is usually High
- Completion blockers are Critical

### Repetition thresholds

Do not rewrite based on a single isolated reaction.

Default thresholds:

- **Critical:** one reproducible trust/completion break is enough
- **High:** same issue appears in 2+ personas or 2+ lessons in the same pattern
- **Medium:** repeated friction in one path but not universal
- **Low:** one persona, one lesson, no completion impact
- **Ignore:** preference, unsupported opinion, or non-reproducible noise

### Diagnostic rules

Run persona diagnostics only on stabilized content.

Process:

1. Define the lesson or flow under test
2. Run all relevant segments
3. Score with the model
4. Group findings by pattern and severity
5. Recommend a gate: continue, revise, pause, or freeze
6. Document the decision

Persona output without a decision is incomplete.

## 9. Scoring & Severity Model

All reviews—content, UX, technical, and persona—use the same severity language.

### Critical

Blocks trust, safety, completion, or correctness.

Examples:

- Learner cannot finish a required mission honestly
- Security or auth exposure
- Hidden prerequisite that stops progress
- Assistant or product behavior that misleads
- Data handling that risks learner safety or integrity

Critical issues stop forward motion until fixed or explicitly accepted by decision gate.

### High

Serious repeated issue affecting learning or product flow.

Examples:

- Mission wording unclear across multiple attempts
- Path unlock confusion
- Repeated cognitive overload
- Assistant gaps that repeatedly block understanding
- Progress state that confuses learners

High issues must be scheduled before real user exposure.

### Medium

Meaningful friction, but not blocking.

Examples:

- One lesson is denser than necessary
- A diagram needs clearer captioning
- A CTA could be better placed
- Minor terminology inconsistency

Medium issues can ship only if tracked and not multiplied across a path.

### Low

Polish or minor clarity issue.

Examples:

- Wording improvement with no behavior change
- Small visual rhythm tweak
- Non-blocking stylistic preference

Low issues should not delay phase movement unless they accumulate into a pattern.

### Ignore

Isolated noise, preference, or unsupported opinion.

Examples:

- One persona dislikes a valid example style
- Taste disagreement without learning impact
- Non-reproducible complaint
- Suggestion that violates blueprint rules

Ignore does not mean "forgotten." It means "not actionable now."

## 10. Decision Gates

### Continue

*TBD*

### Pause

*TBD*

### Revise

*TBD*

### Freeze

*TBD*

## 11. Content Freeze Rules

*TBD*

## 12. Video Regeneration Readiness

### Preconditions

*TBD*

### Content lock requirements

*TBD*

### Visual lock requirements

*TBD*

## 13. Cursor ↔ Lovable Workflow

### When Cursor changes

*TBD*

### When Lovable changes

*TBD*

### GitHub sync rule

*TBD*

### Rebase rule

*TBD*

### Push rule

*TBD*

## 14. Current Project Status Logic

*TBD*
