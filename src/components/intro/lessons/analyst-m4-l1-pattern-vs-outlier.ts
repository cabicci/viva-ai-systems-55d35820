import { Activity, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, LineChart, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

export const ANALYST_M4_L1_PATTERN_VS_OUTLIER_BLOCKS: IntroLessonContent = [
  {
    icon: Activity,
    eyebrow: "HERO",
    title: "Pattern أم Outlier؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "حاجة بتتكرّر = Pattern — اتعامل معاها كنظام.",
        "حاجة حصلت مرّة = Outlier — افهم سببها.",
        "قبل ما تتصرف على رقم واحد — اسأل: ده بيتكرر ولا صدفة؟",
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
        { term: "Baseline", meaning: "نقطة البداية أو \"المتوسط الطبيعي\" اللي بنقيس عليه أي تغيير في الأرقام.", example: "لما تثبت إن بيع المحل يومياً حوالي 1000 جنيه، ده الأساس اللي بتقارن بيه أي تغيير." },
        { term: "Metric", meaning: "المقياس أو الرقم اللي بتتابعه عشان تعرف أداء شغلك عامل إزاي.", example: "عدد الأوردرات اليومية أو إجمالي المبيعات، أي رقم بنقيس بيه نجاح الشغل." },
        { term: "Pattern", meaning: "تكرار أو شكل منتظم في الأرقام بيخليك تتوقع اللي جاي.", example: "زي لما الزباين تتعود تشتري أكتر يوم الخميس بانتظام، ده تكرار مفهوم." },
        { term: "Outlier", meaning: "رقم \"شاذ\" أو غريب، بعيد جداً عن الأرقام الطبيعية اللي متعود عليها.", example: "لو كل يوم بتبيع بـ 500 جنيه وفجأة بعت بـ 50 ألف في يوم واحد." },
        { term: "SOP (Standard Operating Procedure)", meaning: "خطوات ثابتة ومكتوبة بنمشي عليها عشان نخلص شغلانة معينة بنفس الطريقة.", example: "المدير كاتب ورقة فيها: (لو الزبون رجّع المنتج، الموظف يرجعله فلوسه فوراً)." },
        { term: "Signal vs Noise", meaning: "فن استخراج المعلومة المهمة والمفيدة من وسط زحمة الأرقام والدوشة.", example: "الـ Signal هي \"الزيادة الحقيقية\" في البيع، والـ Noise هي \"الخروشة\" أو الزيادات العشوائية البسيطة." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "إزاي تفرّق بين النمط الحقيقي والمصادفة." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "أول سؤال قدام أي رقم متغيّر",
    block: {
      kind: "numberedList",
      items: [
        "«ده حصل قبل كده؟»",
        "آه = Pattern → خطّط عليه (Automation/SOP/ ميزانية ثابتة).",
        "لأ = Outlier → افهم سببه (فرصة تكبّرها أو خطر تمنعه).",
        "قاعدة: ٣ مرّات في ٣ فترات مختلفة = Pattern مؤكّد.",
      ],
    },
  },
  {
    icon: LineChart,
    eyebrow: "شوف بنفسك",
    title: "١٢ أسبوع — نمط واحد و outlier واحد",
    block: {
      kind: "diagram",
      id: "pattern-vs-outlier",
      caption: "Pattern مستقر حوالين ٤٤ lead/أسبوع. القفزة في الأسبوع ٨ سببها حملة لمرّة واحدة — مش قاعدة.",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "ردّ فعل مقابل قراءة",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — كل رقم بتفزع منه", body: "Outlier واحد = قرار كبير. بعد أسبوع تكتشف إنه كان مصادفة وضيّعت وقت وفلوس." },
      right: { label: "RIGHT — بتشوف الـ trend", body: "بتاخد قرار على Pattern مؤكّد، وبتفهم الـ Outlier من غير ما تتسرّع." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "صنّف ٥ ملاحظات",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "analyst-m4-l1-pattern-vs-outlier-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "فريق خدمة العملاء لاحظ إن يوم التلات اللي فات جالهم ٥٠ مكالمة شكاوى على منتج معين، مع إن المتوسط اليومي للمكالمات دي ميعديش الـ ١٠. لما راجعوا السجلات، لقوا إن آخر مرة حصل فيها زيادة بالشكل ده كانت من ٦ شهور، ومكنتش بنفس الحدة. تفتكر ده إيه؟",
          options: [
            "Pattern",
            "Outlier",
            "Variance"
          ],
          correctIndex: 1,
          explanation: "دي Outlier. لأنها حصلت مرة واحدة وبشكل مختلف عن المعتاد، ومفيش تكرار منتظم ليها كـ Pattern."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "مدير المبيعات لاحظ إن كل آخر شهر الفاتورات المتأخرة بتزيد بنسبة ٢٠٪ عن متوسط الشهر. الحكاية دي بتتكرر بقالها ٤ شهور ورا بعض. إيه نوع الظاهرة دي وإيه التصرف الأنسب؟",
          options: [
            "Outlier، لازم نفهم سببها ونوقفها",
            "Pattern، لازم نخطط عليها بتعديل مواعيد التحصيل أو ميزانية للمتابعة",
            "Variance، وهي طبيعية ومنتظمة ومفيش داعي للقلق"
          ],
          correctIndex: 1,
          explanation: "ده Pattern لأنها بتتكرر بانتظام. وبما إنها Pattern، لازم نخطط لها ونشوف حلول ثابتة زي الأتمتة أو تغيير مواعيد التحصيل."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "أستاذة منى عندها محل حلويات. لاحظت إن كل يوم جمعة، مبيعات التورتات بتزيد لـ ٣ أضعاف متوسط الأيام العادية. ده بيتكرر عندها بقاله أكتر من سنة. إيه القرار اللي ممكن تاخده بناءً على الملاحظة دي؟",
          options: [
            "تتجاهل الزيادة، لأنها ممكن تكون صدفة وتتغير في أي وقت",
            "تستثمر في زيادة إنتاج التورتات يوم الخميس عشان تلبي طلبات الجمعة",
            "تقلل من إنتاج التورتات يوم الجمعة عشان تتجنب الهدر في حالة عدم البيع"
          ],
          correctIndex: 1,
          explanation: "بما إنها Pattern منتظم بيتكرر بقى له فترة طويلة، فالقرار الصح هو الاستثمار فيه وتلبيته، زي زيادة الإنتاج، وممكن تتطبق SOPs محددة للتعامل مع طلب الجمعة."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "افرز Signal من Noise في ٢٠ نقطة",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "مش كل قمّة مهمّة ومش كل قاع مشكلة. خد سلسلة بيانات حقيقية واتعلم تفرّق بين الـ Pattern والـ Outlier.",
      prompt:
        "في تسليمك اكتب:\n\n١) السلسلة (Metric + ٢٠ نقطة على الأقل + الفترة):\n٢) الـ Baseline اللي بتقارن عليه (متوسط/median):\n٣) Outliers لقيتها وإيه السبب المحتمل (موسم/حدث/خطأ تسجيل):\n٤) الـ Pattern الحقيقي اللي شفته (اتجاه/دورة/استقرار):\n٥) القرار اللي بيتغيّر بسبب الـ Pattern مش بسبب الـ Outliers:",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "فصل صحيح",
          weight: 70,
          criteria: [
            "حدّدت Outliers مع سبب لكل واحدة.",
            "الـ Pattern موصوف بدقّة (اتجاه/دورة/استقرار).",
          ],
        },
        {
          label: "قرار من الـ Pattern",
          weight: 30,
          criteria: [
            "القرار مبني على الـ Pattern مش على نقطة شاذّة.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "Pattern detection vs outlier في /system-state",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "Pattern detection vs outlier في /system-state",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Analyst — نفس اللي بتتعلمه. صفحة /system-state بتميّز: لو ٥+ متعلمين بيسيبوا في نفس النقطة = Pattern (يستاهل fix). لو متعلم واحد عمل حاجة غريبة = Outlier (يتسجّل بس مش يستاهل تغيير).",
      bullets: [
        "Threshold: 5 متعلمين = pattern.",
        "أقل من ذلك = outlier، بنحط فيه note بس.",
        "بنركز فقط على الـ patterns في الـ roadmap.",
      ],
      pathAngle: "analyst",
      link: { label: "افتح /system-state", href: "/system-state" },
    },
  }
];