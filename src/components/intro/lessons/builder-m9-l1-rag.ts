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
import ragDiagram from "@/assets/lessons/concepts/rag-diagram.jpg";

/** Builder · M9 · Lesson 01 — RAG (v3: Lesson Shape pilot · optional depth) */
export const BUILDER_M9_RAG_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ إزاي RAG يخلي الـ AI يرد من ملفاتك — مش من تخمين.",
        "ليه دلوقتي؟ عندك تطبيق وواجهة ومخزن — بس الـ AI لسه بيرد من معلومات عامة وممكن يألّف.",
        "هتعمل إيه بعد الدرس؟ هتختار مصدر واحد (ملف أو doc) الـ AI يقرأ منه.",
        "عمق اختياري: الدرس ده للي عايز يبني منتجات AI. تقدر تعدّيه لو هدفك استخدام AI في شغلك بس — باقي المسارات لسه قيمة.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "الـ AI قال سعر غلط — وإنت ما بعتّهوش أصلًا",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بتسأل GPT عن سعر منتجك — يرد «٢٩ دولار». إنت عمرك ما بعتّه بالسعر ده!",
        "الـ AI بيخمّن إجابة شكلها منطقي — ده اسمه hallucination. العميل يفقد الثقة فيك.",
        "المشكلة مش في الـ AI — المشكلة إنه ما قراش بياناتك قبل ما يجاوب.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "RAG = يرد من ملفاتك — مش من تخمين",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "قبل ما الـ AI يجاوب، النظام بيدوّر في ملفاتك، يلاقي الحتة الصح، ويقول للـ AI: «جاوب من الورقة دي بس».",
        "RAG = Retrieve (دور) + Augment (زوّد السؤال بالسياق) + Generate (اجاب).",
        "لو المعلومة مش في ملفاتك — يقول «معرفش» أحسن من تأليف.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "سؤال مباشر vs قراءة ملفاتك الأول",
    block: {
      kind: "comparison",
      left: {
        label: "غلط — سؤال للـ AI من دماغه",
        body: "«إيه سياسة الاسترجاع؟» — الـ AI يخمّن من معلومات عامة. إجابة غلط = عميل زعلان.",
      },
      right: {
        label: "صح — RAG من ملفاتك",
        body: "النظام يلاقي فقرة «سياسة الاسترجاع» في PDF بتاعك، يحطها في الـ prompt، والـ AI ينقل منها. دقة من بياناتك.",
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
          term: "RAG",
          meaning: "الـ AI يقرأ من مصادرك قبل ما يجاوب — بحث + سياق + إجابة.",
          example: "زي مديرك يفتح الدرج ويقرأ من الفايل قبل ما يرد — مش من دماغه.",
        },
        {
          term: "Chunk (قطعة)",
          meaning: "جزء صغير من ملف كبير — عشان البحث يلاقي أقرب فقرة للسؤال.",
          example: "PDF ٥٠ صفحة → تقسّمه لفقرات ٥٠٠ كلمة — كل واحدة chunk.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — من سؤال لإجابة من ملفاتك",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "رحلة RAG: تقسيم الملفات، البحث، وإجابة من بياناتك. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "٣ خطوات في الكواليس",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: ragDiagram,
      alt: "رسم بياني للـ RAG: السؤال بيتحول لـ vector ويدور في قاعدة بيانات المستندات، وأكتر chunks شبهه بترجع وتتدمج مع السؤال في prompt واحد للـ LLM.",
      caption:
        "(١) السؤال يتحوّل لبحث في المخزن. (٢) أقرب chunks ترجع. (٣) السؤال + السياق يتبعتوا للـ AI — فيرد من ورقك مش يهلوس.",
      label: "معمارية RAG",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m9-l1-rag-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "عايز مساعد دعم لمتجرك يرد على أسئلة الشحن والأسعار. إيه أول خطوة صح؟",
          options: [
            "تجهّز ملفاتك (أسعار، سياسات) — تقسّمها chunks وتخزّنها للبحث.",
            "تعمل fine-tuning لموديل GPT على كل منتجاتك.",
            "تكتب كل الإجابات المحتملة في جدول يدوي.",
          ],
          correctIndex: 0,
          explanation:
            "RAG يبدأ بتجهيز المصادر — تقسيم وفهرسة — قبل أي إجابة. Fine-tuning وقايمة يدوية مش نفس الحل.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اختار مصدر واحد للـ AI",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "كل مساعد ذكي محتاج «Knowledge Base» — مصدر واحد واضح.\n\n١٠ دقايق كفاية.",
      prompt:
        "في تسليمك اكتب:\n\n١) تطبيقك أو بيزنسك في سطر:\n\n٢) أهم ملف أو مصدر واحد الـ AI لازم يقرأ منه:\n   - اسم المصدر:\n   - نوعه (PDF، صفحة، شيت، ...):\n   - لِيه ده المصدر الأهم؟\n\n٣) ٣ أسئلة عميل ممكن يسألها — والإجابة لازم تيجي من المصدر ده",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "التطبيق:\n[...]\n\nالمصدر:\nالاسم: [...]\nالنوع: [...]\nلِيه: [...]\n\nأسئلة (٣):\n1. [...] → الإجابة من المصدر: [...]\n2. [...]\n3. [...]",
      rubric: [
        {
          label: "مصدر واضح",
          weight: 60,
          criteria: [
            "مصدر واحد محدّد — مش «كل الملفات» بشكل عام.",
            "سبب منطقي لِيه ده أهم مصدر.",
          ],
        },
        {
          label: "أسئلة واقعية",
          weight: 40,
          criteria: [
            "٣ أسئلة عميل حقيقية — الإجابة لازم تيجي من المصدر مش تخمين.",
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
        "فهمت إيه؟ RAG = الـ AI يرد من ملفاتك — مش من تخمين.",
        "تقدر تعمل إيه؟ عندك مصدر واحد مختار + ٣ أسئلة يجاوب عليها منه.",
        "اللي جاي: Embeddings — إزاي البحث يلاقي المعنى مش الكلمة الحرفية.",
      ],
    },
  },
];
