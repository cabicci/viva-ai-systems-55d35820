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
import automatorM6ClosingLoopScreenshot from "@/assets/lessons/unique/automator-m7-l1-closing-loop.jpg";

/** Automator · M7 · Closing the Loop (v3: Lesson Shape pilot) */
export const AUTOMATOR_M7_L1_CLOSING_LOOP_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ أوتوميشنات منفصلة قوية — لكن لما تتربط في رحلة عميل واحدة بتبقى نظام.",
        "ليه دلوقتي؟ بعد lead capture وواتساب ومتابعة، محتاج تشوف الصورة الكاملة مش كل جزء لوحده.",
        "هتعمل إيه بعد الدرس؟ هترسم رحلة end-to-end من lead لحد follow-up.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "كل حاجة شغّالة — بس مافيش صورة كاملة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "عندك فورم يستقبل leads. واتساب بيرد. متابعة بترسل رسائل. كل واحد شغّال.",
        "بس ماتعرفش: إيه القناة اللي بيجيب leads أحسن؟ إيه رسالة المتابعة اللي بتفتح ردود؟ فين بيتعطل العميل؟",
        "أوتوميشنات منفصلة بدون ربط = شغل كتير بدون تعلّم. الربط يولّد بيانات — والبيانات تدخلك Analyst.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "رحلة واحدة = Lead → رد → متابعة → بيانات",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Lead capture: يمسك الاهتمام ويسجّله.",
        "WhatsApp / رد فوري: يخدم العميل بثقة.",
        "Follow-up: يكمل المحادثة لو سكت.",
        "كل خطوة تسجّل: مصدر، وقت، قناة، رد، تحويل. ده اللي Analyst هيقرأه.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "جزر منفصلة vs رحلة متصلة",
    block: {
      kind: "comparison",
      left: {
        label: "أوتوميشنات منفصلة",
        body: "فورم شغّال، واتساب شغّال، متابعة شغّالة — بس مافيش خريطة. «إيه اللي نفع؟» — مافيش إجابة.",
      },
      right: {
        label: "رحلة عميل واحدة",
        body: "Lead من إعلان → تسجيل → رد واتساب → متابعة يوم ٢ و٥ → تحويل أو إغلاق. كل خطوة مسجّلة — تقدر تسأل وتتحسّن.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للربط",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Customer Journey (رحلة العميل)",
          meaning: "المسار الكامل من أول اهتمام لحد متابعة أو شراء — مش خطوة واحدة.",
          example: "إعلان → فورم → ترحيب → متابعة → مكالمة مبيعات.",
        },
        {
          term: "Feedback Loop (حلقة تحسين)",
          meaning: "البيانات اللي الأوتوميشن يسجّلها ترجع تقولك إيه يتحسّن.",
          example: "«متابعة يوم ٢ على واتساب فتحت ٤٠٪ رد — يوم ٥ إيميل فتح ١٠٪».",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — من Automator لـ Analyst",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "ملخّص رحلة Automator وإزاي البيانات بتجهّزك لمسار Analyst. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "لقطة بصرية",
    title: "الرحلة من Lead للمتابعة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM6ClosingLoopScreenshot,
      alt: "مخطط يوضح رحلة عميل متصلة من lead capture للمتابعة.",
      caption:
        "كل مرحلة تغذّي اللي بعدها وتسجّل بيانات. الرحلة المتصلة = أسئلة Analyst هيجاوب عليها.",
      label: "automator-m7-l1-closing-loop",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m7-l1-closing-loop-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "عندك leads من ٣ قنوات ومتابعة شغّالة — بس مش عارف أنهي قناة بتجيب عملاء يشتروا. أحسن سؤال تسأله للبيانات؟",
          options: [
            "كام lead وصل النهاردة؟",
            "أنهي قناة جابت leads اشتروا بأعلى نسبة؟",
            "مين الموظف اللي رد على أكتر رسائل؟",
          ],
          correctIndex: 1,
          explanation:
            "الرحلة المتصلة بتخليّك تسأل أسئلة قرار — مش عدّ بس. القناة + التحويل = Analyst.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "ارسم رحلة lead → follow-up",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة خريطة رحلة — مش audit تقني. اربط اللي اتعلّمته: استقبال، رد، متابعة — في مسار عميل واحد.\n\nمش مطلوب أرقام حقيقية — مطلوب ٥–٦ مراحل + سؤال Analyst واحد.",
      prompt:
        "في تسليمك اكتب:\n\n١) من فين بيجي الـ lead؟ [قناة]\n٢) مرحلة ١: [استقبال + إيه بيتسجّل]\n٣) مرحلة ٢: [رد فوري / واتساب]\n٤) مرحلة ٣: [متابعة — كام خطوة]\n٥) مرحلة ٤: [تحويل أو إغلاق]\n٦) سؤال واحد لـ Analyst هتسأله على البيانات:\n\n+ جملة: إيه اللي كان ناقص قبل ما تربط الرحلة؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "مصدر الـ lead:\n[…]\n\nمرحلة ١ — استقبال:\n[…]\n\nمرحلة ٢ — رد:\n[…]\n\nمرحلة ٣ — متابعة:\n[…]\n\nمرحلة ٤ — نهاية:\n[…]\n\nسؤال Analyst:\n[…]\n\nاللي كان ناقص:\n[جملة واحدة]",
      rubric: [
        {
          label: "رحلة متصلة",
          weight: 60,
          criteria: ["٥ مراحل مربوطة — مش أوتوميشنات منفصلة."],
        },
        {
          label: "جسر Analyst",
          weight: 40,
          criteria: ["سؤال قرار واحد مبني على بيانات الرحلة."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت Automator",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ أوتوميشنات مربوطة = رحلة عميل + بيانات للتحسين.",
        "تقدر تعمل إيه؟ عندك خريطة end-to-end من lead لحد follow-up.",
        "اللي جاي: مسار Analyst — تقرأ البيانات اللي نظامك بقى يولّدها وتاخد قرارات أحسن.",
      ],
    },
  },
];
