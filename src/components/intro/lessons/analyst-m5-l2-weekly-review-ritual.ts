import { CalendarClock, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, Timer, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

export const ANALYST_M4_WEEKLY_REVIEW_RITUAL_BLOCKS: IntroLessonContent = [
  {
    icon: CalendarClock,
    eyebrow: "HERO",
    title: "Review أسبوعي = ١٥ دقيقة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل أحد الصبح.",
        "شوف ٤ أرقام. اسأل سؤال واحد. خد قرار واحد.",
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
        { term: "Action, Owner, Deadline", meaning: "دي التفاصيل اللي بتقولنا: مين وراه إيه وهيخلص إمتى.", example: "زي المهام المكتوبة للمحاسب ومين اللي هيخلصها وإمتى بالظبط." },
        { term: "Ritual", meaning: "عاده أو روتين ثابت بتعمله في وقت معين عشان تنجز.", example: "زي ما صاحب محل يحدد وقت ثابت كل يوم جمعة يراجع فيه حساباته." },
        { term: "M4 Dashboard", meaning: "لوحة متابعة بتعرض أهم ٤ أرقام في شغلك بشكل بسيط.", example: "المحاسب يجمع أهم ٤ أرقام (مبيعات، مصروفات، ديون، ربح) في صفحة واحدة." },
        { term: "One Decision Rule", meaning: "ركز تطلع بقرار واحد بس تنفذه كل أسبوع عشان متهنجش وتوه في كتر التفاصيل.", example: "بدل ما تحاول تحل كل مشاكل المحل، ركز بس تظبط الموردين الأسبوع ده." },
        { term: "Execution", meaning: "إنك تنفذ القرار اللي أخدته وتخلصه قبل الأسبوع الجديد.", example: "إنك تنزل تشتري البضاعة فعلاً بعد ما قررت، مش مجرد كلام." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "إزاي تعمل review أسبوعي في ١٥ دقيقة بس." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "٤ خطوات للريفيو الأسبوعي",
    block: {
      kind: "numberedList",
      items: [
        "افتح الـ Dashboard (الـ ٤ أرقام من M4).",
        "اسأل: «إيه اللي اتغيّر من الأسبوع اللي فات؟».",
        "حدّد قرار واحد للأسبوع الجاي (Action + Owner + Deadline من M3).",
        "نفّذه — والأسبوع اللي بعده شوف الأثر على نفس الأرقام.",
      ],
    },
  },
  {
    icon: Timer,
    eyebrow: "شوف بنفسك",
    title: "الأحد · ٠٩:٠٠ → ٠٩:١٥",
    block: {
      kind: "diagram",
      id: "weekly-review-timeline",
      caption: "٤ خطوات في ١٥ دقيقة — قرار واحد للأسبوع، مفيش استثناء.",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "Review متفرّق vs ritual ثابت",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — «هنشوف لمّا تحصل مشكلة»", body: "بتفوق للمصيبة بعد ما الفاس تقع في الراس. وقت الإصلاح ٥ أضعاف وقت المنع." },
      right: { label: "RIGHT — كل أحد ١٥ دقيقة", body: "بتشوف المشكلة وهي صغيرة. القرار الصغير الأسبوع ده = مفيش أزمة الشهر الجاي." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "احجز أول Review",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "analyst-m5-l2-weekly-review-ritual-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو الأحد الصبح جيت تعمل الـ Review بتاعك ولقيت رقم الـ Sales بتاع الشهر ده نقص عن الأسبوع اللي فات، إيه أول سؤال هتسأله لنفسك عشان تفهم اللي حصل؟",
          options: [
            "إيه اللي اتغيّر من الأسبوع اللي فات وخلّى الـ Sales تنقص؟",
            "مين المسؤول عن نقص الـ Sales ده عشان ألومه؟",
            "إيه المنتج اللي محتاجين نعمل عليه خصم عشان نزوّد الـ Sales تاني؟"
          ],
          correctIndex: 0,
          explanation: "الدرس بيأكد على سؤال 'إيه اللي اتغيّر من الأسبوع اللي فات؟' عشان نفهم الأثر على الأرقام."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "بعد ما عملت الـ Review الأسبوعي وحددت قرار واحد بس للأسبوع الجاي، زي 'محتاجين نزود منشوراتنا على فيسبوك ٥ مرات'، إيه الخطوة اللي المفروض تعملها بعد القرار ده مباشرةً؟",
          options: [
            "تبعت القرار ده لفريق التسويق وتخليهم يتصرفوا.",
            "تحدد مين اللي هينفّذ القرار ده بالظبط وإمتى هيكون خلصان (Action + Owner + Deadline).",
            "تنسى القرار ده وتستنى الـ Review بتاع الأسبوع اللي بعده."
          ],
          correctIndex: 1,
          explanation: "الدرس بيشدد على 'حدّد قرار واحد للأسبوع الجاي (Action + Owner + Deadline من M3)' عشان نضمن التنفيذ."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "إيه الفرق الجوهري بين إنك تعمل Review عشوائي كل ما تفضى، وبين إنك تثبّت Review أسبوعي ليه ميعاد محدد وتقسيم واضح زي ما الدرس بيقول؟",
          options: [
            "الـ Review العشوائي بيكون ممتع أكتر لأن مفيش طقوس ثابتة.",
            "الـ Review الثابت بيخليك تقدر تشوف الأثر على الأرقام أول بأول وتاخد قرارات مبنية على بيانات واضحة.",
            "مفيش فرق كبير، الإتنين بيوصلوا لنفس النتيجة بس بطرق مختلفة."
          ],
          correctIndex: 1,
          explanation: "الدرس بيشرح الـ Ritual كـ 'روتين ثابت بيحصل في نفس الوقت كل مرة' لضمان المتابعة واتخاذ القرارات الفعالة 'والأسبوع اللي بعده شوف الأثر على نفس الأرقام'."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "اعمل أول Weekly Review",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "مراجعة أسبوعية ٢٠ دقيقة بتغيّر الشغل أكتر من dashboard بتفتحه يوميًا. اعملها دلوقتي على الأسبوع اللي فات.",
      prompt:
        "في تسليمك اكتب:\n\n١) الأسبوع اللي بتراجعه (تواريخ من-لـ):\n٢) الأربع أرقام + قيمتهم الأسبوع ده + مقارنة بالأسبوع اللي قبله:\n٣) أكبر مفاجأة (إيجابية أو سلبية) — رقم واحد:\n٤) سبب محتمل واحد لأكبر مفاجأة:\n٥) قرار/تجربة واحدة هتعملها الأسبوع الجاي عشان تظبط الأداء الأسبوع الجاي:",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "مراجعة كاملة",
          weight: 70,
          criteria: [
            "الأربع أرقام مع مقارنة بأسبوع سابق.",
            "مفاجأة محدّدة + سبب محتمل.",
          ],
        },
        {
          label: "فعل واحد",
          weight: 30,
          criteria: [
            "في تجربة/قرار محدّد للأسبوع الجاي.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "/roadmap = الـ weekly review الفعلي للمنصة",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "/roadmap = الـ weekly review الفعلي للمنصة",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Analyst — نفس اللي بتتعلمه. كل أسبوع بنفتح /roadmap، نشوف إيه اتعمل، إيه deferred، وإيه جاي. ٢٠ دقيقة بس. القرار اللي بياخدها أسبوعي بتغيّر الـ priority للأسبوع اللي بعده.",
      bullets: [
        "كل تعديل في الأسبوع له entry في roadmap_items.",
        "Filter «من AI» vs «من user» بيوريك مصدر القرارات.",
        "Deferred items بتفضّل عشان نراجعها لاحقًا.",
      ],
      pathAngle: "analyst",
      link: { label: "افتح /roadmap", href: "/roadmap" },
    },
  }
];