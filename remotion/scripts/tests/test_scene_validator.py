"""Offline tests for scene_validator + locale-aware fallbacks.
No network, no paid API, no filesystem writes outside /tmp.

Run:  python3 -m unittest discover -s remotion/scripts/tests -v
"""
from __future__ import annotations
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.path.abspath(os.path.join(HERE, "..", "lib"))
if LIB not in sys.path:
    sys.path.insert(0, LIB)

from scene_validator import validate_scenes, ALLOWED_ACCENTS  # noqa: E402
from locale_profiles import get_profile, LEGACY_EGYPTIAN  # noqa: E402


def _base_scene(**overrides):
    scene = {
        "card": "TitleCard",
        "accent": "mint",
        "voice": "Charon",
        "spoken": "Hello, welcome to this lesson about AI.",
        "focus": "AI, lesson",
        "visual": {
            "chip": "INTRO",
            "title": "Welcome",
            "highlight": "AI basics",
            "subtitle": "Your first step into AI.",
        },
    }
    scene.update(overrides)
    return scene


def _valid_en_scenes():
    return [
        _base_scene(),
        {
            "card": "BulletsCard", "accent": "peach", "voice": "Aoede",
            "spoken": "Here are three ideas to remember today.",
            "focus": "ideas",
            "visual": {"title": "Key ideas", "bullets": ["First", "Second", "Third"]},
        },
    ]


def _valid_msa_scenes():
    return [
        {
            "card": "TitleCard", "accent": "mint", "voice": "Charon",
            "spoken": "مرحبًا بك في هذا الدرس عن الذكاء الاصطناعي.",
            "focus": "الذكاء, الاصطناعي",
            "visual": {
                "chip": "مقدمة", "title": "أهلًا بك",
                "highlight": "الذكاء الاصطناعي", "subtitle": "الدرس الأول لك.",
            },
        },
        {
            "card": "BulletsCard", "accent": "peach", "voice": "Aoede",
            "spoken": "سنتعرف اليوم على ثلاث أفكار رئيسية.",
            "focus": "أفكار",
            "visual": {"title": "الأفكار", "bullets": ["الأولى", "الثانية", "الثالثة"]},
        },
    ]


def _valid_gulf_scenes():
    return [
        {
            "card": "TitleCard", "accent": "mint", "voice": "Charon",
            "spoken": "هلا والله فيك، بنشرح لك اليوم كيف يشتغل الذكاء الاصطناعي.",
            "focus": "الذكاء",
            "visual": {
                "chip": "مقدمة", "title": "هلا فيك",
                "highlight": "الذكاء الاصطناعي", "subtitle": "درس اليوم.",
            },
        },
    ]


