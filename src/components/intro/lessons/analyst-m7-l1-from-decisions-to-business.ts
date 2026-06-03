import { Flag, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, Kanban, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

/** Analyst · M6 · Lesson 01 — Bridge to Business */
export const ANALYST_M6_FROM_DECISIONS_TO_BUSINESS_BLOCKS: IntroLessonContent = [
  {
    icon: Flag,
    eyebrow: "HERO",
    title: "قراراتك جاهزة — Business بيشغّلها",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Analyst بيقولك «خد القرار ده».",
        "Business بيحوّله لنظام يومي + علاقات + توسع.",
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
        { term: "Leads (العملاء المحتملين)", meaning: "ناس عينيها على شغلك وممكن يشتروا بس لسه مطلعوش المحفظة.", example: "إنت شغال في محل لبس، الـ Leads هم الناس اللي دخلوا سألو بكام بس لسه مشتريش." },
        { term: "Kanban Board", meaning: "طريقة تنظيم شغل بتشوف فيها الحاجة وهي بتتحرك من البداية للنهاية.", example: "لو عامل سبورة معلق عليها ورق \"قيد التنفيذ\" و\"خلص\"، ده الـ Kanban بكل بساطة." },
        { term: "Dashboard (لوحة تحكم)", meaning: "شاشة بتجمع لك أهم الأرقام والمؤشرات عشان تتابع شغلك بلمحة.", example: "زي لوحة العدادات في العربية؛ بتعرفك البنزين والسرعة، الـ Dashboard بتعرفك مبيعاتك ومكسبك." },
        { term: "Analyst vs. Business", meaning: "الـ Analyst بيفهم البيانات، والـ Business هو صاحب القرار اللي بيوجه الشغل.", example: "الـ Analyst بيفصص الأرقام، والـ Business هو اللي بياخد القرار النهائي هيصرف فين." },
        { term: "Academic Exercise (تمرين أكاديمي)", meaning: "كلام نظري أو دراسة على الورق بعيد عن واقع السوق والصعوبات.", example: "لو قلت لك إن البيع هيزيد 50% \"نظرياً\" بس الحقيقة السوق ميت، ده تمرين أكاديمي." },
        { term: "Feedback Loop (الدائرة المغلقة)", meaning: "عملية متكررة بتبدأ من خطوة وتلف ترجع لنفس النقطة عشان تحسن النتائج.", example: "لو بعت رسالة شكر آلياً لكل واحد يشتري، إنت كده عملت دايرة مقفولة." },
        { term: "Operational System (نظام التشغيل)},{example:", meaning: "برامج أو أدوات بتنفذ الخطوات اليومية المتكررة بدل ما تعملها بإيدك.", example: "السيستم اللي على الكاشير بيطلع فواتير لوحده بدل ما تكتبها بورقة وقلم." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "ملخّص رحلة Analyst وإزاي قراراتك بتدخل Business." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Loop كامل: Builder → Creator → Automator → Analyst → Business",
    block: {
      kind: "numberedList",
      items: [
        "Builder بنى المنتج → بيانات.",
        "Creator جاب الـ Reach → leads.",
        "Automator وصّل كل ده → جمعها في مكان واحد.",
        "Analyst سأل وفسّر → قرارات.",
        "Business بياخد القرارات دي ويحوّلها لنظام يومي + علاقات عملاء + خطط توسع.",
        "وبعدين Business بيدّي feedback يرجع Builder/Creator/Automator — وتبدأ الدورة من جديد بمستوى أعلى.",
      ],
    },
  },
  {
    icon: Kanban,
    eyebrow: "شوف بنفسك",
    title: "Decision Backlog → Business System",
    block: {
      kind: "diagram",
      id: "decision-backlog",
      caption: "قرارات Analyst بتدخل Kanban التنفيذ — To Do · Doing · Done.",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "قرارات في درج vs قرارات في نظام",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — قائمة قرارات بتطول", body: "Analyst بيطلّع قرارات أسبوعيًا. مفيش حد بينفّذ. بعد شهرين بقت document ميّت." },
      right: { label: "RIGHT — Business بيشغّلها", body: "كل قرار له owner + deadline + مكان في الـ system. التنفيذ بقى تلقائي." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "جهّز Decision Backlog",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "analyst-m7-l1-from-decisions-to-business-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "الـAnalyst في شركتك قرر إن أفضل طريقة لزيادة المبيعات هي تقديم خصم 15% على أول طلب لكل عميل جديد. لو أنت الـBusiness، إيه أول خطوة هتعملها عشان تحوّل القرار ده لسيستم شغال بدماغ لوحده؟",
          options: [
            "هتطلب من فريق الـIT يبرمج الخصم ده في نظام الطلبات الأونلاين بحيث يتطبق تلقائي.",
            "هتتصل بكل العملاء الجداد يدويًا عشان تبلغهم بالخصم وتطبقه.",
            "هتعمل إعلان على السوشيال ميديا بس عن الخصم وتستنى الناس تتفاعل."
          ],
          correctIndex: 0,
          explanation: "الـBusiness بيحول القرار لنظام يومي (Operational System)، وده بيتم ببرمجة الخصم في النظام عشان يتطبق أوتوماتيك من غير تدخل يدوي كل مرة."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "الـAnalyst اكتشف إن أغلب Leads اللي بتيجي من حملات الـCreator على فيسبوك مش بيتحولوا لعملاء بسبب تأخر الرد عليهم. إيه اللي المفروض الـBusiness يعمله عشان يعالج المشكلة دي ويبني 'Business Path' أقوى؟",
          options: [
            "هتطلب من الـCreator يعمل حملات إعلانية أكتر عشان يعوض النقص في التحويل.",
            "هتعمل نظام آلي للرد الفوري على Leads الجداد وتحويلهم لفريق المبيعات خلال دقايق.",
            "هتستنى الـ Leads يتجمعوا وبعدين تبعتلهم إيميل جماعي كل أسبوع."
          ],
          correctIndex: 1,
          explanation: "الـBusiness بياخد القرارات ويحولها لنظام يومي، والـ 'Business Path' بيتضمن قيادة الشغل وتحسينه. الرد الآلي السريع بيضمن تحويل الـLeads بفاعلية أكتر وده بيحسن المسار."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "بعد ما الـAnalyst قدّم Decision Backlog بخمس قرارات استراتيجية لتحسين تجربة العملاء، إيه أهم حاجة الـBusiness محتاج يركز عليها عشان يضمن إن القرارات دي مش هتفضل 'في الدرج' وتتحول لحركة فعلية وتوسع؟",
          options: [
            "هيبدأ يحط خطة عمل مفصلة لكل قرار ويخصص له الموارد اللازمة (فريق، ميزانية، وقت).",
            "هيحط القرارات دي في ملف واحد ويراجعها تاني الشهر الجاي.",
            "هيبعت القرارات دي للـBuilder عشان يبدأ في تنفيذها بدون ما يعمل خطة."
          ],
          correctIndex: 0,
          explanation: "الـBusiness بياخد القرارات ويحولها لنظام يومي (Operational System) وعلاقات عملاء وخطط توسع. ده بيتطلب تخطيط مفصل وتخصيص موارد لضمان التنفيذ وتحويلها لواقع بدل ما تكون مجرد قرارات مكتوبة."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "حوّل قرار تحليلي لخطوة Business",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "تحليل من غير تنفيذ = تمرين أكاديمي. خد أحدث قرار اتطلع من بياناتك وخلّيه فعل تجاري واضح.",
      prompt:
        "في تسليمك اكتب:\n\n١) الـ Insight النهائي (سطر):\n٢) القرار التحليلي (سطر):\n٣) الخطوة التجارية المحدّدة (تغيير سعر/توقف حملة / تعدل عرض (Offer) / تشقلب الميزانية...):\n٤) مين المسؤول + متى تتنفّذ:\n٥) المؤشّر اللي هيقولك إن الخطوة شغّالة (متى تراجع):",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "ترجمة لفعل",
          weight: 70,
          criteria: [
            "الخطوة محدّدة قابلة للتنفيذ (مش توصية عامة).",
            "مسؤول + موعد تنفيذ واضحين.",
          ],
        },
        {
          label: "حلقة قياس",
          weight: 30,
          criteria: [
            "مؤشّر محدّد + موعد مراجعة.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "كل قرار من Analyst → roadmap_item جديد",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل قرار من Analyst → roadmap_item جديد",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Analyst — نفس اللي بتتعلمه. Analyst لاحظ pattern → سجّل قرار في /roadmap → الـ pattern اتحوّل لـ action → Business بيتابع التنفيذ في الأسبوع الجاي. ده الـ closing loop اللي بيخلّي الـ insights تتحوّل لـ outcomes.",
      bullets: [
        "كل insight له roadmap_item مرتبط.",
        "الـ item بياخد phase حسب أولوية الـ insight.",
        "الـ completion rate للقرارات نفسها بنتابعها.",
      ],
      pathAngle: "analyst",
      link: { label: "افتح /roadmap", href: "/roadmap" },
    },
  }
];