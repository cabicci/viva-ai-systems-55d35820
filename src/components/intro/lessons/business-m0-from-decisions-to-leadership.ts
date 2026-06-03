import { Crown, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, PieChart, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

/** Business · M0 · Lesson 01 — Entry point: قيادة من اليوم الأول */
export const BUSINESS_M0_FROM_DECISIONS_TO_LEADERSHIP_BLOCKS: IntroLessonContent = [
  {
    icon: Crown,
    eyebrow: "HERO",
    title: "Business: تبدأ تقود من اليوم الأول",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "في أي بيزنس فيه فرق بين اللي بيشغّل بإيده، واللي بيقود بنظام.",
        "Business هو أول مسار في الرحلة — هنا بتتعلّم تفكّر كـ Leader قبل ما تتعلّم تنفّذ بنفسك أو بالـ AI في المسارات الجاية.",
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
        { term: "Operator", meaning: "الشخص اللي بيخلص الشغل اليدوي اليومي بنفسه.", example: "زي مساعد التاجر اللي شايل الشغل كله على كتافه وبيرص البضاعة بإيده." },
        { term: "Strategic", meaning: "التفكير في الخطوات الكبيرة والمستقبلية والخطط بعيدة المدى.", example: "زي صاحب مصنع بيحدد إيه المكن الجديد اللي هيشتريه السنتين الجايين." },
        { term: "Operational", meaning: "إدارة الشغل اليومي والتفاصيل الصغيرة اللي بتمشّي الدنيا دلوقتي.", example: "زي المحاسب اللي بيراجع الدرج كل يوم وبيقفل الحسابات اليومية." },
        { term: "Bottleneck", meaning: "حاجة واحدة معطلة السلسلة كلها وموقفة حال الشغل.", example: "زي لما يكون عندك مكنة واحدة بطيئة معطلة المصنع كله ومنعاه ينتج." },
        { term: "Stakeholders", meaning: "أي حد مهتم أو بيتأثر بقراراتك في الشغل (شركاء، زبائن، موردين).", example: "صاحب البراند والزبون والمورد والموظف؛ كل دول ليهم مصلحة في نجاح المشروع." },
        { term: "Leverage", meaning: "إزاي تعمل نتائج جبارة بمجهود قليل عن طريق النظام.", example: "صاحب مطعم عمل \"سيستم\" أوردرات يخليه يفتح 10 فروع بنفس مجهود فرع واحد." },
        { term: "Leader", meaning: "الشخص اللي بيحط النظام وبيوجه الفريق عشان يوصلوا للهدف.", example: "صاحب الشركة اللي مبيتدخلش في التفاصيل، لكنه بيوجه السفينة وبيرسم الطريق." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "الفرق بين اللي بيشغّل شغله واللي بيقوده." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "٤ مسؤوليات للـ Business Leader",
    block: {
      kind: "numberedList",
      items: [
        "إدارة الوقت — تختار إنت تشتغل على إيه، مش الرسائل تختار.",
        "إدارة العملاء — نظام يخلّي العميل يحس إنه مهم بعد البيع.",
        "إدارة العمليات — تفرّق بين Strategic و Operational و Administrative.",
        "النمو والتوسع — تعرف إمتى تكبّر وإمتى تثبّت.",
      ],
    },
  },
  {
    icon: PieChart,
    eyebrow: "شوف بنفسك",
    title: "Operator vs Leader — توزيع وقتك",
    block: {
      kind: "diagram",
      id: "operator-vs-leader",
      caption: "اليوم: 80% Operator · الهدف: 70% Leader · النظام = leverage.",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "بتشتغل في الشغل vs على الشغل",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — في الشغل", body: "كل يوم بتطفي حرائق. الـ revenue مرتبط بساعاتك. إنت = bottleneck." },
      right: { label: "RIGHT — على الشغل", body: "بتصمّم systems. الـ revenue بيكبر من غير ما ساعاتك تزيد. النظام = leverage." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "صنّف أسبوعك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m0-from-decisions-to-leadership-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أنت صاحب شركة مقاولات صغيرة، وبتلاقي نفسك بتعدّ عدد الطوب بنفسك في كل مشروع عشان تتأكد إن المورد ماغلطش. ده موقف \"Operator\" ولا \"Leader\"؟",
          options: [
            "Operator",
            "Leader",
            "الاتنين مع بعض"
          ],
          correctIndex: 0,
          explanation: "ده 'Operator' لأنك بتنفّذ مهمة بإيدك وبتركز على التفاصيل التنفيذية بدل ما تصمم نظام لمراقبة الموردين، وده بيتعارض مع فكرة الـ Leader اللي بيركز على تصميم النظام ومراقبته."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "كمدير تسويق، قررت تعمل نظام أوتماتيكي للرد على استفسارات العملاء المتكررة بعد الشراء. ده مثال على استخدامك لدور \"Leader\"، صح ولا لأ؟",
          options: [
            "صح",
            "غلط",
            "نص نص"
          ],
          correctIndex: 0,
          explanation: "صح، لأنك بتصمّم نظام (Automator) لتحسين تجربة العميل بعد البيع، وده جزء أساسي من دور الـ Leader اللي بيركز على بناء الآلة مش تشغيلها يدويًا."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "باعتبارك رائد أعمال، بتقضي أغلب وقتك في الرد على الإيميلات وبتحاول تكون متاح دايمًا للعملاء اللي بيتصلوا في أي وقت. ده بيوصفك كـ \"Leader\" ولا كـ \"Operator\" ولا كـ \"Strategic\"؟",
          options: [
            "Leader",
            "Operator",
            "Strategic"
          ],
          correctIndex: 1,
          explanation: "ده بيوصفك كـ 'Operator' لأنك بتنفّذ مهام يومية بشكل يدوي (الرد على الإيميلات والمكالمات)، وده بيصرف انتباهك عن دور الـ Leader في إدارة الوقت واختيار المهام Strategic."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "حدّد قرار قيادي واحد لازم تاخده الأسبوع ده",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "القرار القيادي = قرار شكل المنشأة بيتغيّر بسببه (تخصيص موارد، تعيين، إيقاف خط، تغيير اتجاه). اختار واحد لازم تاخده الأسبوع ده ووضّحه.",
      prompt:
        "في تسليمك اكتب:\n\n١) الموقف أو الملاحظة اللي خلّت القرار ده لازم:\n٢) القرار القيادي نفسه (تخصيص موارد/تعيين/إيقاف خط/تغيير اتجاه):\n٣) مين الـ Stakeholders اللي القرار ده هيأثّر عليهم:\n٤) إيه الـ trade-off (إيه اللي بتكسبه وإيه اللي بتسيبه):\n٥) موعد محدّد لإعلان القرار:",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "قرار قيادي حقيقي",
          weight: 70,
          criteria: [
            "القرار فيه trade-off واضح مش \"تحسين شامل\".",
            "الـ Stakeholders مذكورين بالاسم/الدور.",
          ],
        },
        {
          label: "التزام بموعد",
          weight: 30,
          criteria: [
            "في موعد إعلان محدّد (تاريخ).",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "المنصة دي = ecosystem كامل، شخص واحد بيديره",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "المنصة دي = ecosystem كامل، شخص واحد بيديره",
      summary:
        "المنصة دي اتبنت بـ 5 أدوار: Business بيقود ويقرّر، وتحته 4 أدوار تنفيذية — Builder للنظام، Creator للمحتوى، Automator للأتمتة، Analyst للبيانات. شخص واحد بيلعب الـ 5 أدوار بمساعدة AI. هنا في Business بنبدأ بدور القيادة، وفي المسارات الجاية بتتعلّم كل دور تنفيذي بتفصيله.",
      bullets: [
        "كل قرار في الـ ecosystem موثّق في /roadmap.",
        "AI tools بتختصر شغل ٥ ناس.",
        "الـ leader شغله strategy + decisions، مش execution.",
      ],
      pathAngle: "business",
      link: { label: "افتح /roadmap", href: "/roadmap" },
    },
  }
];