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
from scene_normalizer import normalize_scenes  # noqa: E402
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


def _concept_scene(**visual_overrides):
    v = {"term": "AI", "definition": "Artificial intelligence.", "tag": "concept"}
    v.update(visual_overrides)
    return {
        "card": "ConceptCard", "accent": "lavender", "voice": "Charon",
        "spoken": "AI stands for artificial intelligence.", "focus": "AI",
        "visual": v,
    }


def _screenshot_scene(**visual_overrides):
    v = {"eyebrow": "DEMO", "title": "The UI", "caption": "See the button.", "src": "/x.png"}
    v.update(visual_overrides)
    return {
        "card": "ScreenshotCard", "accent": "peach", "voice": "Aoede",
        "spoken": "Look at this screen.", "focus": "screen",
        "visual": v,
    }


def _cta_scene(**visual_overrides):
    v = {"eyebrow": "NEXT", "title": "Keep going", "highlight": "Lesson 2", "tagline": "See you next time."}
    v.update(visual_overrides)
    return {
        "card": "CTACard", "accent": "mintDeep", "voice": "Charon",
        "spoken": "See you in the next lesson.", "focus": "next",
        "visual": v,
    }


class AccentAndFullVisualContractTests(unittest.TestCase):
    def test_missing_accent_fails(self):
        s = _valid_en_scenes()
        del s[0]["accent"]
        errs = validate_scenes(s, locale="en")
        self.assertTrue(any("accent is missing" in e for e in errs), errs)

    def test_unsupported_accent_fails(self):
        s = _valid_en_scenes()
        s[0]["accent"] = "crimson"
        errs = validate_scenes(s, locale="en")
        self.assertTrue(any("accent 'crimson' not in" in e for e in errs), errs)

    def test_every_allowed_accent_passes(self):
        for a in ALLOWED_ACCENTS:
            s = _valid_en_scenes()
            s[0]["accent"] = a
            s[1]["accent"] = a
            self.assertEqual(validate_scenes(s, locale="en"), [], f"accent={a}")

    def test_concept_card_missing_tag_fails(self):
        s = [_concept_scene(tag="")]
        errs = validate_scenes(s, locale="en")
        self.assertTrue(any("visual.tag" in e for e in errs), errs)

    def test_screenshot_card_missing_eyebrow_fails(self):
        s = [_screenshot_scene(eyebrow="")]
        errs = validate_scenes(s, locale="en")
        self.assertTrue(any("visual.eyebrow" in e for e in errs), errs)

    def test_cta_card_missing_eyebrow_highlight_tagline_fail(self):
        for key in ("eyebrow", "highlight", "tagline"):
            s = [_cta_scene(**{key: ""})]
            errs = validate_scenes(s, locale="en")
            self.assertTrue(
                any(f"visual.{key}" in e for e in errs),
                f"expected visual.{key} missing, got {errs}",
            )


