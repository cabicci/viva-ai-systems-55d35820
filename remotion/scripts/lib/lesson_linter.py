"""Gate 1 — lint a lesson script BEFORE TTS.

Catches the mistakes that historically forced us to re-render:
  - ق-words not in PRESERVE (suggests substitutes from the table)
  - residual MSA words (ماذا، لماذا، يجب…)
  - semantically sensitive words flagged by humans (بتاكلك، بتاخدك…)
  - segments that exceed the soft length cap (audio overruns scene)
  - emits the egyptianized preview so we see exactly what TTS receives

Output is a markdown-style report printed to stdout, plus a non-zero exit
code if any BLOCKER is found.  Warnings do not block — they require human
judgment.
"""
from __future__ import annotations
import os, sys, re, argparse, importlib.util

sys.path.insert(0, os.path.dirname(__file__))
from egyptian_phonetic import (
    PRESERVE, WORD_MAP, egyptianize, _HARAKAT_RE, _TOKEN_RE,
)
from lesson_types import validate_lesson

# ── Suggestion table for ق-words that should be substituted, not preserved.
# Mirrors mem/design/egyptian-arabic-prompt-rules.md.
QAF_SUBSTITUTE_SUGGESTIONS: dict[str, list[str]] = {
    "قاعدة": ["أصل", "مبدأ", "حتة"],
    "القاعدة": ["الأصل", "المبدأ"],
    "قواعد": ["أصول", "مبادئ"],
    "السياق": ["الموقف", "الخلفية", "الظروف"],
    "سياق": ["موقف", "خلفية"],
    "حقيقة": ["الواقع", "فعلًا", "بجد"],
    "الحقيقة": ["الواقع", "فعلًا"],
    "دقيقة": ["لحظة", "ثانية"],
    "الوقت": ["الزمن"],
    "طريقة": ["أسلوب", "شكل"],
    "الطريقة": ["الأسلوب", "الشكل"],
    "قرار": ["اختيار"],
    "القرار": ["الاختيار"],
    "قريب": ["جنب", "على وشك"],
    "قصة": ["حكاية"],
    "قسم": ["جزء", "فرع"],
    "مقابل": ["عكس"],
    "مطلق": ["تمام", "كامل"],
    "تطبيق": ["برنامج", "app"],
    "دقايق": ["لحظات"],
    "تقارير": ["ريبورتس", "تقارير (PRESERVE)"],
    "التقارير": ["الريبورتس", "التقارير (PRESERVE)"],
}

# ── Residual MSA (fusha) words that always sound wrong in Egyptian narration.
MSA_FORBIDDEN: dict[str, str] = {
    "ماذا": "إيه",
    "لماذا": "ليه",
    "كيف": "إزاي",
    "متى": "إمتى",
    "أين": "فين",
    "الآن": "دلوقتي",
    "أيضاً": "كمان",
    "أيضا": "كمان",
    "فقط": "بس",
    "جداً": "أوي",
    "جدا": "أوي",
    "أريد": "عايز",
    "نريد": "عايزين",
    "يريد": "عايز",
    "يجب": "لازم",
    "ينبغي": "المفروض",
    "ربما": "يمكن",
    "حالياً": "دلوقتي",
    "حاليا": "دلوقتي",
    "اليوم": "النهارده",
    "غداً": "بكره",
    "غدا": "بكره",
    "هذا": "ده",
    "هذه": "دي",
    "هؤلاء": "دول",
    "إذا": "إزا",
    "ذلك": "ده",
    "كذا": "كده",
    "ثم": "بعدين",
    "مثل": "زي",
    "كثير": "كتير",
    "أكثر": "أكتر",
}

# ── Semantically sensitive — almost always wrong meaning. Block by default.
SEMANTIC_LANDMINES: dict[str, str] = {
    "بتاكلك": "literal: it eats you. Use بتاخد يومك / بتستهلكك",
    "بياكلك": "literal: it eats you. Use بياخد منك / بيستهلكك",
    "بتاخدك": "ambiguous (takes you?). Be explicit",
    "تقراها": "fine sometimes but verify context",
}

# Soft caps per segment (rough words ≈ 0.4-0.5 s/word in Arabic narration).
# These are guidance, not hard blocks.
SOFT_MAX_WORDS = 28          # ~13-14 s spoken
HARD_MAX_WORDS = 40          # almost certainly clips the next scene

# Strip harakat for matching against forbidden lists.
def _norm(w: str) -> str:
    return _HARAKAT_RE.sub("", w)


def _arabic_tokens(text: str) -> list[str]:
    """Return Arabic word tokens (no punctuation, no Latin)."""
    tokens: list[str] = []
    for part in _TOKEN_RE.split(text):
        if not part:
            continue
        nrm = _norm(part)
        if re.search(r"[\u0621-\u064A]", nrm) and not re.search(r"[A-Za-z0-9]", nrm):
            tokens.append(nrm)
    return tokens


def _word_count(text: str) -> int:
    return len([t for t in text.split() if t.strip()])


# ANSI color helpers
RED = "\033[31m"; YEL = "\033[33m"; GRN = "\033[32m"; DIM = "\033[2m"; RST = "\033[0m"


