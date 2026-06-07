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
import attentionEconomyScreenshot from "@/assets/lessons/creator-m1-l2-attention-economy.jpg";

export const CREATOR_M1_ATTENTION_ECONOMY_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "الانتباه هو العملة الحقيقية",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "في السوشيال ميديا الناس بتقرر في ثواني: تكمل ولا تتخطى.",
        "الدرس ده يثبت لك إن المحتوى المفيد هو اللي يكسب الانتباه، مش المحتوى الأعلى صوتًا.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "المشكلة الشائعة",
    title: "معظم المحتوى بيتعدي عليه بسرعة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "مهما اتعبت في الإعداد، لو البداية مش جذابة الناس هتعدي.",
        "عشان كده فهم اقتصاد الانتباه يسبق أي خطة نشر أو إنتاج.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "المفيد الواضح بيفوز",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "اللي يربح الانتباه عادة هو المحتوى اللي يوعد بفايدة واضحة من أول لحظة.",
        "الـ AI ممكن يساعدك تولد صيغ بدايات بسرعة، لكن اختيار الأنسب لجمهورك لازم يفضل مبني على حكمك وتجربتك.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مقارنة سريعة",
    title: "تشتت ولا قيمة مباشرة؟",
    block: {
      kind: "comparison",
      left: {
        label: "محتوى مشتت",
        body: "مقدمة طويلة بلا فائدة مباشرة، فيتخطى بسرعة.",
      },
      right: {
        label: "محتوى مفيد",
        body: "يبدأ بفكرة عملية تمس حاجة حقيقية عند المتلقي، فيكسب وقت أطول وتفاعل أعلى.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "قاموس الدرس",
    title: "٣ مصطلحات أساسية",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Attention Economy",
          meaning: "سوق كبير بيتنافس فيه الكل على وقت وتركيز الناس.",
          example: "كل منشور على الفيد بيحاول ياخد كام ثانية من انتباهك.",
        },
        {
          term: "Scroll Stop",
          meaning: "اللحظة اللي تخلي المتلقي يوقف التقليب ويكمل.",
          example: "سؤال واضح عن مشكلة حقيقية بيعمل توقف فوري.",
        },
        {
          term: "Useful Angle",
          meaning: "الزاوية العملية اللي تخلي المحتوى مفيد فورًا.",
          example: "بدل كلام عام: خطوة محددة تقدر تتطبق اليوم.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "ليه ناس بتكمل وناس بتعدي",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "تقدر تتخطى الفيديو لو حابب وتكمل القراءة، كل الأفكار التطبيقية موجودة في البلوكات.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "لقطة بصرية",
    title: "مثال على جذب الانتباه",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: attentionEconomyScreenshot,
      alt: "لقطة توضح مثال محتوى واضح وسهل الالتقاط بصريًا.",
      caption:
        "الوضوح البصري والرسالة المركزة بيساعدوا المتلقي يفهم بسرعة ويقرر يكمل.",
      label: "creator-m1-l2-attention-economy",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تثبيت الفهم",
    title: "سؤال واحد للتطبيق",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m1-l2-attention-economy-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "لو محتوى ممتاز بس الناس بتتخطاه بسرعة، إيه أول تعديل منطقي؟",
          options: [
            "نزود طول الفيديو.",
            "نبدأ بفائدة واضحة تخلي المتلقي يوقف التقليب.",
            "نغير اسم الصفحة كل أسبوع.",
          ],
          correctIndex: 1,
          explanation:
            "في اقتصاد الانتباه البداية الواضحة هي نقطة الدخول، وبعدها باقي الجودة تاخد فرصتها.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "تدريب عملي",
    title: "راقب ٥ محتويات في الفيد",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة تدريب ملاحظة مش اختبار. راقب ٥ منشورات، وسجل ليه وقفت عند كل واحد أو ليه تخطيته.",
      prompt:
        "اكتب التسليم بالشكل ده:\n\n١) المحتوى رقم ١: وقفت/تخطيت + السبب\n٢) المحتوى رقم ٢: وقفت/تخطيت + السبب\n٣) المحتوى رقم ٣: وقفت/تخطيت + السبب\n٤) المحتوى رقم ٤: وقفت/تخطيت + السبب\n٥) المحتوى رقم ٥: وقفت/تخطيت + السبب\n\nوفي سطر أخير: أكتر نمط جذب شدك إيه؟",
      buttonLabel: "انسخ المهمة",
      copiedLabel: "اتنسخت",
      template:
        "المحتوى ١:\nوقفت/تخطيت:\nالسبب:\n\nالمحتوى ٢:\nوقفت/تخطيت:\nالسبب:\n\nالمحتوى ٣:\nوقفت/تخطيت:\nالسبب:\n\nالمحتوى ٤:\nوقفت/تخطيت:\nالسبب:\n\nالمحتوى ٥:\nوقفت/تخطيت:\nالسبب:\n\nالنمط الأكثر جذبًا:",
      rubric: [
        {
          label: "دقة الملاحظة",
          weight: 60,
          criteria: [
            "تم توثيق ٥ أمثلة فعلية.",
            "كل مثال فيه سبب واضح للوقوف أو التخطي.",
          ],
        },
        {
          label: "استخراج النمط",
          weight: 40,
          criteria: ["في استنتاج واضح لنمط جذب متكرر."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "إقفال الدرس",
    title: "عينك بقت أدق على الانتباه",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "دلوقتي بقيت تميز بسرعة إيه اللي يشد الانتباه وإيه اللي يتعدي.",
        "الدرس اللي بعده هينقلك للخطوة الأهم: تحديد الجمهور بدقة بدل الكلام مع الكل.",
      ],
    },
  },
];
