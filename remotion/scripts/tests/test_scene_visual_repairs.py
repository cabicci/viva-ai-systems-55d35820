"""Focused generic tests for CompareCard / ScreenshotCard deterministic repairs.

Schema-driven only — no lesson-id or final-three composite-key branches.
"""
from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCRIPTS = HERE.parent
sys.path.insert(0, str(SCRIPTS / "lib"))

from scene_normalizer import normalize_scenes  # noqa: E402
from scene_validator import validate_scenes, _ARABIC_RE  # noqa: E402


def _compare_scene(**overrides):
    base = {
        "card": "CompareCard",
        "accent": "mint",
        "voice": "Charon",
        "spoken": "Manual work is slow versus automated work is fast.",
        "focus": "compare",
        "visual": {
            "title": "Manual vs Automated",
            "left": {"label": "Manual", "body": "Slow and error-prone."},
            "right": {"label": "Automated", "body": "Fast and consistent."},
        },
    }
    base.update(overrides)
    if "visual" in overrides:
        base["visual"] = overrides["visual"]
    return base


def _screenshot_scene(**visual_overrides):
    v = {
        "eyebrow": "DEMO",
        "title": "The UI",
        "caption": "See the button.",
        "src": "/assets/demo-screen.png",
    }
    v.update(visual_overrides)
    return {
        "card": "ScreenshotCard",
        "accent": "peach",
        "voice": "Aoede",
        "spoken": "Look at this screen carefully.",
        "focus": "screen",
        "visual": v,
    }


class CompareCardRepairTests(unittest.TestCase):
    def test_missing_left_label_from_body(self):
        s = _compare_scene(
            visual={
                "title": "A vs B",
                "left": {"body": "Manual review takes hours every day."},
                "right": {"label": "Auto", "body": "Runs in seconds."},
            }
        )
        out, repairs = normalize_scenes([s], locale="en", lesson_title="Ops")
        left = out[0]["visual"]["left"]
        self.assertTrue(left["label"])
        self.assertEqual(left["body"], "Manual review takes hours every day.")
        self.assertTrue(left["label"] in left["body"] or left["label"].split()[0] in left["body"])
        self.assertEqual(validate_scenes(out, locale="en"), [])
        self.assertTrue(any(r["field"] == "visual.left" for r in repairs))

    def test_missing_left_body_with_alternate_side_local(self):
        s = _compare_scene(
            visual={
                "title": "A vs B",
                "left": {"label": "Manual", "text": "Takes a long time."},
                "right": {"label": "Auto", "body": "Finishes quickly."},
            }
        )
        out, _ = normalize_scenes([s], locale="en")
        self.assertEqual(out[0]["visual"]["left"]["body"], "Takes a long time.")
        self.assertEqual(validate_scenes(out, locale="en"), [])

    def test_missing_right_label_from_body(self):
        s = _compare_scene(
            visual={
                "title": "A vs B",
                "left": {"label": "Manual", "body": "Slow path."},
                "right": {"body": "Automated path finishes quickly."},
            }
        )
        out, _ = normalize_scenes([s], locale="en")
        self.assertTrue(out[0]["visual"]["right"]["label"])
        self.assertEqual(validate_scenes(out, locale="en"), [])

    def test_missing_right_body_with_alternate(self):
        s = _compare_scene(
            visual={
                "title": "A vs B",
                "left": {"label": "Manual", "body": "Slow path."},
                "right": {"label": "Auto", "content": "Fast path."},
            }
        )
        out, _ = normalize_scenes([s], locale="en")
        self.assertEqual(out[0]["visual"]["right"]["body"], "Fast path.")
        self.assertEqual(validate_scenes(out, locale="en"), [])

    def test_multiple_missing_side_fields(self):
        s = _compare_scene(
            visual={
                "title": "A vs B",
                "left": {"body": "Human drafting is slow."},
                "right": {"body": "Machine drafting is fast."},
            }
        )
        out, _ = normalize_scenes([s], locale="en")
        self.assertEqual(validate_scenes(out, locale="en"), [])

    def test_side_as_string(self):
        s = _compare_scene(
            visual={
                "title": "A vs B",
                "left": "Human drafting is slow.",
                "right": {"label": "Auto", "body": "Machine drafting is fast."},
            }
        )
        out, _ = normalize_scenes([s], locale="en")
        self.assertEqual(out[0]["visual"]["left"]["body"], "Human drafting is slow.")
        self.assertEqual(validate_scenes(out, locale="en"), [])

    def test_both_sides_as_strings(self):
        s = _compare_scene(
            visual={
                "title": "A vs B",
                "left": "Human drafting is slow.",
                "right": "Machine drafting is fast.",
            }
        )
        out, _ = normalize_scenes([s], locale="en")
        self.assertEqual(validate_scenes(out, locale="en"), [])

    def test_incomplete_side_dictionaries(self):
        s = _compare_scene(
            visual={
                "title": "A vs B",
                "left": {},
                "right": {},
            },
            spoken="Reactive teams wait versus proactive teams prepare.",
        )
        out, _ = normalize_scenes([s], locale="en")
        self.assertEqual(validate_scenes(out, locale="en"), [])
        self.assertIn("Reactive", out[0]["visual"]["left"]["body"])
        self.assertIn("proactive", out[0]["visual"]["right"]["body"].lower())

    def test_derivation_from_narration_clauses(self):
        s = _compare_scene(
            visual={"title": "", "left": {}, "right": {}},
            spoken="Before: chaotic inbox. versus After: organized queue.",
        )
        out, _ = normalize_scenes([s], locale="en")
        self.assertEqual(validate_scenes(out, locale="en"), [])
        self.assertTrue(out[0]["visual"]["title"])

    def test_fail_closed_when_sides_cannot_be_derived(self):
        s = _compare_scene(
            visual={"title": "Alone", "left": {}, "right": {}},
            spoken="This narration has no comparison structure at all.",
        )
        out, _ = normalize_scenes([s], locale="en")
        errs = validate_scenes(out, locale="en")
        self.assertTrue(any("needs label+body" in e for e in errs), errs)

    def test_valid_compare_unchanged(self):
        s = _compare_scene()
        original = copy.deepcopy(s)
        out, repairs = normalize_scenes([s], locale="en")
        self.assertEqual(out[0]["visual"], original["visual"])
        self.assertFalse(any(r["card"] == "CompareCard" and "visual.left" in r["field"] for r in repairs))
        self.assertEqual(validate_scenes(out, locale="en"), [])

    def test_deterministic_and_idempotent(self):
        s = _compare_scene(
            visual={
                "title": "A vs B",
                "left": {"body": "Manual review takes hours every day."},
                "right": {"body": "Automated review finishes in seconds."},
            }
        )
        first, r1 = normalize_scenes([copy.deepcopy(s)], locale="en")
        second, r2 = normalize_scenes(copy.deepcopy(first), locale="en")
        third, _ = normalize_scenes([copy.deepcopy(s)], locale="en")
        self.assertEqual(first, third)
        self.assertEqual(first, second)
        self.assertEqual(r2, [])


