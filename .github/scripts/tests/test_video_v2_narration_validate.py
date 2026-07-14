"""Tests for video_v2.narration_validate — max 2 Gemini attempts, mocked."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from video_v2.narration_validate import validate_narration  # noqa: E402


def _pkg():
    return {"lessonId": "x", "sections": [{"contentMarkdown": "AI summarization overview."}]}


def test_two_attempts_then_fail():
    calls = {"n": 0}

    def script_fn(pkg, locale, attempt):
        calls["n"] = attempt
        return [{"spoken": "ezzay you doing"}]  # will fail en gate

    def grounding_fn(scenes, pkg):
        return []

    r = validate_narration(package=_pkg(), locale="en", script_fn=script_fn, grounding_fn=grounding_fn)
    assert not r.ok
    assert r.attempts == 2
    assert calls["n"] == 2


def test_first_attempt_success():
    def script_fn(pkg, locale, attempt):
        return [{"spoken": "This lesson explains AI summarization."}]

    def grounding_fn(scenes, pkg):
        return []

    r = validate_narration(package=_pkg(), locale="en", script_fn=script_fn, grounding_fn=grounding_fn)
    assert r.ok and r.attempts == 1


def test_grounding_failure_blocks():
    def script_fn(pkg, locale, attempt):
        return [{"spoken": "This lesson explains AI summarization."}]

    def grounding_fn(scenes, pkg):
        return ["ungrounded claim: rocketry"]

    r = validate_narration(package=_pkg(), locale="en", script_fn=script_fn, grounding_fn=grounding_fn)
    assert not r.ok
    assert r.grounding_errors == ["ungrounded claim: rocketry"]
