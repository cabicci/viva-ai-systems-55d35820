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

/** Business · M1 · Lesson 02 — Reactive vs Proactive (v3: Lesson Shape pilot) */
export const BUSINESS_M2_L1_REACTIVE_VS_PROACTIVE_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ الشغل المتكرر اللي بيستنى ردك كل يوم بياكل وقت التفكير — والـ AI يقدر يخفّف جزء منه.",
        "ليه دلوقتي؟ في الدرس اللي فات حددت قرار متكرر. النهاردة هتشوف ليه نفس القرارات بترجع كل أسبوع وتخلّيك في وضع الإطفاء.",
        "هتعمل إيه بعد الدرس؟ هتعدّد ٥ مهام أسبوعية وتصنّفها Reactive أو Proactive — وتختار واحدة Reactive الـ AI يقلّلها.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "بتقفل اليوم وإنت «اشتغلت» — بس مفيش حاجة اتبنت",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "صاحب بيزنس يفتح الواتساب الصبح — مورد، عميل، موظف، شكوى. الساعة ٣ الضهر يلاقي نفسه لسه بيرد. مفيش وقت للتسعير ولا للتخطيط.",
        "ده Reactive mode: العالم بيحدّد يومك — مش إنت. مش كسل — ده تكرار شغل ما اتنظّمش.",
        "الـ AI ما يحلّش كل المشاكل. بس يقدر يساعد في المهام المتكررة: تلخيص، صياغة رد، ترتيب أولويات — عشان يفضى نص ساعة Proactive كل أسبوع.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "قلّل المتكرر — افتح باب الاستباقي",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Reactive: شغل بييجي لك — رسالة، مشكلة، طلب عاجل. لازم يتعمل، بس ما بيبنيش البيزنس لوحده.",
        "Proactive: شغل إنت بتختاره — تسعير، عرض جديد، متابعة عميل مهم، تحسين عملية. ده اللي بيحرّك البيزنس.",
        "لو ٩٠٪ من أسبوعك Reactive، مش هتوصل لباني نظام. الهدف مش صفر Reactive — الهدف تقليل المتكرر بالـ AI عشان Proactive يبقى ممكن.",
        "اسأل: «إيه المهمة اللي بتعملها كل أسبوع بنفس الطريقة؟» — دي أول مرشّحة للـ AI.",
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
          term: "Reactive (رد فعل)",
          meaning: "مهمة بتيجي لك من برّة — لازم ترد أو تتصرف فورًا.",
          example: "شكوى عميل، رسالة مورد، طلب عاجل من موظف.",
        },
        {
          term: "Proactive (استباقي)",
          meaning: "مهمة إنت بتخطط لها قبل ما تصير أزمة.",
          example: "مراجعة أرقام الأسبوع، تحديث قائمة أسعار، تصميم متابعة عملاء.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — فخ الإطفاء اليومي",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "ليه الشغل المتكرر بياكل وقت القرار — وإزاي الـ AI يخفّف الحمل. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "نفس الأسبوع — توزيع وقت مختلف",
    block: {
      kind: "comparison",
      left: {
        label: "أسبوع Reactive",
        body: "كل يوم بيبدأ بالرسائل. نهاية الأسبوع: متعب، بس مفيش قرار تسعير ولا تحسين عملية اتاخد.",
      },
      right: {
        label: "أسبوع فيه Proactive",
        body: "قلّلت ٣ مهام متكررة بالـ AI. فضّيت ساعتين لمراجعة أرقام وتعديل عرض — البيزنس تحرّك خطوة.",
      },
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "يوم Reactive vs يوم Proactive",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "reactive-vs-proactive-day",
      label: "توزيع اليوم",
      caption:
        "الهدف مش تلغي الـ Reactive — ده جزء من الشغل. الهدف تقلّل المتكرر عشان يفضى وقت للبناء.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m1-l2-reactive-vs-proactive-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "كريم فتح واتساب أول الصبح عشان مشكلة مورد كبيرة وقضى ٣ ساعات. ده إيه؟",
          options: [
            "Proactive — لأنه حل مشكلة مهمة.",
            "Reactive — الموقف حدّد يومه قبل ما يختار أولوياته.",
            "استخدام Business OS كامل.",
          ],
          correctIndex: 1,
          explanation:
            "حجم المشكلة مش المعيار. المعيار: مين قرّر إنت تعمل إيه أول؟ تقليل المتكرر يبدأ بمعرفة إمتى العالم بياخد يومك.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "٥ مهام أسبوعية — صنّف واختار",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي عملية — مش تحفيز. اكتب ٥ مهام بتعملها كل أسبوع (أو تقريبًا)، وصنّف كل واحدة Reactive أو Proactive. بعدين اختار مهمة Reactive واحدة الـ AI يقدر يقلّلها.\n\nمش مطلوب أتمتة كاملة — مطلوب تشخيص صادق.",
      prompt:
        "في تسليمك اكتب:\n\n١) المهمة #١ + التصنيف (Reactive / Proactive):\n٢) المهمة #٢ + التصنيف:\n٣) المهمة #٣ + التصنيف:\n٤) المهمة #٤ + التصنيف:\n٥) المهمة #٥ + التصنيف:\n٦) المهمة Reactive اللي اخترتها للـ AI — وإزاي يقدر يساعد (جملة أو جملتين):",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "١) [مهمة] — Reactive / Proactive\n٢) [مهمة] — Reactive / Proactive\n٣) [مهمة] — Reactive / Proactive\n٤) [مهمة] — Reactive / Proactive\n٥) [مهمة] — Reactive / Proactive\n\n٦) اخترت للـ AI:\n   [المهمة] — الـ AI يساعد بـ [مثال: تلخيص ردود / قالب متابعة]",
      rubric: [
        {
          label: "تصنيف واقعي",
          weight: 60,
          criteria: ["٥ مهام من أسبوعك الحقيقي — كل واحدة مصنّفة."],
        },
        {
          label: "اختيار للـ AI",
          weight: 40,
          criteria: ["في مهمة Reactive واحدة مع فكرة مساعدة AI محددة."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت الخطوة التانية",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ الـ Reactive بياكل الأسبوع لو ما اتنظّمش — والـ AI يقلّل المتكرر عشان الـ Proactive يبقى ممكن.",
        "تقدر تعمل إيه؟ تعرف إيه اللي بياخد وقتك فعلًا — مش إيه اللي «المفروض» تعمله.",
        "اللي جاي: دورة حياة العميل — العميل رحلة مش صفقة واحدة، وإزاي الـ AI يحسّن كل محطة.",
      ],
    },
  },
];
