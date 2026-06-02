import {
  Compass,
  PlayCircle,
  Lightbulb,
  CheckCircle2,
  Rocket,
  BookOpen,
  Image as ImageIcon, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import transitionImage from "@/assets/lessons/unique/builder-m5-transition.jpg";

/**
 * Builder · M5 · Lesson 00 — Transition من اللغة للـ Anatomy
 * بيمسك إيد المتعلم بين M4 (Prompting/Parameters) و M5 (Frontend/Backend/DB).
 * 7 blocks: Hero → Concepts → Video → Idea → Screenshot → Failure×Right → Mission
 */
export const BUILDER_M5_TRANSITION_BLOCKS: IntroLessonContent = [
  {
    icon: Compass,
    eyebrow: "HERO",
    title: "خلصت اللغة — دلوقتي هتدخل عالم الـ Apps",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "M1 لحد M4 كانوا عن إزاي تتكلم مع الـ AI.",
        "من النهارده، هتتعلّم إزاي الـ Apps نفسها مبنية.",
        "الـ M5 ده أصعب درس نظري في كل Builder — بعديه هتفتح Lovable فعلاً.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "مصطلحات الدرس",
    title: "٣ كلمات هتسمعهم في كل مكان من هنا ورايح",
    block: {
      kind: "concepts",
      items: [
        { term: "Stack/Tech Stack", meaning: "توليفة الأدوات واللغات اللي بتستخدمها عشان تبني الأبلكيشن بتاعك.", example: "زي \"عدة\" الميكانيكي، شوية برامج بتشتغل مع بعضها عشان تطلع لك أبلكيشن كامل." },
        { term: "Frontend", meaning: "واجهة البرنامج، يعني كل حاجة بتشوفها وبتدوس عليها بعينك.", example: "زي \"وش\" المحل والديكور اللي الزبون بيشوفه ويطلب منه." },
        { term: "Backend (Logic)", meaning: "الشغل اللي \"ورا الكواليس\" اللي بيعالج البيانات وينفذ الأوامر.", example: "زي \"المدير\" اللي قاعد في المكتب ورا، بيحسب الحسابات ويطلع قرارات." },
        { term: "Database", meaning: "مخزن البيانات، Backend بيحط فيه الحاجة ويرجع يطلبها منه.", example: "زي \"دفتر الحسابات\" أو \"المخزن\"، المكان اللي بنشيل فيه المعلومات." },
        { term: "Tables & Columns", meaning: "طريقة تنظيم الداتا جوه الـ Database في شكل صفوف وأعمدة.", example: "زي شيت الإكسيل، الأبلكيشن بيخزن فيه بيانات العملاء أو المنتجات." },
        { term: "API", meaning: "رسول أو وسيط بينقل البيانات من أبلكيشن للتاني أو بين أجزاء الأبلكيشن.", example: "زي \"الماندوب\" اللي بياخد الطلب من الـ Frontend يوديه للـ Backend." },
        { term: "Auth (Authentication)", meaning: "عملية التأكد من شخصية المستخدم (زي اليوزر نيم والباسورد).", example: "زي \"البودي جارد\" اللي بيقف على الباب يسألك عن بطاقتك وتذكرة الدخول." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج: تشريح App في ٩٠ ثانية",
    block: {
      kind: "lessonVideo",
      caption: "هيتضاف فيديو قصير يشرح الـ 3 طبقات بصرياً.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "أي App بتستخدمه = ٣ طبقات بس",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "افتح WhatsApp: الشاشة اللي بتشوفها = Frontend. السيرفر اللي بيوصّل الرسالة = Backend. مكان حفظ الـ chats = Database.",
        "افتح Instagram: نفس القصة. افتح Uber: نفس القصة.",
        "الـ 3 دروس الجايين هيشرحوا كل طبقة لوحدها. مش هتبرمج حاجة — هتفهم بس.",
        "لو الكلام ده حسّيته مفاجئ، طبيعي. اقراه على راحتك، ومتقفلش الصفحة قبل ما تخلّص الـ Mission تحت.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "الـ Bridge بين Prompting و Building",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: transitionImage,
      alt: "رسمة بسيطة: على الشمال فقاعات chat (يمثّل الـ prompts اللي تعلمناها)، وعلى اليمين شاشة app + سيرفر + database (اللي جاي). سهم بيوصل الاتنين.",
      caption: "إنت دلوقتي في النص — خرجت من عالم «أكلّم الـ AI» وداخل عالم «أبني App». السهم ده هو M5.",
      label: "Transition: من Prompting إلى Anatomy",
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "Failure × Right",
    title: "إزاي تتعامل مع الـ 3 دروس الجايين",
    block: {
      kind: "comparison",
      left: {
        label: "غلط ✗",
        body: "تتسرّع وتقفز للـ Lovable قبل ما تفهم الفرق بين Frontend و Backend. هتلاقي نفسك متلخبط لما الـ AI يقولك «حطّ ده في الـ backend».",
      },
      right: {
        label: "صح ✓",
        body: "تاخد M5 بهدوء (٣ دروس × ١٠ دقايق). لما تخلّصه، الـ Lovable هيبقى عالم مفهوم مش لغز.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "حلّل App بتحبه قبل ما تكمّل",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m5-transition-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو فتحت أبليكيشن 'أوبر' ودوست على زرار 'اطلب رحلة'، الجزء اللي انت شفته قدامك على الشاشة زي الخريطة وزرار الطلب ده يعتبر إيه؟",
          options: [
            "Frontend",
            "Backend",
            "Database"
          ],
          correctIndex: 0,
          explanation: "الـ Frontend هو كل اللي المستخدم بيشوفه ويتفاعل معاه على الشاشة، زي الأزرار والصور والنصوص في أبلكيشن أوبر."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "لما بتبعت رسالة على 'واتساب'، وتشوف علامة صحين أزرق، إيه اللي بيحصل 'ورا الكواليس' عشان الرسالة دي توصل لحد تاني؟",
          options: [
            "الـ Frontend بيخزن الرسالة",
            "الـ Backend بيستقبل الرسالة ويوصلها",
            "الـ Database بيبعت الرسالة مباشرة"
          ],
          correctIndex: 1,
          explanation: "الـ Backend هو اللي مسؤول عن العمليات اللي بتحصل في الخلفية زي استلام الرسالة ومعالجتها وتوصيلها للمستقبل."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "لو بتستخدم 'إنستجرام' وعايز تشوف كل الصور والفيديوهات اللي عجبتك قبل كده (Likes)، الأبليكيشن بيجيب البيانات دي منين عشان يظهرها لك؟",
          options: [
            "من الـ Frontend اللي على جهازك",
            "من الـ Backend اللي بيعالج الصور",
            "من الـ Database اللي بيحفظ بيانات Likes"
          ],
          correctIndex: 2,
          explanation: "الـ Database هو المكان المخصص لحفظ كل أنواع البيانات، زي الـ Likes اللي المستخدم عملها، عشان الأبليكيشن يقدر يسترجعها وقت ما يحب."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "ارسم Stack تطبيقك في ٣ طبقات",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "قبل أول سطر كود، ارسم الـ Stack: Frontend / Backend / Database. لو مش قادر ترسمه، يبقى لسه فكرة مش مشروع.",
      prompt:
        "في تسليمك:\n\n١) فكرة التطبيق في سطر:\n٢) Frontend — إيه التكنولوجي + ايه أول ٣ شاشات؟\n٣) Backend — إيه اللي بيحصل في الخلفية؟ (APIs / Logic / Auth)\n٤) Database — إيه أهم ٣ tables هتحتاجها؟ (اسم + ٢-٣ columns لكل واحدة)\n٥) رسم بسيط بالـ ASCII أو وصف نصي: المستخدم بيضغط زرار → إيه يحصل في كل طبقة؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "الـ ٣ طبقات واضحة",
          weight: 60,
          criteria: [
            "كل طبقة فيها تقنية محددة + دور محدد.",
            "الـ ٣ tables بأسماء + columns مش مجرد «users, posts».",
          ],
        },
        {
          label: "رحلة طلب واحد",
          weight: 40,
          criteria: [
            "وصفت زرار/action واحد بيمر إزاي على الـ ٣ طبقات.",
            "الرحلة منطقية مش مفقود فيها طبقة.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "كل المنصة دي عبارة عن App — مش بس chat",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل المنصة دي عبارة عن App — مش بس chat",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. اللي شفته في M1-M4 كان كلام مع AI. من هنا وطالع، إنت بتشوف App كامل: pages، database، auth، API calls. كل صفحة في المنصة هي تطبيق عملي للي اتعلّمته.",
      bullets: [
        "Frontend: اللي إنت بتشوفه — الـ pages والـ components.",
        "Backend: serverFn و server routes بترد على كل click.",
        "Database: PostgreSQL بتخزّن تقدّمك في كل درس.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /dashboard", href: "/dashboard" },
    },
  }
];
