import { Infinity as InfinityIcon, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, Network, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

/** Business · M6 · Lesson 01 — خريطة الـ Ecosystem الكامل */
export const BUSINESS_M6_FULL_ECOSYSTEM_BLOCKS: IntroLessonContent = [
  {
    icon: InfinityIcon,
    eyebrow: "HERO",
    title: "الـ ٥ أدوار في بيزنسك",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "شخص واحد + AI + System صح = Business كامل.",
        "في الدرس ده بتشوف خريطة الـ 5 أدوار اللي أي بيزنس محتاجها — Business بيقودهم، والمسارات الجاية (Builder · Creator · Automator · Analyst) بتعلّمك تنفّذ كل دور بنفسك أو بالـ AI.",
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
        { term: "Ecosystem", meaning: "دائرة شغل كاملة، كل حتة فيها بتسلم اللي بعدها عشان المكنة تطلع قماش.", example: "زي لما تفتح محل ملابس وتجيب بضاعة وتعمل إعلانات، الترس بيلف وكل خطوة بتساعد التانية." },
        { term: "Leads parenting (Leads)Line", meaning: "زبون محتمل أبدى اهتمام، لسه مشتراش بس \"خيط\" ممكن يوصلك لبيعة.", example: "لما حد يبعتلك رسالة يسأل عن سعر \"كورس المحاسبة\"، ده كده لسه خيط مش بيعة أكيدة." },
        { term: "Builder & Creator Roles", meaning: "الأدوار اللي بتقوم بيها؛ يا بتبني السيستم (Builder) يا بتعمل محتوى يشد الناس (Creator).", example: "المحاسب اللي بيسجل القيود هو \"باني\" السيستم، والمسوق اللي بيعمل فيديوهات هو \"صانع\" المحتوى." },
        { term: "Automator", meaning: "برامج بتربط الشغل ببعضه عشان يشتغل \"أوتوماتيك\" من غير ما تدوس على زراير.", example: "زي ما تربط شيت الإكسيل ببرنامج الفواتير، أول ما تسجل قيد يروح مسمع في المخزن لوحده." },
        { term: "Output to Input", meaning: "شغل بيخلص بيبقى هو البنزين اللي بيشغل الخطوة اللي بعدها علطول.", example: "لما بوست فيسبوك (مخرج) يجيبلك رقم تليفون زبون، فتاخد الرقم ده (مدخل) وتكلمه تبيعه." },
        { term: "Operating Cadence index (Cadence)Index", meaning: "الروتين أو الجدول اللي بيمشي عليه الـ Ecosystem عشان ميفصلش منك.", example: "لما تظبط يوم \"السبت\" لمراجعة الحسابات ويوم \"الأحد\" للتسويق، ده بيخلي الشغل ماشي بانتظام." },
        { term: "Compounding", meaning: "مكاسب بسيطة فوق بعضها، مع الوقت بتعمل خبطة كبيرة ومفاجأة.", example: "لو كل يوم وفرت 10 جنيه، بعد سنة هتلاقي معاك مبلغ يفتح فرع جديد." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "الـ 5 أدوار في صورة واحدة — وإزاي Business بيربطها." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "الـ Loop الكامل",
    block: {
      kind: "numberedList",
      items: [
        "خبرتك + مشكلة حقيقية = نقطة البداية.",
        "Builder: System بيشتغل لوحده (المنتج).",
        "Creator: Leads بيجيبها المحتوى.",
        "Automator: كل حاجة تلقائية (الجمع + المتابعة).",
        "Analyst: الأرقام بتقولّك إيه اللي اشتغل.",
        "Business: إنت بتاخد القرارات الاستراتيجية بس — وبتديها للـ ٤ مسارات تنفّذ.",
        "النتيجة: شغل ينمو، وإنت بتشتغل أقل ساعات بقرار أكبر.",
      ],
    },
  },
  {
    icon: Network,
    eyebrow: "شوف بنفسك",
    title: "الـ ٥ مسارات — Ecosystem واحد",
    block: {
      kind: "diagram",
      id: "ecosystem-loop",
      caption: "كل مسار بيغذّي اللي بعديه · إنت + AI + System في المركز.",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "كل مسار لوحده vs ecosystem",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — مسارات منفصلة", body: "Builder منفصل عن Creator. Creator منفصل عن Analyst. كل واحد شغّال بس مفيش loop." },
      right: { label: "RIGHT — Ecosystem واحد", body: "كل مسار بيغذّي اللي بعديه. القرار الواحد بيلمس كل المنظومة. الشغل بقى نظام عضوي." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "ارسم Ecosystem-ك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m6-full-ecosystem-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أحمد عامل بودكاست، وبيحاول يجيب ضيوف مميزين ويعمل حلقات قوية. بس شايف إن عدد المستمعين مش بيزيد. إيه الإجراء اللي المفروض ياخده أحمد عشان المسارات بتاعته تبقى ماشية صح؟",
          options: [
            "يركز أكتر على التسويق المدفوع للحلقة الجاية وبس.",
            "يراجع مسار 'Builder' ويتأكد إن جودة الصوت والمونتاج احترافية.",
            "يبدأ يشوف الأرقام في مسار الـ 'Analyst' عشان يعرف إيه الحلقات اللي عجبت الناس وإيه اللي لأ."
          ],
          correctIndex: 2,
          explanation: "مسار الـ 'Analyst' هو اللي بيحلل الأرقام عشان يعرف إيه اللي اشتغل وإيه اللي محتاج يتعدل. ده أساس اتخاذ القرارات الصح."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "سارة بتبيع كروشيه أونلاين. بتعمل تصميمات حلوة، وبتصورها كويس. بس بتلاقي إن عندها متابعين كتير بس مفيش بيع حقيقي. إيه المسار اللي سارة محتاجة تركز عليه عشان تحوّل المتابعين لزباين؟",
          options: [
            "مسار الـ 'Creator' عشان تعمل محتوى يجيب عملاء محتملين (leads).",
            "مسار الـ 'Automator' عشان تبعت رسائل تلقائية لكل المتابعين.",
            "مسار الـ 'Business' عشان تاخد قرار استراتيجي بتغيير نوع المنتجات."
          ],
          correctIndex: 0,
          explanation: "مسار الـ 'Creator' هو المسؤول عن المحتوى اللي بيجيب الـ 'Leads'. التحويل من المتابعين لعملاء محتاج محتوى يجذبهم للشراء."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "محمد عنده خدمة استشارات أونلاين، وبيلاقي إن وقت كبير بيضيّع منه في الرد على الإيميلات وتحديد المواعيد ومتابعة الدفعات. إيه المسار اللي المفروض يركز عليه عشان يوفر وقته ده؟",
          options: [
            "مسار الـ 'Analyst' عشان يشوف أكتر الأوقات اللي بيجي فيها إيميلات.",
            "مسار الـ 'Automator' عشان يخلي كل الحاجات دي تحصل تلقائي.",
            "مسار الـ 'Builder' عشان يعمل نظام جديد للمواعيد والدفعات من الصفر."
          ],
          correctIndex: 1,
          explanation: "مسار الـ 'Automator' وظيفته يحوّل كل العمليات المتكررة إلى حاجات بتتعمل تلقائي، وده بيوفر وقت ومجهود كبير."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "ارسم خريطة Ecosystem الـ ٥ مسارات في شغلك",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "شفت الـ ٥ أدوار (Business/Builder/Creator/Automator/Analyst). ارسم إزاي بيتركّبوا في منشأتك دلوقتي — حتى لو لسه ما اتعلمتش تفاصيل التنفيذ، اكتب الموجود فعليًا والفجوة.",
      prompt:
        "في تسليمك اكتب:\n\n١) Business (إنت): أكبر قرار قيادي مفتوح دلوقتي:\n٢) Builder عندك: مين/إيه + بيبني إيه (أو الفجوة):\n٣) Creator: مين/إيه + بيوصل لمين (أو الفجوة):\n٤) Automator: مين/إيه + بيوصّل إيه بإيه (أو الفجوة):\n٥) Analyst: مين/إيه + بيجاوب أي سؤال (أو الفجوة):",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "خريطة متكاملة",
          weight: 70,
          criteria: [
            "الـ ٥ أدوار موصوفين بسياق منشأتك مش تعريفات.",
            "في ربط فعلي بين الأدوار (Output واحد بيدخل التاني).",
          ],
        },
        {
          label: "وعي بالفجوة",
          weight: 30,
          criteria: [
            "حدّدت فجوة محدّدة + خطوة لسدّها.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "/dashboard + /system-state + /roadmap = الـ ecosystem كامل",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "/dashboard + /system-state + /roadmap = الـ ecosystem كامل",
      summary:
        "المنصة دي بتتدار بـ 3 صفحات: /dashboard بيوريك تقدّم المتعلم، /system-state بيوريك صحة الـ system، /roadmap بيوريك المستقبل. شخص واحد + AI بيدير ecosystem كامل — وده النموذج اللي Business بيدرّبك عليه قبل ما تدخل المسارات التنفيذية.",
      bullets: [
        "Past = /dashboard (learner progress).",
        "Present = /system-state (system health).",
        "Future = /roadmap (strategic decisions).",
      ],
      pathAngle: "business",
      link: { label: "افتح /dashboard", href: "/dashboard" },
    },
  }
];