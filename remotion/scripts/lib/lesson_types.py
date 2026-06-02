"""Lesson data schema — single source of truth per lesson.

A lesson is a list of scenes. Each scene defines BOTH:
  - the spoken segment (goes to TTS)
  - the visual card (goes to Remotion)

The pipeline reads this file once and:
  1. Lints all spoken text (Gate 1)
  2. Synthesizes audio (Gate 2)
  3. Emits timing.ts + data.ts under remotion/src/lessons/<id>/
  4. Renders (Gate 4)

Schema:
    LESSON = {
        "id":    "builder-m1-what-is-llm",
        "title": "إيه هو الـ LLM؟",
        "module": "Builder · Module 1",
        "scenes": [Scene, ...],
    }

Scene = {
    "card":   "TitleCard" | "BigStatCard" | "BulletsCard" | "ConceptCard"
              | "CompareCard" | "QuoteCard" | "DiagramCard" | "CTACard",
    "voice":  "Charon" | "Aoede",
    "spoken": str,       # what the narrator says (goes to TTS)
    "focus":  str,       # per-segment pronunciation hints (optional)
    "accent": "peach" | "mint" | "lavender" | "yellow" | "pink"
              | "mintDeep",  # ties into theme.palette
    "visual": dict,      # per-card props (see CARD_SCHEMA below)
}

Card-specific visual props:

  TitleCard:    { "chip": str, "title": str, "highlight": str?, "subtitle": str }
  BigStatCard:  { "intro": str, "big": str, "outro": str }
  BulletsCard:  { "title": str, "bullets": list[str] }     # 2-5 bullets
  ConceptCard:  { "term": str, "definition": str, "tag": str? }
  CompareCard:  { "title": str, "left": {"label", "body"}, "right": {"label", "body"} }
  QuoteCard:    { "text": str, "attribution": str? }
  DiagramCard:  { "title": str, "steps": list[str] }       # 3-5 steps
  CTACard:      { "eyebrow": str, "title": str, "highlight": str?, "tagline": str }
"""
from __future__ import annotations

VALID_CARDS = {
    "TitleCard", "BigStatCard", "BulletsCard", "ConceptCard",
    "CompareCard", "QuoteCard", "DiagramCard", "CTACard",
}
VALID_VOICES = {"Charon", "Aoede"}
VALID_ACCENTS = {"peach", "mint", "lavender", "yellow", "pink", "mintDeep"}


def validate_lesson(lesson: dict) -> list[str]:
    """Return a list of structural errors (empty = OK). Run before lint."""
    errors: list[str] = []
    for key in ("id", "title", "module", "scenes"):
        if key not in lesson:
            errors.append(f"missing top-level key: {key}")
    scenes = lesson.get("scenes", [])
    if not isinstance(scenes, list) or not scenes:
        errors.append("scenes must be a non-empty list")
        return errors
    for i, sc in enumerate(scenes, 1):
        prefix = f"scene #{i}"
        for key in ("card", "voice", "spoken", "visual"):
            if key not in sc:
                errors.append(f"{prefix}: missing {key}")
        if sc.get("card") not in VALID_CARDS:
            errors.append(f"{prefix}: invalid card type {sc.get('card')!r}")
        if sc.get("voice") not in VALID_VOICES:
            errors.append(f"{prefix}: invalid voice {sc.get('voice')!r}")
        acc = sc.get("accent")
        if acc and acc not in VALID_ACCENTS:
            errors.append(f"{prefix}: invalid accent {acc!r}")
    return errors