class MSAFalsePositiveFixTests(unittest.TestCase):
    def test_msa_yabqa_is_valid(self):
        # "يبقى" is valid MSA ("remains"); must NOT be flagged.
        s = _valid_msa_scenes()
        s[0]["spoken"] = "الذكاء الاصطناعي يبقى مجالًا سريع التطور."
        self.assertEqual(validate_scenes(s, locale="ar-MSA"), [])

    def test_msa_abi_my_father_is_valid(self):
        # "أبي" as MSA "my father" must not be flagged.
        s = _valid_msa_scenes()
        s[0]["spoken"] = "علّمني أبي حبّ العلم منذ الصغر."
        self.assertEqual(validate_scenes(s, locale="ar-MSA"), [])

    def test_msa_still_rejects_unambiguous_gulf_marker(self):
        s = _valid_msa_scenes()
        s[0]["spoken"] = "شلون نبدأ الدرس اليوم؟"
        errs = validate_scenes(s, locale="ar-MSA")
        self.assertTrue(any("dialect markers not allowed in MSA" in e for e in errs), errs)

    def test_msa_still_rejects_unambiguous_egyptian_marker(self):
        s = _valid_msa_scenes()
        s[0]["spoken"] = "دلوقتي نبدأ الدرس."
        errs = validate_scenes(s, locale="ar-MSA")
        self.assertTrue(any("dialect markers not allowed in MSA" in e for e in errs), errs)

    def test_gulf_still_rejects_unambiguous_egyptian_marker(self):
        s = _valid_gulf_scenes()
        s[0]["spoken"] = "عايز أشرح لك الدرس."
        errs = validate_scenes(s, locale="ar-Gulf")
        self.assertTrue(any("Egyptian dialect markers not allowed" in e for e in errs), errs)

    def test_marker_substring_inside_valid_word_not_flagged(self):
        # "وشاح" contains the substring "وش" — must NOT be flagged in MSA.
        # "إيهاب" contains "إيه" — must NOT be flagged.
        s = _valid_msa_scenes()
        s[0]["spoken"] = "ارتدى الوشاح وذهب إيهاب إلى المدرسة."
        self.assertEqual(validate_scenes(s, locale="ar-MSA"), [])

    def test_legacy_egyptian_behavior_unchanged(self):
        scenes = [{
            "card": "TitleCard", "accent": "mint", "voice": "Charon",
            "spoken": "أهلًا بيك، النهاردة هنشوف إزاي الذكاء الاصطناعي بيشتغل.",
            "focus": "إزاي",
            "visual": {"chip": "مقدمة", "title": "أهلًا", "highlight": "AI", "subtitle": "ابدأ معانا."},
        }]
        self.assertEqual(validate_scenes(scenes, locale=None), [])


class LocaleGateHardeningTests(unittest.TestCase):
    """Pre-TTS locale gate: transliteration, dominance, technical allowlist."""

    def test_en_rejects_all_configured_transliterations(self):
        for token in (
            "ezzay", "ezay", "delwa2ty", "3alashan", "yalla",
            "shlon", "shloon", "wayed", "waid",
        ):
            s = _valid_en_scenes()
            s[0]["spoken"] = f"Today we learn how {token} works in practice."
            errs = validate_scenes(s, locale="en")
            self.assertTrue(
                any("transliteration not allowed" in e for e in errs),
                f"{token}: {errs}",
            )

    def test_en_transliteration_token_bounded_no_false_positive(self):
        s = _valid_en_scenes()
        s[0]["spoken"] = "Analyze the nezzayfield model using GPT-4 v2 API."
        self.assertEqual(validate_scenes(s, locale="en"), [])

    def test_msa_arabic_dominance_passes(self):
        self.assertEqual(validate_scenes(_valid_msa_scenes(), locale="ar-MSA"), [])

    def test_gulf_arabic_dominance_passes(self):
        self.assertEqual(validate_scenes(_valid_gulf_scenes(), locale="ar-Gulf"), [])

    def test_msa_insufficient_arabic_dominance_fails(self):
        s = _valid_msa_scenes()
        s[0]["spoken"] = (
            "This lesson explains artificial intelligence mostly in English with one word عربي."
        )
        errs = validate_scenes(s, locale="ar-MSA")
        self.assertTrue(any("Arabic script must dominate" in e for e in errs), errs)

    def test_msa_allows_limited_technical_english(self):
        s = _valid_msa_scenes()
        s[0]["spoken"] = "سنتعلم اليوم كيف يعمل GPT-4 و API في الذكاء الاصطناعي."
        self.assertEqual(validate_scenes(s, locale="ar-MSA"), [])

    def test_gulf_allows_formal_arabic_shared_with_msa(self):
        s = _valid_msa_scenes()
        self.assertEqual(validate_scenes(s, locale="ar-Gulf"), [])

    def test_msa_rejects_arabizi(self):
        s = _valid_msa_scenes()
        s[0]["spoken"] = "مرحبًا، yalla نبدأ الدرس."
        errs = validate_scenes(s, locale="ar-MSA")
        self.assertTrue(any("Arabizi/transliteration" in e for e in errs), errs)

    def test_gulf_rejects_arabizi(self):
        s = _valid_gulf_scenes()
        s[0]["spoken"] = "هلا فيك، delwa2ty نبدأ."
        errs = validate_scenes(s, locale="ar-Gulf")
        self.assertTrue(any("Arabizi/transliteration" in e for e in errs), errs)

    def test_technical_version_numbers_pass_en(self):
        s = _valid_en_scenes()
        s[0]["spoken"] = "We compare GPT-4 and v2 API behavior in this lesson."
        self.assertEqual(validate_scenes(s, locale="en"), [])