class ScreenshotCardRepairTests(unittest.TestCase):
    def test_missing_title_with_caption(self):
        s = _screenshot_scene(title="")
        s["visual"].pop("title", None)
        s["visual"]["caption"] = "Primary dashboard view."
        out, repairs = normalize_scenes([s], locale="en")
        self.assertEqual(out[0]["visual"]["title"], "Primary dashboard view.")
        self.assertEqual(out[0]["visual"]["src"], "/assets/demo-screen.png")
        self.assertEqual(validate_scenes(out, locale="en"), [])
        self.assertTrue(any(r["field"] == "visual.title" for r in repairs))

    def test_empty_title_with_caption(self):
        s = _screenshot_scene(title="   ", caption="Caption title source.")
        out, _ = normalize_scenes([s], locale="en")
        self.assertEqual(out[0]["visual"]["title"], "Caption title source.")
        self.assertEqual(validate_scenes(out, locale="en"), [])

    def test_missing_title_eyebrow_when_caption_empty(self):
        s = _screenshot_scene(title="", caption="", eyebrow="SCREEN")
        s["visual"]["title"] = ""
        s["visual"]["caption"] = "   "
        out, _ = normalize_scenes([s], locale="en")
        self.assertEqual(out[0]["visual"]["title"], "SCREEN")
        self.assertEqual(out[0]["visual"]["src"], "/assets/demo-screen.png")
        errs = validate_scenes(out, locale="en")
        self.assertTrue(any("caption" in e for e in errs), errs)
        self.assertFalse(any("title" in e for e in errs), errs)

    def test_missing_title_from_narration(self):
        s = _screenshot_scene(title="", caption="", eyebrow="")
        s["visual"]["title"] = ""
        s["visual"]["caption"] = ""
        s["visual"]["eyebrow"] = ""
        s["spoken"] = "Inspect the settings panel carefully."
        out, _ = normalize_scenes([s], locale="en")
        self.assertTrue(out[0]["visual"]["title"])
        self.assertIn("settings", out[0]["visual"]["title"].lower())
        self.assertEqual(out[0]["visual"]["src"], "/assets/demo-screen.png")
        errs = validate_scenes(out, locale="en")
        self.assertFalse(any("title" in e for e in errs), errs)

    def test_english_screenshot_title_repair_fully_valid(self):
        s = _screenshot_scene(title="", caption="Primary dashboard view.")
        s["visual"]["title"] = ""
        out, _ = normalize_scenes([s], locale="en")
        self.assertEqual(validate_scenes(out, locale="en"), [])

    def test_fail_closed_no_title_source(self):
        s = _screenshot_scene(title="", caption="", eyebrow="")
        s["visual"]["title"] = ""
        s["visual"]["caption"] = ""
        s["visual"]["eyebrow"] = ""
        s["spoken"] = ""
        out, _ = normalize_scenes([s], locale="en")
        errs = validate_scenes(out, locale="en")
        self.assertTrue(
            any("visual.title missing/empty" in e or "spoken text is empty" in e for e in errs),
            errs,
        )

    def test_src_preserved_byte_for_byte(self):
        src = "/assets/exact-path_UNCHANGED.png"
        s = _screenshot_scene(title="", caption="Cap", src=src)
        s["visual"]["title"] = ""
        out, _ = normalize_scenes([s], locale="en")
        self.assertEqual(out[0]["visual"]["src"], src)

    def test_valid_screenshot_unchanged(self):
        s = _screenshot_scene()
        original = copy.deepcopy(s)
        out, repairs = normalize_scenes([s], locale="en")
        self.assertEqual(out[0]["visual"], original["visual"])
        self.assertFalse(any(r.get("field") == "visual.title" for r in repairs))
        self.assertEqual(validate_scenes(out, locale="en"), [])

    def test_deterministic_and_idempotent(self):
        s = _screenshot_scene(title="", caption="Stable caption title.")
        s["visual"]["title"] = ""
        first, _ = normalize_scenes([copy.deepcopy(s)], locale="en")
        second, r2 = normalize_scenes(copy.deepcopy(first), locale="en")
        third, _ = normalize_scenes([copy.deepcopy(s)], locale="en")
        self.assertEqual(first, second)
        self.assertEqual(first, third)
        self.assertEqual(r2, [])


