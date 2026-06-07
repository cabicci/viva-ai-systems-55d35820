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
import thumbnailsCaptionsScreenshot from "@/assets/lessons/unique/creator-m5-l2-thumbnails-captions.jpg";

export const CREATOR_M4_THUMBNAILS_CAPTIONS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "الـ Thumbnail والكابشن هم باب الدخول",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بعد ما عرفت تطلع من فكرة واحدة أكتر من شكل محتوى، السؤال دلوقتي: إزاي تخلي كل نسخة منهم تتشاف وتتفتح؟",
        "الـ Thumbnail والكابشن أول قرار للمشاهد: يدوس أو يعدي.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "المشكلة",
    title: "باب ضعيف بيخسر محتوى ممتاز",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "لو الصورة باهتة أو النص طويل ومش واضح، المشاهد مش هيدي فرصة للفيديو.",
        "كمان لو أول سطر في الكابشن ممل، القارئ مش هيكمل للنقطة المهمة.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "خلي الباب واضح وسريع الفهم",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Thumbnail جيد: نص قليل، تباين قوي، وفكرة واضحة من أول نظرة.",
        "الكابشن الجيد: أول سطر Hook، وبعده جملة توضح الفايدة بسرعة.",
        "اختبر ٢ أو ٣ بدايات للكابشن، واختار اللي يوصل المعنى أسرع.",
        "متخلطش الرسائل: كل Thumbnail له وعد واحد واضح.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مقارنة سريعة",
    title: "نص مزحوم vs رسالة تفتح الباب",
    block: {
      kind: "comparison",
      left: {
        label: "الأسلوب الضعيف",
        body: "Thumbnail فيه كلام كتير وكابشن يبدأ بمقدمة طويلة، فالمشاهد يزهق قبل ما يفهم.",
      },
      right: {
        label: "الأسلوب الأقوى",
        body: "Thumbnail مركز بكلمات قليلة وكابشن يبدأ بجملة مشوقة مرتبطة بالفائدة.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "مصطلحات مهمة",
    title: "٣ مصطلحات أساسية",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Hook Line",
          meaning: "أول سطر يشد الانتباه بسرعة.",
          example: "أغلب الناس بتغلط في الخطوة دي",
        },
        {
          term: "Thumbnail Text",
          meaning: "الكلمات القليلة الظاهرة على صورة الغلاف.",
          example: "٣ كلمات واضحة أحسن من جملة طويلة",
        },
        {
          term: "CTR",
          meaning: "نسبة الناس اللي ضغطت بعد ما شافت العنوان والصورة.",
          example: "تحسين الباب يرفع الضغط حتى قبل تغيير المحتوى",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "تحسين الباب قبل النشر",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "أمثلة سريعة على Thumbnail وكابشن أقوى. لو مستعجل، تخطى الفيديو وابدأ المهمة التطبيقية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "مثال بصري",
    title: "نماذج Thumbnail وكابشن",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: thumbnailsCaptionsScreenshot,
      alt: "أمثلة لثمبنيل ونصوص كابشن قصيرة",
      caption:
        "المهم في المثال إن الرسالة واضحة من أول ثانية: نص قليل، قراءة سهلة، ووعد مفهوم.",
      label: "unique/creator-m5-l2-thumbnails-captions.jpg",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "أفضل بداية للكابشن",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m5-l2-thumbnails-captions-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "لو محتواك مفيد بس الوصول ضعيف، أنهي اختيار يحسن باب الدخول بسرعة؟",
          options: [
            "أزود طول الكابشن جدا عشان أشرح كل التفاصيل",
            "أكتب ٣ بدايات Hook للكابشن وأختبر أقواهم مع نص Thumbnail مختصر",
            "أسيب نفس الصورة والكابشن وأغير الموسيقى فقط",
          ],
          correctIndex: 1,
          explanation:
            "اختبار بدايات الكابشن مع Thumbnail واضح بيدي أسرع تحسين في قرار الضغط.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمة تطبيق",
    title: "اكتب ٣ افتتاحيات كابشن أو نصوص Thumbnail",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "اختار فيديو واحد عندك، ثم اكتب ٣ صياغات للباب: يا ٣ افتتاحيات كابشن، يا ٣ نصوص Thumbnail.",
      prompt:
        "اختار مسار واحد:\n\nمسار الكابشن:\n١) الافتتاحية الأولى\n٢) الافتتاحية الثانية\n٣) الافتتاحية الثالثة\n\nمسار Thumbnail:\n١) النص الأول\n٢) النص الثاني\n٣) النص الثالث\n\nوفي الآخر: اختار النسخة الأقوى وليه.",
      buttonLabel: "انسخ المهمة",
      copiedLabel: "اتنسخت",
      template:
        "المسار المختار: [كابشن/Thumbnail]\n\nالنسخة ١:\n[اكتب]\n\nالنسخة ٢:\n[اكتب]\n\nالنسخة ٣:\n[اكتب]\n\nاختياري النهائي وليه:\n[اكتب السبب]",
      rubric: [
        {
          label: "تنوع الصياغات",
          weight: 50,
          criteria: ["النسخ الثلاثة مختلفين فعلا مش تبديل كلمة بس."],
        },
        {
          label: "اختيار واعي",
          weight: 50,
          criteria: ["اختيار النسخة النهائية مبني على وضوح الوعد للجمهور."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "قفلة واثقة",
    title: "دلوقتي باب المحتوى عندك أقوى",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "إنت مش بتزوق المحتوى، إنت بتسهّل على الناس توصله وتفهمه بسرعة.",
        "طبّق النسخ الثلاثة على فيديو واحد، وهتشوف فرق واضح في الاستجابة.",
      ],
    },
  },
];
