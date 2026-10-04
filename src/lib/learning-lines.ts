import type { SupportedLocale } from "@/lib/locale/types";

export type LearningLine = "ai" | "kids" | "technical";
export const LEARNING_LINES = ["ai", "kids", "technical"] as const;
export const LINE_ROUTES = { ai: "/ai", kids: "/kids", technical: "/technical" } as const;
export const LINE_PRICING = {
  ai: "/pricing",
  kids: "/kids/pricing",
  technical: "/technical/pricing",
} as const;
export const LINE_LOGOS = {
  ai: "/brand/masaarat-ai.png",
  kids: "/brand/masaarat-kids.png",
  technical: "/brand/masaarat-tech.png",
} as const;

export function learningLineForPath(path: string): LearningLine | null {
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
  overview: ["عن المجال", "عن المجال", "عن المجال", "Overview"],
  plans: ["الباقات", "الباقات", "الباقات", "Plans"],
  paths: ["المسارات", "المسارات", "المسارات", "Learning paths"],
  ai: ["الذكاء الاصطناعي", "الذكاء الاصطناعي", "الذكاء الاصطناعي", "Artificial intelligence"],
  kids: ["مسارات كيدز", "مسارات كيدز", "مسارات كيدز", "Masaarat Kids"],
  technical: ["التعليم المهني", "التعليم المهني", "التعليم المهني", "Vocational learning"],
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
    "مهارات مهنية تتعلمها خطوة بخطوة، من الأساسيات للتطبيق العملي. البداية مع النجارة وصناعة الأثاث، من فهم الخامات والأدوات لتخطيط وتنفيذ الشغل.",
    "مهارات مهنية تُكتسب تدريجيًا من الأساسيات إلى التطبيق العملي. البداية مع النجارة وصناعة الأثاث، من فهم المواد والأدوات إلى تخطيط العمل وتنفيذه.",
    "مهارات مهنية تتعلّمها خطوة بخطوة، من الأساسيات للتطبيق العملي. البداية مع النجارة وصناعة الأثاث، من فهم الخامات والأدوات إلى تخطيط العمل وتنفيذه.",
    "Build vocational skills step by step, from foundations to practical work. Starting with carpentry and furniture making: materials, tools, planning and execution.",
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
    "المسار بيتجهّز",
    "المسار قيد الإعداد",
    "المسار قيد التجهيز",
    "This path is being prepared",
  ],
  preparingIntro: [
    "بنجهّز رحلة من الصفر للاحتراف: شرح وتطبيقات وصور واختبارات. الدروس والاشتراك هيتاحوا بعد اكتمال تجهيز المسار.",
    "يجري إعداد رحلة من الأساسيات إلى الاحتراف، تضم شروحًا وتطبيقات وصورًا واختبارات. ستتاح الدروس والاشتراك بعد اكتمال إعداد المسار.",
    "نجهّز رحلة من الأساسيات للاحتراف، فيها شرح وتطبيقات وصور واختبارات. الدروس والاشتراك تتاح بعد اكتمال تجهيز المسار.",
    "A journey from foundations to professional practice is being prepared, with explanations, activities, visuals and quizzes. Lessons and enrolment will open when the path is ready.",
  ],
  technicalPrice: [
    "باقة التعليم المهني بنفس سعر Pro Plus، واشتراكها مستقل.",
    "باقة التعليم المهني بسعر Pro Plus، مع اشتراك مستقل.",
    "باقة التعليم المهني بنفس سعر Pro Plus، واشتراكها مستقل.",
    "The vocational plan is priced at the same rate as Pro Plus, with an independent subscription.",
  ],
  unavailable: [
    "الاشتراك متاح بعد تجهيز المسار",
    "يتاح الاشتراك بعد اكتمال المسار",
    "الاشتراك يتاح بعد تجهيز المسار",
    "Enrolment opens when the path is ready",
  ],
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
  kind: LearningLine | "platform" | "about" | "kidsPricing" | "technicalPricing",
) {
  const c = getLineCopy(locale);
  const path = {
    platform: "/",
    ai: "/ai",
    kids: "/kids",
    technical: "/technical",
    about: "/about",
    kidsPricing: "/kids/pricing",
    technicalPricing: "/technical/pricing",
  }[kind];
  const title =
    kind === "platform"
      ? c.platformTitle
      : kind === "about"
        ? c.about
        : kind === "kidsPricing"
          ? `${c.kids} — ${c.plans}`
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
