import {
  Sparkles,
  AlertCircle,
  PlayCircle,
  Lightbulb,
  Scale,
  Rocket,
  BookOpen,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import wireframeImg from "@/assets/lessons/unique/builder-m6-l2-wireframe.jpg";

/** Builder · M6 · Lesson 02 — Wireframe (v3: Lesson Shape pilot) */
export const BUILDER_M6_WIREFRAME_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ Wireframe = رسمة كروكي قبل البناء — بتمنع اللخبطة.",
        "ليه دلوقتي؟ عندك User Flow — دلوقتي حوّله لبوكسات على ورقة.",
        "هتعمل إيه بعد الدرس؟ هتوصف أو ترسم ٣ شاشات — بوكسات وأسامي، من غير ألوان.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "«ابنيلي واجهة» — ويطلع أي كلام",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بتطلب من AI يبنيلك واجهة — ويطلعلك حاجة عامة مش اللي في دماغك.",
        "تعدّل ٥ مرات. كل مرة تخمين جديد. ٣ ساعات ضاعت.",
        "المشكلة: ما رسمتش الخريطة الأول. AI بيخمّن — إنت اللي لازم توضّح.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "الرسمة الكروكي بتمنع اللخبطة",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Wireframe = مربعات + أسماء — من غير ألوان ولا صور.",
        "هدفه يجاوب: إيه في أول الشاشة؟ فين الزرار الرئيسي؟ إيه ترتيب الأقسام؟",
        "ورقة وقلم في ١٠ دقايق > ٣ ساعات تعديل على واجهة غلط.",
        "لما توصف Wireframe لـ AI — النتيجة قريبة من دماغك من أول مرة.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "«ابنيلي واجهة» vs «عندي ٧ بوكسات»",
    block: {
      kind: "comparison",
      left: {
        label: "من غير Wireframe",
        body: "«ابنيلي واجهة AI وصفات» — AI يخمّن. ٥ محاولات. لسه مش مظبوط.",
      },
      right: {
        label: "مع Wireframe",
        body: "«هيدر + مربع نص + زرار «اقترح» + ٣ كروت وصفات» — AI يبني اللي وصفته. أقرب من أول مرة.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للبداية",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Wireframe",
          meaning: "رسم كروكي — بوكسات بأسامي، من غير تصميم.",
          example: "مربع مكتوب فيه «مربع كتابة» + مستطيل «زرار إرسال».",
        },
        {
          term: "CTA (Call to Action)",
          meaning: "أهم زرار — اللي العميل المفروض يدوس عليه.",
          example: "«ابدأ المحادثة» أو «اقترح وصفة» — واضح وكبير.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — من بوكسات لواجهة",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي Wireframe بسيط يتحوّل لوصف واضح لأداة البناء. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "بوكسات — مش ألوان",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: wireframeImg,
      alt: "Wireframe مرسوم بقلم — هيدر، كارتين، أيقونات.",
      caption:
        "مربعات + أسماء. «هيدر»، «مربع نص»، «زرار»، «٣ كروت». ده اللغة اللي AI يفهمها.",
      label: "Wireframe",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m6-l2-wireframe-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "بتعمل Wireframe ولقيت نفسك بترسم ألوان وصور أطباق. ده صح؟",
          options: [
            "لأ — Wireframe بوكسات وأسامي بس، من غير تصميم.",
            "أيوه — كده AI يفهم أحسن.",
            "لأ — كان المفروض صور حقيقية.",
          ],
          correctIndex: 0,
          explanation:
            "Wireframe = هيكل وترتيب. الألوان والصور جاية بعدين.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "ارسم أو اوصف ٣ شاشات",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي رسم أو وصف — مش كود. استخدم الـ ٣ شاشات من الدرس اللي فات.\n\n١٠–١٥ دقيقة.",
      prompt:
        "في تسليمك، لكل شاشة من الـ ٣، اكتب Wireframe كقايمة:\n\n**شاشة ١:**\n- [قسم]: [إيه جواه]\n- [قسم]: [إيه جواه]\n- CTA: [أهم زرار]\n\n**شاشة ٢:**\n...\n\n**شاشة ٣:**\n...\n\n(ممكن ترسم صورة وترفقها — أو وصف نقطي كفاية)",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "شاشة ١:\n- هيدر: [ ]\n- قسم رئيسي: [ ]\n- CTA: [ ]\n\nشاشة ٢:\n- [ ]: [ ]\n- [ ]: [ ]\n- CTA: [ ]\n\nشاشة ٣:\n- [ ]: [ ]\n- [ ]: [ ]\n- CTA: [ ]",
      rubric: [
        {
          label: "٣ شاشات موصوفة",
          weight: 60,
          criteria: [
            "كل شاشة قائمة نقط — مش فقرة سايحة.",
            "فيه CTA واضح في كل شاشة.",
          ],
        },
        {
          label: "بوكسات مش تصميم",
          weight: 40,
          criteria: [
            "مفيش ألوان ولا fonts — أسماء أقسام بس.",
            "الترتيب منطقي — أهم حاجة الأول.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت البداية",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ Wireframe = رسمة كروكي بتمنع اللخبطة — قبل أي prompt.",
        "تقدر تعمل إيه؟ عندك ٣ شاشات موصوفة — جاهزة لأول prompt.",
        "اللي جاي: أول prompt لـ Lovable — goal + users + pages + style + constraints.",
      ],
    },
  },
];
