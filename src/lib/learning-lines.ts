import type { SupportedLocale } from "@/lib/locale/types";

export type LearningLine = "ai" | "kids" | "technical" | "academic";
export const LEARNING_LINES = ["ai", "kids", "technical", "academic"] as const;
export const LINE_ROUTES = {
  ai: "/ai",
  kids: "/kids",
  academic: "/academic",
  technical: "/technical",
} as const;
export const LINE_PRICING = {
  ai: "/pricing",
  kids: "/kids/pricing",
  technical: "/technical/pricing",
  academic: "/academic/pricing",
} as const;
export const LINE_CURRICULUM = {
  ai: "/curriculum",
  kids: "/kids/curriculum",
  technical: "/technical/curriculum",
  academic: "/academic/curriculum",
} as const;
export const LINE_LOGOS = {
  ai: "/brand/masaarat-ai.png",
  kids: "/brand/masaarat-kids.png",
  technical: "/brand/masaarat-tech.png",
  academic: "/brand/masaarat-academic.png",
} as const;

export function learningLineForPath(path: string): LearningLine | null {
  if (path === "/academic" || path.startsWith("/academic/")) return "academic";
  if (path === "/kids" || path.startsWith("/kids/")) return "kids";
  if (path === "/technical" || path.startsWith("/technical/")) return "technical";
  if (
    [
      "/ai",
      "/pricing",
      "/curriculum",
      "/dashboard",
      "/analytics",
      "/ai-assistant",
      "/intro",
    ].includes(path) ||
    path.startsWith("/learn/") ||
    path.startsWith("/mission/") ||
    path.startsWith("/intro/")
  )
    return "ai";
  return null;
}

