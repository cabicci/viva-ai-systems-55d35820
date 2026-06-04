import { ShieldAlert, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, LineChart, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

export const ANALYST_M6_L2_INTERPRETATION_MISTAKES_BLOCKS: IntroLessonContent = [
  {
    icon: ShieldAlert,
    eyebrow: "HERO",
    title: "أخطاء التفسير",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "البيانات صح — التفسير غلط.",
        "أخطر فخّين: Analysis Paralysis و Correlation ≠ Causation.",
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
        { term: "Analysis Paralysis (حيرة التحليل)", meaning: "لما تغرق في التحليل وتخاف تاخد قرار فتعطل وتضيع الفرصة.", example: "زي تاجر خايف يشتري قماش جديد فبيفضل يحلل تقارير السوق لحد ما الموسم يخلص منه." },
        { term: "Correlation (ارتباط)", meaning: "حاجتين بيتحركوا مع بعض في نفس الوقت من غير ما يكونوا مأثرين على بعض.", example: "زي لما مبيعات الآيس كريم والتكييفات يزيدوا سوا، بس ده مش معناه إن الآيس كريم بيشغل التكييف." },
        { term: "Causation (سببية)", meaning: "لما حاجة تكون هي السبب المباشر والوحيد في وجود حاجة تانية.", example: "لما تدفع فلوس في إعلانات فالمبيعات تزيد؛ هنا السلب والنتيجة واضحين." },
        { term: "Test / Trial (تجربة) drug", meaning: "تجربة عملية في السوق عشان نتأكد من فرضية معينة قبل ما نعممها.", example: "صاحب محل بيجرب يغير مكان الفاترينة أسبوع ويشوف الزبائن هتزيد ولا لأ قبل ما يهد المحل." },
        { term: "Controlled Experiment", meaning: "إنك تجرب فكرتك على سكيل صغير أوي عشان لو غلطت متخسرش كتير.", example: "محاسب بيجرب يقلل بند الرفاهية بنسبة صغيرة كعينة، بدل ما يقطع الميزانية كلها ويخسر الموظفين." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "أمثلة على أخطاء تفسير بتكلّف فلوس." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "علاج الفخّين",
    block: {
      kind: "numberedList",
      items: [
        "Analysis Paralysis → القرار الغلط أحسن من مفيش قرار. حدّد deadline + جرّب صغيّر (test).",
        "Correlation ≠ Causation → قبل ما تقول «X سبب Y»، اسأل: في حاجة تانية ممكن تكون السبب؟ جرّب تغيّر X بس وشوف.",
        "قاعدة ذهبية: قرار صغير قابل للتراجع > قرار كبير مبني على «حاسس».",
      ],
    },
  },
  {
    icon: LineChart,
    eyebrow: "شوف بنفسك",
    title: "Correlation ≠ Causation",
    block: {
      kind: "diagram",
      id: "correlation-causation",
      caption: "آيس كريم وغرق بيتحرّكوا مع بعض — السبب الحقيقي حاجة تالتة (الحرارة).",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "تحليل مثالي vs قرار كافي",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — «لسه محتاج بيانات أكتر»", body: "أسبوعين في التحليل. الفرصة عدّت. المنافس اتحرّك." },
      right: { label: "RIGHT — «بيانات كافية = جرّب»", body: "قرار صغير الأسبوع ده. النتيجة بياناتك الأسبوع الجاي. تعلّم بالتنفيذ." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اكسر Paralysis",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "analyst-m6-l2-interpretation-mistakes-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أنت مدير مشروع جديد، وفيه تحدي كبير في البروجريس اللي بيحصل في أول كام يوم. بدأت تحلل بيانات كتير عن أداء الفريق، وتشوف كل خطوة، بس كل ما تحلل أكتر تحس إنك تايه ومش عارف تاخد قرار عشان عايز تفهم كل التفاصيل. تفتكر أنسب حاجة تعملها عشان تتخطى الموقف ده هي إيه؟",
          options: [
            "تحدد ديدلاين صغير أسبوع عشان تاخد قرار، وتجرب حل مبدئي وتشوف نتيجته.",
            "تطلب بيانات أكتر من كل الأقسام المتعلقة بالمشروع عشان تضمن إن تحليلك كامل.",
            "تطلب اجتماع مطول مع كل أفراد الفريق عشان يفهموا حجم المشكلة ويتعاونوا في التحليل."
          ],
          correctIndex: 0,
          explanation: "الحالة دي بتوصف الـ Analysis Paralysis بالظبط. الحل هو تاخد قرار سريع ومبدئي (حتى لو مش كامل) وتجرب تشوف نتيجته، بدل ما تفضل تحلل لمالانهاية."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "صاحب كافيه لاحظ إن لما بيشغل أغاني هادية الصبح، المبيعات بتزيد بشكل ملحوظ. قرر يعتمد الأغاني الهادية طول الوقت عشان يضمن زيادة المبيعات. هو كده طبق أنهي مبدأ بشكل غلط؟",
          options: [
            "Correlation ≠ Causation",
            "Analysis Paralysis",
            "القرار الغلط أحسن من مفيش قرار"
          ],
          correctIndex: 0,
          explanation: "صاحب الكافيه شاف Correlation (الأغاني الهادية مع زيادة المبيعات) واعتبرها Causation (الأغاني الهادية هي اللي سببت الزيادة). ممكن تكون في عوامل تانية هي السبب الحقيقي."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "مدير تسويق في شركة بيشوف إن عدد اللايكات على بوستات السوشيال ميديا بيزيد مع زيادة عدد الإيميلات اللي بيبعتها للفانز بتاعته. استنتج إن الإيميلات هي السبب المباشر لزيادة التفاعل على البوستات. عشان يتأكد إن تحليله صح ومش مجرد صدفة، إيه الخطوة اللي المفروض يعملها؟",
          options: [
            "يجرب يبعت إيميلات لجروب معين ومايبعتش لجروب تاني، ويقيس التفاعل في المجموعتين.",
            "يزود عدد الإيميلات اللي بيبعتها بشكل كبير ويشوف لو عدد اللايكات زادت أكتر.",
            "يشوف عدد الكومنتات والشير مش اللايكات بس، عشان يتأكد إن التفاعل حقيقي."
          ],
          correctIndex: 0,
          explanation: "عشان تتأكد من الـ Causation، محتاج تعمل تجربة تتحكم فيها في المتغير اللي بتدرسه (الإيميلات في الحالة دي) وتقارن النتائج، وده اللي بيعمله الـ experiment اللي في الإجابة."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "اصطاد آخر غلطة تفسير عملتها",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "كلنا بنغلط في تفسير الأرقام. ارجع لقرار اخدته من بيانات في آخر شهر وحدّد الغلطة.",
      prompt:
        "في تسليمك اكتب:\n\n١) القرار الأصلي والـ Insight اللي بنيته عليه:\n٢) نوع الغلطة (Correlation = Causation / Sample صغيّر / Cherry-picking / Survivorship / غيرها):\n٣) إزاي عرفت بعد كده إنها غلطة:\n٤) لو رجعت بالزمن: الـ Insight الصحّ كان إيه:\n٥) قاعدة شخصية واحدة هتمنع نفس الغلطة في المستقبل:",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "تشخيص أمين",
          weight: 70,
          criteria: [
            "الغلطة مصنّفة بنوع واضح.",
            "في دليل/سبب إنها غلطة فعلًا.",
          ],
        },
        {
          label: "قاعدة وقاية",
          weight: 30,
          criteria: [
            "في قاعدة شخصية محدّدة هتطبّقها.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "غلطة تفسير حقيقية: «الـ retention بقت 80%»",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "غلطة تفسير حقيقية: «الـ retention بقت 80%»",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Analyst — نفس اللي بتتعلمه. شفنا في analytics إن retention قفز لـ 80%. فرحنا. لما عمّقنا في الـ data، اكتشفنا إن العدد الكلي للمستخدمين قل (الناس اللي بتسيب اتشالت). الـ retention مش زاد — الـ denominator اتغيّر.",
      bullets: [
        "دايمًا اعرض absolute numbers جنب الـ percentages.",
        "Drill-down متاح في كل widget — مش بس rollup.",
        "Cohort analysis بدل aggregate لتجنب الـ bias.",
      ],
      pathAngle: "analyst",
      link: { label: "افتح /analytics", href: "/analytics" },
    },
  }
];