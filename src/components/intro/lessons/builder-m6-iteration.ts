import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import iterationImg from "@/assets/lessons/unique/builder-m6-iteration.jpg";

export const BUILDER_M6_ITERATION_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "أول build مش هيبقى صح — وده طبيعي",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Iteration مش ضعف. ده شغل المهندس الأساسي.",
        "اللي بيفرّق Builder ناجح: مش الـ prompt الأول، الـ ٥ prompts اللي بعده.",
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
        { term: "Spec / Wireframe", meaning: "الوصف اللي فيه التفاصيل والطلبات اللي إنت عايز تنفذها بالظبط.", example: "زي ما التاجر يكتب \"خطة البيع\" بتاعته في ورقة عشان يطبقها، دي الـ Spec اللي بيمشي عليها." },
        { term: "Prompt", meaning: "الأمر أو الكلام اللي بتكتبه للذكاء الاصطناعي عشان يعملك حاجة.", example: "زي ما المحاسب بيكتب \"طلب\" للبرنامج عشان يطلع له كشف حساب، ده الـ Prompt." },
        { term: "Surgical edit", meaning: "تعديل دقيق جداً على حتة صغيرة بايظة بدل ما نهده كله.", example: "لما المسوق يطلب تعديل \"كلمة واحدة\" في إعلان بدل ما يعيد حملة التسويق كلها من أولها." },
        { term: "Iteration / Refine", meaning: "دورة من: \"جرب ← شوف الغلط ← عدل ← جرب تاني\".", example: "صاحب محل بيجرب يغير رصة البضاعة (محاولة)، ويشوف النتيجة، ويعدلها تاني الصبح." },
        { term: "Diff", meaning: "الفرق بين اللي إنت طالبه وبين اللي البرنامج نفذه فعلاً.", example: "لما تطلب زرار أخضر يطلع أحمر، الفرق ده هو اللي بتقوله للبرنامج عشان يصلحه." },
        { term: "Regression", meaning: "مشكلة جديدة ظهرت في حاجة كانت شغالة صح، بسبب تعديل عملته.", example: "تاجر صلح باب المحل، فجأة لقى النور قطع؛ حاجة باظت بسبب تصليح حاجة تانية." },
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
      caption: "مثال حي — صفحة بتتولد، وبعدها ٤ دورات Iteration لحد ما توصل للهدف.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Loop من ٤ خطوات — كرّره لحد ما تخلص",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Step 1 — Prompt: اكتب طلبك (سواء أول مرة أو تعديل).",
        "Step 2 — Result: شوف الناتج كاملاً. متعدّلش وانت بتقرا — استنى لحد ما الـ build يخلص.",
        "Step 3 — Review: قارن مع الـ Wireframe/الـ Spec. اكتب على ورقة ٣ حاجات بس: «شغّال»، «ناقص»، «غلط». التفاصيل الصغيرة دلوقتي مش مهمة.",
        "Step 4 — Refine: اطلب تعديل واحد محدّد. مش «كل حاجة وحشة»، لأ — «الـ Hero Section لازم يبقى أطول بـ ٢٠٪ والـ CTA يبقى أحمر بدل أزرق».",
        "قاعدة Iteration ذهبية: تعديل واحد في كل prompt. لما تطلب ٥ تعديلات مع بعض، الـ AI بيعمل ٣ منهم صح وبيكسر اتنين تانيين. التعديلات المتفرّقة أسرع وأأمن.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "Iteration Loop — ٤ خطوات بتتكرر",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: iterationImg,
      alt: "Diagram دائري بـ ٤ خطوات: Prompt → Result → Review → Refine",
      caption:
        "الـ Loop ده هو شغلك الحقيقي كـ Builder. كل دورة بتقرّبك من الـ Spec. متستعجلش — متوسط أي صفحة محترفة بياخد ٤-٧ دورات قبل ما تخلص.",
      label: "Iteration Loop",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "إزاي تطلب تعديل",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — «حاجة وحشة، عدّل»",
        body: "الـ AI ميعرفش إيه الوحش. هيغيّر حاجات عشوائية. ممكن يكسر حاجة كانت شغّالة (Regression). بعد ساعة لقيت الصفحة أسوأ من الأول.",
      },
      right: {
        label: "RIGHT — Surgical Edit",
        body: "«في الـ Hero section، الـ headline حالياً ٢ سطور — خليه سطر واحد. الزرار حالياً أزرق — خليه برتقالي #FF6B35. مفيش تغيير في أي حاجة تانية.» تعديل محدّد = نتيجة مضمونة.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اعمل ٣ دورات Iteration على الـ Build",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m6-iteration-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "الـ AI عملك صفحة تسجيل دخول، وزرار الدخول لونه أزرق فاتح والزرار بتاع 'نسيت الباسورد' لونه أزرق غامق. أنت عايز تغير لون زرار الدخول يبقى أزرق غامق زي التاني عشان فيه تناسق أكتر. تعمل إيه؟",
          options: [
            "أطلب من الـ AI إن 'لون زرار الدخول يبقى أزرق غامق #000080 وكمان الخط يبقى أكبر ١٦ بيكسل'",
            "أطلب 'لون زرار الدخول يبقى أزرق غامق #000080'",
            "أمسح الصفحة وأخلي الـ AI يبنيها من أول وجديد عشان الألوان مش عاجباني"
          ],
          correctIndex: 1,
          explanation: "أطلب تعديل واحد بس ومحدد عشان الـ AI ما يتلخبطش ويطلع نتايج أحسن، زي قاعدة الـ Iteration الذهبية."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "بنيت صفحة منتج، بس لاحظت بعد ما الـ AI خلصها، إن صور المنتجات مش ظاهرة. ايه أنسب خطوة تعملها بعد كده عشان تحل المشكلة دي؟",
          options: [
            "أقول للـ AI 'الصور مش ظاهرة! الصفحة كلها غلط عيش حياتك وصلحها زي ما تحب'",
            "أعمل ريفرش للصفحة كذا مرة يمكن تظهر لوحدها",
            "أحدد المشكلة واطلب من الـ AI 'إن صور المنتجات لازم تظهر بحجم متوسط وصيغة ويب بي (WebP) وتكون سورس اللينك بتاعها كده [لينك]'"
          ],
          correctIndex: 2,
          explanation: "بعد مراجعة الناتج، بحدد المشكلة وبطلب تعديل واحد بس ومحدد زي الـ Surgical edit، بدل ما أعمم إن كل حاجة غلط."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "بعد ما عملت تعديل على الـ Navbar في صفحتك، اكتشفت إن الفوتَر اللي كان شغال تمام، بقى مكسور ومحتواه خارج عن الفريم بتاعه. إيه المصطلح اللي بيوصف المشكلة دي؟",
          options: [
            "Surgical Edit",
            "Regression",
            "Iteration"
          ],
          correctIndex: 1,
          explanation: "الـ Regression هو لما حاجة كانت شغالة صح، تقف عن الشغل أو تتكسر بعد أي تعديل تاني، وده اللي حصل في الفوتَر."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم Loop تكرار من ٣ نسخ لشاشة واحدة",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Iteration مش «خلّيها أحسن». هتختار شاشة + تكتب ٣ versions بـ Prompts مختلفة وتقارن.",
      prompt:
        "في تسليمك:\n\n١) الشاشة المختارة:\n٢) Version 1 — Prompt (انسخه) + screenshot أو وصف للنتيجة:\n٣) Version 2 — Prompt المعدّل (إيه اتغير ولِيه) + النتيجة:\n٤) Version 3 — Prompt النهائي + النتيجة:\n٥) في سطرين: إيه القاعدة اللي طلعت بيها للـ Iteration بتاعك؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "٣ versions حقيقية",
          weight: 60,
          criteria: [
            "كل version فيه Prompt مختلف فعلاً.",
            "فيه دليل (screenshot/وصف) لكل نتيجة.",
          ],
        },
        {
          label: "قاعدة عملية",
          weight: 40,
          criteria: [
            "استخرجت قاعدة قابلة للتطبيق على iterations جاية.",
            "ربطت التغيرات بتأثير محدد، مش «بقى أحسن».",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "/dashboard عدّى بـ ٧ نسخ قبل ما يستقر",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "/dashboard عدّى بـ ٧ نسخ قبل ما يستقر",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. أول version من الـ dashboard كان فيه ١٢ widget. شيلنا ٨ منهم تدريجيًا لأنهم مش بيتفتحوا. iteration = حذف، مش بس إضافة.",
      bullets: [
        "V1: 12 widget. V7 (الحالي): 4 widgets أساسية.",
        "WelcomeChecklist و StreakCard اتعملوا في V4 لما لاحظنا الناس بتسيب.",
        "كل تغيير اتسجّل في roadmap_items — تقدر تشوفه في /roadmap.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /roadmap", href: "/roadmap" },
    },
  }
];