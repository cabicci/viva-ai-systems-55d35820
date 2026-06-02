"""
Egyptian phonetic pre-processor for TTS.

Allow-list approach: only rewrite words we KNOW the TTS engine mispronounces.
For everything else, leave the text untouched and let Gemini TTS apply the
Cairo dialect from the prompt instructions.

History: an earlier version had a blanket ق→ء fallback. It produced wrong
pronunciations on common words (بيقرأ → بيءرأ, وقدراته → وءدراته, etc.) —
the engine spoke the inserted ء as a heavy alef/hamza instead of a natural
glottal stop. Removed in favor of explicit WORD_MAP entries only.

Append to WORD_MAP whenever a specific word is mispronounced.
"""
from __future__ import annotations
import re

# Exact word-level replacements. Keys are the original Arabic spelling
# (with or without ال), values are the phonetic Egyptian rewrite.
# Punctuation is stripped before lookup; harakat are stripped too.
WORD_MAP: dict[str, str] = {
    # ───── ق → ء (glottal stop) ─────
    "قبل": "أبل", "قبلها": "أبلها", "قبلك": "أبلك", "قبلكده": "أبل كده",
    "قال": "آل", "قالت": "آلِت", "قالوا": "آلوا", "قلت": "ألت", "قلنا": "ألنا",
    "قول": "أول", "أقول": "أأول", "بقول": "بأول", "يقول": "يأول",
    "قلب": "ألب", "قلبي": "ألبي", "قلوب": "ألوب",
    "قوي": "أوي", "قوية": "أوية", "أقوى": "أأوى",
    "حقيقي": "حئيئي", "حقيقة": "حئيئة", "حقيقية": "حئيئية", "بالحقيقة": "بالحئيئة",
    "وقت": "وأت", "الوقت": "الوأت", "وقتها": "وأتها", "أوقات": "أوأات",
    "دقيقة": "دئيئة", "دقايق": "دأايئ", "دقائق": "دأايئ",
    "طريقة": "طريأة", "الطريقة": "الطريأة", "طرق": "طُرُء",
    "قدام": "أدام", "قدامك": "أدامك", "قدامي": "أدامي",
    "قعد": "أعد", "قاعد": "آعد", "قعدنا": "أعدنا",
    "قام": "آم", "قامت": "آمِت", "قاموا": "آموا",
    "قرر": "أرر", "قررت": "أررت", "قراره": "أراره", "قرار": "أرار", "القرار": "الأرار",
    "قرش": "أرش", "قروش": "أروش",
    "قريب": "أُريب", "قريبة": "أريبة", "قريبا": "أريبا",
    "قصة": "أصة", "قصص": "أُصَص",
    "قطع": "أطع", "قطعة": "أطعة", "أقطع": "أأطع",
    "قفل": "أفل", "اقفل": "افل",
    "قنوات": "أنوات", "قناة": "أناة",
    "قسم": "أسم", "أقسام": "أأسام",
    "وقف": "وأف", "واقف": "واأف", "يوقف": "يوأف", "أوقف": "أوأف",
    "صدق": "صدأ", "صادق": "صادأ",
    "أدق": "أظبط", "ادق": "أظبط", "الأدق": "الأظبط",
    "دقة": "ظبط", "الدقة": "الظبط",
    "بقى": "بأى", "بقت": "بأت", "بقينا": "بأينا", "تبقى": "تبأى", "يبقى": "يبأى", "هتبقى": "هتبأى",
    "لقى": "لأى", "لقيت": "لأيت", "لقينا": "لأينا", "هتلاقي": "هتلاأي", "بلاقي": "بلاأي",
    "دلوقتي": "دلوأتي", "دلوقت": "دلوأت",
    "دقايق": "دأايء", "دقيقتين": "دئيئتين",
    "الفرق": "الفرء", "فرق": "فرء", "فارق": "فارء",
    # ───── ث → ت/س ─────
    "ثلاث": "تلات", "ثلاثة": "تلاتة", "ثلاثين": "تلاتين", "تلاثة": "تلاتة",
    "ثاني": "تاني", "ثانية": "تانية", "الثاني": "التاني", "الثانية": "التانية",
    "ثم": "بعدين", "ثمة": "في",
    "مثل": "زي", "مثلا": "مسلاً", "مثلاً": "مسلاً", "مثله": "زيه",
    "ثقيل": "تئيل", "ثقيلة": "تئيلة",
    "ثروة": "تروة", "كثير": "كتير", "كثيرة": "كتيرة", "أكثر": "أكتر",
    "حديث": "حديت", "حديثة": "حديتة",
    "ثابت": "تابت", "ثابتة": "تابتة",
    # ───── ذ → د/ز ─────
    "ذكي": "زكي", "ذكية": "زكية", "أذكى": "أزكى", "ذكاء": "زكاء",
    "هذا": "ده", "هذه": "دي", "هؤلاء": "دول",
    "إذا": "إزا", "اذا": "إزا", "إذًا": "يبأى",
    "لذلك": "علشان كده", "كذلك": "وكمان", "كذا": "كده",
    "ذلك": "ده",
    "أخذ": "أخد", "آخذ": "آخد", "تأخذ": "تاخد", "ياخذ": "ياخد", "خذ": "خد",
    "أستاذ": "أستاز",
    "إذن": "يبأى",
    "ذراع": "دراع",
    "ذيل": "ديل",
    "ذهب": "راح",
    # ───── شائعات فصحى → عامية ─────
    "ماذا": "إيه", "لماذا": "ليه", "كيف": "إزاي", "متى": "إمتى",
    "أين": "فين", "هنا": "هنا", "هناك": "هناك",
    "الآن": "دلوقتي", "أيضاً": "كمان", "أيضا": "كمان",
    "لكن": "بس", "ولكن": "بس", "فقط": "بس", "جداً": "أوي", "جدا": "أوي",
    "كثيراً": "كتير", "قليلاً": "شوية", "قليل": "شوية",
    "أريد": "عايز", "تريد": "عايز", "نريد": "عايزين", "يريد": "عايز",
    "أحتاج": "محتاج", "نحتاج": "محتاجين",
    "يجب": "لازم", "ينبغي": "المفروض",
    "ربما": "يمكن", "لربما": "يمكن",
    "حالياً": "دلوقتي", "حاليا": "دلوقتي",
    "اليوم": "النهارده", "أمس": "إمبارح", "غداً": "بكره", "غدا": "بكره",
    # ───── تصحيح حركات (vowel hints) ─────
    "وحش": "واحش", "الوحش": "الواحش", "وحوش": "وحوش",
}

