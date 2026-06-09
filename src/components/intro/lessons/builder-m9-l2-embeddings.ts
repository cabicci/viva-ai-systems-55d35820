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
import embeddingsDiagram from "@/assets/lessons/concepts/embeddings-diagram.jpg";

/** Builder · M9 · Lesson 02 — Embeddings (v3: Lesson Shape pilot · optional depth) */
export const BUILDER_M9_EMBEDDINGS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ الـ Embedding (تحويل الكلام لأرقام تمثّل المعنى) يلاقي المعنى — مش الكلمة الحرفية.",
        "ليه دلوقتي؟ RAG (AI يجاوب من ملفاتك بدل ما يخمّن) محتاج يدوّر في ملفاتك — والبحث العادي مش بيفهم «قصدك إيه».",
        "هتعمل إيه بعد الدرس؟ هتكتب سؤالين مختلفين في الكلمات — نفس المعنى.",
        "عمق اختياري: الدرس ده للي عايز يبني RAG حقيقي. تقدر تعدّيه لو لسه في الأساسيات — باقي المسارات لسه قيمة.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "العميل كتب «إزاي الـ AI بيرد؟» — ومفيش نتائج",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "البحث التقليدي بيدور على الكلمات حرفيًا. «يرد» مش مكتوبة في المقال — رغم إن المقال بيشرح الموضوع!",
        "المخزن شاطر في مقارنة نصوص — بس مش بيفهم إن «يرد» و«يجاوب» و«يولّد رد» نفس الفكرة.",
        "عشان RAG (AI يجاوب من ملفاتك بدل ما يخمّن) يشتغل صح، محتاج بحث بالمعنى — مش بالحروف.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "Embeddings تلاقي المعنى — مش الكلمات",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Embedding (تحويل الكلام لأرقام تمثّل المعنى) = تحوّل أي نص لقايمة أرقام بتمثّل «مكانه على خريطة المعاني».",
        "الجمل اللي معناها قريب — الأرقام بتاعتها قريبة. «قطة بتلعب» و«كلب بيجري» أقرب من «البورصة».",
        "لما العميل يسأل، بنحوّل سؤاله لـ Vector (طريقة تخزين المعنى بشكل رقمي) وندوّر على أقرب Chunks (أجزاء صغيرة من المحتوى) — حتى لو الكلمات مختلفة.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "بحث حرفي vs بحث بالمعنى",
    block: {
      kind: "comparison",
      left: {
        label: "غلط — بحث بالكلمة",
        body: "«إزاي الـ AI بيرد؟» — مفيش match حرفي. العميل يحس إن مفيش محتوى — رغم إن عندك دروس عن tokens والـ context.",
      },
      right: {
        label: "صح — embedding",
        body: "السؤال يتحوّل لـ Vector (طريقة تخزين المعنى بشكل رقمي) — يلاقي Chunks (أجزاء صغيرة من المحتوى) عن «توليد الرد». نفس المعنى، كلمات مختلفة.",
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
          term: "Embedding (تحويل الكلام لأرقام تمثّل المعنى)",
          meaning: "تحوّل النص لـ Vector — أرقام بتوصف المعنى على «خريطة».",
          example: "«عربية» → ١٥٣٦ رقم بيوصف المعنى من زوايا مختلفة.",
        },
        {
          term: "Vector Search (بحث بالمعنى)",
          meaning: "البحث عن أقرب Vectors (طريقة تخزين المعنى بشكل رقمي) للسؤال — مش match حرفي.",
          example: "«وصفات سريعة» يلاقي «وجبات في ١٥ دقيقة» — من غير كلمة «سريعة».",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — من نص لخريطة معاني",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي embeddings بتحوّل الكلام لأرقام والبحث يلاقي المعنى. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "من نص لـ vector لخريطة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: embeddingsDiagram,
      alt: "رسم بياني للـ embeddings: جملة بتتحول لقايمة أرقام vector، والـ vectors بتترسم في فضاء، الجمل اللي معناها قريب بتبقى جنب بعضها.",
      caption:
        "كل جملة ليها «مكان» على الخريطة. المعنى القريب = نقاط قريبة. المعنى البعيد = حتة تانية خالص.",
      label: "Embeddings — خريطة المعاني",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m9-l2-embeddings-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "مدونة وصفات — العميل بيدور «أكل خفيف وسريع». إيه أحسن حاجة تعملها embedding؟",
          options: [
            "اسم الوصفة + المكونات + طريقة التحضير — مع بعض.",
            "اسم الوصفة بس.",
            "عدد السعرات بس.",
          ],
          correctIndex: 0,
          explanation:
            "كل ما السياق أغنى، الـ embedding يفهم «خفيف وسريع» أحسن — مش بس الاسم.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "سؤالين — نفس المعنى، كلمات مختلفة",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "اختبار embeddings: سؤالين مختلفين في الكلمات — نفس القصد.\n\n١٠ دقايق كفاية.",
      prompt:
        "في تسليمك اكتب:\n\n١) نوع محتوى تطبيقك (منتجات، مقالات، أسئلة شائعة، ...):\n\n٢) سؤال ١ — بالكلمات اللي عميلك ممكن يكتبها:\n\n٣) سؤال ٢ — نفس المعنى، كلمات مختلفة تمامًا:\n\n٤) إيه الـ chunk المتوقع يلاقوه الاتنين؟ (جملة من محتواك)",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "نوع المحتوى:\n[...]\n\nسؤال ١:\n[...]\n\nسؤال ٢ (نفس المعنى):\n[...]\n\nالـ chunk المتوقع:\n[...]\n\nلِيه الاتنين يلاقوه:\n[...]",
      rubric: [
        {
          label: "سؤالين مختلفين",
          weight: 50,
          criteria: [
            "السؤالين معناهم واحد — الكلمات مختلفة فعلًا.",
            "مش نفس الجملة بترتيب مختلف.",
          ],
        },
        {
          label: "chunk منطقي",
          weight: 50,
          criteria: [
            "حدّدت chunk واحد الاتنين المفروض يلاقوه.",
            "شرح قصير لِيه embedding يربطهم.",
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
        "فهمت إيه؟ Embeddings = بحث بالمعنى — مش بالكلمة الحرفية.",
        "تقدر تعمل إيه؟ عندك سؤالين باختبار — نفس القصد، كلمات مختلفة.",
        "اللي جاي: Agents — الـ AI اللي بينفّذ مش بس يرد.",
      ],
    },
  },
];
