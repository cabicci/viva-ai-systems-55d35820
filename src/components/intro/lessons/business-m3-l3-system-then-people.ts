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

/** Business · M3 · Lesson 03 — System Then People (v3: Lesson Shape pilot) */
export const BUSINESS_M5_L2_SYSTEM_THEN_PEOPLE_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ الناس بتشتغل أحسن لما النظام واضح الأول — والـ AI يحوّل شرحك لـ SOP بسيط.",
        "ليه دلوقتي؟ بعد ما صنّفت شغلك وفكّرت في التفويض، التوظيف بدون نظام يزود الفوضى.",
        "هتعمل إيه بعد الدرس؟ هتكتب عملية خام واطلب من الـ AI يحوّلها لمخطط SOP — وتراجعه.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "وظّفت حد — وبقيت تشرح نفس الحاجة كل يوم",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "موظف جديد يسأل «أعمل إيه لو العميل قال كذا؟» — وإنت ترد من الذاكرة. كل يوم نفس الشرح.",
        "ده مش فشل الموظف — ده غياب نظام. من غير SOP، كل توظيف يضيف شغل إدارة على رأسك.",
        "الـ AI ياخد شرحك العادي ويرتّبه: خطوات، متى، مثال، استثناء — إنت تراجع وتختبر قبل التوسّع.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "نظام → SOP → اختبار → ناس",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الخطوة ١: اكتب العملية زي ما بتشرحها لصاحبك — حتى لو فوضوي.",
        "الخطوة ٢: الـ AI يرتّبها SOP: هدف، خطوات مرقّمة، مثال، «لو حصل كذا».",
        "الخطوة ٣: جرّب الـ SOP بنفسك أو بمساعد مؤقت — عدّل اللي مش واضح.",
        "الخطوة ٤: بعد ما يشتغل مرتين بنفس الجودة — فكّر في توظيف أو تفويض.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمة واحدة",
    title: "مصطلح واحد بس",
    block: {
      kind: "concepts",
      items: [
        {
          term: "SOP (إجراء قياسي)",
          meaning: "طريقة ثابتة لتنفيذ مهمة متكررة — أي حد يقدر يتبعها.",
          example: "«رد على استفسار السعر» — ٥ خطوات + قالب + متى تصعّد لصاحب البيزنس.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — النظام قبل التوظيف",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "من الشرح الشفهي لـ SOP بالـ AI. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "توظيف بدون نظام vs SOP أولًا",
    block: {
      kind: "comparison",
      left: {
        label: "ناس قبل نظام",
        body: "كل موظف يعمل بطريقته. إنت وسط — بتوحّد، بتراجع، بترجع Reactive.",
      },
      right: {
        label: "SOP ثم ناس",
        body: "AI يساعدك توثّق. الموظف يتبع الخطوات — إنت تراجع الاستثناءات بس.",
      },
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "الترتيب: نظام ثم ناس",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "system-then-people",
      label: "System → People",
      caption:
        "SOP واحد واضح أقوى من موظفين اتنين بلا دليل. اختبر العملية قبل ما تكبّر الفريق.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m3-l3-system-then-people-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "عايز تستعين بحد يرد على العملاء. أحسن ترتيب؟",
          options: [
            "توظّف فورًا — يتعلّم على رأس الشغل.",
            "تكتب SOP للردود مع الـ AI، تجربه أسبوع، بعدين تفوّض.",
            "تسيب الردود للـ AI من غير مراجعة.",
          ],
          correctIndex: 1,
          explanation:
            "النظام الأول يقلّل الأخطاء والشرح المتكرر. الـ AI يصيغ الـ SOP — إنت تراجع وتختبر.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "من شرح خام لـ SOP",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "اختار عملية واحدة بتشرحها لنفسك كتير (رد عميل، تجهيز طلب، متابعة مورد). اكتبها بأسلوبك — ثم استخدم الـ AI يحوّلها لمخطط SOP (هدف، خطوات، مثال، استثناء).\n\nالصق مخطط الـ SOP في التسليم.",
      prompt:
        "في تسليمك اكتب:\n\n١) اسم العملية:\n٢) الشرح الخام (قبل الـ AI) — ٥–١٠ أسطر:\n٣) مخطط SOP بعد الـ AI (هدف + خطوات + مثال + استثناء واحد):\n٤) حاجة واحدة لسه محتاجة توضيح بعد المراجعة:",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "١) العملية:\n   [مثال: رد على استفسار السعر]\n\n٢) الشرح الخام:\n   [اكتب هنا]\n\n٣) SOP من الـ AI:\n   الهدف: [...]\n   الخطوات: ١ ... ٢ ... ٣ ...\n   مثال: [...]\n   استثناء: [...]\n\n٤) يحتاج توضيح:\n   [اكتب هنا]",
      rubric: [
        {
          label: "عملية حقيقية",
          weight: 60,
          criteria: ["في شرح خام من بيزنسك — مش مثال عام."],
        },
        {
          label: "SOP مرتب",
          weight: 40,
          criteria: ["مخطط فيه خطوات واضحة — حتى لو محتاج تعديل بسيط."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت النظام قبل الناس",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ التوظيف بدون SOP يزود شغلك — والـ AI يسرّع توثيق النظام.",
        "تقدر تعمل إيه؟ عندك مخطط SOP لعملية واحدة جاهز للاختبار.",
        "اللي جاي: لو هتوظّف لاحقًا — الدور والأسبوع الأول محتاجين وضوح مش حماس.",
      ],
    },
  },
];
