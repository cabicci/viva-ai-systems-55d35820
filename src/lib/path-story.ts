import type { SupportedLocale } from "@/lib/locale/types";
import type { LearningLine } from "@/lib/learning-lines";

type Text = readonly [string, string, string, string];
export const localizePathText = (text: Text, locale: SupportedLocale) =>
  text[({ "ar-EG": 0, "ar-MSA": 1, "ar-Gulf": 2, en: 3 } as const)[locale]];

const story = {
  title: [
    "كل خطوة بتفتح لك طريق",
    "كل خطوة تفتح لك طريقًا",
    "كل خطوة تفتح لك طريق",
    "Every step opens a path",
  ],
  body: [
    "مسارات مش مجرد معلومات بتتجمع. بتبدأ بخطوة تفهم فيها فكرة وتجرّبها؛ والخطوات المرتبطة بتوصّلك لمحطة، والمحطات بتكوّن مسار. ومع تنوّع مساراتك، معرفتك بتتوسع وطريقة تفكيرك بتتطور، وبتربط اللي اتعلمته بحياتك وشغلك. وبعض المسارات بتوصّلك لهدفك بخطوات مباشرة من غير محطات.",
    "مسارات تجربة لبناء المعرفة تدريجيًا. تبدأ بخطوة تفهم فيها فكرة وتطبّقها؛ وتتجمع الخطوات المترابطة في محطة، وتكوّن المحطات مسارًا. ومع تنوّع مساراتك، تتسع معرفتك ويتطور تفكيرك، وتربط تعلّمك بحياتك وعملك. وقد يتكوّن المسار من خطوات مباشرة دون محطات.",
    "مسارات تجربة تبني فيها معرفتك خطوة خطوة. تبدأ بفكرة تفهمها وتجرّبها؛ والخطوات المرتبطة توصّلك لمحطة، والمحطات تكوّن مسار. ومع تنوّع مساراتك، تتوسع معرفتك ويتطور تفكيرك، وتربط اللي تعلّمته بحياتك وشغلك. وبعض المسارات توصّلك لهدفك بخطوات مباشرة من دون محطات.",
    "Masaarat is a journey of building knowledge. Each step connects an idea with practice. Related steps form a station, and stations form a path. Exploring different paths can broaden your knowledge and develop your thinking, connecting learning with life and work. Some paths lead directly through steps, without stations.",
  ],
  visionTitle: ["رؤيتنا", "رؤيتنا", "رؤيتنا", "Our vision"],
  vision: [
    "إن الإنسان يفضل قادر يتعلّم ويطوّر تفكيره، ويجمع بين معارف ومهارات مختلفة تفتح له فرص جديدة.",
    "أن يتمكن الإنسان من مواصلة التعلّم وتطوير تفكيره، والجمع بين معارف ومهارات متنوعة تفتح له آفاقًا جديدة.",
    "إن الإنسان يواصل التعلّم ويطوّر تفكيره، ويجمع بين معارف ومهارات مختلفة تفتح له فرص جديدة.",
    "People who can keep learning, develop their thinking and connect knowledge and skills across different areas to open new possibilities.",
  ],
  missionTitle: ["رسالتنا", "رسالتنا", "رسالتنا", "Our mission"],
  mission: [
    "نحوّل التعلّم لخطوات واضحة فيها فهم وتجربة وتطبيق، ونرتّبها في مسارات تناسب هدفك وعمرك، وتساعدك تبني معرفتك وتستخدمها.",
    "تقديم تعلّم منظم في خطوات تجمع الفهم والتجربة والتطبيق، ضمن مسارات تناسب أهداف المتعلم وعمره، وتساعده على بناء المعرفة واستخدامها.",
    "نقدّم تعلّم بخطوات واضحة تجمع الفهم والتجربة والتطبيق، في مسارات تناسب هدفك وعمرك، وتساعدك تبني معرفتك وتستخدمها.",
    "Make learning clear and practical through steps that combine understanding, exploration and application, in paths suited to learners' goals and ages.",
  ],
  valuesTitle: ["قيمنا", "قيمنا", "قيمنا", "Our values"],
  values: [
    "فهم قبل الحفظ، وتطبيق مع المعرفة، وتقدّم على قد هدفك، وربط بين اللي بتتعلمه في المسارات المختلفة.",
    "الفهم قبل الحفظ، وربط المعرفة بالتطبيق، والتقدّم وفق هدف المتعلم، والتكامل بين مجالات التعلّم المختلفة.",
    "فهم قبل الحفظ، وتطبيق مع المعرفة، وتقدّم يناسب هدفك، وربط بين اللي تتعلّمه في المسارات المختلفة.",
    "Understanding before memorisation, knowledge connected with practice, progress guided by your goals and connections across learning areas.",
  ],
  aboutPath: ["عن المسار", "عن المسار", "عن المسار", "About this path"],
  goals: ["هتتعلّم إيه؟", "ماذا ستتعلّم؟", "وش بتتعلّم؟", "What you will learn"],
  audience: ["المسار ده لمين؟", "لمن هذا المسار؟", "هذا المسار لمين؟", "Who this path is for"],
  requirements: ["قبل ما تبدأ", "قبل أن تبدأ", "قبل ما تبدأ", "Before you start"],
  open: ["اكتشف المسار", "استكشف المسار", "اكتشف المسار", "Explore path"],
  content: ["شوف خطوات المسار", "استعرض خطوات المسار", "شوف خطوات المسار", "Explore path steps"],
  contents: ["محتويات المسار", "محتويات المسار", "محتويات المسار", "Path contents"],
  back: ["ارجع للمسارات", "العودة إلى المسارات", "ارجع للمسارات", "Back to paths"],
  backPath: [
    "ارجع لتعريف المسار",
    "العودة إلى تعريف المسار",
    "ارجع لتعريف المسار",
    "Back to path overview",
  ],
  steps: ["خطوة", "خطوة", "خطوة", "steps"],
  stations: ["محطة", "محطة", "محطة", "stations"],
  station: ["محطة", "محطة", "محطة", "Station"],
  step: ["الخطوة", "الخطوة", "الخطوة", "Step"],
  path: ["مسار", "مسار", "مسار", "Path"],
  retry: ["جرّب تاني", "إعادة المحاولة", "جرّب مرة ثانية", "Retry"],
} satisfies Record<string, Text>;

