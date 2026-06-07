import {
  Sparkles,
  AlertCircle,
  PlayCircle,
  Lightbulb,
  Scale,
  Rocket,
  BookOpen,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

/** Analyst · M7 · From Decisions to Business — من القرارات للبيزنس (v3: Lesson Shape pilot) */
export const ANALYST_M7_L1_FROM_DECISIONS_TO_BUSINESS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ القرارات الأسبوعية الصغيرة بتتجمّع لهدف أكبر — مش قرارات معزولة.",
        "ليه دلوقتي؟ بعد الريفيو والأسئلة والتفسير، محتاج تربط قراراتك باتجاه البيزنس.",
        "هتعمل إيه بعد الدرس؟ هتكتب هدف ٦ شهور + ٣ أرقام تتابع التقدّم.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "قرارات كتير — ومفيش اتجاه",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل أسبوع قرار: «نزود منشورات» — «نخفّض سعر» — «نجرب حملة» — ومفيش صورة للهدف الكبير.",
        "Analyst بيطلّع قرارات. Business بيحوّلها لنظام يومي — بس من غير هدف، القرارات بتتشتت.",
        "الـ AI يساعدك تربط القرار بالهدف وتسأل «ده بيقرّبنا ولا بيشتّتنا؟» — إنت تختار الأولوية.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "قرارات أسبوعية → هدف ٦ شهور",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل قرار أسبوعي لازم يخدم هدف أكبر — وإلا بيبقى busy work.",
        "Decision Backlog: قائمة قرارات Analyst — Business يحوّلها لـ To Do · Doing · Done.",
        "٣ أرقام progress تربط الأسبوع بالهدف: مثلاً leads، conversion، revenue — أو progress، responses، results.",
        "Feedback loop: Business يرجّع feedback لـ Builder/Creator/Automator — والدورة تبدأ من جديد.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "قرارات في الدرج vs قرارات في نظام",
    block: {
      kind: "comparison",
      left: {
        label: "قائمة قرارات بتطول",
        body: "Analyst بيطلّع قرارات أسبوعيًا. مفيش حد بينفّذ. بعد شهرين = document ميّت.",
      },
      right: {
        label: "قرار → owner → deadline",
        body: "كل قرار له مكان في النظام. التنفيذ بقى جزء من الشغل اليومي — مش «لما نفضى».",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للربط",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Decision Backlog (مخزون قرارات)",
          meaning: "قائمة قرارات Analyst جاهزة للتنفيذ — كل واحد له owner وموعد.",
          example: "«تجربة رد ٢٤ ساعة» — Owner: فريق مبيعات — Deadline: الجمعة.",
        },
        {
          term: "Progress Numbers (أرقام التقدّم)",
          meaning: "٣ أرقام تقيس إذا القرارات الأسبوعية بتقرّبك من الهدف الكبير.",
          example: "هدف ٦ شهور: ١٠٠ عميل — تتابع: leads، conversion، retention.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — من Analyst لـ Business",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي قرارات Analyst تدخل نظام Business — والـ AI يساعدك تربطهم بالهدف. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "Decision Backlog → نظام تنفيذ",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "decision-backlog",
      label: "من القرار للتنفيذ",
      caption:
        "قرارات Analyst → Kanban (To Do · Doing · Done) — كل قرار له owner. استخدم الرسم في المهمة.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "analyst-m7-l1-from-decisions-to-business-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "Analyst قرر: «خصم ١٥٪ لأول طلب». إيه أول خطوة Business عشان يحوّله لنظام؟",
          options: [
            "برمجة الخصم في نظام الطلبات — يتطبق تلقائي من غير تدخل يدوي كل مرة.",
            "اتصال يدوي بكل عميل جديد.",
            "إعلان بس — واستنى الناس تتفاعل.",
          ],
          correctIndex: 0,
          explanation:
            "Business يحوّل القرار لنظام يومي — مش فعل لمرة واحدة. التلقائي = قرار يعيش.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "هدف ٦ شهور + ٣ أرقام تقدّم",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي ربط استراتيجي — مش خطة طويلة. اكتب هدف واحد لـ ٦ شهور + ٣ أرقام تتابع التقدّم + قرار أسبوعي واحد يخدم الهدف.\n\nممكن الـ AI يساعدك تصيغ — إنت تختار النهائي.",
      prompt:
        "في تسليمك اكتب:\n\n١) الهدف لـ ٦ شهور (جملة واحدة واضحة):\n٢) ٣ أرقام progress (Metric + ليه دول):\n٣) قرار أسبوعي واحد من الريفيو يخدم الهدف:\n٤) Owner + Deadline للقرار:\n٥) إزاي هتراجع التقدّم كل شهر:",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "هدف ٦ شهور:\n[جملة واحدة — مثال: ١٠٠ عميل متكرر]\n\n٣ أرقام progress:\n1. [Metric + Target]\n2. [Metric + Target]\n3. [Metric + Target]\n\nقرار أسبوعي يخدم الهدف:\n[Action + Owner + Deadline]\n\nمراجعة شهرية:\n[إمتى + إزاي]",
      rubric: [
        {
          label: "هدف + أرقام",
          weight: 60,
          criteria: ["هدف ٦ شهور واضح + ٣ أرقام progress مربوطة."],
        },
        {
          label: "ربط أسبوعي",
          weight: 40,
          criteria: ["قرار أسبوعي واحد يخدم الهدف — مش منفصل عنه."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت الربط",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ القرارات الأسبوعية بتتجمّع لهدف أكبر — والـ AI يساعدك تربطهم.",
        "تقدر تعمل إيه؟ عندك هدف ٦ شهور + ٣ أرقام + قرار أسبوعي مربوط.",
        "اللي جاي: Business Path — تحوّل القرارات لنظام يومي وعلاقات وتوسع.",
      ],
    },
  },
];