class SharedColloquialMarkerTests(unittest.TestCase):
    """`عشان` (and `علشان`) — shared colloquial, allowed in Gulf, rejected in MSA."""
    def test_gulf_allows_ashan(self):
        s = _valid_gulf_scenes()
        s[0]["spoken"] = "هلا فيك، عشان نبدأ الدرس بسرعة."
        self.assertEqual(validate_scenes(s, locale="ar-Gulf"), [])

    def test_gulf_allows_alashan(self):
        s = _valid_gulf_scenes()
        s[0]["spoken"] = "هلا فيك، علشان نكمل الدرس."
        self.assertEqual(validate_scenes(s, locale="ar-Gulf"), [])

    def test_msa_rejects_ashan(self):
        s = _valid_msa_scenes()
        s[0]["spoken"] = "مرحبًا بك، عشان نبدأ الدرس."
        errs = validate_scenes(s, locale="ar-MSA")
        self.assertTrue(any("dialect markers not allowed in MSA" in e for e in errs), errs)

    def test_msa_rejects_alashan(self):
        s = _valid_msa_scenes()
        s[0]["spoken"] = "مرحبًا بك، علشان نبدأ."
        errs = validate_scenes(s, locale="ar-MSA")
        self.assertTrue(any("dialect markers not allowed in MSA" in e for e in errs), errs)

    def test_gulf_still_rejects_unambiguous_egyptian(self):
        for word in ("إيه", "إزاي", "دلوقتي", "عايز", "عاوز", "مفيش"):
            s = _valid_gulf_scenes()
            s[0]["spoken"] = f"هلا فيك، {word} نبدأ."
            errs = validate_scenes(s, locale="ar-Gulf")
            self.assertTrue(
                any("Egyptian dialect markers not allowed" in e for e in errs),
                f"{word}: expected rejection, got {errs}",
            )


# ---------------------------------------------------------------------------
# Normalization tests — reproduce Run 29187962205 defects, prove idempotency,
# prove spoken preservation, prove no cross-locale leakage.
# ---------------------------------------------------------------------------

def _incomplete_title_scene(spoken="Welcome to today's lesson about AI."):
    return {
        "card": "TitleCard", "accent": "mint", "voice": "Charon",
        "spoken": spoken, "focus": "AI",
        # Gemini omitted chip / highlight / subtitle in the failed run.
        "visual": {"title": "Welcome"},
    }


def _incomplete_bullets_scene(spoken="First. Second. Third."):
    return {
        "card": "BulletsCard", "accent": "peach", "voice": "Aoede",
        "spoken": spoken, "focus": "ideas",
        "visual": {},  # missing title AND bullets
    }


def _incomplete_screenshot_scene():
    return {
        "card": "ScreenshotCard", "accent": "yellow", "voice": "Charon",
        "spoken": "Look at this dashboard.", "focus": "dashboard",
        "visual": {"title": "Dashboard", "caption": "The main view.", "src": "/x.png"},
        # missing eyebrow
    }


def _incomplete_cta_scene():
    return {
        "card": "CTACard", "accent": "mintDeep", "voice": "Charon",
        "spoken": "See you soon.", "focus": "next",
        "visual": {},  # missing eyebrow / title / highlight / tagline
    }


