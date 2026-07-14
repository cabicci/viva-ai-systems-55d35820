"""Tests for video_v2.locale_gate — mocked, no external services."""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from video_v2.locale_gate import validate_spoken, validate_scenes  # noqa: E402


def test_en_rejects_arabic():
    r = validate_spoken("en", "Hello world مرحبا")
    assert not r.ok and any("arabic" in v for v in r.violations)


def test_en_rejects_egyptian_transliteration():
    r = validate_spoken("en", "ezzay you doing today, yalla")
    assert not r.ok


def test_en_accepts_plain_english():
    r = validate_spoken("en", "This lesson explains AI summarization.")
    assert r.ok, r.violations


def test_ar_msa_rejects_egyptian_marker():
    r = validate_spoken("ar-MSA", "في هذا الدرس ازاي نبدأ")
    assert not r.ok


def test_ar_msa_rejects_arabizi_digits():
    r = validate_spoken("ar-MSA", "هذا 3ashan التلخيص")
    assert not r.ok


def test_ar_msa_accepts_formal():
    r = validate_spoken("ar-MSA", "في هذا الدرس نتناول التلخيص باستخدام الذكاء الاصطناعي.")
    assert r.ok, r.violations


def test_ar_gulf_rejects_egyptian_marker():
    r = validate_spoken("ar-Gulf", "شلونك اليوم، دلوقتي نبدأ")
    assert not r.ok


def test_ar_gulf_accepts_neutral_gulf():
    r = validate_spoken("ar-Gulf", "شلونك اليوم، بنشرح التلخيص بالذكاء الاصطناعي.")
    assert r.ok, r.violations


def test_ar_gulf_accepts_shared_formal_arabic():
    # Formal Arabic vocabulary that also appears in MSA must NOT be rejected —
    # neutral Gulf narration naturally uses such words.
    r = validate_spoken(
        "ar-Gulf",
        "في هذا الدرس نتناول موضوع التلخيص باستخدام الذكاء الاصطناعي، لا سيما التطبيقات العملية.",
    )
    assert r.ok, r.violations


def test_ar_gulf_rejects_english_only():
    r = validate_spoken("ar-Gulf", "This is English narration only.")
    assert not r.ok
    r = validate_spoken("ar-EG", "أي كلام")
    assert not r.ok


def test_scenes_aggregate():
    scenes = [
        {"spoken": "Hello world"},
        {"spoken": "ezzay habibi"},
    ]
    r = validate_scenes("en", scenes)
    assert not r.ok and any("scene[1]" in v for v in r.violations)
