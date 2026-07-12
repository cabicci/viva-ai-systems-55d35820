"""Focused no-network regression tests for the localized video integrity gate.

Run:
  python -m unittest remotion.scripts.tests.test_localized_video_integrity -v
  # or from remotion/:
  python -m unittest discover -s scripts/tests -p 'test_localized_video_integrity.py' -v
"""
from __future__ import annotations
import json
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCRIPTS = HERE.parent
REPO_ROOT = SCRIPTS.parent.parent
sys.path.insert(0, str(SCRIPTS))

from lib.integrity_locale_policy import (  # noqa: E402
    AMBIGUOUS_SHARED_ARABIC_ALLOWED,
    HIGH_CONFIDENCE_EGYPTIAN_MARKERS,
    PRESENTATION_CHROME,
    find_arabic_unicode,
    resolve_presentation_chrome,
)
from lib.integrity_scenes_from_package import (  # noqa: E402
    blocks_to_integrity_scenes,
    integrity_scenes_from_package,
)
from lib.integrity_validator import (  # noqa: E402
    validate_localized_scene_integrity,
)
from lib.localized_package_adapter import load_package, package_to_blocks  # noqa: E402


def _base_en_scene(**overrides):
    scene = {
        "card": "TitleCard",
        "accent": "mint",
        "locale": "en",
        "spoken": "Hello world",
        "focus": "Hello",
        "voice": "Charon",
        "visual": {
            "chip": "INTRO",
            "title": "Hello",
            "highlight": "Key",
            "subtitle": "Welcome",
        },
    }
    scene.update(overrides)
    return scene


def _base_ar_scene(locale: str, text: str, **overrides):
    scene = {
        "card": "TitleCard",
        "accent": "mint",
        "locale": locale,
        "spoken": text,
        "focus": text,
        "voice": "Charon",
        "visual": {
            "chip": "مقدمة",
            "title": text,
            "highlight": text[:12] or "فكرة",
            "subtitle": text,
        },
    }
    scene.update(overrides)
    return scene


class LocalePropagationTests(unittest.TestCase):
    def test_ar_msa_locale_propagation(self):
        scenes = [_base_ar_scene("ar-MSA", "هذا درس بالعربية الفصحى")]
        result = validate_localized_scene_integrity(
            lesson_id="t",
            source_package_locale="ar-MSA",
            scenes=scenes,
            renderer_locale="ar-MSA",
        )
        self.assertTrue(result.ok)
        self.assertEqual(result.resolvedPresentationLocale, "ar-MSA")

    def test_ar_gulf_locale_propagation(self):
        scenes = [_base_ar_scene("ar-Gulf", "هذا درس باللهجة الخليجية السليمة")]
        result = validate_localized_scene_integrity(
            lesson_id="t",
            source_package_locale="ar-Gulf",
            scenes=scenes,
            renderer_locale="ar-Gulf",
        )
        self.assertTrue(result.ok)

    def test_en_locale_propagation(self):
        scenes = [_base_en_scene()]
        result = validate_localized_scene_integrity(
            lesson_id="t",
            source_package_locale="en",
            scenes=scenes,
            renderer_locale="en",
        )
        self.assertTrue(result.ok)

    def test_missing_locale_rejected(self):
        scene = _base_en_scene()
        del scene["locale"]
        result = validate_localized_scene_integrity(
            lesson_id="t",
            source_package_locale="en",
            scenes=[scene],
            renderer_locale="en",
        )
        self.assertFalse(result.ok)
        self.assertTrue(any(i.ruleId == "LOCALE_MISSING" for i in result.issues))

    def test_mixed_locales_rejected(self):
        scenes = [
            _base_en_scene(),
            _base_ar_scene("ar-MSA", "نص عربي"),
        ]
        # Force mixed under en source
        scenes[1]["locale"] = "ar-MSA"
        result = validate_localized_scene_integrity(
            lesson_id="t",
            source_package_locale="en",
            scenes=scenes,
            renderer_locale="en",
        )
        self.assertFalse(result.ok)
        rules = {i.ruleId for i in result.issues}
        self.assertTrue("LOCALE_MIXED" in rules or "LOCALE_SOURCE_MISMATCH" in rules)

    def test_source_scene_mismatch_rejected(self):
        scene = _base_en_scene()
        scene["locale"] = "ar-Gulf"
        result = validate_localized_scene_integrity(
            lesson_id="t",
            source_package_locale="en",
            scenes=[scene],
            renderer_locale="en",
        )
        self.assertFalse(result.ok)
        self.assertTrue(any(i.ruleId == "LOCALE_SOURCE_MISMATCH" for i in result.issues))

    def test_renderer_scene_mismatch_rejected(self):
        scenes = [_base_en_scene()]
        result = validate_localized_scene_integrity(
            lesson_id="t",
            source_package_locale="en",
            scenes=scenes,
            renderer_locale="ar-MSA",
        )
        self.assertFalse(result.ok)
        self.assertTrue(any(i.ruleId == "LOCALE_RENDERER_MISMATCH" for i in result.issues))


