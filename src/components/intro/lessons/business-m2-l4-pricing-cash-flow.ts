import { DollarSign, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, Calculator, AlertTriangle } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

/** Business · M2 · Lesson 04 — التسعير والكاش بالـ AI */
export const BUSINESS_M2_L4_PRICING_CASH_FLOW_BLOCKS: IntroLessonContent = [
  {
    icon: DollarSign,
    eyebrow: "HERO",
    title: "بتبيع كتير وفلوسك قليلة؟ المشكلة مش في المبيعات",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أحمد كان فاكر إنه ناجح. مطعمه بيخدم 80 طلب في اليوم. الفلوس داخلة. بس آخر الشهر بيلاقي الحساب البنكي قريب من الصفر.",
        "حط بياناته قدام AI — التكاليف، الأسعار، الـ delivery fees. النتيجة كانت صدمة: بيخسر 18% من كل طلب delivery بسبب عمولات Talabat والـ packaging. كان عنده leak في كل طلب لكنه مش شايفه.",
        "AI مش بيشوف الأرقام بس — بيشوف العلاقات اللي عينك مبتشوفهاش. وده بيغيّر كل حاجة في التسعير والكاش.",
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
        { term: "Unit Economics", meaning: "إيه اللي بتكسبه أو بتخسره في كل وحدة بيع — قبل ما تفكر في الإجمالي.", example: "كل طلب delivery بيدخّل 150 جنيه — بس بعد عمولة Talabat والـ packaging الصافي 95 جنيه." },
        { term: "Cash Flow", meaning: "حركة الفلوس الداخلة والخارجة فعلياً — مش الأرباح على الورق.", example: "ممكن تكون رابح على الورق وحسابك البنكي فاضي لأن العميل لسه مدفعش." },
        { term: "Cash Leak", meaning: "مكان بتنزل منه فلوس من غير ما تحس — رسوم، عمولات، هدر، خصومات.", example: "أحمد لاقى إنه بيتبرع بـ 3% من إجمالي مبيعاته في خصومات مش محسوبة." },
        { term: "Price Anchoring", meaning: "تحط سعر مرجعي عالي عشان السعر التاني يبان رخيص.", example: "وجبة فاخرة بـ 350 جنيه جنبها وجبتك العادية بـ 180 — الـ 180 بقت تبان عرض حلو." },
        { term: "AI Pricing Audit", meaning: "تحط بياناتك قدام AI ويطلّعلك تشخيص كامل: فين بتخسر، فين تقدر ترفع، فين السعر مش منطقي.", example: "ملف Excel بسيط فيه الأسعار والتكاليف → prompt → تقرير كامل في 5 دقايق." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "إزاي AI بيكشف الـ Cash Leaks في 5 دقايق." },
  },
  {
    icon: AlertTriangle,
    eyebrow: "الفكرة",
    title: "٣ مشاكل تسعير AI بيشوفها وإنت لأ",
    block: {
      kind: "numberedList",
      items: [
        "الـ Hidden Margin Killers — عمولات، packaging، خصومات بتفقدك أرباحك من غير ما تحس.",
        "الـ Wrong Price Tier — منتجاتك كلها في نفس الـ price range، ومفيش anchor عالي يخلّي اللي تحت يبان رخيص.",
        "الـ Cash Timing — بتبيع بالأجل لكن بتدفع نقدي — فجوة كاش بتكبر كل شهر.",
      ],
    },
  },
  {
    icon: Calculator,
    eyebrow: "الـ Prompt القاتل",
    title: "AI Pricing Audit Prompt",
    tone: "accent",
    block: {
      kind: "rule",
      statement: "\"عندي [نوع البيزنس]. منتجاتي وأسعارها: [list]. تكاليفي الثابتة شهرياً: [مبلغ]. تكاليفي المتغيرة لكل وحدة: [list]. عمولات/رسوم: [list]. قبل ما تقترح، اسألني ٣ أسئلة عشان توضّح الصورة. بعدها طلّعلي: ١) الـ unit economics لكل منتج، ٢) فين أكبر cash leak، ٣) ٣ تعديلات تسعير ممكن أعملها فوراً.\"",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "تسعير بالعين vs تسعير بالـ AI",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — تسعير بالعين", body: "بتشوف سعر المنافس، بتنزل تحته 10 جنيه. مش عارف هامش ربحك الحقيقي. لما المبيعات تزيد، الفلوس مبتزدش معاها." },
      right: { label: "RIGHT — تسعير بالـ AI", body: "بتحط بياناتك قدام AI كل شهر. بيطلّعلك unit economics دقيقة. بتعرف بالظبط فين تقدر ترفع، فين تنزل، وفين الـ leak." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "Build Along — قطعتك في الـ Business OS",
    title: "اعمل Pricing Calculator + Cash Tracker بتاعك",
    tone: "accent",
    block: {
      kind: "executionTask",
      title: "النهارده هتطلع بأداتين شغّالين هتستخدمهم كل شهر.",
      steps: [
        "افتح Google Sheet جديد. اعمل تابين: \"Products & Margins\" و\"Monthly Cash Flow\".",
        "في التاب الأول: 4 أعمدة (المنتج، السعر، التكلفة المباشرة، الهامش = السعر - التكلفة). املا 5 منتجات أساسية عندك.",
        "في التاب التاني: تاريخ، فلوس داخلة، فلوس خارجة، الرصيد المتراكم.",
        "خد الـ Pricing Audit Prompt اللي فوق وحطه في AI مع بياناتك. خد التقرير وألصقه في تاب تالت اسمه \"AI Audit\".",
        "حدد موعد شهري ثابت تكرر فيه الـ audit (مثلاً يوم 1 من كل شهر).",
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اختبر فهمك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m2-l4-pricing-cash-flow-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "صاحب براند ملابس مبيعاته زادت 40% الشهر ده، لكن الكاش في البنك أقل من الشهر اللي فات. إيه السبب الأرجح؟",
          options: [
            "بيبيع رخيص.",
            "Cash Timing — بيبيع بالأجل لكن بيدفع للموردين نقدي.",
            "المنافسة قوية.",
          ],
          correctIndex: 1,
          explanation: "ده كلاسيك Cash Flow Gap. المبيعات (revenue) زادت، بس الفلوس مدخلتش لأن العميل بياخد منتج وبيدفع بعد 30 يوم، والمورد عايز فلوسه دلوقتي."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "مطعم بيبيع 3 وجبات بأسعار 80/90/100 جنيه. الأكتر مبيعاً 80. عايز يكسب أكتر. إيه أذكى تعديل بالـ AI؟",
          options: [
            "ينزل سعر الـ 80 لـ 70 عشان يبيع أكتر.",
            "يضيف وجبة فاخرة بـ 200 (price anchor) عشان الـ 100 يبان متوسط.",
            "يلغي وجبة الـ 100.",
          ],
          correctIndex: 1,
          explanation: "الـ Anchor العالي بيغيّر الـ perception. لما تشوف وجبة 200، الـ 100 تبان معقولة جداً. الناس اللي كانت بتختار 80 هتنتقل لـ 100 ومنهم لـ 200. ده Price Anchoring."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "حطيت بياناتك قدام AI وقالك \"محتاج ٣ أسئلة قبل أقترح\". إيه أهم سؤال متوقع منه؟",
          options: [
            "إيه اسم البيزنس بتاعك؟",
            "إيه التكاليف الخفية مش الظاهرة (عمولات، رسوم، هدر)؟",
            "كام موظف عندك؟",
          ],
          correctIndex: 1,
          explanation: "AI الكويس بيدوّر على الـ hidden costs لأن دي اللي بتقلب الـ unit economics. أصحاب البيزنس بينسوا يحطوها في الحسابات وبيتفاجئوا بالنتيجة."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "اعمل أول AI Pricing Audit لبيزنسك",
    tone: "accent",
    block: {
      kind: "mission",
      title: "خد منتج/خدمة واحدة من بيزنسك. حط كل أرقامها قدام AI. طلّع تقرير كامل.",
      prompt: "في تسليمك اكتب:\n\n١) المنتج/الخدمة + سعرها الحالي.\n٢) كل تكاليفها (مباشرة + غير مباشرة + رسوم/عمولات).\n٣) الـ Prompt اللي استخدمته كامل.\n٤) أسئلة AI ليك + إجاباتك.\n٥) الـ ٣ نتايج اللي طلعت: unit economics, biggest leak, ٣ تعديلات مقترحة.\n٦) أي تعديل هتنفّذ النهارده؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "بيانات حقيقية ومفصّلة",
          weight: 50,
          criteria: [
            "كل التكاليف مذكورة بأرقام، مش تقديرات عامة.",
            "العمولات والرسوم مش منسية.",
          ],
        },
        {
          label: "تنفيذ فعلي",
          weight: 50,
          criteria: [
            "في تعديل واحد على الأقل هتنفّذه من النهارده بتاريخ محدد.",
            "النتيجة المتوقعة من التعديل مذكورة.",
          ],
        },
      ],
    },
  },
];
