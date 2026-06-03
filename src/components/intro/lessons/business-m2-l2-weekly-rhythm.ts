import { CalendarDays, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, CalendarRange, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

export const BUSINESS_M1_WEEKLY_RHYTHM_BLOCKS: IntroLessonContent = [
  {
    icon: CalendarDays,
    eyebrow: "HERO",
    title: "أسبوعك = ٤ مسارات (بنّاء · صانع · منظّم · محلّل)",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Builder (بنّاء)، Creator (صانع محتوى)، Automator (منظّم العمليات)، Analyst (محلّل) — كل واحد ليه يوم.",
        "كل يوم له هدف واضح، ومخرج محدّد.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "مصطلحات الدرس",
    title: "اللي هتسمعه في الدرس ده",
    block: {
      kind: "concepts",
      items: [
        { term: "Context Switching", meaning: "إنك تنط بين كذا حاجة مختلفة ورا بعض وتشتت دماغك.", example: "تكون فاتح ميزانية العميل وبالك معاه، وفجأة ترد على مكالمة لمورد بيحكي في أسعار تانية خالص. تشتيت بيضيع تركيزك." },
        { term: "Flows/Automator/System", meaning: "خطوات الشغل المترتبة ورا بعض عشان المهمة تخلص.", example: "لو إنت محاسب، الـ Flow هو الخطوات من أول ما تستلم الفاتورة لحد ما تسجلها وتنزل في الحسابات." },
        { term: "Strategic Work", meaning: "وقت التفكير الكبير والتخطيط لمستقبل الشغل، مش شغل يومي.", example: "صاحب محل ملابس بيقعد يحلل مبيعات السنة اللي فاتت عشان يقرر هيفتح فرع جديد فين." },
        { term: "Operational Work", meaning: "شغل \"الترس\" اليومي اللي بيمشي الدنيا وبيدخّل فلوس حالاً.", example: "صاحب المحل بيتابع حركة البيع، بيرد على الزباين، وبيشوف البضاعة اللي نقصت." },
        { term: "Builder Track", meaning: "الوقت اللي بتطلع فيه منتج/خدمة جديدة عشان تكبر شغلك.", example: "مدرس بيحضر حصة جديدة أو بيسجل فيديو كورس هيبيعه بعدين، ده بناء للمصلحة." },
        { term: "Admin Work", meaning: "الأعمال الورقية والإدارية اللي \"بتاكل\" وقت بس مهمة للتنظيم.", example: "لما محاسب يجمع فواتير الكهرباء أو يرتب ملفات قديمة، حاجات لابد منها بس مابتجيبش فلوس." },
        { term: "Theme Day/Weekly Rhythm", meaning: "تخصيص يوم كامل لنوع واحد من الشغل عشان ماتتشتتش.", example: "تخلي يوم الأحد كله للحسابات والورق، ويوم الاثنين كله بيع وقبض. أسرع وأركز." },
        { term: "Buffer Day", meaning: "يوم \"طوارئ\" في جدولك عشان لو حاجة باظت خلال الأسبوع.", example: "يوم الخميس سايبه فاضي، لو عميل اتأخر أو مشوار مصلحة حكومية طلعلك فجأة." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "إزاي توزّع أيامك بين الـ ٤ مسارات بدل ما تشتّت كل يوم." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "الجدول الأسبوعي المقترح",
    block: {
      kind: "numberedList",
      items: [
        "الاثنين/الثلاثاء — Builder (البنّاء): بناء وتطوير المنتج.",
        "الأربعاء — Creator (صانع المحتوى): محتوى الأسبوع كله.",
        "الخميس — Automator (منظّم العمليات): مراجعة Flows + إصلاح الأخطاء.",
        "الجمعة — Analyst (المحلّل): review أسبوعي + قرار الأسبوع.",
        "السبت/الأحد — Buffer أو راحة (الأحد فيه الـ ١٥ دقيقة review).",
      ],
    },
  },
  {
    icon: CalendarRange,
    eyebrow: "شوف بنفسك",
    title: "أسبوعك على ٤ مسارات",
    block: {
      kind: "diagram",
      id: "weekly-theme-days",
      caption: "يوم لكل تركيز — Builder · Creator · Automator · Analyst + Buffer.",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "كل يوم في كل حاجة vs Theme Days",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — كل يوم بتبدّل ٥ مرات", body: "Context switching بياكل ٤٠٪ من إنتاجيتك. تعبان والشغل ناقص." },
      right: { label: "RIGHT — يوم واحد = تركيز واحد", body: "بتدخل عمق كل مسار. الجودة بتعلى والوقت بيقل." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "صمّم أسبوعك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m2-l2-weekly-rhythm-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أنت رائد أعمال بتدير مشروع جديد، وعاوز تطبق نظام الـ 'Weekly Rhythm' عشان تزود إنتاجيتك. لو قررت تخلي يوم التلات مخصص لبناء وتطوير المنتج بتاعك وإضافة مميزات جديدة، ده يُعتبر تطبيق لأي مسار من المسارات الأربعة؟",
          options: [
            "Builder",
            "Creator",
            "Automator",
            "Analyst"
          ],
          correctIndex: 0,
          explanation: "مسار الـ Builder هو المخصص لبناء وتطوير المنتج، وده بيتناسب مع تخصيص يوم الثلاثاء للمهمة دي."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "لو قررت في شغلك إن يوم الأربعاء هيكون مخصص بالكامل لإنتاج كل المحتوى التسويقي بتاع الأسبوع (بوستات سوشيال ميديا، مقالات، فيديوهات)، ده بيجسد أي مصطلح من المصطلحات اللي اتعلمتها في الدرس؟",
          options: [
            "Weekly Rhythm",
            "Theme Day",
            "Buffer Day"
          ],
          correctIndex: 1,
          explanation: "الـ Theme Day هو يوم له تركيز واحد بس، وده اللي حصل لما خصصت يوم الأربعاء كله لإنتاج المحتوى عشان تزود التركيز وتقلل تبديل المهام."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "سارة عندها مشروع أونلاين، ولاحظت إنها بتضيع وقت كبير في مراجعة الأخطاء التقنية وحل المشاكل اللي بتظهر في الموقع كل يوم. عشان تحل المشكلة دي وتطبق نظام الـ 'Weekly Rhythm' بشكل صح، المفروض تخصص يوم إيه للمهام دي؟",
          options: [
            "الخميس للـ Automator",
            "الجمعة للـ Analyst",
            "السبت/الأحد للراحة"
          ],
          correctIndex: 0,
          explanation: "مسار الـ Automator مخصص لمراجعة الـ Flows وإصلاح الأخطاء، وده بيتناسب مع تخصيص يوم الخميس للمهام دي عشان تتحل بشكل مركز."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم Weekly Rhythm للأسبوع الجاي",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "القيادة بلا إيقاع = فوضى. حدّد ٣-٤ مواعيد ثابتة في الأسبوع لكل نوع قرار.",
      prompt:
        "في تسليمك اكتب:\n\n١) Strategic block (يوم + ساعة): إيه اللي بتراجعه فيه؟\n٢) Operational block (يوم + ساعة): إيه اللي بتقرّره فيه؟\n٣) Admin block (يوم + ساعة): إيه اللي بتخلّصه فيه؟\n٤) إيه اللي مش هتقرّره خارج الـ blocks دي:\n٥) إزاي هتحمي الـ blocks (مين يعرف، إيه القنوات اللي بتقفلها):",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "إيقاع ملموس",
          weight: 70,
          criteria: [
            "الثلات blocks لهم أيام/ساعات محدّدة.",
            "كل block ليه نوع قرار واحد بالظبط.",
          ],
        },
        {
          label: "حماية الإيقاع",
          weight: 30,
          criteria: [
            "في خطة واضحة لحماية الـ blocks (ما الذي يُغلق/يُؤجل).",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "أسبوع المنصة = ٤ مسارات + يوم review",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "أسبوع المنصة = ٤ مسارات + يوم review",
      summary:
        "المنصة دي بتتدار بـ Weekly Rhythm: كل يوم مخصّص لدور — الإثنين Builder (technical)، الثلاثاء Creator (content)، الأربعاء Automator (workflows)، الخميس Analyst (review)، الجمعة Business (strategy). الـ rhythm بيمنع الـ context switching. هتتعلّم كل دور بتفصيله في مساره الخاص لاحقًا.",
      bullets: [
        "كل يوم له deep work block 4 ساعات.",
        "Roadmap items متعلّمة بـ tags للمسار.",
        "End-of-week review بيتسجّل في /roadmap.",
      ],
      pathAngle: "business",
      link: { label: "افتح /roadmap", href: "/roadmap" },
    },
  }
];