const copy = {
  platformTitle: [
    "مسارات: تعليم يفتح لك طرق جديدة",
    "مسارات: تعليم يفتح آفاقًا جديدة",
    "مسارات: تعلّم يفتح لك آفاق جديدة",
    "Masaarat: learning that opens new paths",
  ],
  platformIntro: [
    "AI، وتعليم للأطفال، ومهارات مهنية. اختار الطريق اللي يناسبك وابدأ تتعلم بالتطبيق، بحساب واحد لكل مساراتك.",
    "الذكاء الاصطناعي، وتعليم الأطفال، والمهارات المهنية. اختر المجال المناسب لك وتعلّم بالتطبيق، بحساب موحّد لجميع مساراتك.",
    "ذكاء اصطناعي، وتعليم للأطفال، ومهارات مهنية. اختر المجال اللي يناسبك وتعلّم بالتطبيق، بحساب واحد لكل مساراتك.",
    "AI, learning for children and vocational skills. Choose your direction and learn through practice, with one account across Masaarat.",
  ],
  eyebrow: [
    "منصة تعليمية متكاملة",
    "منصة تعليمية متكاملة",
    "منصة تعليمية متكاملة",
    "An integrated learning platform",
  ],
  choose: [
    "اختار مجال تعلّمك",
    "اختر مجال تعلّمك",
    "اختر مجال تعلّمك",
    "Choose your learning direction",
  ],
  enter: ["اكتشف المسار", "اكتشف المسار", "اكتشف المسار", "Explore this line"],
  switch: ["غيّر مجال التعلّم", "تبديل مجال التعلّم", "غيّر مجال التعلّم", "Switch learning line"],
  about: ["عن مسارات", "عن مسارات", "عن مسارات", "About Masaarat"],
  home: ["مسارات الرئيسية", "مسارات الرئيسية", "مسارات الرئيسية", "Masaarat home"],
  learning: ["تعلّمي", "تعلّمي", "تعلّمي", "My learning"],
  adminTools: [
    "أدوات الإدارة الإضافية",
    "أدوات الإدارة الإضافية",
    "أدوات الإدارة الإضافية",
    "More admin tools",
  ],
  overview: ["عن المجال", "عن المجال", "عن المجال", "Overview"],
  plans: ["الباقات", "الباقات", "الباقات", "Plans"],
  paths: ["المنهج", "المنهج", "المنهج", "Curriculum"],
  ai: ["الذكاء الاصطناعي", "الذكاء الاصطناعي", "الذكاء الاصطناعي", "Artificial intelligence"],
  kids: ["مسارات كيدز", "مسارات كيدز", "مسارات كيدز", "Masaarat Kids"],
  technical: ["التعليم المهني", "التعليم المهني", "التعليم المهني", "Vocational learning"],
  academic: ["مسارات أكاديمي", "مسارات أكاديمي", "مسارات أكاديمي", "Masaarat Academic"],
  academicIntro: [
    "مقررات عملية في إدارة الأعمال، فيها شرح وأمثلة وتطبيقات، باشتراك مستقل في حسابك نفسه.",
    "مقررات تطبيقية في إدارة الأعمال، تضم الشرح والأمثلة والتطبيقات، باشتراك مستقل ضمن حسابك الموحد.",
    "مقررات عملية في إدارة الأعمال، فيها شرح وأمثلة وتطبيقات، باشتراك مستقل ضمن حسابك نفسه.",
    "Practical business courses with explanations, examples and activities, with an independent subscription in your shared account.",
  ],
  aiIntro: [
    "من فهم AI لاستخدامه في شغلك، وتحليل البيانات، وتشغيل الأنظمة وبناء المنتجات. مسارات عملية للكبار، تبدأ من الأساسيات وتكبر مع هدفك.",
    "من فهم الذكاء الاصطناعي إلى استخدامه في العمل وتحليل البيانات وتشغيل الأنظمة وبناء المنتجات. مسارات تطبيقية للكبار تبدأ بالأساسيات وتتدرج وفق أهدافك.",
    "من فهم الذكاء الاصطناعي لاستخدامه في شغلك، وتحليل البيانات وتشغيل الأنظمة وبناء المنتجات. مسارات عملية للكبار تبدأ بالأساسيات وتتدرّج مع أهدافك.",
    "Understand AI, use it at work, analyse data, operate systems and build products. Practical adult learning paths, from foundations to your chosen goal.",
  ],
  kidsIntro: [
    "تعلّم AI للأطفال بشكل مناسب لعمرهم، بمتابعة وليّ الأمر. مستويات عمرية، دروس وتطبيقات، وحساب العيلة في مكان واحد.",
    "تعلّم الذكاء الاصطناعي للأطفال بمحتوى مناسب لأعمارهم وإشراف وليّ الأمر. مستويات عمرية ودروس وتطبيقات، مع إدارة الأسرة من حساب موحّد.",
    "تعلّم الذكاء الاصطناعي للأطفال بمحتوى يناسب أعمارهم ومتابعة وليّ الأمر. مستويات عمرية ودروس وتطبيقات، وإدارة العائلة من حساب واحد.",
    "Age-appropriate AI learning for children, guided by a parent. Age levels, lessons and practical activities, with family management in one account.",
  ],
  technicalIntro: [
    "مجال للمهارات المهنية، يبدأ بمسار النجارة وصناعة الأثاث: من فهم الاحتياج والتصميم لتخطيط التصنيع والتركيب. مسارات مهنية تانية هتنضاف بعد كده.",
    "مجال للمهارات المهنية يبدأ بمسار النجارة وصناعة الأثاث، من تحليل الاحتياج والتصميم إلى تخطيط التصنيع والتركيب. ستُضاف مسارات مهنية أخرى لاحقًا.",
    "مجال للمهارات المهنية، يبدأ بمسار النجارة وصناعة الأثاث: من فهم الاحتياج والتصميم لتخطيط التصنيع والتركيب. مسارات مهنية ثانية بتنضاف لاحقًا.",
    "A vocational learning area, starting with carpentry and furniture making: from requirements and design to production and installation planning. More vocational paths will follow.",
  ],
  shared: [
    "حساب واحد. واختيارك هو اللي يحدد رحلتك.",
    "حساب موحّد، ورحلة تعلّم تختارها بنفسك.",
    "حساب واحد، ورحلة تعلّم تختارها بنفسك.",
    "One account. A learning journey you choose.",
  ],
  separate: [
    "لكل مجال باقاته ومحتواه. التنقّل بين المجالات ما بيغيّرش اشتراكاتك.",
    "لكل مجال باقاته ومحتواه. التنقّل بين المجالات لا يغيّر اشتراكاتك.",
    "لكل مجال باقاته ومحتواه. التنقّل بين المجالات ما يغيّر اشتراكاتك.",
    "Each line has its own plans and content. Switching lines does not change your subscriptions.",
  ],
  audience: ["المجال ده لمين؟", "لمن هذا المجال؟", "هذا المجال لمين؟", "Who is this for?"],
  aiAudience: [
    "للكبار اللي عايزين يفهموا AI ويطبقوه في شغلهم أو يبنوا بيه أنظمة ومنتجات.",
    "للكبار الراغبين في فهم الذكاء الاصطناعي وتطبيقه في أعمالهم أو بناء الأنظمة والمنتجات.",
    "للكبار اللي يبغون يفهمون الذكاء الاصطناعي ويطبّقونه في أعمالهم أو يبنون أنظمة ومنتجات.",
    "Adults who want to understand AI, apply it at work or build systems and products.",
  ],
  technicalAudience: [
    "للمبتدئ اللي عايز يتعلم حرفة، وللي عنده خبرة وعايز يرتّب معلوماته ويطوّر شغله.",
    "للمبتدئين الراغبين في تعلّم حرفة، ولأصحاب الخبرة الساعين إلى تنظيم معارفهم وتطوير ممارساتهم.",
    "للمبتدئ اللي يبغى يتعلّم حرفة، ولصاحب الخبرة اللي يبغى يرتّب معرفته ويطوّر شغله.",
    "Beginners learning a trade and experienced makers who want to organise their knowledge and improve their practice.",
  ],
  furniture: [
    "النجارة وصناعة الأثاث",
    "النجارة وصناعة الأثاث",
    "النجارة وصناعة الأثاث",
    "Carpentry and furniture making",
  ],
  preparing: [
    "مسار النجارة وصناعة الأثاث متاح",
    "مسار النجارة وصناعة الأثاث متاح",
    "مسار النجارة وصناعة الأثاث متاح",
    "Carpentry and furniture learning is available",
  ],
  preparingIntro: [
    "اختار الدرس من المنهج. حساب واحد، وتقدمك بيتحفظ فيه.",
    "اختر الدرس من المنهج، مع حفظ تقدمك في حسابك الموحد.",
    "اختر الدرس من المنهج، وتقدمك ينحفظ في حسابك.",
    "Choose a lesson from the curriculum. Your progress is saved to your unified account.",
  ],
  technicalPrice: [
    "باقة التعليم المهني بنفس سعر Pro Plus، واشتراكها مستقل.",
    "باقة التعليم المهني بسعر Pro Plus، مع اشتراك مستقل.",
    "باقة التعليم المهني بنفس سعر Pro Plus، واشتراكها مستقل.",
    "The vocational plan is priced at the same rate as Pro Plus, with an independent subscription.",
  ],
  unavailable: [
    "موعد فتح الاشتراك هيتعلن لاحقًا",
    "سيُعلن موعد إتاحة الاشتراك لاحقًا",
    "موعد إتاحة الاشتراك بيُعلن لاحقًا",
    "Enrolment availability will be announced",
  ],
  firstTechnicalTrack: [
    "أول مسار في التعليم المهني",
    "أول مسار في التعليم المهني",
    "أول مسار في التعليم المهني",
    "The first vocational learning path",
  ],
  trackOutline: [
    "محاور مسار النجارة وصناعة الأثاث",
    "محاور مسار النجارة و��ناعة الأثاث",
    "محاور مسار النجارة وصناعة الأثاث",
    "Carpentry and furniture curriculum",
  ],
  futureTracks: [
    "النجارة وصناعة الأثاث مسار واحد جوّه التعليم المهني. مسارات تانية هتنضاف بعد كده.",
    "النجارة وصناعة الأثاث مسار ضمن التعليم المهني. ستُضاف مسارات أخرى لاحقًا.",
    "النجارة وصناعة الأثاث مسار ضمن التعليم المهني. مسارات ثانية بتنضاف لاحقًا.",
    "Carpentry and furniture making is one path within vocational learning. More paths will be added later.",
  ],
  catalogLoading: [
    "جارٍ تحميل عناوين الدروس",
    "جارٍ تحميل عناوين الدروس",
    "جارٍ تحميل عناوين الدروس",
    "Loading lesson titles",
  ],
  catalogUnavailable: [
    "عناوين الدروس مش متاحة دلوقتي. جرّب تحديث الصفحة.",
    "عناوين الدروس غير متاحة حاليًا. حاول تحديث الصفحة.",
    "عناوين الدروس مو متاحة الحين. جرّب تحديث الصفحة.",
    "Lesson titles are currently unavailable. Try refreshing the page.",
  ],
  lessonLabel: ["درس", "درسًا", "درس", "lessons"],
  moduleLabel: ["وحدة تعليمية", "وحدة تعليمية", "وحدة تعليمية", "modules"],
  aboutIntro: [
    "مسارات بتجمع تعليم الذكاء الاصطناعي وتعليم الأطفال والتعليم المهني في منصة واحدة. كل مجال له طريقه ومحتواه وباقاته، والتعلّم مبني على الفهم والتطبيق.",
    "تجمع مسارات تعليم الذكاء الاصطناعي وتعليم الأطفال والتعليم المهني في منصة واحدة. لكل مجال مساراته ومحتواه وباقاته، ضمن منهج يربط الفهم بالتطبيق.",
    "مسارات تجمع تعليم الذكاء الاصطناعي وتعليم الأطفال والتعليم المهني في منصة واحدة. كل مجال له مساراته ومحتواه وباقاته، والتعلّم يربط الفهم بالتطبيق.",
    "Masaarat brings AI education, learning for children and vocational education into one platform. Each line has its own paths, content and plans, connecting understanding with practice.",
  ],
  continueAI: [
    "كمّل تعلّم AI",
    "تابع تعلّم الذكاء الاصطناعي",
    "كمّل تعلّم الذكاء الاصطناعي",
    "Continue AI learning",
  ],
  family: [
    "إدارة العيلة وتعلّم الأطفال",
    "إدارة الأسرة وتعلّم الأطفال",
    "إدارة العائلة وتعلّم الأطفال",
    "Family and children's learning",
  ],
} as const;
export function getLineCopy(locale: SupportedLocale) {
  const index = ({ "ar-EG": 0, "ar-MSA": 1, "ar-Gulf": 2, en: 3 } as const)[locale];
  return Object.fromEntries(
    Object.entries(copy).map(([key, values]) => [key, values[index]]),
  ) as Record<keyof typeof copy, string>;
}
export function lineMeta(
  locale: SupportedLocale,
  kind:
    | LearningLine
    | "platform"
    | "about"
    | "kidsPricing"
    | "technicalPricing"
    | "academicPricing"
    | "kidsCurriculum"
    | "technicalCurriculum",
) {
  const c = getLineCopy(locale);
  const path = {
    platform: "/",
    ai: "/ai",
    kids: "/kids",
    academic: "/academic",
    technical: "/technical",
    about: "/about",
    kidsPricing: "/kids/pricing",
    technicalPricing: "/technical/pricing",
    academicPricing: "/academic/pricing",
    kidsCurriculum: "/kids/curriculum",
    technicalCurriculum: "/technical/curriculum",
  }[kind];
  const title =
    kind === "kidsCurriculum" || kind === "technicalCurriculum"
      ? `${kind === "kidsCurriculum" ? c.kids : c.technical} — ${c.paths}`
      : kind === "platform"
        ? c.platformTitle
        : kind === "about"
          ? c.about
          : kind === "kidsPricing"
            ? `${c.kids} — ${c.plans}`
            : kind === "academicPricing"
              ? `${c.academic} — ${c.plans}`
              : kind === "technicalPricing"
                ? `${c.technical} — ${c.plans}`
                : c[kind];
  const description =
    kind === "platform"
      ? c.platformIntro
      : kind === "about"
        ? c.aboutIntro
        : kind.startsWith("kids")
          ? c.kidsIntro
          : kind.startsWith("academic")
            ? c.academicIntro
            : kind.startsWith("technical")
              ? c.technicalIntro
              : c.aiIntro;
  const url = `https://masaarat.ai${path}`;
  return {
    meta: [
      { title: `${title} | Masaarat` },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}
