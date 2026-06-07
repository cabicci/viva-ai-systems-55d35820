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
import automatorM4AgentsScreenshot from "@/assets/lessons/unique/automator-m5-l3-agents.jpg";

/** Automator · M5 · Agents بياخدوا قرارات (v3: Lesson Shape pilot) */
export const AUTOMATOR_M5_L3_AGENTS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ الـ Agent يختار الخطوات نحو هدف — بس محتاج حدود وأدوات محددة عشان يفضل آمن.",
        "ليه دلوقتي؟ بعد LLM وRAG، الخطوة الجاية لما المسار مش ثابت — والقرار لازم يتخذ جوه السير.",
        "هتعمل إيه بعد الدرس؟ هتحدّد هدف agent آمن، الأدوات المسموحة، وحد واحد يمنعه يعدّي الخط.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "الرد الآلي عمل حاجة ماحدش طلبها",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "شغّلت «مساعد ذكي» يتعامل مع شكاوى العملاء. يوم واحد بعت رسائل تأكيد لكل العملاء — حتى اللي ماشتكاش.",
        "أو: دخل في حلقة — بيبعت ويبعت من غير ما يوصل لحل.",
        "المشكلة مش الذكاء — المشكلة غياب الحدود. Agent بدون هدف واضح وأدوات محدودة = مخاطرة على شغلك وسمعتك.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "Workflow ثابت vs Agent يختار الخطوة",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Workflow عادي: أ → ب → ج. كل مرة نفس المسار. ممتاز للشغل المتكرر المعروف.",
        "Agent: هدف + أدوات محددة. هو يقرر يستخدم أنهي أداة وبأي ترتيب — لحد ما يوصل للهدف أو يقف.",
        "مناسب لما الطلبات مختلفة: شكوى تقنية، طلب تعديل، استفسار فاتورة — كل واحد محتاج خطوات مختلفة.",
        "القاعدة: Agent ذكي + حدود واضحة + أدوات قليلة = آمن. Agent مفتوح = خطر.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "Agent مفتوح vs Agent مضبوط",
    block: {
      kind: "comparison",
      left: {
        label: "بدون حدود",
        body: "«حل مشكلة العميل» + كل الأدوات متاحة. ممكن يبعت رسائل لكل الناس، يدخل حلقة، أو ينفّذ إجراء غلط.",
      },
      right: {
        label: "بحدود وأدوات",
        body: "«صنّف الشكوى واقترح حل أو حوّل لموظف» + أدوات: قراءة CRM، بحث FAQ، إرسال مسودة رد. أي إرسال فعلي يحتاج موافقة.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للـ Agent",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Agent (وكيل)",
          meaning: "نظام بياخد هدف ويختار خطوات وأدوات للوصول له — مش مسار ثابت مسبقًا.",
          example: "«حل استفسار العميل» — يقرأ الرسالة، يبحث في FAQ، يقترح رد أو يحوّل لبشري.",
        },
        {
          term: "Boundary (حد)",
          meaning: "قاعدة توقّف الـ Agent عند حد معيّن — عدد خطوات، أدوات خارج النطاق، موافقة بشرية.",
          example: "«مابعتش رسالة للعميل من غير موافقة» أو «أقصى ٥ خطوات وبعدين توقف».",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — Agent بحدود",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "الفرق بين سير ثابت وagent يختار الخطوات — وإزاي تحط حدود. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "لقطة بصرية",
    title: "هدف + أدوات + حدود",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM4AgentsScreenshot,
      alt: "مخطط يوضح agent بيهدف لهدف واحد بأدوات محدودة وحدود واضحة.",
      caption:
        "الثلاثية: هدف واحد واضح، أدوات قليلة مسموحة، حد يوقفه لو عدّى. من غيرها الـ Agent خطر.",
      label: "automator-m5-l3-agents",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m5-l3-agents-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "شكاوى العملاء أنواعها كتير ومش كل شكوى نفس الخطوات. Workflow ثابت ولا Agent؟",
          options: [
            "Workflow ثابت بشروط كتير لكل احتمال.",
            "Agent بهدف واضح وأدوات محددة وحد يمنع الإرسال بدون موافقة.",
            "Agent مفتوح بكل الأدوات عشان يكون «ذكي».",
          ],
          correctIndex: 1,
          explanation:
            "الشكاوى المتنوعة تحتاج قرار مرن — بس لازم حدود وأدوات محدودة. مفتوح = مخاطرة.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "هدف آمن + أدوات + حد واحد",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة تصميم حماية — مش بناء agent. اختار شغل عندك فيه خطوات مش ثابتة وحدّد إزاي agent آمن يتعامل معاه.\n\nمش مطلوب كود — مطلوب هدف + أدوات مسموحة + حد واحد واضح.",
      prompt:
        "في تسليمك اكتب:\n\n١) الهدف: الـ Agent يعمل إيه بالظبط؟ (جملة واحدة)\n٢) أداة ١ مسموحة: [إيه بتعمل]\n٣) أداة ٢ مسموحة: [إيه بتعمل]\n٤) حد واحد: [إيه خارج النطاق أو إمتى يقف]\n٥) لو فشل أو عدّى الحد: [مين يستلم؟]\n\n+ جملة: ليه الحد ده مهم لشغلك؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "الهدف:\n[جملة واحدة]\n\nأداة ١:\n[اسم + وظيفة]\n\nأداة ٢:\n[اسم + وظيفة]\n\nالحد:\n[قاعدة واحدة واضحة]\n\nلو فشل:\n[تحويل لـ …]\n\nليه الحد مهم:\n[جملة واحدة]",
      rubric: [
        {
          label: "هدف وأدوات",
          weight: 60,
          criteria: ["هدف محدد + أداتين بوظيفة واضحة — مش «كل حاجة»."],
        },
        {
          label: "حد وتحويل",
          weight: 40,
          criteria: ["حد قابل للتطبيق + مسار تحويل لو فشل."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت Agents",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ الـ Agent يختار الخطوات — بس محتاج هدف وأدوات وحدود عشان يفضل آمن.",
        "تقدر تعمل إيه؟ عندك تصميم agent آمن لشغل متكرر فيه مسارات مختلفة.",
        "اللي جاي: Lead Capture — إزاي ماحدش مهتم يقع من الشبكة.",
      ],
    },
  },
];
