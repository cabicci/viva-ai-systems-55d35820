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
import llmScreenshot from "@/assets/lessons/builder-m1-l1-what-is-llm.jpg";

/** Builder · M1 · Lesson 01 — إيه هو الـ LLM؟ (v3: Lesson Shape pilot) */
export const BUILDER_M1_WHAT_IS_LLM_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ إزاي «المساعد الذكي» بيكمّل الكلام — زي autocomplete ذكي — ومش بيضمن الحقيقة.",
        "ليه دلوقتي؟ ده أول درس في Builder — Level 3 اختياري. لو هدفك تستخدم AI في شغلك، مش مطلوب تكمّل المسار.",
        "هتعمل إيه بعد الدرس؟ سؤال واقعي + طريقة تحقّق بسيطة — مش برمجة.",
        "مش محتاج تكون تقني. محتاج تفهم الفكرة عشان أي ميزة AI تبنيها تكون صادقة مع المستخدم.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "ردّ بثقة — وبعدها تكتشف إنه غلط",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "سألت ChatGPT أو Gemini سؤال، وردّ عليك بثقة بمعلومة — وبعد ساعة لقيتها مش صح.",
        "بتحس إنه «بيعرف» — بس الحقيقة إنه بيكمل الكلام الأنسب زي autocomplete متطوّر.",
        "لما تبني منتج فيه AI، المستخدم هيعتمد على الردود. لو إنت مش فاهم الفرق، هتبني ميزة بتضلّل الناس من غير ما تقصد.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "بيخمّن الكلام الأنسب — مش بيتحقّق من الحقيقة",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تشبيه بسيط: LLM (نموذج لغوي كبير) = autocomplete ذكي على مستوى جمل كاملة. بيتوقّع الكلام الأنسب — مش بيبحث في Google.",
        "لما يردّ بثقة، ده مش دليل إنه «فاهم» — ده دليل إن الجملة شكلها منطقي.",
        "في Builder: أي مساعد في منتجك هيشتغل بنفس المنطق. التحقّق من الحقائق مسؤوليتك — مش الموديل.",
        "استخدمه في الكتابة والتلخيص والأفكار. راجع أي أرقام أو تواريخ قبل ما تعرضها للمستخدم.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "Google vs مساعد لغوي",
    block: {
      kind: "comparison",
      left: {
        label: "غلط: بتتعامل معاه كأنه Google",
        body: "بتفترض إن كل إجابة حقيقة. لما تبني ميزة «اسأل أي حاجة» من غير تحذير أو تحقّق، المستخدم هيتصدم لما يلاقي معلومة مختلقة.",
      },
      right: {
        label: "صح: بتتعامل معاه كمساعد لغوي",
        body: "بتستغله في الحاجات اللي هو شاطر فيها، وبتديّه سياق ومصادر. وبتضيف خطوة تحقّق للحقائق — زي ما أي منتج محترم بيعمل.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للبداية",
    block: {
      kind: "concepts",
      items: [
        {
          term: "LLM (نموذج لغوي كبير)",
          meaning: "autocomplete ذكي للجمل — بيتوقّع الكلام الأنسب، مش بيبحث في قاعدة بيانات.",
          example: "ChatGPT و Claude و Gemini — كلهم بيستخدموا LLM تحت الغطاء.",
        },
        {
          term: "Hallucination (هلوسة)",
          meaning: "لما الـ AI يخترع معلومة بثقة — جملة شكلها صح بس المحتوى غلط.",
          example: "يسمّي شخص أو تاريخ غلط في إجابة «مؤكدة».",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — إزاي الـ LLM بيشتغل",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "شرح بسيط لفكرة الـ LLM: توقّع اللغة مش الحقيقة. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "مساعد AI — سؤال وسياق ورد",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: llmScreenshot,
      alt: "واجهة مساعد AI — مربع سؤال مع سياق الدرس الحالي.",
      caption:
        "المساعد مش متبرمج بإجابات جاهزة. بياخد سؤالك + السياق (إنت في أنهي درس) ويخمّن أنسب رد. عشان كده يقدر يساعد في أسئلة جديدة — وعشان كده لازم تتحقّق من أي حقيقة قبل ما تعتمد عليها في منتجك.",
      label: "مساعد AI في التطبيق",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m1-l1-what-is-llm-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "سألت AI عن خبر حصل امبارح، فردّ بتفاصيل كلها غلط بس بثقة. إيه أقرب سبب؟",
          options: [
            "بيخمّن من الداتا القديمة اللي اتدرب عليها — مش متوصل بأخبار لحظية.",
            "السيرفرات واقعة.",
            "لازم اشتراك مدفوع عشان يديك أخبار جديدة.",
          ],
          correctIndex: 0,
          explanation:
            "الـ AI بيتوقّع أقرب كلام منطقي — مش بيتحقّق من الخبر. لما تبني ميزة AI، خطّط للتحقّق من الحقائق.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "سؤال واقعي + طريقة تحقّق",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "جرّب بنفسك: اسأل أي AI سؤال فيه حقيقة قابلة للتحقّق (تاريخ، رقم، اسم شخص).\n\n١٠ دقايق كفاية.",
      prompt:
        "في تسليمك اكتب:\n\n١) السؤال اللي سألته:\n\n٢) ردّ الـ AI (آخر فقرة كفاية):\n\n٣) إزاي تحقّقت من الإجابة؟ (مصدر، بحث، مقارنة):\n\n٤) الإجابة كانت صح ولا غلط؟ ولِيه ده مهم لو هتعرض ردود AI للمستخدمين؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "السؤال:\n[اكتب سؤالك]\n\nردّ الـ AI:\n[الرد]\n\nطريقة التحقّق:\n[مصدر أو خطوة]\n\nالنتيجة:\n[صح / غلط]\n\nلِيه يهم في البناء:\n[جملة واحدة]",
      rubric: [
        {
          label: "سؤال ورد حقيقي",
          weight: 50,
          criteria: [
            "السؤال والرد واضحين.",
            "السؤال فيه حقيقة قابلة للتحقّق.",
          ],
        },
        {
          label: "تحقّق وربط بالبناء",
          weight: 50,
          criteria: [
            "ذكرت طريقة تحقّق فعلية.",
            "ربطت النتيجة بمسؤولية المنتج عن الحقائق.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت البداية",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ LLM = autocomplete ذكي — مش ضمان للحقيقة. Builder Level 3 اختياري.",
        "تقدر تعمل إيه؟ تستخدمه للكتابة والأفكار، وتتحقّق من الحقائق قبل ما تعرضها.",
        "اللي جاي: Tokens والتدريب — ليه الطلب الطويل أبطأ وأغلى، وإزاي تختصر.",
      ],
    },
  },
];
