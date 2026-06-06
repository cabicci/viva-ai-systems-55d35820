import { AlertTriangle, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, Replace, Brain, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

export const ANALYST_M6_L1_QUESTION_MISTAKES_BLOCKS: IntroLessonContent = [
  {
    icon: AlertTriangle,
    eyebrow: "HERO",
    title: "أخطاء الأسئلة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "السؤال الغلط = بيانات كتير، قرار صفر.",
        "أكتر ٣ أخطاء بتقع فيهم — وإزاي تتجنّبهم.",
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
        { term: "Vague Question", meaning: "سؤال عايم وواسع ملوش إجابة واضحة تقدر تبني عليها قرار.", example: "لما تسأل الزبون: \"إيه رأيك في حاجتنا؟\" مبيطلعش معلومة مفيدة، لازم السؤال يبقى محدد." },
        { term: "Leading Question (bias)", meaning: "سؤال غرضه يوجه اللي قدامك لإجابة معينة إنت عاوزها.", example: "زي ما تسأل حد \"مش بذمتك القميص ده تحفة؟\" إنت كدة بتجبره يمدح." },
        { term: "No-Data Question", meaning: "سؤال مستحيل ترد عليه عشان مفيش بيانات متسجلة أصلاً تخصه.", example: "لما صاحب محل يسألك: \"مين أكتر زبون اشترى في 1990؟\" وهو أصلًا فاتح 2010!" },
        { term: "Signal (إشارة)", meaning: "المعلومة المفيدة اللي بتطلعها من وسط دوشة البيانات الكتير.", example: "زي لما راديو يلقط إشارة واضحة وسط شوشرة، في البيانات هي المعلومة الحقيقية." },
        { term: "D7 retention", meaning: "نسبة الناس اللي فضلت تستخدم خدمتك بعد مرور 7 أيام.", example: "لما تسأل مطعم: \"من كل 100 زبون جربوك النهاردة، كام واحد رجعلك بعد أسبوع؟\"" },
        { term: "NPS (Net Promoter Score)", meaning: "مقياس بنعرف بيه الزبون راضي عننا وهينصح بينا غيره ولا لأ.", example: "لو فاتح ابلكيشن وبسألك \"بنسبة كام ترشحنا لصحابك؟\" عشان أعرف إنت راضي ولا لأ." },
      ],
    },
  },
  {
    icon: Brain,
    eyebrow: "اختبر فهمك",
    title: "٣ أسئلة قبل ما تكمل",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "analyst-m6-l1-question-mistakes",
      items: [
        {
          id: "q1",
          bloom: "remember",
          question: "إيه تعريف الـ Leading Question؟",
          options: [
            "سؤال عام جدًا مفيش إجابة محدّدة ليه.",
            "سؤال متحيّز بيوجّه الإجابة لاتجاه معيّن.",
            "سؤال مفيش بيانات أصلًا تجاوبه.",
          ],
          correctIndex: 1,
          explanation:
            "Leading Question = سؤال متحيّز. مثال: «ليه الإعلان فاشل؟» — افترض الفشل قبل البيانات.",
        },
        {
          id: "q2",
          bloom: "understand",
          question:
            "«كام عميل سعيد عندنا؟» — السؤال ده غلط من النوع إيه؟",
          options: [
            "Vague Question — مش محدّد.",
            "Leading Question — متحيّز.",
            "No-Data Question — مفيش signal قابل للقياس.",
          ],
          correctIndex: 2,
          explanation:
            "«سعيد» مش متغيّر تقدر تقيسه مباشرة. بدلًا منه استخدم NPS أو تكرار الشراء — دول signals حقيقية.",
        },
        {
          id: "q3",
          bloom: "apply",
          question:
            "صاحب مطعم بيسأل: «إيه أحوال الشغل؟» — تصحيحه الأنسب يكون:",
          options: [
            "«ليه الناس بطّلت تيجي؟» (افتراض مسبق).",
            "«كام طلب الأسبوع ده مقارنة بالأسبوع اللي فات، ومين أكتر طبق اتباع؟»",
            "«الناس مبسوطة من الأكل؟»",
          ],
          correctIndex: 1,
          explanation:
            "السؤال الصح بيحدّد مين/إيه/إمتى — رقم قابل للمقارنة + تفصيل قابل للتنفيذ.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "تشخيص ٣ أخطاء قاتلة في صياغة الأسئلة." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "الـ ٣ أخطاء + علاجهم",
    block: {
      kind: "numberedList",
      items: [
        "سؤال عام («إيه أحوال الشغل؟») → خصّصه بـ مين/إيه/إمتى.",
        "سؤال متحيّز («ليه الإعلان فاشل؟») → اسأله Open («كام lead جاب؟ بكام؟»).",
        "سؤال بدون بيانات («كام عميل سعيد؟») → اسأل عن signal قابل للقياس (NPS، تكرار الشراء).",
      ],
    },
  },
  {
    icon: Replace,
    eyebrow: "شوف بنفسك",
    title: "٣ أخطاء · ٣ علاجات",
    block: {
      kind: "diagram",
      id: "question-rewrite",
      caption: "نوع الخطأ · السؤال الغلط · السؤال المصحّح — جدول واحد.",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "علامات إن سؤالك غلط",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — العلامة", body: "بتجمع بيانات كتير ومش قادر تاخد قرار. كل أسبوع بترجع لنفس السؤال." },
      right: { label: "RIGHT — العلاج", body: "ارجع للـ ٤ شروط (M1/L2). لو السؤال مكمّلش الـ ٤، صياغته غلط — مش الإجابة." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "طبّق: شخّص وصحّح",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "analyst-m6-l1-question-mistakes-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "صاحب متجر أونلاين بيسأل: «ليه العملاء بيسيبوا العربة من غير ما يكمّلوا الشراء؟» — شخّص الخطأ:",
          options: [
            "Vague — السؤال عام ومش محدّد فترة أو شريحة.",
            "Leading — افترض سبب الترك قبل ما يشوف البيانات.",
            "No-Data — مفيش signal قابل للقياس أصلًا.",
          ],
          correctIndex: 1,
          explanation:
            "السؤال بيفترض إن في مشكلة ترك أصلًا وبيدوّر على سبب. الصح: «كام نسبة ترك العربة آخر ٣٠ يوم؟ وفي أي خطوة بالظبط بيخرجوا؟»",
        },
        {
          id: "apply2",
          bloom: "apply",
          question:
            "مدير تسويق بيقول: «إعلاناتنا شغّالة كويس، صح؟» — اختار التصحيح الأنسب بشروط M1/L2:",
          options: [
            "«هل الإعلانات أداؤها حلو؟»",
            "«كام lead جابت حملة نوفمبر، بكام تكلفة لكل lead، وهل تحت الـ target بتاعنا (٥٠ج)؟»",
            "«الناس مبسوطة من الإعلانات؟»",
          ],
          correctIndex: 1,
          explanation:
            "السؤال الصح محدّد (الحملة + الفترة)، له بيانات (CPL)، له قرار (مقارنة بالـ target)، وله وقت (نوفمبر). دي شروط M1/L2 الأربعة.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question:
            "مؤسّس startup بيسأل: «كام مستخدم مهتم بالمنتج؟» — إيه الخطأ وإزاي تصحّحه؟",
          options: [
            "Leading — لازم نسأل: «ليه المستخدمين مش مهتمين؟»",
            "Vague — نخصّصه: «كام مستخدم زار الصفحة الأسبوع ده؟»",
            "No-Data — «الاهتمام» مش قابل للقياس مباشرة؛ نستبدله بـ signal: تفعيل الحساب، التكرار، أو معدل الاحتفاظ بعد ٧ أيام.",
          ],
          correctIndex: 2,
          explanation:
            "«مهتم» مش متغيّر تقدر تقيسه. لازم تحوّله لـ signal حقيقي زي activation rate أو D7 retention — وقتها يبقى عندك رقم تاخد عليه قرار.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صلّح سؤال بايظ في الـ Inbox بتاعك",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "فتّش في رسايل/تيكتس آخر أسبوع — هتلاقي سؤال صياغته بايظة. صلّحه بالقاعدة.",
      prompt:
        "في تسليمك اكتب:\n\n١) السؤال الأصلي زي ما اتسأل (انسخه):\n٢) إيه اللي ناقصه (Metric؟ Window؟ Comparator؟ Threshold؟):\n٣) السؤال بعد التصليح بالقاعدة الكاملة:\n٤) الإجابة اللي طلعت من السؤال الجديد:\n٥) لو السؤال الأصلي فضل زي ما هو، كنت هتاخد قرار غلط ليه؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "تصليح بالقاعدة",
          weight: 70,
          criteria: [
            "حدّدت بالظبط إيه الناقص.",
            "النسخة الجديدة بالقاعدة الكاملة.",
          ],
        },
        {
          label: "دليل الفرق",
          weight: 30,
          criteria: [
            "وضّحت إزاي السؤال البايظ كان هيخلّي القرار غلط.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "أخطاء فعلية حصلت في تصميم /analytics",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "أخطاء فعلية حصلت في تصميم /analytics",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Analyst — نفس اللي بتتعلمه. في البداية بنينا widget «average time per lesson» — وكان misleading. متعلم بيفتح الدرس وينام = ساعتين في الـ stats. صحّحنا السؤال لـ «active engagement time» وأعدنا الحسبة.",
      bullets: [
        "Idle detection: بنوقف العدّاد بعد 30s inactivity.",
        "كل metric اتراجعت بعد ما اكتشفنا الـ bias.",
        "الـ documentation للـ metrics في /system-state.",
      ],
      pathAngle: "analyst",
      link: { label: "افتح /analytics", href: "/analytics" },
    },
  }
];