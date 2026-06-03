import { Shuffle, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, Grid2x2, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

export const BUSINESS_M3_DELEGATE_OR_AUTOMATE_BLOCKS: IntroLessonContent = [
  {
    icon: Shuffle,
    eyebrow: "HERO",
    title: "80% مش محتاج إنت",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بصّ في يومك. ٨ من ١٠ مهام ممكن حد تاني أو نظام يعملها.",
        "السؤال: تفوّض ولا تأتمت؟",
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
        { term: "Delegate", meaning: "إنك تكلف حد غيرك يعمل المهمة بس بشرفه البشري وتفكيره.", example: "صاحب محل لبس بيخلي موظف الحسابات يراجع الفواتير بدل ما يراجعها هو بنفسه." },
        { term: "Automate", meaning: "تخلي برنامج أو سيستم يعمل المهمة لوحده من غير تدخلك خالص.", example: "تاجر بيضبط سيستم يبعت رسالة واتساب للعملاء أوتوماتيك أول ما الأوردر يتشحن." },
        { term: "SOP (Standard Operating Procedure)", meaning: "خطوات بسيطة ومكتوبة بتمشي عليها عشان تخلص مهمة معينة بدقة.", example: "صاحب مطعم كاتب ورقة \"طريقة عمل السندوتش\" عشان أي حد جديد يطلعه صح." },
        { term: "Template", meaning: "نموذج جاهز بتملاه عشان يسهل عليك المهمة، بس مش بيشتغل لوحده.", example: "مسوّق عامل فورمة جاهزة للبوستات، بيغير بس الكلام بس هو اللي بينشرها بإيده." },
        { term: "Trigger (مُحفز)", meaning: "الشرارة أو الزرار اللي لما بيحصل بيخلي الأتمتة تبدأ تشتغل.", example: "البنك بيبعتلك رسالة \"تم السحب\" أول ما تستخدم الكارت.. الحركة دي هي الـ Trigger." },
        { term: "Bottleneck (عنق الزجاجة)", meaning: "نقطة في الشغل بتخلي الدنيا تقف وتتعطل بسبب زحمة المهام عندها.", example: "مدير شركة لازم يمضي على كل ورقة بنفسه، فـ الورق بيتركن عنده والشغل بيعطل." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "إزاي تختار بين تفويض وأتمتة لكل نوع مهمة." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "قاعدة القرار",
    block: {
      kind: "numberedList",
      items: [
        "متكرّرة + واضحة + قواعد ثابتة → Automate (Automator).",
        "متكرّرة + محتاجة حكم بشري → Delegate (ناس + SOP).",
        "غير متكرّرة + استراتيجية → إنت بنفسك.",
        "متكرّرة + غامضة → اكتب SOP الأول، وبعدها قرّر.",
      ],
    },
  },
  {
    icon: Grid2x2,
    eyebrow: "شوف بنفسك",
    title: "Matrix — تكرار × طبيعة المهمة",
    block: {
      kind: "diagram",
      id: "delegate-automate-matrix",
      caption: "أربع خانات · كل مهمة في مكانها · Bot للقواعد · شخص للحكم.",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "أتمت اللي محتاج حكم vs نظام صح",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — أتمت كل حاجة", body: "Bot بيرد على شكاوى معقّدة. العميل بيتضايق. السمعة بتأذى." },
      right: { label: "RIGHT — كل مهمة في مكانها", body: "Bot للروتيني. شخص للحكم. إنت للقرار الكبير. كل واحد بيحب اللي بيعمله." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "قرّر لـ ٥ مهام",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m3-delegate-or-automate-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "وليد عنده مطعم أكل بيتي. لاحظ إن فيه زباين كتير بتسأل على أسعار الأطباق وتوافرها كل يوم. الموضوع بقى متكرّر بزيادة وبياخد من وقته هو وفريقه. تتوقع إيه أحسن قرار عشان يوفر وقته ويحسّن الخدمة؟",
          options: [
            "يوظّف حد مسؤول يرد على العملاء طول اليوم.",
            "يعمل صفحة على الموقع أو تطبيق فيها كل التفاصيل وتتحدّث أول بأول.",
            "يطلب من الموظفين يردوا على الزباين أسرع شوية."
          ],
          correctIndex: 1,
          explanation: "المهمة دي متكررة وواضحة وقواعدها ثابتة (الأسعار والتوافر)، فالأتمتة (Automate) هي الحل الأمثل بنظام يعرض المعلومات بدل تدخل بشري."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "سارة، مديرة فريق تسويق، محتاجة تصميمات إعلانية جديدة كل أسبوع. التصميمات دي لازم تكون مبتكرة وبتتبع أحدث تريندات السوق، ومحتاجة لمسة فنّية خاصة عشان تجذب العملاء. إيه أفضل طريقة لسارة عشان تضمن جودة الشغل من غير ما تاخد كل وقتها؟",
          options: [
            "تعمل قائمة خطوات ثابتة ومفصلة لأي حد ممكن يعمل التصميمات دي.",
            "توظّف مصمم جرافيك محترف وتدّيله صلاحية الإبداع مع متابعة دورية.",
            "تستخدم أدوات تصميم آلي عشان تطلع تصاميم جاهزة بسرعة."
          ],
          correctIndex: 1,
          explanation: "المهمة دي متكررة بس محتاجة حكم بشري وإبداع، فالتفويض (Delegate) لشخص متخصص (مصمم) مع وجود SOPs عامة للمتابعة هو الأنسب."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "أحمد صاحب شركة استشارات. لقى إن كل عميل جديد بيطلب عقد بنفس الشروط القانونية الأساسية، بس فيه تفاصيل صغيرة بتتغير حسب طبيعة العميل. إيه أنسب حل عشان ينجز العقود دي بسرعة ودقة؟",
          options: [
            "يكلّف محامي مخصص يكتب كل عقد من الصفر لكل عميل.",
            "يعمل Template ثابت للعقد على الكمبيوتر ويضيف التفاصيل المتغيرة يدويًا.",
            "يستخدم نظام آلي يملا العقد بناءً على بيانات العميل المدخلة مع مراجعة بسيطة."
          ],
          correctIndex: 2,
          explanation: "المهمة متكررة وواضحة في جزء كبير منها (الشروط الأساسية) ومحتاجة حكم بشري في تفاصيل بسيطة. الأتمتة (Automate) هي الأفضل للجزء المتكرر (بملء تلقائي) مع فرصة للمراجعة البشرية."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صنّف ١٠ مهام: Delegate, Automate, Eliminate, Do",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "لو بتعمل كل حاجة بإيدك، Bottleneck = إنت. خد ١٠ مهام من آخر أسبوعين وصنّفهم.",
      prompt:
        "في تسليمك اكتب:\n\n١) قائمة ١٠ مهام (تكرّرت/سرقت وقت):\n٢) جنب كل مهمة صنّفها (Delegate / Automate / Eliminate / Do):\n٣) أول مهمة هتعمل Delegate لها — لمين + إزاي:\n٤) أول مهمة هتعمل Automate لها — بأي أداة + إيه الـ Trigger:\n٥) مهمة واحدة قرّرت تشيلها خالص (Eliminate) — السبب:",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "تصنيف كامل",
          weight: 70,
          criteria: [
            "الـ ١٠ مهام مصنّفين.",
            "الأربع أصناف ممثلة على الأقل بمهمة واحدة.",
          ],
        },
        {
          label: "تنفيذ فوري",
          weight: 30,
          criteria: [
            "في خطوة فعلية محدّدة لـ Delegate ولـ Automate.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "وزّعنا شغل بناءً على ROI: نأتمت أو نسيب",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "وزّعنا شغل بناءً على ROI: نأتمت أو نسيب",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Business — نفس اللي بتتعلمه. تقييم mission = أتمت (high ROI). كتابة درس جديد = manual (high creative). Email notifications = أتمت. Roadmap planning = manual. كل مهمة سألنا: ROI الأتمتة قد إيه؟",
      bullets: [
        "AI mission evaluation = 50 ساعة شغل/أسبوع.",
        "Email notifications = postgres triggers بسيطة.",
        "Lesson writing = AI draft + human edit.",
      ],
      pathAngle: "business",
      link: { label: "افتح /assistant-runtime", href: "/assistant-runtime" },
    },
  }
];