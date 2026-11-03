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

/** Business · M3 · Lesson 02 — Strategic / Operational / Admin (v3: Lesson Shape pilot) */
export const BUSINESS_M4_L1_STRATEGIC_OPERATIONAL_ADMIN_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ أصحاب البيزنس بيتعلّقوا لما الإداري والتشغيل ياكلوا الاستراتيجية — والـ AI يخفّف الحمل الإداري.",
        "ليه دلوقتي؟ بعد ما قررت إيه تفوّضه وتؤتمته، لازم تعرف أنواع الشغل عشان توزّع وقتك صح.",
        "هتعمل إيه بعد الدرس؟ هتصنّف ٨ مهام حديثة: استراتيجي / تشغيلي / إداري — وتختار مهمة إدارية واحدة للـ AI.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "أسبوع كامل — ومفيش قرار واحد",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فواتير، ردود، تنسيق، ملفات — نهاية الأسبوع تكتشف إنك ما فكرتش في التسعير ولا العرض ولا التوسّع.",
        "الإداري ضروري — بس لما ياخد ٨٠٪ من الأسبوع، البيزنس بيتحرك ببطء حتى لو إنت «شغال كتير».",
        "الـ AI يساعد أكتر في الإداري: تلخيص، ترتيب، مسودات. الاستراتيجية تحتاج وقت محمي — مش بقايا اليوم.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "٣ أنواع شغل — ولكل نوع دور AI",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Strategic (استراتيجي): اتجاه، تسعير، شراكات، عرض جديد — قرارات نادرة وعالية التأثير. الـ AI شريك تفكير.",
        "Operational (تشغيلي): التوصيل، الجودة، خدمة اليوم — إنت أو الفريق ينفّذ. الـ AI يساعد في SOP وتشخيص مشاكل.",
        "Administrative (إداري): فواتير، جدولة، أرشفة، ردود روتينية — أكتر مرشّح للـ AI يختصر الوقت.",
        "الهدف: تقلّل الإداري عشان الاستراتيجي ياخد بلوك محمي في الأسبوع.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للتصنيف",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Strategic (استراتيجي)",
          meaning: "شغل يحدّد اتجاه البيزنس — مش يومي روتيني.",
          example: "قرار دخول سوق جديد أو تغيير نموذج التسعير.",
        },
        {
          term: "Administrative (إداري)",
          meaning: "شغل يخلّي البيزنس يمشي — بس ما يبنيش قيمة جديدة لوحده.",
          example: "ترتيب ملفات، متابعة فواتير، نسخ بيانات بين شيتات.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — توزيع أنواع الشغل",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "استراتيجي وتشغيلي وإداري — وفين الـ AI يساعد. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "أسبوع إداري vs أسبوع متوازن",
    block: {
      kind: "comparison",
      left: {
        label: "٨٠٪ إداري",
        body: "ردود وفواتير وجدولة. الاستراتيجية «بكرة» — وبكرة ما بيجيش.",
      },
      right: {
        label: "إداري مخفّض بالـ AI",
        body: "AI يلخّص ويصيغ. ساعتين استراتيجية أسبوعيًا — قرار واحد فعلي يتحرك.",
      },
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "توزيع أنواع الشغل",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "soa-bars",
      label: "Strategic · Operational · Admin",
      caption:
        "لو العمود الإداري أطول من الباقي — ابدأ بمهمة إدارية واحدة للـ AI الأسبوع ده.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m3-l2-strategic-operational-admin-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "مراجعة أرقام الشهر وقرار تعديل هامش الربح. ده إيه؟",
          options: [
            "إداري — ترتيب أرقام.",
            "استراتيجي — قرار اتجاه وتسعير.",
            "تشغيلي — توصيل يومي.",
          ],
          correctIndex: 1,
          explanation:
            "مراجعة الأرقام قد تبدأ إدارية — بس قرار الهامش استراتيجي. يستاهل وقت محمي وشريك تفكير.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "صنّف ٨ مهام — واختار إدارية للـ AI",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "اكتب ٨ مهام عملتها آخر أسبوعين (أو بتتكرر). صنّف كل واحدة: استراتيجي / تشغيلي / إداري. اختار مهمة إدارية واحدة الـ AI يخفّفها.\n\nمش امتحان تصنيف — تشخيص وقتك.",
      prompt:
        "في تسليمك اكتب:\n\n١–٨) كل مهمة + تصنيفها:\n٩) المهمة الإدارية اللي اخترتها للـ AI:\n١٠) إزاي الـ AI يساعد (جملة أو جملتين):",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "١) [مهمة] — [استراتيجي/تشغيلي/إداري]\n٢) [...]\n٣) [...]\n٤) [...]\n٥) [...]\n٦) [...]\n٧) [...]\n٨) [...]\n\n٩) للـ AI: [مهمة]\n١٠) المساعدة: [مثال: تلخيص + قالب رد]",
      rubric: [
        {
          label: "تصنيف واقعي",
          weight: 60,
          criteria: ["٨ مهام من واقعك — مش قائمة نظرية."],
        },
        {
          label: "اختيار إداري",
          weight: 40,
          criteria: ["مهمة إدارية واحدة مع فكرة مساعدة AI واضحة."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت تصنيف الشغل",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ توزيع نوع الشغل يوضّح ليه الاستراتيجية بتضيع — والـ AI يخفّف الإداري.",
        "تقدر تعمل إيه؟ تعرف إيه تقلّله بالـ AI عشان تفتح وقت للقرار.",
        "اللي جاي: النظام قبل الناس — والـ AI يساعدك تحوّل الشرح لـ SOP.",
      ],
    },
  },
];
