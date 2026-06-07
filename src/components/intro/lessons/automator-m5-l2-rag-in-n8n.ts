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
import automatorM4RagInN8NScreenshot from "@/assets/lessons/unique/automator-m5-l2-rag-in-n8n.jpg";

/** Automator · M5 · RAG جوه الـ Automation (v3: Lesson Shape pilot) */
export const AUTOMATOR_M5_L2_RAG_IN_N8N_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ RAG يخلي الأوتوميشن يجاوب من معرفتك — أسئلة شائعة، أسعار، سياسات — مش من تخمين.",
        "ليه دلوقتي؟ بعد ما عرفت تضيف خطوة AI، محتاج تضمن إن الردود مبنية على بياناتك مش على خيال الموديل.",
        "هتعمل إيه بعد الدرس؟ هتختار مصدر FAQ أو مستند واحد تربطه بالأوتوميشن.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "البوت قال سعر غلط — والعميل صدّق",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "شغّلت رد آلي ذكي على استفسارات العملاء. عميل سأل «سعر الباقة الذهبية؟» — البوت رد برقم من عنده.",
        "الرقم غلط. العميل زعل أو اشترى بتوقعات غلط. إنت بتصلّح يدوي وبتعتذر.",
        "المشكلة: الـ AI بيجاوب من معرفة عامة مش من ملفاتك. RAG بيحل ده — يبحث في مصادرك الأول وبعدين يكتب الرد.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "RAG = ابحث في معرفتك — وبعدين اكتب الرد",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بدون RAG: السؤال → AI → رد من تخمين. ممكن يكون صح — وممكن يخترع.",
        "مع RAG: السؤال → بحث في FAQs/مستنداتك → أهم المقتطفات + السؤال → AI يكتب رد مبني على المصدر.",
        "مرة واحدة: تجهّز مصادرك (أسئلة شائعة، قائمة أسعار، سياسة استرجاع).",
        "كل سؤال: الأوتوميشن يسحب المقتطف المناسب ويرد منه — مش من فراغ.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "تخمين vs رد من مصدرك",
    block: {
      kind: "comparison",
      left: {
        label: "AI بدون RAG",
        body: "«إيه مدة التوصيل؟» — البوت يخمّن «٢–٣ أيام» من معرفة عامة. عندك مناطق بتوصل في ٥ أيام — العميل مستني غلط.",
      },
      right: {
        label: "AI + RAG",
        body: "«إيه مدة التوصيل؟» — الأوتوميشن يسحب من جدول التوصيل بتاعك: «القاهرة ١–٢ يوم، الصعيد ٣–٥». الرد دقيق من ملفك.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين لـ RAG",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Knowledge Source (مصدر المعرفة)",
          meaning: "المكان اللي الأوتوميشن يقرأ منه — FAQ، Google Doc، قائمة أسعار، سياسات.",
          example: "شيت فيه ٥٠ سؤال شائع وإجابتهم — ده مصدرك الأول.",
        },
        {
          term: "Retrieval (الاسترجاع)",
          meaning: "لما سؤال يوصل، النظام يسحب أقرب مقتطف من مصدرك قبل ما يكتب الرد.",
          example: "سؤال عن الضمان → يسحب فقرة «سياسة الضمان ١٢ شهر» من الملف.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — RAG في الأوتوميشن",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تربط مصدر معرفة بسير الردود الآلية. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "لقطة بصرية",
    title: "مسار السؤال للمصدر للرد",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM4RagInN8NScreenshot,
      alt: "مخطط يوضح مسار السؤال عبر الاسترجاع من المعرفة ثم توليد الرد.",
      caption:
        "السؤال يمرّ على مصدرك الأول — وبعدين الـ AI يصيغ الرد. المعرفة ثابتة؛ الصياغة مرنة.",
      label: "automator-m5-l2-rag-in-n8n",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m5-l2-rag-in-n8n-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "عندك بوت يرد على أسئلة العملاء عن منتجاتك — وبيرد أرقام غلط أحيانًا. أحسن خطوة أولى؟",
          options: [
            "تكتب system prompt أطول يقوله «متخمّنش».",
            "تختار مصدر FAQ أو قائمة أسعار وتربطه بالأوتوميشن قبل كل رد.",
            "توقف البوت وترد يدوي على كل الأسئلة.",
          ],
          correctIndex: 1,
          explanation:
            "RAG بيحل جذر المشكلة — الرد ييجي من مصدرك مش من تخمين. الـ prompt لوحده مش كفاية.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اختار مصدر FAQ أو مستند واحد",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة اختيار عملي — مش بناء تقني. اختار مصدر معرفة واحد عندك (أو هتعمله) وتشرح إزاي الأوتوميشن هيسحب منه.\n\nمش مطلوب vector database — مطلوب مصدر واضح + مثال سؤال وجواب.",
      prompt:
        "في تسليمك اكتب:\n\n١) المصدر: FAQ / Doc / شيت — إيه بالظبط؟\n٢) ٣ أسئلة العملاء بيسألوها فعلًا:\n٣) لكل سؤال: أنهي جزء في المصدر هيجاوبه؟\n٤) لو المصدر مافيهوش الإجابة — الرد البديل إيه؟\n\n+ جملة: ليه المصدر ده أهم واحد تبدأ بيه؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "المصدر:\n[نوع + مكان]\n\nسؤال ١: [السؤال]\n→ المقتطف: [منين في المصدر]\n\nسؤال ٢: [السؤال]\n→ المقتطف: [منين]\n\nسؤال ٣: [السؤال]\n→ المقتطف: [منين]\n\nلو مافيش إجابة:\n[الرد البديل]\n\nليه أهم مصدر:\n[جملة واحدة]",
      rubric: [
        {
          label: "مصدر حقيقي",
          weight: 60,
          criteria: ["مصدر محدد — مش «هحط كل الملفات»."],
        },
        {
          label: "ربط سؤال بمصدر",
          weight: 40,
          criteria: ["٣ أسئلة مربوطة بمقتطفات + fallback لو مافيش إجابة."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت RAG",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ RAG يخلي الأوتوميشن يجاوب من معرفتك — مش من تخمين.",
        "تقدر تعمل إيه؟ عندك مصدر واحد مختار وجاهز تربطه بسير الردود.",
        "اللي جاي: Agents — لما الخطوات مش ثابتة والـ AI يختار الطريق.",
      ],
    },
  },
];
