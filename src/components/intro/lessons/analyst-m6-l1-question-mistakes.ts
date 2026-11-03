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

/** Analyst · M6 · Question Mistakes — أخطاء الأسئلة (v3: Lesson Shape pilot) */
export const ANALYST_M6_L1_QUESTION_MISTAKES_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ السؤال الغلط يضيّع وقتك حتى لو البيانات صح — بيانات كتير ومفيش قرار.",
        "ليه دلوقتي؟ بعد A/B testing، محتاج تتأكد إن الأسئلة اللي بتسألها تستاهل التحليل.",
        "هتعمل إيه بعد الدرس؟ هتعيد صياغة ٣ أسئلة بايظة لأسئلة تقدر تاخد عليها قرار.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "بتجمع بيانات — ومش عارف تقرّر",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "«إيه أحوال الشغل؟» — «ليه الإعلان فاشل؟» — «كام عميل سعيد؟» — كل أسبوع نفس الأسئلة.",
        "بتطلع تقارير ورسوم — بس مفيش رقم واحد تقول «إذًا هعمل…» عليه.",
        "الـ AI يساعدك تعيد صياغة السؤال — إنت تختار السؤال اللي يخدم قرار حقيقي.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "٣ أخطاء قاتلة في صياغة السؤال",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "سؤال عام («إيه أحوال الشغل؟») → خصّصه: مين؟ إيه؟ إمتى؟ مقارنة بإيه؟",
        "سؤال متحيّز («ليه الإعلان فاشل؟») → افترضت الفشل قبل البيانات. اسأل: «كام lead؟ بكام؟»",
        "سؤال بدون بيانات («كام عميل سعيد؟») → «سعيد» مش رقم. استبدله بـ signal: NPS، تكرار شراء، D7 retention.",
        "لو السؤال مكمّلش شروط السؤال الصح — المشكلة في الصياغة مش في الإجابة.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "سؤال بايظ vs سؤال يخدم قرار",
    block: {
      kind: "comparison",
      left: {
        label: "سؤال بايظ",
        body: "«ليه العملاء بيسيبوا العربة؟» — افترضت سبب قبل ما تشوف البيانات. هتضيع وقت في تخمين.",
      },
      right: {
        label: "سؤال مصحّح",
        body: "«كام % ترك عربة آخر ٣٠ يوم؟ وفي أي خطوة بالظبط بيخرجوا؟» — رقم + مكان + قرار.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للأسئلة",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Leading Question (سؤال متحيّز)",
          meaning: "سؤال بيوجّه الإجابة لاتجاه إنت متوقعه — قبل ما تشوف البيانات.",
          example: "«ليه الإعلان فاشل؟» بدل «كام lead جابت الحملة؟»",
        },
        {
          term: "Signal (إشارة)",
          meaning: "رقم أو سلوك قابل للقياس — مش شعور أو كلام عام.",
          example: "بدل «مهتم» → تفعيل الحساب أو تكرار الشراء.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — تشخيص ٣ أخطاء",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "تشخيص ٣ أخطاء قاتلة في صياغة الأسئلة — وإزاي الـ AI يساعدك تصحّحهم. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "٣ أخطاء · ٣ علاجات",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "question-rewrite",
      label: "جدول إعادة الصياغة",
      caption:
        "نوع الخطأ · السؤال الغلط · السؤال المصحّح — استخدم الجدول في المهمة لإعادة صياغة ٣ أسئلة.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "analyst-m6-l1-question-mistakes-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "صاحب متجر بيسأل: «ليه العملاء بيسيبوا العربة؟» — إيه نوع الخطأ؟",
          options: [
            "Leading — افترض سبب الترك قبل ما يشوف البيانات.",
            "Vague — السؤال عام بس.",
            "No-Data — مفيش بيانات أصلًا.",
          ],
          correctIndex: 0,
          explanation:
            "السؤال بيفترض إن في مشكلة ترك وبيدوّر على سبب. الصح: «كام % ترك؟ في أي خطوة؟»",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "أعد صياغة ٣ أسئلة بايظة",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي تصليح عملي — مش نظري. اختار ٣ أسئلة بايظة (من شغلك أو أمثلة الدرس). أعد صياغتهم — ممكن الـ AI يقترح — إنت تختار النهائي.\n\nكل سؤال: نوع الخطأ + السؤال الأصلي + السؤال المصحّح.",
      prompt:
        "في تسليمك اكتب لكل سؤال من الـ ٣:\n\n١) السؤال الأصلي (انسخه):\n٢) نوع الخطأ (عام / متحيّز / بدون بيانات):\n٣) إيه اللي ناقص (Metric؟ Window؟ Comparator؟):\n٤) السؤال بعد التصليح:\n٥) القرار اللي السؤال الجديد يخدمه:\n\nكرّر للسؤال ٢ و ٣.",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "── سؤال ١ ──\nأصلي: [انسخ السؤال]\nنوع الخطأ: [عام / متحيّز / بدون بيانات]\nالناقص: [Metric / Window / Comparator / Threshold]\nمصحّح: [السؤال الجديد]\nقرار يخدمه: [إذًا هعمل…]\n\n── سؤال ٢ ──\n[نفس الهيكل]\n\n── سؤال ٣ ──\n[نفس الهيكل]",
      rubric: [
        {
          label: "تشخيص صحيح",
          weight: 50,
          criteria: ["كل سؤال له نوع خطأ + إيه الناقص."],
        },
        {
          label: "صياغة تخدم قرار",
          weight: 50,
          criteria: ["السؤال المصحّح محدّد وقابل للقياس — مربوط بقرار."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت التصليح",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ السؤال الغلط يضيّع وقت — والـ AI يساعدك تعيد الصياغة بسرعة.",
        "تقدر تعمل إيه؟ عندك ٣ أسئلة مصحّحة تقدر تستخدمهم في الريفيو الأسبوعي.",
        "اللي جاي: من القرارات الأسبوعية للهدف الأكبر — ربط Analyst بـ Business.",
      ],
    },
  },
];
