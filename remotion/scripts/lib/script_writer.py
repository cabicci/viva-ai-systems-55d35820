"""Use Gemini API directly (with multi-key rotation) to convert raw lesson
blocks into a video scene script.

Falls back through all GEMINI_API_KEY variants on 429 / 5xx, same pattern as
gemini_tts.py — gives us bigger combined quota and avoids the Lovable
gateway's upstream-idle timeouts on long Gemini Pro responses.
"""
from __future__ import annotations
import json
import os
import random
import time
import urllib.request
import urllib.error

try:
    from .locale_profiles import get_profile as _get_locale_profile  # package import
except ImportError:  # sys.path import (sibling)
    from locale_profiles import get_profile as _get_locale_profile

try:
    from .scene_validator import validate_scenes as _validate_scenes, write_locale_validation_evidence as _write_validation_evidence  # package import
except ImportError:  # sys.path import (sibling)
    from scene_validator import validate_scenes as _validate_scenes, write_locale_validation_evidence as _write_validation_evidence

try:
    from .scene_normalizer import normalize_scenes as _normalize_scenes, write_normalization_evidence as _write_normalization_evidence  # package import
except ImportError:
    from scene_normalizer import normalize_scenes as _normalize_scenes, write_normalization_evidence as _write_normalization_evidence


# Default to Flash for speed; fall back to Pro on failure or grounding violations.
MODEL_FAST = "gemini-2.5-flash"
MODEL_STRONG = "gemini-2.5-pro"
MODEL = MODEL_FAST  # backward-compat reference (unused after refactor)
ENDPOINT_TPL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    "{model}:generateContent?key={key}"
)


def _collect_gemini_keys() -> list[str]:
    """Collect Gemini keys from every GitHub secret naming style we support."""
    candidates = [os.environ.get("GEMINI_API_KEY")]
    for i in range(1, 10):
        candidates.append(os.environ.get(f"GEMINI_API_KEY_{i}"))
        candidates.append(os.environ.get(f"GEMINI_API_KEY{i}"))
    keys: list[str] = []
    seen: set[str] = set()
    for key in candidates:
        if key and key not in seen:
            keys.append(key)
            seen.add(key)
    if not keys:
        raise RuntimeError("No GEMINI_API_KEY* environment variables set")
    return keys

