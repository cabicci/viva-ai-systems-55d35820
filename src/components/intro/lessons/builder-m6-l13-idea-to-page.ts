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
 * V2 Editor: Lovable.
 *
 * Rules:
 * 1. **No Theory Without Tension**: Start with a felt problem.
 * 2. **Quick Win in 30s**: Second section is a "try it now".
 * 3. **Example Before Term**: Real-life example before any jargon.
 * 4. **One Term Max**: One new technical term per lesson.
 * 5. **Mission ≤ 10 mins**: Simplify missions to 1-2 clear steps.
 * 6. **Pure Egyptian Dialect**: No formal Arabic.
 * 7. **No Repetition**: Merge or delete redundant sections.
 * 8. **Momentum**: Every section feels like progress.
 */
export const BUILDER_M6_IDEA_TO_PAGE_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "البداية",
    title: "عندك فكرة جامدة... بس تبدأ منين؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "خلصت الأساسيات، وفجأة لقيت نفسك قدام صفحة بيضا. عندك فكرة تطبيق، بس مش عارف أول خطوة إيه.",
        "هل تفتح برنامج تصميم؟ ولا تكتب كود على طول؟ ولا تكلم الـ AI؟",
        "في الدرس ده، هتاخد خريطة واضحة تحوّل بيها أي فكرة في دماغك لصفحات حقيقية، قبل ما تكتب سطر كود واحد.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "الغلطة الصح",
    title: "الغلطة اللي ٩٠٪ من الناس بيقعوا فيها",
    block: {
      kind: "comparison",
      left: {
        label: "الغلط: تبدأ بالألوان والأشكال",
        body: "\"أنا عايز أعمل أبليكشن للمطاعم\" → تفتح Figma وتبدأ تصمم لوجو وشكل الصفحة الرئيسية. بعد ساعتين، عندك تصميم شكله حلو، بس مش عارف: المستخدم هيطلب دليفري ولا يحجز؟ فيه كام صفحة؟ إيه لازمة كل زرار؟ هتعيد كل ده من الأول.",
      },
      right: {
        label: "الصح: تبدأ برحلة العميل",
        body: "\"العميل جعان وعايز يطلب أكل\" → يبقى الرحلة: يفتح التطبيق ← يلاقي المطاعم اللي حواليه ← يختار مطعم ويشوف المنيو ← يضيف أطباق للسلة ← يدفع ← يتابع طلبه. الخريطة دي هي الأساس اللي هتبني عليه كل حاجة.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "مصطلح الدرس",
    title: "يعني إيه \"رحلة العميل\" دي؟",
    block: {
      kind: "concepts",
      items: [
        { term: "User Flow", meaning: "الخريطة أو الخطوات اللي العميل بيمشيها عشان يوصل لهدفه جوه تطبيقك.", example: "زي ما بتمشي في سوبرماركت: تدخل، تجيب عربية، تاخد الحاجة، تروح للكاشير، تدفع، تخرج. دي رحلة ليها بداية ونهاية واضحة." },
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "إزاي ده بيترجم لصفحة حقيقية؟",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: ideaToPageScreenshot,
      alt: "صفحة /curriculum — كرت 'خريطة المنظومة الكاملة' فيه شريط تقدّم 0/19، تحته STAGE 01 START 'البداية' وكرت Introduction",
      caption:
        "الصفحة دي مثال حي. هدفها واحد بس: تخليك تعرف كل اللي هتتعلمه وتختار هتبدأ منين. مفيش أي حاجة تانية تشتتك. الـ User Flow بتاعها بسيط: المستخدم يدخل ← يشوف الخريطة كلها ← يضغط على أول درس. بس كده.",
      label: "من منصة Lovable — صفحة /curriculum",
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "ارسم خريطة فكرتك في دقيقتين",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "دلوقتي دورك تطبق. مش محتاج أي برامج، مجرد ورقة وقلم أو حتى اكتبهم في أي حتة.",
      prompt:
        "اختار أي فكرة تطبيق (مثلاً: حجز دكتور، طلب قهوة، تأجير عجل).\n\n**المطلوب:** اكتب رحلة المستخدم (User Flow) في ٣ خطوات بسيطة وواضحة.\n\n**مثال لتطبيق حجز ملاعب:**\n1. المستخدم يفتح يلاقي الملاعب الفاضية حواليه.\n2. يختار ملعب وساعة مناسبة.\n3. يحجز ويدفع أونلاين.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخت!",
      rubric: [
        {
          label: "الـ User Flow واضح",
          weight: 70,
          criteria: [
            "فيه ٣ خطوات منطقية ورا بعض.",
            "الخطوات بتبدأ بفعل المستخدم (يفتح، يختار، يحجز).",
          ],
        },
        {
          label: "الهدف النهائي واضح",
          weight: 30,
          criteria: [
            "آخر خطوة بتحقق الهدف الأساسي من الفكرة.",
          ],
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج عشان تفهم أكتر",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption: "شوف بعينك إزاي بنحوّل فكرة لـ user flow، ونقسّم الـ flow لصفحات، قبل ما نكتب أي prompt للـ AI.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة باختصار",
    title: "الصفحة = محطة في رحلة العميل",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أي تطبيق في الدنيا هو مجموعة صفحات. كل صفحة ليها هدف واحد بس واضح.",
        "قبل ما تفكر في شكل الصفحة، فكر في الـ User Flow. اسأل نفسك: \"العميل داخل يعمل إيه؟ وإيه الخطوات اللي هياخدها عشان يخلّص؟\"",
        "كل خطوة في الـ User Flow ده ممكن تبقى صفحة. وبكده، بدل ما تبدأ من الصفر، بقى عندك خريطة واضحة للتطبيق كله.",
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "اختبر فهمك",
    title: "سؤال وجواب سريع",
    tone: "primary",
    block: {
      kind: "quiz",
      lessonId: "builder-m6-l13-idea-to-page-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو بتعمل تطبيق لعيادة دكتور، إيه أول حاجة المفروض تعملها؟",
          options: [
            "أرسم الـ User Flow بتاع المريض: من أول ما يدور على الدكتور لحد ما يحجز معاد.",
            "أصمم لوجو للعيادة وأختار الألوان اللي هستخدمها في التطبيق.",
            "أكتب الكود بتاع صفحة تسجيل الدخول عشان أخلص منها."
          ],
          correctIndex: 0,
          explanation: "الصح دايمًا تبدأ برحلة المستخدم (User Flow). لما تعرف الخطوات اللي المريض هيمشي عليها، تصميم وبناء الصفحات هيبقى أسهل وأوضح."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "في تطبيق تسوق، صفحة 'تفاصيل المنتج' هدفها الأساسي إيه؟",
          options: [
            "تعرض كل منتجات الشركة عشان العميل يتفرج براحته.",
            "تخلي العميل يشوف تفاصيل منتج واحد بس، وياخد قرار واحد: يضيفه للسلة.",
            "تعرض تفاصيل المنتج، وآراء العملاء، وسياسة الاسترجاع، وفروعنا، كلها في نفس المكان."
          ],
          correctIndex: 1,
          explanation: "كل صفحة لازم يكون ليها هدف واحد عشان متلخبطش المستخدم. صفحة المنتج هدفها الأساسي هو إقناع العميل بالمنتج ده وتسهيل إضافته للسلة."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "بتعمل صفحة 'الطلبات السابقة' للعميل. إيه أهم معلومة لازم تطلبها من الـ Backend؟",
          options: [
            "قايمة بكل المنتجات المتاحة في المخزن حاليًا.",
            "تاريخ كل الطلبات اللي العميل ده عملها قبل كده، وحالة كل طلب.",
            "إحصائيات عن أكتر المنتجات اللي بتتباع في الموقع كله."
          ],
          correctIndex: 1,
          explanation: "الصفحة دي هدفها تخدم العميل ده تحديدًا، فهي محتاجة بياناته هو بس. لازم تطلب من الـ Backend قايمة بطلباته هو عشان تعرضهاله."
        }
      ]
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "كل ده مش كلام نظري",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "صفحة /image-gallery اتبنت بنفس الطريقة دي",
      summary:
        "الجزء ده من المنصة اللي انت عليها اتبنى بمسار Builder. صفحة /image-gallery بدأت بفكرة بسيطة: «مكان نشوف فيه كل الصور اللي عملناها بالـ AI». الفكرة دي اترجمت لـ User Flow بسيط، وبعدين لصفحة حقيقية بنفس الخطوات اللي اتعلمتها.",
      bullets: [
        "الفكرة: مكان واحد لكل الصور.",
        "الـ User Flow: يفتح الصفحة ← يلاقي الصور مترتبة ← يضغط على صورة يكبرها.",
        "التنفيذ: Route + Component + Data. بالظبط زي ما هتتعلم.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /image-gallery وشوف بنفسك", href: "/image-gallery" },
    },
  }
];