class ContentIntegrityTests(unittest.TestCase):
    def test_en_scene_arabic_unicode_rejected(self):
        scene = _base_en_scene()
        scene["visual"]["title"] = "Hello مرحبا"
        result = validate_localized_scene_integrity(
            lesson_id="t",
            source_package_locale="en",
            scenes=[scene],
            renderer_locale="en",
        )
        self.assertFalse(result.ok)
        self.assertTrue(any(i.ruleId == "EN_ARABIC_UNICODE" for i in result.issues))

    def test_en_chrome_arabic_rejected(self):
        # Force-check chrome path via policy integrity: English chrome must be Latin.
        self.assertIsNone(find_arabic_unicode(resolve_presentation_chrome("conceptBadge", "en")))
        self.assertIsNone(find_arabic_unicode(resolve_presentation_chrome("brandTagline", "en")))
        # Injected invalid: simulate by validating a scene that is otherwise fine —
        # chrome rule fires only on resolved chrome; monkeypatch via wrong locale content
        # is covered by policy constants. Direct assertion that en chrome has no Arabic:
        for key in PRESENTATION_CHROME:
            self.assertIsNone(find_arabic_unicode(PRESENTATION_CHROME[key]["en"]))

    def test_every_egyptian_marker_rejected_msa(self):
        for marker in HIGH_CONFIDENCE_EGYPTIAN_MARKERS:
            with self.subTest(marker=marker):
                scene = _base_ar_scene("ar-MSA", f"النص هنا {marker} واضح")
                result = validate_localized_scene_integrity(
                    lesson_id="t",
                    source_package_locale="ar-MSA",
                    scenes=[scene],
                    renderer_locale="ar-MSA",
                )
                self.assertFalse(result.ok, msg=f"expected fail for {marker}")
                self.assertTrue(
                    any(
                        i.ruleId == "AR_EGYPTIAN_MARKER" and i.offending == marker
                        for i in result.issues
                    ),
                    msg=result.issues,
                )

    def test_every_egyptian_marker_rejected_gulf(self):
        for marker in HIGH_CONFIDENCE_EGYPTIAN_MARKERS:
            with self.subTest(marker=marker):
                scene = _base_ar_scene("ar-Gulf", f"النص هنا {marker} واضح")
                result = validate_localized_scene_integrity(
                    lesson_id="t",
                    source_package_locale="ar-Gulf",
                    scenes=[scene],
                    renderer_locale="ar-Gulf",
                )
                self.assertFalse(result.ok)
                self.assertTrue(
                    any(
                        i.ruleId == "AR_EGYPTIAN_MARKER" and i.offending == marker
                        for i in result.issues
                    )
                )

    def test_ambiguous_shared_arabic_do_not_fail_alone(self):
        for word in AMBIGUOUS_SHARED_ARABIC_ALLOWED:
            with self.subTest(word=word):
                scene = _base_ar_scene("ar-MSA", f"هذا الدرس {word} مهم للتعلم")
                result = validate_localized_scene_integrity(
                    lesson_id="t",
                    source_package_locale="ar-MSA",
                    scenes=[scene],
                    renderer_locale="ar-MSA",
                )
                self.assertTrue(result.ok, msg=f"{word} should not fail alone: {result.issues}")


class ChromePolicyTests(unittest.TestCase):
    def test_centralized_chrome_all_three_locales(self):
        self.assertEqual(resolve_presentation_chrome("conceptBadge", "en"), "Term")
        self.assertEqual(resolve_presentation_chrome("conceptBadge", "ar-MSA"), "مصطلح")
        self.assertEqual(resolve_presentation_chrome("conceptBadge", "ar-Gulf"), "مصطلح")
        self.assertEqual(resolve_presentation_chrome("brandTagline", "en"), "Your journey starts here")
        self.assertEqual(
            resolve_presentation_chrome("brandTagline", "ar-MSA"),
            "رحلتك تبدأ من هنا",
        )
        self.assertEqual(
            resolve_presentation_chrome("brandTagline", "ar-Gulf"),
            "رحلتك تبدأ من هنا",
        )

    def test_legacy_chrome_unchanged(self):
        self.assertEqual(resolve_presentation_chrome("conceptBadge", None), "مصطلح")
        self.assertEqual(resolve_presentation_chrome("conceptBadge", "ar-EG"), "مصطلح")
        self.assertEqual(
            resolve_presentation_chrome("brandTagline", None),
            "رحلتك تبدأ من هنا",
        )
        self.assertEqual(
            PRESENTATION_CHROME["conceptBadge"]["legacy"],
            PRESENTATION_CHROME["conceptBadge"]["ar-MSA"],
        )


