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

export const CREATOR_M5_LEADS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "المتابع مش عميل من غير كوبري",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "عدد المتابعين مهم، بس لو مفيش انتقال منطقي لعرضك هيفضل التأثير شكله حلو بس من غير نتيجة.",
        "الهدف مش البيع المباشر في كل بوست، الهدف تبني طريق واضح من المحتوى لليدز.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "المشكلة",
    title: "فجوة بين الانتباه والشراء",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "ناس كتير بتتابعك وتستفيد، لكن لحظة القرار تضيع لأن الخطوة الجاية مش واضحة لهم.",
        "لو ما فيش CTA بسيط وقيمة أولية، المتابع يفضل متابع لفترة طويلة من غير ما يتحول لعميل محتمل.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "اعمل كوبري صغير وواضح",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "المحتوى يبني ثقة، والـ CTA ينقل الشخص لخطوة محددة: تحميل هدية بسيطة، أو رسالة بكلمة مفتاحية، أو تسجيل قصير.",
        "الهدف في المرحلة دي مش البيع الفوري، الهدف تجمع ليدز جادة تقدر تتابع معها بشكل محترم.",
        "كل ما الكوبري بسيط وواضح، التحويل يزيد بدون ضغط أو إلحاح.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مقارنة سريعة",
    title: "متابعين فقط مقابل نظام تحويل",
    block: {
      kind: "comparison",
      left: {
        label: "من غير كوبري",
        body: "محتوى جميل وتفاعل كويس، لكن مفيش خطوة انتقال واضحة. النتيجة: جمهور واسع وتحويل ضعيف.",
      },
      right: {
        label: "بكوبري واضح",
        body: "قيمة مجانية بسيطة + CTA محدد + متابعة. النتيجة: ليدز أكثر جودة حتى لو المشاهدات أقل.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "قاموس صغير",
    title: "مصطلحات أساسية في التحويل",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Lead",
          meaning: "شخص مهتم فعلا ومستعد ياخد خطوة للتواصل أو التسجيل.",
          example: "بعت كلمة مفتاحية في DM عشان ياخد التفاصيل.",
        },
        {
          term: "Lead Magnet",
          meaning: "قيمة مجانية بسيطة مقابل وسيلة تواصل.",
          example: "Checklist أو Template مرتبط بمشكلته المباشرة.",
        },
        {
          term: "CTA",
          meaning: "دعوة واضحة لخطوة واحدة بعد المحتوى.",
          example: "ابعت كلمة \"دليل\" عشان أوصلك الملف.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "ازاي تبني الكوبري بدون تعقيد",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption: "طريقة عملية لتحويل المتابع المهتم لليد فعلي من غير ما تبقى بيعي زيادة.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شكل بصري",
    title: "قمع التحويل من المحتوى لليدز",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "leads-funnel",
      label: "Leads Funnel",
      caption: "كل مرحلة تقلل العدد لكن تزود الجودة. المهم يكون الانتقال من مرحلة لمرحلة واضح.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تطبيق سريع",
    title: "سؤال واحد للتثبيت",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m6-l4-leads-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "لو عندك تفاعل عالي لكن مفيش استفسارات شراء، أنسب خطوة أولى إيه؟",
          options: [
            "تزود عدد البوستات وخلاص",
            "تضيف كوبري واضح: Lead Magnet أو عرض DM بسيط",
            "تلغي المحتوى التعليمي وتركز عروض مباشرة فقط",
          ],
          correctIndex: 1,
          explanation:
            "المشكلة هنا غالبا في غياب الانتقال الواضح، مش في حجم التفاعل نفسه.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "المهمة العملية",
    title: "صمم Lead Magnet أو عرض DM بسيط",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المطلوب خطوة تحويل واحدة واضحة تقدر تطبقها هذا الأسبوع من غير تعقيد.",
      prompt:
        "اختار واحدة من الاثنين:\n\nA) Lead Magnet بسيط\nأو\nB) عرض DM مباشر\n\nواكتب:\n1) المشكلة اللي بتحلها:\n2) شكل العرض/الهدية:\n3) CTA جملة واحدة:\n4) هترد على المهتمين بإيه كنص أول رسالة:",
      buttonLabel: "انسخ المهمة",
      copiedLabel: "اتنسخت",
      template:
        "الاختيار:\n[Lead Magnet / DM Offer]\n\nالمشكلة:\n[...]\n\nالعرض:\n[...]\n\nCTA:\n[اكتب الجملة]\n\nأول رسالة متابعة:\n[...]",
      rubric: [
        {
          label: "وضوح العرض",
          weight: 50,
          criteria: ["العرض مرتبط بمشكلة واحدة مباشرة ومفهومة."],
        },
        {
          label: "قابلية التنفيذ",
          weight: 50,
          criteria: ["في CTA واضح ورسالة أولى جاهزة للمتابعة."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "إغلاق واثق",
    title: "بقي عندك كوبري من المتابع للعميل المحتمل",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "دلوقتي مش هتعتمد على الصدفة. عندك خطوة تحويل واضحة تشتغل عليها وتتطور بالأرقام.",
        "كذا تبني Creator business متوازن: محتوى يوصل، ونظام يحول.",
      ],
    },
  },
];