class ScreenshotCardMissingSrcFallbackTests(unittest.TestCase):
    """Locale-aware: missing/empty ScreenshotCard.src → BulletsCard.
    Legacy (locale=None): no conversion / no repair of that card's src."""

    def _missing_src_scene(self, spoken, **visual_extra):
        v = {
            "eyebrow": visual_extra.pop("eyebrow", "LOOK"),
            "title": visual_extra.pop("title", "Dashboard"),
            "caption": visual_extra.pop("caption", "First point. Second point."),
            "src": visual_extra.pop("src", ""),
        }
        v.update(visual_extra)
        return {
            "card": "ScreenshotCard", "accent": "yellow", "voice": "Aoede",
            "spoken": spoken, "focus": "dashboard",
            "visual": v,
        }

    def _assert_converted(self, locale, spoken, lesson_title, next_title,
                          **visual_extra):
        scene = self._missing_src_scene(spoken, **visual_extra)
        spoken_before = scene["spoken"]
        focus_before = scene["focus"]
        voice_before = scene["voice"]
        out, repairs = normalize_scenes(
            [scene], locale=locale,
            lesson_title=lesson_title,
            next_lesson_title=next_title,
        )
        self.assertEqual(out[0]["card"], "BulletsCard")
        v = out[0]["visual"]
        self.assertTrue(isinstance(v.get("title"), str) and v["title"].strip())
        self.assertTrue(
            isinstance(v.get("bullets"), list)
            and any(isinstance(b, str) and b.strip() for b in v["bullets"])
        )
        self.assertNotIn("src", v)
        self.assertEqual(out[0]["spoken"], spoken_before)
        self.assertEqual(out[0]["focus"], focus_before)
        self.assertEqual(out[0]["voice"], voice_before)
        self.assertTrue(
            any(
                r.get("field") == "visual.src"
                and "converted to BulletsCard" in r.get("reason", "")
                for r in repairs
            ),
            repairs,
        )
        self.assertEqual(validate_scenes(out, locale=locale), [])
        # Idempotent second pass.
        second, r2 = normalize_scenes(
            out, locale=locale,
            lesson_title=lesson_title,
            next_lesson_title=next_title,
        )
        import json as _json
        self.assertEqual(
            _json.dumps(out, ensure_ascii=False, sort_keys=True),
            _json.dumps(second, ensure_ascii=False, sort_keys=True),
        )
        self.assertEqual(r2, [])

    def test_en_missing_src_converts_to_bullets(self):
        self._assert_converted(
            "en",
            "Look at this dashboard screen carefully.",
            "What AI Can and Cannot Do",
            "AI vs Software",
        )

    def test_msa_missing_src_converts_to_bullets(self):
        self._assert_converted(
            "ar-MSA",
            "انظر إلى هذه الشاشة بعناية.",
            "ما يقدر عليه الذكاء الاصطناعي وما لا يقدر",
            "الذكاء الاصطناعي مقابل البرمجيات",
            eyebrow="لقطة",
            title="لوحة التحكم",
            caption="النقطة الأولى. النقطة الثانية.",
        )

    def test_gulf_missing_src_converts_to_bullets(self):
        self._assert_converted(
            "ar-Gulf",
            "شوف هالشاشة زين.",
            "وش يقدر عليه الذكاء الاصطناعي",
            "الذكاء الاصطناعي مقابل البرامج",
            eyebrow="شوف",
            title="لوحة التحكم",
            caption="النقطة الأولى. النقطة الثانية.",
        )

    def test_en_absent_src_key_also_converts(self):
        scene = self._missing_src_scene("Look at this screen.")
        del scene["visual"]["src"]
        out, repairs = normalize_scenes(
            [scene], locale="en", lesson_title="Lesson",
        )
        self.assertEqual(out[0]["card"], "BulletsCard")
        self.assertTrue(any(r.get("field") == "visual.src" for r in repairs))
        self.assertEqual(validate_scenes(out, locale="en"), [])

    def test_valid_screenshot_with_src_not_converted(self):
        scene = _screenshot_scene()  # has src=/x.png
        out, repairs = normalize_scenes(
            [scene], locale="en", lesson_title="Lesson",
        )
        self.assertEqual(out[0]["card"], "ScreenshotCard")
        self.assertEqual(out[0]["visual"]["src"], "/x.png")
        self.assertFalse(any(r.get("field") == "visual.src" for r in repairs))

    def test_legacy_none_does_not_convert_or_repair_missing_src(self):
        scene = {
            "card": "ScreenshotCard", "accent": "peach", "voice": "Aoede",
            "spoken": "شوف الشاشة دي.", "focus": "screen",
            "visual": {
                "eyebrow": "شوف", "title": "الواجهة",
                "caption": "تفاصيل", "src": "",
            },
        }
        import json as _json
        before = _json.dumps(scene, ensure_ascii=False, sort_keys=True)
        out, repairs = normalize_scenes(
            [scene], locale=None, lesson_title="درس",
        )
        self.assertEqual(out[0]["card"], "ScreenshotCard")
        self.assertEqual(out[0]["visual"].get("src"), "")
        self.assertFalse(
            any(
                "BulletsCard" in str(r.get("card", ""))
                or (
                    r.get("field") == "visual.src"
                    and "converted" in r.get("reason", "")
                )
                for r in repairs
            ),
            repairs,
        )
        # Card identity + empty src preserved (no invented URL / no rewrite).
        self.assertEqual(
            _json.dumps(out[0], ensure_ascii=False, sort_keys=True),
            before,
        )
        # Strict validator still rejects missing src (legacy does not repair).
        errs = validate_scenes(out, locale=None)
        self.assertTrue(any("visual.src" in e for e in errs), errs)


