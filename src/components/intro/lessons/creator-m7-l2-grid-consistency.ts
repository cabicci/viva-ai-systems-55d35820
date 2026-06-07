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
import gridImg from "@/assets/lessons/unique/creator-m7-l2-grid-consistency.jpg";

export const CREATOR_M6_GRID_CONSISTENCY_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "الاتساق يساعد الغريب يفهمك بسرعة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أي شخص جديد بيدخل بروفايلك بياخد قرار سريع جدا: أكمل متابعة ولا أمشي.",
        "الاتساق في الجريد بيقلل الحيرة وبيوضح نوع المحتوى قبل ما يقرأ Caption واحد.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "المشكلة",
    title: "جريد عشوائي = رسالة مشوشة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "لو كل بوست له لون وستايل مختلف، الزائر يحس إن الحساب ده بلا اتجاه حتى لو المحتوى نفسه قوي.",
        "التشتت البصري يخلي المتابع الجديد ما يفهمش إنت بتساعده في إيه بالضبط.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "ثبات بسيط يوصل المعنى أسرع",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الاتساق مش معناه كل بوست نسخة من التاني، لكنه يعني نفس الروح: ألوان قريبة، خط ثابت، ونوع أغلفة مفهوم.",
        "لما الجريد واضح، أي شخص جديد يقدر يحدد مجالك وقيمتك بسرعة، وده يرفع جودة المتابعين مش بس العدد.",
        "ابدأ بقواعد قليلة تقدر تلتزم بيها فعلا بدل نظام معقد ما يكملش أسبوعين.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مقارنة سريعة",
    title: "انطباع أولي مشوش مقابل واضح",
    block: {
      kind: "comparison",
      left: {
        label: "جريد غير متسق",
        body: "ألوان وخطوط متغيرة طول الوقت. الزائر يخرج بسرعة لأنه مش فاهم الخط العام.",
      },
      right: {
        label: "جريد متسق",
        body: "ستايل واضح ومتكرر. الزائر يفهم الهوية في ثواني ويكون مستعد يتابع بثقة.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "قاموس صغير",
    title: "مصطلحات تدير الاتساق",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Grid Pattern",
          meaning: "الترتيب البصري المتكرر في شكل البوستات.",
          example: "مثلا: تعليمي، قصة، دعوة إجراء ثم تكرار نفس الدورة.",
        },
        {
          term: "Cover Consistency",
          meaning: "ثبات شكل أغلفة الفيديوهات في الخط واللون العام.",
          example: "نفس الفونت ونفس مكان العنوان في كل غلاف.",
        },
        {
          term: "Visual Checklist",
          meaning: "قائمة مراجعة قبل النشر تضمن ثبات الهوية.",
          example: "هل اللون والنبرة والـ cover مطابقين للنمط؟",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "كيف تخلي الجريد مفهوم في 3 ثواني",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption: "خطوات سريعة لتثبيت الهوية البصرية من غير ما تخسر مرونتك.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شكل بصري",
    title: "مثال جريد متسق",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: gridImg,
      alt: "Creator grid consistency screenshot",
      caption: "المثال يوضح إزاي التناسق يخلي الرسالة مفهومة حتى قبل قراءة التفاصيل.",
      label: "Creator Grid Consistency",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تطبيق سريع",
    title: "سؤال واحد للتثبيت",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m7-l2-grid-consistency-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "لو زائر جديد مش فاهم حسابك في أول 3 ثواني، أنسب تحسين أولي إيه؟",
          options: [
            "تزود عدد البوستات فقط",
            "تثبت نمط بصري واضح وتطبق checklist قبل النشر",
            "تغير الهوية كل أسبوع عشان تبقى متجدد"
          ],
          correctIndex: 1,
          explanation:
            "الوضوح ييجي من الثبات. checklist بسيطة قبل النشر تمنع التشتت وتوضح الهوية أسرع.",
        }
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "المهمة العملية",
    title: "اعمل Checklist لاتساق البروفايل",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المطلوب تبني checklist سريعة تراجع بها البروفايل والجريد قبل أي نشر جديد.",
      prompt:
        "اكتب checklist من 6 نقاط تشمل:\n\n1) وضوح النمط البصري العام\n2) ثبات ألوان وفونت\n3) اتساق أغلفة الريلز\n4) وضوح نوع المحتوى من أول نظرة\n5) وجود 3 بوستات تعرّفك بوضوح\n6) خطوة تعديل واحدة هتطبقها هذا الأسبوع",
      buttonLabel: "انسخ المهمة",
      copiedLabel: "اتنسخت",
      template:
        "Checklist اتساق البروفايل:\n1) [...]\n2) [...]\n3) [...]\n4) [...]\n5) [...]\n6) [...]\n\nأول تعديل هطبقه هذا الأسبوع:\n[...]",
      rubric: [
        {
          label: "جودة الـ checklist",
          weight: 50,
          criteria: [
            "النقاط الست واضحة وقابلة للمراجعة السريعة فعلا.",
          ],
        },
        {
          label: "خطة التحسين",
          weight: 50,
          criteria: [
            "في تعديل واحد محدد وقابل للتنفيذ هذا الأسبوع.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "إغلاق واثق",
    title: "كده خلصت Creator Track بروح واضحة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "وصلت لآخر درس في المسار، ومعاك دلوقتي نظام Creator متكامل: منصة، جدول، تحليل، تحويل، وهوية، واتساق.",
        "من هنا فصاعدا شغلك مش عشوائي. أنت بتشتغل كصانع محتوى واعي ببناء أصل طويل المدى.",
      ],
    },
  }
];