import {
  Sparkles,
  AlertCircle,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import curriculumScreenshot from "@/assets/lessons/intro-m1-l7-choose-your-path.jpg";

/**
 * Intro · Lesson 07 — اختار مسارك (v3: Lesson Shape pilot · Intro capstone)
 */
export const INTRO_CHOOSE_YOUR_PATH_CONTENT: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ المسارات الخمسة مش سباق شعبية — كل واحد يحل نوع مشكلة مختلف.",
        "ليه دلوقتي؟ خلّصت Intro: فهمت AI، كتبت Prompt، جربت أداة، عرفت حدود الثقة، واختارت الأداة المناسبة. دلوقتي وقت قرار واحد واضح.",
        "هتعمل إيه بعد الدرس؟ هتختار مسار واحد وتشرح ليه — بناءً على هدف حقيقي عندك، مش على اللي يبان «أقوى».",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "عايز تبدأ الـ ٥ مسارات مع بعض؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الحماس بيخليك عايز Business و Creator و Builder وكل حاجة مرة واحدة.",
        "بس ٥ بدايات مفتوحة غالبًا = صفر نتيجة ملموسة. التشتت أخطر من البطء.",
        "القرار الصح: مسار واحد الأول — نتيجة واحدة — وبعدين تضيف مسار تاني لو محتاج.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "اختار المسار اللي يحل مشكلتك — مش اللي يبان أجمل",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "المنصة مرتبة على ٣ مستويات. Intro (اللي خلّصته) = البداية لكل الناس.",
        "المستوى ١ — AI User: Business (تشغّل شغلك أحسن بالـ AI)، Creator (محتوى وجمهور بالـ AI)، Analyst (قرارات أذكى بالأرقام والـ AI).",
        "المستوى ٢ — AI Operator: Automator (شغل متكرر يشتغل لوحده — Leads، متابعة، تقارير).",
        "المستوى ٣ — AI Builder: Builder (تبني أدوات وتطبيقات بالـ AI) — اختياري وعميق. مش الوعد الأساسي للمنصة؛ للي عايز يبني منتج بنفسه.",
        "اسأل نفسك: أكبر مشكلة عايز أحلها الشهرين الجايين؟ المسار اللي يطابقها هو اختيارك.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للخريطة",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Path (مسار)",
          meaning: "مجموعة دروس مركّزة على نوع مهارة واحد — مش لازم تخلص كل المسارات.",
          example: "تبدأ بـ Creator لو مشكلتك محتوى وجمهور.",
        },
        {
          term: "Builder (باني)",
          meaning: "مسار تقني اختياري لبناء تطبيقات وأدوات — للي عايز يغوص أعمق.",
          example: "لو مشكلتك «عندي فكرة تطبيق» — مش لو مشكلتك «عايز بوست أسبوعي».",
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
      caption:
        "٥ مشاكل شائعة — ٥ مسارات. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "تركيز واحد أسرع من حماس خمسة",
    block: {
      kind: "comparison",
      left: {
        label: "كل المسارات مرة واحدة",
        body: "أول درس من كل مسار — وبعد شهر مفيش مشروع ولا محتوى ولا أتمتة واضحة.",
      },
      right: {
        label: "مسار واحد لنتيجة واحدة",
        body: "تختار مسار، تخلص أول موديول، وتطلع بحاجة ملموسة — وبعدين تفكر في التاني.",
      },
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "خريطة المستويات — مش سباق",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: curriculumScreenshot,
      alt: "خريطة المسارات مرتبة حسب المستوى: User ثم Operator ثم Builder",
      caption:
        "فكّرها كخريطة: فوق Intro، تحتها مسارات المستوى ١ (Business، Creator، Analyst)، بعدين Automator، وآخر حاجة Builder للعمق الاختياري. اختيارك = تركيز — مش قفل باقي المسارات.",
      label: "خريطة المسارات",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "intro-m1-l7-choose-your-path-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "منى وقتها بيضيع في رسائل متابعة متكررة كل يوم. أنسب مسار للبداية؟",
          options: ["Automator", "Builder", "Analyst"],
          correctIndex: 0,
          explanation:
            "المهام المتكررة = Automator. Builder للتطبيقات — مش للمتابعة اليومية.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك · ختام Intro",
    title: "اختار مسار واحد وقول ليه",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "دي مهمة اختيار المسار — ختام Intro. اختار مسار واحد: Business أو Creator أو Analyst أو Automator أو Builder.\n\nاكتب ٢–٣ جمل ليه اخترته بناءً على هدف حقيقي عندك. مش مطلوب إجابة مثالية — مطلوب قرار واضح.",
      prompt:
        "في تسليمك اكتب:\n\n١) المسار اللي اخترته:\n٢) ليه اخترته — ٢–٣ جمل مربوطة بهدف حقيقي عندك:\n٣) نتيجة واحدة عايز توصلها في الشهرين الجايين (جملة):",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "١) المسار:\n   [Business / Creator / Analyst / Automator / Builder]\n\n٢) ليه اخترته:\n   [٢–٣ جمل — مربوطة بمشكلة أو هدف حقيقي]\n\n٣) نتيجة الشهرين الجايين:\n   [مثال: ٤ بوستات منظمة / أتمتة متابعة عملاء / قرار مبيعات أوضح]",
      rubric: [
        {
          label: "قرار مبني على هدف",
          weight: 70,
          criteria: ["المسار مربوط بمشكلة أو هدف حقيقي — مش فضول عام."],
        },
        {
          label: "وضوح الاختيار",
          weight: 30,
          criteria: ["٢–٣ جمل توضّح ليه المسار ده أنسب ليك دلوقتي."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت Intro",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ AI أداة عملية — Prompt واضح، تجربة آمنة، ثقة مع مراجعة، وأداة مناسبة لكل مهمة.",
        "تقدر تعمل إيه؟ تختار مسار واحد وتبدأ — من غير خوف ومن غير تشتت.",
        "اللي جاي: افتح مسارك وابدأ أول درس. Intro خلص — رحلتك الحقيقية تبدأ دلوقتي.",
      ],
    },
  },
];