class SceneNormalizerRepairTests(unittest.TestCase):
    def test_repairs_title_card_missing_fields(self):
        scenes = [_incomplete_title_scene()]
        out, repairs = normalize_scenes(
            scenes, locale="en",
            lesson_title="What Is AI",
            next_lesson_title="Prompting Basics",
        )
        v = out[0]["visual"]
        self.assertTrue(v.get("chip"))
        self.assertTrue(v.get("highlight"))
        self.assertTrue(v.get("subtitle"))
        self.assertEqual(v["title"], "Welcome")  # already-valid preserved
        self.assertEqual(validate_scenes(out, locale="en"), [])
        self.assertTrue(any(r["field"] == "visual.chip" for r in repairs))

    def test_repairs_bullets_card_from_spoken(self):
        scenes = [_incomplete_bullets_scene("Alpha. Beta. Gamma. Delta.")]
        out, _ = normalize_scenes(scenes, locale="en", lesson_title="Ideas")
        v = out[0]["visual"]
        self.assertTrue(v.get("title"))
        self.assertGreaterEqual(len(v.get("bullets", [])), 1)
        self.assertEqual(validate_scenes(out, locale="en"), [])

    def test_repairs_screenshot_eyebrow(self):
        scenes = [_incomplete_screenshot_scene()]
        out, _ = normalize_scenes(scenes, locale="en")
        self.assertTrue(out[0]["visual"].get("eyebrow"))
        self.assertEqual(validate_scenes(out, locale="en"), [])

    def test_repairs_cta_all_fields(self):
        scenes = [_incomplete_cta_scene()]
        out, _ = normalize_scenes(
            scenes, locale="en",
            lesson_title="This lesson", next_lesson_title="Next Lesson Title",
        )
        v = out[0]["visual"]
        for k in ("eyebrow", "title", "highlight", "tagline"):
            self.assertTrue(v.get(k), f"missing {k}: {v}")
        self.assertEqual(validate_scenes(out, locale="en"), [])

    def test_missing_accent_gets_deterministic_default(self):
        s = _incomplete_title_scene()
        del s["accent"]
        out, repairs = normalize_scenes([s, s], locale="en", lesson_title="X")
        self.assertIn(out[0]["accent"], ALLOWED_ACCENTS)
        self.assertIn(out[1]["accent"], ALLOWED_ACCENTS)
        # Deterministic by index → different scenes → different accents.
        self.assertNotEqual(out[0]["accent"], out[1]["accent"])
        self.assertTrue(any(r["field"] == "accent" for r in repairs))

    def test_invalid_accent_replaced(self):
        s = _incomplete_title_scene()
        s["accent"] = "crimson"
        out, _ = normalize_scenes([s], locale="en", lesson_title="X")
        self.assertIn(out[0]["accent"], ALLOWED_ACCENTS)

    def test_invalid_voice_NOT_silently_repaired(self):
        s = _incomplete_title_scene()
        s["voice"] = "Kore"
        out, _ = normalize_scenes([s], locale="en", lesson_title="X")
        self.assertEqual(out[0]["voice"], "Kore")  # untouched
        # Strict validator still rejects — normalization doesn't hide it.
        errs = validate_scenes(out, locale="en")
        self.assertTrue(any("voice" in e for e in errs), errs)

    def test_spoken_never_modified(self):
        orig = "This spoken text must not change at all."
        s = _incomplete_title_scene(spoken=orig)
        out, _ = normalize_scenes([s], locale="en", lesson_title="X")
        self.assertEqual(out[0]["spoken"], orig)

    def test_already_valid_scenes_are_byte_equivalent(self):
        good = _valid_en_scenes()
        import json as _json
        before = _json.dumps(good, ensure_ascii=False, sort_keys=True)
        out, repairs = normalize_scenes(good, locale="en", lesson_title="X")
        after = _json.dumps(out, ensure_ascii=False, sort_keys=True)
        self.assertEqual(before, after)
        self.assertEqual(repairs, [])

    def test_idempotent(self):
        scenes = [
            _incomplete_title_scene(),
            _incomplete_bullets_scene(),
            _incomplete_screenshot_scene(),
            _incomplete_cta_scene(),
        ]
        first, r1 = normalize_scenes(
            scenes, locale="en",
            lesson_title="Lesson", next_lesson_title="Next",
        )
        second, r2 = normalize_scenes(
            first, locale="en",
            lesson_title="Lesson", next_lesson_title="Next",
        )
        import json as _json
        self.assertEqual(
            _json.dumps(first, ensure_ascii=False, sort_keys=True),
            _json.dumps(second, ensure_ascii=False, sort_keys=True),
        )
        self.assertEqual(r2, [])
        self.assertGreater(len(r1), 0)


