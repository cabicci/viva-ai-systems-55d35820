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
import mobileShootingScreenshot from "@/assets/lessons/creator-m4-l2-mobile-shooting.jpg";

export const CREATOR_M4_MOBILE_SHOOTING_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "موبايلك يقدر يطلع فيديو محترم جدا",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "المشكلة مش في إنك معندكش كاميرا غالية، المشكلة في أساسيات التصوير.",
        "النهاردة هنركز على ٤ حاجات فقط: النور، الصوت، الكادر، وأول ثواني.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "المشكلة",
    title: "فيديو مفيد بس الناس بتقفل بدري",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "محتوى قوي ممكن يضيع بسبب وش مظلم، صوت مزعج، أو بداية بطيئة.",
        "الجمهور بيدي الفيديو ثواني قليلة عشان يقرر يكمل أو يقلب.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "اضبط الأساسيات قبل أي مؤثرات",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "النور: خلي المصدر قدامك مش وراك، والشباك غالبا أحسن حل مجاني.",
        "الصوت: المكان الهادي مهم جدا، وقرب الميكروفون من بقك يفرق بوضوح.",
        "الكادر: خلي الموبايل ثابت، والعين قريبة من مستوى العدسة.",
        "أول ثواني: ابدأ بجملة واضحة توصل قيمة الفيديو فورا، مش مقدمة طويلة.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مقارنة سريعة",
    title: "تعقيد زيادة vs تنفيذ بسيط",
    block: {
      kind: "comparison",
      left: {
        label: "الأسلوب المعطل",
        body: "استنى معدات مثالية قبل ما تبدأ، فتفضل مأجل ومفيش محتوى ينزل.",
      },
      right: {
        label: "الأسلوب العملي",
        body: "صور بالموبايل بإضاءة وصوت وكادر مضبوطين، ونزل بشكل منتظم.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "مصطلحات مهمة",
    title: "٣ مصطلحات سريعة",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Framing",
          meaning: "طريقة ترتيبك داخل الكادر عشان العين ترتاح وتفهم بسرعة.",
          example: "رأسك مش مقطوعة وفي مساحة بسيطة فوقك",
        },
        {
          term: "Hook",
          meaning: "أول جملة تشد المشاهد يكمل الفيديو.",
          example: "لو عندك دقيقة هتفهم أصل المشكلة",
        },
        {
          term: "Ambient Noise",
          meaning: "دوشة الخلفية اللي ممكن تضيع الكلام.",
          example: "صوت مروحة أو شارع عالي",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "تصوير سريع بالموبايل",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "خطوات قصيرة لتصوير أوضح بالموبايل. لو وقتك ضيق، تخطى الفيديو وابدأ تنفيذ المهمة فورًا.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "مثال بصري",
    title: "تجهيز تصوير عملي",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: mobileShootingScreenshot,
      alt: "لقطة توضح إعداد تصوير موبايل بإضاءة وكادر مناسبين",
      caption:
        "المثال ده يوضح إن تجهيز بسيط يفرق: نور قدامك، موبايل ثابت، وبداية قوية من أول ثانية.",
      label: "mobile-shooting.jpg",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "أفضل خطوة قبل الضغط على تسجيل",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m4-l2-mobile-shooting-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "قبل ما تسجل فيديو ٦٠ ثانية بالموبايل، أنهي ترتيب يعتبر الأفضل للبداية؟",
          options: [
            "أبدأ التصوير فورا وبعدها أشوف الصوت والنور",
            "أضبط النور والصوت والكادر، وبعدها أكتب أول جملة hook",
            "أركز على الفلتر الأول وبعدها أشوف المحتوى",
          ],
          correctIndex: 1,
          explanation:
            "الترتيب الصح يضمن إن الأساسيات خدامة المحتوى بدل ما تعطل الرسالة.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمة تطبيق",
    title: "سجل فيديو ٦٠ ثانية أو اكتب سكريبته",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "اختار واحد من مسارين: يا تسجل فيديو ٦٠ ثانية فعلي، يا تكتب سكريبت تصوير جاهز للتنفيذ بنفس القواعد.",
      prompt:
        "اختار مسار واحد واملأه:\n\nمسار التسجيل:\n١) Hook أول جملة:\n٢) إعداد النور:\n٣) إعداد الصوت:\n٤) وصف الكادر:\n٥) لينك أو وصف النتيجة بعد التصوير\n\nمسار السكريبت:\n١) Hook أول جملة:\n٢) نص الفيديو ٦٠ ثانية:\n٣) ملاحظة النور:\n٤) ملاحظة الصوت:\n٥) ملاحظة الكادر",
      buttonLabel: "انسخ المهمة",
      copiedLabel: "اتنسخت",
      template:
        "المسار المختار: [تسجيل/سكريبت]\n\nHook:\n[اكتب الجملة الأولى]\n\nالنور:\n[وصف سريع]\n\nالصوت:\n[وصف سريع]\n\nالكادر:\n[وصف سريع]\n\nالمحتوى ٦٠ ثانية أو وصف التسجيل:\n[اكتب هنا]",
      rubric: [
        {
          label: "التزام الأساسيات",
          weight: 60,
          criteria: ["النور والصوت والكادر متوصفين بوضوح."],
        },
        {
          label: "بداية قوية",
          weight: 40,
          criteria: ["في Hook واضح يخدم الفكرة من أول ثواني."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "قفلة واثقة",
    title: "إنت تقدر تصور من النهاردة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "جودة الفيديو مش رفاهية، لكنها كمان مش محتاجة تعقيد.",
        "ابدأ بتنفيذ نسخة بسيطة النهاردة، والتحسين ييجي مع التكرار.",
      ],
    },
  },
];
