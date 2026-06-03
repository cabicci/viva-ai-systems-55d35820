import { Users, PlayCircle, Lightbulb, Scale, Rocket, BookOpen, Filter, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

export const BUSINESS_M2_CUSTOMER_LIFECYCLE_BLOCKS: IntroLessonContent = [
  {
    icon: Users,
    eyebrow: "HERO",
    title: "دورة حياة العميل",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "اكتشف → تواصل → اشترى → إما رجع أو اختفى.",
        "كل مرحلة محتاجة نظام مختلف.",
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
        { term: "Awareness", meaning: "إن الناس تعرف بوجودك وتبدأ تاخد بالها منك.", example: "زي ما حد يشوف صفحة محلك على الفيسبوك أو يسمع اسمك من صاحبه." },
        { term: "Acquisition (Acquire)", meaning: "إنك تحول الشخص من مجرد \"عارفك\" لعميل \"اشترى منك\".", example: "لمّا واحد يدخل المحل وفعلاً يشتري لبس أو يسجل بياناته عندك." },
        { term: "LTV (Lifetime Value)", meaning: "إجمالي الفلوس اللي هتاخدها من العميل طول حياته.", example: "كل الفلوس اللي العميل بيدخلها الدرج طول سنين تعامله معاك." },
        { term: "CAC (Customer Acquisition Cost)", meaning: "المبلغ اللي بتصرفه في الدعاية عشان تجيب زبون واحد.", example: "صرفنا ١٠٠٠ جنيه إعلانات وجبنا ١٠ زبائن، يعني العميل مكلفنا ١٠٠ جنيه." },
        { term: "Advocacy", meaning: "إن العميل يحبك لدرجة إنه يسوقلك \"ببلاش\" عند صحابه.", example: "العميل اللي يخرج ينفخ فيك ويشكر فيك قدام الناس ويقول لصحابه: \"روحوا اشتروا من فلان ده ثقة\"." },
        { term: "Retention", meaning: "رجوع الزبون يشتري تاني، وده اللي بيعمل المكسب الحقيقي.", example: "اللي اشترى مرة بيكلفك صفر إعلانات تاني مرة، عكس الجديد تماماً." },
        { term: "Revenue", meaning: "إجمالي المبيعات أو كل \"الخرش\" اللي داخل المحل.", example: "كل الفلوس اللي بتدخل الدرج قبل ما تخصم منها مصاريفك." },
        { term: "Leak (Funnel Leak)", meaning: "يعني في خلل بيخلي الزبون \"يهرب\" منك في نص الطريق.", example: "لمّا يكون عندك متابعين كتير بس مفيش حد بيشتري، كده في تسريب." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: { kind: "lessonVideo", caption: "إزاي تشوف كل عميل كرحلة، مش كصفقة." },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "قاعدة الـ 5x",
    block: {
      kind: "numberedList",
      items: [
        "إزاي تجر رجل زبون جديد بيكلّف ٥ أضعاف إنك تمسّك في الزبون اللي عندك.",
        "Acquisition (Creator + Automator) = الجزء الغالي.",
        "Retention (Follow-up + جودة) = الجزء الرخيص — وبتاع أعلى ربح.",
        "ركّز ٧٠٪ من جهد العملاء على الاحتفاظ، ٣٠٪ على الجلب.",
      ],
    },
  },
  {
    icon: Filter,
    eyebrow: "شوف بنفسك",
    title: "Funnel بأرقام واقعية",
    block: {
      kind: "diagram",
      id: "customer-lifecycle-funnel",
      caption: "١٠٠٠ يكتشفوا → ٢٠٠ يتواصلوا → ٥٠ يشتروا → ١٥ يرجعوا. عميل راجع = ٣.٢ × ربح عميل جديد.",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "صيد جديد vs احتفاظ بالموجود",
    block: {
      kind: "comparison",
      left: { label: "FAILURE — كل التركيز على الجديد", body: "بتصرف فلوس على إعلانات. العميل اللي اشترى بينسى. الـ revenue ثابت." },
      right: { label: "RIGHT — احتفاظ + جديد", body: "العميل القديم بيرجع تلقائي. الجديد إضافة. الـ revenue بيكبر بدون زيادة تكلفة." },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "ارسم دورة عميلك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m3-l1-customer-lifecycle-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو شركتك بتدفع 1000 جنيه عشان تجيب عميل جديد، وعايز توفر في المصاريف وتزود أرباحك. إيه أنسب خطوة تعملها بناءً على اللي درسته؟",
          options: [
            "أصرف أكتر على إعلانات جديدة عشان أجيب عملاء أكتر.",
            "أركز جزء كبير من جهدي وميزانيتي على إني أحافظ على العملاء اللي عندي وأخليهم يشتروا تاني.",
            "أقلل جودة المنتج عشان أوفر فلوس وأبيع بسعر أقل وأجذب عدد عملاء أكبر."
          ],
          correctIndex: 1,
          explanation: "الاحتفاظ بالعملاء اللي موجودين عندنا بيُكلف أقل بكتير من جلب عميل جديد (خمس أضعاف أقل)، وده بيحقق أرباح أعلى."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "انت فاتح محل ملابس جديد، ولسه في مرحلة 'اكتشاف' العميل. إيه أحسن طريقة عشان تعرف الناس بيك وتجذب أول عملائك؟",
          options: [
            "أصرف فلوس كتير على إعلانات في التليفزيون فورًا.",
            "أركز على حملات تسويقية بسيطة وموجهة عشان الناس تعرف مكانك وتتعرف على ستايلك.",
            "أستنى لما الناس تيجي لوحدها من غير مجهود تسويقي."
          ],
          correctIndex: 1,
          explanation: "في مرحلة الاكتشاف، بنحتاج نصرف على حملات تسويقية واعلانات عشان نعرف الناس بالبيزنس. الحملات الموجهة بتكون فعالة أكتر في البداية."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "بعد ما العميل اشترى منك منتج، واكتشفت إنه عجبُه جدًا. إيه الخطوة اللي بعدها عشان تزود فرص رجوعه واحتفاظك بيه؟",
          options: [
            "أبعتله عروض خصم على منتجات منافسة ليا.",
            "ماتواصلش معاه تاني عشان مأزهقهوش.",
            "أبعتله رسالة شكر فيها عروض خاصة لأحسن عملائي، وأوفرله دعم فني ممتاز بعد البيع."
          ],
          correctIndex: 2,
          explanation: "المتابعة بعد البيع وجودة الخدمة مهمين جدًا في مرحلة الاحتفاظ. عروض خاصة للعملاء المميزين ودعم فني بيخلوا العميل يرجعلك تاني."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "ارسم Customer Lifecycle لمنتجك",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "لو مش شايف رحلة العميل من Awareness لـ Advocacy، بتفقد فلوس في الـ leaks بدون ما تعرف.",
      prompt:
        "في تسليمك اكتب:\n\n١) الـ ٥ مراحل عند عميلك (Awareness, Acquisition, Activation, Retention, Advocacy) — وصفهم بكلامك:\n٢) أكبر leak بين أي مرحلتين (فين الناس بتقع):\n٣) رقم تقديري للـ leak (نسبة الـ drop):\n٤) سبب محتمل واحد:\n٥) تجربة واحدة هتعملها الأسبوع الجاي تقفل الـ leak:",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "رسم كامل",
          weight: 70,
          criteria: [
            "الـ ٥ مراحل موصوفة بسياق منتجك مش تعريفات عامة.",
            "الـ leak محدّد بين مرحلتين بالاسم.",
          ],
        },
        {
          label: "فعل واحد",
          weight: 30,
          criteria: [
            "في تجربة محدّدة لقفل الـ leak.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "/onboarding → /dashboard → /dashboard = lifecycle المتعلّم",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "/onboarding → /dashboard → /dashboard = lifecycle المتعلّم",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Business — نفس اللي بتتعلمه. المستخدم بيمر بنفس الـ stages: Discover (landing) → Sign up → Onboarding → First lesson → Continued learning → Mastery. كل stage محدّد بـ funnel events في learner_events.",
      bullets: [
        "Funnel stages كلها مرسومة في /analytics.",
        "Drop-off في كل stage بيتقاس منفصل.",
        "أعلى drop-off حاليا في step 3 من onboarding — في /roadmap.",
      ],
      pathAngle: "business",
      link: { label: "افتح /onboarding", href: "/onboarding" },
    },
  }
];