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
import hookScreenshot from "@/assets/lessons/creator-m3-l1-hook.jpg";

export const CREATOR_M2_HOOK_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "أول ثواني بتحسم القرار",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "قبل ما القيمة توصل، لازم المشاهد يقرر يكمل.",
        "الخطاف القوي في البداية هو اللي بيدي لباقي المحتوى فرصة يعيش.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "مشكلة شائعة",
    title: "محتوى قوي وبداية ضعيفة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كتير بيبدأوا بمقدمة طويلة فتضيع أول لحظة حاسمة.",
        "المشاهد غالبًا مش هيدي فرصة تانية لو البداية ما شدتوش.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "الخطاف وعد سريع وواضح",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الخطاف مش مجرد جملة حلوة، هو وعد سريع بفايدة أو فضول يخلي المشاهد يكمّل.",
        "الـ AI يقدر يقترح لك صيغ متعددة للخطاف، لكن اختيار الأنسب لنبرة جمهورك ومساحة الفيديو يرجع لحكمك.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مقارنة سريعة",
    title: "مقدمة تقليدية ولا خطاف مباشر؟",
    block: {
      kind: "comparison",
      left: {
        label: "بداية تقليدية",
        body: "تحيات طويلة وتعريفات، فيتسرب المشاهد قبل القيمة.",
      },
      right: {
        label: "خطاف مباشر",
        body: "سؤال أو وعد واضح من أول جملة، فيحصل توقف وتكملة.",
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
          term: "Hook",
          meaning: "أول جملة أو لقطة تقفل فرصة التخطي السريع.",
          example: "٣ أخطاء بتخسرك العملاء وانت مش واخد بالك.",
        },
        {
          term: "Pattern Break",
          meaning: "افتتاحية مختلفة عن المتوقع تخلي العين توقف.",
          example: "نتيجة مفاجئة قبل الشرح.",
        },
        {
          term: "Retention Start",
          meaning: "نسبة الناس اللي قررت تكمل بعد أول ثواني.",
          example: "كل ما البداية أوضح، الاحتفاظ يزيد.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "بناء خطاف عملي",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "لو محتاج تنجز بسرعة، تخطى الفيديو وابدأ بالمهمة، الخطوات مكتوبة بالكامل هنا.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "لقطة بصرية",
    title: "مثال لخطاف ملفت",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: hookScreenshot,
      alt: "لقطة توضح مثال بصري لبداية قوية توقف المشاهد.",
      caption:
        "الفكرة إن أول ثانية تبقى مختلفة وواضحة كفاية تخلي المشاهد يديك فرصة.",
      label: "creator-m3-l1-hook",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تثبيت الفهم",
    title: "سؤال واحد للتطبيق",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m3-l1-hook-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "لو نفس المحتوى بيتشاف قليل، أنهي تعديل غالبًا يرفع فرصة المشاهدة؟",
          options: [
            "زيادة طول الفيديو.",
            "إعادة كتابة أول جملة بشكل أوضح وأقوى.",
            "تغيير اسم الحساب.",
          ],
          correctIndex: 1,
          explanation:
            "أول جملة بتحدد قرار المشاهد يكمل أو لا، فتعزيزها بيأثر مباشرة على البداية.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "تدريب عملي",
    title: "اكتب ٣ خطافات لنفس الموضوع",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة تدريب كتابة مش اختبار. اختار موضوع واحد واكتب له ٣ خطافات مختلفة.",
      prompt:
        "اكتب التسليم بالشكل ده:\n\n١) موضوع المحتوى: [اكتب الموضوع]\n٢) الخطاف الأول: [صيغة سؤال]\n٣) الخطاف الثاني: [صيغة رقم أو نتيجة]\n٤) الخطاف الثالث: [صيغة وعد واضح]\n٥) أنهي خطاف هتجربه الأول وليه",
      buttonLabel: "انسخ المهمة",
      copiedLabel: "اتنسخت",
      template:
        "موضوع المحتوى:\n[ ]\n\nالخطاف الأول:\n[ ]\n\nالخطاف الثاني:\n[ ]\n\nالخطاف الثالث:\n[ ]\n\nاختياري النهائي:\n[ ]",
      rubric: [
        {
          label: "تنوع الصيغ",
          weight: 50,
          criteria: [
            "الخطافات الثلاثة مختلفين فعلًا.",
            "كل خطاف واضح وسريع الفهم.",
          ],
        },
        {
          label: "اختيار واعي",
          weight: 50,
          criteria: ["في تبرير واضح للخطاف المختار."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "إقفال الدرس",
    title: "بقيت جاهز تبني بداية قوية",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "دلوقتي تقدر تكتب بدايات توقف المشاهد وتدي محتواك فرصة.",
        "الدرس الجاي هيكمل نفس الخط: ازاي تبني سكربت كامل من البداية للنهاية.",
      ],
    },
  },
];