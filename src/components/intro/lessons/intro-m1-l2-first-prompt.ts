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
import firstPromptScreenshot from "@/assets/lessons/intro-m1-l2-first-prompt.jpg";

/**
 * Intro · Lesson 02 — أول Prompt ليك (v2: Tension-First)
 */
export const INTRO_FIRST_PROMPT_CONTENT: IntroLessonContent = [
  {
    icon: AlertCircle,
    eyebrow: "TENSION",
    title: "كتبت للـ AI «اكتبلي حاجة عن التسويق» — وجالك كلام فاضي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الـ AI مش بيقرا دماغك. بيقرا اللي بتكتبه بالظبط.",
        "المشكلة مش فيه — في إنك مديتوش الـ ٤ حاجات اللي محتاجها عشان يطلّعلك رد ينفع تستخدمه فعلًا.",
        "الدرس ده هيوريك الـ ٤ دول، وبعدها هتحس إن الـ AI اتغيّر معاك ١٠٠٪.",
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
          term: "Prompt",
          meaning: "الرسالة اللي بتكتبها للـ AI عشان يعمل لك حاجة.",
          example: "«اكتبلي بوست فيسبوك عن طقم السكاكين ده» — دي Prompt.",
        },
        {
          term: "Role (الدور)",
          meaning: "إنك تقول للـ AI يتقمّص شخصية معينة قبل ما يرد.",
          example: "«إنت محرّر محتوى عربي» → نبرة الرد بتتغيّر كلها.",
        },
        {
          term: "Context (السياق)",
          meaning: "التفاصيل الزيادة اللي بتفهّمه الصورة الكاملة.",
          example: "بدل «اكتب إعلان» → «عندي محل موبايلات في المنصورة وعامل خصم، اكتب إعلان».",
        },
        {
          term: "Format (الشكل)",
          meaning: "إنت عايز الرد يطلع شكله إيه — جدول؟ نقط؟ كام كلمة؟",
          example: "«٥ نقط قصيرة» أو «جدول مميزات vs عيوب» أو «أقل من ١٠٠ كلمة».",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — نفس السؤال بـ prompt ضعيف vs قوي",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption: "مثال حي على الفرق اللي بتعمله الـ ٤ قواعد.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "Quick Win",
    title: "٤ قواعد بتشتغل في ٩٠٪ من الحالات",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "١. **Role** — حدّد الدور: «إنت محرّر محتوى عربي» أو «إنت مدرّس رياضيات للأطفال».",
        "٢. **Context** — اكتب السياق: لو هتطلب CV، قول بتقدّم على إيه. لو هترد على إيميل، الصق الإيميل.",
        "٣. **Task** — فعل واضح: «اكتب»، «لخّص»، «قارن»، «ترجم». مش «شوف» أو «ممكن».",
        "٤. **Format** — اطلب الشكل: «في ٥ نقط»، «في جدول»، «أقل من ١٠٠ كلمة».",
        "**القاعدة الخفيّة:** لو الرد ميعجبكش، متغيّرش الـ AI — غيّر الـ prompt. ٩ من ١٠ مرات المشكلة في السؤال.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "مساعد المنصة بيشتغل بنفس القواعد",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: firstPromptScreenshot,
      alt: "Prompt منظّم بأربع طبقات: Role + Context + Task + Format",
      caption:
        "بنبعت للمساعد: Role («إنت مدرّس Lovable») + Context (الدرس اللي إنت فيه) + Format (إجابة قصيرة بالعربي). نفس الـ ٤ قواعد بالظبط.",
      label: "من الموقع — /ai-assistant",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "نفس السؤال — رد مختلف ١٠٠٪",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — prompt مبهم",
        body: "«اكتبلي حاجة عن التسويق». الرد: ٥٠٠ كلمة عمومية مفيش زاوية ولا جمهور ولا هدف. هتحذفه.",
      },
      right: {
        label: "RIGHT — ٤ قواعد",
        body: "«إنت محرّر محتوى (Role). بافتح كافيه جديد في القاهرة (Context). اكتبلي ٣ أفكار بوست إنستجرام (Task)، كل واحد ٣ سطور + Hashtag (Format).» الرد ينفع تنشره فورًا.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "اختبر فهمك",
    title: "٣ مواقف من حياة الناس",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "intro-m1-l2-first-prompt-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "ولاء كتبت للـ AI: «لخّصلي كتاب فن اللامبالاة». الرد المتوقع؟",
          options: [
            "رد طويل ومش منظم. الأحسن تحدد Role + جمهور + Format المطلوب.",
            "رد ممتاز على طول عشان الكتاب مشهور.",
            "هيرفض يلخّص عشان الطلب مش واضح.",
          ],
          correctIndex: 0,
          explanation: "ناقص Role + Format. لازم تقول «إنت صانع محتوى إنستجرام، لخّص في ٥ نقط قصيرة».",
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "أحمد كتب: «اكتب إيميل لشغل جديد». إيه أهم حاجة ناقصة؟",
          options: [
            "Context — مين أحمد، الوظيفة إيه، الإيميل ده ليه.",
            "Role بس.",
            "Format بس.",
          ],
          correctIndex: 0,
          explanation: "الـ AI ميعرفش حياة أحمد. لازم سياق + مهمة واضحة.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "هند كتبت: «قارن بين مكنتين القهوة دول». أحسن إضافة؟",
          options: [
            "Role («خبير أجهزة مطبخ») + Format (جدول مميزات/عيوب + ترشيح).",
            "تطلب منه يختار من غير مقارنة.",
            "تطلب الأسعار بس.",
          ],
          correctIndex: 0,
          explanation: "Role + Format بيحوّل الرد من كلام عام لقرار قابل للتنفيذ.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "Mission — prompt واحد بالـ ٤ قواعد",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "اختار حاجة محتاجها فعلًا (إيميل، بوست، تلخيص…) واكتب prompt واحد فيه الـ ٤ قواعد.",
      prompt:
        "في تسليمك اكتب:\n\n١) الـ Prompt الكامل — وعلّم: [Role] [Context] [Task] [Format]:\n٢) الرد اللي جالك (لخّصه في سطر):\n٣) الفرق لو كنت كتبت السؤال بدون قواعد — في جملة:",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "الـ ٤ قواعد",
          weight: 70,
          criteria: ["الـ Prompt فيه فعلًا Role + Context + Task + Format معلّمين."],
        },
        {
          label: "الفرق ملموس",
          weight: 30,
          criteria: ["وصف الفرق محدّد (وضوح/تنظيم/فايدة)."],
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "جزء من المنصة",
    title: "نفس الـ ٤ قواعد بنكتب بيها scripts المنصة",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل فيديو في المنصة بدأ بـ prompt على الـ ٤ قواعد",
      summary:
        "الفيديوهات اللي بتشوفها هنا اتكتبت بـ prompts على Role + Context + Task + Format. عشان كده كلها بنفس النبرة وقصيرة ومركّزة.",
      bullets: [
        "Role: «إنت مدرّس مصري بيشرح لمبتدئ».",
        "Context: «الدرس عنوانه كذا، المتعلم لسه شاف اللي قبله».",
        "Task + Format: «script ٣٠ ثانية، ٣ فقرات، جملتين كل واحدة، عامية مصرية».",
      ],
      pathAngle: "creator",
    },
  },
];
