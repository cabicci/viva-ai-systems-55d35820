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
        "هتفهم إيه؟ في Automator، RAG = الرد الآلي يجاوب من مستندات شغلك (FAQ، أسعار، سياسات) — مش من تخمين.",
        "ليه دلوقتي؟ لما عميل يسأل البوت عن سعر أو ضمان، لازم يسحب من ملفك — مش يخترع رقم.",
        "هتعمل إيه بعد الدرس؟ رسمة workflow بسيطة: سؤال → مصدر → رد. مش بناء تقني.",
        "ده مختلف عن Builder: هنا RAG جوه سير عمل (واتساب، إيميل، CRM) — مش جوه تطبيق تبنيه.",
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
        "مع RAG في Automator: السؤال → سحب من FAQ أو شيت الأسعار → AI يصيغ الرد من المقتطف.",
        "مرة واحدة: جهّز مصدر واحد (أسئلة شائعة، قائمة أسعار، سياسة استرجاع).",
        "كل سؤال جديد: السير يشتغل لوحده — يسحب المقتطف ويرد. مش محتاج تفتح n8n أو Make دلوقتي.",
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
    title: "اتفرّج — RAG في سير الردود",
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
        "المهمة رسمة workflow — مش بناء تقني. ارسم إزاي السؤال يمشي من العميل للمصدر للرد.\n\nمش مطلوب n8n ولا vector database.",
      prompt:
        "في تسليمك ارسم workflow بسيط (نص أو أسهم):\n\n١) Trigger: السؤال بيوصل منين؟ (واتساب / إيميل / فورم)\n\n٢) المصدر: FAQ / Doc / شيت — إيه بالظبط؟\n\n٣) ٣ أسئلة عملاء — لكل سؤال: أنهي جزء في المصدر؟\n\n٤) لو مافيش إجابة في المصدر — الرد البديل؟\n\n٥) الخطوة الأخيرة: إرسال الرد للعميل\n\nمثال: سؤال → سحب من شيت الأسعار → صياغة رد → واتساب",
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
        "فهمت إيه؟ في Automator، RAG = الرد الآلي من مستندات شغلك — مش تخمين ولا بناء تطبيق.",
        "تقدر تعمل إيه؟ عندك رسمة workflow: سؤال → مصدر → رد.",
        "اللي جاي: Agents — لما الخطوات مش ثابتة والـ AI يختار الطريق.",
      ],
    },
  },
];
