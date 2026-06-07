# Mission Target Design

## Purpose

This document defines the target mission experience inside lessons.

It translates the Mission Constitution into learner-facing UI, states, and behavior.

## Mission block position

The mission should appear near the end of the lesson after:

1. Orientation
2. Core explanation
3. Example or template
4. Optional quiz/light check

The learner should not see the mission before they understand what to do.

## Mission block structure

### 1. Mission why

A short sentence explaining why this mission matters.

Example:

> المهمة دي هتخليك تطبق فكرة الدرس على موقف حقيقي من حياتك أو شغلك.

### 2. What you will do

A simple 1–2 sentence explanation of the task.

### 3. Steps

Clear numbered steps, maximum 3–4 steps.

### 4. Starter template

A copyable starter template or example.

The template should reduce blank-page fear.

### 5. Input area

A simple textarea with warm placeholder text.

Example placeholder:

> اكتب إجابتك هنا ببساطة… مش لازم تكون مثالية.

### 6. Submit action

Primary button:

**ابعت وخد Feedback**

Avoid:

- "Submit for evaluation"
- "Pass mission"
- "Get score"

### 7. Continue-later option

Secondary calm action:

**مش جاهز دلوقتي — كمّل وارجع لها بعدين**

This should not feel like failure or cheating.

## Feedback states

### Clear

Use when the answer is good enough to move forward.

Learner message:

> واضح إنك فهمت الفكرة الأساسية. تقدر تكمل، ولو حبيت تطوّر إجابتك بعدين ارجع لها.

### Needs clarification

Use when the answer is too vague or missing something important.

Learner message:

> إجابتك ماشية في الاتجاه الصح، بس محتاجة توضيح بسيط.

### Try adding this

Use when the learner needs a specific improvement.

Learner message:

> جرّب تضيف مثال أو خطوة عملية واحدة عشان إجابتك تبقى أقوى.

## Scoring display

Do not show numeric score to the learner.

Internal score may exist, but UI should show friendly feedback states only.

## Progress behavior

Meaningful attempt should unlock progress.

A learner can continue after submitting a real attempt, even if feedback suggests improvement.

## Retry behavior

After feedback, offer:

**حسّن إجابتي**

Retry should feel like improvement, not punishment.

## Model answer behavior

After two weak attempts, offer:

**شوف مثال يساعدك**

The model answer should not auto-pass.

After viewing it, the learner should be invited to resubmit in their own words.

## Skip behavior

Skip wording:

**مش جاهز دلوقتي — كمّل وارجع لها بعدين**

Skip should:

- Allow movement forward without shame
- Keep the mission available for later
- Not mark the mission as a perfect pass

## Logged-out behavior

If the learner is logged out, show the mission preview but explain clearly:

> علشان نحفظ تقدمك وتاخد Feedback، سجّل دخولك الأول.

Primary CTA:

**سجّل دخولك واحفظ تقدمي**

## Visual tone

Mission UI should feel like a guided practice card, not an exam panel.

Avoid:

- Red failure language
- Big numeric grades
- Harsh pass/fail framing
- Dense rubric tables

Prefer:

- Calm card
- Clear steps
- Helpful example
- Friendly feedback
- One primary action

## Current system changes implied later

Later implementation should review:

- Visible score /100
- AI score controlling pass
- Immediate skip-as-pass
- Reveal auto-pass
- Attempt count mismatch
- Multiple mission blocks
- Unused mission-runtime / user_mission_state layer
- Logged-out mission dead-end
