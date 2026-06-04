/**
 * Value Hook registry — the one-line promise shown at the very top
 * of every lesson, BEFORE any concept ever lands. Answers the
 * skeptic's first question: "ليه أكمل أصلاً؟"
 *
 * Resolution: lessonId → pathId + module number → hook text.
 * Keys are `${pathId}-m${N}` (e.g. "builder-m1"). Intro lessons
 * use their own slug.
 *
 * Rules:
 *  - One sentence, Egyptian Arabic, value-first ("بعد ... هتقدر تـ ...").
 *  - Concrete deliverable (لا فلسفة، لا تنظير).
 *  - مكتوبة لصاحب شغل/فري لانسر، مش لمبرمج.
 */

export const VALUE_HOOKS: Record<string, string> = {
  /* Intro */
  "intro-m1-l3-setup-your-ai": "بعد ٥ دقايق هيكون عندك أداة AI شغّالة ومجهّزة لشغلك.",
  "intro-m1-l1-what-is-ai": "بعد الدرس ده هتعرف تفرّق بين AI حقيقي و AI مزيّف بتاع إعلانات.",
  "intro-m1-l5-ai-vs-software": "بعد الدرس ده هتعرف إمتى تستخدم AI وإمتى software عادي يكفي — وتوفّر فلوس.",
  "intro-m1-l4-ai-can-cannot": "بعد الدرس ده هتبطل تطلب من AI حاجات مش بيعملها — وتاخد نتايج صح من أول مرة.",
  "intro-m1-l6-learn-without-fear": "بعد الدرس ده هتقدر تدخل على أي أداة AI من غير ما تتلكك.",
  "intro-m1-l2-first-prompt": "بعد الدرس ده هتكتب أول prompt يجيب نتيجة فعلاً تنفع شغلك.",
  "intro-m1-l7-choose-your-path": "بعد الدرس ده هتعرف بالظبط أنهي مسار من الخمسة يخدم هدفك.",

  /* Builder */
  "builder-m1": "بعد الموديول ده هتفهم LLM بيشتغل إزاي — عشان تستخدمه كأداة مش كصندوق أسود.",
  "builder-m2": "بعد الموديول ده هتكتب prompts بتدّي نفس النتيجة كل مرة — مش لوتري.",
  "builder-m3": "بعد الموديول ده هتعرف تدّي AI كل المعلومات اللي محتاجها — من غير ما يخترع.",
  "builder-m4": "بعد الموديول ده هتظبّط دقّة وتكلفة AI بتاعك بدل ما تفضل تجرّب عشوائي.",
  "builder-m5": "بعد الموديول ده هتعرف من إيه التطبيقات اتعملت — وتقدر تتخاطب مع AI builder صح.",
  "builder-m6": "بعد الموديول ده هيكون عندك أول app شغّال من Lovable بإيدك.",
  "builder-m7": "بعد الموديول ده هتعرف تخزّن داتا تطبيقك في database حقيقية بدون كود.",
  "builder-m8": "بعد الموديول ده تطبيقك هيقدر يعرف مين اليوزر، ومش هيبقى أي حد يقرا داتا أي حد.",
  "builder-m9": "بعد الموديول ده هتبني assistant بيرد على عملاء شركتك من ملفاتك الخاصة (RAG + Agents).",

  /* Creator */
  "creator-m1": "بعد الموديول ده هتعرف ليه المحتوى = أرخص قناة بيع، وإزاي تستخدمه ك-system.",
  "creator-m2": "بعد الموديول ده هتكتب سكريبت reel وقفل (Hook + Body + CTA) في ١٠ دقايق.",
  "creator-m3": "بعد الموديول ده هيكون عندك ٣ Pillars محتوى موجّهة لجمهور محدّد مش لكل الناس.",
  "creator-m4": "بعد الموديول ده هتنزّل ريل بجودة احترافية من موبايلك من غير كاميرا ولا فريق.",
  "creator-m5": "بعد الموديول ده هيكون عندك جدول نشر أسبوعي + داتا بتقولك إيه اللي بيشتغل.",
  "creator-m6": "بعد الموديول ده حسابك هيبقى شكله Brand محترم — مش مجرد بوستات متفرّقة.",

  /* Automator */
  "automator-m1": "بعد الموديول ده هتعرف تشوف شغلك كـ Systems تتأتمت، مش مهام متفرّقة.",
  "automator-m2": "بعد الموديول ده هيكون عندك أول flow شغّال في n8n من غير كود.",
  "automator-m3": "بعد الموديول ده flowـك هيقدر يكلّم Sheets و Webhooks ويتعالج لو حصل error.",
  "automator-m4": "بعد الموديول ده هتدخّل LLM جوّه automation بتاعك — رد على عميل أو لخّص داتا أوتوماتيك.",
  "automator-m5": "بعد الموديول ده هيكون عندك system متكامل بيستقبل lead على واتساب ويتابعه لحد البيع.",
  "automator-m6": "بعد الدرس ده هتقفل الـ loop وتقيس الـ ROI الفعلي لأتمتتك بالأرقام.",

  /* Analyst */
  "analyst-m1": "بعد الموديول ده هتحوّل أي إحساس («حاسس البيع نازل») لسؤال داتا بيتجاوب.",
  "analyst-m2": "بعد الموديول ده هتسحب داتا من ٣ مصادر وتلخّصها بـ AI في صفحة واحدة.",
  "analyst-m3": "بعد الموديول ده هتفرّق بين رقم استثنائي ورقم متكرّر — وتاخد قرار مبني على ده.",
  "analyst-m4": "بعد الموديول ده هيكون عندك Dashboard من ٤ أرقام بتراجعها أسبوعي في ١٥ دقيقة.",
  "analyst-m5": "بعد الموديول ده هتبطل ٥ غلطات شائعة في قراءة الداتا بتكلّفك قرارات غلط.",
  "analyst-m6": "بعد الدرس ده هتعرف توصّل الـ insights لقرارات Business حقيقية مش مجرد تقارير.",

  /* Business */
  "business-m1": "بعد الموديول ده يومك هيبقى Proactive — مش بتطفّي حرايق طول الوقت.",
  "business-m2": "بعد الموديول ده هتعرف رحلة عميلك من أول معرفة لحد ولاء — وتحدّد فين بتخسر.",
  "business-m3": "بعد الموديول ده هتعرف إيه تـ delegate، وإيه تـ automate، وإيه تمسكه إنت.",
  "business-m4": "بعد الموديول ده هتعرف إمتى تجيب موظف جديد، وإمتى الـ system لسه أهم.",
  "business-m5": "بعد الموديول ده هتفادي غلطتين بيقتلوا الشركات: scaling بدري + reactive relapse.",
  "business-m6": "بعد الدرس ده هتشوف الـ ecosystem كامل وفين بالظبط شركتك دلوقتي عليه.",
};

/**
 * Resolve a value hook string from a lesson slug.
 * Tries exact slug first (for intro lessons), then `{path}-m{N}` derived from prefix.
 */
export function getValueHook(lessonId: string | undefined): string | undefined {
  if (!lessonId) return undefined;
  if (VALUE_HOOKS[lessonId]) return VALUE_HOOKS[lessonId];
  const m = lessonId.match(/^(builder|creator|automator|analyst|business)-m(\d+)/);
  if (m) return VALUE_HOOKS[`${m[1]}-m${m[2]}`];
  return undefined;
}