class NormalizerLocaleLeakageTests(unittest.TestCase):
    def _all_defaults_for(self, locale):
        defaults = get_profile(locale).presentation_defaults
        return list(defaults.values())

    def test_en_defaults_have_no_arabic(self):
        from scene_validator import _ARABIC_RE
        for v in self._all_defaults_for("en"):
            self.assertIsNone(_ARABIC_RE.search(v), v)

    def test_msa_defaults_pass_msa_validator(self):
        # Build a synthetic scene per card that ONLY uses defaults and check
        # the whole thing is MSA-clean.
        scenes = [
            _incomplete_title_scene(spoken="مرحبًا بك في هذا الدرس."),
            _incomplete_bullets_scene(spoken="نقطة أولى. نقطة ثانية."),
            _incomplete_screenshot_scene(),
            _incomplete_cta_scene(),
        ]
        # Rewrite spoken for screenshot/cta to be Arabic to satisfy the
        # locale-content check without introducing markers.
        scenes[2]["spoken"] = "انظر إلى هذه الشاشة."
        scenes[2]["visual"]["title"] = "لوحة التحكم"
        scenes[2]["visual"]["caption"] = "النقطة الأولى. النقطة الثانية."
        scenes[3]["spoken"] = "نلتقي قريبًا."
        out, _ = normalize_scenes(
            scenes, locale="ar-MSA",
            lesson_title="الدرس الأول", next_lesson_title="الدرس الثاني",
        )
        self.assertEqual(validate_scenes(out, locale="ar-MSA"), [])

    def test_gulf_defaults_pass_gulf_validator(self):
        scenes = [
            _incomplete_title_scene(spoken="هلا فيك بدرس اليوم."),
            _incomplete_cta_scene(),
        ]
        scenes[1]["spoken"] = "نشوفك بالدرس الجاي."
        out, _ = normalize_scenes(
            scenes, locale="ar-Gulf",
            lesson_title="الدرس", next_lesson_title="الدرس الجاي",
        )
        self.assertEqual(validate_scenes(out, locale="ar-Gulf"), [])

    def test_gulf_defaults_have_no_strict_egyptian_markers(self):
        # Even if the defaults sneak into a Gulf-only pass, they must NOT
        # contain any of the strict Egyptian markers.
        strict_egy = ["إيه", "إزاي", "ازاي", "دلوقتي", "عايز", "عاوز", "مفيش"]
        for v in self._all_defaults_for("ar-Gulf"):
            for m in strict_egy:
                self.assertNotIn(m, v, f"Gulf default {v!r} leaks Egyptian marker {m!r}")

    def test_legacy_defaults_unchanged(self):
        d = get_profile(None).presentation_defaults
        self.assertEqual(d["default_bullet"], "خد الفكرة دي معاك")
        self.assertEqual(d["cta_eyebrow"], "دورك دلوقتي")


