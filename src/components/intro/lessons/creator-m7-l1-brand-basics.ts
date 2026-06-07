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
import brandImg from "@/assets/lessons/unique/creator-m7-l1-brand-basics.jpg";

export const CREATOR_M6_BRAND_BASICS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "الناس تفتكرك من موقفك مش من ألوانك",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الهوية البصرية مهمة، بس اللي بيخلي الناس تفتكرك فعلا هو وجهة نظرك الثابتة في الموضوع اللي بتتكلم فيه.",
        "الدرس ده بيركز على جوهر البراند: موقف واضح يبان في الكلام، الاختيارات، وطريقة تقديمك.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "المشكلة",
    title: "محتوى حلو شكلا لكنه بلا بصمة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كتير من الكريتورز يبدلوا ألوان وفونتات كل شوية، لكن ما يقدروش يتقال عنهم جملة واحدة مميزة.",
        "لما موقفك مش واضح، المتابع يشوفك محتوى عام قابل للاستبدال حتى لو التصميم جميل.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "POV ثابت = ذاكرة أقوى",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الـ POV هو الجملة اللي تلخص أنت شايف الدنيا إزاي في مجالك، وبتخلي المحتوى كله يمشي في خط واحد.",
        "الألوان بتخدم الـ POV مش العكس. يعني الأول تعرف موقفك، بعدين تختار شكل يخدمه.",
        "لما موقفك ثابت، حتى مواضيع مختلفة تفضل متصلة بنفس الهوية الذهنية عند الجمهور.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مقارنة سريعة",
    title: "براند شكلي مقابل براند بموقف",
    block: {
      kind: "comparison",
      left: {
        label: "براند شكلي فقط",
        body: "تصميم منظم لكن الرسالة بتتغير كل يوم. الناس تحب الشكل لكن ما تعرفش أنت واقف فين.",
      },
      right: {
        label: "براند بموقف واضح",
        body: "POV ثابت يقود المحتوى، والتصميم يدعمه. النتيجة إن الناس تفتكرك من طريقة التفكير قبل الشكل.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "قاموس صغير",
    title: "مصطلحات تساعدك تثبت الهوية",
    block: {
      kind: "concepts",
      items: [
        {
          term: "POV (Point of View)",
          meaning: "الجملة اللي توضح موقفك المختلف في مجالك.",
          example: "أنا ضد نصائح الإنتاجية السريعة وبفضل أنظمة بسيطة قابلة للاستمرار.",
        },
        {
          term: "Brand Promise",
          meaning: "الوعد اللي الجمهور يتوقعه منك كل مرة يتابعك.",
          example: "هتاخد خطوات عملية قابلة للتنفيذ بدون تعقيد.",
        },
        {
          term: "Consistency",
          meaning: "ثبات الرسالة والنبرة مع الوقت.",
          example: "حتى مع اختلاف المواضيع، الخط العام للموقف يفضل واضح.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "بناء براند يبدأ من الـ POV",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption: "ازاي تكتب موقف واحد يقود المحتوى كله بدل التشتت بين ترندات.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شكل بصري",
    title: "مثال عملي لهوية واضحة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: brandImg,
      alt: "Creator brand basics screenshot",
      caption: "الصورة بتوضح إزاي الشكل يخدم الفكرة الأساسية، مش ياخد مكانها.",
      label: "Creator Brand Basics",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تطبيق سريع",
    title: "سؤال واحد للتثبيت",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m7-l1-brand-basics-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "لو التصميمات عندك جميلة بس الناس مش قادرة تقول أنت معروف بإيه، أول أولوية تشتغل عليها إيه؟",
          options: [
            "تغيير الألوان أسبوعيا لحد ما تمسك ستايل",
            "تحديد POV جملة واحدة واضحة قبل أي تعديل شكلي",
            "زيادة عدد البوستات بدون تغيير الرسالة"
          ],
          correctIndex: 1,
          explanation:
            "الهوية الحقيقية تبدأ من وضوح موقفك. الشكل يدعم الرسالة لكن ما يقدرش يعوض غيابها.",
        }
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "المهمة العملية",
    title: "اكتب جملة POV واحدة",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة هنا لب البراند: جملة موقف واحدة تبقى مرجع لكل محتوى تنشره.",
      prompt:
        "اكتب:\n\n1) مجالك وجمهورك في سطر\n2) جملة POV واحدة تبدأ بـ \"أنا مؤمن إن...\"\n3) مثالين محتوى الجملة دي هتوجّههم\n4) جملة واحدة مش هتقولها لأنها ضد موقفك",
      buttonLabel: "انسخ المهمة",
      copiedLabel: "اتنسخت",
      template:
        "مجالي وجمهوري:\n[...]\n\nجملة POV:\nأنا مؤمن إن [...]\n\nمثال محتوى 1:\n[...]\n\nمثال محتوى 2:\n[...]\n\nجملة ضد موقفي (هتجنبها):\n[...]",
      rubric: [
        {
          label: "وضوح الـ POV",
          weight: 50,
          criteria: [
            "الجملة محددة ومفهومة ومش عامة لأي حد.",
          ],
        },
        {
          label: "ترجمتها للمحتوى",
          weight: 50,
          criteria: [
            "في مثالين واضحين + جملة مرفوضة تؤكد ثبات الموقف.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "إغلاق واثق",
    title: "دلوقتي براندك له موقف واضح",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "معاك دلوقتي الجملة اللي تميزك حتى قبل ما الناس تحفظ اسمك أو ألوانك.",
        "من اللحظة دي، كل محتوى جديد لازم يعدي على سؤال واحد: هل ده يخدم موقفي ولا لا؟",
      ],
    },
  }
];