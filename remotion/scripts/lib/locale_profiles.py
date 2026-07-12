"""Locale profile registry for the video pipeline.

Single source of truth for:
  * script-generation prompt profile (per-locale system prompt)
  * TTS prompt profile (per-locale narration guidance)
  * TTS model + actual voice policy (voice names that the current Gemini TTS
    implementation actually consumes — Charon / Aoede)

Legacy mode (`locale=None`) preserves the existing Egyptian Cairene behavior
unchanged; new locales (ar-MSA, ar-Gulf, en) get their own profiles and MUST
disable the Egyptian phonetic rewriter.
"""
from __future__ import annotations
from dataclasses import dataclass


TTS_MODEL = "gemini-2.5-flash-preview-tts"
# The Gemini TTS implementation supports exactly these prebuilt voices today.
# Do not advertise Google Cloud Wavenet voices — nothing in the pipeline
# consumes them.
ACTUAL_VOICE_POLICY = "gemini-tts:Charon(primary),Aoede(secondary)"


# ---------------------------------------------------------------------------
# Script (Gemini text) prompts
# ---------------------------------------------------------------------------

SCRIPT_PROMPT_LEGACY_EGYPTIAN = "legacy-egyptian-cairene-v1"  # sentinel; real prompt lives in script_writer.SYSTEM_PROMPT

SCRIPT_PROMPT_AR_MSA = """أنت تحوّل محتوى درس مكتوب (blocks) إلى سكريبت فيديو قصير
باللغة العربية الفصحى الحديثة (Modern Standard Arabic) — نبرة تعليمية هادئة،
كأنك مذيع/شارح محترف. ممنوع أي لهجة عامية (مصرية، خليجية، شامية).

قواعد الـ Grounding (الأهم — مخالفتها = فشل كامل):
- ممنوع اختراع محتوى غير موجود في الـ blocks: لا أسئلة/quiz/تمارين إلا إذا وُجد block kind="quiz"
  في الـ blocks المرسلة، ولا أرقام/إحصائيات/أمثلة غير مذكورة، ولا موضوع للدرس التالي
  ما لم يُرسَل `next_lesson_title` صراحةً.
- context_flags في رسالة الـ user يحدد has_quiz و next_lesson_title بدقة — احترمهما حرفيًا.
- لو has_quiz=false: CTACard الأخير مجرد ملخص ودعوة عامة للدرس التالي، بدون ذكر أسئلة.
- لو next_lesson_title=null: ممنوع ذكر اسم/موضوع أي درس قادم.

قواعد اللغة:
- عربية فصحى حديثة فقط. لا تستعمل: إيه، إزاي، ليه، عايز، دلوقتي، بس، مش، ما...ش، هـ للمستقبل.
- استعمل: ماذا، كيف، لماذا، أريد، الآن، لكن، لا، لن، سـ/سوف للمستقبل.
- المصطلحات التقنية الإنجليزية (LLM, AI, GPT, API) تُكتب كما هي.
- كل مشهد 8–12 ثانية كلامًا (25–40 كلمة عربية).
- ابدأ TitleCard الأول بترحيب فصيح ("مرحبًا" أو "أهلًا بك")، واختم CTACard الأخير بدعوة للدرس التالي.
- ممنوع التكرار بين المشاهد.
- focus: 3–5 كلمات صعبة النطق مع تشكيل لاتيني، مفصولة بفاصلة.

تحويل blocks → scenes: نفس القواعد السابقة (HERO paragraphs → TitleCard, concepts → ConceptCard,
paragraphs عادي → BulletsCard, comparison → CompareCard, screenshot → ScreenshotCard,
diagram → BulletsCard، quiz → CTACard، تجاهل lessonVideo، أضف CTACard ختامي إذا لم يوجد quiz).

ألوان الـ accent: بدّل بين mint, lavender, peach, yellow, pink, mintDeep.
الأصوات: Charon (رجالي أساسي) و Aoede (نسائي للفروقات). بدّل بينهما.
- Visual كامل بكل الحقول المطلوبة للكارت (لا حقول ناقصة).
- CompareCard مشهد واحد فيه left + right. لا تنشئ اثنين.
- ScreenshotCard فقط إذا وُجد kind="screenshot" حقيقي وله src ينتهي بـ .jpg/.png/.webp.

شكل visual لكل كارت: TitleCard{chip,title,highlight,subtitle} · ConceptCard{term,definition,tag}
· BigStatCard{intro,big,outro} · BulletsCard{title,bullets[]} · CompareCard{title,left{label,body},right{label,body}}
· ScreenshotCard{eyebrow,title,caption,src} · CTACard{eyebrow,title,highlight,tagline}"""


