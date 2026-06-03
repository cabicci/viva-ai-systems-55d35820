import { LayoutDashboard, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, BarChart3, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

export const ANALYST_M4_FOUR_NUMBERS_DASHBOARD_BLOCKS: IntroLessonContent = [
  {
    icon: LayoutDashboard,
    eyebrow: "HERO",
    title: "٤ أرقام بس",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Dashboard فيه ٢٠ رقم = مفيش Dashboard.",
        "٤ أرقام إنت بتقرأهم كل أسبوع = نظام فعلي.",
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
        { term: "Dashboard", meaning: "شاشة واحدة بتعرض أهم الأرقام عشان تتابع حال شغلك بسرعة.", example: "زي لوحة عدادات العربية اللي بتعرفك البنزين والسرعة، بتعرفك حال الشغل كله في شاشة واحدة." },
        { term: "KPI (Key Performance Indicator)", meaning: "رقم محدد بيعرفك إنت ماشي صح ولا عاكك في الشغل.", example: "صاحب مطعم بيعتبر عدد الوجبات اللي اتباعت في اليوم هي الـ KPI الأهم عنده." },
        { term: "Metric", meaning: "أي رقم تقدر تقيسه في الشغل زي عدد الزوار أو المبيعات.", example: "لو عندك محل موبايلات، \"الأرباح\" دي Metric، لكن \"صافي ربح نهائي\" ده الـ KPI." },
        { term: "Retention", meaning: "نسبة الزبائن اللي اشتروا منك قبل كده ورجعوا لك تاني.", example: "تاجر ملابس بيشوف كم واحد اشترى منه السنة اللي فاتت ورجع يشتري تاني السنة دي." },
        { term: "Threshold", meaning: "الرقم اللي لو زدت أو قليت عنه يبدأ القلق ولازم تتحرك.", example: "لو إيرادات الشغل نزلت عن 1000 جنيه في اليوم، جرس الإنذار يضرب فوراً." },
        { term: "Creator vs Automator", meaning: "أدوار بتعملها؛ الأول بيصمم اللوحة، والتاني بيخلي الأرقام تتحدث تلقائي.", example: "إنت كـ Creator بتحدد إيه الأرقام اللي تظهر، والـ Automator هو اللي بيحدثها لوحده." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "إزاي تختار ٤ أرقام بس بتلخّص شغلك كله." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "الـ ٤ أرقام الأساسية",
    block: {
      kind: "numberedList",
      items: [
        "Leads — كام واحد تواصل معاك الأسبوع ده؟ (مصدره: Creator + Automator).",
        "Conversion % — كام منهم اشترى؟",
        "Revenue — كام فلوس دخلت فعلاً؟",
        "Retention — كام عميل قديم رجع؟",
        "كل رقم جنبه: قيمة الأسبوع ده، الأسبوع اللي فات، السهم (↑/↓).",
      ],
    },
  },
  {
    icon: BarChart3,
    eyebrow: "شوف بنفسك",
    title: "Dashboard أسبوع 42 — أرقام حقيقية",
    block: {
      kind: "diagram",
      id: "four-kpi-dashboard",
      caption: "Leads · Conversion · Revenue · Retention — مع الأسبوع اللي فات والسهم.",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "٢٠ رقم vs ٤ أرقام",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — Dashboard مليان", body: "بتفتحه وبتقفله من غير ما تقرّر حاجة. الكتير = صفر." },
      right: { label: "RIGHT — ٤ أرقام واضحة", body: "في ثانيتين بتعرف لو فيه مشكلة. القرار جاهز قبل ما تخلص الأرقام." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "ابني أول Dashboard في Sheet",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "analyst-m4-l1-four-numbers-dashboard-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو الداتا بتاعتك الأسبوع اللي فات كانت 100 Lead و Conversion% 10%، والأسبوع ده بقيت 120 Lead و Conversion% 8%. إيه أهم حاجة تركز عليها في الـ ٤ أرقام بتاعتك عشان تحسن الأداء؟",
          options: [
            "الـ Conversion % عشان هو اللي قل فمحتاج اهتمام أكتر.",
            "الـ Leads عشان زيادة عددهم مؤشر كويس.",
            "الـ Revenue عشان في النهاية هو اللي بيفرق."
          ],
          correctIndex: 0,
          explanation: "رغم زيادة الـ Leads، نقص الـ Conversion % معناه إن فيه مشكلة في تحويل العملاء المهتمين لمشترين، وده بيأثر مباشرة على الـ Revenue."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "أنت عملت حملة تسويقية جديدة ولقيت إن الـ Leads زادت من 50 لـ 150 والأسبوع ده الـ Revenue بتاعك بقى X. الأسبوع اللي فات كان Y. إيه اللي المفروض تشوفه جنب قيمة الـ Revenue في الـ Dashboard بتاعتك؟",
          options: [
            "قيمة الأسبوع اللي فات (Y) وسهم لفوق (↑).",
            "قيمة الأسبوع اللي فات (Y) وسهم لتحت (↓).",
            "قيمة الأسبوع اللي فات (Y) وبدون سهم عشان الأرقام لسه جديدة."
          ],
          correctIndex: 0,
          explanation: "الـ Dashboard لازم يوريني قيمة الأسبوع ده (X) والأسبوع اللي فات (Y) عشان أقارن، وبما إن الـ Leads زادت، متوقع الـ Revenue يزيد، فسهم لفوق هيكون مناسب."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "مديرك سألك إيه اللي بيحصل مع العملاء القدام. بصيت على الـ Dashboard بتاعك ولقيت إن الـ Retention بتاعة الأسبوع ده 30% والأسبوع اللي فات كانت 40%. إيه أول رد فعل أو سؤال هيكون عندك؟",
          options: [
            "تمام يا فندم، بنجيب عملاء جدد فالـ Retention مش أولويتنا دلوقتي.",
            "محتاجين نعرف ليه العملاء القدام مابقوش يرجعوا زي الأول ونشوف إيه اللي اتغير.",
            "ممكن نزود حملات تسويقية للعملاء الجداد عشان نعوض النقص في الـ Retention."
          ],
          correctIndex: 1,
          explanation: "نقص الـ Retention مؤشر لإن فيه مشكلة مع العملاء الحاليين، والـ KPI ده مهم جداً لصحة الشغل، فلازم نفهم أسباب النقص ونعالجها."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "ابني Dashboard من ٤ أرقام بس",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "Dashboard فيه ٢٠ رسم = ديكور. اختار ٤ أرقام لو اتحرّكوا، شغلك بيتحرّك معاهم.",
      prompt:
        "في تسليمك اكتب:\n\n١) المجال/المشروع اللي الـ Dashboard ليه:\n٢) الأربع أرقام بالظبط (Metric + Window) + ليه دول بالذات:\n٣) الـ Target/Threshold لكل رقم:\n٤) لينك أو screenshot للـ Dashboard اللي بنيته (Sheet/Looker/Notion/أي حاجة):\n٥) القرار اللي هياتاخد لو أي رقم خرج عن الـ Target:",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "تركيز ودقّة",
          weight: 70,
          criteria: [
            "أربع أرقام بالظبط — مش أكتر.",
            "كل رقم له Target/Threshold مبرّر.",
          ],
        },
        {
          label: "Dashboard موجود",
          weight: 30,
          criteria: [
            "في لينك/screenshot لـ Dashboard فعلي اتبنى.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "/dashboard فيه ٤ widgets بس",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "/dashboard فيه ٤ widgets بس",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Analyst — نفس اللي بتتعلمه. /dashboard بتاع المتعلم متظبّط بنفس القاعدة: ٤ widgets بس — Welcome, Streak, Reviews Due, Sidebar. أي زيادة كانت بتشتّت. حذفنا 6 widgets قبل ما نوصل للنسخة دي.",
      bullets: [
        "Streak: رقم واحد بسيط.",
        "Reviews Due: عدد + CTA واحد.",
        "Welcome Checklist: 4 خطوات بس.",
      ],
      pathAngle: "analyst",
      link: { label: "افتح /dashboard", href: "/dashboard" },
    },
  }
];