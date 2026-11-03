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

/** Analyst · M4 · L2 — Decision Rule (v3: Lesson Shape pilot) */
export const ANALYST_M4_L2_DECISION_RULE_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ رقم واحد ممكن يضلّلك — القرار محتاج مقارنة وأرقام مرتبطة.",
        "ليه دلوقتي؟ في الدرس اللي فات فرّقت بين النمط والاستثناء. دلوقتي محتاج تحوّل أي رقم لسؤال قرار.",
        "هتعمل إيه بعد الدرس؟ هتاخد رقم واحد وتسأل: مقارنة بإيه؟ إيه الرقم المرتبط؟ وإيه اللي هييتغيّر؟",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "«المبيعات نزلت ١٠٪» — وقفّت كل حاجة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "مدير بيقول: «المبيعات نزلت ١٠٪». الفريق بي panics — خصومات، إعلانات، اجتماعات طوارئ.",
        "حد بيسأل: «نزلت مقارنة بإيه؟» — طلع مقارنة بأسبوع فيه عرض خاص. مقارنة بالشهر اللي فات: ثابتة.",
        "رقم من غير مقارنة = نصف قصة. القرار الصح يبدأ بـ: مقارنة بإيه؟ وإيه الرقم التاني اللي يفسّر الصورة؟",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "قاعدة القرار: ٣ أسئلة قبل أي action",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "١) Compared to what? — مقارنة بإيه؟ (الأسبوع اللي فات، نفس الفترة السنة اللي فاتت، الهدف)",
        "٢) What related number matters? — إيه الرقم المرتبط؟ (مبيعات نزلت — بس الطلبات زادت؟ التحويل هو المشكلة)",
        "٣) What action would change? — إيه اللي هييتغيّر لو اتخذت قرار؟ (مين ينفّذ؟ إمتى؟)",
        "من غير الـ ٣ أسئلة دول — أي «insight» ممكن يكون كلام في الهوا.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "رقم لوحده vs رقم في سياق قرار",
    block: {
      kind: "comparison",
      left: {
        label: "رقم من غير مقارنة",
        body: "«التحويل ٨٪». قرار: «نزوّد الإعلانات». — مش عارفين لو ٨٪ كويس ولا وحش.",
      },
      right: {
        label: "رقم + مقارنة + action",
        body: "«التحويل ٨٪ — كان ١٢٪ الأسبوع اللي فات، والطلبات زادت». قرار: «نراجع رسالة التسعير — أنا — الأربعاء».",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للقرار",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Baseline (خط أساس)",
          meaning: "الرقم اللي بتقارن عليه — «الطبيعي» قبل ما تحكم.",
          example: "متوسط مبيعات آخر ٤ أسابيع = ١٠٠٠ جنيه/يوم.",
        },
        {
          term: "Decision Rule (قاعدة قرار)",
          meaning: "لو [شرط بأرقام] → [action محدّد].",
          example: "لو التحويل نزل أكتر من ٥٪ عن الأسبوع اللي فات → نراجع رسالة التسعير.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — من رقم لقرار",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تحوّل أي رقم لسؤال قرار — مقارنة، رقم مرتبط، وaction.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "سلسلة القرار",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "decision-chain",
      label: "Decision Chain",
      caption:
        "رقم → مقارنة بإيه → رقم مرتبط → action. من غير السلسلة دي القرار مش هيتنفّذ.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "analyst-m4-l2-decision-rule-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "الطلبات زادت ٢٠٪ الأسبوع ده — بس التحويل نزل من ١٢٪ لـ ٨٪. أحسن خطوة قرار؟",
          options: [
            "نزوّد الإعلانات — الطلبات زادت.",
            "نسأل: التحويل نزل مقارنة بإيه؟ ونراجع خطوة التسعير/العرض — action محدّد.",
            "نتجاهل الأرقام — الطلبات أهم.",
          ],
          correctIndex: 1,
          explanation:
            "رقم واحد يضلّل. الطلبات والتحويل مع بعض يوضّحوا الصورة — والقرار يكون على اللي هييتغيّر فعلًا.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "حوّل رقم واحد لقاعدة قرار",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي تطبيق على رقم حقيقي من شغلك — مش نظري. اختار رقم واحد بتلاحظه كتير ومرّره على ٣ أسئلة القرار.\n\nالهدف: ما تاخدش action على نصف قصة.",
      prompt:
        "في تسليمك اكتب:\n\n١) الرقم اللي اخترته + من فين جاي:\n٢) Compared to what? — مقارنة بإيه وإيه النتيجة:\n٣) What related number matters? — إيه الرقم المرتبط وإيه اللي بيقوله:\n٤) What action would change? — action + مين + إمتى:\n٥) Decision Rule بصيغة: لو [شرط] → [action]:",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "الرقم:\n[إيه + مصدر]\n\nمقارنة بإيه:\n[baseline + النتيجة]\n\nرقم مرتبط:\n[إيه + إيه اللي بيقوله]\n\nAction:\n[إيه + مين + إمتى]\n\nDecision Rule:\nلو [شرط] → [action]",
      rubric: [
        {
          label: "مقارنة وسياق",
          weight: 50,
          criteria: [
            "في baseline واضح — مش رقم لوحده.",
            "في رقم مرتبط يغيّر فهم الصورة.",
          ],
        },
        {
          label: "Action وRule",
          weight: 50,
          criteria: [
            "Action محدّد فيه مين وإمتى.",
            "Decision Rule مكتوبة بصيغة لو → action.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت قاعدة القرار",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ رقم واحد مش كفاية — القرار محتاج مقارنة، رقم مرتبط، وaction واضح.",
        "تقدر تعمل إيه؟ تقدر توقّف أي «insight» وتسأل الـ ٣ أسئلة قبل ما تتحرّك.",
        "اللي جاي: Dashboard من ٤ أرقام — تبدأ بأرقام قرار، مش ٥٠ رسم.",
      ],
    },
  },
];
