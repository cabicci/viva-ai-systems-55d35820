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
import automatorM2ToolsLandscapeScreenshot from "@/assets/lessons/unique/automator-m3-l1-tools-landscape.jpg";

/** Automator · M3 · Lesson 01 — Tools Landscape (v3: Lesson Shape pilot) */
export const AUTOMATOR_M3_L1_TOOLS_LANDSCAPE_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ الأدوات مختلفة — Zapier، Make، n8n — بس التفكير واحد: مُشغّل → خطوات → نتيجة.",
        "ليه دلوقتي؟ بعد ما اخترت أول مهمة للأتمتة، محتاج أداة تناسب حجمك — مش أشهر اسم.",
        "هتعمل إيه بعد الدرس؟ هتختار أداة واحدة لمرشّح الأتمتة بتاعك — ولِيه.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "«Zapier أشهر» — وبعد شهر الاشتراك غالي",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بتختار أداة لأنها مشهورة — أو لأنها مجانية — من غير ما تشوف: كام مهمة/شهر؟ محتاج logic ولا خطوات بسيطة؟",
        "الأداة مش الهدف. الهدف = العامل الافتراضي ينفّذ النمط اللي اخترته.",
        "اختيار غلط = وقت ضايع في التعلّم — مش في توفير الوقت.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "الأدوات مختلفة — التفكير واحد",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Zapier — الأسهل، integrations جاهزة كتير، مناسب لـ workflows بسيطة وقليلة. أغلى نسبيًا.",
        "Make — توازن: visual واضح، scenarios متوسطة، أرخص من Zapier. مناسب لمعظم البدايات.",
        "n8n — أقوى، open-source، self-hosted ممكن. محتاج مجهود أكتر — مناسب لـ workflows كتير أو معقّدة.",
        "القاعدة: اختار حسب حجمك وتعقيدك — مش حسب يوتيوب. التفكير (مُشغّل → خطوات → نتيجة) ثابت في كل أداة.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "اختيار بالشهرة vs اختيار بالحجم",
    block: {
      kind: "comparison",
      left: {
        label: "«Zapier لأنه مشهور»",
        body: "نور فتحت Zapier لـ «فورم → إيميل» — ٥ مرات/شهر. اشتراك ٢٠$/شهر لمهمة بسيطة. الأداة أكبر من الحاجة.",
      },
      right: {
        label: "«Make لأن الحجم متوسط»",
        body: "نور استخدمت Make free tier — نفس «فورم → إيميل» — ٣٠ دقيقة setup. وفّرت فلوس وتعلّمت التفكير.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للأدوات",
    block: {
      kind: "concepts",
      items: [
        {
          term: "No-Code (من غير كود)",
          meaning: "أدوات تبني فيها العامل الافتراضي بسحب وإفلات — مش كورس برمجة.",
          example: "Make scenario: فورم → شيت → واتساب.",
        },
        {
          term: "Integration (ربط)",
          meaning: "توصيل برنامجين عشان يتبادلوا بيانات — ده اللي الأداة بتعمله.",
          example: "Google Forms ↔ Google Sheets.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — مقارنة سريعة للأدوات",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "Zapier vs Make vs n8n — إمتى تستخدم كل واحدة. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "طبقات شغّالة — نفس فكرة أي أداة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM2ToolsLandscapeScreenshot,
      alt: "رسم طبقات — كل طبقة تستقبل مدخل وتنفّذ وتطلع مخرج.",
      caption:
        "أي أداة أتمتة = طبقات: حاجة تدخل (مُشغّل) → خطوات → حاجة تطلع. Zapier و Make و n8n نفس الفكرة — اختلاف في السهولة والسعر والقوة.",
      label: "طبقات الأتمتة",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m3-l1-tools-landscape-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "لسه في البداية، عندك workflow واحد بسيط: «فورم → إيميل ترحيب» — ٢٠ مرة/شهر. ميزانيتك محدودة. أنسب أداة؟",
          options: [
            "Make — free tier كافي، visual واضح، مناسب للبداية.",
            "n8n self-hosted — أقوى حتى لو محتاج أسبوع setup.",
            "Zapier Pro — أغلى بس أشهر.",
          ],
          correctIndex: 0,
          explanation:
            "بداية + workflow بسيط + ميزانية = Make. التفكير واحد — الأداة تخدم الحجم.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اختار أداة واحدة — ولِيه",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "خد مرشّح الأتمتة الأول من الدرس اللي فات — واختار أداة واحدة (Zapier / Make / n8n / غيره).\n\n١٠ دقيقة كفاية — مش مطلوب تبني Flow.",
      prompt:
        "في تسليمك اكتب:\n\n١) مرشّح الأتمتة (المهمة/النمط):\n\n٢) الأداة المختارة:\n\n٣) ٢ سبب للاختيار (حجم، تكرار، ميزانية، تعقيد):\n\n٤) لو اضطريت تختار أداة تانية — أنهي ولِيه؟\n\n٥) جملة: إزاي هتبني «فورم → [خطوة] → [نتيجة]» في الأداة دي (بالكلام — مش screenshot):",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "مرشّح الأتمتة:\n[مهمة/نمط]\n\nالأداة:\n[Zapier / Make / n8n / ...]\n\nسبب ١:\n[...]\nسبب ٢:\n[...]\n\nبديل:\n[أداة + لِيه]\n\nخطة بناء:\n[مُشغّل → خطوات → نتيجة بالكلام]",
      rubric: [
        {
          label: "اختيار مبرّر",
          weight: 60,
          criteria: [
            "أداة مربوطة بمرشّح محدّد.",
            "سببان عمليان — مش «أسهل» بس.",
          ],
        },
        {
          label: "فهم التفكير",
          weight: 40,
          criteria: [
            "بديل مع سبب.",
            "خطة بناء تصف مُشغّل → نتيجة.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت الأدوات",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ الأدوات مختلفة — التفكير (مُشغّل → خطوات → نتيجة) واحد في كلهم.",
        "تقدر تعمل إيه؟ عندك أداة مختارة لمرشّح الأتمتة الأول — جاهزة للتصميم.",
        "اللي جاي: Triggers + Actions — «لما ده يحصل، اعمل كده».",
      ],
    },
  },
];
