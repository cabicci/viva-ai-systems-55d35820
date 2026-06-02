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
import curriculumScreenshot from "@/assets/lessons/intro-m1-l7-choose-your-path.jpg";

/**
 * Intro · Lesson 07 — اختار مسارك (v2: Tension-First)
 */
export const INTRO_CHOOSE_YOUR_PATH_CONTENT: IntroLessonContent = [
  {
    icon: AlertCircle,
    eyebrow: "TENSION",
    title: "لو بدأت الـ ٥ مسارات مع بعض… غالبًا مش هتخلص ولا واحد",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الحماس في البداية بيخليك عايز Builder و Creator و Automator وكل حاجة مرة واحدة.",
        "بس التشتت هنا خطر: ٥ بدايات مفتوحة = صفر نتيجة ملموسة.",
        "الدرس ده هيخليك تختار مسار واحد بناءً على مشكلتك الحالية، مش على اللي شكله أمتع.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "٥ اختيارات واضحة",
    title: "المسارات معناها إيه عمليًا؟",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Builder",
          meaning: "تبني منتج أو تطبيق أو MVP بفكرة واضحة.",
          example: "عندك فكرة SaaS أو أداة داخلية وعايز نسخة شغالة.",
        },
        {
          term: "Creator",
          meaning: "تحوّل خبرتك لمحتوى يجذب جمهور وعملاء.",
          example: "بتعرف حاجة كويس بس محدش شايفك كفاية.",
        },
        {
          term: "Automator",
          meaning: "تخلّي المهام المتكررة تشتغل لوحدها بتدفقات واضحة.",
          example: "رسائل متابعة، نقل بيانات، تنبيهات، CRM.",
        },
        {
          term: "Analyst",
          meaning: "تحوّل البيانات والأسئلة لأرقام وقرارات أوضح.",
          example: "عندك مبيعات أو أداء محتوى ومش عارف تقرأ المعنى.",
        },
        {
          term: "Business",
          meaning: "تستخدم AI لتقليل تكلفة التشغيل وتحسين النمو والربح.",
          example: "بزنس شغال بس عايز يشتغل أذكى وبتكلفة أقل.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — اختار بناءً على مشكلتك",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      url: "/lessons/intro/intro-m1-l7-choose-your-path.mp4",
      caption: "٥ شخصيات، ٥ مشاكل، ٥ مسارات مختلفة.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "Quick Win",
    title: "Decision Tree في سؤال واحد",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "اسأل نفسك: إيه أكبر مشكلة محتاج أحلها الشهرين الجايين؟",
        "لو المشكلة: «عندي فكرة ومش عارف أبنيها» → Builder.",
        "لو المشكلة: «عندي خبرة ومفيش جمهور» → Creator.",
        "لو المشكلة: «وقتي بيتاكل في تكرار» → Automator.",
        "لو المشكلة: «عندي بيانات ومش شايف القرار» → Analyst.",
        "لو المشكلة: «البزنس محتاج يكبر بتكلفة أقل» → Business.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "الخمسة متاحين — بس ابدأ بواحد",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: curriculumScreenshot,
      alt: "خريطة المسارات الخمسة: Builder و Creator و Automator و Analyst و Business",
      caption:
        "كل المسارات منشورة ومفتوحة. الاختيار مش قفل باب — الاختيار تركيز عشان تطلع بنتيجة أولى.",
      label: "Learning paths",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "التركيز هو الاختصار الحقيقي",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — كل حاجة مرة واحدة",
        body: "تفتح ٥ مسارات، تاخد أول درس من كل واحد، وبعد شهر تلاقي مفيش مشروع ولا محتوى ولا automation.",
      },
      right: {
        label: "RIGHT — مسار واحد لنتيجة واحدة",
        body: "تختار مسار واحد، تخلص أول موديول، وتطلع بنتيجة ملموسة قبل ما تضيف مسار تاني.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "اختبر فهمك",
    title: "مين يناسبه أنهي مسار؟",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "intro-m1-l7-choose-your-path-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أحمد عنده فكرة تطبيق وعايز نسخة أولى شغالة. أنسب مسار؟",
          options: ["Builder", "Creator", "Analyst"],
          correctIndex: 0,
          explanation: "ده هدف Builder: تحويل الفكرة لمنتج أو MVP.",
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "منى بتبعت نفس رسائل المتابعة كل يوم ووقتها بيضيع. أنسب مسار؟",
          options: ["Business", "Automator", "Creator"],
          correctIndex: 1,
          explanation: "المهام المتكررة هي ملعب Automator.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "يوسف عنده أرقام مبيعات كتير ومش عارف يطلع قرار. أنسب مسار؟",
          options: ["Analyst", "Creator", "Builder"],
          correctIndex: 0,
          explanation: "تحويل البيانات لأسئلة وقرارات هو دور Analyst.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "Mission — اختار مسار واحد والتزم",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "اختيارك دلوقتي لازم يطلع من مشكلة حقيقية عندك، مش من فضول عام.",
      prompt:
        "في تسليمك اكتب:\n\n١) المسار اللي اخترته: Builder / Creator / Automator / Analyst / Business\n٢) المشكلة الحالية اللي المسار ده هيحلها في سطرين:\n٣) ليه اخترته قبل باقي المسارات؟\n٤) مسارين مغريين استبعدتهم مؤقتًا وليه:\n٥) نتيجة واحدة قابلة للقياس عايز توصلها بعد شهرين:",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "اختيار مبني على مشكلة",
          weight: 70,
          criteria: ["المسار مربوط بمشكلة حقيقية ومحددة."],
        },
        {
          label: "تركيز قابل للقياس",
          weight: 30,
          criteria: ["في نتيجة شهرين واضحة يمكن قياسها."],
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "جزء من المنصة · Capstone",
    title: "المنصة نفسها مثال على الخمسة مسارات",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل مسار زاوية شغالة هنا فعلًا",
      summary:
        "المنصة اتبنت بخليط من الخمسة: منتج، محتوى، automation، تحليل، وقرار بزنس. بس كمتعلم، الأفضل تبدأ بزاوية واحدة تناسب مشكلتك.",
      bullets: [
        "Builder: صفحات وتجربة تعلم شغالة.",
        "Creator: فيديوهات وسكريبتات تعليمية.",
        "Automator: رندر ورفع الفيديوهات بخطوات آلية.",
        "Analyst: متابعة التقدم والنتائج.",
        "Business: تكلفة أقل وقرارات أسرع.",
      ],
      link: { label: "اختار مسارك", href: "/learn" },
    },
  },
];
