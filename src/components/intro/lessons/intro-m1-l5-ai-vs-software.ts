import {
  AlertCircle,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import aiVsSoftwareScreenshot from "@/assets/lessons/intro-m1-l5-ai-vs-software.jpg";

/**
 * Intro · Lesson 05 — AI مش زي البرامج العادية (v2: Tension-First)
 */
export const AI_VS_SOFTWARE_CONTENT: IntroLessonContent = [
  {
    icon: AlertCircle,
    eyebrow: "TENSION",
    title: "لو بتتعامل مع الـ AI كأنه Google… هتطلع بنتيجة ضعيفة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Google بيدوّرك على صفحات. Excel بيحسب معادلة. الـ AI بيولد رد جديد من كلامك.",
        "لما تخلط بينهم، هتسأل السؤال الصح في المكان الغلط — وتفتكر إن الأداة وحشة.",
        "الدرس ده هيفهمك الفرق العملي: تستخدم برنامج عادي إمتى، وتستخدم AI إمتى.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "٤ مصطلحات بس",
    title: "الفرق في دماغك قبل ما تستخدم الأداة",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Rule-based Software",
          meaning: "برنامج شغال بقواعد ثابتة: نفس المدخل يطلع نفس النتيجة.",
          example: "Excel: معادلة SUM هتجمع نفس الأرقام بنفس النتيجة كل مرة.",
        },
        {
          term: "AI Model",
          meaning: "نظام بيتعامل مع اللغة والأنماط ويطلع رد مناسب للسياق.",
          example: "تطلب ٣ صيغ لإيميل اعتذار، يطلعلك اختيارات مختلفة.",
        },
        {
          term: "Deterministic",
          meaning: "نتيجة ثابتة ومتوقعة.",
          example: "٢ + ٢ = ٤ كل مرة.",
        },
        {
          term: "Probabilistic",
          meaning: "نتيجة مبنية على احتمالات، فممكن تختلف شوية كل مرة.",
          example: "نفس prompt لبوست تسويقي ممكن يطلع نسختين مختلفتين.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — برنامج ثابت vs AI مرن",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      url: "/lessons/intro/intro-m1-l5-ai-vs-software.mp4",
      durationLabel: "0:36",
      caption: "الفرق اللي يحدد تختار أنهي أداة لكل مهمة.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "Quick Win",
    title: "قاعدة الاختيار السريع",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "لو المهمة لها إجابة واحدة دقيقة: استخدم برنامج عادي أو مصدر موثوق.",
        "لو المهمة محتاجة صياغة، تلخيص، أفكار، مقارنة، شرح: استخدم AI.",
        "لو المهمة فيها الاتنين: خلّي البرنامج يحسب، والـ AI يشرح أو يرتب النتيجة.",
        "مثال: Excel يحسب المبيعات، والـ AI يكتب ملخص تنفيذي من الأرقام.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "المنصة نفسها مزيج من الاتنين",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: aiVsSoftwareScreenshot,
      alt: "مقارنة بين برنامج تقليدي بقواعد ثابتة وAI يرد بمرونة حسب السياق",
      caption:
        "حفظ التقدم والتنقل بين الدروس = Software ثابت. تقييم النصوص والمساعد الذكي = AI مرن.",
      label: "Software + AI",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "اختيار الأداة أهم من قوة الأداة",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — AI لكل حاجة",
        body: "تخليه يحسب فاتورة أو يطلع رقم دقيق، وبعدين تستغرب لما تلاقي فرق في الحساب.",
      },
      right: {
        label: "RIGHT — كل أداة في مكانها",
        body: "استخدم Excel للحساب، Google للمصادر، والـ AI للشرح والصياغة والترتيب.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "اختبر فهمك",
    title: "اختار الأداة الصح",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "intro-m1-l5-ai-vs-software-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "عندك ٢٠٠ رقم مبيعات وعايز الإجمالي بالظبط. تختار إيه؟",
          options: ["Excel أو Calculator", "AI فقط", "مولّد صور"],
          correctIndex: 0,
          explanation: "الحساب الدقيق محتاج أداة deterministic.",
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "عايز تكتب إيميل مهذب لعميل زعلان. تختار إيه كبداية؟",
          options: ["AI", "Calculator", "Google Maps"],
          correctIndex: 0,
          explanation: "الصياغة حسب السياق من أقوى مناطق الـ AI.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "عندك أرقام مبيعات وعايز تقرير بسيط للإدارة. أفضل flow؟",
          options: [
            "AI يحسب كل حاجة من الذاكرة.",
            "Excel يحسب، والـ AI يصيغ الملخص.",
            "Google يكتب التقرير بالكامل من غير أرقامك.",
          ],
          correctIndex: 1,
          explanation: "ده الاستخدام المختلط الصح: دقة من البرنامج ووضوح من الـ AI.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "Mission — قارن نفس المهمة بأداتين",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "اختار مهمة صغيرة واعملها مرة بأداة تقليدية ومرة بالـ AI. الهدف إنك تحس بالفرق بنفسك.",
      prompt:
        "في تسليمك اكتب:\n\n١) المهمة اللي اخترتها:\n٢) عملتها بأداة تقليدية إزاي؟ والنتيجة كانت إيه؟\n٣) الـ Prompt اللي بعتّه للـ AI + ملخص النتيجة:\n٤) مين كان أدق؟ ومين كان أسرع؟\n٥) اكتب قاعدة: في المهمة دي، إمتى تختار Software وإمتى تختار AI؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "مقارنة حقيقية",
          weight: 70,
          criteria: ["نفس المهمة اتجربت بأداتين، والفرق مكتوب بأمثلة."],
        },
        {
          label: "قرار واضح",
          weight: 30,
          criteria: ["الطالب عرف يحدد أداة مناسبة لكل نوع مهمة."],
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "جزء من المنصة",
    title: "الـ pipeline هنا مبني على نفس القاعدة",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كود ثابت للخطوات، وAI للفهم",
      summary:
        "في المنصة، في خطوات ثابتة زي تسجيل التقدم وفتح الدرس التالي، وفي خطوات مرنة زي فهم إجابة mission. الاتنين شغالين مع بعض بدل ما أداة واحدة تعمل كل حاجة.",
      bullets: [
        "Software: يحفظ، يرتب، ويتأكد من القواعد.",
        "AI: يقرأ النص ويشرح ويوجه.",
        "النتيجة: نظام أدق وأذكى في نفس الوقت.",
      ],
      pathAngle: "automator",
    },
  },
];
