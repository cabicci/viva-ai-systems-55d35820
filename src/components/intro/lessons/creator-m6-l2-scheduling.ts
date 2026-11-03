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

export const CREATOR_M5_SCHEDULING_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "الاستمرارية تكسب قدام الدفعات",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "اللي بيكسب في المحتوى مش اللي بينشر مرة جامدة، اللي بيكسب هو اللي عنده إيقاع ثابت الناس تتعود عليه.",
        "3 بوستات أسبوعيا بشكل منتظم أقوى من أسبوع نار وبعده أسبوعين غياب.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "المشكلة",
    title: "الحماس المؤقت بيكسر خطتك",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أغلب التعطيل بيبدأ من سؤال يومي مرهق: \"هنزل إيه النهارده؟\". لما السؤال يتكرر كل يوم، القرار نفسه يبقى حمل.",
        "من غير جدول واضح، حتى المحتوى الكويس بيطلع متقطع والجمهور ما يعرفش يتوقعك.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "نظام بسيط: Batch + Calendar",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "خصص Slot أسبوعي ثابت للتصوير أو التحضير بالجملة. ده يحل مشكلة الوقت بدل ما تفضل تطفي حرائق يومية.",
        "بعد التحضير، حط مواعيد نشر محددة مسبقا: 3 مرات أسبوعيا مثلا. البساطة هنا قوة مش تقليل.",
        "القاعدة الذهبية: consistency beats bursts. خليك قابل للاستمرار قبل ما تكون مثالي.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مقارنة سريعة",
    title: "إيقاع عشوائي مقابل إيقاع ثابت",
    block: {
      kind: "comparison",
      left: {
        label: "بدون نظام",
        body: "انشر لما تفضى. أسبوع فيه 5 بوستات وأسبوع مفيش. النتيجة: توتر وتراجع تفاعل.",
      },
      right: {
        label: "بنظام واضح",
        body: "يوم تحضير ثابت + 3 أيام نشر ثابتة. النتيجة: مجهود أقل وتوقع أعلى من الجمهور.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "قاموس صغير",
    title: "مصطلحات هتحتاجها في التنفيذ",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Batching",
          meaning: "تجمع نفس نوع الشغل في مرة واحدة بدل كل يوم شوية.",
          example: "تصور 3 فيديوهات في جلسة واحدة بدل تصوير يومي.",
        },
        {
          term: "Content Calendar",
          meaning: "جدول فيه مواعيد النشر وأنواع المحتوى مقدما.",
          example: "الإثنين نصيحة، الأربعاء قصة، الجمعة CTA خفيف.",
        },
        {
          term: "Cadence",
          meaning: "الإيقاع الثابت اللي بتمشي عليه في النشر.",
          example: "3 بوستات أسبوعيا لمدة 8 أسابيع متتالية.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "ازاي تبني جدول قابل للحياة",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption: "خطوات عملية تبني بيها نظام نشر ثابت من غير احتراق.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شكل بصري",
    title: "تقويم أسبوعي للنشر والتحضير",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "scheduling-calendar",
      label: "Scheduling Calendar",
      caption: "اليوم الثابت للتحضير يقلل الفوضى، وأيام النشر الثابتة تبني توقع وثقة.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تطبيق سريع",
    title: "سؤال واحد للتثبيت",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m6-l2-scheduling-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "لو هدفك الاستمرارية ومتاح لك 4 ساعات أسبوعيا، أي خطة أقرب للنجاح على المدى الطويل؟",
          options: [
            "أنشر يوميا لما يبقى عندي مزاج",
            "أعمل 3 بوستات أسبوعيا بجدول ثابت + Slot batching",
            "أستنى أسبوع كامل لحد ما أجهز 10 بوستات مثالية",
          ],
          correctIndex: 1,
          explanation:
            "الخطة الثابتة القابلة للتنفيذ أفضل من خطط ضخمة صعبة الالتزام، وده جوهر الاستمرارية.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "المهمة العملية",
    title: "ابني جدول 3 بوستات + Slot batching",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "اعمل خطة أسبوعية واقعية: 3 بوستات ثابتة مع وقت تحضير واحد بالجملة.",
      prompt:
        "اكتب خطتك بالشكل ده:\n\n1) المنصة الرئيسية:\n2) أيام وساعات نشر 3 بوستات هذا الأسبوع:\n3) Slot batching (اليوم + المدة):\n4) نوع كل بوست من الثلاثة:\n5) إيه أقل نسخة هتلتزم بيها لو الأسبوع اتلخبط:",
      buttonLabel: "انسخ المهمة",
      copiedLabel: "اتنسخت",
      template:
        "المنصة الرئيسية:\n[...]\n\nمواعيد النشر (3 بوستات):\n1) [...]\n2) [...]\n3) [...]\n\nSlot batching:\nاليوم: [...]\nالمدة: [...]\n\nنوع كل بوست:\n1) [...]\n2) [...]\n3) [...]\n\nأقل نسخة في الأسبوع المضغوط:\n[...]",
      rubric: [
        {
          label: "وضوح الجدول",
          weight: 50,
          criteria: ["في 3 مواعيد نشر محددين اليوم/الوقت بشكل واضح."],
        },
        {
          label: "قابلية التنفيذ",
          weight: 50,
          criteria: ["في Slot batching واقعي + بديل واضح لو حصل ضغط."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "إغلاق واثق",
    title: "بقي عندك نظام مش مجرد نية",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "دلوقتي معاك هيكل أسبوعي يشتغل حتى في الأيام المزدحمة. ده الفرق بين Creator هاوي وCreator منظم.",
        "الخطوة الجاية: تقرأ أرقامك صح عشان تطور الجدول بالمؤشرات، مش بالمزاج.",
      ],
    },
  },
];
