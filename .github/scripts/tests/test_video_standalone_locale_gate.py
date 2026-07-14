"""Locale narration gate tests. Pre-paid-call boundary and rule coverage."""
from __future__ import annotations

import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
_ROOT = _HERE.parent.parent.parent
sys.path.insert(0, str(_ROOT / ".github" / "scripts"))

from video_standalone.locale_gate import (  # type: ignore
    LocaleGateError, gate_scenes,
)
from video_standalone.narration_orchestrator import (  # type: ignore
    MAX_GEMINI_ATTEMPTS, NarrationGateFailure, run_narration_gate,
)


def _scenes(text: str) -> list[dict]:
    return [{"spoken": text, "voice": "Charon", "focus": "core"}]


# -------- rule coverage --------

def test_ar_eg_always_rejected():
    for txt in ("مرحبا", "hello", ""):
        try:
            gate_scenes("ar-EG", _scenes(txt or "x"))
        except LocaleGateError as e:
            assert e.evidence["reason"] == "ar-EG-forbidden"
            continue
        raise AssertionError("ar-EG must always reject")


def test_en_accepts_english_rejects_arabic_and_dialect():
    gate_scenes("en", _scenes("Hello, welcome to this lesson about data."))
    # Any Arabic character in an EN narration is rejected; Egyptian/Gulf
    # markers are also Arabic-script tokens, so the gate reports either
    # 'en-arabic-leakage' or 'en-colloquial-leakage'. Both are hard rejects.
    for bad in [
        "Hello مرحبا world",
        "This is علشان going to work",
        "Now we وايد explore",
    ]:
        try:
            gate_scenes("en", _scenes(bad))
        except LocaleGateError as e:
            assert e.evidence["reason"] in {"en-arabic-leakage", "en-colloquial-leakage"}, \
                (bad, e.evidence)
        else:
            raise AssertionError(bad)


def test_ar_msa_accepts_formal_arabic_rejects_egyptian_gulf_arabizi():
    gate_scenes("ar-MSA", _scenes("مرحبا بكم في هذا الدرس عن الذكاء الاصطناعي."))
    for bad, code in [
        ("hello only latin text here", "ar-MSA-no-arabic-script"),
        ("مرحبا علشان نتحدث اليوم", "ar-MSA-egyptian-colloquial"),
        ("مرحبا وايد اليوم", "ar-MSA-gulf-colloquial"),
        ("مرحبا 3ala 7abibi", "ar-MSA-arabizi"),
    ]:
        try:
            gate_scenes("ar-MSA", _scenes(bad))
        except LocaleGateError as e:
            assert e.evidence["reason"] == code, (bad, e.evidence)
        else:
            raise AssertionError(bad)


def test_ar_gulf_accepts_formal_arabic_shared_with_msa():
    # Formal MSA vocabulary is explicitly allowed under ar-Gulf.
    gate_scenes("ar-Gulf", _scenes("مرحبا بكم في هذا الدرس عن الذكاء الاصطناعي."))


def test_ar_gulf_rejects_egyptian_and_arabizi_and_english_only():
    for bad, code in [
        ("مرحبا علشان اليوم", "ar-Gulf-egyptian-colloquial"),
        ("مرحبا 3alaikum 7abibi", "ar-Gulf-arabizi"),
        ("this narration is entirely in english only", "ar-Gulf-no-arabic-script"),
    ]:
        try:
            gate_scenes("ar-Gulf", _scenes(bad))
        except LocaleGateError as e:
            assert e.evidence["reason"] == code, (bad, e.evidence)
        else:
            raise AssertionError(bad)


# -------- orchestrator: pre-paid-call boundary + 2-attempt cap --------