export function getPathStoryCopy(locale: SupportedLocale) {
  return Object.fromEntries(
    Object.entries(story).map(([key, text]) => [key, localizePathText(text, locale)]),
  ) as Record<keyof typeof story, string>;
}

const definitions: Record<
  LearningLine,
  { title: Text; intro: Text; goals: Text; audience: Text; requirements: Text }
> = {
  ai: {
    title: [
      "الذكاء الاصطناعي بالتطبيق مش بالكلام",
      "الذكاء الاصطناعي بالتطبيق لا بالكلام",
      "الذكاء الاصطناعي بالتطبيق مو بالكلام",
      "AI through practice, not just talk",
    ],
    intro: [
      "من أول فهم للذكاء الاصطناعي لاستخدامه في الأعمال والمحتوى والتحليل والأتمتة وبناء المنتجات.",
      "من فهم الذكاء الاصطناعي إلى تطبيقه في الأعمال والمحتوى والتحليل والأتمتة وبناء المنتجات.",
      "من فهم الذكاء الاصطناعي لتطبيقه في الأعمال والمحتوى والتحليل والأتمتة وبناء المنتجات.",
      "From understanding AI to using it in business, content, analysis, automation and building products.",
    ],
    goals: [
      "تبدأ بالمقدمة، وبعدها تختار من خمس محطات: الأعمال، المحتوى، التحليل، الأتمتة والبناء.",
      "تبدأ بالمقدمة، ثم تستكشف خمس محطات: الأعمال والمحتوى والتحليل والأتمتة والبناء.",
      "تبدأ بالمقدمة، وبعدها تختار من خمس محطات: الأعمال والمحتوى والتحليل والأتمتة والبناء.",
      "Start with the introduction, then explore five stations: business, content, analysis, automation and building.",
    ],
    audience: [
      "للكبار اللي عايزين يفهموا AI ويطبّقوه في حياتهم وشغلهم.",
      "للكبار الراغبين في فهم الذكاء الاصطناعي وتطبيقه في حياتهم وأعمالهم.",
      "للكبار اللي يبغون يفهمون AI ويطبّقونه في حياتهم وشغلهم.",
      "Adults who want to understand AI and apply it in life and work.",
    ],
    requirements: [
      "حساب مسارات واحد. الباقة اللي تختارها بتحدد خطواتك المتاحة؛ محطة البناء ضمن Pro Plus.",
      "حساب مسارات موحّد. تحدد باقتك الخطوات المتاحة؛ محطة البناء مشمولة في Pro Plus.",
      "حساب مسارات واحد. باقتك تحدد الخطوات المتاحة لك؛ محطة البناء ضمن Pro Plus.",
      "One Masaarat account. Your plan determines access; the building station is included in Pro Plus.",
    ],
  },
  kids: {
    title: [
      "الأطفال {ages} سنة",
      "الأطفال من {ages} سنة",
      "الأطفال من {ages} سنة",
      "Kids ages {ages}",
    ],
    intro: [
      "مسار مناسب لعمر طفلك، يتعلّم فيه الذكاء الاصطناعي بالفهم والتجربة، وإنت متابع معاه.",
      "مسار لتعلّم الذكاء الاصطناعي يناسب عمر الطفل، ويجمع الفهم والتجربة بمشاركة وليّ الأمر.",
      "مسار يناسب عمر طفلك، يتعلّم فيه الذكاء الاصطناعي بالفهم والتجربة مع متابعتك.",
      "An age-appropriate AI path combining understanding and exploration, with a parent involved.",
    ],
    goals: [
      "١٢ خطوة تعليمية بعناوينها ومحتواها المناسب للعمر، فيها شرح وتجربة وتحديات بسيطة.",
      "اثنتا عشرة خطوة تعليمية بمحتوى مناسب للعمر، تجمع الشرح والتجربة والتحديات.",
      "١٢ خطوة تعليمية بمحتوى يناسب العمر، فيها شرح وتجربة وتحديات بسيطة.",
      "Twelve age-appropriate learning steps with explanations, exploration and challenges.",
    ],
    audience: [
      "للأطفال في الفئة العمرية {ages} سنة، بمتابعة وليّ الأمر.",
      "للأطفال في الفئة العمرية {ages} سنة، بإشراف وليّ الأمر.",
      "للأطفال بعمر {ages} سنة، مع متابعة وليّ الأمر.",
      "Children ages {ages}, with parental involvement.",
    ],
    requirements: [
      "وليّ الأمر يدخل بحساب مسارات، يوافق على سياسة الأطفال ويختار ملف الطفل المناسب. الوصول المدفوع محتاج باقة Kids مستقلة.",
      "يدخل وليّ الأمر بحساب مسارات، ويوافق على سياسة الأطفال ويختار ملف الطفل المناسب. يتطلب المحتوى المدفوع باقة Kids مستقلة.",
      "وليّ الأمر يدخل بحساب مسارات، ويوافق على سياسة الأطفال ويختار ملف الطفل المناسب. المحتوى المدفوع يحتاج باقة Kids مستقلة.",
      "A parent signs in, accepts the children's policy and selects the appropriate child profile. Paid content requires an independent Kids plan.",
    ],
  },
  technical: {
    title: [
      "النجارة وصناعة الأثاث",
      "النجارة وصناعة الأثاث",
      "النجارة وصناعة الأثاث",
      "Carpentry and furniture making",
    ],
    intro: [
      "من فهم طلب العميل والتصميم، لتخطيط تصنيع الأثاث وتركيبه ومراجعة الجودة.",
      "من تحليل طلب العميل والتصميم إلى تخطيط تصنيع الأثاث وتركيبه ومراجعة الجودة.",
      "من فهم طلب العميل والتصميم، لتخطيط تصنيع الأثاث وتركيبه ومراجعة الجودة.",
      "From understanding a client's brief and designing furniture to planning fabrication, installation and quality checks.",
    ],
    goals: [
      "٨٠ خطوة في ٢١ محطة، متجمّعة في سبعة أقسام. تتعلّم الأساس المشترك وتطبّقه على أنواع الأثاث المختلفة.",
      "ثمانون خطوة في إحدى وعشرين محطة ضمن سبعة أقسام؛ تتعلّم الأساس المشترك وتطبّقه على أنواع الأثاث المختلفة.",
      "٨٠ خطوة في ٢١ محطة ضمن سبعة أقسام. تتعلّم الأساس المشترك وتطبّقه على أنواع الأثاث المختلفة.",
      "Eighty steps across 21 stations, grouped under seven section headings. Learn shared foundations and apply them across furniture types.",
    ],
    audience: [
      "للمبتدئ اللي عايز يتعلّم صناعة الأثاث، ولصاحب الخبرة اللي عايز يرتّب معلوماته ويطوّر شغله.",
      "للمبتدئين في صناعة الأثاث ولأصحاب الخبرة الراغبين في تنظيم معارفهم وتطوير ممارساتهم.",
      "للمبتدئ اللي يبغى يتعلّم صناعة الأثاث، ولصاحب الخبرة اللي يبغى يرتّب معرفته ويطوّر شغله.",
      "Beginners in furniture making and experienced makers organising their knowledge and improving their practice.",
    ],
    requirements: [
      "ابدأ بالأساس المشترك واتبع متطلبات التطبيق الموضحة في كل خطوة. باقة التعليم الفني مستقلة.",
      "ابدأ بالأساس المشترك واتبع متطلبات التطبيق الموضحة في كل خطوة. باقة التعليم الفني مستقلة.",
      "ابدأ بالأساس المشترك واتبع متطلبات التطبيق بكل خطوة. باقة التعليم الفني مستقلة.",
      "Begin with the shared foundations and follow each step's practice requirements. The technical education plan is independent.",
    ],
  },
  academic: {
    title: [
      "أساسيات إدارة الأعمال وبناء المشروعات",
      "أساسيات إدارة الأعمال وبناء المشروعات",
      "أساسيات إدارة الأعمال وبناء المشروعات",
      "Business foundations and building a venture",
    ],
    intro: [
      "تعلّم إدارة الأعمال من فهم المنشأة والقيادة، لتطوير فكرة مشروع وتجهيزها للتشغيل وإدارتها.",
      "تعلّم إدارة الأعمال، من فهم المنشأة والقيادة إلى تطوير فكرة مشروع وتجهيزها للتشغيل وإدارتها.",
      "تعلّم إدارة الأعمال من فهم المنشأة والقيادة، لتطوير فكرة مشروع وتجهيزها للتشغيل وإدارتها.",
      "Explore business management, from understanding organisations and leadership to developing, preparing and managing a venture.",
    ],
    goals: [
      "٤٠ خطوة في سبع محطات، تجمع الشرح والأمثلة والتطبيق والاختبار.",
      "أربعون خطوة في سبع محطات، تجمع الشرح والأمثلة والتطبيق والتقييم.",
      "٤٠ خطوة في سبع محطات، تجمع الشرح والأمثلة والتطبيق والاختبار.",
      "Forty steps across seven stations, combining explanations, examples, practice and assessment.",
    ],
    audience: [
      "للي عايز يبني أساس في إدارة الأعمال أو يفهم إزاي يخطط لمشروع ويديره.",
      "للراغبين في بناء أساس في إدارة الأعمال وفهم تخطيط المشروعات وإدارتها.",
      "للي يبغى يبني أساس في إدارة الأعمال أو يفهم كيف يخطط لمشروع ويديره.",
      "Learners building a foundation in business management and understanding how to plan and run a venture.",
    ],
    requirements: [
      "حساب مسارات واحد، وباقة أكاديمي مستقلة للوصول للمحتوى المدفوع.",
      "حساب مسارات موحّد، وباقة أكاديمي مستقلة للوصول إلى المحتوى المدفوع.",
      "حساب مسارات واحد، وباقة أكاديمي مستقلة للمحتوى المدفوع.",
      "One Masaarat account, with an independent Academic plan for paid content.",
    ],
  },
};

export function getPathDefinition(line: LearningLine, locale: SupportedLocale, ages = "") {
  const c = getPathStoryCopy(locale);
  const definition = Object.fromEntries(
    Object.entries(definitions[line]).map(([key, text]) => [
      key,
      localizePathText(text, locale).replaceAll("{ages}", ages),
    ]),
  ) as Record<keyof typeof definitions.ai, string>;
  return { ...definition, title: `${c.path} ${definition.title}` };
}
