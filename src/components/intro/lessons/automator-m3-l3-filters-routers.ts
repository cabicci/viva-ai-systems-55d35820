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
import automatorM2FiltersRoutersScreenshot from "@/assets/lessons/unique/automator-m3-l3-filters-routers.jpg";

/** Automator · M3 · L3 — Filters & Routers (v3: Lesson Shape pilot) */
export const AUTOMATOR_M3_L3_FILTERS_ROUTERS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ الأتمتة بتبقى مفيدة لما تختار المسار الصح حسب الشرط — مش لما كل حاجة تمشي في خط واحد.",
        "ليه دلوقتي؟ بعد Triggers + Actions، محتاج تفرّق: استفسار سعر ≠ شكوى ≠ متابعة — وكل واحد ليه رد مختلف.",
        "هتعمل إيه بعد الدرس؟ هتضيف if/then واحد لـ workflow بتاعك: لو [شرط] → [مسار أو فعل].",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "«نفس الرد لكل الرسائل» — والعميل زعل",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "عندك أوتوميشن بيرد على رسائل الواتساب. حد بيسأل عن السعر — جاله «شكرًا لتواصلك». حد بيشتكي — نفس الرد.",
        "الشغل المتكرر مش المشكلة — المشكلة إن الـ workflow مفيهوش قرار: كل حاجة في نفس المسار.",
        "العامل الافتراضي محتاج يعرف: إمتى أكمّل؟ إمتى أوقف؟ إمتى أروّح لمسار تاني؟ — ده شغل الفلتر والـ Router.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "Filter = بوّابة. Router = مفترق طرق",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Filter: لو الشرط اتحقّق → البيانات تعدّي. لو لأ → الـ workflow يقف هنا. مثال: «لو فيه رقم تليفون → كمّل».",
        "Router: نفس الـ trigger، بس بيتقسم على مسارات حسب الشرط. مثال: سعر → مسار مبيعات. شكوى → مسار دعم.",
        "if/then واحد يغيّر تجربة العميل — من رد عام لرد مناسب للحالة.",
        "ابدأ بشرط واحد واضح — مش ١٠ فروع من أول يوم.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "مسار واحد vs مسار حسب الحالة",
    block: {
      kind: "comparison",
      left: {
        label: "مسار واحد لكل حاجة",
        body: "كل lead ياخد نفس الإيميل والنفس الرد — العميل اللي بيشتكي يحس إنك مش سامعه.",
      },
      right: {
        label: "if/then واحد",
        body: "لو الرسالة فيها «سعر» → ابعت قائمة أسعار. غير كده → حوّل لدعم. كل حالة ردها مناسب.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للمسارات",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Filter (فلتر)",
          meaning: "بوّابة: الشرط اتحقّق → يعدّي. لأ → يقف.",
          example: "لو مفيش إيميل في الفورم → ما تكمّلش التسجيل.",
        },
        {
          term: "Router (موزّع)",
          meaning: "مفترق طرق: نفس الـ trigger، مسارات مختلفة حسب الشرط.",
          example: "VIP → رسالة خاصة. عميل جديد → رسالة ترحيب.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — Filter vs Router",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تضيف if/then لـ workflow — متى Filter ومتى Router. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "نفس الـ trigger — مسارات مختلفة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM2FiltersRoutersScreenshot,
      alt: "مثال على Router بيوزّع حسب الاختيار",
      caption:
        "نفس الحدث (مستخدم دخل) — بس المسار بيتغيّر حسب الاختيار. نفس الفكرة في شغلك: lead جديد → مسار. شكوى → مسار تاني.",
      label: "Router — شرط واحد يحدّد المسار",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m3-l3-filters-routers-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "عميل اشترى فوق ٥٠٠٠ جنيه → إيميل شكر خاص. تحت ٥٠٠٠ → إيميل عادي. إيه الأنسب؟",
          options: [
            "Router يفرّق حسب قيمة الشراء — مسارين مختلفين.",
            "Filter يوقّف الإيميلات للعملاء العاديين.",
            "مسار واحد للكل — الإيميل واحد.",
          ],
          correctIndex: 0,
          explanation:
            "محتاج مسارين مختلفين حسب الشرط — ده Router. Filter يوقّف أو يمرّر، مش يوزّع.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "ضيف if/then واحد لـ workflow",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي تصميم — مش بناء إلزامي. اختار workflow متكرر عندك وضيف شرط واحد يغيّر المسار أو يوقف التنفيذ.\n\nممكن الـ AI يقترح صياغة — إنت تختار النهائي.",
      prompt:
        "في تسليمك اكتب:\n\n١) الـ Workflow (سطر — إيه الشغل المتكرر):\n٢) الـ Trigger (إيه اللي بيبدّي الشغل):\n٣) if/then واحد:\n   - الشرط (if):\n   - المسار أو الفعل (then):\n   - وإلا (else) — لو فيه:\n٤) مثال input واحد لكل مسار:",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "Workflow:\n[الشغل المتكرر — مثال: رد على رسائل واتساب]\n\nTrigger:\n[إيه اللي بيبدّي — مثال: رسالة واتساب جديدة]\n\nif/then:\nif [الشرط — مثال: الرسالة فيها كلمة «سعر»]\nthen [المسار — مثال: ابعت قائمة أسعار]\nelse [بديل — مثال: حوّل لدعم فني]\n\nأمثلة:\n- Input: «عايز أعرف السعر» → [أنهي مسار]\n- Input: «الطلب متأخر» → [أنهي مسار]",
      rubric: [
        {
          label: "شرط واضح",
          weight: 50,
          criteria: [
            "if/then واحد محدّد — مش كلام عام.",
            "الشرط قابل للاختبار (نعم/لأ).",
          ],
        },
        {
          label: "مسارات مختلفة",
          weight: 50,
          criteria: [
            "then وelse بيعملوا حاجة مختلفة فعلًا.",
            "مثال input لكل مسار.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت المسارات",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ الأتمتة بتبقى أذكى لما تختار المسار حسب الشرط — Filter يوقف أو يمرّر، Router يوزّع.",
        "تقدر تعمل إيه؟ عندك if/then واحد جاهز تضيفه لـ workflow حقيقي.",
        "اللي جاي: ربط الـ DB — لما الأتمتة تحفظ بيانات منظمة مش بس ترد.",
      ],
    },
  },
];