SYSTEM_PROMPT = """انت بتحوّل محتوى درس مكتوب (blocks) إلى سكريبت فيديو قصير
بالعامية المصرية القاهرية، شكل YouTuber بيشرح لصاحبه.

قاعدة الـ Grounding (الأهم على الإطلاق — مخالفتها = فشل كامل):
- ممنوع منعًا باتًا تخترع محتوى مش موجود في الـ blocks. ممنوع تذكر:
  * أسئلة، اختبارات، quizzes، تمارين، missions، assignments — إلا لو فعلاً
    في block kind="quiz" موجود في الـ blocks اللي اتبعتلك.
  * أمثلة، أرقام، إحصائيات، أو تفاصيل مش مذكورة في الـ blocks.
  * موضوع الدرس الجاي — استعمل بس `next_lesson_title` لو اتبعتلك،
    وإلا اقفل بكلام عام: "نتقابل في الدرس الجاي" من غير ما تحدد موضوع.
  * promises مستقبلية ("هديلك"، "هنشوف"، "هنطبق") لحاجة مش هتحصل في الفيديو ده.
- الـ context_flags في رسالة الـ user بيقوللك بالظبط:
  has_quiz (true/false) و next_lesson_title (string أو null).
  لازم تحترم القيمتين دول حرفيًا.
- لو has_quiz=false: CTACard الأخير لازم يكون ملخص + دعوة عامة للدرس الجاي،
  من غير أي ذكر لأسئلة أو تطبيق.
- لو next_lesson_title=null: ممنوع تذكر اسم/موضوع أي درس جاي. اقفل بـ
  "شوفك في الدرس الجاي" أو ما شابه.
- لو next_lesson_title موجود: استعمله نصًا (مش ترجمة، مش تخمين).

قواعد إجبارية:
- لهجة مصرية قاهرية فقط (مش فصحى، مش خليجي، مش شامي).
- نطق: ج = G قوية، ق = همزة، ث = ت/س، ذ = د/ز.
- استعمل: ليه، إيه، إزاي، فين، دلوقتي، عايز، بس، قوي، اللي، بـ + فعل (بيقول).
- نفي: مش / ما+ش. مستقبل: هـ. مفيش "سوف" أو "لا".
- مصطلحات إنجليزية تقنية (LLM, AI, GPT, API) تتقال زي ما هي.
- كل scene لازم 8 لـ 12 ثانية كلام (حوالي 25-40 كلمة عربي).
- ابدأ بـ "أهلًا" في أول TitleCard فقط، آخر CTACard اقفل بدعوة للدرس الجاي.
- مفيش تكرار للكلام بين المشاهد.
- focus: اكتب 3-5 كلمات صعبة النطق مع التشكيل اللاتيني، مفصولة بفاصلة.

تحويل blocks → scenes:
- block kind="paragraphs" أول واحد بـ eyebrow=HERO → TitleCard (chip, title, highlight, subtitle).
- block kind="concepts" → ConceptCard لكل item (term, definition, tag قصير).
- block kind="paragraphs" عادي → BulletsCard (title, bullets) — كل bullet = جملة واحدة قصيرة.
- block kind="comparison" → CompareCard (title, left{label,body}, right{label,body}).
- block kind="screenshot" → ScreenshotCard (eyebrow, title, caption, src — استعمل نفس قيمة src من الـ block).
- block kind="diagram" → BulletsCard (title من label أو title بتاع البلوك, bullets من caption مقسّم لجمل قصيرة). ممنوع تعمل ScreenshotCard للـ diagram — مفيش صورة فعلية ليه.
- block kind="quiz" → CTACard (eyebrow="دورك دلوقتي", title قصير, highlight، tagline يدعو للتطبيق).
- تجاهل block kind="lessonVideo".
- بعد آخر بلوك ضيف CTACard ختامي لو مفيش quiz.

ألوان الـ accent: بدّل بينهم — mint, lavender, peach, yellow, pink, mintDeep.
الأصوات: Charon (رجالي، أساسي) و Aoede (حريمي، للفروقات). بدّل بينهم.
- لازم تملا visual بكل الـ fields المطلوبة للكارت ده — مفيش visual فاضي.
- CompareCard مشهد واحد بـ left و right جوّاه. ممنوع تعمل اتنين CompareCard.
- ممنوع كلمة "جدًا" — استعمل "قوي" بعد الصفة (مثال: ضخم قوي).
- ScreenshotCard ممنوع إلا لو البلوك kind="screenshot" حرفيًا وعنده src جاهز ومنتهي بـ .jpg/.png/.webp. أي حاجة تانية (diagram, concept visual) لازم تتحوّل لـ BulletsCard أو CompareCard نصّي.

شكل visual لكل كارت (لازم كل المفاتيح موجودة):
- TitleCard: { chip, title, highlight, subtitle }
- ConceptCard: { term, definition, tag }
- BigStatCard: { intro, big, outro }
- BulletsCard: { title, bullets: [string, ...] }
- CompareCard: { title, left: {label, body}, right: {label, body} }
- ScreenshotCard: { eyebrow, title, caption, src }
- CTACard: { eyebrow, title, highlight, tagline }"""


