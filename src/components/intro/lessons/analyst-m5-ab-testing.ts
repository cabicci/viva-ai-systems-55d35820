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

/** Analyst · M5 · A/B Testing — اختبار A/B (v3: Lesson Shape pilot) */
export const ANALYST_M5_AB_TESTING_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ A/B Testing = غيّر حاجة واحدة، قيس نتيجة واحدة — مش تجارب عشوائية.",
        "ليه دلوقتي؟ بعد ما عرفت أخطاء التفسير، محتاج طريقة تتأكد إن التغيير سبب النتيجة مش صدفة.",
        "هتعمل إيه بعد الدرس؟ هتصمّم A/B test بسيط: إيه تقارن، إيه المتغيّر، المقياس، ومدة الملاحظة.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "«جرّبنا حاجات كتير — ومش عارفين إيه نفع»",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "غيّرت العنوان والسعر والصورة في نفس الأسبوع — المبيعات زادت. «يعني كله نفع!»",
        "ده مش A/B test — ده chaos. متغيّرات كتير = مفيش درس.",
        "الـ AI يساعدك تكتب فرضية وتفسّر النتيجة — إنت تحدّد متغيّر واحد ومقياس واحد قبل ما تبدأ.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "A vs B — متغيّر واحد — مقياس قبل البداية",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "A/B = نسخة A (زي ما هي) vs نسخة B (تغيير واحد بس). الباقي ثابت.",
        "حدّد المقياس قبل ما تبدأ: conversion %، clicks، revenue — مش «نشوف إيه يحصل».",
        "تحذير للمبتدئ: عيّنة صغيرة = نتيجة مش مضمونة. ٢–٤ أسابيع ملاحظة أحسن من ٣ أيام.",
        "الـ AI يساعدك تصيغ الفرضية وتفسّر — بس متبالغش «ثبتنا ١٠٠٪» من ٢٠ زائر.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "تجارب عشوائية vs A/B منظّم",
    block: {
      kind: "comparison",
      left: {
        label: "«جرّبنا كل حاجة»",
        body: "٣ تغييرات في أسبوع — مفيش عرفنا إيه نفع. قرار على تخمين.",
      },
      right: {
        label: "A/B واحد",
        body: "عنوان A vs عنوان B — نفس الصفحة، نفس السعر — ٢ أسبوع — conversion %.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للاختبار",
    block: {
      kind: "concepts",
      items: [
        {
          term: "A/B Test (اختبار A/B)",
          meaning: "مقارنة نسختين — فرق واحد بس — لقياس أثر التغيير.",
          example: "صفحة A (عنوان قديم) vs B (عنوان جديد) — conversion %.",
        },
        {
          term: "Sample Size (حجم العيّنة)",
          meaning: "عدد الملاحظات اللي محتاجها قبل ما تثق في النتيجة.",
          example: "٢٠ زائر = مبكر — ٢٠٠+ أحسن للمبتدئين.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — A/B بسيط",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تصمّم A/B test بسيط — متغيّر واحد، مقياس واحد، والـ AI يساعد من غير مبالغة. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "Pattern vs Outlier في الاختبار",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "pattern-vs-outlier",
      label: "نمط vs صدفة",
      caption:
        "نتيجة A/B محتاجة pattern — مش outlier يوم واحد. استخدم الرسم في المهمة.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "analyst-m5-ab-testing-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "غيّرت العنوان والصورة والسعر — المبيعات زادت. إيه المشكلة؟",
          options: [
            "متغيّرات كتير — مفيش A/B. محتاج تغيير واحد + مقياس محدد قبل البداية.",
            "المبيعات لازم تنزل مش تزيد.",
            "محتاج AI أكتر.",
          ],
          correctIndex: 0,
          explanation:
            "A/B = متغيّر واحد. ٣ تغييرات = مش عارفين إيه السبب.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "صمّم A/B test بسيط",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي تصميم — مش تشغيل إلزامي. اكتب A/B test: إيه تقارن، إيه المتغيّر، المقياس، ومدة الملاحظة.\n\nممكن الـ AI يقترح صياغة — إنت تختار النهائي.",
      prompt:
        "في تسليمك اكتب:\n\n١) إيه اللي بتقارنه (A vs B — وصف مختصر):\n٢) المتغيّر الواحد اللي اتغيّر:\n٣) المقياس (Metric — محدد قبل البداية):\n٤) مدة الملاحظة + مكان القياس:\n٥) قرار محتمل لو B نجح — ولو فشل:",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "A vs B:\nA: [النسخة الحالية]\nB: [التغيير الوحيد]\n\nالمتغيّر الواحد:\n[إيه اللي اتغيّر — عنوان / سعر / CTA…]\n\nالمقياس:\n[Metric — مثال: conversion %]\n\nالملاحظة:\n[مدة — مثال: ٢ أسبوع] + [مكان — صفحة / إيميل…]\n\nقرار لو B نجح:\n[إذًا هعمل…]\n\nقرار لو B فشل:\n[إذًا هعمل…]",
      rubric: [
        {
          label: "متغيّر + مقياس",
          weight: 60,
          criteria: ["متغيّر واحد + مقياس محدد قبل البداية."],
        },
        {
          label: "ملاحظة + قرار",
          weight: 40,
          criteria: ["مدة واقعية + قرار محتمل للنجاح والفشل."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت الاختبار",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ A/B = تغيير واحد، نتيجة واحدة — والـ AI يساعد من غير مبالغة.",
        "تقدر تعمل إيه؟ عندك تصميم A/B test جاهز للتجربة.",
        "اللي جاي: أخطاء الأسئلة — لما السؤال الغلط يضيّع وقتك حتى لو البيانات صح.",
      ],
    },
  },
];
