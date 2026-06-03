/**
 * Lesson continuity map — one short bridge line per lesson explaining
 * how this lesson hands off to the next. Used by the "Next up" card
 * at the end of /intro, /creator, and /automator lesson pages.
 *
 * Keyed by the lesson id from curriculum-data (NOT the route slug).
 */
export const LESSON_CONTINUITY: Record<string, string> = {
  /* ---------------- Intro path (7) ---------------- */
  "intro-m1-l3-setup-your-ai":
    "فتحت أول AI ليك. الدرس الجاي بيشرحلك إيه هو الـ AI ده فعلًا — ليه مش سحر ومش وحش.",
  "intro-m1-l1-what-is-ai":
    "بعد ما فهمت إيه هو الـ AI، الدرس الجاي بيوضّحلك إزاي بيختلف عن أي برنامج عادي عرفته قبل كده.",
  "intro-m1-l5-ai-vs-software":
    "عرفت الفرق بين AI والبرمجيات. دلوقتي محتاج تعرف بالظبط بيقدر يعمل إيه ومبيقدرش يعمل إيه.",
  "intro-m1-l4-ai-can-cannot":
    "خلصت توقّعاتك من الـ AI. الدرس الجاي عملي: ٤ قواعد لأي Prompt تكتبه — اللي بتفرق بين رد ضعيف ورد قابل للنشر.",
  "intro-m1-l2-first-prompt":
    "اتعلّمت تكتب Prompt صح. الدرس الجاي بيشيل الرهبة من التعلّم نفسه — إزاي تتقن AI من غير ما تكون مبرمج.",
  "intro-m1-l6-learn-without-fear":
    "جاهز نفسيًا. آخر درس في المقدمة بيساعدك تختار المسار الصح — Business ولا Creator ولا Analyst ولا Automator ولا Builder.",
  "intro-m1-l7-choose-your-path":
    "اخترت مسارك. ادخل عليه من الخريطة دلوقتي وابدأ أول درس — هتلاقي نفسك جاهز تمامًا.",

  /* ---------------- Builder path (25) ---------------- */
  "builder-m1-l1-what-is-llm":
    "عرفت إيه الـ LLM. دلوقتي محتاج تعرف وحدته الأساسية: الـ Token وإزاي بيتدرّب.",
  "builder-m1-l2-tokens-training":
    "خلصت أساسيات الموديل. الموديول الجاي عن الـ Prompt — اللغة اللي بتكلّمه بيها.",
  "builder-m2-l1-prompt-layer":
    "عرفت تشريح الـ Prompt. الدرس الجاي بيفصّل الفرق بين Instructions و Examples.",
  "builder-m2-l2-instructions-examples":
    "اتعلّمت تقول للـ AI يعمل إيه. الدرس الجاي بيعلّمك تتحكّم في النبرة والأسلوب.",
  "builder-m2-l3-style-control":
    "خلصت تحكّم الـ Prompt. الموديول الجاي عن السياق — الذاكرة اللي بتديها للموديل.",
  "builder-m3-l1-context-layer":
    "فهمت السياق. لازم تعرف كمان حدوده — قد إيه يقدر يفتكر قبل ما ينسى.",
  "builder-m3-l2-memory-limits":
    "عرفت حدود الذاكرة. الموديول الجاي عن الـ Parameters اللي بتتحكّم في شخصية الموديل.",
  "builder-m4-l1-parameters":
    "اتحكّمت في الـ Parameters كلها (Temperature, Top-p, Max tokens). الموديول الجاي بيدخّلك في بناء التطبيق الفعلي: Frontend → Backend → Database.",
  "builder-m5-l2-frontend":
    "عرفت اللي بيشوفه المستخدم. ورا الكواليس: Backend و الـ API اللي بيشغّل كل حاجة.",
  "builder-m5-l3-backend-api":
    "فهمت الـ Backend. آخر قطعة في الـ Stack: مكان تخزين البيانات — الـ Database.",
  "builder-m5-l4-database-intro":
    "فهمت المخزن الذكي. الدرس الجاي بريك سريع: نشوف إنت فهمت إيه فعلاً قبل ما نكمّل.",
  "builder-m5-l5-l12b-mini-win":
    "ثبّتت فهمك للـ 3 طبقات. الموديول الجاي عن تحويل فكرتك لصفحة فعلية في Lovable.",
  "builder-m6-l1-idea-to-page":
    "بنيت أول صفحة. لازم تفهم الـ Components والـ Routes عشان تبني تطبيق متعدد الصفحات.",
  "builder-m6-l4-components-routes":
    "عرفت تركيب الـ App. الموديول الجاي عن حماية المستخدمين: Sessions و RLS.",
  "builder-m8-l1-sessions-jwt":
    "فهمت إزاي المستخدم بيدخل. الدرس الجاي عن إزاي بياناته بتفضل خاصة بيه: RLS.",
  "builder-m8-l2-rls":
    "أمّنت بياناتك. الموديول الجاي بيدخّلك في تصميم الـ Database بشكل احترافي.",
  "builder-m7-l1-tables-columns":
    "صمّمت الجداول. لازم تعرف إزاي تربطهم ببعض: Relations.",
  "builder-m7-l2-relations":
    "ربطت الجداول. الدرس الجاي بيعلّمك تجيب البيانات منهم: Queries.",
  "builder-m7-l3-queries":
    "خلصت تصميم الـ Database. الموديول الجاي بيدخّل الـ AI جوّه تطبيقك: Embeddings و RAG و Agents.",
  "builder-m9-l2-embeddings":
    "فهمت لغة الـ AI الرقمية. الدرس الجاي بيخلّي الـ AI يرد من بياناتك إنت: RAG.",
  "builder-m9-l1-rag":
    "بنيت RAG. آخر درس في الموديول: Agents — AI بياخد قرارات بنفسه.",
  "builder-m9-l3-agents":
    "خلصت طبقة الذكاء. الموديول الأخير: تنشر تطبيقك على دومين حقيقي وتجيب أول مستخدمين.",
  "builder-m10-deploy-domain":
    "تطبيقك على الإنترنت. آخر درس: إزاي تجيب أول مستخدمين وتطوّر بناء على فيدباكهم.",
  "builder-m10-first-users":
    "خلصت مسار Builder كامل 🎉 — لو لسه عندك مسارات مفتوحة، ارجع للداشبورد واختار التالي بترتيبه (Business → Creator → Analyst → Automator).",

  /* ---------------- Creator path (14) ---------------- */
  "creator-m1-l1-why-content":
    "بعد ما حدّدت ليه بتعمل محتوى، الدرس الجاي بيوريك ليه الانتباه نفسه بقى عملة نادرة.",
  "creator-m1-l2-attention-economy":
    "بعد ما فهمت اقتصاد الانتباه، هتتعلّم تصطاد الثواني الأولى بـ Hook قوي.",
  "creator-m3-l1-hook":
    "Hook لوحده مش كفاية — محتاج هيكل سكربت كامل يمسك المتابع للنهاية.",
  "creator-m3-l2-script-structure":
    "أي سكربت بدون CTA = فرصة ضايعة. الدرس الجاي عن دعوة الفعل.",
  "creator-m3-l3-cta":
    "خلصت أدوات السكربت. الدرس الجاي بيدخّلك في فهم جمهورك الحقيقي.",
  "creator-m2-l1-know-audience":
    "عرفت جمهورك — دلوقتي محتاج Pillars محتوى تبني عليها كل أسبوع.",
  "creator-m2-l2-content-pillars":
    "Pillars جاهزة. الدرس الجاي بيخليك تستخدم AI ككاتب يساعدك تنفّذ أسرع.",
  "creator-m4-l3-ai-writing":
    "AI بيكتب — بس Reality Check بيوضّحلك حدود الأداة وحدودك انت.",
  "creator-m4-l1-reality-check":
    "خلاص اتفقنا على الحدود. الدرس الجاي عملي: تصوّر إزاي بموبايلك.",
  "creator-m4-l2-mobile-shooting":
    "عندك سكربت + تصوير. الدرس الجاي بيقولك تنزل على فين بالظبط.",
  "creator-m6-l1-platforms":
    "اخترت المنصات. دلوقتي محتاج تنظّم وقتك بـ Scheduling.",
  "creator-m6-l2-scheduling":
    "بتنشر بانتظام — الدرس الجاي يعلّمك تقرأ الأرقام صح.",
  "creator-m6-l3-analytics":
    "الأرقام بتقولك ايه شغّال. آخر درس: تحوّل المتابعين لـ Leads حقيقية.",
  "creator-m6-l4-leads":
    "خلصت مسار Creator كامل. ارجع للخريطة واكمل في مسار تاني.",

  /* ---------------- Automator path (17) ---------------- */
  "automator-m0-l1-where-you-are":
    "حدّدت موقعك. الموديول الجاي بيعلّمك تشوف شغلك كأنظمة بدل مهام مبعثرة.",
  "automator-m1-l1-systems-view":
    "اتعلّمت تشوف بالأنظمة. لازم تعرف تتعرّف على الـ Patterns المتكرّرة جوّه شغلك.",
  "automator-m1-l2-spot-patterns":
    "لقيت الـ Patterns. دلوقتي محتاج تقرّر إيه اللي يستاهل تأتمته فعلًا.",
  "automator-m1-l3-decide-what-to-automate":
    "عندك Backlog أتمتة. الموديول الجاي بيقدّملك أدوات السوق: n8n، Zapier، Make.",
  "automator-m2-l1-tools-landscape":
    "اخترت أداتك. اللبنة الأولى في أي Flow: Triggers و Actions.",
  "automator-m2-l2-triggers-actions":
    "بتقدر تشغّل وتنفّذ. الدرس الجاي بيعلّمك توجّه البيانات بـ Filters و Routers.",
  "automator-m2-l3-filters-routers":
    "خلصت أساسيات الـ Flow. الموديول الجاي بيوصّلك بمصادر بيانات حقيقية.",
  "automator-m3-l1-connect-database":
    "وصّلت Database. لازم تعرف Webhooks و APIs عشان تتكلّم مع أي خدمة برّه.",
  "automator-m3-l2-webhooks-api":
    "بتتكلّم مع أي API. آخر درس مهم: Error Handling عشان الـ Flow ميقفش.",
  "automator-m3-l3-error-handling":
    "Flow صلب ومقاوم للأخطاء. الموديول الجاي بيدخّل الـ AI داخل الـ Flow.",
  "automator-m4-l1-llm-in-flow":
    "الـ LLM في الـ Flow. الدرس الجاي بيخلّي الـ Flow يستخدم بياناتك: RAG.",
  "automator-m4-l2-rag-in-n8n":
    "RAG بيشتغل. آخر درس في الموديول: Agents — Flows بتاخد قرارات.",
  "automator-m4-l3-agents":
    "خلصت طبقة الذكاء. الموديول الجاي بيركّب أول Flow حقيقي للـ Leads.",
  "automator-m5-l1-lead-capture":
    "بتجمع Leads. الدرس الجاي بينقل المحادثة على WhatsApp تلقائيًا.",
  "automator-m5-l2-whatsapp-flow":
    "WhatsApp Flow شغّال. آخر درس: متابعة العميل تلقائيًا (Follow-up).",
  "automator-m5-l3-follow-up":
    "خلصت نظام Leads كامل. الموديول الأخير بيقفل الـ Loop وبيوصّل كل حاجة ببعضها.",
  "automator-m6-l1-closing-loop":
    "خلصت مسار Automator كامل 🎉 — اختار مسار تاني من الخريطة.",

  /* ---------------- Analyst path (12) ---------------- */
  "analyst-m0-l1-from-automation-to-insight":
    "فهمت إن دورك بقى تسأل، مش تجمع. الموديول الجاي بيعلّمك تحوّل أي شعور لسؤال محدّد.",
  "analyst-m1-l1-feeling-to-question":
    "حوّلت الشعور لسؤال. الدرس الجاي بيوضّحلك إيه يخلّي السؤال «صح» — ٤ شروط بسيطة.",
  "analyst-m1-l2-right-question-rule":
    "السؤال صح. الموديول الجاي عن جمع البيانات الـ ٣ مصادر — ووضعهم في مكان واحد.",
  "analyst-m2-l1-three-sources":
    "البيانات في مكان واحد. الدرس الجاي بيستخدم AI كمحلّل: ٥٠ رسالة → ملخّص في ٣٠ ثانية.",
  "analyst-m2-l2-ai-summarization":
    "عندك ملخّصات. الموديول الجاي بيعلّمك تفرّق بين Pattern (نمط) و Outlier (استثناء).",
  "analyst-m3-l1-pattern-vs-outlier":
    "بتفرّق بين النمط والاستثناء. الدرس الجاي القاعدة الذهبية: كل تفسير ينتهي بقرار.",
  "analyst-m3-l2-decision-rule":
    "كل insight بقى له action. الموديول الجاي بيركّبهم في Dashboard من ٤ أرقام بس.",
  "analyst-m4-l1-four-numbers-dashboard":
    "Dashboard جاهز. الدرس الجاي بيحوّله لـ ritual أسبوعي — ١٥ دقيقة كل أحد.",
  "analyst-m4-l2-weekly-review-ritual":
    "عندك إيقاع أسبوعي. الموديول الجاي بيتكلّم عن الأخطاء الشائعة في الأسئلة والتفسير.",
  "analyst-m5-l1-question-mistakes":
    "عرفت أخطاء الأسئلة. الدرس الجاي عن أخطر فخّين في التفسير: Paralysis و Correlation≠Causation.",
  "analyst-m5-l2-interpretation-mistakes":
    "نظام التحليل اكتمل. آخر درس بيوصّلك بـ Business — اللي بياخد قراراتك ويحوّلها لنظام يومي.",
  "analyst-m6-l1-from-decisions-to-business":
    "خلصت Analyst كامل 🎉 — ادخل Business وكمّل القفل النهائي للـ ecosystem.",

  /* ---------------- Business path (12) ---------------- */
  "business-m0-l1-from-decisions-to-leadership":
    "بقيت Leader، مش Operator. الموديول الجاي بيعلّمك تحرّر يومك من Reactive Mode.",
  "business-m1-l1-reactive-vs-proactive":
    "يومك بقى Proactive. الدرس الجاي بيوزّع أسبوعك على الـ ٤ مسارات التنفيذية (Creator/Analyst/Automator/Builder).",
  "business-m1-l2-weekly-rhythm":
    "أسبوعك ليه إيقاع. الموديول الجاي عن إدارة العملاء — من أول تواصل لعميل ثابت.",
  "business-m2-l1-customer-lifecycle":
    "فهمت دورة العميل. الدرس الجاي بيركّب Follow-up Flow بـ ٣ رسائل (٣ أيام/أسبوعين/شهر).",
  "business-m2-l2-retention-flow":
    "العملاء بيتحافظ عليهم. الموديول الجاي عن إدارة العمليات — Strategic/Operational/Administrative.",
  "business-m3-l1-strategic-operational-admin":
    "كل نوع عرفت مكانه. الدرس الجاي بيعلّمك تختار بين Delegate و Automate لكل مهمة.",
  "business-m3-l2-delegate-or-automate":
    "٨٠٪ من شغلك مش محتاجك. الموديول الجاي عن النمو والتوسع — العلامات الـ ٤ للجاهزية.",
  "business-m4-l1-readiness-signals":
    "عرفت إمتى تكبّر. الدرس الجاي قاعدة ذهبية: System الأول، الناس بعدين.",
  "business-m4-l2-system-then-people":
    "ترتيب التوسع واضح. الموديول الجاي عن أخطر فخّين: الرجوع Reactive والتوسع قبل الأوان.",
  "business-m5-l1-reactive-relapse":
    "بتعرف ترجع بسرعة. الدرس الجاي عن خطر التوسع قبل الأوان — وعلامات الخطر الواضحة.",
  "business-m5-l2-premature-scaling":
    "بتعرف تتفادى الفخ. آخر درس بيقفل الـ ecosystem كامل — الـ ٥ مسارات في يومك.",
  "business-m6-l1-full-ecosystem":
    "خلصت كل المسارات 🎉 — شغلك بقى ecosystem كامل. شخص + AI + System صح = Business حقيقي.",
};

/**
 * Returns the continuity bridge text for a given lesson id, or a sensible
 * default if not in the map.
 */
export function getContinuity(
  lessonId: string,
  nextTitle?: string,
  pathTitle?: string,
): string {
  const explicit = LESSON_CONTINUITY[lessonId];
  if (explicit) return explicit;
  if (nextTitle) return `بعد ما تخلّص المهمة دي، كمّل لدرس «${nextTitle}».`;
  return pathTitle
    ? `خلصت المسار ده — ارجع للخريطة وكمّل في مسار تاني.`
    : "خلصت الدرس — ارجع للخريطة.";
}