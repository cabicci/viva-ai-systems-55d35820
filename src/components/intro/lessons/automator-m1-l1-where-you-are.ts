import {
  Map,
  PlayCircle,
  Lightbulb,
  Compass,
  Scale,
  Rocket,
  Image as ImageIcon,
  BookOpen,
  AlertTriangle, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import journeyScreenshot from "@/assets/lessons/unique/automator-m1-l1-where-you-are.jpg";
/**
 * Automator · M0 · Lesson 01 — أنت فين في الخريطة؟
 * يفتح المسار بربط Builder + Creator باللي جاي. كل قرار في الـ Automator
 * بيتبني على إن المتعلم خلّص (أو هيخلّص) Builder و Creator.
 */
export const AUTOMATOR_M0_WHERE_YOU_ARE_BLOCKS: IntroLessonContent = [
  {
    icon: Map,
    eyebrow: "HERO",
    title: "إنت مش في درس — إنت في خريطة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Builder بنى المنتج.",
        "Creator جاب الناس.",
        "Automator هيخلّي كل ده يشتغل لوحده.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "مصطلحات الدرس",
    title: "مصطلحات هتشوفها في الدرس",
    tone: "primary",
    block: {
      kind: "concepts",
      items: [
        { term: "Leads", meaning: "زبون محتمل حد عينيه زغللت على اللي بتقدمه بس لسه مطلعش المحفظة.", example: "صاحب براند شنط جاله رسالة \"بكام\" من شخص مهتم، الشخص ده كده Lead لسه ما اشترش." },
        { term: "Automator", meaning: "الشخص اللي بيبني النظام اللي بيخلي السيستم يشتغل بدالك وأنت نايم.", example: "الـ Creator بيصور فيديو للمنتج، والـ Automator بيخلي الفيديو يتبعت أوتوماتيك لكل الناس اللي سألت." },
        { term: "Workflow", meaning: "خطوات ورا بعض بتخلص شغلانة معينة (بداية ← عمليات ← نتيجة).", example: "المحاسب عنده شيت إكسيل فيه فواتير، ده Workflow: (فاتورة تدخل ← تتسجل ← تترحل)." },
        { term: "Make / n8n", meaning: "مواقع (مش برامج تحميل) بتوصل وتجمع أدوتك في مكان واحد.", example: "زي \"كوبس\" المشترك، بيوصل برنامجين ببعض عشان ينقلوا بيانات لبعض وتتحكم فيهم." },
        { term: "Frontend & Backend", meaning: "الـ Frontend اللي المستخدم بيشوفه، والـ Backend المطبخ والكواليس اللي فيها البيانات.", example: "لما اليوزر يدوس زرار (Frontend)، الـ API يبلغ السيرفر يخصم الفلوس (Backend)." },
        { term: "API", meaning: "الرسول أو \"الوصلة\" اللي بتخلي برنامجين يكلموا بعض وينقلوا داتا.", example: "زي \"المندوب\" اللي بياخد طلب من موقعك يوديه لشركة الشحن أوتوماتيك." },
      ],
    },
  },
  {
    icon: AlertTriangle,
    eyebrow: "اطمن",
    title: "✅ تقدر تبدأ من هنا مباشرة",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Builder مش شرط. تقدر تبدأ Automator من غيره خالص.",
        "M1 و M2 هنا مش محتاجين أي خلفية تقنية — هتفهمهم لو إنت لسه في بداية الرحلة.",
        "بس لما توصل لـ M3 (ربط Database و APIs)، لو حسيت إن المصطلحات صعبة، ارجع لـ Builder M5 وارجعلنا تاني.",
        "خلاصة: ابدأ، وشوف. مفيش حاجة هتتكسر.",
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption: "خريطة المنظومة الكاملة — وفين موقع الـ Automator فيها.",
    },
  },
  {
    icon: Compass,
    eyebrow: "الخريطة",
    title: "٥ مسارات — قطعة واحدة",
    block: {
      kind: "flow",
      steps: [
        "Builder → Creator",
        "Automator (إنت هنا)",
        "Analyst → Business",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "ليه دلوقتي؟",
    title: "Automator مش مسار منفصل",
    block: {
      kind: "paragraphs",
        paragraphs: [
        "لو دخلت Automator قبل ما يبقى عندك منتج (Builder) أو جمهور (Creator) — هتشغّل إيه لوحده؟ أو هتأتمت الهوا؟",
        "علشان كده الترتيب مهم: الـ Automator بيربط اللي بنيته بالناس اللي جذبتهم، وبيحوّل الـ Leads لـ مبيعات، الـ Support لـ نظام، والـ Operations لـ Workflows.",
        "نهاية المسار ده، كل اللي خرج من Creator (Leads، Comments، DMs) هيدخل نظام أنت بنيته — من غير ما تفتح لاب توب.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "صفحة /dashboard بتاعتنا",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: journeyScreenshot,
      alt: "صفحة /dashboard في المنصة — خريطة كاملة للمسارات (Intro، Creator، Builder، Automator، Business، Analyst) مع مؤشر تقدّم لكل مرحلة.",
      caption: "ده فعلًا screenshot من صفحة /dashboard بتاعتنا — اللي إنت داخل تتعلّم فيها. كل دائرة = مسار، وكل مسار جوّاه دروس. الـ Automator (اللي إنت فيه) مش مسار منفصل — هو طبقة على فوق Builder + Creator. الخريطة دي هي اللي بنبني عليها كل قرار.",
      label: "من المنصة — صفحة /dashboard",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "إزاي تفكّر في الـ Automation",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — Automation = أدوات",
        body: "بتتعلم Make، n8n، Zapier كأدوات منفصلة. بتعمل Flow هنا، Flow هناك، من غير ما تربطهم بحاجة حقيقية. النتيجة: شغل ضايع وأدوات بتلغي اشتراكها.",
      },
      right: {
        label: "RIGHT — Automation = نظام",
        body: "بتشوف شغلك ككل (المنتج + الجمهور + المبيعات + المتابعة) وبتسأل: أنهي خطوة بتتكرّر؟ أنهي بيانات بتنتقل من مكان لمكان؟ كل Flow بيخدم هدف واضح في الخريطة.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "ارسم خريطتك في 5 سطور",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m1-l1-where-you-are-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أحمد بقى له أسبوع بيبعت إيميلات شكر لكل عميل جديد يدوي، وبياخد منه ساعة كل يوم. إيه أكتر حاجة \"أتمتتها\" هتوفر عليه الوقت والمجهود ده؟",
          options: [
            "عمل سيستم يبعت إيميل الشكر أوتوماتيك أول ما العميل يسجل.",
            "يعمل مكالمات تليفون للعملاء الجديدة عشان يشكرهم.",
            "يوقف خالص إنه يشكر العملاء الجداد عشان ميوفرش وقت."
          ],
          correctIndex: 0,
          explanation: "الأتمتة بتفكك من الزهق بتاع تكرار التاسكات (إرسال إيميلات الشكر) تتنفّذ من غير تدخّل بشري، وده اللي هيوفر وقت أحمد."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "لو إنت عندك ويب سايت بيبيع كورسات، والعملاء المحتملين (Leads) بيملوا فورم عشان يعرفوا تفاصيل أكتر. إيه أول نقطة تواصل (First Touch Point) في الـ Workflow ده؟",
          options: [
            "إنك تبعت لهم ميل يرحب بيهم.",
            "إن العميل يملى الفورم على الويب سايت.",
            "إنك تتصل بالعميل بعد ما يخلص الكورس."
          ],
          correctIndex: 1,
          explanation: "أول نقطة تواصل هي بداية الـ Workflow اللي بيدخل منه Lead، وهنا هي ملء الفورم على الويب سايت زي ما المهمة الأصلية بتحدد."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "علي لسه بيتعلم برمجة وعايز يبدأ في الـ Automation، بس معندوش منتج جاهز ولا جمهور. أفضل نصيحة ليه طبقًا لأفكار الدرس هتكون إيه؟",
          options: [
            "يبدأ يركز على بناء منتج الأول (Builder) أو تجميع جمهور (Creator) وبعدين يرجع للأتمتة.",
            "يتجاهل Builder و Creator ويركز بس على الـ Automation ويكمل دراسة.",
            "يشوف أي منتج على الإنترنت ويحاول يعمل له Automation حتى لو ملوش علاقة بيه."
          ],
          correctIndex: 0,
          explanation: "الدرس بيأكد على إنك لو دخلت Automator قبل ما يبقى عندك منتج (Builder) أو جمهور (Creator) — هتأتمت إيه؟ الترتيب مهم علشان الـ Automator بيربط اللي بنيته بالناس اللي جذبتهم."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "اعمل Audit لأسبوعك — فين الوقت بيتضيع؟",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "قبل ما تأتمت، لازم تشوف فين أصلاً الوقت بيتسرّب. هتعمل Audit بسيط لأسبوع شغل.",
      prompt:
        "في تسليمك:\n\n١) ٥ tasks متكرّرة بتعملهم كل أسبوع — لكل واحد:\n   - اسم الـ task:\n   - عدد المرات في الأسبوع:\n   - وقت كل مرة (دقايق):\n   - الوقت الإجمالي = مرات × دقايق:\n٢) أنهي task ياخد أكبر وقت في الأسبوع؟\n٣) أنهي task أبسط (٢ أو ٣ خطوات بس)؟\n٤) لو هتأتمت واحد بس النهارده، هتختار الأكبر ولّا الأبسط — ولِيه؟\n٥) ايه الـ task اللي ممنوع تأتمته (محتاج لمسة بشرية فعلاً)؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "Audit برقم",
          weight: 60,
          criteria: [
            "٥ tasks بأرقام دقايق ومرات مش تقديرات عامة.",
            "الـ total time لكل task محسوب فعلاً.",
          ],
        },
        {
          label: "Decision + ممنوعات",
          weight: 40,
          criteria: [
            "اخترت ١ بسبب منطقي (size vs complexity).",
            "حدّدت task محظور أتمتته بسبب قيمة بشرية حقيقية.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "/dashboard — خريطتك عبر المسارات الـ 5",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "/dashboard — خريطتك عبر المسارات الـ 5",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Automator — نفس اللي بتتعلمه. صفحة /dashboard بتوريك إنت فين دلوقتي في الـ ecosystem كله. مش بس في المسار الحالي — في الـ 5 مسارات. ده visualization للـ systems view اللي هتتعلّمه في Automator.",
      bullets: [
        "Map view لكل مسار + مكانك فيه.",
        "تقدر تشوف cross-references بين الدروس.",
        "كل مسار بيتفتح لما تخلص prerequisites.",
      ],
      pathAngle: "automator",
      link: { label: "افتح /dashboard", href: "/dashboard" },
    },
  }
];