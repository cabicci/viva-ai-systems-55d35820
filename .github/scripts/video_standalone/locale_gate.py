"""Locale narration gate. Runs on the scenes[].spoken text produced by
remotion/scripts/lib/script_writer.py BEFORE any TTS or render call.

Rules:
  - en      : narration must be English; reject Arabic Unicode and known
              Egyptian/Gulf colloquial markers.
  - ar-MSA  : narration must be Arabic script; reject Egyptian/Gulf
              colloquial markers and arabizi (Arabic-in-Latin with 2/3/5/7/8).
  - ar-Gulf : narration must be Arabic script; reject Egyptian markers,
              English-only narration, and arabizi. Formal Arabic vocabulary
              shared with MSA is allowed.
  - ar-EG   : always reject. Production count of ar-EG is zero.

A gate failure raises `LocaleGateError` with structured evidence. The
caller (narration_orchestrator) enforces the 2-attempt Gemini budget and
guarantees the failure boundary lands BEFORE TTS/render/Bunny/git writes.
"""
from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass


ARABIC_RANGES = (
    (0x0600, 0x06FF),
    (0x0750, 0x077F),
    (0x08A0, 0x08FF),
    (0xFB50, 0xFDFF),
    (0xFE70, 0xFEFF),
)
LATIN_UPPER_LOWER = re.compile(r"[A-Za-z]")

# Egyptian Cairene colloquial markers (rejected outside ar-EG).
EGYPTIAN_MARKERS = (
    "علشان", "دلوقتي", "إزاي", "ازاي", "ازّاي", "بتاع", "بتاعة",
    "أهو", "أهي", "بردو", "بردك", "معلش", "يلا", "خالص",
    "أوي", "قوى", "قوي", "كده", "كدا", "دى", "دة",
    "هيبقى", "هابقى", "هنبقى", "هتبقى", "هيتم", "بيتم",
    "لسه", "لسّه", "ماشي", "طب ", "طبّ",
)

# Gulf colloquial markers (rejected in ar-MSA; allowed in ar-Gulf).
GULF_MARKERS = (
    "وايد", "هالحين", "الحين", "هاي ", "هذي", "شنو", "وش ",
    "يبي", "يبغى", "يبغا", "ابغى", "ابي", "أبغى", "أبي",
    "حلو الحين", "شلونك", "شلونكم", "زين", "مايصير", "ماكو",
)

# Arabizi digits used as Arabic letters when embedded in Latin words.
ARABIZI_PATTERN = re.compile(r"[A-Za-z]+[23578][A-Za-z]*|[A-Za-z]*[23578][A-Za-z]+")


class LocaleGateError(RuntimeError):
    def __init__(self, evidence: dict):
        super().__init__(evidence.get("reason", "locale-gate-failed"))
        self.evidence = evidence


@dataclass(frozen=True)
class GateResult:
    locale: str
    scene_count: int
    total_chars: int


def _has_arabic(text: str) -> bool:
    for ch in text:
        cp = ord(ch)
        for lo, hi in ARABIC_RANGES:
            if lo <= cp <= hi:
                return True
    return False


def _has_latin_letters(text: str) -> bool:
    return bool(LATIN_UPPER_LOWER.search(text))


def _latin_word_ratio(text: str) -> float:
    # Fraction of alphabetic characters that are Latin letters.
    total = 0
    latin = 0
    for ch in text:
        if ch.isalpha():
            total += 1
            if ch.isascii():
                latin += 1
    return (latin / total) if total else 0.0


def _find_markers(text: str, markers: tuple[str, ...]) -> list[str]:
    hits: list[str] = []
    lowered = text
    for m in markers:
        if m in lowered:
            hits.append(m)
    return hits


def _find_arabizi(text: str) -> list[str]:
    return ARABIZI_PATTERN.findall(text)


def _extract_spoken(scenes: list[dict]) -> str:
    parts = []
    for s in scenes:
        v = s.get("spoken")
        if isinstance(v, str) and v.strip():
            parts.append(v)
    return "\n".join(parts)


def _fail(reason: str, **extra) -> None:
    raise LocaleGateError({"reason": reason, **extra})


def _normalize(text: str) -> str:
    return unicodedata.normalize("NFKC", text)


def gate_scenes(locale: str, scenes: list[dict]) -> GateResult:
    """Apply the locale narration gate to the accepted script scenes.

    Called BEFORE TTS/render. Raises LocaleGateError on any violation.
    """
    if locale == "ar-EG":
        _fail("ar-EG-forbidden",
              detail="ar-EG production count is zero; this locale is never accepted.")

    if not isinstance(scenes, list) or not scenes:
        _fail("empty-scenes", locale=locale)

    text = _normalize(_extract_spoken(scenes))
    if not text.strip():
        _fail("no-spoken-text", locale=locale)

    if locale == "en":
        if _has_arabic(text):
            _fail("en-arabic-leakage", locale=locale,
                  sample=text[:120])
        eg = _find_markers(text, EGYPTIAN_MARKERS)
        gulf = _find_markers(text, GULF_MARKERS)
        if eg or gulf:
            _fail("en-colloquial-leakage", locale=locale,
                  egyptian=eg, gulf=gulf)

    elif locale == "ar-MSA":
        if not _has_arabic(text):
            _fail("ar-MSA-no-arabic-script", locale=locale, sample=text[:120])
        eg = _find_markers(text, EGYPTIAN_MARKERS)
        if eg:
            _fail("ar-MSA-egyptian-colloquial", locale=locale, markers=eg)
        gulf = _find_markers(text, GULF_MARKERS)
        if gulf:
            _fail("ar-MSA-gulf-colloquial", locale=locale, markers=gulf)
        arabizi = _find_arabizi(text)
        if arabizi:
            _fail("ar-MSA-arabizi", locale=locale, samples=arabizi[:5])

    elif locale == "ar-Gulf":
        if not _has_arabic(text):
            _fail("ar-Gulf-no-arabic-script", locale=locale, sample=text[:120])
        # English-only narration rejection: dominant Latin content.
        if _latin_word_ratio(text) > 0.30 and not _has_arabic(text):
            _fail("ar-Gulf-english-only", locale=locale)
        eg = _find_markers(text, EGYPTIAN_MARKERS)
        if eg:
            _fail("ar-Gulf-egyptian-colloquial", locale=locale, markers=eg)
        arabizi = _find_arabizi(text)
        if arabizi:
            _fail("ar-Gulf-arabizi", locale=locale, samples=arabizi[:5])
        # Formal Arabic vocabulary shared with MSA is explicitly allowed
        # (no Gulf-marker requirement; no MSA-formal rejection).

    else:
        _fail("unsupported-locale", locale=locale)

    return GateResult(locale=locale, scene_count=len(scenes), total_chars=len(text))
