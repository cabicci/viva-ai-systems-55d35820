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

/** Business · M4 · Lesson 04 — Full Ecosystem (v3: Lesson Shape pilot) */
export const BUSINESS_M7_L1_FULL_ECOSYSTEM_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ المسارات الخمسة تشتغل مع بعض كنظام تشغيل بالـ AI — مش مسارات منفصلة للتباهي.",
        "ليه دلوقتي؟ خلّصت أساس Business من قرار لعميل لنظام لمراجعة. النهاردة الصورة الكاملة.",
        "هتعمل إيه بعد الدرس؟ هتربط هدفك الحالي بأهم مسارين — وتشرح ليه.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "عايز Business و Creator و Builder وكل حاجة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الحماس يخليك تفتح كل المسارات — وبعد شهر مفيش نتيجة ملموسة في أي اتجاه.",
        "Business يحدّد الاتجاه والتشغيل. الباقي يخدم هدف — مش العكس.",
        "Builder مسار عمق اختياري لبناء أدوات — مش الوعد الأساسي. أغلب أصحاب البيزنس يبدأوا بـ User و Operator.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "٥ مسارات — دور واحد لكل واحد",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Business: اتجاه، قرار، تشغيل، عميل، نظام — القائد.",
        "Creator: محتوى وثقة وجمهور — يخلق طلب ووعي.",
        "Analyst: أرقام وقرارات — يقرأ الواقع مش الإحساس.",
        "Automator: شغل متكرر يشتغل لوحده — يحرّر وقتك.",
        "Builder: أدوات وتطبيقات — لما تحتاج منتج مخصص؛ اختياري وعميق.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للخريطة",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Business OS (نظام التشغيل)",
          meaning: "Business يجمع القرار والإيقاع والعميل — والمسارات التانية تغذّيه.",
          example: "قرار عرض جديد (Business) + محتوى (Creator) + متابعة (Automator).",
        },
        {
          term: "Builder (باني — اختياري)",
          meaning: "لبناء تطبيق أو أداة مخصصة — مش شرط لكل صاحب بيزنس.",
          example: "لو مشكلتك متابعة عملاء — Automator يكفي؛ Builder لما تحتاج منتج خاص.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — النظام الكامل",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي المسارات الخمسة تتكامل. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "كل المسارات vs مساران مرتبطان بهدف",
    block: {
      kind: "comparison",
      left: {
        label: "تشتت",
        body: "أول درس من كل مسار. مفيش مشروع ولا محتوى ولا أتمتة واضحة.",
      },
      right: {
        label: "تركيز + دعم",
        body: "هدف واحد. مساران يخدمونه — الباقي لاحقًا.",
      },
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "حلقة النظام المتكامل",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "ecosystem-loop",
      label: "Ecosystem",
      caption:
        "Business في الوسط يوجّه. Creator و Analyst و Automator يغذّوا التشغيل. Builder عند الحاجة فقط.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m4-l4-full-ecosystem-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "هدفك: تقليل وقت المتابعة اليدوية للعملاء. أنسب مسار مساعد ثاني؟",
          options: [
            "Builder — تبني تطبيق فورًا.",
            "Automator — أتمتة المتابعة المتكررة.",
            "Creator — محتوى بس.",
          ],
          correctIndex: 1,
          explanation:
            "مهمة متكررة = Automator. Builder اختياري لاحقًا لو محتاج أداة مخصصة جدًا.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك · ختام النظام",
    title: "هدفك + مساران",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "دي مهمة ربط النظام. اكتب هدفك الحالي في البيزنس (الشهرين الجايين). اختار مسارين من الخمسة الأكثر صلة — واشرح في ٢–٣ جمل ليه.\n\nمش مطلوب تخلص مسارات — مطلوب تركيز واضح.",
      prompt:
        "في تسليمك اكتب:\n\n١) هدفي الحالي (جملة أو جملتين):\n٢) المسار الأول:\n٣) ليه المسار الأول (٢–٣ جمل):\n٤) المسار الثاني:\n٥) ليه المسار الثاني (٢–٣ جمل):",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "١) الهدف:\n   [مثال: رفع عملاء راجعين ٢٠٪]\n\n٢) مسار ١: [Business / Creator / Analyst / Automator / Builder]\n٣) ليه:\n   [٢–٣ جمل]\n\n٤) مسار ٢: [...]\n٥) ليه:\n   [٢–٣ جمل]",
      rubric: [
        {
          label: "هدف حقيقي",
          weight: 50,
          criteria: ["هدف مربوط ببيزنسك — مش فضول عام."],
        },
        {
          label: "ربط منطقي",
          weight: 50,
          criteria: ["مساران مع تبرير واضح — Builder مش افتراضي لكل حد."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت خريطة النظام",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ Business يقود — والمسارات التانية أدوات في نظام تشغيل واحد.",
        "تقدر تعمل إيه؟ تعرف مسارين تخدم هدفك دلوقتي — من غير تشتت.",
        "اللي جاي: لوحة تحكم بسيطة — ٤ أرقام وإشارات وملخص AI أسبوعي.",
      ],
    },
  },
];
