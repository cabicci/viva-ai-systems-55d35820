import {
  Sparkles,
  AlertCircle,
  PlayCircle,
  Lightbulb,
  Scale,
  Rocket,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

/** Creator · Repurposing — مضاعف المحتوى (v3: Lesson Shape pilot) */
export const CREATOR_M4_REPURPOSING_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ قطعة محتوى قوية واحدة ممكن تبقى عدة قطع — بس لكل منصة شكلها المناسب، مش نسخ ولصق.",
        "ليه دلوقتي؟ بعد المونتاج عندك محتوى أوضح. Repurposing يخلّي نفس الفكرة توصل لمنصات أكتر من غير ما تبدأ من صفر.",
        "هتعمل إيه بعد الدرس؟ هتاخد فكرة أو بوست أو سكريبت واحد — وتحوّله لـ ٣ صيغ مختلفة.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "بتنشر نفس الكلام في كل مكان — ومفيش تفاعل",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بتاخد نفس البوست الطويل وتحطه على فيسبوك ولينكدإن وإكس — والنتيجة ضعيفة على كل منصة.",
        "ده مش Repurposing — ده copy-paste. كل منصة لها إيقاع وطول ونبرة مختلفة.",
        "الـ AI يساعدك تستخرج الأفكار، تلخّص، وتعيد الصياغة — إنت تختار إيه يفضل صادق ومفيد.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "تكييف — مش نسخ",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Repurposing = نفس الفكرة الأساسية بأشكال تناسب كل منصة: ريل قصير، بوست LinkedIn، ثريد X، فقرة نشرة، أسئلة ستوري.",
        "فيديو أو بوست طويل واحد ممكن يطلع منه: ٣ سكريبتات قصيرة، بوست مهني، ٥ أسئلة تفاعل.",
        "الـ AI يقترح صيغ — إنت تراجع: هل النبرة لسه أنت؟ هل المعلومة مفيدة في الشكل ده؟",
        "مثال Prompt: «حوّل المحتوى ده إلى: ١) LinkedIn post قصير ٢) ٣ short video scripts ٣) ٥ story questions ٤) newsletter paragraph — وخلي كل نسخة مناسبة لمنصتها.»",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "نسخ ولصق vs تكييف ذكي",
    block: {
      kind: "comparison",
      left: {
        label: "نسخ نفس النص",
        body: "بوست ٥٠٠ كلمة على LinkedIn وإكس — الناس تعدّي. شكل واحد مش مناسب لكل مكان.",
      },
      right: {
        label: "تكييف بالـ AI",
        body: "نفس الفكرة: ثريد ٥ تغريدات، ريل ٤٥ ثانية، سؤال ستوري واحد — كل واحد يخدم المنصة.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للمضاعفة",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Repurposing (إعادة توظيف)",
          meaning: "تحويل قطعة محتوى أصلية لصيغ متعددة — مع تعديل للمنصة.",
          example: "فيديو ٨ دقايق → ٣ مقاطع قصيرة + ملخص بوست.",
        },
        {
          term: "Format Adaptation (تكييف الصيغة)",
          meaning: "تغيير الطول والنبرة والهيكل حسب مكان النشر.",
          example: "نفس النصيحة: جملة قوية على X — فقرة قصة على LinkedIn.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — فكرة واحدة، منصات متعددة",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي Repurposing يضاعف نظام المحتوى من غير ضغط إضافي. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "شوفها ببساطة",
    title: "من الأصل للصيغ",
    block: {
      kind: "flow",
      steps: [
        "قطعة أصلية واضحة (فيديو / بوست / سكريبت)",
        "الـ AI يقترح صيغ لكل منصة",
        "إنت تختار وتعدّل — تنشر بثقة",
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m4-repurposing-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "عندك فيديو ١٠ دقايق عن نصيحة تسويق. أحسن Repurposing؟",
          options: [
            "تنشر رابط الفيديو نفسه على كل المنصات بنفس الكابشن.",
            "تطلب من الـ AI يعمل ريل قصير + بوست LinkedIn + ٣ أسئلة ستوري — وتعدّل كل واحد.",
            "تنسخ أول ٣ دقايق كنص على إكس من غير تعديل.",
          ],
          correctIndex: 1,
          explanation:
            "Repurposing = تكييف لكل منصة. الـ AI يسرّع — الحكم والأصالة عليك.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "فكرة واحدة → ٣ صيغ",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي مضاعفة عملية — مش نشر إلزامي. اختار فكرة أو بوست أو سكريبت عندك (حتى مسودة). حوّله لـ ٣ صيغ مختلفة — ممكن بالـ AI — وعدّل اللي مش صوتك.\n\n١٠–٢٠ دقيقة كفاية.",
      prompt:
        "في تسليمك اكتب:\n\n١) المحتوى الأصلي (فكرة في ٣–٥ أسطر أو رابط/وصف):\n٢) الصيغة ١ — المنصة + المحتوى:\n٣) الصيغة ٢ — المنصة + المحتوى:\n٤) الصيغة ٣ — المنصة + المحتوى:\n٥) تعديل واحد عملته عشان يفضل صوتك:",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "١) الأصل:\n   [فكرة / بوست / سكريبت]\n\n٢) صيغة ١ — [منصة]:\n   [اكتب هنا]\n\n٣) صيغة ٢ — [منصة]:\n   [اكتب هنا]\n\n٤) صيغة ٣ — [منصة]:\n   [اكتب هنا]\n\n٥) تعديل للأصالة:\n   [جملة عدّلتها]\n\n---\nPrompt للـ AI (اختياري):\nحوّل المحتوى ده إلى:\n1. LinkedIn post قصير\n2. 3 short video scripts\n3. 5 story questions\n4. newsletter paragraph\nوخلي كل نسخة مناسبة للمنصة بتاعتها.",
      rubric: [
        {
          label: "٣ صيغ مختلفة",
          weight: 60,
          criteria: ["كل صيغة لمنصة أو شكل مختلف — مش نسخ نفس النص."],
        },
        {
          label: "حكمك أنت",
          weight: 40,
          criteria: ["في تعديل واحد يوضّح إنك راجعت واخترت صوتك."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت المضاعفة",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ Repurposing يضاعف نظام المحتوى — الفكرة واحدة، الأشكال متعددة، والـ AI يختصر الشغل.",
        "تقدر تعمل إيه؟ تحوّل قطعة واحدة لـ ٣ صيغ جاهزة للمراجعة والنشر.",
        "اللي جاي: Thumbnail والكابشن — الباب اللي يخلي الناس تدخل المحتوى.",
      ],
    },
  },
];
