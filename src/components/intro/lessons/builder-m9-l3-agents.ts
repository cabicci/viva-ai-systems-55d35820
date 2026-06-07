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
import agentsDiagram from "@/assets/lessons/concepts/agents-diagram.jpg";

/** Builder · M9 · Lesson 03 — Agents (v3: Lesson Shape pilot · optional depth) */
export const BUILDER_M9_AGENTS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ الـ Agent محتاج هدف + أدوات + حدود — مش بس ردود كلام.",
        "ليه دلوقتي؟ RAG خلّى الـ AI يرد من ملفاتك — بس «احجزلي ميعاد» طلب تنفيذ مش معلومة.",
        "هتعمل إيه بعد الدرس؟ هتحدّد هدف + أداتين + حد واحد (خارج النطاق).",
        "عمق اختياري: الدرس ده للي عايز يبني agents. تقدر تعدّيه لو هدفك استخدام AI في شغلك بس — باقي المسارات لسه قيمة.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "الـ AI وصف الحل — بس ما نفّذش",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "العميل: «عايز ألغي اشتراكي». الـ AI: «روح Settings → Billing → Cancel».",
        "العميل قفل الشات متضايق — إنت رميتله تعليمات بدل ما تخلّص له المشكلة.",
        "Chatbot بيرد. Agent بينفّذ — بس لازم أدوات محددة وحدود واضحة.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "Agent = هدف + أدوات + حدود",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Agent = AI ياخد قرارات ويستخدم tools (functions) عشان ينفّذ في العالم الحقيقي.",
        "Tools زي `cancelSubscription` أو `searchOrders` — الـ Agent يختار إمتى يستخدمهم.",
        "Boundaries (حدود): إيه خارج النطاق — زي «ما تمسحش بيانات من غير تأكيد» أو «ما تدفعش من غير موافقة».",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "Chatbot بيقول vs Agent بيعمل",
    block: {
      kind: "comparison",
      left: {
        label: "Chatbot — كلام بس",
        body: "«عشان تلغي، اعمل كذا وكذا». العميل لسه محتاج يتحرك بنفسه — حس إن الـ AI ديكور.",
      },
      right: {
        label: "Agent — تنفيذ",
        body: "يستخدم `getSubscription` → يسأل «أكّد الإلغاء؟» → `cancelSubscription`. المهمة خلصت في ٢٠ ثانية.",
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
          term: "Agent",
          meaning: "AI ياخد قرارات وينفّذ — مش بس يرد بكلام.",
          example: "يلغي اشتراك، يغيّر ميعاد — بنفسه باستخدام أدوات.",
        },
        {
          term: "Tool (أداة)",
          meaning: "function في الكود الـ Agent يقدر يستدعيها — زي `sendEmail` أو `findOrder`.",
          example: "زي الشيف بيستخدم سكينة — الـ Agent بيستخدم tool عشان ينفّذ.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — فكّر، نفّذ، كرّر",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "الفرق بين Chatbot و Agent — وإزاي الأدوات والحدود بتشتغل. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "دايرة تفكير الـ Agent",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: agentsDiagram,
      alt: "رسم بياني لـ AI Agent: LLM في النص، وحواليه أدوات، وبيلف في دايرة فكر -> نفذ -> لاحظ -> كرر.",
      caption:
        "Think → Act (أداة) → Observe (النتيجة) → كرّر لحد ما المهمة تخلص. ده اللي يخلّيه يحل مشاكل من كذا خطوة.",
      label: "Agent Loop",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m9-l3-agents-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "عميل مش لاقي فاتورته. عندك `search_orders` و `create_ticket`. الـ Agent يبدأ بإيه؟",
          options: [
            "`search_orders` الأول — يجمع معلومات قبل أي أكشن.",
            "`create_ticket` على طول — يفتح شكوى فورًا.",
            "يسأل العميل رقم الفاتورة — من غير ما يدور.",
          ],
          correctIndex: 0,
          explanation:
            "Agent شاطر يجمع معلومات الأول — زي موظف خدمة عملاء — قبل ما ينفّذ.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "هدف + ٢ أدوات + ١ حد",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "صمّم Agent بسيط — مش كود، تخطيط بس.\n\n١٠–١٥ دقيقة.",
      prompt:
        "في تسليمك اكتب:\n\n١) **الهدف:** الـ Agent بيعمل إيه؟ (سطر واحد)\n\n٢) **أداة ١:**\n   - الاسم (إنجليزي):\n   - بتعمل إيه:\n\n٣) **أداة ٢:**\n   - الاسم:\n   - بتعمل إيه:\n\n٤) **حد واحد (خارج النطاق):** الـ Agent ما يعملش إيه — ولِيه؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "الهدف:\n[...]\n\nأداة ١:\nالاسم: [...]\nبتعمل: [...]\n\nأداة ٢:\nالاسم: [...]\nبتعمل: [...]\n\nحد (خارج النطاق):\nما يعملش: [...]\nلِيه: [...]",
      rubric: [
        {
          label: "هدف وأدوات",
          weight: 60,
          criteria: [
            "هدف واضح في سطر.",
            "أداتين مختلفتين — اسم ووصف لكل واحدة.",
          ],
        },
        {
          label: "حد أمان",
          weight: 40,
          criteria: [
            "حد واحد واقعي (خارج النطاق) — مش مجرد «ما يغلطش».",
            "سبب منطقي للحد.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ Agent = هدف + tools + حدود — مش chatbot بس.",
        "تقدر تعمل إيه؟ عندك تصميم Agent بأداتين وحد واحد.",
        "اللي جاي: Deploy — تطلّع تطبيقك للعالم بلينك عام وأسرار محمية.",
      ],
    },
  },
];
