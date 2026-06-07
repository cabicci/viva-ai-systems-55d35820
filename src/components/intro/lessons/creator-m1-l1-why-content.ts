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
import creatorWhyContentScreenshot from "@/assets/lessons/creator-m1-l1-why-content.jpg";

export const CREATOR_M1_WHY_CONTENT_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية واضحة",
    title: "المحتوى مش بوستات عشوائية",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "في الدرس ده هتكتشف إن الشغل الحقيقي مش إنك تنشر كتير، لكن إنك تبني نظام يخلي كل قطعة محتوى ليها هدف.",
        "الهدف إنك تخرج بإطار بسيط: لمين بتتكلم، إيه المشكلة، وإيه نوع المحتوى اللي تقدر تكرره بثبات.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "واقع متكرر",
    title: "ليه التعب كبير والنتيجة ضعيفة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "ناس كتير بتنشر يوميًا، بس مفيش تفاعل حقيقي ولا رسايل جدية.",
        "المشكلة غالبًا مش في الجهد، المشكلة إن النشر بيحصل من غير اتجاه ثابت.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "سيستم محتوى = قرارات ثابتة",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "لما المحتوى يبقى سيستم، كل بوست بيخدم وعد واضح لجمهور محدد.",
        "الـ AI يساعدك تطلع أفكار وتعيد صياغة بسرعة، لكن الحكم على المناسب ليك لازم يكون قرارك أنت.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مقارنة سريعة",
    title: "بوست عابر ولا نظام متكرر؟",
    block: {
      kind: "comparison",
      left: {
        label: "نشر عابر",
        body: "فكرة كل يوم من الصفر، فتعب أعلى ونتائج متذبذبة.",
      },
      right: {
        label: "نظام محتوى",
        body: "رسالة ثابتة ونوع محتوى متكرر، فالجمهور يفهمك أسرع ويثق فيك أكتر.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "قاموس صغير",
    title: "٣ مصطلحات للدرس",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Content System",
          meaning: "طريقة شغل فيها جمهور محدد + مشكلة واضحة + نوع محتوى متكرر.",
          example: "كل أسبوع نفس النوع من النصايح العملية لنفس الشريحة.",
        },
        {
          term: "Content Promise",
          meaning: "الوعد اللي الناس بتتوقعه منك كل مرة.",
          example: "معايا هتاخد خطوات بسيطة قابلة للتطبيق، مش كلام عام.",
        },
        {
          term: "Repeatable Format",
          meaning: "شكل محتوى تقدر تعيده بسهولة من غير ما تحس إنك بتبدأ من الصفر.",
          example: "بوست ثابت: مشكلة، ٣ خطوات، ملخص سريع.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "من العشوائية للنظام",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption: "لو مستعجل تقدر تتخطى الفيديو وتكمّل من البلوكات، الفكرة كاملة هنا.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "لقطة بصرية",
    title: "شكل السيستم وهو مرتب",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: creatorWhyContentScreenshot,
      alt: "لقطة توضح ترتيب المحتوى كمسار واضح بدل نشر عشوائي.",
      caption:
        "الترتيب ده بيوضح إن كل جزء ليه دور، وده بالظبط معنى إن المحتوى يبقى نظام.",
      label: "creator-m1-l1-why-content",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تثبيت الفهم",
    title: "سؤال واحد للتطبيق",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m1-l1-why-content-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "لو حد بينزل يوميًا بس كل بوست بشكل مختلف ومن غير اتجاه، إيه أقرب خطوة تصحح المسار؟",
          options: [
            "يزود عدد البوستات أكتر.",
            "يحدد وعد محتوى واضح ويختار نوع محتوى يكرره.",
            "يغيّر المنصة كل أسبوع.",
          ],
          correctIndex: 1,
          explanation:
            "التحسن الحقيقي بيبدأ من وضوح الوعد والنمط المتكرر، مش من زيادة الكمية.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "تدريب عملي",
    title: "اكتب وعد المحتوى بتاعك",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة تدريب عملي مش اختبار. اكتب وعد محتوى واضح يحدد: لمين، المشكلة، ونوع محتوى تقدر تكرره.",
      prompt:
        "اكتب التسليم بالشكل ده:\n\n١) أنا بكلم: [فئة محددة]\n٢) المشكلة الأساسية عندهم: [مشكلة واحدة واضحة]\n٣) نوع المحتوى المتكرر: [مثال: نصيحة عملية يومية]\n٤) وعدي لهم في جملة واحدة: [الجملة]",
      buttonLabel: "انسخ المهمة",
      copiedLabel: "اتنسخت",
      template:
        "أنا بكلم:\n[اكتب الفئة]\n\nالمشكلة الأساسية:\n[اكتب المشكلة]\n\nنوع المحتوى المتكرر:\n[اكتب النوع]\n\nوعدي لهم:\n[اكتب جملة الوعد]",
      rubric: [
        {
          label: "وضوح الوعد",
          weight: 60,
          criteria: [
            "الفئة محددة ومش عامة.",
            "المشكلة واضحة وقابلة للفهم بسرعة.",
          ],
        },
        {
          label: "قابلية التكرار",
          weight: 40,
          criteria: ["نوع المحتوى المختار تقدر تعيده بثبات."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "إقفال الدرس",
    title: "دلوقتي عندك أساس قوي",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أنت دلوقتي شايف الفرق بين نشر عشوائي ونظام محتوى حقيقي.",
        "الخطوة الجاية مباشرة: نفهم اقتصاد الانتباه وإزاي الناس بتقرر تكمل أو تتخطى.",
      ],
    },
  },
];
