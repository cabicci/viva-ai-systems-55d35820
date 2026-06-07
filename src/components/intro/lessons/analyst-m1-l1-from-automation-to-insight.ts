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

/** Analyst · M1 · Lesson 01 — Bridge from Automator (v3: Lesson Shape pilot) */
export const ANALYST_M1_L1_FROM_AUTOMATION_TO_INSIGHT_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ وجود أرقام مش نفس فهمك إيه اللي تعمله — البيانات الجاهزة بداية مش نهاية.",
        "ليه دلوقتي؟ Automator خلّى البيانات تتجمّع لوحدها. Analyst بيحوّلها لقرار. حتى ورقة أو Google Sheet صغير يكفي تبدأ.",
        "هتعمل إيه بعد الدرس؟ هتختار جدول أو dashboard أو تقرير واحد — وتكتب إيه القرار اللي عايز تاخده منه.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "بتفتح التقرير كل يوم — ومفيش قرار اتغيّر",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Dashboard فيه ٢٠ رسم بياني. بتفتحه يوميًا وتقول «حلو». بس مفيش حاجة اتغيّرت في شغلك بسببه.",
        "البيانات بقت ديكور — مش أداة قرار. Automator خلّى الكومة تكبر، بس من غير سؤال محدّد مش هتعرف تتحرّك.",
        "الـ AI يساعدك تصيغ الأسئلة وتلخّص الأرقام — إنت تقرر إيه السؤال اللي يستاهل وقتك وإيه القرار اللي هتاخده.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "Automator بيجمع — Analyst بيسأل",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Builder بنى المنتج — كل click وكل order بيتسجّل. Creator جاب الـ Reach — كل view وكل lead بيتحفظ.",
        "Automator وصّل كل ده في مكان واحد: CRM أو Sheet أو قاعدة بيانات.",
        "Analyst بيقف قدام البيانات ويسأل: إيه اللي بيشتغل؟ إيه اللي مش بيشتغل؟ إيه القرار اللي لازم آخده الأسبوع ده؟",
        "الأرقام لوحدها مش insight — الـ insight بيطلع لما السؤال يوصّلك لقرار تقدر تنفّذه.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "بتتفرّج على الأرقام vs بتدخل بسؤال",
    block: {
      kind: "comparison",
      left: {
        label: "بتتفرّج بس",
        body: "بتفتح تقرير المبيعات كل صباح. بتشوف الأرقام وتمشي. مفيش سؤال محدّد — ومفيش قرار.",
      },
      right: {
        label: "بتدخل بسؤال",
        body: "«ليه الـ Conversion نزل ٥٪ الأسبوع ده؟» — بتفتح التقرير بسؤال واحد، تطلع بقرار محدّد، تنفّذه نفس اليوم.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للبداية",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Data (بيانات)",
          meaning: "أرقام وحقائق مجمّعة — مبيعات، زيارات، طلبات، شكاوى.",
          example: "«بعت ٤٥ قطعة الأسبوع ده» — ده رقم، مش قرار.",
        },
        {
          term: "Insight (رؤية)",
          meaning: "فهم يخلّيك تعرف إيه اللي تعمله — مش مجرد رقم على الشاشة.",
          example: "«البيع بيزيد يوم الجمعة — نزوّد الإعلان يوم الخميس» — ده insight يغيّر قرار.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — من تجميع لقرار",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تنتقل من شغل Automator لشغل Analyst — نفس البيانات، عقلية مختلفة. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "حلقة القرار — ٥ مراحل",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "decision-loop",
      label: "Decision Loop",
      caption:
        "Dashboard بدون سؤال = ديكور. سؤال محدّد → إجابة → قرار → تنفيذ → مراجعة. ابدأ من السؤال في المهمة.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "analyst-m1-l1-from-automation-to-insight-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "لاحظت إن زباين كتير بيضيفوا منتجات للسلة ومبيشتروش. أحسن أول سؤال للبيانات؟",
          options: [
            "كم عدد الزيارات اليومية للموقع؟",
            "إيه متوسط عمر الزبون اللي بيضيف للسلة ومبيشتريش؟",
            "فين بالظبط الزباين بتسيب عملية الشراء (الـ funnel drop-off)؟",
          ],
          correctIndex: 2,
          explanation:
            "سؤال محدّد بيفهم «فين المشكلة» — وده بيوصّلك لقرار بخصوص مسار الشراء. الأرقام العامة مش كفاية.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اختر مصدر واحد — وحدّد قرارك",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي توجيه عملي — مش تحليل معقّد. اختار جدول أو dashboard أو تقرير واحد عندك (حتى Sheet بسيط). اكتب إيه القرار اللي عايز تاخده منه.\n\nمش مطلوب dashboard جديد — مطلوب وضوح: البيانات دي عشان أقرر إيه؟",
      prompt:
        "في تسليمك اكتب:\n\n١) المصدر اللي اخترته (جدول / dashboard / تقرير — سطر):\n٢) إيه القرار اللي عايز تاخده منه؟ (جملة واحدة واضحة)\n٣) سؤال واحد محدّد البيانات لازم تجاوبه عشان تاخد القرار ده:\n٤) لو جاوبت السؤال دلوقتي — إيه اللي هتعمله؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "المصدر:\n[جدول / dashboard / تقرير]\n\nالقرار اللي عايز أخده:\n[جملة واحدة]\n\nالسؤال اللي لازم يتجاوب:\n[سؤال محدّد بفترة ورقم]\n\nلو الإجابة طلعت:\n[إيه اللي هعمله]",
      rubric: [
        {
          label: "قرار واضح",
          weight: 60,
          criteria: ["في قرار محدّد — مش «أشوف الأرقام» بس."],
        },
        {
          label: "سؤال مربوط",
          weight: 40,
          criteria: ["السؤال مربوط بالقرار — لو اتجاوب، تعرف تتحرّك."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت البداية",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ وجود أرقام مش نفس فهمك إيه اللي تعمله — Analyst بيسأل قبل ما يفتح أي تقرير.",
        "تقدر تعمل إيه؟ عندك مصدر واحد + قرار واحد + سؤال واحد يوجّهك.",
        "اللي جاي: حوّل الشعور لسؤال — إزاي «حاسس إن...» تبقى سؤال البيانات تجاوبه.",
      ],
    },
  },
];