def test_orchestrator_pass_on_first_attempt(tmp_path):
    lid, loc, pkg = "L1", "en", "pkg.json"
    (tmp_path / pkg).write_text("{}")
    (tmp_path / "remotion" / "scripts").mkdir(parents=True)
    (tmp_path / "remotion" / "scripts" / "build-lesson.py").write_text("#\n")
    composite = f"{lid}__{loc}"
    calls = []
    def fake_run(cmd, cwd, check):
        calls.append(cmd)
        # simulate cache write by build-lesson --preview-only
        d = Path("/tmp") / composite
        d.mkdir(parents=True, exist_ok=True)
        (d / "script.json").write_text(
            '[{"spoken":"Hello, welcome.","voice":"C","focus":"f"}]',
            encoding="utf-8",
        )
        class R: returncode = 0
        return R()
    res = run_narration_gate(
        lesson_id=lid, locale=loc, package_path=pkg,
        repo_root=tmp_path, subprocess_run=fake_run,
    )
    assert res.attempts_used == 1
    assert len(calls) == 1
    assert "--preview-only" in calls[0]
    assert "--force-script" not in calls[0]


def test_orchestrator_second_attempt_uses_force_script(tmp_path):
    lid, loc, pkg = "L2", "ar-MSA", "pkg.json"
    (tmp_path / pkg).write_text("{}")
    (tmp_path / "remotion" / "scripts").mkdir(parents=True)
    (tmp_path / "remotion" / "scripts" / "build-lesson.py").write_text("#\n")
    composite = f"{lid}__{loc}"
    call_no = {"n": 0}
    def fake_run(cmd, cwd, check):
        call_no["n"] += 1
        d = Path("/tmp") / composite
        d.mkdir(parents=True, exist_ok=True)
        if call_no["n"] == 1:
            # bad: contains Egyptian marker -> gate rejects
            (d / "script.json").write_text(
                '[{"spoken":"مرحبا علشان اليوم","voice":"C","focus":"f"}]',
                encoding="utf-8",
            )
        else:
            # good MSA
            (d / "script.json").write_text(
                '[{"spoken":"مرحبا بكم في الدرس","voice":"C","focus":"f"}]',
                encoding="utf-8",
            )
        class R: returncode = 0
        return R()
    res = run_narration_gate(
        lesson_id=lid, locale=loc, package_path=pkg,
        repo_root=tmp_path, subprocess_run=fake_run,
    )
    assert res.attempts_used == 2
    assert call_no["n"] == 2


def test_orchestrator_fails_after_two_attempts_before_paid_calls(tmp_path):
    lid, loc, pkg = "L3", "en", "pkg.json"
    (tmp_path / pkg).write_text("{}")
    (tmp_path / "remotion" / "scripts").mkdir(parents=True)
    (tmp_path / "remotion" / "scripts" / "build-lesson.py").write_text("#\n")
    composite = f"{lid}__{loc}"
    call_no = {"n": 0}
    def fake_run(cmd, cwd, check):
        call_no["n"] += 1
        d = Path("/tmp") / composite
        d.mkdir(parents=True, exist_ok=True)
        (d / "script.json").write_text(
            '[{"spoken":"Hello مرحبا always leaks","voice":"C","focus":"f"}]',
            encoding="utf-8",
        )
        class R: returncode = 0
        return R()
    try:
        run_narration_gate(
            lesson_id=lid, locale=loc, package_path=pkg,
            repo_root=tmp_path, subprocess_run=fake_run,
        )
    except NarrationGateFailure as e:
        assert len(e.attempts) == MAX_GEMINI_ATTEMPTS
        assert call_no["n"] == MAX_GEMINI_ATTEMPTS
        # Ensure the failure boundary is pre-paid-call: no --prepare-only, no
        # --render-only, no full-build invocation ever happened.
        return
    raise AssertionError("expected NarrationGateFailure")


if __name__ == "__main__":
    import tempfile
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            with tempfile.TemporaryDirectory() as td:
                try:
                    fn(Path(td))  # type: ignore[misc]
                except TypeError:
                    fn()
            print("ok", name)