SCRIPT_PROMPT_AR_GULF = """أنت تحوّل محتوى درس مكتوب (blocks) إلى سكريبت فيديو قصير
باللهجة الخليجية الحديثة النيوترال (مفهومة في السعودية والإمارات والكويت وقطر) — نبرة ودّية
كأنك تشرح لصديقك. ممنوع منعًا باتًا أي كلمات أو نطق مصري (لا "إيه"، لا "إزاي"، لا "دلوقتي"،
لا "عايز"، لا ج المصرية الحادة).

قواعد الـ Grounding (نفس صرامة MSA):
- لا تختلق محتوى، ولا تذكر أسئلة/quiz/تمارين إلا لو فيه block kind="quiz"، ولا موضوع الدرس
  الجاي إلا لو `next_lesson_title` موجود.
- احترم has_quiz و next_lesson_title من context_flags حرفيًا.

قواعد اللهجة الخليجية:
- استخدم: وش، كيف، ليش، أبغى/أبي، الحين، بس، ما، مو، ب + فعل (بيقول)، بـ للمستقبل ("بروح").
- ممنوع: إيه، إزاي، عايز، دلوقتي، ازاي، الأدوات المصرية.
- نطق: ج = J إنجليزية ناعمة (ليست G المصرية)، ق = G في بعض الكلمات (قال → gal مقبول)، ك تبقى كما هي.
- المصطلحات التقنية (AI, LLM, GPT, API) تُنطق كما هي.
- كل مشهد 8–12 ثانية (25–40 كلمة).
- ابدأ TitleCard الأول بترحيب خليجي طبيعي ("هلا والله" / "أهلًا فيك")، واختم CTACard الأخير
  بدعوة للدرس الجاي.
- focus: 3–5 كلمات صعبة النطق مع تشكيل لاتيني.

تحويل blocks → scenes: نفس القواعد المعروفة (HERO → TitleCard، concepts → ConceptCard،
paragraphs → BulletsCard، comparison → CompareCard، screenshot → ScreenshotCard،
diagram → BulletsCard، quiz → CTACard).

الأصوات: Charon (رجالي أساسي) و Aoede (نسائي للفروقات). Visual كامل بكل حقوله.
شكل visual مطابق تمامًا لبروفايل MSA."""


SCRIPT_PROMPT_EN = """You convert a written lesson (blocks) into a short video script
in clear US English, warm and instructional — like a YouTuber explaining to a
friend. No Arabic vocabulary in the spoken text.

Grounding rules (violation = full failure):
- Never invent content not present in the blocks. Do not mention quizzes,
  exercises, questions, missions, or assignments unless a block with
  kind="quiz" is present in the blocks payload.
- Do not mention the next lesson's topic unless `next_lesson_title` is
  provided in context_flags. If it is null, close with a generic sign-off
  ("See you in the next lesson") without naming a topic.
- Respect has_quiz and next_lesson_title in context_flags literally.

Language rules:
- US English only. Keep tech terms (LLM, AI, GPT, API) as-is.
- Each scene = 8–12 seconds of speech (~20–35 English words).
- Open the first TitleCard with a friendly hello, close the final CTACard
  with an invitation to the next lesson.
- No repetition across scenes.
- focus: 3–5 tricky-to-pronounce words with a short hint, comma-separated.

Block → scene mapping: HERO paragraphs → TitleCard, concepts → ConceptCard,
paragraphs → BulletsCard, comparison → CompareCard, screenshot →
ScreenshotCard, diagram → BulletsCard, quiz → CTACard, ignore lessonVideo,
append a closing CTACard if no quiz.

Voices: Charon (male, primary) and Aoede (female, asides). Alternate.
Visual shape identical to the Arabic profiles."""


# ---------------------------------------------------------------------------
# TTS (Gemini) narration prompts
# ---------------------------------------------------------------------------

TTS_PROMPT_LEGACY_EGYPTIAN = "legacy-egyptian-compact-v1"  # sentinel; real string lives in gemini_tts.EGYPTIAN_RULES_COMPACT

TTS_PROMPT_AR_MSA = """اقرأ النص التالي باللغة العربية الفصحى الحديثة (MSA) بنطق واضح ومتزن.
لا تستخدم أي لهجة عامية (لا مصرية ولا خليجية ولا شامية). حافظ على مخارج الحروف الفصيحة
والإعراب الطبيعي عند الحاجة. المصطلحات الإنجليزية التقنية (AI, ChatGPT, GPT, API, Free Tier)
تُنطق بلكنة إنجليزية طبيعية. النبرة: هادئة، تعليمية، واثقة. سرعة متوسطة. خذ نَفَسًا خفيفًا
بعد كل جملة.

النص:
"""

TTS_PROMPT_AR_GULF = """اقرأ النص التالي باللهجة الخليجية الحديثة النيوترال (مفهومة في السعودية،
الإمارات، الكويت، قطر). ممنوع منعًا باتًا أي نطق مصري: لا ج مصرية حادة (G)، لا "إيه"، لا "دلوقتي"،
لا "عايز". نطق: ج = J إنجليزية ناعمة، ق كما تُكتب في الكلمة، ك تبقى كما هي. المصطلحات الإنجليزية
التقنية (AI, ChatGPT, GPT, API) تُنطق طبيعيًا. النبرة: دافئة، ودّية، إيقاع متوسط. خذ نَفَسًا
بعد كل جملة.

النص:
"""

