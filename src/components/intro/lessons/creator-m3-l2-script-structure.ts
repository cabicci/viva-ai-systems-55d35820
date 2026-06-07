import {
  Sparkles,
  AlertCircle,
  Lightbulb,
  Scale,
  BookOpen,
  PlayCircle,
  Image as ImageIcon,
  Rocket,
  CheckCircle2,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import structureScreenshot from "@/assets/lessons/creator-m3-l2-script-structure.jpg";

export const CREATOR_M2_SCRIPT_STRUCTURE_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "السكربت الواضح يوفر وقتك",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "السكربت مش تعقيد، هو ترتيب يمنع اللخبطة وقت التصوير.",
        "النهاردة هتتعلم شكل بسيط: خطاف ثم قيمة ثم دليل ثم طلب واضح.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "المشكلة الشائعة",
    title: "الارتجال بيضيع الفكرة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "من غير بنية، الفيديو يطول ويضيع منه الهدف.",
        "المشاهد غالبًا يخرج قبل ما توصل لرسالتك الأساسية.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "خطاف ثم قيمة ثم دليل ثم CTA",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "ابدأ بجملة توقف المشاهد، بعدها قدم القيمة الأساسية بوضوح.",
        "ادعم الكلام بدليل أو مثال واقعي، وفي النهاية اطلب خطوة واحدة فقط.",
        "الـ AI يقدر يساعدك ترتب المسودة بسرعة، لكن القرار النهائي لنبرة السكربت ودقته لازم يكون منك.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مقارنة سريعة",
    title: "سكربت مرتب ولا كلام مشتت؟",
    block: {
      kind: "comparison",
      left: {
        label: "بدون بنية",
        body: "أفكار متداخلة وطلبات متعددة في الآخر، فالتأثير يضعف.",
      },
      right: {
        label: "ببنية واضحة",
        body: "كل جزء له وظيفة، فالمشاهد يفهم بسرعة ويعرف يعمل إيه بعد الفيديو.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "قاموس الدرس",
    title: "٣ مصطلحات أساسية",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Value Block",
          meaning: "الجزء اللي يقدم الفكرة أو الخطوة الأساسية مباشرة.",
          example: "طريقة مختصرة تنفذها فورًا.",
        },
        {
          term: "Proof",
          meaning: "دليل بسيط يثبت إن الكلام قابل للتطبيق.",
          example: "نتيجة رقمية أو مثال عملي.",
        },
        {
          term: "CTA",
          meaning: "طلب واحد واضح بعد انتهاء السكربت.",
          example: "جرب الخطوة دي النهاردة وابعتلي النتيجة.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "بناء سكربت خطوة بخطوة",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "لو عايز تشتغل بسرعة، تخطى الفيديو وكمّل من النص، كل العناصر مكتوبة للتنفيذ المباشر.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "لقطة بصرية",
    title: "شكل السكربت المتوازن",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: structureScreenshot,
      alt: "لقطة توضيحية لتوزيع أجزاء السكربت داخل فيديو قصير.",
      caption:
        "التوزيع الواضح على أجزاء قصيرة بيخلي السكربت مركز وسهل التنفيذ.",
      label: "creator-m3-l2-script-structure",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تثبيت الفهم",
    title: "سؤال واحد للتطبيق",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m3-l2-script-structure-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "لو سكربتك فيه معلومات كويسة بس النهاية فيها ٤ طلبات مختلفة، فين المشكلة الأساسية؟",
          options: [
            "جزء الدليل.",
            "جزء الطلب النهائي لأنه مشتت.",
            "جزء الخطاف.",
          ],
          correctIndex: 1,
          explanation:
            "الطلب النهائي لازم يكون واحد واضح عشان المشاهد يعرف الخطوة المطلوبة فورًا.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "تدريب عملي",
    title: "اكتب مخطط بوست أو فيديو واحد",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة تدريب كتابة مش اختبار. اكتب مخطط محتوى واحد بالبنية: خطاف ثم قيمة ثم دليل ثم CTA.",
      prompt:
        "اكتب التسليم بالشكل ده:\n\n١) موضوع المحتوى: [اكتب الموضوع]\n٢) الخطاف: [جملة البداية]\n٣) القيمة الأساسية: [الفكرة الرئيسية]\n٤) الدليل: [مثال أو نتيجة]\n٥) CTA: [طلب واحد واضح]",
      buttonLabel: "انسخ المهمة",
      copiedLabel: "اتنسخت",
      template:
        "موضوع المحتوى:\n[ ]\n\nالخطاف:\n[ ]\n\nالقيمة الأساسية:\n[ ]\n\nالدليل:\n[ ]\n\nCTA:\n[ ]",
      rubric: [
        {
          label: "اكتمال البنية",
          weight: 50,
          criteria: ["الأجزاء الأربعة موجودة وواضحة."],
        },
        {
          label: "قابلية التنفيذ",
          weight: 50,
          criteria: ["المخطط مباشر وسهل يتحول لمحتوى فعلي."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "إقفال الدرس",
    title: "بقى عندك قالب تنفيذ واضح",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "دلوقتي تقدر ترتب أفكارك بسرعة وتنتج محتوى أوضح بثقة أعلى.",
        "كمّل بنفس المنهج: طبّق المخطط على أكتر من فكرة وراقب التحسن في التفاعل.",
      ],
    },
  },
];
