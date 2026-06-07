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
import backendScreenshot from "@/assets/lessons/builder-m5-l3-backend-api.jpg";

/** Builder · M5 · Lesson 03 — Backend & API (v3: Lesson Shape pilot) */
export const BUILDER_M5_BACKEND_API_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ الـ API بتوصّل اللي العميل يشوفه بالشغل اللي بيحصل ورا.",
        "ليه دلوقتي؟ من غير «ساعي بريد» بين الواجهة والكواليس — مفيش تطبيق يشتغل.",
        "هتعمل إيه بعد الدرس؟ هترسم خريطة: زرار → إيه اللي بيحصل في الكواليس.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "بتدوس «إرسال» — ومفيش حاجة بتحصل",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الزرار شغّال. الشاشة بتحمّل. بس الرد مش بيوصل — أو بيطلع خطأ.",
        "الواجهة عملت شغلها: أخدت كلامك ودوس «إرسال». بس مفيش حد يربطها بالكواليس.",
        "الـ API = الجرسون — بينقل الطلب من الترابيزة للمطبخ ويرجّع الأكل.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "الـ API بتوصّل اللي ظاهر بالشغل المخفي",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "العميل بيكتب في الواجهة ويدوس زرار — ده اللي يشوفه.",
        "الكواليس بتستقبل الطلب، تكلّم AI، وترجّع الرد — ده اللي مش يشوفه.",
        "الـ API = اللغة اللي بينقل الطلب والرد بين الاتنين.",
        "كل زرار في تطبيقك = طلب API واحد على الأقل.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "منيو بدون جرسون vs مطعم شغّال",
    block: {
      kind: "comparison",
      left: {
        label: "من غير API",
        body: "العميل يكتب على المنيو — بس مفيش حد يوصّل الطلب للمطبخ. المنيو حلو — بس مفيش أكل.",
      },
      right: {
        label: "مع API",
        body: "العميل يطلب → الجرسون ياخد الطلب → المطبخ يطبخ → الجرسون يرجّع الأكل. كل خطوة مربوطة.",
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
          term: "Backend (الكواليس)",
          meaning: "المكان اللي التطبيق بيفكّر فيه — بيستقبل، يكلّم AI، ويرجّع.",
          example: "لما تدوس «إرسال»، الكواليس هي اللي بتبعت السؤال للـ AI.",
        },
        {
          term: "API (ساعي البريد)",
          meaning: "اللغة اللي بتنقل الطلبات والردود بين الواجهة والكواليس.",
          example: "زرار «إرسال» → API → الكواليس تكلّم AI → API → الرد يظهر على الشاشة.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — من الزرار للرد",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي طلب واحد بيمشي من الواجهة للكواليس ويرجع. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "زرار → طلب → رد",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: backendScreenshot,
      alt: "واجهة مساعد AI — مربع كتابة وزرار إرسال.",
      caption:
        "أول ما تكتب رسالة وتدوس إرسال: الواجهة تبعت طلب → الكواليس تكلّم AI → الرد يرجع على الشاشة. ده مسار API.",
      label: "مسار الطلب",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m5-l3-backend-api-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "العميل كتب سؤال ودوس Send. أنهي مكون مسؤول عن إنه يكلّم الـ AI؟",
          options: [
            "الواجهة — لأنها اللي العميل بيكتب فيها.",
            "الكواليس — هي اللي بتكلّم AI نيابة عن العميل.",
            "المتصفح بيكلّم AI مباشرة.",
          ],
          correctIndex: 1,
          explanation:
            "الواجهة بتاخد الطلب. الـ API بينقله. الكواليس تكلّم AI.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "ارسم خريطة: زرار → إيه اللي بيحصل؟",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي تخطيط — مش كود. اختار تطبيق AI بتستخدمه.\n\n٥–١٠ دقايق كفاية.",
      prompt:
        "في تسليمك، لكل زرار أو action، اكتب مسار API:\n\n١) «إرسال سؤال»:\n   - الواجهة تعمل إيه؟\n   - الكواليس تعمل إيه؟\n   - إيه اللي يرجع للشاشة؟\n\n٢) «فتح محادثة قديمة»:\n   - الواجهة تعمل إيه؟\n   - الكواليس تعمل إيه؟\n   - إيه اللي يرجع؟\n\n٣) «محادثة جديدة»:\n   - نفس التلاتة",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "١) إرسال سؤال:\nواجهة: [ ]\nكواليس: [ ]\nيرجع: [ ]\n\n٢) فتح محادثة قديمة:\nواجهة: [ ]\nكواليس: [ ]\nيرجع: [ ]\n\n٣) محادثة جديدة:\nواجهة: [ ]\nكواليس: [ ]\nيرجع: [ ]",
      rubric: [
        {
          label: "مسار واضح",
          weight: 60,
          criteria: [
            "كل action فيها ٣ خطوات: واجهة → كواليس → رد.",
            "الكواليس فيها «تكلّم AI» أو «جيب بيانات».",
          ],
        },
        {
          label: "منطقي",
          weight: 40,
          criteria: [
            "الرد على الشاشة مربوط بالطلب.",
            "مفيش خطوة «سحر» من غير تفسير.",
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
        "فهمت إيه؟ الـ API بتوصّل اللي ظاهر بالشغل المخفي — كل زرار = طلب.",
        "تقدر تعمل إيه؟ عندك خريطة button → API action لـ ٣ actions.",
        "اللي جاي: Database — ليه التطبيق محتاج «ذاكرة» يفتكر بيها.",
      ],
    },
  },
];