# Gemini function-declaration schema (subset of OpenAPI). Keep parameters
# identical to what the prompt expects.
FUNCTION_DECLARATION = {
    "name": "emit_lesson_scenes",
    "description": "Return the video scene script for this lesson.",
    "parameters": {
            "type": "object",
            "properties": {
                "scenes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "card": {"type": "string", "enum": [
                                "TitleCard", "ConceptCard", "BigStatCard",
                                "BulletsCard", "CompareCard", "CTACard",
                                "ScreenshotCard"]},
                            "accent": {"type": "string", "enum": [
                                "mint", "lavender", "peach", "yellow",
                                "pink", "mintDeep"]},
                            "voice": {"type": "string",
                                      "enum": ["Charon", "Aoede"]},
                            "spoken": {"type": "string"},
                            "focus": {"type": "string"},
                            "visual": {"type": "object",
                                       "description": "Card-specific visual props. Include ALL fields needed by the chosen card type — see prompt for shapes.",
                                       "properties": {
                                           "chip": {"type": "string"},
                                           "title": {"type": "string"},
                                           "highlight": {"type": "string"},
                                           "subtitle": {"type": "string"},
                                           "term": {"type": "string"},
                                           "definition": {"type": "string"},
                                           "tag": {"type": "string"},
                                           "intro": {"type": "string"},
                                           "big": {"type": "string"},
                                           "outro": {"type": "string"},
                                           "bullets": {"type": "array",
                                                       "items": {"type": "string"}},
                                           "left": {"type": "object",
                                                    "properties": {
                                                        "label": {"type": "string"},
                                                        "body": {"type": "string"}}},
                                           "right": {"type": "object",
                                                     "properties": {
                                                         "label": {"type": "string"},
                                                         "body": {"type": "string"}}},
                                           "eyebrow": {"type": "string"},
                                           "tagline": {"type": "string"},
                                           "caption": {"type": "string"},
                                           "src": {"type": "string"},
                                       }},
                        },
                        "required": ["card", "accent", "voice", "spoken",
                                     "focus", "visual"],
                    },
                }
            },
            "required": ["scenes"],
    },
}


# Hallucination patterns we refuse to ship. Each entry: (regex, only_when_flag).
# only_when_flag is a callable(context) -> bool; if True, the pattern is forbidden.
import re as _re

QUIZ_PATTERNS = [
    _re.compile(p) for p in [
        r"كام\s*سؤال", r"أسئلة", r"سؤال\s*و\s*سؤال",
        r"هديلك\s*سؤال", r"اختبار", r"quiz", r"تمرين",
    ]
]
NEXT_LESSON_TOPIC_HINTS = [
    _re.compile(p) for p in [
        r"في\s*الدرس\s*الجاي\s*،?\s*هن(عرف|شوف|تكلم|درس|تعلم|غوص|كتشف)",
        r"الدرس\s*الجاي\s*هي?كون\s*عن",
    ]
]


def lint_scenes(scenes, has_quiz, next_lesson_title):
    """Return list of violation strings (empty = clean)."""
    violations = []
    for i, s in enumerate(scenes, 1):
        text = s.get("spoken", "") + " " + json.dumps(
            s.get("visual", {}), ensure_ascii=False)
        if not has_quiz:
            for pat in QUIZ_PATTERNS:
                if pat.search(text):
                    violations.append(
                        f"Scene {i}: ذكر أسئلة/quiz بس has_quiz=false "
                        f"(matched: {pat.pattern})")
                    break
        if not next_lesson_title:
            for pat in NEXT_LESSON_TOPIC_HINTS:
                if pat.search(text):
                    violations.append(
                        f"Scene {i}: ادّعى موضوع الدرس الجاي بس "
                        f"next_lesson_title=null (matched: {pat.pattern})")
                    break
    return violations


def _resolve_system_prompt(locale):
    """Legacy Egyptian prompt when locale is falsy; otherwise the locale profile's."""
    profile = _get_locale_profile(locale)
    if profile.locale == "__legacy_egyptian__":
        return SYSTEM_PROMPT, profile.script_prompt_profile
    return profile.script_system_prompt, profile.script_prompt_profile