class SceneValidatorTests(unittest.TestCase):
    # ---------- happy paths ----------
    def test_valid_en_passes(self):
        self.assertEqual(validate_scenes(_valid_en_scenes(), locale="en"), [])

    def test_valid_msa_passes(self):
        self.assertEqual(validate_scenes(_valid_msa_scenes(), locale="ar-MSA"), [])

    def test_valid_gulf_passes(self):
        self.assertEqual(validate_scenes(_valid_gulf_scenes(), locale="ar-Gulf"), [])

    def test_legacy_egyptian_locale_none_skips_content_check(self):
        scenes = [{
            "card": "TitleCard", "accent": "mint", "voice": "Charon",
            "spoken": "أهلًا بيك، النهاردة هنشوف إزاي الذكاء الاصطناعي بيشتغل.",
            "focus": "إزاي",
            "visual": {"chip": "مقدمة", "title": "أهلًا", "highlight": "AI", "subtitle": "ابدأ معانا."},
        }]
        # Legacy Egyptian (locale=None) must NOT flag Egyptian markers.
        self.assertEqual(validate_scenes(scenes, locale=None), [])

    # ---------- locale leakage ----------
    def test_en_rejects_arabic_leakage(self):
        s = _valid_en_scenes()
        s[0]["visual"]["title"] = "Welcome مرحبا"
        errs = validate_scenes(s, locale="en")
        self.assertTrue(any("Arabic-script leakage" in e for e in errs), errs)

    def test_msa_rejects_egyptian_markers(self):
        s = _valid_msa_scenes()
        s[0]["spoken"] = "أهلًا بك، دلوقتي هنبدأ الدرس."
        errs = validate_scenes(s, locale="ar-MSA")
        self.assertTrue(any("dialect markers not allowed in MSA" in e for e in errs), errs)

    def test_msa_rejects_gulf_markers(self):
        s = _valid_msa_scenes()
        s[0]["spoken"] = "أهلًا بك، وش رأيك نبدأ الدرس؟"
        errs = validate_scenes(s, locale="ar-MSA")
        self.assertTrue(any("dialect markers not allowed in MSA" in e for e in errs), errs)

    def test_gulf_rejects_egyptian_markers(self):
        s = _valid_gulf_scenes()
        s[0]["spoken"] = "هلا فيك، عايز أشرح لك الدرس."
        errs = validate_scenes(s, locale="ar-Gulf")
        self.assertTrue(any("Egyptian dialect markers not allowed" in e for e in errs), errs)

    def test_gulf_allows_own_markers(self):
        s = _valid_gulf_scenes()
        s[0]["spoken"] = "هلا فيك، وش رأيك بالدرس؟ ليش ما نبدأ الحين؟"
        self.assertEqual(validate_scenes(s, locale="ar-Gulf"), [])

    # ---------- structural checks ----------
    def test_empty_scenes_fails(self):
        self.assertTrue(validate_scenes([], locale="en"))

    def test_unsupported_voice_fails(self):
        s = _valid_en_scenes()
        s[0]["voice"] = "Kore"
        errs = validate_scenes(s, locale="en")
        self.assertTrue(any("voice" in e for e in errs), errs)

    def test_empty_spoken_fails(self):
        s = _valid_en_scenes()
        s[0]["spoken"] = "   "
        errs = validate_scenes(s, locale="en")
        self.assertTrue(any("spoken text is empty" in e for e in errs), errs)

    def test_incomplete_visual_fails(self):
        s = _valid_en_scenes()
        s[0]["visual"] = {"chip": "INTRO", "title": "Welcome"}  # missing highlight/subtitle
        errs = validate_scenes(s, locale="en")
        self.assertTrue(any("visual.highlight" in e for e in errs), errs)
        self.assertTrue(any("visual.subtitle" in e for e in errs), errs)

    def test_compare_card_needs_left_right(self):
        s = [{
            "card": "CompareCard", "accent": "mint", "voice": "Charon",
            "spoken": "Compare A and B.", "focus": "compare",
            "visual": {"title": "A vs B", "left": {"label": "A"}, "right": {}},
        }]
        errs = validate_scenes(s, locale="en")
        self.assertTrue(any("left needs label+body" in e or "right needs label+body" in e for e in errs), errs)

    def test_bullets_card_needs_nonempty_bullets(self):
        s = _valid_en_scenes()
        s[1]["visual"]["bullets"] = []
        errs = validate_scenes(s, locale="en")
        self.assertTrue(any("bullets must be non-empty" in e for e in errs), errs)

    def test_unsupported_card_fails(self):
        s = _valid_en_scenes()
        s[0]["card"] = "MysteryCard"
        errs = validate_scenes(s, locale="en")
        self.assertTrue(any("unsupported card" in e for e in errs), errs)


class LocaleProfileFallbackLabelsTests(unittest.TestCase):
    def test_legacy_focus_label_preserved(self):
        p = get_profile(None)
        self.assertIs(p, LEGACY_EGYPTIAN)
        self.assertEqual(p.focus_note_label, "ملاحظات نطق")

    def test_new_locales_focus_labels(self):
        self.assertEqual(get_profile("ar-MSA").focus_note_label, "ملاحظات نطق")
        self.assertEqual(get_profile("ar-Gulf").focus_note_label, "ملاحظات نطق")
        self.assertEqual(get_profile("en").focus_note_label, "Pronunciation notes")

    def test_english_focus_label_is_not_arabic(self):
        from scene_validator import _ARABIC_RE
        self.assertIsNone(_ARABIC_RE.search(get_profile("en").focus_note_label))

    def test_fallback_bullets_labels_are_locale_specific(self):
        # Legacy Egyptian preserves the exact original strings.
        legacy = LEGACY_EGYPTIAN.fallback_bullets_labels
        self.assertEqual(legacy["default_title"], "الفكرة")
        self.assertEqual(legacy["default_bullet"], "خد الفكرة دي معاك")
        # Each new locale has its own text; not Egyptian, not English for Arabic ones.
        msa = get_profile("ar-MSA").fallback_bullets_labels
        gulf = get_profile("ar-Gulf").fallback_bullets_labels
        en = get_profile("en").fallback_bullets_labels
        self.assertNotIn("دي", msa["default_bullet"])
        self.assertNotIn("دي", gulf["default_bullet"])
        self.assertRegex(en["default_bullet"], r"[A-Za-z]")


if __name__ == "__main__":
    unittest.main()
