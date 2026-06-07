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
import editingScreenshot from "@/assets/lessons/unique/creator-m5-l1-editing.jpg";

export const CREATOR_M4_EDITING_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "المونتاج بيوضح رسالتك مش بس يجمّلها",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "حتى لو الفكرة ممتازة، العرض الضعيف بيخلي الرسالة تضيع.",
        "المونتاج الصح بيشيل الزوائد ويخلي المعنى يوصل أسرع وأوضح.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "المشكلة",
    title: "النسخة الخام غالبا مشتتة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كلام مكرر، سكتات طويلة، وبدايات بطيئة بتخلي المشاهد يسيب الفيديو.",
        "التحرير مش رفاهية هنا، هو وسيلة احترام وقت المتفرج.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "قص الزايد وخلي المسار واضح",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "ابدأ بسؤال بسيط: كل جملة في الفيديو بتخدم الفكرة ولا لا؟",
        "احذف أي جملة مكررة أو خروج عن الموضوع.",
        "خلي الإيقاع متماسك: بداية واضحة، نقطة أساسية، ثم قفلة عملية.",
        "لو الصوت أو الصورة في جزء معين مشتتين، اختصره أو استبدله.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مقارنة سريعة",
    title: "تكديس لقطات vs رسالة مركزة",
    block: {
      kind: "comparison",
      left: {
        label: "الأسلوب المربك",
        body: "تضيف كل اللقطات المتاحة بدون فلترة، فيتحول الفيديو لزحمة تفاصيل.",
      },
      right: {
        label: "الأسلوب الواضح",
        body: "تختار اللقطات اللي بتخدم الفكرة فقط، فيوصل المعنى بسرعة وبثقة.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "مصطلحات مهمة",
    title: "مصطلحين أساسيين",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Pacing",
          meaning: "سرعة انتقال الفيديو بين الجمل واللقطات.",
          example: "قص السكتة الطويلة يحسن الإيقاع مباشرة",
        },
        {
          term: "Cut for Clarity",
          meaning: "قص الجزء اللي يشتت عشان المعنى يبقى أوضح.",
          example: "حذف جملة جانبية مالهاش علاقة بالنقطة",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "تحرير سريع على قطعة قصيرة",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "تطبيق عملي لقص وتحسين الإيقاع. لو مستعجل، تقدر تتخطى الفيديو وتنفذ المهمة على طول.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "مثال بصري",
    title: "فرق قبل وبعد التحرير",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: editingScreenshot,
      alt: "لقطة توضح تايملاين تحرير فيديو قصير",
      caption:
        "النسخة المعدلة بتكون أقصر وأوضح لأن كل جزء فيها له وظيفة، ومفيش حشو يضيع التركيز.",
      label: "unique/creator-m5-l1-editing.jpg",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "أفضل قرار أثناء المونتاج",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m5-l1-editing-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "أثناء مراجعة فيديو قصير، لقيت جملة لطيفة بس مش بتخدم الفكرة الأساسية. تتصرف ازاي؟",
          options: [
            "أسيبها لأنها حلوة وممكن تعجب ناس",
            "أحذفها لأنها بتضعف وضوح الرسالة",
            "أكررها في البداية والنهاية",
          ],
          correctIndex: 1,
          explanation:
            "التحرير الفعال بيقدم الوضوح على الزينة، فكل جملة لازم تخدم الهدف.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمة تطبيق",
    title: "اعمل Checklist تحرير أو عدّل قطعة واحدة",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "قدامك اختيارين عمليين: تبني Checklist بسيطة للتحرير، أو تطبق التحرير على قطعة قصيرة فعلية عندك.",
      prompt:
        "اختار مسار واحد:\n\nمسار ١ - Checklist\nاكتب Checklist من ٦ نقاط لتوضيح الرسالة قبل النشر.\n\nمسار ٢ - تطبيق\nاختار قطعة قصيرة وعدّلها، ثم اكتب:\n١) إيه اللي شيلته\n٢) إيه اللي اختصرته\n٣) إزاي الرسالة بقت أوضح",
      buttonLabel: "انسخ المهمة",
      copiedLabel: "اتنسخت",
      template:
        "المسار المختار: [Checklist/تطبيق]\n\nلو Checklist:\n١)\n٢)\n٣)\n٤)\n٥)\n٦)\n\nلو تطبيق:\nالقطعة:\n[وصف]\n\nاتشال:\n[اكتب]\n\nاتختصر:\n[اكتب]\n\nالوضوح بعد التعديل:\n[اكتب]",
      rubric: [
        {
          label: "وضوح التنفيذ",
          weight: 50,
          criteria: ["في خطوات محددة أو تعديلات فعلية موثقة."],
        },
        {
          label: "تحسن الرسالة",
          weight: 50,
          criteria: ["واضح إن التعديل خلى الفكرة أسهل للفهم."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "قفلة واثقة",
    title: "إنت قادر تخلي المحتوى أوضح",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "المونتاج الذكي بيختصر المسافة بين فكرتك وعقل المشاهد.",
        "كل مرة تحرر بوعي، جودة المحتوى وثقتك بتعلى خطوة.",
      ],
    },
  },
];