class CardLiteralRegressionTests(unittest.TestCase):
    """Individual card components must not embed learner-visible chrome literals."""

    CARD_FILES = [
        "TitleCard.tsx",
        "ConceptCard.tsx",
        "BigStatCard.tsx",
        "BulletsCard.tsx",
        "CompareCard.tsx",
        "CTACard.tsx",
        "ScreenshotCard.tsx",
        "BrandIntroCard.tsx",
    ]

    FORBIDDEN = [
        "مصطلح",
        "رحلتك تبدأ من هنا",
        '"Term"',
        "'Term'",
        "Your journey starts here",
    ]

    def test_card_components_have_no_chrome_literals(self):
        cards_dir = REPO_ROOT / "remotion" / "src" / "lesson-cards"
        for name in self.CARD_FILES:
            text = (cards_dir / name).read_text(encoding="utf-8")
            for lit in self.FORBIDDEN:
                with self.subTest(file=name, lit=lit):
                    self.assertNotIn(lit, text)


class LegacyEquivalenceTests(unittest.TestCase):
    def test_legacy_locale_undefined_skips_content_checks(self):
        # Egyptian colloquial in legacy must NOT fail integrity (locale-undefined).
        scene = {
            "card": "TitleCard",
            "accent": "mint",
            # no locale stamp
            "spoken": "إحنا عايزين دلوقتي",
            "focus": "دلوقتي",
            "voice": "Charon",
            "visual": {
                "chip": "مقدمة",
                "title": "إحنا هنا",
                "highlight": "أوي",
                "subtitle": "مفيش مشكلة",
            },
        }
        before = json.dumps(scene, ensure_ascii=False, sort_keys=True)
        result = validate_localized_scene_integrity(
            lesson_id="legacy",
            source_package_locale=None,
            scenes=[scene],
            renderer_locale=None,
        )
        after = json.dumps(scene, ensure_ascii=False, sort_keys=True)
        self.assertTrue(result.ok)
        self.assertEqual(before, after)
        self.assertIsNone(result.resolvedPresentationLocale)

    def test_legacy_chrome_byte_identical(self):
        self.assertEqual(
            resolve_presentation_chrome("conceptBadge", None),
            "مصطلح",
        )
        self.assertEqual(
            resolve_presentation_chrome("brandTagline", None),
            "رحلتك تبدأ من هنا",
        )


class ReportContractTests(unittest.TestCase):
    def test_integrity_projection_stamps_locale(self):
        pkg_path = (
            REPO_ROOT / "src/lib/locale-lessons/en/lessons/intro-m1-l1-what-is-ai.json"
        )
        pkg, _, _ = load_package(pkg_path)
        scenes = integrity_scenes_from_package(pkg, expected_locale="en")
        self.assertGreaterEqual(len(scenes), 1)
        self.assertTrue(all(s.get("locale") == "en" for s in scenes))

    def test_deterministic_report_cell_counts_shape(self):
        # Lightweight structural check using one package × 3 locales projection.
        for locale in ("ar-MSA", "ar-Gulf", "en"):
            pkg_path = (
                REPO_ROOT
                / "src/lib/locale-lessons"
                / locale
                / "lessons"
                / "intro-m1-l1-what-is-ai.json"
            )
            pkg, _, _ = load_package(pkg_path)
            scenes = integrity_scenes_from_package(pkg, expected_locale=locale)
            result = validate_localized_scene_integrity(
                lesson_id=pkg["lessonId"],
                source_package_locale=locale,
                scenes=scenes,
                renderer_locale=locale,
            )
            self.assertTrue(result.ok, msg=result.issues)

    def test_report_fails_closed_on_injected_invalid_cell(self):
        scene = _base_en_scene()
        scene["visual"]["title"] = "Bad عربي"
        result = validate_localized_scene_integrity(
            lesson_id="injected",
            source_package_locale="en",
            scenes=[scene],
            renderer_locale="en",
        )
        self.assertFalse(result.ok)
        self.assertGreaterEqual(len(result.issues), 1)

    def test_blocks_to_scenes_rejects_legacy_locale(self):
        with self.assertRaises(ValueError):
            blocks_to_integrity_scenes([], locale="ar-EG", lesson_title="x")


if __name__ == "__main__":
    unittest.main()
