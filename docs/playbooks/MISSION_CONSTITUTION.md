# Mission Constitution

## Purpose

Missions are practice, not exams.

A mission exists to help the learner take one small real action after the lesson and feel: “I understood something and I can use it.”

The mission should build confidence, not prove intelligence.

## Core rule

Progress is unlocked by meaningful attempt, not perfect score.

A learner should be able to move forward after an honest attempt, even if the answer needs improvement.

## Mission types

### 1. Quick Check

A small check for light or conceptual lessons.

Used when the goal is reflection, recognition, or a simple decision.

### 2. Practice Mission

The default mission type.

A small applied task connected directly to the lesson’s main Aha.

### 3. Capstone / Build Mission

A bigger mission used at the end of a module or path.

Not every lesson needs this.

## Gating philosophy

Missions should not feel like hard gates.

The learner should not be blocked because of a low AI score.

The system should reward honest effort and guide improvement.

## Scoring

Do not show numeric scores to beginners.

Replace visible scores with simple feedback states:

- **Clear**
- **Needs clarification**
- **Try adding this**

Numeric scoring may exist internally, but should not be the learner-facing experience.

## Skip behavior

Skip should exist, but it should not feel like bypassing learning.

Preferred wording:

> مش جاهز دلوقتي — كمّل وارجع لها بعدين

Skip means the learner can continue without shame, but the mission remains part of the learning journey.

## Model answer behavior

Model answers teach; they do not automatically pass the learner.

After showing a model answer, the learner should be encouraged to resubmit a simple improved version in their own words.

## Attempts

The flow should be:

1. First attempt
2. Helpful AI feedback
3. Retry
4. After two weak attempts, show a helpful example
5. Learner resubmits a simple improved answer

## Target learner experience

Each mission should include:

1. Why this mission matters
2. What to do
3. Clear steps
4. A starter template or example
5. A simple input area
6. Encouraging feedback
7. A calm option to continue and return later

## What missions must avoid

- Exam feeling
- Visible score pressure
- Vague creative prompts
- Hidden prerequisites
- Long unclear instructions
- Punishing tone
- Auto-pass from model answer
- Blocking progress because of imperfect wording

## Redesign implication

The current mission system should be reviewed against this constitution before code changes.

### Known current mismatches

- Visible /100 score
- AI score controls pass
- Skip can pass immediately
- Reveal model answer can auto-pass
- Attempt count may be inconsistent
- Some lessons have no mission
- Some lessons may have missions that feel like exams