class LocaleIsolationRepairTests(unittest.TestCase):
    def test_english_repair_no_arabic(self):
        s = _compare_scene(
            visual={
                "title": "A vs B",
                "left": {"body": "Manual drafting is slow."},
                "right": {"body": "Automated drafting is fast."},
            }
        )
        out, _ = normalize_scenes([s], locale="en")
        blob = json.dumps(out[0]["visual"], ensure_ascii=False)
        self.assertIsNone(_ARABIC_RE.search(blob))
        self.assertEqual(validate_scenes(out, locale="en"), [])

    def test_gulf_repair_no_english_fallback_or_egyptian(self):
        s = {
            "card": "CompareCard",
            "accent": "mint",
            "voice": "Charon",
            "spoken": "العمل اليدوي بطيء مقابل العمل الآلي سريع.",
            "focus": "مقارنة",
            "visual": {
                "title": "يدوي مقابل آلي",
                "left": {"body": "المراجعة اليدوية تأخذ وقتاً طويلاً."},
                "right": {"body": "المراجعة الآلية تنتهي بسرعة."},
            },
        }
        out, _ = normalize_scenes([s], locale="ar-Gulf")
        left = out[0]["visual"]["left"]
        right = out[0]["visual"]["right"]
        for part in (left["label"], left["body"], right["label"], right["body"], out[0]["visual"]["title"]):
            self.assertIsNone(_ARABIC_RE.search("ABC"))  # sanity
            self.assertNotRegex(part, r"[A-Za-z]{3,}")
            for marker in ("إيه", "إزاي", "دلوقتي", "عايز", "مفيش"):
                self.assertNotIn(marker, part)
        self.assertEqual(validate_scenes(out, locale="ar-Gulf"), [])

    def test_msa_behavior_unchanged_for_valid(self):
        s = {
            "card": "CompareCard",
            "accent": "lavender",
            "voice": "Charon",
            "spoken": "الطريقة الأولى بطيئة مقابل الطريقة الثانية سريعة.",
            "focus": "مقارنة",
            "visual": {
                "title": "مقارنة",
                "left": {"label": "يدوي", "body": "عمل يدوي بطيء."},
                "right": {"label": "آلي", "body": "عمل آلي سريع."},
            },
        }
        original = copy.deepcopy(s)
        out, repairs = normalize_scenes([s], locale="ar-MSA")
        self.assertEqual(out[0]["visual"], original["visual"])
        self.assertFalse(any(r["field"].startswith("visual.left") for r in repairs))
        self.assertEqual(validate_scenes(out, locale="ar-MSA"), [])

    def test_legacy_egyptian_valid_compare_unchanged(self):
        s = _compare_scene(
            spoken="الشغل اليدوي بطيء versus الشغل الآلي سريع.",
            visual={
                "title": "مقارنة",
                "left": {"label": "يدوي", "body": "بطيء."},
                "right": {"label": "آلي", "body": "سريع."},
            },
        )
        # Use Arabic-only spoken for legacy path content; keep valid structure.
        s["spoken"] = "الشغل اليدوي بطيء مقابل الشغل الآلي سريع."
        original = copy.deepcopy(s)
        out, _ = normalize_scenes([s], locale=None)
        self.assertEqual(out[0]["visual"], original["visual"])


