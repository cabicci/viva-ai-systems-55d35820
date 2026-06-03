import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import ideaToPageScreenshot from "@/assets/lessons/builder-m6-l13-idea-to-page.jpg";

/**
 * Builder · M6 · Lesson 01 — من فكرة لصفحة
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 *
 * فاتحة M6: بعد ما عرف Frontend/Backend/DB، إزاي يحوّل فكرة لصفحة فعلية.
 */
export const BUILDER_M6_IDEA_TO_PAGE_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "من فكرة في دماغك لصفحة على الشاشة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "اتعلّمت إزاي الـ AI بيفكر، إزاي الـ App بيتقسّم لطبقات.",
        "دلوقتي السؤال: \"عندي فكرة — ابدأ منين؟\"",
        "في الدرس ده هتتعلّم إزاي تترجم فكرة لخريطة صفحات، قبل أي كود.",
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
        { term: "Layout Better", meaning: "طريقة توزيع وشكل العناصر في صفحتك.", example: "زي ما صاحب الكشك بيرص بضاعته عشان الزبون يشوفها بسهولة." },
        { term: "Wireframe", meaning: "رسمة سادة بالأبيض والأسود بتوريك أماكن الحاجات.", example: "تخيلها زي كروكي شقة لسه \"على المحارة\" من غير دهانات ولا عفش." },
        { term: "Mockup (Visual)", meaning: "تصميم ملون وشيك، بالظبط \"صورة طبق الأصل\" من النتيجة.", example: "زي ما بتشوف صورة الشقة بالديكور والألوان والفرش قبل ما تتنفذ." },
        { term: "User Flow", meaning: "خريطة بالخطوات اللي اليوزر بيمشيها عشان يخلص حاجة معينة.", example: "زي المسار اللي بيمشيه الزبون في المحل من الدخول للكاشير." },
        { term: "CTA", meaning: "زرار أو جملة هدفها تخلي الزبون ياخد قرار بسرعة.", example: "زي الزرار اللي مكتوب عليه \"اشتري دلوقتي\" في إعلان فيسبوك." },
        { term: "Promise", meaning: "وعد برمجي إن فيه داتا هتيجي \"كمان شوية\".", example: "زي ما بتاع الدليفري بيوعدك يوصل الأكل، والبرمجة بتستنى الرد." },
        { term: "API", meaning: "وسيط بيخلي برنامجين يكلموا بعض وينقلوا داتا.", example: "زي الفيشة اللي بتوصل الكاتل بالكهرباء عشان يشغل الملاحة." },
        { term: "Backend (Database)", meaning: "المخزن اللي بنشيل فيه كل بيانات الموقع بانتظام.", example: "زي الدفاتر اللي المحاسب بيسجل فيها كل مليم داخل وخارج." },
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
      caption: "إزاي تحوّل فكرة لـ user flow، وتقسّم الـ flow لصفحات، قبل ما تكتب أي prompt.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "الصفحة = محطة في رحلة المستخدم",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل app — مهما كان معقّد — مجموعة صفحات (Pages / Routes). كل صفحة لها URL مميّز (مثلاً: /، /dashboard، /curriculum) ولها هدف واحد واضح: تخلّي المستخدم يعمل حاجة واحدة. الصفحة اللي بتحاول تعمل ٥ حاجات في وقت واحد بتفشل في الخمسة.",
        "الترتيب الصحيح للتفكير: ابدأ بـ User Flow (مش بالتصميم). اسأل: \"المستخدم داخل ليه؟ إيه أول حاجة هيعملها؟ بعدين إيه؟\" ارسم خط من نقطة الدخول للنتيجة. كل محطة في الخط = صفحة.",
        "بعد ما تحدّد الصفحات، حدّد لكل صفحة: (١) الـ URL، (٢) الهدف الواحد، (٣) إيه البيانات اللي محتاجة من الـ Backend (M5.2)، (٤) إيه الأكشن الأساسي (زرار واحد المفروض المستخدم يدوسه).",
        "في M5 شفت إن أي صفحة بتعيش في طبقة الـ Frontend (HTML+CSS+JS)، بتطلب بياناتها من الـ Backend عن طريق API، والبيانات نفسها بتيجي من Database. هنا في M6 بنركّز على تخطيط الصفحات قبل ما نبنيها.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "صفحة /curriculum بهدف واحد واضح",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: ideaToPageScreenshot,
      alt: "صفحة /curriculum — كرت 'خريطة المنظومة الكاملة' فيه شريط تقدّم 0/19، تحته STAGE 01 START 'البداية' وكرت Introduction",
      caption:
        "الصفحة دي مثال على \"صفحة بهدف واحد\". الهدف: أعرّف المستخدم بكل اللي قدامه ويختار من فين يبدأ. مفيش حاجة تانية. لاحظ التركيب: Hero (العنوان + شريط التقدم العام = نظرة شاملة) → Stage label (STAGE 01) → كروت المسارات بترتيب منطقي. الـ URL واضح (/curriculum)، البيانات اللي محتاجها (19 درس متاح، 66 قادم، نسبة 0%) كلها جاية من Backend (M5.2)، والأكشن الأساسي = اضغط على كرت مسار. لو حطينا هنا كمان form دفع وزرار تسجيل خروج وفورم رسائل، الصفحة كانت هتفقد هدفها.",
      label: "من الموقع — صفحة /curriculum",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "إزاي تبدأ مشروع جديد بشكل صحيح",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — تبدأ من التصميم",
        body: "\"أنا عايز app للمطاعم\" → فتحت Figma وبدأت ترسم Hero فخم. بعد ساعتين عندك صفحة landing جميلة، بس مش عارف: المستخدم بيحجز ولا بيطلب delivery؟ فيه حساب ولا لأ؟ كام صفحة في المجموع؟ التصميم من غير flow = هتعيد كل حاجة من الأول.",
      },
      right: {
        label: "RIGHT — تبدأ من User Flow",
        body: "\"المستخدم داخل عشان يحجز طاولة\" → flow: يفتح الموقع → يختار المطعم → يختار التاريخ والوقت → يأكّد → يستلم تأكيد. ٥ محطات = ٤-٥ صفحات. لكل صفحة: URL + هدف + بيانات. دلوقتي تقدر ترسم ولا تعمل prompt — عندك خريطة. التصميم بيخدم الـ flow، مش العكس.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "ارسم Sitemap لتطبيقك في ٧ دقايق",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m6-l13-idea-to-page-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "مدربك طلب منك تعمل تطبيق لشركة توصيل أكل. أول خطوة هتعملها إيه قبل ما تفكر في أي تصميم؟",
          options: [
            "هرسم الـUser Flow عشان أحدد المستخدم داخل يعمل إيه وإيه الخطوات اللي هياخدها.",
            "هفتح برنامج تصميم زي Figma أو Adobe XD وأبدأ أرسم Mockup للصفحة الرئيسية.",
            "هحدد الألوان والخطوط اللي هتبني عليها Brand Identity للتطبيق."
          ],
          correctIndex: 0,
          explanation: "الترتيب الصحيح للتفكير بيبدأ بالـ User Flow عشان نعرف هدف المستخدم والخطوات اللي بتوصله للهدف ده، وده قبل ما نبدأ في أي تصميم بصري."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "بتخطط لصفحة 'تفاصيل المنتج' في تطبيق تسوق. إيه هو الهدف الواحد الواضح للصفحة دي؟",
          options: [
            "عرض تفاصيل المنتج، إضافة المنتج للسلة، ومقترحات لمنتجات مشابهة عشان أخلي المستخدم يتفاعل مع كل ده.",
            "تمكين المستخدم من الاطلاع على تفاصيل منتج معين والقيام بإجراء أساسي واحد عليه.",
            "عرض كل المنتجات المتاحة في المتجر عشان المستخدم يختار اللي يعجبه."
          ],
          correctIndex: 1,
          explanation: "كل صفحة لازم يكون ليها هدف واحد واضح عشان متشتتش المستخدم. صفحة 'تفاصيل المنتج' هدفها الأساسي هو إبراز معلومات المنتج وإتاحة إجراء واحد عليه، زي إضافته للسلة."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "لو بتعمل صفحة 'لوحة التحكم' (Dashboard) للمشرفين في تطبيقك. إيه البيانات اللي غالباً هتحتاجها من الـ Backend وإيه الأكشن الأساسي اللي ممكن تكون محتاجاه؟",
          options: [
            "بيانات المنتجات كلها والأكشن الأساسي: 'إضافة منتج جديد'.",
            "ملخص إحصائيات المبيعات، الطلبات المعلقة، والمستخدمين الجدد. الأكشن الأساسي: 'مراجعة طلبات قيد التنفيذ'.",
            "قائمة بالعملاء وأساميهم والأكشن الأساسي: 'إرسال رسالة لكل العملاء'."
          ],
          correctIndex: 1,
          explanation: "صفحة لوحة التحكم هدفها الأساسي هو إعطاء نظرة عامة وإتاحة إجراءات إدارية. الإحصائيات والطلبات مهمة للمتابعة، والأكشن الأساسي غالباً بيكون مراجعة حاجة معينة أو اتخاذ قرار إداري."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "حوّل فكرة لصفحة في ٤ خطوات منظّمة",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "من الفكرة للصفحة الأولى مش بترتجل. هتمشي على ٤ خطوات: Goal → Hero → Sections → CTA.",
      prompt:
        "في تسليمك:\n\n١) Goal — هدف الصفحة في سطر (مين هيدخل ولِيه؟):\n٢) Hero — العنوان الأساسي + sub-headline + CTA primary:\n٣) Sections — ٣-٥ secions بعناوين (مش لوريم إيبسوم):\n٤) CTA النهائي — إيه الـ action اللي محتاجه قبل ما يطلع؟\n٥) ايه الـ Promise اللي الصفحة بتقدمه في جملة واحدة؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "الـ ٤ خطوات مكتملة",
          weight: 60,
          criteria: [
            "Goal محدد بمين ولِيه، مش «صفحة شركة».",
            "Sections عناوينها حقيقية مش placeholders.",
          ],
        },
        {
          label: "Promise واضح",
          weight: 40,
          criteria: [
            "الـ Promise في جملة واحدة قابلة للقياس.",
            "الـ CTA النهائي مربوط بالـ Goal.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "/image-gallery اتبنى بنفس الـ flow ده",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "/image-gallery اتبنى بنفس الـ flow ده",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. صفحة /image-gallery اتولّدت من فكرة في جملة: «صفحة بتعرض كل الصور المولّدة منظّمة بالـ path». اتقسّمت لـ Route + Components + Data fetching — نفس الخطوات اللي اتعلّمتها.",
      bullets: [
        "Route: image-gallery.$path.tsx — مع dynamic param.",
        "Component: GalleryGrid يعرض الـ thumbnails.",
        "Data: serverFn بترجع اللي اتولّد بـ filter حسب المسار.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /image-gallery", href: "/image-gallery" },
    },
  }
];
