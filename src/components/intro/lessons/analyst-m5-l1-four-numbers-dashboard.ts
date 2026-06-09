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

/** Analyst · M5 · L1 — Four Numbers Dashboard (v3: Lesson Shape pilot) */
export const ANALYST_M5_L1_FOUR_NUMBERS_DASHBOARD_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ الـ Dashboard (شاشة فيها أهم الأرقام) المفيد يبدأ بأرقام قرار قليلة — مش ٥٠ رسم.",
        "ليه دلوقتي؟ في الموديول اللي فات كل استنتاج بقى له Action (خطوة أو تصرف حصل فعلًا). دلوقتي محتاج ٤ أرقام تلخّص «هل شغلي ماشي؟» كل أسبوع.",
        "هتعمل إيه بعد الدرس؟ هترسم Dashboard من ٤ أرقام لمشروعك أو شغلك.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "Dashboard فيه ٢٠ رقم — ومفيش قرار",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بتفتح Sheet أو أداة فيها charts كتير — بتقعد ١٠ دقايق — وتقفل من غير ما تعرف «إيه اللي محتاج أعمله؟»",
        "المشكلة مش نقص بيانات — المشكلة زحمة. كل رقم إضافي بيأخّر القرار.",
        "الـ Dashboard (شاشة فيها أهم الأرقام) مش عشان تبان محترف — عشان في ثواني تعرف: في مشكلة ولا لأ؟",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "٤ أرقام قرار — مش ٤٠ metric",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "اختار ٤ أرقام بس — لو واحد فيهم اتغيّر، قرارك يتغيّر. مش أي رقم «حلو يتعرض».",
        "كل رقم جنبه: قيمة الأسبوع ده، الأسبوع اللي فات، وسهم (↑/↓) — عشان المقارنة جزء من العرض.",
        "بيزنس: Leads (ناس أبدت اهتمام وممكن تبقى عميل) · Conversion · Revenue · Retention (الناس كملت ورجعت تاني). مش بيزنس: Progress · Responses · Results · Repeat.",
        "لو عندك أكتر من ٤ — اسأل: «لو شلت ده، هقرّر إزاي؟» اللي مش بيجاوب = مش dashboard.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "٢٠ رقم vs ٤ أرقام قرار",
    block: {
      kind: "comparison",
      left: {
        label: "Dashboard مليان",
        body: "١٥ chart — views، clicks، time on page، bounce… بتفتحه وتقفله. نهاية الأسبوع: «حاسس إن في حاجة غلط» بس مش عارف إيه.",
      },
      right: {
        label: "٤ أرقام واضحة",
        body: "Leads ١٢٠ (↑) · Conversion ٨٪ (↓) · Revenue ١٥k (↑) · Retention (الناس كملت ورجعت تاني) ٣٠٪ (↓). في ثانية: Conversion و Retention محتاجين قرار.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للـ Dashboard",
    block: {
      kind: "concepts",
      items: [
        {
          term: "KPI (مؤشر قرار)",
          meaning: "رقم محدّد — لو اتغيّر، قرارك يتغيّر.",
          example: "Conversion % — لو نزل، محتاج تراجع خطوة البيع.",
        },
        {
          term: "Threshold (حد قرار)",
          meaning: "الرقم اللي لو عدّاه — لازم Action (خطوة أو تصرف حصل فعلًا).",
          example: "لو Retention (الناس كملت ورجعت تاني) نزل عن ٣٥٪ → اجتماع متابعة عملاء.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — ٤ أرقام بس",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تختار ٤ أرقام بتلخّص شغلك — وتقرأهم كل أسبوع.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "Dashboard أسبوعي من ٤ خانات",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "four-kpi-dashboard",
      label: "Four KPI Dashboard",
      caption:
        "٤ أرقام — كل واحد: الأسبوع ده، اللي فات، والسهم. لو واحد أحمر، تعرف فين القرار.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "analyst-m5-l1-four-numbers-dashboard-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "Leads زادت ٢٠٪ — Conversion نزل من ١٢٪ لـ ٨٪ — Revenue ثابت. إيه أول رقم تركّز عليه في الـ ٤؟",
          options: [
            "Leads — لأنها زادت.",
            "Conversion — لأنه نزل رغم زيادة الطلبات، وده بيأثّر على Revenue.",
            "Revenue — لأنه ثابت فمفيش مشكلة.",
          ],
          correctIndex: 1,
          explanation:
            "Leads و Conversion مع بعض يوضّحوا الصورة. Conversion نزل = مشكلة في التحويل — ده رقم قرار.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "ارسم Dashboard من ٤ أرقام",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي تصميم عملي — مش ديكور. اختار ٤ أرقام لمشروعك أو شغلك واكتبهم في شكل dashboard بسيط (Sheet، Notion، ورقة).\n\nمش مطلوب أداة معقّدة — مطلوب ٤ أرقام تقدر تقراهم كل أسبوع وتقرّر.",
      prompt:
        "في تسليمك اكتب:\n\n١) المشروع/الشغل اللي الـ Dashboard ليه:\n٢) الأربع أرقام (Metric + ليه اخترته):\n٣) لكل رقم: قيمة الأسبوع ده · الأسبوع اللي فات · Threshold:\n٤) لو رقم واحد طلع أحمر — إيه القرار؟\n٥) لينك أو وصف بسيط لشكل الـ Dashboard:",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "المشروع:\n[إيه الشغل]\n\n٤ أرقام:\n1. [Metric] — ليه:\n2.\n3.\n4.\n\nقيم + Threshold:\n[لكل رقم: ده · فات · حد]\n\nقرار لو أحمر:\n[action واحد]\n\nشكل الـ Dashboard:\n[وصف أو لينك]",
      rubric: [
        {
          label: "تركيز واختيار",
          weight: 50,
          criteria: [
            "أربع أرقام بالظبط — كل واحد مبرّر.",
            "كل رقم مربوط بقرار محتمل.",
          ],
        },
        {
          label: "مقارنة وThreshold",
          weight: 50,
          criteria: [
            "في قيمة الأسبوع ده واللي فات.",
            "في Threshold أو حد قرار لكل رقم.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت الـ Dashboard",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ Dashboard مفيد = ٤ أرقام قرار تقراهم كل أسبوع — مش زحمة charts.",
        "تقدر تعمل إيه؟ عندك ٤ أرقام تبدأ بيهم أي مراجعة أسبوعية.",
        "اللي جاي: Automated Dashboard — خلّي رقم واحد من الأربعة يتحدّث لوحده.",
      ],
    },
  },
];
