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
import strengthWeaknessImage from "@/assets/lessons/intro-m1-l4-ai-can-cannot.jpg";

/**
 * Intro · Lesson 04 — الـ AI يقدر يعمل إيه ومينفعش يعمل إيه؟ (v2: Tension-First)
 */
export const AI_CAN_CANNOT_CONTENT: IntroLessonContent = [
  {
    icon: AlertCircle,
    eyebrow: "TENSION",
    title: "الـ AI ممكن يبهرك… وممكن يلبّسك في معلومة غلط",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أخطر حاجة في الـ AI مش إنه يغلط. أخطر حاجة إنه يغلط بثقة.",
        "لو استخدمته في مكانه الصح، هيوفّرلك وقت رهيب. لو استخدمته في المكان الغلط، ممكن تطلع بقرار غلط.",
        "الدرس ده بيرسم خط واضح: إمتى تثق، وإمتى تراجع.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "٤ مصطلحات بس",
    title: "اللي محتاج تعرفه دلوقتي",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Hallucination",
          meaning: "لما الـ AI يألف معلومة غلط ويقولها بثقة كأنها حقيقة.",
          example: "يقولك رقم إحصائية أو تاريخ من غير مصدر حقيقي.",
        },
        {
          term: "Strength Zone",
          meaning: "المهام اللي الـ AI قوي فيها: لغة، ترتيب، تلخيص، أفكار.",
          example: "يلخّص اجتماع طويل في ٥ نقط واضحة.",
        },
        {
          term: "Risk Zone",
          meaning: "المهام اللي لازم تراجعها: أرقام دقيقة، أخبار حديثة، مصادر، تواريخ.",
          example: "سعر الدولار النهارده أو قانون اتغير قريب.",
        },
        {
          term: "Verification",
          meaning: "إنك تراجع المعلومة الحساسة من مصدر موثوق قبل استخدامها.",
          example: "لو فيه رقم مالي، راجعه من البنك أو الشيت الأصلي.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — قوي في النصوص، محتاج مراجعة في الحقائق",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      url: "/lessons/intro/intro-m1-l4-ai-can-cannot.mp4",
      caption: "أمثلة عملية على حدود الثقة في ردود الـ AI.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "Quick Win",
    title: "قاعدة ٣ ألوان للثقة",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "🟢 أخضر: كتابة، تلخيص، ترتيب أفكار، ترجمة أولية — استخدمه بسرعة.",
        "🟡 أصفر: نص فيه معلومات مهمة — استخدمه، بس راجع النقاط الحساسة.",
        "🔴 أحمر: أرقام مالية، أخبار حديثة، طب، قانون، مصادر — لازم تحقق قبل ما تعتمد.",
        "الـ AI مش بديل للحكم بتاعك. هو مساعد سريع، وإنت المسؤول عن القرار النهائي.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "خريطة القوة والضعف",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: strengthWeaknessImage,
      alt: "خريطة توضح مناطق قوة الـ AI ومناطق الخطر التي تحتاج مراجعة",
      caption:
        "الشمال: استخدمه بثقة في اللغة والتنظيم. اليمين: راجع لما الموضوع فيه أرقام أو حقائق متغيرة.",
      label: "AI trust map",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "نفس الأداة — استخدام آمن واستخدام خطر",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — تصدّق أي رقم",
        body: "تسأله عن سعر عملة أو إحصائية وتاخد الرد Copy/Paste في شغل رسمي من غير مراجعة.",
      },
      right: {
        label: "RIGHT — استخدم وراجع",
        body: "تخليه يلخّص أو يرتب، ولو طلع رقم/تاريخ/مصدر، تراجعه من مكان موثوق قبل الاستخدام.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "اختبر فهمك",
    title: "إمتى تثق وإمتى تراجع؟",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "intro-m1-l4-ai-can-cannot-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "نورا عايزة تلخّص اجتماع ساعة في ٥ نقط. ده فين؟",
          options: ["Strength Zone", "Risk Zone", "ممنوع استخدام AI"],
          correctIndex: 0,
          explanation: "التلخيص والترتيب من أقوى استخدامات الـ AI.",
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "كريم عايز سعر خامة النهارده عشان يقدّم عرض سعر. يعمل إيه؟",
          options: [
            "يعتمد على رد الـ AI مباشرة.",
            "يستخدم AI كبداية، ويراجع السعر من مصدر حديث.",
            "يسأل AI نفس السؤال ٣ مرات وخلاص.",
          ],
          correctIndex: 1,
          explanation: "الأسعار المتغيرة منطقة خطر ولازم مصدر حديث.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "لو الـ AI قال معلومة بثقة، ده معناه إيه؟",
          options: [
            "أكيد صح.",
            "ممكن تكون صح أو غلط — الثقة في الأسلوب مش دليل.",
            "أكيد غلط.",
          ],
          correctIndex: 1,
          explanation: "الثقة في صياغة الرد مش ضمان للحقيقة.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "Mission — اختبر قوتين ومخاطرة",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "هتجرب بنفسك الفرق بين منطقة القوة ومنطقة الخطر عشان تبني إحساس عملي بالثقة.",
      prompt:
        "في تسليمك اكتب:\n\n١) Prompt في Strength Zone (تلخيص/كتابة/أفكار) + ملخص الرد:\n٢) Prompt في Risk Zone (رقم/خبر/تاريخ/مصدر) + ملخص الرد:\n٣) إيه الجزء اللي لازم تراجعه في الرد التاني؟\n٤) هتراجعه منين؟\n٥) اكتب قاعدة شخصية: إمتى هستخدم AI بسرعة، وإمتى لازم أراجع؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "تمييز صحيح",
          weight: 70,
          criteria: ["الطالب فرّق بوضوح بين منطقة القوة ومنطقة الخطر."],
        },
        {
          label: "مراجعة عملية",
          weight: 30,
          criteria: ["ذكر مصدر مراجعة مناسب للمعلومة الحساسة."],
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "جزء من المنصة",
    title: "علشان كده مش بنسيب الأرقام للـ AI",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "التقدم والدرجات تتحسب بكود، مش بتخمين",
      summary:
        "في المنصة، الـ AI يساعد في فهم النصوص وتقييم الإجابات، لكن أرقام التقدم والدرجات والحضور تتحسب بقواعد برمجية واضحة عشان الدقة.",
      bullets: [
        "الفهم والشرح → AI.",
        "الأرقام والنسب → كود ثابت.",
        "القرار الصح: كل أداة في مكانها الصح.",
      ],
      pathAngle: "analyst",
    },
  },
];
