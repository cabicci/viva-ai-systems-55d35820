import { Layers3, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, BarChart3, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

export const BUSINESS_M3_STRATEGIC_OPERATIONAL_ADMIN_BLOCKS: IntroLessonContent = [
  {
    icon: Layers3,
    eyebrow: "HERO",
    title: "٣ أنواع شغل",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Strategic — إنت بس. Operational — system أو ناس. Administrative — system تلقائي.",
        "لمّا تخلط بينهم، إنت بتعمل شغل administrative ١٠ ساعات في اليوم.",
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
        { term: "Strategic (استراتيجي)", meaning: "تفكير في بكرة، وقرارات كبيرة بتحدد شكل ومستقبل الشغل.", example: "زي صاحب المحل اللي بيقرر يفتح فرع جديد أو يغير نشاطه خالص." },
        { term: "Operational (تشغيلي)", meaning: "إدارة يومك، وتنسيق بين الناس والسيستم علشان الشغل يمشي صح.", example: "زي لما تتابع مع المورد البضاعة وصلت ولا لاء، وتظبط مواعيد التسليم." },
        { term: "Administrative (إداري)", meaning: "مهام مكتبية روتينية، محتاجة نظام أكتر ما محتاجة تفكير وتخطيط.", example: "زي تسجيل المصاريف في الدفتر أو كتابة بيانات العميل، حاجات روتينية مكررة." },
        { term: "Workflow (سير عمل)", meaning: "خريطة أو خطوات ورا بعض بتعرفك الشغل بيمشي إزاي.", example: "خطة الخطوات اللي بيمشي فيها الأوردر من أول ما العميل يطلبه لحد ما يوصل." },
        { term: "Automation (أتمتة)", meaning: "تخلي التكنولوجيا تعمل المهام المكررة لوحدها من غير ما تتدخل كل شوية.", example: "بدل ما تبعت رسالة ترحيب لكل عميل بإيدك، السيستم بيبعتها لوحده أول ما يشترك." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "إزاي تصنّف كل مهمة في يومك تحت واحد من الـ ٣ أنواع." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "المعادلة",
    block: {
      kind: "numberedList",
      items: [
        "Administrative → Automation (Automator).",
        "Operational → Workflows (نظام شبه آلي + ناس عند الحاجة).",
        "Strategic → إنت بس — وقتك المركّز.",
        "الهدف: كل يوم، الـ Strategic بياخد أكتر من نص وقتك الذهني.",
      ],
    },
  },
  {
    icon: BarChart3,
    eyebrow: "شوف بنفسك",
    title: "اليوم vs الهدف",
    block: {
      kind: "diagram",
      id: "soa-bars",
      caption: "اقلب الهرم: Strategic > Operational > Administrative.",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "خلط الأنواع vs توزيع صح",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — كله إنت", body: "إنت بترد رسائل، بتدخل بيانات، بتتابع تفاصيل صغيرة. مفيش وقت للقرار الكبير." },
      right: { label: "RIGHT — كل نوع في مكانه", body: "Administrative أوتوماتيك. Operational نظام. Strategic إنت. عقلك فاضي للأهم." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "صنّف ١٠ مهام",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m4-l1-strategic-operational-admin-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أنت مدير مشروع ولقيت نفسك بتقضي ٣ ساعات كل يوم بترد على إيميلات روتينية بتسأل عن حالة المشروع أو بتطلب تقارير متكررة. إيه أحسن حل عشان توفر الوقت ده وتركز على مهام أهم؟",
          options: [
            "إني أخصص وقت ثابت كل يوم للإيميلات الروتينية دي وأسرع في الرد.",
            "أصمم نظام إيميلات آلية (Automated emails) ترد على الأسئلة المتكررة وتجهز التقارير بشكل تلقائي.",
            "أفوض المهمة دي لحد من فريقي عشان هو اللي يرد على الإيميلات دي كلها."
          ],
          correctIndex: 1,
          explanation: "الإيميلات الروتينية دي شغل إداري (Administrative) ممكن ومفروض يتم أتمتته بالكامل عشان توفر وقتك للمهام الاستراتيجية الأهم."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "فريقك عنده مشكلة في متابعة المهام اليومية، وده بيخلي الشغل يتأخر. إيه أحسن تصرف منك كقائد عشان تحل المشكلة دي وتخلي الشغل يمشي بسلاسة أكتر؟",
          options: [
            "أتولى بنفسي متابعة كل مهمة بشكل يومي وأبعت تذكيرات لكل فرد في الفريق.",
            "أعمل نظام واضح لمتابعة المهام وأحدد مين مسؤول عن إيه، وأراجع البروسيس بشكل دوري.",
            "أطالب الفريق إنه يلتزم أكتر بالمواعيد وأشدد عليهم في الاجتماعات."
          ],
          correctIndex: 1,
          explanation: "متابعة المهام ده شغل تشغيلي (Operational) مش لازم تعمله بنفسك. الأفضل تعمل نظام أو Workflow يسهل المتابعة وناس هي اللي تتعامل معاه، بدل ما تضيع وقتك فيه."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "شركتك بتفكر توسع نشاطها وتفتح فروع جديدة. إيه طبيعة الشغل اللي المفروض تاخد أغلب وقتك كمدير في الفترة دي؟",
          options: [
            "إني أكون مسؤول عن توظيف كل الموظفين الجدد في الفروع دي بنفسي.",
            "إني أحط الاستراتيجية العامة للتوسع، أحدد الأسواق المستهدفة، وأبني الشراكات الأساسية.",
            "إني أشرف بنفسي على تجهيز كل فرع جديد من الناحية اللوجستية وتأكيد جاهزيته."
          ],
          correctIndex: 1,
          explanation: "تحديد استراتيجية التوسع وبناء الشراكات هي مهام استراتيجية (Strategic) بالأساس، ودي المهام اللي لازم المدير يركز فيها بنفسه لأنها ليها تأثير كبير على مستقبل الشركة."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "احسب توزيع وقتك (S/O/A) في يوم نموذجي",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "لو معظم وقتك Admin، إنت موظف عند نفسك. اقيس الوقع الحقيقي ابتدي تصلّح.",
      prompt:
        "في تسليمك اكتب:\n\n١) يوم شغل عادي بتفصيل ساعة بساعة (٠٨:٠٠ → نهاية اليوم):\n٢) جنب كل ساعة صنّفها: Strategic / Operational / Admin:\n٣) النسبة النهائية لكل صنف:\n٤) النسبة الصحيحة المفروضة لدورك (مثلاً: ٤٠/٤٠/٢٠):\n٥) أول حاجة هتنقلها من Admin لـ Delegate/Automate الأسبوع الجاي:",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "قياس دقيق",
          weight: 70,
          criteria: [
            "اليوم متقسّم ساعة بساعة (مش تقدير عام).",
            "النسبة الحالية مكتوبة بأرقام.",
          ],
        },
        {
          label: "فعل تصحيحي",
          weight: 30,
          criteria: [
            "في حاجة محدّدة بتتنقل من Admin الأسبوع الجاي.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "/admin = Operational, /roadmap = Strategic, /system-state = Admin",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "/admin = Operational, /roadmap = Strategic, /system-state = Admin",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Business — نفس اللي بتتعلمه. ٣ صفحات منفصلة لـ ٣ أنواع شغل. Strategic decisions في /roadmap (إنت بس). Operational management في /admin (إنت أو فريق). Administrative monitoring في /system-state (system بيشتغل تلقائي).",
      bullets: [
        "/roadmap: قرارات استراتيجية فيها notes طويلة.",
        "/admin: actions يومية على المستخدمين والمحتوى.",
        "/system-state: dashboards بترفع flags لوحدها.",
      ],
      pathAngle: "business",
      link: { label: "افتح /admin", href: "/admin" },
    },
  }
];