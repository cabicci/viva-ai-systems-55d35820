import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import frontendScreenshot from "@/assets/lessons/builder-m5-l10-frontend.jpg";

/**
 * Builder · M5 · Lesson 01 — Frontend: اللي بتشوفه
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 *
 * Bridge from M1-M4 (AI internals) to M5+ (app architecture).
 */
export const BUILDER_M5_FRONTEND_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "تشبيه المطعم",
    title: "Frontend = الطاولة اللي قدامك",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تخيل مطعم: الطاولة، الكراسي، المنيو، الديكور — كل اللي شايفه دلوقتي = Frontend.",
        "مش لازم تعرف تطبخ عشان تفهم الطاولة. بس عرف شكلها وفين الزراير.",
        "ده الدرس ده بالظبط — مفيش كود، بس صور وأمثلة.",
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
        { term: "Frontend (الفرونت إند)", meaning: "كل حاجة ظاهرة قدام عينك في الموقع وبتقدر تلمسها أو تدوس عليها.", example: "زي ديكور المحل، اليفطة والأرفف اللي الزبون بيشوفها وهو داخل يشتري." },
        { term: "UI/UX (تصميم الواجهة) 🎨", meaning: "شكل التصميم، الألوان، وأماكن الزراير اللي بتخلي استخدامه سهل.", example: "زي ملف الإكسيل اللي قدام المحاسب، الألوان والخانات اللي بيملى فيها الأرقام." },
        { term: "Client-side (ناحية العميل) 💻", meaning: "الكود اللي بيشتغل على جهازك إنت مش على كمبيوتر الشركة (السيرفر).", example: "زي ما بتفتح تطبيق الموبايل، النسخة دي معاك على جهازك، بس البيانات بتجيلها من الشركة." },
        { term: "Frameworks (زي React) 🛠️ 💡", meaning: "مجموعة أدوات وبرواز كود جاهز بيساعدك تبني الموقع أسرع وباحترافية.", example: "زي طقم العدة الجاهز، بدل ما تصنع شاكوش، الـ React بيديك أدوات جاهزة تبني بيها بسرعة." },
        { term: "State (حالة الصفحة) 🚦🔬", meaning: "حالة الصفحة في لحظة معينة (فاضية، بتتحمل، أو فيها غلط).", example: "زي شاشة \"تم الدفع بنجاح\" أو \"المنتج خلص\"، دي حالات مختلفة لنفس الصفحة." },
        { term: "Inspector / F12 🔍⚙️", meaning: "أداة جوه المتصفح بتوريك الكود اللي ورا الألوان والزراير عشان تفهمها.", example: "زي ما المحاسب بيراجع فواتير قديمة، الـ Inspector بيخليك تتفرج على الطبقات اللي بنيت الموقع." },
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
      caption: "إيه هو الـ Frontend، ومن إيه بيتركّب، وإمتى تعرف إن مشكلتك \"frontend\" مش \"backend\".",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Frontend = طبقة العرض والتفاعل",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أي app أو website بيتقسّم لطبقتين أساسيتين: Frontend (اللي بتشوفه) و Backend (اللي بيشتغل ورا الستار). الدرس ده عن الأولى.",
        "Frontend = كل بكسل بيوصل لعينك. الأزرار، النصوص، الألوان، الترتيب، الانتقالات. لما تضغط زرار وتشوف شاشة بتتغيّر، ده Frontend شغّال.",
        "بيتركّب من ٣ تكنولوجيات أساسية: HTML (الهيكل — \"إيه الموجود؟\")، CSS (الستايل — \"شكله إزاي؟\")، JavaScript (التفاعل — \"بيعمل إيه لما تدوس؟\"). فوقهم frameworks زي React بتسهّل الشغل.",
        "نقطة مهمة: الـ Frontend بيركض على متصفّح المستخدم، يعني على كمبيوتره أو موبايله. مش على سيرفرك. ده معناه: أي حاجة سرّية (API keys، أسرار) ممنوع تحطها هنا — أي حد يقدر يفتح Inspector ويشوفها.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "الصفحة الرئيسية للموقع",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: frontendScreenshot,
      alt: "الصفحة الرئيسية للموقع — Navbar فوق، Hero بعنوان نظام تشغيل تعليمي بالذكاء الاصطناعي، وصف، وزرارين CTA",
      caption:
        "كل اللي شايفه ده Frontend خالص: شريط التنقل فوق (Navbar)، البادج الرمادي، العنوان بألوان متدرّجة (gradient text)، الفقرة التعريفية، وزرارين الـ CTA (\"ابدأ رحلتك\" + \"استكشف المنظومة\"). الكلام ده طلع من prompts (M2)، الألوان والـ gradient اتحدّدوا في design tokens (CSS variables)، والترتيب في React components. لما تضغط \"ابدأ رحلتك\"، JavaScript بياخدك لـ /curriculum — وده برضه frontend (التنقل في صفحات SPA). الـ AI نفسه مش هنا — الـ AI شغّال في الـ backend لما تكلّم المساعد.",
      label: "من الموقع — صفحة /",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "إزاي تفرّق بين مشكلة Frontend و Backend",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — تخلط بين الطبقتين",
        body: "\"الزرار مش شغّال\" — جملة مبهمة. مش شغّال يعني إيه؟ مش بيظهر؟ بيظهر بس مش بيتدوس؟ بيتدوس بس مفيش حاجة بتحصل؟ بيتدوس ومش بيرد بحاجة من السيرفر؟ كل سيناريو طبقة مختلفة.",
      },
      right: {
        label: "RIGHT — حدّد الطبقة بالظبط",
        body: "افتح Inspector (F12). لو الزرار مش ظاهر → CSS/HTML (frontend). لو ظاهر بس مفيش onClick → JavaScript (frontend). لو بيتدوس وبيظهر loading بعدين error → Backend/Network. أول حاجة في أي bug: حدّد الطبقة قبل ما تطلب مساعدة.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "افتح أي موقع بتحبه واقرأه طبقات",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m5-l10-frontend-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو فتحت موقع أمازون، ولقيت إن سعر منتج معين مش ظاهر، أو الصورة بتاعته مش باينة. تفتكر المشكلة دي أقرب للـ Frontend ولا Backend؟",
          options: [
            "Frontend",
            "Backend",
            "الاثنين مع بعض"
          ],
          correctIndex: 1,
          explanation: "المعلومات زي السعر والصور غالبًا بتيجي من السيرفر (Backend)، والـ Frontend بس بيعرضها. لو هي مش ظاهرة، يبقى غالبًا في مشكلة في جلب البيانات من الـ Backend."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "وأنت بتتصفح موقع أخبار، دوست على زرار \"تغيير الوضع الليلي\" (Dark Mode)، والصفحة كلها إتحولت للألوان الغامقة. إيه التكنولوجيا الأساسية اللي خلت التغيير ده يحصل قدام عينك؟",
          options: [
            "HTML",
            "CSS",
            "JavaScript"
          ],
          correctIndex: 1,
          explanation: "الـ CSS هو المسؤول عن الـ Styles والألوان والتصميم. التغيير المرئي لألوان الصفحة كله بيتم بالـ CSS."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "أنت بتسجل في موقع جديد، وبتكتب اسم المستخدم بتاعك. أول ما تخلص كتابة، الموقع بيظهرلك رسالة فورية لو الاسم ده متاح ولا لأ، من غير ما تعمل Reload للصفحة. إيه اللي بيعمل التفاعل ده؟",
          options: [
            "HTML",
            "CSS",
            "JavaScript"
          ],
          correctIndex: 2,
          explanation: "الـ JavaScript هو المسؤول عن إضافة التفاعل للصفحة. الاستجابة الفورية لكتابتك بدون إعادة تحميل الصفحة هي وظيفة أساسية للـ JavaScript."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم Wireframe لـ ٣ شاشات أساسية",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Frontend = اللي المستخدم بيشوفه. هترسم/توصف ٣ شاشات بأبسط شكل قبل أي كود.",
      prompt:
        "في تسليمك:\n\n١) التطبيق في سطر:\n٢) شاشة ١ — Landing/Home: ايه أهم ٣ عناصر + الـ CTA الأساسي؟\n٣) شاشة ٢ — اللي بعد ما يدوس CTA: ايه فيها؟\n٤) شاشة ٣ — Dashboard/النتيجة: ايه بيشوف؟\n٥) لكل شاشة، اكتب State فيها (Loading / Empty / Error / Success) — إيه شكل كل واحدة؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "٣ شاشات بعناصر",
          weight: 60,
          criteria: [
            "كل شاشة فيها عناصر محددة بالاسم، مش وصف عام.",
            "فيه CTA واحد واضح في كل شاشة.",
          ],
        },
        {
          label: "States لكل شاشة",
          weight: 40,
          criteria: [
            "كل شاشة فيها على الأقل ٢ states (مش بس Success).",
            "Loading + Empty/Error معرّفين بشكل ملموس.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "كل صفحة في المنصة هي Frontend شغّال",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل صفحة في المنصة هي Frontend شغّال",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. صفحة /dashboard اللي إنت بتفتحها كل يوم = Frontend مبني بـ React. الـ AI ولّد أول version منها، وإحنا عدّلنا وكمّلنا — نفس الـ workflow اللي بتتعلّمه.",
      bullets: [
        "كل widget في الـ dashboard = React component منفصل.",
        "الـ styling كله بـ Tailwind — مفيش CSS files خارجية.",
        "افتح DevTools واضغط Inspect على أي عنصر هتشوف الـ component اسمه إيه.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /dashboard", href: "/dashboard" },
    },
  }
];
