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

/** Business · M4 · Lesson 05 — Business OS Dashboard (v3: Lesson Shape pilot) */
export const BUSINESS_M4_L5_BUSINESS_OS_DASHBOARD_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "ختام المسار",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ لوحة Business OS مش جدار أرقام — ٤–٥ أرقام، إشارات، وملخص AI أسبوعي لقرار واحد.",
        "ليه دلوقتي؟ ربطت المسارات وصمّمت مراجعة أسبوعية. النهاردة تجمع كل ده في لوحة تحكم بسيطة.",
        "هتعمل إيه بعد الدرس؟ هتصمّم لوحة: ٤ أرقام، ٣ إشارات متكررة، و Prompt ملخص أسبوعي للـ AI.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "شيت فيه ٤٠ عمود — ومش بتفتحه",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "لوحات معقّدة تموت لوحدها. صاحب بيزنس محتاج ٤ أرقام يعرفهم كل جمعة — و٣ إشارات تحذّره قبل الأزمة.",
        "الإشارات: شكاوى متكررة، كاش ضيق، مهام معلّقة، عميل كبير غاضب — حسب بيزنسك.",
        "الـ AI يقرأ الأرقام والملاحظات ويطلع ملخص: «إيه الأهم؟ إيه قرار الأسبوع؟» — إنت توافق أو تعدّل.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "لوحة بسيطة = قرار أسبوعي",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "٤ أرقام فقط: اختار اللي يحرّك بيزنسك (مبيعات، هامش، راجعين، كاش، طلبات) — مش كل KPI في العالم.",
        "٣ إشارات: أحداث أو أنماط تكررت الأسبوع ده — الـ AI يساعدك تلخّصها من رسائل وملاحظات.",
        "Prompt ملخص أسبوعي: «هذه أرقامي وإشاراتي — إيه الأهم؟ اقترح قرارًا واحدًا للأسبوع الجاي.»",
        "ابدأ بورقة أو شيت واحد — مش منصة BI. البساطة تخلّيك تفتحها كل أسبوع.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للوحة",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Control Panel (لوحة تحكم)",
          meaning: "مكان واحد للأرقام والإشارات — تفتحه في المراجعة الأسبوعية.",
          example: "صفحة Notion أو تبويب شيت — ٤ أرقام + ٣ إشارات + آخر قرار.",
        },
        {
          term: "Signal (إشارة)",
          meaning: "نمط أو حدث متكرر يستاهل انتباه — مش رقم رئيسي.",
          example: "٣ شكاوى عن التأخير في أسبوع واحد.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — لوحة قبل التعقيد",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "تصميم لوحة Business OS بسيطة. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "٤٠ رقم vs ٤ أرقام + قرار",
    block: {
      kind: "comparison",
      left: {
        label: "لوحة ضخمة",
        body: "تتعمل مرة وما تتفتحش. القرارات لسه بالإحساس.",
      },
      right: {
        label: "لوحة ٤+٣+AI",
        body: "كل جمعة: أرقام، إشارات، ملخص، قرار واحد مسجّل.",
      },
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "٤ مؤشرات أساسية",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "four-kpi-dashboard",
      label: "Business OS Dashboard",
      caption:
        "أربعة أرقام في الأعلى — إشارات على الجنب — قرار الأسبوع في الأسفل. توسّع لما تلتزم بالمراجعة.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m4-l5-business-os-dashboard-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أول لوحة Business OS. أحسن بداية؟",
          options: [
            "٢٠ KPI من كل مجال — عشان «تكون شامل».",
            "٤ أرقام + ٣ إشارات + مراجعة أسبوعية مع AI.",
            "منصة BI معقدة قبل ما تعرف إيه المهم.",
          ],
          correctIndex: 1,
          explanation:
            "اللوحة للقرار مش للعرض. ابدأ صغير — زوّد لما المراجعة تبقى عادة.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك · ختام Business",
    title: "صمّم لوحة Business OS",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "دي مهمة بناء ختامية. صمّم لوحة بسيطة: ٤ أرقام تتابعها، ٣ إشارات متكررة تهمك، و Prompt واحد تسأله للـ AI كل أسبوع لملخص وقرار.\n\nمش مطلوب شيت جاهز — مطلوب تصميم تقدر تنفّذه في أسبوع.",
      prompt:
        "في تسليمك اكتب:\n\n١) الرقم ١ + مصدره (منين هتجيبه):\n٢) الرقم ٢ + مصدره:\n٣) الرقم ٣ + مصدره:\n٤) الرقم ٤ + مصدره:\n٥) الإشارة ١:\n٦) الإشارة ٢:\n٧) الإشارة ٣:\n٨) Prompt الملخص الأسبوعي للـ AI (انسخه كامل):",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "أرقام:\n١) [...] — من [شيت/نظام]\n٢) [...] — من [...]\n٣) [...] — من [...]\n٤) [...] — من [...]\n\nإشارات:\n١) [...]  ٢) [...]  ٣) [...]\n\nPrompt أسبوعي:\n\"هذه أرقامي: [...]. إشاراتي: [...]. إيه الأهم؟ اقترح قرارًا واحدًا للأسبوع الجاي.\"",
      rubric: [
        {
          label: "لوحة عملية",
          weight: 60,
          criteria: ["٤ أرقام + ٣ إشارات — كل واحد له معنى في بيزنسك."],
        },
        {
          label: "Prompt ملخص",
          weight: 40,
          criteria: ["Prompt واضح يطلب ملخصًا وقرارًا واحدًا."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت مسار Business",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ Business OS = قرار + إيقاع + عميل + نظام + مراجعة — والـ AI في كل طبقة.",
        "تقدر تعمل إيه؟ عندك لوحة بسيطة ومسار واضح — وتعرف أي مسار تاني يخدمك.",
        "اللي جاي: Offer ودرسات إضافية في الهيكل النهائي — دلوقتي طبّق اللوحة أول جمعة وشوف الفرق.",
      ],
    },
  },
];
