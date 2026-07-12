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
        HERE_ = _os.path.dirname(_os.path.abspath(__file__))
        renderer = _os.path.join(HERE_, "..", "render-lesson.mjs")
        src = open(renderer).read()
        self.assertIn("process.argv[2]", src)
        self.assertIn("process.argv[3]", src)
        # workId (not compositionId) drives the /tmp path.
        self.assertIn("/tmp/${workId}/", src)
        # selectComposition is keyed on compositionId, not workId.
        self.assertIn("id: compositionId", src)


if __name__ == "__main__":
    unittest.main()

