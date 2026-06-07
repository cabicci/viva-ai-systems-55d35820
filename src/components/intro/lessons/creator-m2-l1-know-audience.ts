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

export const CREATOR_M3_KNOW_AUDIENCE_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "لو بتكلم الكل يبقى ولا حد",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أقوى نقلة في المحتوى بتحصل لما تحدد مين الشخص اللي بتخاطبه فعلًا.",
        "كل ما جمهورك يبقى أوضح، رسالتك تبقى أدق وفرصة التفاعل أعلى.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "نقطة الألم",
    title: "العمومية بتضيع الرسالة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "لما الكلام يكون عام، المتلقي مش بيحس إن المحتوى معمول له.",
        "النتيجة إن المجهود كبير لكن التأثير ضعيف ومتقطع.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "جمهور واحد واضح أحسن",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تحديد الجمهور مش تقليل للفرص، ده تركيز يخليك توصل بوضوح أسرع.",
        "الـ AI يقدر يساعدك ترتب أفكار البيرسونا، لكن قرار مين جمهورك الحقيقي لازم يطلع من ملاحظتك وخبرتك.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مقارنة سريعة",
    title: "رسالة عامة ولا موجهة؟",
    block: {
      kind: "comparison",
      left: {
        label: "محتوى عام",
        body: "بيحاول يناسب الجميع فغالبًا ما يلمسش حد بشكل عميق.",
      },
      right: {
        label: "محتوى موجه",
        body: "مبني لشخص واضح بمشكلاته، فيبقى أقرب للفهم والتفاعل.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "قاموس الدرس",
    title: "٣ مصطلحات مهمة",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Persona",
          meaning: "وصف عملي لشخص تمثيلي من جمهورك الأساسي.",
          example: "موظف مبتدئ محتاج حلول سريعة بعد الشغل.",
        },
        {
          term: "Pain Point",
          meaning: "مشكلة متكررة بتتعب الجمهور وبتدور على حل.",
          example: "معندوش وقت ينفذ خطة معقدة.",
        },
        {
          term: "Audience Sentence",
          meaning: "جملة واحدة دقيقة تعرف مين بتخاطب.",
          example: "أنا بكلم أصحاب مشاريع صغيرة عايزين محتوى بسيط يجذب عملاء.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "إزاي تحدد جمهورك بسرعة",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "لو وقتك ضيق، تقدر تتخطى الفيديو وتكمل القراءة، كل الخطوات موجودة هنا.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "رسم توضيحي",
    title: "خريطة شخصية الجمهور",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "audience-persona",
      label: "audience-persona",
      caption:
        "الرسم ده بيساعدك تجمع الصورة كاملة: الشخص، مشاكله، وهدفه اللي بيدور عليه.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تثبيت الفهم",
    title: "سؤال واحد للتطبيق",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m2-l1-know-audience-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "حد بيقول جمهوري هو كل المهتمين بالمحتوى. إيه أفضل تعديل عملي؟",
          options: [
            "يسيبها عامة عشان يوصل لعدد أكبر.",
            "يكتب جملة جمهور واحدة واضحة ويحدد ٣ آلام أساسية.",
            "يركز على تغيير ألوان التصميم.",
          ],
          correctIndex: 1,
          explanation:
            "وضوح جملة الجمهور والآلام الأساسية هو اللي يخلي الرسالة دقيقة وقابلة للتنفيذ.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "تدريب عملي",
    title: "صياغة جمهورك في جملة",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة تدريب كتابة مش اختبار. المطلوب جملة جمهور واضحة + ٣ آلام حقيقية بلسان الناس.",
      prompt:
        "اكتب التسليم بالشكل ده:\n\n١) جملة الجمهور: أنا بكلم [مين بالضبط]\n٢) الألم ١: [اكتب الألم]\n٣) الألم ٢: [اكتب الألم]\n٤) الألم ٣: [اكتب الألم]\n٥) جملة ختامية: أكتر ألم هتركز عليه الأول وليه",
      buttonLabel: "انسخ المهمة",
      copiedLabel: "اتنسخت",
      template:
        "جملة الجمهور:\nأنا بكلم [ ]\n\nالألم ١:\n[ ]\n\nالألم ٢:\n[ ]\n\nالألم ٣:\n[ ]\n\nالأولوية الأولى:\n[ ]",
      rubric: [
        {
          label: "وضوح الجمهور",
          weight: 50,
          criteria: [
            "الجملة محددة ومش فضفاضة.",
            "الجمهور قابل للتخيل كشخص واضح.",
          ],
        },
        {
          label: "جودة الآلام",
          weight: 50,
          criteria: ["الآلام الثلاثة واقعية ومباشرة."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "إقفال الدرس",
    title: "كده جمهورك بدأ يوضح",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "دلوقتي عندك تعريف أدق لمين بتخاطب وإيه أوجاعه الأساسية.",
        "الخطوة الجاية: نبني أعمدة المحتوى عشان تبطل تخمين وتشتغل بنظام ثابت.",
      ],
    },
  },
];