class CompositionIdContractTests(unittest.TestCase):
    """Contract: mapping/runtime key is ${lid}__${locale}; Remotion
    composition id is ${lid}--${locale} (no underscore)."""

    def _ids(self, lid, locale):
        return f"{lid}__{locale}", f"{lid}--{locale}"

    def test_composite_uses_double_underscore(self):
        composite, _ = self._ids("intro-m1-l4-ai-can-cannot", "ar-MSA")
        self.assertEqual(composite, "intro-m1-l4-ai-can-cannot__ar-MSA")

    def test_composition_id_uses_double_hyphen_and_no_underscore(self):
        _, comp = self._ids("intro-m1-l4-ai-can-cannot", "ar-MSA")
        self.assertEqual(comp, "intro-m1-l4-ai-can-cannot--ar-MSA")
        self.assertNotIn("_", comp)

    def test_composition_id_for_every_pilot_locale_has_no_underscore(self):
        for locale in ("ar-MSA", "ar-Gulf", "en"):
            _, comp = self._ids("intro-m1-l4-ai-can-cannot", locale)
            self.assertNotIn("_", comp, comp)


class RendererCliTests(unittest.TestCase):
    """render-lesson.mjs must accept <compositionId> [workId]."""

    def test_renderer_accepts_two_args_and_uses_workid_for_tmp(self):
        import os as _os
        HERE_ = os.path.dirname(os.path.abspath(__file__))
        renderer = os.path.join(HERE_, "..", "render-lesson.mjs")
        src = open(renderer).read()
        self.assertIn("process.argv[2]", src)
        self.assertIn("process.argv[3]", src)
        # workId (not compositionId) drives the /tmp path.
        self.assertIn("/tmp/${workId}/", src)
        # selectComposition is keyed on compositionId, not workId.
        self.assertIn("id: compositionId", src)