class GenericFutureLessonFixtureTests(unittest.TestCase):
    def test_schema_driven_unrelated_lesson_id(self):
        """Arbitrary future lesson id — repair must not key off final-three IDs."""
        lesson_id = "future-m9-l4-synthetic-ops-check"
        s = {
            "card": "CompareCard",
            "accent": "peach",
            "voice": "Aoede",
            "spoken": f"{lesson_id} shows backlog chaos versus a calm triage board.",
            "focus": "ops",
            "visual": {
                "title": "Chaos vs Calm",
                "left": {"body": "Backlog chaos overwhelms the team."},
                "right": {"body": "Calm triage keeps work moving."},
            },
        }
        sc = _screenshot_scene(title="", caption=f"{lesson_id} panel")
        sc["visual"]["title"] = ""
        out, _ = normalize_scenes([s, sc], locale="en", lesson_title=lesson_id)
        self.assertEqual(validate_scenes(out, locale="en"), [])
        self.assertIn("Backlog", out[0]["visual"]["left"]["label"] + out[0]["visual"]["left"]["body"])
        self.assertEqual(out[1]["visual"]["title"], f"{lesson_id} panel")
        self.assertNotIn("automator-m7-l1-closing-loop", json.dumps(out))
        self.assertNotIn("intro-m1-l1-what-is-ai", json.dumps(out))
        self.assertNotIn("creator-m4-repurposing", json.dumps(out))


class RepeatedFailureShapeFixtures(unittest.TestCase):
    """Structural shapes from the repeated schema failures — generic content only."""

    def test_compare_both_sides_need_label_and_body(self):
        s = _compare_scene(
            visual={"title": "Compare", "left": {}, "right": {}},
            spoken="Old habit is costly versus new habit is cheap.",
        )
        out, _ = normalize_scenes([s], locale="en")
        self.assertEqual(validate_scenes(out, locale="en"), [])

    def test_compare_plus_screenshot_title_missing(self):
        compare = _compare_scene(
            visual={
                "title": "Compare",
                "left": {"body": "Left side body text here."},
                "right": {"body": "Right side body text here."},
            }
        )
        shot = _screenshot_scene(title="", caption="Meaningful caption title.")
        shot["visual"]["title"] = ""
        out, _ = normalize_scenes([compare, shot], locale="en")
        self.assertEqual(validate_scenes(out, locale="en"), [])

    def test_gulf_compare_both_sides_incomplete(self):
        s = {
            "card": "CompareCard",
            "accent": "mint",
            "voice": "Charon",
            "spoken": "العادة القديمة مكلفة مقابل العادة الجديدة موفرة.",
            "focus": "مقارنة",
            "visual": {"title": "مقارنة", "left": {}, "right": {}},
        }
        out, _ = normalize_scenes([s], locale="ar-Gulf")
        self.assertEqual(validate_scenes(out, locale="ar-Gulf"), [])


if __name__ == "__main__":
    unittest.main()
