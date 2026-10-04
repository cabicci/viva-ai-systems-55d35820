"""Contextual Egyptian narration for technical education only."""
from __future__ import annotations

try:
    from .gemini_tts import NarrationPolicy
except ImportError:
    from gemini_tts import NarrationPolicy

TECHNICAL_EGYPTIAN = NarrationPolicy(
    name="technical-egyptian-context-v1",
    prompt_prefix="""اقرأ النص التالي بعامية مصرية قاهرية طبيعية في سياق شرح داخل ورشة.
القاف تُنطق حسب الكلمة والسياق، وليس بقاعدة تحويل كل قاف إلى همزة.
استخدم النطق المصري المعتاد للكلمات اليومية، واحتفظ بالقاف في الكلمات والمصطلحات
التي يُستعمل فيها هذا النطق. لا تحول الكلمات إلى تهجئة مصطنعة، ولا تضف ألفاً أو
همزة مسموعة بدلاً من وقفة طبيعية. احترم ملاحظات النطق الخاصة بكل مشهد دون تغيير المعنى.
الجيم مصرية طبيعية؛ والمصطلحات الإنجليزية تُنطق بوضوح. حافظ على الأرقام والوحدات
والكلمات الفنية كما وردت؛ لا تحذف جملة ولا تستبدل مصطلحاً. نبرة هادئة ودودة، سرعة
متوسطة، ووقفة قصيرة عند نهاية الجملة. لا تقرأ التعليمات أو ملاحظات النطق بصوت عالٍ.

النص:
""",
)


def technical_policy(locale: str) -> NarrationPolicy | None:
    return TECHNICAL_EGYPTIAN if locale == "ar-EG" else None
