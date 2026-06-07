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
import ideaToPageScreenshot from "@/assets/lessons/builder-m6-l1-idea-to-page.jpg";

/** Builder · M6 · Lesson 01 — Idea to Page (v3: Lesson Shape pilot) */
export const BUILDER_M6_IDEA_TO_PAGE_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ أي فكرة AI تقدر تتبني كشاشات + خطوات — قبل أي كود.",
        "ليه دلوقتي؟ Phase 3 البناء يبدأ بخريطة — مش بألوان ولا features عشوائية.",
        "هتعمل إيه بعد الدرس؟ هترسم flow من ٣ شاشات — بداية، وسط، نهاية.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "فكرة جامدة — وصفحة بيضا",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "عندك فكرة AI عظيمة — بس لما تفتح أداة البناء، مش عارف أول خطوة إيه.",
        "تبدأ بالألوان؟ ولا بالـ model؟ ولا بالـ prompt؟ — وتضيع ساعات.",
        "المشكلة مش الأداة. المشكلة إن الفكرة لسه مش مترجمة لرحلة العميل.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "الفكرة = شاشات + خطوات",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أي تطبيق AI = رحلة: العميل يفتح → يعمل حاجة → يوصل لهدف.",
        "كل خطوة = شاشة. ٣ شاشات كفاية للبداية: بداية، وسط، نهاية.",
        "قبل الألوان والكود: ارسم «العميل يمشي إزاي».",
        "User Flow = الخريطة. الشاشات = البيوت على الخريطة.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "تصميم شكل vs رحلة العميل",
    block: {
      kind: "comparison",
      left: {
        label: "تبدأ بالشكل",
        body: "«عايز AI يخطط رحلات» → تصمّم شات حلو. بعد ساعتين: مش عارف العميل يبدأ منين — بلد؟ ميزانية؟",
      },
      right: {
        label: "تبدأ بالرحلة",
        body: "«يفتح → يكتب «إيطاليا ٥ أيام» → AI يسأل ميزانية → يعرض خطة» — ٣ خطوات = ٣ شاشات. واضح.",
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
          term: "User Flow (رحلة المستخدم)",
          meaning: "الخطوات اللي العميل بيمشيها عشان يوصل لهدفه.",
          example: "يفتح → يكتب سؤال → ياخد إجابة. ٣ خطوات.",
        },
        {
          term: "Screen (شاشة)",
          meaning: "كل خطوة في الرحلة = شاشة واحدة في التطبيق.",
          example: "شاشة ١: مربع كتابة. شاشة ٢: AI يسأل. شاشة ٣: النتيجة.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — من فكرة لخريطة",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي فكرة AI تترجم لـ User Flow وشاشات. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "رحلة بسيطة — ٣ خطوات",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: ideaToPageScreenshot,
      alt: "صفحة curriculum — خريطة تعلّم مع مسارات ومراحل.",
      caption:
        "أي صفحة = هدف واحد + خطوات واضحة. المستخدم يدخل → يشوف الخريطة → يختار. نفس المنطق لتطبيقك.",
      label: "فكرة → شاشات",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m6-l1-idea-to-page-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "بتعمل AI يخطط تمارين رياضية. إيه أهم أول خطوة؟",
          options: [
            "ترسم User Flow: من «يحدد هدفه» لحد «ياخد الخطة».",
            "تختار أحسن AI model.",
            "تصمّم شكل شاشة النتيجة.",
          ],
          correctIndex: 0,
          explanation:
            "الرحلة الأول — لما تعرف الخطوات، تعرف الشاشات والأسئلة اللي AI محتاج يسألها.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "ارسم flow من ٣ شاشات",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي تخطيط — مش كود. ورقة وقلم أو notes.\n\n٥–١٠ دقايق كفاية.",
      prompt:
        "في تسليمك اكتب:\n\n١) الفكرة (جملة):\n\n٢) ٣ شاشات:\n   - شاشة ١ (بداية): العميل يشوف إيه؟ يعمل إيه؟\n   - شاشة ٢ (وسط): إيه اللي بيحصل؟\n   - شاشة ٣ (نهاية): إيه الهدف اللي وصله؟\n\n٣) سهم بين كل شاشة: «بعد ما يعمل X → يروح لـ Y»",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "الفكرة:\n[ ]\n\nشاشة ١ (بداية):\nيشوف: [ ]\nيعمل: [ ]\n\nشاشة ٢ (وسط):\nيشوف: [ ]\nيعمل: [ ]\n\nشاشة ٣ (نهاية):\nيشوف: [ ]\nالهدف: [ ]\n\nالأسهم:\n١→٢: [ ]\n٢→٣: [ ]",
      rubric: [
        {
          label: "٣ شاشات منطقية",
          weight: 60,
          criteria: [
            "بداية → وسط → نهاية — مش عشوائية.",
            "كل شاشة فيها «يشوف» و«يعمل».",
          ],
        },
        {
          label: "هدف واضح",
          weight: 40,
          criteria: [
            "شاشة ٣ فيها نتيجة — مش «نهاية مفتوحة».",
            "الأسهم تربط الخطوات.",
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
        "فهمت إيه؟ الفكرة = شاشات + خطوات. User Flow قبل الألوان.",
        "تقدر تعمل إيه؟ عندك flow من ٣ شاشات — جاهز للـ wireframe.",
        "اللي جاي: Wireframe — ليه الرسمة الكروكي بتمنع اللخبطة.",
      ],
    },
  },
];
