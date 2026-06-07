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

/** Analyst · M4 · Automated Dashboard — لوحة أوتوماتيك (v3: Lesson Shape pilot) */
export const ANALYST_M4_AUTOMATED_DASHBOARD_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ الـ Dashboard الأوتوماتيك يوفر وقت جمع البيانات — بس بس لو عارف إيه الأرقام اللي مهمة.",
        "ليه دلوقتي؟ بعد ما حدّدت ٤ أرقام قرار، الخطوة الجاية إن واحد منهم يتجمّع أوتوماتيك.",
        "هتعمل إيه بعد الدرس؟ هتختار رقم واحد للأتمتة: مصدر، تكرار تحديث، تخزين، وإيه الـ AI يلخّص.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "أتمتة كل حاجة — ومفيش قرار",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بنيت لوحة فيها ٢٠ رسم — بس مش عارف أي رقم يهمك فعلًا.",
        "الأتمتة بدون قرار = دوشة أسرع. بتجمع أرقام من غير ما تعرف «إذًا هعمل…».",
        "الـ AI يلخّص بعد ما الأرقام توصل — إنت تحدّد الرقم الواحد اللي يستاهل الأتمتة الأول.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "يدوي الأول — أوتوماتيك تاني — رقم واحد = فوز",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "القاعدة: اجمع الرقم يدوي أسبوعين — لو قرأته واتخذت قرار، أتمته.",
        "Stack بسيط: Google Sheets (تخزين) + Looker Studio (عرض) + n8n اختياري (ربط مصادر).",
        "رقم واحد أوتوماتيك = فوز — مش ١٠. مثال: leads الأسبوع ده من فورم → Sheet → Dashboard.",
        "بعد ما الرقم يوصل: الـ AI يلخّص «إيه اللي اتغيّر؟» — إنت تاخد القرار.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "٢٠ رسم أوتوماتيك vs رقم واحد مهم",
    block: {
      kind: "comparison",
      left: {
        label: "أتمتة كل حاجة",
        body: "لوحة مليانة رسوم — بتفتحها وتقفلها. الكتير = صفر قرار.",
      },
      right: {
        label: "رقم واحد أوتوماتيك",
        body: "Leads الأسبوع ده يتحدّث لوحده — كل أحد تقرأه وتقرّر في ٥ دقايق.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للأتمتة",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Manual First (يدوي الأول)",
          meaning: "اجمع الرقم بإيدك قبل الأتمتة — عشان تتأكد إنه يخدم قرار.",
          example: "أسبوعين تكتب leads في Sheet — بعدين تربط الفورم.",
        },
        {
          term: "Update Frequency (تكرار التحديث)",
          meaning: "كل قد إيه الرقم يتحدّث — يومي، أسبوعي، لحظي.",
          example: "Leads أسبوعي كفاية — مش كل دقيقة.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — أتمتة رقم واحد",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تؤتمت رقم واحد في الـ Dashboard — Sheets + Looker + AI للتلخيص. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "٤ أرقام — واحد أوتوماتيك",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "four-kpi-dashboard",
      label: "لوحة ٤ KPI",
      caption:
        "Leads · Conversion · Revenue · Retention — ابدأ بأتمتة واحد بس. استخدم الرسم في المهمة.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "analyst-m4-automated-dashboard-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "عندك ٤ أرقام في الـ Dashboard — أحسن خطوة أولى للأتمتة؟",
          options: [
            "تؤتمت الرقم اللي بتقرأه كل أسبوع وتاخد عليه قرار — بعد ما جمعته يدوي أسبوعين.",
            "تؤتمت الـ ٤ أرقام مرة واحدة قبل ما تجرب يدوي.",
            "تبني ١٠ رسوم إضافية في Looker Studio.",
          ],
          correctIndex: 0,
          explanation:
            "Manual first — رقم واحد يخدم قرار. الأتمتة بعد ما تتأكد إنه مهم.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "صمّم أتمتة لرقم واحد",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي تصميم — مش بناء كامل لازم. اختار رقم واحد، حدّد المصدر والتكرار والتخزين، واكتب إيه الـ AI يلخّص.\n\n١٠–٢٠ دقيقة كفاية.",
      prompt:
        "في تسليمك اكتب:\n\n١) الرقم الواحد (Metric + ليه دول):\n٢) المصدر (فورم، كاشير، Sheet، API…):\n٣) تكرار التحديث (يومي / أسبوعي / لحظي):\n٤) التخزين (Google Sheet / Notion / غيره):\n٥) إيه الـ AI يلخّص بعد ما الرقم يوصل (Prompt أو سؤال واحد):",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "الرقم:\n[Metric — مثال: Leads الأسبوع]\n\nالمصدر:\n[من فين ييجي — فورم، كاشير…]\n\nتكرار التحديث:\n[يومي / أسبوعي / لحظي]\n\nالتخزين:\n[Google Sheet / …]\n\nالـ AI يلخّص:\n[سؤال أو Prompt — مثال: «قارن بالأسبوع اللي فات واقترح قرار واحد»]\n\nأداة العرض (اختياري):\n[Looker Studio / …]",
      rubric: [
        {
          label: "رقم + مصدر",
          weight: 50,
          criteria: ["رقم واحد واضح + مصدر محدد."],
        },
        {
          label: "تخزين + AI",
          weight: 50,
          criteria: ["تكرار + تخزين + سؤال/تلخيص AI عملي."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت الأتمتة",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ الأتمتة توفر وقت جمع — بس الرقم لازم يخدم قرار. الـ AI يلخّص بعد ما الأرقام توصل.",
        "تقدر تعمل إيه؟ عندك تصميم أتمتة لرقم واحد جاهز للتطبيق.",
        "اللي جاي: Weekly Review Ritual — ٣٠ دقيقة تحوّل الأرقام لقرار ثابت.",
      ],
    },
  },
];
