import type { LucideIcon } from "lucide-react";
import {
  Hammer,
  Palette,
  Workflow,
  BarChart3,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { INTRO_LESSON_CONTENT } from "@/components/intro/lessons";

/* -------------------------------------------------------------- */
/*  Curriculum architecture — paths → modules → lessons           */
/* -------------------------------------------------------------- */

export type PathId =
  | "intro"
  | "builder"
  | "creator"
  | "automator"
  | "analyst"
  | "business";
export type LessonState = "available" | "coming-soon";

export interface CurriculumLesson {
  /** order within the module (1-based) */
  order: number;
  /** stable id used by the lesson engine when available */
  id: string;
  title: string;
  state: LessonState;
  /** route to navigate to — only set when state === "available" */
  route?: string;
}

export interface CurriculumModule {
  order: number;
  id: string;
  title: string;
  subtitle?: string;
  /** "technical" = module dives into code/JWT/RLS/embeddings → show "تقني — للمتقدمين" badge */
  level?: "technical";
  lessons: CurriculumLesson[];
}

export type PathTier = "user" | "operator" | "builder";

export interface CurriculumPath {
  id: PathId;
  title: string;
  tagline: string;
  icon: LucideIcon;
  accent: "primary" | "accent" | "secondary" | "business";
  status: "open" | "soon";
  /** marks the soft onboarding block before the real paths start. */
  kind?: "intro" | "path";
  /** Three-tier positioning (v14):
   *  user     = استخدام AI في الشغل (80% من السوق)
   *  operator = أتمتة متقدمة + RAG + agents
   *  builder  = بناء منتجات AI كاملة (تقني، اختياري) */
  tier?: PathTier;
  /** route for the path overview page (when it exists) */
  route?: string;
  modules: CurriculumModule[];
}


/* -------------------------------------------------------------- */
/*  Helpers                                                       */
/* -------------------------------------------------------------- */

const lesson = (
  order: number,
  id: string,
  title: string,
  state: LessonState = "coming-soon",
  route?: string,
): CurriculumLesson => ({ order, id, title, state, route });

/** All shipped lesson ids — sourced from the new block-based system. */
const INTRO_SHIPPED = new Set(Object.keys(INTRO_LESSON_CONTENT));

/**
 * Unified shipped-lesson builder. Every shipped lesson routes to the
 * single dynamic lesson page `/learn/{pathId}/{slug}`.
 * The slug equals the lesson id (which matches the INTRO_LESSON_CONTENT key).
 */
const shipped = (pathId: PathId) =>
  (order: number, id: string, title: string): CurriculumLesson =>
    INTRO_SHIPPED.has(id)
      ? lesson(order, id, title, "available", `/learn/${pathId}/${id}`)
      : lesson(order, id, title, "coming-soon");

const shippedLesson = shipped("intro");
const builderShipped = shipped("builder");
const automatorShipped = shipped("automator");
const analystShipped = shipped("analyst");
const businessShipped = shipped("business");

/* Creator-specific modules — real curriculum, not a Builder clone. */
function creatorModules(): CurriculumModule[] {
  return [
    {
      order: 1,
      id: "creator-m1",
      title: "Content Thinking",
      subtitle: "المحتوى كنظام تأثير — مش مجرد نشر.",
      lessons: [
        lesson(
          1,
          "creator-m1-why-content",
          "ليه المحتوى مش Posting؟",
          "available",
          "/learn/creator/creator-m1-why-content",
        ),
        lesson(
          2,
          "creator-m1-attention-economy",
          "إيه هو اقتصاد الانتباه؟",
          "available",
          "/learn/creator/creator-m1-attention-economy",
        ),
      ],
    },
    {
      order: 2,
      id: "creator-m2",
      title: "Audience & Pillars",
      subtitle: "اعرف جمهورك واختار ٣ محاور محتوى ثابتة.",
      lessons: [
        lesson(
          1,
          "creator-m3-know-audience",
          "اعرف جمهورك فعلًا",
          "available",
          "/learn/creator/creator-m3-know-audience",
        ),
        lesson(
          2,
          "creator-m3-content-pillars",
          "اختار ٣ Pillars",
          "available",
          "/learn/creator/creator-m3-content-pillars",
        ),
      ],
    },
    {
      order: 3,
      id: "creator-m3",
      title: "Hook & Script",
      subtitle: "أول ٣ ثواني + بنية الفيديو الناجح (Hook→Problem→Proof→CTA).",
      lessons: [
        lesson(
          1,
          "creator-m2-hook",
          "Hook: أول ٣ ثواني",
          "available",
          "/learn/creator/creator-m2-hook",
        ),
        lesson(
          2,
          "creator-m2-script-structure",
          "بنية السكريبت الكاملة",
          "available",
          "/learn/creator/creator-m2-script-structure",
        ),
        lesson(
          3,
          "creator-m2-cta",
          "CTA: ازاي تخلّي المتفرّج يتحرّك",
          "available",
          "/learn/creator/creator-m2-cta",
        ),
      ],
    },
    {
      order: 4,
      id: "creator-m4",
      title: "Production — صوّر واكتب",
      subtitle: "Reality Check → التصوير بالموبايل → AI كمساعد كتابة.",
      lessons: [
        lesson(
          1,
          "creator-m4-reality-check",
          "Reality Check",
          "available",
          "/learn/creator/creator-m4-reality-check",
        ),
        lesson(
          2,
          "creator-m4-mobile-shooting",
          "التصوير بالموبايل",
          "available",
          "/learn/creator/creator-m4-mobile-shooting",
        ),
        lesson(
          3,
          "creator-m4-ai-writing",
          "AI كمساعد كتابة",
          "available",
          "/learn/creator/creator-m4-ai-writing",
        ),
      ],
    },
    {
      order: 5,
      id: "creator-m5-polish",
      title: "Polish — مونتاج وشكل خارجي",
      subtitle: "المونتاج + Thumbnails & Captions — اللمسة اللي بتخلّي المحتوى يلمع.",
      lessons: [
        lesson(
          1,
          "creator-m4-editing",
          "المونتاج — Cut, Caption, Pace",
          "available",
          "/learn/creator/creator-m4-editing",
        ),
        lesson(
          2,
          "creator-m4-thumbnails-captions",
          "Thumbnails & Captions",
          "available",
          "/learn/creator/creator-m4-thumbnails-captions",
        ),
      ],
    },
    {
      order: 6,
      id: "creator-m6-distribute",
      title: "Distribute & Measure",
      subtitle: "النشر والجدولة وقراءة الأرقام لجذب Leads حقيقية.",
      lessons: [
        lesson(1, "creator-m5-platforms", "اختيار المنصات", "available", "/learn/creator/creator-m5-platforms"),
        lesson(2, "creator-m5-scheduling", "الجدولة والاستمرارية", "available", "/learn/creator/creator-m5-scheduling"),
        lesson(3, "creator-m5-analytics", "قراءة Analytics بسيطة", "available", "/learn/creator/creator-m5-analytics"),
        lesson(4, "creator-m5-leads", "من Views لـ Leads", "available", "/learn/creator/creator-m5-leads"),
      ],
    },
    {
      order: 7,
      id: "creator-m7-identity",
      title: "Visual Identity",
      subtitle: "Brand بسيط + Grid موحّد = ثقة فورية للزائر الجديد.",
      lessons: [
        lesson(
          1,
          "creator-m6-brand-basics",
          "Brand Basics — Colors, Fonts, Logo",
          "available",
          "/learn/creator/creator-m6-brand-basics",
        ),
        lesson(
          2,
          "creator-m6-grid-consistency",
          "Grid Consistency على الـ Profile",
          "available",
          "/learn/creator/creator-m6-grid-consistency",
        ),
      ],
    },
  ];
}

/* -------------------------------------------------------------- */
/*  Builder — 9 modules (v2 structure, June 2026)                 */
/*  Lesson IDs follow {path}-m{N}-l{seq}-{slug} with l{seq}        */
/*  continuous 1..26 across the whole path.                       */
/*  M10 (deploy + first-users) is deferred per v2 scope.          */
/* -------------------------------------------------------------- */
function builderMilestones(): CurriculumModule[] {
  return [
    {
      order: 1,
      id: "builder-m1",
      title: "إيه هو الـ LLM؟",
      subtitle: "الموديل اللي ورا الـ AI، وإزاي بيتدرّب — الأساس قبل أي حاجة.",
      lessons: [
        builderShipped(1, "builder-m1-l1-what-is-llm", "إيه هو الـ LLM؟"),
        builderShipped(2, "builder-m1-l2-tokens-training", "Tokens والتدريب"),
      ],
    },
    {
      order: 2,
      id: "builder-m2",
      title: "Prompt: لغة الكلام مع AI",
      subtitle: "تشريح الـ Prompt — Instructions, Examples, Style.",
      lessons: [
        builderShipped(1, "builder-m2-l3-prompt-layer", "تشريح الـ Prompt"),
        builderShipped(2, "builder-m2-l4-instructions-examples", "Instructions vs Examples"),
        builderShipped(3, "builder-m2-l5-style-control", "Style & Tone"),
      ],
    },
    {
      order: 3,
      id: "builder-m3",
      title: "Context Window: ذاكرة الـ AI",
      subtitle: "ليه السياق أهم من السؤال + حدود الذاكرة.",
      lessons: [
        builderShipped(1, "builder-m3-l6-context-layer", "إيه السياق؟"),
        builderShipped(2, "builder-m3-l7-memory-limits", "حدود الذاكرة"),
      ],
    },
    {
      order: 4,
      id: "builder-m4",
      title: "Parameters: لوحة التحكم",
      subtitle: "Temperature, Top-p, Max tokens في درس واحد.",
      lessons: [
        builderShipped(1, "builder-m4-l8-parameters", "Parameters: Temperature + Top-p + Max tokens"),
      ],
    },
    {
      order: 5,
      id: "builder-m5",
      title: "إزاي التطبيق يشتغل فعلاً",
      subtitle: "Frontend · Backend · Database",
      level: "technical",
      lessons: [
        builderShipped(1, "builder-m5-l9-transition", "Transition — من اللغة للـ App"),
        builderShipped(2, "builder-m5-l10-frontend", "واجهة التطبيق (Frontend)"),
        builderShipped(3, "builder-m5-l11-backend-api", "كواليس التطبيق وساعي البريد"),
        builderShipped(4, "builder-m5-l12-database-intro", "المخزن الذكي (Database)"),
        builderShipped(5, "builder-m5-l12b-mini-win", "Mini-Win: شوف إنت فهمت إيه"),
      ],
    },
    {
      order: 6,
      id: "builder-m6",
      title: "تحويل الفكرة لتطبيق",
      subtitle: "Components · Routes · Debugging",
      level: "technical",
      lessons: [
        builderShipped(1, "builder-m6-l13-idea-to-page", "من فكرة لصفحة"),
        builderShipped(2, "builder-m6-l14-wireframe", "Wireframe — ارسم قبل ما تبني"),
        builderShipped(3, "builder-m6-l15-first-prompt-to-lovable", "أول Prompt لـ Lovable"),
        builderShipped(4, "builder-m6-l16-components-routes", "Components & Routes"),
        builderShipped(5, "builder-m6-l17-iteration", "Iteration Loop"),
        builderShipped(6, "builder-m6-l18-debugging", "لو الدنيا بازت — Debugging"),
      ],
    },
    {
      order: 7,
      id: "builder-m7",
      title: "إزاي التطبيق يفتكر وينظم البيانات",
      subtitle: "Tables · Relations · Queries",
      level: "technical",
      lessons: [
        builderShipped(1, "builder-m7-l19-tables-columns", "Tables & Columns"),
        builderShipped(2, "builder-m7-l20-relations", "Relations بين الجداول"),
        builderShipped(3, "builder-m7-l21-queries", "Queries: ازاي بتجيب البيانات"),
      ],
    },
    {
      order: 8,
      id: "builder-m8",
      title: "حماية التطبيق والصلاحيات",
      subtitle: "JWT · RLS",
      level: "technical",
      lessons: [
        builderShipped(1, "builder-m8-l22-sessions-jwt", "كارت الدخول (Sessions & JWT)"),
        builderShipped(2, "builder-m8-l23-rls", "الحارس الشخصي (RLS)"),
      ],
    },
    {
      order: 9,
      id: "builder-m9",
      title: "دلوقتي هنخلي التطبيق ذكي بجد",
      subtitle: "RAG · Embeddings · Agents",
      level: "technical",
      lessons: [
        builderShipped(1, "builder-m9-l24-rag", "AI يرد من ملفاتك (RAG)"),
        builderShipped(2, "builder-m9-l25-embeddings", "إزاي الـ AI بيلاقي المعلومة"),
        builderShipped(3, "builder-m9-l26-agents", "AI بياخد قرارات لوحده (Agents)"),
      ],
    },
  ];
}

/* Shared module template (mirrors Builder structure for every path). */
/* Automator — standalone automation path, NOT a Builder clone. */
function automatorModules(): CurriculumModule[] {
  return [
    {
      order: 0,
      id: "automator-m0",
      title: "أنت فين في الخريطة؟",
      subtitle: "ربط Builder + Creator باللي جاي — قبل ما تبدأ.",
      lessons: [
        automatorShipped(1, "automator-m0-where-you-are", "أنت فين في الخريطة؟"),
      ],
    },
    {
      order: 1,
      id: "automator-m1",
      title: "Systems Thinking",
      subtitle: "تشوف شغلك كـ نظام — Inputs، Processes، Outputs.",
      lessons: [
        automatorShipped(1, "automator-m1-systems-view", "كل شغل = System"),
        automatorShipped(2, "automator-m1-spot-patterns", "شوف الأنماط في يومك"),
        automatorShipped(3, "automator-m1-decide-what-to-automate", "قرّر إيه يتأتمت"),
      ],
    },
    {
      order: 2,
      id: "automator-m2",
      title: "Tools & Building Blocks",
      subtitle: "Make، n8n، Zapier + اللبنات الأساسية لأي Flow.",
      lessons: [
        automatorShipped(1, "automator-m2-tools-landscape", "Make vs n8n vs Zapier"),
        automatorShipped(2, "automator-m2-triggers-actions", "Triggers + Actions"),
        automatorShipped(3, "automator-m2-filters-routers", "Filters & Routers"),
      ],
    },
    {
      order: 3,
      id: "automator-m3",
      title: "Connecting Your Product",
      subtitle: "ربط منتج Builder بالعالم الخارجي — DB، APIs، Errors.",
      level: "technical",
      lessons: [
        automatorShipped(1, "automator-m3-connect-database", "وصّل الـ DB من Builder"),
        automatorShipped(2, "automator-m3-webhooks-api", "Webhooks & APIs"),
        automatorShipped(3, "automator-m3-error-handling", "Error Handling"),
      ],
    },
    {
      order: 4,
      id: "automator-m4",
      title: "AI-Powered Automation",
      subtitle: "LLMs، RAG، و Agents جوه الـ Flow — مش بس ChatGPT.",
      level: "technical",
      lessons: [
        automatorShipped(1, "automator-m4-llm-in-flow", "LLM جوه الـ Flow"),
        automatorShipped(2, "automator-m4-rag-in-n8n", "RAG جوه الـ Automation"),
        automatorShipped(3, "automator-m4-agents", "Agents بياخدوا قرارات"),
      ],
    },
    {
      order: 5,
      id: "automator-m5",
      title: "Customer Journey Automation",
      subtitle: "Leads من Creator → WhatsApp → CRM → Sales، كاملة.",
      lessons: [
        automatorShipped(1, "automator-m5-lead-capture", "استقبال Leads من Creator"),
        automatorShipped(2, "automator-m5-whatsapp-flow", "WhatsApp Flow ذكي"),
        automatorShipped(3, "automator-m5-follow-up", "المتابعة التلقائية + CRM"),
      ],
    },
    {
      order: 6,
      id: "automator-m6",
      title: "Closing the Loop",
      subtitle: "بياناتك جاهزة — Analyst بيستنّاك.",
      lessons: [
        automatorShipped(1, "automator-m6-closing-loop", "بياناتك جاهزة — اللي جاي"),
      ],
    },
  ];
}

/* Analyst — standalone analytics path. Connects: Automator → Analyst → Business */
function analystModules(): CurriculumModule[] {
  return [
    {
      order: 0,
      id: "analyst-m0",
      title: "أنت فين في الخريطة؟",
      subtitle: "ربط Automator باللي جاي — بياناتك جاهزة، دلوقتي بتسأل.",
      lessons: [
        analystShipped(1, "analyst-m0-from-automation-to-insight", "بياناتك جاهزة — دلوقتي بتسأل"),
      ],
    },
    {
      order: 1,
      id: "analyst-m1",
      title: "Analyst Thinking",
      subtitle: "حوّل الشعور لسؤال — والسؤال لقرار.",
      lessons: [
        analystShipped(1, "analyst-m1-feeling-to-question", "حوّل الشعور لسؤال"),
        analystShipped(2, "analyst-m1-right-question-rule", "السؤال الصح أهم من الإجابة"),
      ],
    },
    {
      order: 2,
      id: "analyst-m2",
      title: "جمع البيانات",
      subtitle: "٣ مصادر + AI كأداة تلخيص.",
      lessons: [
        analystShipped(1, "analyst-m2-three-sources", "المصادر الثلاثة"),
        analystShipped(2, "analyst-m2-ai-summarization", "AI = أسرع محلّل عندك"),
      ],
    },
    {
      order: 3,
      id: "analyst-m3",
      title: "تفسير البيانات",
      subtitle: "Patterns vs Outliers — وكل تفسير ينتهي بقرار.",
      lessons: [
        analystShipped(1, "analyst-m3-pattern-vs-outlier", "Pattern أم Outlier؟"),
        analystShipped(2, "analyst-m3-decision-rule", "كل تفسير ينتهي بـ «إذًا هعمل…»"),
      ],
    },
    {
      order: 4,
      id: "analyst-m4",
      title: "القرارات والـ Dashboard",
      subtitle: "٤ أرقام + Review أسبوعي = نظام قرار حقيقي.",
      lessons: [
        analystShipped(1, "analyst-m4-four-numbers-dashboard", "٤ أرقام بس"),
        analystShipped(2, "analyst-m4-weekly-review-ritual", "Review أسبوعي = ١٥ دقيقة"),
      ],
    },
    {
      order: 5,
      id: "analyst-m5",
      title: "لما الحاجات بتبوظ",
      subtitle: "أخطاء الأسئلة والتفسير — وعلاجها.",
      lessons: [
        analystShipped(1, "analyst-m5-question-mistakes", "أخطاء الأسئلة"),
        analystShipped(2, "analyst-m5-interpretation-mistakes", "أخطاء التفسير"),
      ],
    },
    {
      order: 6,
      id: "analyst-m6",
      title: "Closing the Loop",
      subtitle: "قراراتك جاهزة — Business بيستنّاك.",
      lessons: [
        analystShipped(1, "analyst-m6-from-decisions-to-business", "قراراتك جاهزة → Business بيشغّلها"),
      ],
    },
  ];
}

/* Business — standalone leadership path. Closes the full ecosystem. */
function businessModules(): CurriculumModule[] {
  return [
    {
      order: 0,
      id: "business-m0",
      title: "أنت فين في الخريطة؟",
      subtitle: "من Operator لـ Leader — دورك بقى مختلف.",
      lessons: [
        businessShipped(1, "business-m0-from-decisions-to-leadership", "القرارات بقت بتنفّذ نفسها — دورك إيه؟"),
      ],
    },
    {
      order: 1,
      id: "business-m1",
      title: "Business Thinking",
      subtitle: "Reactive vs Proactive + إيقاع أسبوعي يربط الـ ٤ مسارات.",
      lessons: [
        businessShipped(1, "business-m1-reactive-vs-proactive", "Reactive vs Proactive"),
        businessShipped(2, "business-m1-weekly-rhythm", "أسبوعك = ٤ مسارات"),
      ],
    },
    {
      order: 2,
      id: "business-m2",
      title: "إدارة العملاء بالـ AI",
      subtitle: "دورة حياة العميل + Follow-up Flow.",
      lessons: [
        businessShipped(1, "business-m2-customer-lifecycle", "دورة حياة العميل"),
        businessShipped(2, "business-m2-retention-flow", "Follow-up Flow"),
      ],
    },
    {
      order: 3,
      id: "business-m3",
      title: "إدارة العمليات بالـ AI",
      subtitle: "Strategic / Operational / Administrative — كل نوع في مكانه.",
      lessons: [
        businessShipped(1, "business-m3-strategic-operational-admin", "٣ أنواع شغل"),
        businessShipped(2, "business-m3-delegate-or-automate", "Delegate ولا Automate؟"),
      ],
    },
    {
      order: 4,
      id: "business-m4",
      title: "النمو والتوسع",
      subtitle: "علامات الجاهزية + ترتيب التوسع الصح.",
      lessons: [
        businessShipped(1, "business-m4-readiness-signals", "علامات الجاهزية للتوسع"),
        businessShipped(2, "business-m4-system-then-people", "System الأول — الناس بعدين"),
      ],
    },
    {
      order: 5,
      id: "business-m5",
      title: "لما الحاجات بتبوظ",
      subtitle: "Reactive Relapse و Premature Scaling — أخطر فخّين.",
      lessons: [
        businessShipped(1, "business-m5-reactive-relapse", "الرجوع لـ Reactive Mode"),
        businessShipped(2, "business-m5-premature-scaling", "توسع قبل الأوان"),
      ],
    },
    {
      order: 6,
      id: "business-m6",
      title: "Closing the Loop — النظام الكامل",
      subtitle: "الـ ٥ مسارات في يومك — شخص + AI + System.",
      lessons: [
        businessShipped(1, "business-m6-full-ecosystem", "الـ ٥ مسارات في يومك"),
      ],
    },
  ];
}

/* -------------------------------------------------------------- */
/*  PATHS                                                         */
/* -------------------------------------------------------------- */

export const PATHS: CurriculumPath[] = [
  {
    id: "intro",
    title: "Introduction",
    tagline: "دخول عالم الـ AI — من غير خوف ومن غير كود.",
    icon: Sparkles,
    accent: "accent",
    status: "open",
    kind: "intro",
    tier: "user",
    modules: [
      {
        order: 1,
        id: "intro-m1",
        title: "ابدأ من هنا",
        subtitle: "٧ دروس بسيطة: تفتح أول AI، تشيل الرهبة، تكتب أول Prompt صح، وتختار مسارك.",
        lessons: [
          lesson(1, "intro-m1-l1-what-is-ai", "AI يعني إيه فعلًا؟", "available", "/learn/intro/intro-m1-l1-what-is-ai"),
          lesson(2, "intro-m1-l2-first-prompt", "أول Prompt ليك", "available", "/learn/intro/intro-m1-l2-first-prompt"),
          lesson(3, "intro-m1-l3-setup-your-ai", "افتح أول AI ليك في دقيقتين", "available", "/learn/intro/intro-m1-l3-setup-your-ai"),
          lesson(4, "intro-m1-l4-ai-can-cannot", "الـ AI يقدر يعمل إيه ومينفعش يعمل إيه؟", "available", "/learn/intro/intro-m1-l4-ai-can-cannot"),
          lesson(5, "intro-m1-l5-ai-vs-software", "AI مش زي البرامج العادية", "available", "/learn/intro/intro-m1-l5-ai-vs-software"),
          lesson(6, "intro-m1-l6-learn-without-fear", "اتعلم AI من غير خوف", "available", "/learn/intro/intro-m1-l6-learn-without-fear"),
          lesson(7, "intro-m1-l7-choose-your-path", "اختار مسارك", "available", "/learn/intro/intro-m1-l7-choose-your-path"),
        ],
      },
    ],
  },
  {
    id: "business",
    title: "Business",
    tagline: "بناء وقيادة عمل تجاري في عصر الذكاء.",
    icon: Briefcase,
    accent: "business",
    status: "open",
    kind: "path",
    tier: "user",
    route: "/paths/business",
    modules: businessModules(),
  },
  {
    id: "creator",
    title: "Creator",
    tagline: "صناعة محتوى احترافية — من الفكرة للنشر للـ Leads.",
    icon: Palette,
    accent: "accent",
    status: "open",
    kind: "path",
    tier: "user",
    modules: creatorModules(),
  },
  {
    id: "analyst",
    title: "Analyst",
    tagline: "تحليل البيانات وفهم الأنماط مع الـ AI.",
    icon: BarChart3,
    accent: "accent",
    status: "open",
    kind: "path",
    tier: "user",
    modules: analystModules(),
  },
  {
    id: "automator",
    title: "Automator",
    tagline: "أتمتة شغلك مهما كان — Leads، مبيعات، عمليات، Workflows.",
    icon: Workflow,
    accent: "primary",
    status: "open",
    kind: "path",
    tier: "operator",
    route: "/paths/automator",
    modules: automatorModules(),
  },
  {
    id: "builder",
    title: "Builder",
    tagline: "للي عايز يبني منتجات AI بنفسه — مسار تقني، اختياري تمامًا.",
    icon: Hammer,
    accent: "primary",
    status: "open",
    kind: "path",
    tier: "builder",
    route: "/paths/builder",
    modules: builderMilestones(),
  },

];

/* -------------------------------------------------------------- */
/*  Flat ordered lesson ids per path — for progression checks     */
/* -------------------------------------------------------------- */

export function pathLessonIds(p: CurriculumPath): string[] {
  return p.modules.flatMap((m) => m.lessons.map((l) => l.id));
}

export function getPath(id: PathId): CurriculumPath | undefined {
  return PATHS.find((p) => p.id === id);
}

/** Resolve a lesson id to its owning `{ pathId, slug }` so callers can
 * build a `/learn/{pathId}/{slug}` link without knowing the source path. */
export function findLessonRoute(
  lessonId: string,
): { pathId: PathId; slug: string } | null {
  for (const p of PATHS) {
    for (const m of p.modules) {
      for (const l of m.lessons) {
        if (l.id !== lessonId || !l.route) continue;
        const slug = l.route.replace(`/learn/${p.id}/`, "");
        return { pathId: p.id, slug };
      }
    }
  }
  return null;
}

/** Total available (shipped) lessons across all paths. */
export function totalAvailableLessons(): number {
  return PATHS.flatMap((p) => p.modules)
    .flatMap((m) => m.lessons)
    .filter((l) => l.state === "available").length;
}

/** Total lessons (including coming-soon) across all paths. */
export function totalLessons(): number {
  return PATHS.flatMap((p) => p.modules).flatMap((m) => m.lessons).length;
}