TTS_PROMPT_EN = """Read the following text in clear, natural US English with a
warm, instructional tone. Moderate pace. Take a soft breath after each
sentence. Keep tech terms (AI, ChatGPT, GPT, API) with a natural English
pronunciation.

Text:
"""


@dataclass(frozen=True)
class LocaleProfile:
    locale: str
    script_prompt_profile: str          # human-readable id (e.g. "ar-MSA-v1")
    script_system_prompt: str           # the actual system prompt text
    tts_prompt_profile: str             # human-readable id
    tts_prompt: str                     # the actual TTS narration prompt
    tts_model: str
    actual_voice_policy: str
    egyptian_phonetic_rewrite: bool     # True only for legacy Egyptian mode
    focus_note_label: str               # label prepended to TTS focus notes
    fallback_bullets_labels: dict       # locale-safe strings for ScreenshotCard→BulletsCard fallback


# ---------------------------------------------------------------------------
# Fallback strings for write_scenes_module's ScreenshotCard→BulletsCard guard.
# Legacy Egyptian preserves the EXACT strings that were hardcoded before.
# ---------------------------------------------------------------------------
_LEGACY_FALLBACK = {"default_title": "الفكرة", "default_bullet": "خد الفكرة دي معاك"}
_AR_MSA_FALLBACK = {"default_title": "الفكرة الرئيسية", "default_bullet": "احتفظ بهذه الفكرة"}
_AR_GULF_FALLBACK = {"default_title": "الفكرة", "default_bullet": "خذ هالفكرة معاك"}
_EN_FALLBACK = {"default_title": "Key idea", "default_bullet": "Take this idea with you"}


LEGACY_EGYPTIAN = LocaleProfile(
    locale="__legacy_egyptian__",
    script_prompt_profile="legacy-egyptian-cairene-v1",
    script_system_prompt=SCRIPT_PROMPT_LEGACY_EGYPTIAN,  # sentinel — script_writer keeps its embedded prompt
    tts_prompt_profile="legacy-egyptian-compact-v1",
    tts_prompt=TTS_PROMPT_LEGACY_EGYPTIAN,               # sentinel — gemini_tts keeps EGYPTIAN_RULES_COMPACT
    tts_model=TTS_MODEL,
    actual_voice_policy=ACTUAL_VOICE_POLICY,
    egyptian_phonetic_rewrite=True,
    focus_note_label="ملاحظات نطق",                     # PRESERVED exactly
    fallback_bullets_labels=_LEGACY_FALLBACK,
)


_PROFILES: dict[str, LocaleProfile] = {
    "ar-MSA": LocaleProfile(
        locale="ar-MSA",
        script_prompt_profile="ar-MSA-v1",
        script_system_prompt=SCRIPT_PROMPT_AR_MSA,
        tts_prompt_profile="ar-MSA-tts-v1",
        tts_prompt=TTS_PROMPT_AR_MSA,
        tts_model=TTS_MODEL,
        actual_voice_policy=ACTUAL_VOICE_POLICY,
        egyptian_phonetic_rewrite=False,
        focus_note_label="ملاحظات نطق",
        fallback_bullets_labels=_AR_MSA_FALLBACK,
    ),
    "ar-Gulf": LocaleProfile(
        locale="ar-Gulf",
        script_prompt_profile="ar-Gulf-v1",
        script_system_prompt=SCRIPT_PROMPT_AR_GULF,
        tts_prompt_profile="ar-Gulf-tts-v1",
        tts_prompt=TTS_PROMPT_AR_GULF,
        tts_model=TTS_MODEL,
        actual_voice_policy=ACTUAL_VOICE_POLICY,
        egyptian_phonetic_rewrite=False,
        focus_note_label="ملاحظات نطق",
        fallback_bullets_labels=_AR_GULF_FALLBACK,
    ),
    "en": LocaleProfile(
        locale="en",
        script_prompt_profile="en-v1",
        script_system_prompt=SCRIPT_PROMPT_EN,
        tts_prompt_profile="en-tts-v1",
        tts_prompt=TTS_PROMPT_EN,
        tts_model=TTS_MODEL,
        actual_voice_policy=ACTUAL_VOICE_POLICY,
        egyptian_phonetic_rewrite=False,
        focus_note_label="Pronunciation notes",
        fallback_bullets_labels=_EN_FALLBACK,
    ),
}


def get_profile(locale: str | None) -> LocaleProfile:
    """Return the locale profile; `None`/empty → legacy Egyptian."""
    if not locale:
        return LEGACY_EGYPTIAN
    if locale not in _PROFILES:
        raise ValueError(
            f"Unknown locale {locale!r}. Supported: {sorted(_PROFILES)} or None (legacy Egyptian)."
        )
    return _PROFILES[locale]


def supported_locales() -> list[str]:
    return sorted(_PROFILES)
