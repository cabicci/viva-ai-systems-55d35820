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
import aiWritingScreenshot from "@/assets/lessons/creator-m4-l3-ai-writing.jpg";

export const CREATOR_M4_AI_WRITING_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "الذكاء الاصطناعي مساعد كتابة مش بديلك",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "AI يقدر يسرع الشغل، لكن لو سبتله كل حاجة هيطلع كلام عام شبه غيرك.",
        "المطلوب منك النهاردة: تستخدمه كمسودة، وبعدين تعدل بإيدك عشان الصوت يفضل صوتك.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "المشكلة",
    title: "نسخ نص AI زي ما هو بيقتل شخصيتك",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "لما تنشر النص من غير تعديل، المتابع يحس إن الكلام متصنع ومكرر.",
        "الفرق الحقيقي في اللمسة البشرية: أمثلتك، طريقتك، واختيارات كلماتك.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "اكتب Context واضح ثم عدّل النص",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "ابدأ ببرومبت فيه الجمهور، الهدف، النبرة، وطول المحتوى المطلوب.",
        "اطلب Draft أولي سريع بدل نص نهائي مثالي.",
        "بعدها عدّل ٣ سطور على الأقل بإيدك: بداية أقوى، مثال منك، وخاتمة بطريقتك.",
        "أي جملة تحسها مش شبهك، غيّرها فورًا حتى لو كانت سليمة لغويا.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مقارنة سريعة",
    title: "نسخ مباشر vs تحرير واعي",
    block: {
      kind: "comparison",
      left: {
        label: "الأسلوب الضعيف",
        body: "برومبت عام ثم نشر النص كما هو. النتيجة محتوى بارد ومتشابه.",
      },
      right: {
        label: "الأسلوب الأقوى",
        body: "برومبت فيه سياق واضح ثم تعديل يدوي للجمل الأساسية. النتيجة أقرب لصوتك فعلا.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "مصطلحات مهمة",
    title: "٣ كلمات هتستخدمهم دايمًا",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Context",
          meaning: "المعلومات اللي بتديها للـ AI عشان يفهم طلبك بدقة.",
          example: "الجمهور: أصحاب بيزنس صغير",
        },
        {
          term: "Draft",
          meaning: "أول نسخة خام من النص قبل التنقيح.",
          example: "مسودة ٨٠ كلمة لفيديو قصير",
        },
        {
          term: "Edit Pass",
          meaning: "جولة تعديل بشرية لتقريب النص من صوتك.",
          example: "تغيير البداية وإضافة مثال شخصي",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "Workflow سريع للكتابة",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "خطوات عملية: Prompt ثم Draft ثم تعديل. لو مستعجل، تخطى الفيديو وابدأ بالمهمة التطبيقية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "مثال بصري",
    title: "شكل Draft قبل وبعد التعديل",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: aiWritingScreenshot,
      alt: "لقطة توضح كتابة مسودة بالذكاء الاصطناعي ثم تعديلها يدويًا",
      caption:
        "الخلاصة من المثال: استخدم AI لتسريع البداية، لكن النسخة النهائية لازم تعدي على تعديلك الشخصي.",
      label: "ai-writing.jpg",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "اختيار أفضل أسلوب كتابة",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m4-l3-ai-writing-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "عايز تكتب فيديو قصير بصوتك الحقيقي بمساعدة AI. أنهي اختيار هو الأدق؟",
          options: [
            "أطلب نص كامل وأنشره كما هو لتوفير الوقت",
            "أكتب Context واضح، آخذ Draft، ثم أعدل ٣ سطور على الأقل بطريقتي",
            "أستخدم AI لتصحيح علامات الترقيم فقط من غير أي مسودة",
          ],
          correctIndex: 1,
          explanation:
            "ده الأسلوب اللي يوازن السرعة مع الحفاظ على شخصيتك في الكتابة.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمة تطبيق",
    title: "اكتب Draft بالـ AI ثم عدّل ٣ سطور",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة فيها خطوتين واضحين: مسودة من AI، وبعدها تعديل بشري منك على ٣ سطور عشان تبان شخصيتك.",
      prompt:
        "نفّذ وسلّم بالشكل ده:\n\n١) اكتب البرومبت اللي استخدمته كامل\n٢) انسخ مسودة AI كما هي\n٣) اكتب ٣ سطور عدلتهم بنفسك\n٤) اشرح في سطرين ليه التعديلات دي خلت النص أقرب لصوتك",
      buttonLabel: "انسخ المهمة",
      copiedLabel: "اتنسخت",
      template:
        "البرومبت:\n[اكتب النص]\n\nمسودة AI:\n[انسخ المسودة]\n\nالتعديلات البشرية (٣ سطور):\n١) قبل:\nبعد:\n\n٢) قبل:\nبعد:\n\n٣) قبل:\nبعد:\n\nليه التعديلات دي شبه صوتي:\n[سطرين]",
      rubric: [
        {
          label: "جودة الـ Context",
          weight: 40,
          criteria: ["البرومبت فيه جمهور وهدف ونبرة واضحة."],
        },
        {
          label: "التعديل الشخصي",
          weight: 60,
          criteria: ["٣ تعديلات فعلية واضحة مع سبب مقنع."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "قفلة واثقة",
    title: "إنت المتحكم في النص النهائي",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "AI يفتحلك البداية بسرعة، وإنت اللي بتدي النص روحك الحقيقية.",
        "كل مرة تعدّل بوعي، صوتك يبقى أوضح وثقتك في الكتابة تزيد.",
      ],
    },
  },
];
