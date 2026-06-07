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

export const CREATOR_M3_CONTENT_PILLARS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "الأعمدة بتوقف التخمين",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "لما تحدد أعمدة محتواك، قرار النشر يبقى أسهل وأسرع.",
        "الهدف هنا إنك تبني ٣ أعمدة واضحة تمشي عليهم بثبات.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "المشكلة الشائعة",
    title: "كل يوم سؤال: أنشر عن إيه؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "من غير أعمدة، الأفكار بتبقى عشوائية ومجهدة.",
        "وده بيخلي حضورك ضعيف حتى لو عندك شغل كويس.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "٣ أعمدة كفاية جدًا",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الأعمدة هي مواضيع رئيسية ثابتة، وكل فكرة محتوى لازم تتبع واحد منها.",
        "الـ AI يساعدك يطلع اقتراحات أفكار تحت كل عمود، لكن اختيار اللي يخدم جمهورك وأهدافك قرارك أنت.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مقارنة سريعة",
    title: "تنوع عشوائي ولا أعمدة واضحة؟",
    block: {
      kind: "comparison",
      left: {
        label: "من غير أعمدة",
        body: "أفكار متقطعة، والرسالة النهائية مش واضحة للجمهور.",
      },
      right: {
        label: "مع أعمدة",
        body: "كل فكرة بتخدم صورة واحدة متماسكة، فالمتابع يعرف أنت بتميز في إيه.",
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
          term: "Content Pillar",
          meaning: "موضوع رئيسي ثابت بيتكرر منه محتوى كتير.",
          example: "تعليم، تجارب، أدوات.",
        },
        {
          term: "Topic Idea",
          meaning: "فكرة صغيرة تابعة لعمود معين.",
          example: "تحت عمود الأدوات: أداة تنظم كتابة السكربت.",
        },
        {
          term: "Content Mix",
          meaning: "توزيع المحتوى بين الأعمدة بشكل متوازن.",
          example: "كل أسبوع بوست من كل عمود.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اختيار الأعمدة عمليًا",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "لو عايز تختصر الوقت، تقدر تتخطى الفيديو وتبدأ فورًا بالمهمة من نفس الصفحة.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "رسم توضيحي",
    title: "شكل توزيع الأعمدة",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "content-pillars",
      label: "content-pillars",
      caption:
        "الرسم يوضح إزاي العمود الواحد يتفرع لأفكار متعددة من غير ما تضيع هوية المحتوى.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تثبيت الفهم",
    title: "سؤال واحد للتطبيق",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m2-l2-content-pillars-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "لو عندك عشر مواضيع متفرقة ومش عارف تثبت حضورك، أفضل خطوة أولى إيه؟",
          options: [
            "تنشرهم كلهم بالتساوي.",
            "تختار ٣ أعمدة رئيسية وتوزع الأفكار تحتهم.",
            "توقف نشر شهر كامل.",
          ],
          correctIndex: 1,
          explanation:
            "حصر الأفكار داخل ٣ أعمدة بيخلق وضوح واستمرارية بدل التشتيت.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "تدريب عملي",
    title: "٣ أعمدة + ٣ أفكار لكل عمود",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة تدريب بناء نظام، مش اختبار. حدّد ٣ أعمدة واضحة واكتب ٣ أفكار عملية لكل عمود.",
      prompt:
        "اكتب التسليم بالشكل ده:\n\n١) العمود الأول: [الاسم]\n   - فكرة ١\n   - فكرة ٢\n   - فكرة ٣\n\n٢) العمود الثاني: [الاسم]\n   - فكرة ١\n   - فكرة ٢\n   - فكرة ٣\n\n٣) العمود الثالث: [الاسم]\n   - فكرة ١\n   - فكرة ٢\n   - فكرة ٣",
      buttonLabel: "انسخ المهمة",
      copiedLabel: "اتنسخت",
      template:
        "العمود الأول:\n[ ]\n- [ ]\n- [ ]\n- [ ]\n\nالعمود الثاني:\n[ ]\n- [ ]\n- [ ]\n- [ ]\n\nالعمود الثالث:\n[ ]\n- [ ]\n- [ ]\n- [ ]",
      rubric: [
        {
          label: "وضوح الأعمدة",
          weight: 50,
          criteria: [
            "الأعمدة مختلفة وواضحة.",
            "كل عمود ينفع يطلع منه محتوى مستمر.",
          ],
        },
        {
          label: "جودة الأفكار",
          weight: 50,
          criteria: ["٣ أفكار لكل عمود مرتبطة به بوضوح."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "إقفال الدرس",
    title: "كده عندك خريطة محتوى",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "دلوقتي تقدر تدخل أي أسبوع وعندك اتجاه واضح بدل الحيرة اليومية.",
        "الخطوة الجاية: نتعلم الخطاف لأن أول ثواني هي اللي بتقرر الناس هتكمل ولا لأ.",
      ],
    },
  },
];