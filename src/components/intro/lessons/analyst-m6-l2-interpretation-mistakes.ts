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

/** Analyst · M6 · Interpretation Mistakes — أخطاء التفسير (v3: Lesson Shape pilot) */
export const ANALYST_M6_L2_INTERPRETATION_MISTAKES_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ البيانات ممكن تكون صح — والقرار غلط لو قرأتها غلط.",
        "ليه دلوقتي؟ بعد ما الريفيو الأسبوعي بقى عادة، محتاج تتجنّب ٤ فخاخ تفسير قبل ما تتسرّع في القرار.",
        "هتعمل إيه بعد الدرس؟ هتحل ٣ mini scenarios — correlation، عيّنة صغيرة، vanity metric، recency bias.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "الأرقام واضحة — والقرار طلع غلط",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "«المبيعات زادت لما شغّلنا أغاني هادية» — قررت تعتمدها طول الوقت. بعد شهر نزلت.",
        "«الـ retention بقت ٨٠٪!» — فرحت. لما شفت العدد الكلي، اكتشفت إن الناس اللي بتسيب اتشالت.",
        "الـ AI يساعدك تسأل «هل ده سبب ولا صدفة؟» — إنت تقرر قبل ما تبني قرار كبير.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "٤ فخاخ تفسير — وعلاجهم",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Correlation ≠ Causation: حاجتين بيتحركوا مع بعض مش معناه واحد سبب التاني. اسأل: في حاجة تالتة؟",
        "عيّنة صغيرة: ٣ عملاء مش «السوق». متاخدش قرار كبير من ٥ حالات.",
        "Vanity metric: لايكات ومشاهدات مش دايمًا = مبيعات. اسأل: الرقم ده بيخدم قرار إيه؟",
        "Recency bias: آخر أسبوع مش كل القصة. قارن بفترة أطول قبل ما تتسرّع.",
        "قرار صغير قابل للتراجع > قرار كبير مبني على «حاسس».",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "تفسير سريع vs تفسير حذر",
    block: {
      kind: "comparison",
      left: {
        label: "«الأغاني سبب الزيادة»",
        body: "Correlation اتعاملت كـ Causation. ممكن الصبح = زبائن أكتر — مش الموسيقى.",
      },
      right: {
        label: "«هجرّب أسبوع واحد»",
        body: "تجربة صغيرة: أغاني vs بدون — نفس الوقت — تقيس المبيعات. بيانات جديدة الأسبوع الجاي.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للتفسير",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Correlation (ارتباط)",
          meaning: "حاجتين بيتحركوا مع بعض — من غير ما يكون واحد سبب التاني.",
          example: "آيس كريم وغرق بيزيدوا سوا — السبب الحرارة.",
        },
        {
          term: "Vanity Metric (رقم شكلي)",
          meaning: "رقم يبان حلو بس مش بيخدم قرار حقيقي.",
          example: "١٠٠٠ لايك — بس مفيش طلبات.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — فخاخ التفسير",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "أمثلة على أخطاء تفسير بتكلّف فلوس — وإزاي الـ AI يساعدك تسأل قبل ما تقرر. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "Correlation ≠ Causation",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "correlation-causation",
      label: "ارتباط vs سببية",
      caption:
        "آيس كريم وغرق بيتحرّكوا مع بعض — السبب الحقيقي حاجة تالتة (الحرارة). استخدم الرسم في الـ scenarios.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "analyst-m6-l2-interpretation-mistakes-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "صاحب كافيه لاحظ: أغاني هادية الصبح = مبيعات أعلى. قرر يشغّلها طول الوقت. إيه الغلطة؟",
          options: [
            "Correlation ≠ Causation — ممكن في سبب تالت (وقت اليوم، نوع زبائن).",
            "Analysis Paralysis — بيتأخر في القرار.",
            "Vanity metric — اللايكات مش مهمة.",
          ],
          correctIndex: 0,
          explanation:
            "الارتباط مش سببية. محتاج تجربة: نفس الوقت، متغيّر واحد — أو تقارن بفترة أطول.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "٣ mini scenarios — تشخيص + علاج",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي تطبيق على ٣ مواقف — مش نظري. لكل scenario: نوع الغلطة + إزاي تتجنّبه + قرار أصح.\n\nالـ AI يساعدك تصيغ التشخيص — إنت تختار الحكم النهائي.",
      prompt:
        "في تسليمك اكتب لكل scenario:\n\n── Scenario ١: Correlation vs Causation ──\nالموقف: [اكتب أو انسخ من الدرس]\nنوع الغلطة:\nقرار أصح:\n\n── Scenario ٢: عيّنة صغيرة ──\n[نفس الهيكل]\n\n── Scenario ٣: Vanity metric أو Recency bias ──\n[نفس الهيكل]",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "── Scenario ١: Correlation vs Causation ──\nالموقف:\n[مثال: مبيعات زادت مع تغيير X]\nنوع الغلطة: [Correlation = Causation]\nقرار أصح: [تجربة صغيرة / متغيّر واحد]\n\n── Scenario ٢: عيّنة صغيرة ──\nالموقف:\n[مثال: ٣ عملاء راضيين]\nنوع الغلطة: [Sample صغير]\nقرار أصح: [توسيع العيّنة / انتظار]\n\n── Scenario ٣: Vanity / Recency ──\nالموقف:\n[مثال: لايكات زادت / آخر أسبوع ممتاز]\nنوع الغلطة: [Vanity / Recency bias]\nقرار أصح: [رقم يخدم قرار / مقارنة أطول]",
      rubric: [
        {
          label: "تشخيص الفخ",
          weight: 50,
          criteria: ["كل scenario له نوع غلطة واضح."],
        },
        {
          label: "قرار أصح",
          weight: 50,
          criteria: ["قرار صغير أو تجربة — مش تعميم من غير دليل."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت التفسير",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ البيانات الصح + تفسير غلط = قرار غلط — والـ AI يساعدك تسأل قبل ما تتسرّع.",
        "تقدر تعمل إيه؟ عندك ٣ scenarios محلولة تقدر تراجعهم في الريفيو الأسبوعي.",
        "اللي جاي: A/B Testing — غيّر حاجة واحدة، قيس نتيجة واحدة.",
      ],
    },
  },
];