class LegacyBypassTests(unittest.TestCase):
    """Legacy Egyptian (locale=None): script_writer must NOT normalize.
    Invalid legacy scenes must fail strict validation; cached invalid legacy
    scenes must delete their cache; valid legacy scenes remain byte-equivalent."""

    def setUp(self):
        import tempfile, json as _json
        self._tmp = tempfile.mkdtemp(prefix="legacy_bypass_")
        # Simulate the composite subdir layout used in production (/tmp/<composite>/).
        self._composite_dir = os.path.join(self._tmp, "legacy-lid")
        os.makedirs(self._composite_dir, exist_ok=True)
        self._cache = os.path.join(self._composite_dir, "scenes.json")
        import script_writer  # noqa: F401
        self.script_writer = script_writer
        self._json = _json

    def tearDown(self):
        import shutil
        shutil.rmtree(self._tmp, ignore_errors=True)

    def _legacy_valid(self):
        return [{
            "card": "TitleCard", "accent": "mint", "voice": "Charon",
            "spoken": "أهلًا بيك في الدرس ده عن الذكاء الاصطناعي.",
            "focus": "AI",
            "visual": {
                "chip": "مقدمة", "title": "أهلًا",
                "highlight": "الذكاء", "subtitle": "الدرس الأول.",
            },
        }]

    def test_invalid_legacy_visual_fields_not_repaired(self):
        scenes = [{
            "card": "TitleCard", "accent": "mint", "voice": "Charon",
            "spoken": "أهلًا.", "focus": "x",
            "visual": {"title": "Only title"},
        }]
        self._json.dump(scenes, open(self._cache, "w"), ensure_ascii=False)
        with self.assertRaises(RuntimeError):
            self.script_writer._validate_only_legacy(scenes, "cache", self._cache)
        self.assertFalse(os.path.exists(self._cache))

    def test_invalid_legacy_accent_not_repaired(self):
        scenes = self._legacy_valid()
        scenes[0]["accent"] = "not-a-real-accent"
        self._json.dump(scenes, open(self._cache, "w"), ensure_ascii=False)
        with self.assertRaises(RuntimeError) as ctx:
            self.script_writer._validate_only_legacy(scenes, "cache", self._cache)
        self.assertIn("accent", str(ctx.exception))
        self.assertEqual(scenes[0]["accent"], "not-a-real-accent")
        self.assertFalse(os.path.exists(self._cache))

    def test_valid_legacy_scenes_byte_equivalent(self):
        scenes = self._legacy_valid()
        original = self._json.loads(self._json.dumps(scenes, ensure_ascii=False))
        self._json.dump(scenes, open(self._cache, "w"), ensure_ascii=False)
        returned = self.script_writer._validate_only_legacy(scenes, "cache", self._cache)
        self.assertIs(returned, scenes)
        self.assertEqual(scenes, original)
        self.assertTrue(os.path.exists(self._cache))

    def test_invalid_legacy_cached_deletes_cache_via_generate_scenes_cached(self):
        scenes = self._legacy_valid()
        scenes[0]["accent"] = "bogus"
        self._json.dump(scenes, open(self._cache, "w"), ensure_ascii=False)
        with self.assertRaises(RuntimeError):
            self.script_writer.generate_scenes_cached(
                lesson_id="legacy-lid", blocks=[], title="t",
                cache_path=self._cache, has_quiz=False,
                next_lesson_title=None, locale=None,
            )
        self.assertFalse(os.path.exists(self._cache))

    def test_valid_legacy_cached_via_generate_scenes_cached_byte_equivalent(self):
        scenes = self._legacy_valid()
        raw = self._json.dumps(scenes, ensure_ascii=False, indent=2)
        with open(self._cache, "w") as f:
            f.write(raw)
        returned = self.script_writer.generate_scenes_cached(
            lesson_id="legacy-lid", blocks=[], title="t",
            cache_path=self._cache, has_quiz=False,
            next_lesson_title=None, locale=None,
        )
        self.assertEqual(returned, scenes)
        # Cache untouched on disk (byte-equivalent).
        self.assertEqual(open(self._cache).read(), raw)

    def test_normalize_and_validate_refuses_legacy_locale(self):
        with self.assertRaises(AssertionError):
            self.script_writer._normalize_and_validate(
                self._legacy_valid(), None, "cache", self._cache,
            )

    def test_locale_aware_still_normalizes(self):
        scenes = [{
            "card": "TitleCard", "accent": "mint", "voice": "Charon",
            "spoken": "مرحبًا بك في هذا الدرس.", "focus": "x",
            "visual": {"title": "أهلًا", "highlight": "الدرس", "subtitle": "الأول"},
        }]
        normalized, repairs = self.script_writer._normalize_and_validate(
            scenes, "ar-MSA", "gemini", self._cache,
        )
        self.assertTrue(any(r["field"] == "visual.chip" for r in repairs))
        self.assertTrue(normalized[0]["visual"].get("chip"))


if __name__ == "__main__":
    unittest.main()