# Harakat / tatweel / quranic marks to strip before lookup.
_HARAKAT_RE = re.compile(r"[\u064B-\u0652\u0670\u0640]")

# Arabic letters only (excludes Arabic punctuation U+060C ، U+061B ؛ U+061F ؟
# which sit in the same Unicode block but must NOT be glued to words).
# Range 0621-064A = hamza..yaa; 0671-06D3 = extended; plus harakat 064B-0652
# and superscript alif 0670, tatweel 0640.
_ARABIC_LETTER = r"\u0621-\u064A\u0670\u0671-\u06D3\u0640\u064B-\u0652"
_TOKEN_RE = re.compile(rf"([{_ARABIC_LETTER}a-zA-Z0-9_]+)")

# Letters that, if present in a token, mean the token is Arabic (so the
# ق-fallback is safe to apply). Excludes Latin letters and digits.
_ARABIC_RE = re.compile(rf"[{_ARABIC_LETTER}]")


def _normalize(word: str) -> str:
    """Strip harakat for map lookup; keep the visible letters."""
    return _HARAKAT_RE.sub("", word)


def egyptianize(text: str) -> str:
    """Rewrite text to force Egyptian pronunciation in TTS.

    Allow-list only: tokenize, look up WORD_MAP (with optional ال/و/ف/ب/ل
    prefix), apply replacement if found, else leave the word untouched.
    """
    if not text:
        return text

    parts = _TOKEN_RE.split(text)
    out: list[str] = []
    for part in parts:
        if not part or not _ARABIC_RE.search(part):
            # whitespace, punctuation, Latin/English/numbers → keep as-is
            out.append(part)
            continue

        norm = _normalize(part)

        # Try exact match, then strip leading ال / و / ف / ب / ل prefixes one at a time.
        candidates = [norm]
        for prefix in ("ال", "و", "ف", "ب", "ل"):
            if norm.startswith(prefix) and len(norm) > len(prefix) + 1:
                candidates.append(norm[len(prefix):])

        replaced = None
        for cand in candidates:
            if cand in WORD_MAP:
                # Re-attach any prefix we stripped to the replacement.
                prefix = norm[: len(norm) - len(cand)]
                replaced = prefix + WORD_MAP[cand]
                break

        if replaced is not None:
            out.append(replaced)
        else:
            # No allow-list hit — leave the word as-is (with original harakat).
            out.append(part)

    return "".join(out)


def egyptianize_with_diff(text: str) -> tuple[str, list[tuple[str, str]]]:
    """Same as egyptianize but also returns list of (original, replaced) pairs
    for logging/audit."""
    parts = _TOKEN_RE.split(text)
    diffs: list[tuple[str, str]] = []
    out: list[str] = []
    for part in parts:
        if not part or not _ARABIC_RE.search(part):
            out.append(part)
            continue
        new = egyptianize(part)
        if new != part:
            diffs.append((part, new))
        out.append(new)
    return "".join(out), diffs