def lint_scene(idx: int, scene: dict) -> tuple[list[str], list[str]]:
    """Return (errors, warnings) for one scene."""
    errors: list[str] = []
    warnings: list[str] = []
    spoken = scene.get("spoken", "")

    # 1. Semantic landmines
    for word in _arabic_tokens(spoken):
        if word in SEMANTIC_LANDMINES:
            errors.append(
                f"semantic landmine {word!r} — {SEMANTIC_LANDMINES[word]}"
            )

    # 2. MSA / fusha
    for word in _arabic_tokens(spoken):
        if word in MSA_FORBIDDEN:
            errors.append(
                f"MSA word {word!r} → use {MSA_FORBIDDEN[word]!r}"
            )

    # 3. ق-words not preserved and not mapped — flag with suggestions
    for word in _arabic_tokens(spoken):
        if "ق" not in word:
            continue
        if word in PRESERVE:
            continue
        if word in WORD_MAP:
            continue
        # Try stripping leading prefixes (ال/و/ف/ب/ل)
        bare = word
        for prefix in ("ال", "و", "ف", "ب", "ل"):
            if bare.startswith(prefix) and len(bare) > len(prefix) + 1:
                if bare[len(prefix):] in PRESERVE or bare[len(prefix):] in WORD_MAP:
                    bare = None
                    break
        if bare is None:
            continue
        sugg = QAF_SUBSTITUTE_SUGGESTIONS.get(word) or \
               QAF_SUBSTITUTE_SUGGESTIONS.get(_norm(word))
        if sugg:
            warnings.append(
                f"ق-word {word!r} not in PRESERVE/WORD_MAP — "
                f"suggest: {' | '.join(sugg)}"
            )
        else:
            warnings.append(
                f"ق-word {word!r} not in PRESERVE/WORD_MAP — "
                f"fallback will replace ق→ء (verify it sounds OK)"
            )

    # 4. Length caps
    wc = _word_count(spoken)
    if wc > HARD_MAX_WORDS:
        errors.append(
            f"too long: {wc} words (hard cap {HARD_MAX_WORDS}). "
            f"Split into two scenes or shorten."
        )
    elif wc > SOFT_MAX_WORDS:
        warnings.append(
            f"long segment: {wc} words (soft cap {SOFT_MAX_WORDS}). "
            f"Audio may run ~{wc * 0.45:.0f}s — make sure card has room."
        )

    # 5. Card-specific visual presence checks (cheap structural sanity)
    visual = scene.get("visual") or {}
    card = scene.get("card")
    required_props = {
        "TitleCard":    {"chip", "title", "subtitle"},
        "BigStatCard":  {"intro", "big", "outro"},
        "BulletsCard":  {"title", "bullets"},
        "ConceptCard":  {"term", "definition"},
        "CompareCard":  {"title", "left", "right"},
        "QuoteCard":    {"text"},
        "DiagramCard":  {"title", "steps"},
        "CTACard":      {"eyebrow", "title", "tagline"},
    }
    needed = required_props.get(card, set())
    missing = [p for p in needed if p not in visual]
    if missing:
        errors.append(
            f"{card} visual missing required props: {', '.join(missing)}"
        )

    return errors, warnings


def lint_lesson(lesson: dict) -> int:
    """Print full report. Returns shell exit code (0=ok, 1=blockers)."""
    print(f"\n{'='*72}\n  LINT REPORT — {lesson.get('id', '?')}\n{'='*72}")

    struct_errors = validate_lesson(lesson)
    if struct_errors:
        print(f"\n{RED}STRUCTURE ERRORS:{RST}")
        for e in struct_errors:
            print(f"  • {e}")
        return 1

    scenes = lesson["scenes"]
    print(f"  Scenes: {len(scenes)}    Title: {lesson.get('title')}")

    total_words = 0
    total_errors = 0
    total_warnings = 0

    for i, scene in enumerate(scenes, 1):
        errors, warnings = lint_scene(i, scene)
        spoken = scene.get("spoken", "")
        wc = _word_count(spoken)
        total_words += wc

        header = (
            f"\n{DIM}─── Scene {i} · {scene.get('card', '?')} "
            f"· {scene.get('voice', '?')} · {wc} words ───{RST}"
        )
        print(header)
        print(f"  spoken: {spoken}")
        rewritten = egyptianize(spoken)
        if rewritten != spoken:
            print(f"  {DIM}→ TTS sees:{RST} {rewritten}")

        for err in errors:
            print(f"  {RED}ERROR{RST}   {err}")
            total_errors += 1
        for w in warnings:
            print(f"  {YEL}WARN{RST}    {w}")
            total_warnings += 1
        if not errors and not warnings:
            print(f"  {GRN}OK{RST}")

    print(f"\n{'='*72}")
    print(
        f"  TOTAL — words: {total_words} "
        f"(~{total_words * 0.45:.0f}s spoken)  "
        f"errors: {total_errors}  warnings: {total_warnings}"
    )
    print(f"{'='*72}\n")

    return 1 if total_errors else 0


def load_lesson_module(path: str) -> dict:
    spec = importlib.util.spec_from_file_location("lesson_mod", path)
    mod = importlib.util.module_from_spec(spec)  # type: ignore
    spec.loader.exec_module(mod)  # type: ignore
    if not hasattr(mod, "LESSON"):
        raise SystemExit(f"{path}: missing top-level LESSON = {{...}}")
    return mod.LESSON


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("lesson_file", help="Path to lesson .py defining LESSON dict")
    args = ap.parse_args()
    lesson = load_lesson_module(args.lesson_file)
    sys.exit(lint_lesson(lesson))