def generate_scenes(lesson_id, blocks, title=None, has_quiz=False,
                    next_lesson_title=None, extra_user_note="", model=None,
                    locale=None):
    keys = _collect_gemini_keys()
    model = model or MODEL_FAST
    system_prompt, prompt_profile = _resolve_system_prompt(locale)

    user_msg = (
        f"lesson_id: {lesson_id}\n"
        f"locale: {locale or 'legacy-egyptian'}\n"
        f"script_prompt_profile: {prompt_profile}\n"
        f"title: {title or ''}\n"
        f"context_flags:\n"
        f"  has_quiz: {'true' if has_quiz else 'false'}\n"
        f"  next_lesson_title: {json.dumps(next_lesson_title, ensure_ascii=False) if next_lesson_title else 'null'}\n\n"
        f"blocks (JSON):\n"
        + json.dumps(blocks, ensure_ascii=False, indent=2)
    )
    if extra_user_note:
        user_msg += f"\n\n=== Revision required ===\n{extra_user_note}"

    body = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": user_msg}]}],
        "tools": [{"functionDeclarations": [FUNCTION_DECLARATION]}],
        "toolConfig": {
            "functionCallingConfig": {
                "mode": "ANY",
                "allowedFunctionNames": ["emit_lesson_scenes"],
            }
        },
        "generationConfig": {"temperature": 0.7},
    }
    payload = json.dumps(body).encode()

    n_keys = len(keys)
    max_attempts = max(9, n_keys * 3)
    resp = None
    last_err = None
    for attempt in range(max_attempts):
        key = keys[attempt % n_keys]
        label = f"key#{(attempt % n_keys) + 1}"
        url = ENDPOINT_TPL.format(model=model, key=key)
        req = urllib.request.Request(
            url, data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        # Pro can be slow but capping at 180s avoids hung sockets that burn 5+ min.
        req_timeout = 180 if model == MODEL_STRONG else 90
        try:
            with urllib.request.urlopen(req, timeout=req_timeout) as r:
                resp = json.loads(r.read())
                break
        except urllib.error.HTTPError as e:
            error_body = e.read().decode(errors="replace")
            last_err = f"HTTP {e.code}: {error_body[:300]}"
            if e.code == 429:
                if (attempt % n_keys) != n_keys - 1:
                    print(f"      [script] 429 on {label}, rotating key")
                    continue
                retry_after = e.headers.get("Retry-After") if e.headers else None
                wait = float(retry_after) if retry_after and retry_after.isdigit() else min(180, 45 * ((attempt // n_keys) + 1))
                wait += random.uniform(0, 5)
                print(f"      [script] all keys 429, waiting {wait}s")
                time.sleep(wait)
                continue
            if e.code in (500, 502, 503, 504):
                wait = 10 * (attempt + 1)
                print(f"      [script] {e.code} on {label}, retry in {wait}s")
                time.sleep(wait)
                continue
            raise RuntimeError(f"Gemini API error: {last_err}")
        except (urllib.error.URLError, TimeoutError) as e:
            last_err = f"network: {e}"
            print(f"      [script] {last_err} on {label}, retrying")
            time.sleep(5)
            continue
    if resp is None:
        raise RuntimeError(f"Exhausted retries: {last_err}")

    try:
        cand = resp["candidates"][0]
        parts = cand["content"]["parts"]
        for p in parts:
            if "functionCall" in p:
                args = p["functionCall"].get("args") or {}
                if "scenes" in args:
                    return args["scenes"]
        raise KeyError("no functionCall.scenes in response")
    except (KeyError, IndexError, TypeError) as e:
        raise RuntimeError(
            f"Could not parse Gemini response: {e}\n{json.dumps(resp)[:800]}")


def _validate_only_legacy(scenes, source, cache_path):
    """Legacy Egyptian (locale=None) path: strict validate WITHOUT any
    normalization or presentation repair. Preserves byte-equivalent behavior
    of the pre-normalizer pipeline. On cache validation failure, delete the
    cache and raise so no downstream step runs."""
    composite = os.path.basename(os.path.dirname(cache_path)) or "unknown"
    record = _write_validation_evidence(scenes, None, composite, source)
    if not record["ok"]:
        try:
            if source == "cache" and os.path.exists(cache_path):
                os.remove(cache_path)
        except OSError:
            pass
        raise RuntimeError(
            f"Scene validation FAILED ({source}, legacy) for "
            f"{composite}: " + "; ".join(record["violations"])
        )
    print(f"      [validate:{source}] locale=legacy "
          f"scenes={len(scenes) if isinstance(scenes, list) else 0} OK")
    return scenes


def _normalize_and_validate(scenes, locale, source, cache_path,
                            lesson_title=None, next_lesson_title=None):
    """Locale-aware pipeline (ar-MSA / ar-Gulf / en): normalize (idempotent,
    presentation-only) → validate (strict). On validation failure, delete
    cache and raise. Returns (normalized_scenes, repairs).

    MUST NOT be called with locale=None — legacy Egyptian uses
    _validate_only_legacy to preserve byte-equivalent behavior."""
    assert locale is not None, "_normalize_and_validate is locale-aware only"
    composite = os.path.basename(os.path.dirname(cache_path)) or "unknown"
    normalized, repairs = _normalize_scenes(
        scenes, locale=locale,
        lesson_title=lesson_title,
        next_lesson_title=next_lesson_title,
    )
    _write_normalization_evidence(
        composite, locale, source, repairs,
        len(normalized) if isinstance(normalized, list) else 0,
    )
    if repairs:
        print(f"      [normalize:{source}] locale={locale} "
              f"repairs={len(repairs)}")
    record = _write_validation_evidence(normalized, locale, composite, source)
    if not record["ok"]:
        try:
            if source == "cache" and os.path.exists(cache_path):
                os.remove(cache_path)
        except OSError:
            pass
        raise RuntimeError(
            f"Scene validation FAILED ({source}, post-normalization) for "
            f"{composite} locale={locale!r}: " + "; ".join(record["violations"])
        )
    print(f"      [validate:{source}] locale={locale} "
          f"scenes={len(normalized)} OK")
    return normalized, repairs


def generate_scenes_cached(lesson_id, blocks, title, cache_path,
                           has_quiz=False, next_lesson_title=None, locale=None):
    if os.path.exists(cache_path):
        with open(cache_path) as f:
            scenes = json.load(f)
        normalized, repairs = _normalize_and_validate(
            scenes, locale, "cache", cache_path,
            lesson_title=title, next_lesson_title=next_lesson_title,
        )
        # Persist normalized cache so subsequent loads are a no-op (idempotent).
        if repairs:
            with open(cache_path, "w") as f:
                json.dump(normalized, f, ensure_ascii=False, indent=2)
        return normalized

    # Strategy: Flash first (cheap + fast). Escalate to Pro only if Flash
    # fails twice with grounding violations. Accept Flash output with a
    # single minor violation rather than re-running.
    last_violations = []
    scenes = None
    plan = [(MODEL_FAST, "flash"), (MODEL_FAST, "flash+notes"), (MODEL_STRONG, "pro-fallback")]
    for model, label in plan:
        note = ""
        if last_violations:
            note = (
                "Previous script violated the Grounding rules. Fix the violations "
                "below and regenerate the whole script:\n- "
                + "\n- ".join(last_violations)
            )
        t0 = time.time()
        try:
            scenes = generate_scenes(
                lesson_id, blocks, title,
                has_quiz=has_quiz,
                next_lesson_title=next_lesson_title,
                extra_user_note=note,
                model=model,
                locale=locale,
            )
        except Exception as e:
            print(f"      [script:{label}] error after {time.time()-t0:.1f}s: {e}")
            continue
        violations = lint_scenes(scenes, has_quiz, next_lesson_title)
        print(f"      [script:{label}] {time.time()-t0:.1f}s, "
              f"{len(scenes)} scenes, {len(violations)} violations")
        if not violations:
            break
        if label == "flash" and len(violations) <= 1:
            print(f"      [script:{label}] accepting with 1 minor violation")
            break
        last_violations = violations
        for v in violations:
            print(f"        - {v}")
    else:
        raise RuntimeError(
            "All script attempts failed (Flash x2 + Pro). Last violations:\n  - "
            + "\n  - ".join(last_violations or ["(unknown)"])
        )

    # Normalize BEFORE strict validation and BEFORE caching.
    normalized, _repairs = _normalize_and_validate(
        scenes, locale, "gemini", cache_path,
        lesson_title=title, next_lesson_title=next_lesson_title,
    )

    os.makedirs(os.path.dirname(cache_path), exist_ok=True)
    with open(cache_path, "w") as f:
        json.dump(normalized, f, ensure_ascii=False, indent=2)
    return normalized
