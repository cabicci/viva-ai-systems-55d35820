import {
  Sparkles,
  AlertCircle,
  Lightbulb,
  Scale,
  BookOpen,
  PlayCircle,
  Image as ImageIcon,
  Rocket,
  CheckCircle2,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

export const CREATOR_M5_ANALYTICS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "المشاهدات لوحدها مش كفاية",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "رقم الـ views ممكن يفرحك، بس ما يقولش الحقيقة كاملة. في بوستات مشاهداتها أقل لكن تأثيرها أعلى بكتير.",
        "المهم إنك تفهم الإشارة الصح: إيه اللي يدل إن المحتوى بيبنّي جمهور مش بس يعدي في الـ feed.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "المشكلة",
    title: "التركيز على رقم واحد بيضللك",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "لما كل قرارك مبني على views، ممكن تكرر نوع محتوى بيجيب زحمة من غير ثقة ولا تحويل.",
        "ده يخليك تحس إنك شغال كتير بس النمو الحقيقي بطيء، لأنك بتقيس حاجة مش مرتبطة بهدفك الأساسي.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "اقرأ البوست بثلاث إشارات",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "خليك ثابت على 3 مؤشرات: Watch Time، Save Rate، Follow/Action Rate. دول اللي يوضحوا جودة المحتوى.",
        "Watch Time يقول هل البداية شدت، Save Rate يقول هل القيمة تستحق الرجوع، وFollow/Action يقول هل الثقة زادت.",
        "كل أسبوع راجع آخر 3 بوستات، واكتب قرار تحسين واحد فقط. التحسين الصغير المنتظم أحسن من تغييرات عشوائية كبيرة.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مقارنة سريعة",
    title: "قراءة سطحية مقابل قراءة ذكية",
    block: {
      kind: "comparison",
      left: {
        label: "قراءة سطحية",
        body: "بوست جاب مشاهدات عالية إذن ممتاز. بدون فهم للوقت المشاهدة والحفظ، ممكن تعيد نفس الغلط.",
      },
      right: {
        label: "قراءة ذكية",
        body: "أراجع 3 مؤشرات أساسية قبل الحكم. كده أعرف أكرر اللي فعلا بيبني علاقة طويلة مع الجمهور.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "قاموس صغير",
    title: "مصطلحات التحليل البسيط",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Watch Time",
          meaning: "متوسط الوقت اللي الناس كملت فيه المحتوى.",
          example: "لو البداية ضعيفة هتلاقي الرقم نازل بسرعة.",
        },
        {
          term: "Save Rate",
          meaning: "نسبة الحفظ مقارنة بعدد المشاهدات.",
          example: "كل ما القيمة عملية، نسبة الحفظ غالبا تعلى.",
        },
        {
          term: "Action Metric",
          meaning: "مؤشر يدل على خطوة فعلية بعد المشاهدة زي متابعة أو رسالة.",
          example: "بوست أقل views لكن جاب رسائل جدية = مؤشر أقوى.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "ازاي تقرأ الأرقام بدون تعقيد",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption: "طريقة عملية تخليك تحلل بسرعة وتطلع قرار تحسين واضح كل أسبوع.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شكل بصري",
    title: "مثلث المؤشرات الأساسية",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "analytics-triangle",
      label: "Analytics Triangle",
      caption: "وازن بين التلات إشارات بدل ما تعتمد على views بس، عشان الحكم يبقى أدق.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تطبيق سريع",
    title: "سؤال واحد للتثبيت",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m6-l3-analytics-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "عندك بوستين: الأول views أعلى لكن Save Rate ضعيف، والتاني views أقل لكن Watch Time وSave أحسن. أي واحد تعتمد عليه كإشارة لتحسين المحتوى الجاي؟",
          options: [
            "الأول لأنه أعلى مشاهدة",
            "الثاني لأنه أقوى في الجودة والنية",
            "ولا واحد، اختار حسب المزاج",
          ],
          correctIndex: 1,
          explanation:
            "المؤشرات اللي تعكس القيمة الحقيقية أهم من رقم المشاهدة الخام، لأنها تقود لنمو أمتن.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "المهمة العملية",
    title: "حدد لكل بوست أهم Metric",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "اختار 3 بوستات عندك، وقرر لكل واحد المقياس الأهم اللي يعكس نجاحه فعلا.",
      prompt:
        "اكتب تحليلك بالشكل ده:\n\n1) البوست الأول + الهدف + المقياس الأهم له:\n2) البوست الثاني + الهدف + المقياس الأهم له:\n3) البوست الثالث + الهدف + المقياس الأهم له:\n4) قرار واحد للأسبوع الجاي بناء على التحليل:",
      buttonLabel: "انسخ المهمة",
      copiedLabel: "اتنسخت",
      template:
        "البوست 1:\nالهدف: [...]\nالمقياس الأهم: [...]\nليه: [...]\n\nالبوست 2:\nالهدف: [...]\nالمقياس الأهم: [...]\nليه: [...]\n\nالبوست 3:\nالهدف: [...]\nالمقياس الأهم: [...]\nليه: [...]\n\nقرار الأسبوع الجاي:\n[...]",
      rubric: [
        {
          label: "اختيار المقاييس",
          weight: 50,
          criteria: ["كل بوست له metric واضح ومبرر مش اختيار عام."],
        },
        {
          label: "قرار تنفيذي",
          weight: 50,
          criteria: ["في قرار تحسين واحد مرتبط مباشرة بالتحليل."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "إغلاق واثق",
    title: "دلوقتي بتقود بالمؤشرات مش بالانطباع",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بقي عندك عدسة واضحة تفصل بين ضوضاء الأرقام والإشارات المهمة فعلا.",
        "الدرس اللي بعده هيحول الانتباه ده لليدز حقيقية بدل جمهور صامت.",
      ],
    },
  },
];
