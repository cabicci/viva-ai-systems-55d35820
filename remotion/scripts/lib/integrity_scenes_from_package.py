"""Deterministic integrity scene projection from localized packages.

No Gemini, no TTS, no network.

The 300-cell report proves, for every localized package:
  * package loads and locale matches path
  * integrity scenes are stamped with the package locale
  * locale propagation + chrome resolve cleanly
  * structure yields a stable scene count

Learner-visible fill strings come from locale presentation_defaults
(locale-safe), not raw package body/bullets. Package content dialect
purity is enforced by validate_localized_scene_integrity on real
Gemini scenes immediately before TTS in build-lesson.py.
"""
from __future__ import annotations
from typing import Any

from .integrity_locale_policy import (
    LOCALIZED_PRESENTATION_LOCALES,
    find_arabic_unicode,
    find_egyptian_marker_hits,
)
from .locale_profiles import get_profile
from .localized_package_adapter import package_to_blocks


def _title_is_locale_safe(title: str, locale: str) -> bool:
    if not title or not title.strip():
        return False
    if locale == "en":
        return find_arabic_unicode(title) is None
    if locale in ("ar-MSA", "ar-Gulf"):
        return len(find_egyptian_marker_hits(title)) == 0
    return False


def blocks_to_integrity_scenes(
    blocks: list[dict[str, Any]],
    *,
    locale: str,
    lesson_title: str,
) -> list[dict[str, Any]]:
    """Convert adapter blocks into locale-stamped integrity scenes."""
    if locale not in LOCALIZED_PRESENTATION_LOCALES:
        raise ValueError(f"Integrity projection requires localized locale, got {locale!r}")

    defaults = get_profile(locale).presentation_defaults
    safe_title = (
        lesson_title.strip()
        if _title_is_locale_safe(lesson_title, locale)
        else defaults["title"]
    )

    scenes: list[dict[str, Any]] = []
    accents = ("mint", "lavender", "peach", "yellow", "pink", "mintDeep")

    def accent_for(i: int) -> str:
        return accents[i % len(accents)]

    # Always open with a TitleCard — locale stamped.
    scenes.append({
        "card": "TitleCard",
        "accent": accent_for(0),
        "locale": locale,
        "spoken": safe_title,
        "focus": safe_title,
        "voice": "Charon",
        "visual": {
            "chip": defaults["title_chip"],
            "title": safe_title,
            "highlight": defaults["highlight"],
            "subtitle": defaults["subtitle"],
        },
    })

    # One structural card per block kind (fill from locale-safe defaults).
    for i, block in enumerate(blocks):
        kind = block.get("kind")
        accent = accent_for(i + 1)

        if kind == "concepts":
            scenes.append({
                "card": "ConceptCard",
                "accent": accent,
                "locale": locale,
                "spoken": defaults["concept_tag"],
                "focus": defaults["concept_tag"],
                "voice": "Aoede",
                "visual": {
                    "term": defaults["title"],
                    "definition": defaults["subtitle"],
                    "tag": defaults["concept_tag"],
                },
            })
        elif kind == "comparison":
            scenes.append({
                "card": "CompareCard",
                "accent": accent,
                "locale": locale,
                "spoken": defaults["bullets_title"],
                "focus": defaults["bullets_title"],
                "voice": "Charon",
                "visual": {
                    "title": defaults["bullets_title"],
                    "left": {
                        "label": defaults["highlight"],
                        "body": defaults["default_bullet"],
                    },
                    "right": {
                        "label": defaults["highlight"],
                        "body": defaults["default_bullet"],
                    },
                },
            })
        elif kind in ("paragraphs", "quiz"):
            if block.get("eyebrow") == "HERO":
                continue  # covered by TitleCard
            scenes.append({
                "card": "BulletsCard",
                "accent": accent,
                "locale": locale,
                "spoken": defaults["default_bullet"],
                "focus": defaults["bullets_title"],
                "voice": "Charon",
                "visual": {
                    "title": defaults["bullets_title"],
                    "bullets": [
                        defaults["default_bullet"],
                        defaults["subtitle"],
                    ],
                },
            })

    scenes.append({
        "card": "CTACard",
        "accent": "mintDeep",
        "locale": locale,
        "spoken": defaults["cta_tagline"],
        "focus": defaults["cta_title"],
        "voice": "Aoede",
        "visual": {
            "eyebrow": defaults["cta_eyebrow"],
            "title": defaults["cta_title"],
            "highlight": defaults["cta_highlight"],
            "tagline": defaults["cta_tagline"],
        },
    })

    # Every scene must carry the package locale.
    for scene in scenes:
        scene["locale"] = locale
    return scenes


def integrity_scenes_from_package(
    pkg: dict[str, Any],
    *,
    expected_locale: str,
) -> list[dict[str, Any]]:
    """Load-path projection: package → blocks → locale-stamped integrity scenes."""
    pkg_locale = pkg.get("locale")
    if pkg_locale != expected_locale:
        raise ValueError(
            f"Package locale {pkg_locale!r} != expected {expected_locale!r}"
        )
    if expected_locale not in LOCALIZED_PRESENTATION_LOCALES:
        raise ValueError(f"Not a localized presentation locale: {expected_locale!r}")
    lesson_title = str(pkg.get("title") or pkg.get("titleEn") or pkg.get("lessonId") or "")
    blocks = package_to_blocks(pkg)
    return blocks_to_integrity_scenes(
        blocks,
        locale=expected_locale,
        lesson_title=lesson_title,
    )
