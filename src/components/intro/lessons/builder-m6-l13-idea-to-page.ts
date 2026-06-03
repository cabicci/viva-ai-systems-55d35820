import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen,
  FlaskConical,
} from "lucide-react";
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
    eyebrow: "بعد الدرس ده هتقدر",
    title: "تحوّل فكرتك لصفحة أول خطوة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتعرف إزاي تبدأ من فكرة في دماغك وتوصل لخطة واضحة قبل أي كود.",
      ],
    },
  },
  {
    icon: Sparkles,
    eyebrow: "البداية",
    title: "عندك فكرة AI جامدة... بس تبدأ منين؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "عندك فكرة تطبيق AI عظيمة، زي 'AI يكتبلك سيناريوهات أفلام' أو 'AI يساعدك تلاقي وصفات أكل'. الفكرة في دماغك شكلها مبهر، بس لما تيجي تبدأ، تلاقي نفسك قدام صفحة بيضا ومش عارف أول خطوة إيه.",
        "هل تفتح برنامج تصميم عشان تعمل شكل الشات؟ ولا تبدأ تختار الـ AI model؟ ولا تكتب prompt؟",
        "في الدرس ده، هتاخد أول وأهم خطوة: إزاي ترسم الخريطة اللي العميل هيمشي عليها عشان يكلم الـ AI بتاعك، قبل ما تكتب سطر كود واحد.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "الغلطة الصح",
    title: "الغلطة اللي بتضيّع وقتك",
    block: {
      kind: "comparison",
      left: {
        label: "الغلط: تبدأ بشكل الواجهة",
        body: "مثال: \"عايز أعمل AI يخطط للرحلات\" ← تفتح Figma وتصمم شكل الشات وأيقونة طيارة بتلف. بعد ساعتين، عندك تصميم شكله حلو، بس مش عارف: العميل هيكتب اسم البلد الأول؟ ولا هيحدد الميزانية؟ الـ AI هيسأل على إيه بالظبط؟ هتعيد كل ده تاني.",
      },
      right: {
        label: "الصح: تبدأ برحلة العميل مع الـ AI",
        body: "مثال: \"العميل عايز يخطط لرحلة\" ← يبقى الرحلة: يفتح التطبيق ← يكتب للـ AI \"عايز أسافر إيطاليا 5 أيام في الصيف\" ← الـ AI يسأله عن اهتماماته وميزانيته ← العميل يرد ← الـ AI يعرض عليه خطة رحلة متكاملة. الخريطة دي هي الأساس اللي هتبني عليه كل شاشة في التطبيق.",
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
        {
          term: "User Flow",
          meaning:
            "الخريطة أو الخطوات اللي العميل بيمشيها عشان يوصل لهدفه من الـ AI بتاعك.",
          example:
            "زي ما بتمشي في سوبرماركت: تدخل، تجيب عربية، تاخد الحاجة، تروح للكاشير، تدفع، تخرج. دي رحلة ليها بداية ونهاية واضحة.",
        },
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "إزاي ده بيترجم لواجهة حقيقية؟",
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
    title: "حوّل فكرة الـ AI بتاعتك لخريطة",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "دلوقتي دورك تطبق. مش محتاج أي برامج، مجرد ورقة وقلم أو حتى اكتبهم في أي حتة.",
      prompt:
        "اختار أي فكرة تطبيق AI (مثلاً: AI يصمم لوجوهات، AI يلخص كتب، AI يكتب بوستات للسوشيال ميديا).\n\n**المطلوب:** اكتب رحلة المستخدم (User Flow) في ٣ خطوات بسيطة وواضحة.\n\n**مثال لـ AI بيكتب بوستات:**\n1. المستخدم يفتح ويكتب موضوع البوست (مثلاً: 'إعلان عن كورس جديد').\n2. يختار الـ tone (مثلاً: 'حماسي' أو 'رسمي').\n3. الـ AI يعرض عليه 3 اقتراحات للبوست.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخت!",
      rubric: [
        {
          label: "الـ User Flow واضح",
          weight: 70,
          criteria: [
            "فيه ٣ خطوات منطقية ورا بعض.",
            "الخطوات بتبدأ بفعل المستخدم (يفتح، يختار، يكتب).",
          ],
        },
        {
          label: "الهدف النهائي واضح",
          weight: 30,
          criteria: ["آخر خطوة بتحقق الهدف الأساسي من فكرة الـ AI."],
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
      caption:
        "شوف بعينك إزاي بنحوّل فكرة تطبيق AI لخريطة واضحة (User Flow)، وإزاي كل خطوة في الخريطة دي بتتحول لشاشة في واجهة التطبيق اللي العميل بيكلم منها الـ AI.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة باختصار",
    title: "الشاشة = خطوة في حوار العميل مع الـ AI",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أي تطبيق AI هو في الآخر مجموعة شاشات العميل بيتفاعل معاها.",
        "قبل ما تفكر في شكل الشاشة، فكر في رحلة العميل (User Flow). اسأل نفسك: \"العميل داخل عشان ياخد إيه من الـ AI؟ وإيه الخطوات اللي هيمشي عليها عشان يوصل لده؟\"",
        "كل خطوة في الرحلة دي بتترجم لشاشة. وبكده، بدل ما تبدأ من الصفر، بقى عندك خريطة واضحة لواجهة التطبيق كله.",
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
          question:
            "لو بتعمل تطبيق AI بيعمل للناس خطط تمارين رياضية، إيه أهم وأول خطوة؟",
          options: [
            "أرسم رحلة المستخدم (User Flow): من أول ما يحدد هدفه (يخس/يزيد) لحد ما ياخد الخطة.",
            "أختار أحسن AI model قادر يفهم في التمارين الرياضية.",
            "أصمم شكل شاشة 'النتيجة النهائية' عشان أحمّس نفسي.",
          ],
          correctIndex: 0,
          explanation:
            "الصح دايمًا تبدأ برحلة المستخدم. لما تعرف الخطوات اللي هيمشي عليها، هتعرف إيه الشاشات اللي محتاج تبنيها، وإيه الأسئلة اللي الـ AI محتاج يسألها، وبكده التطبيق كله يبقى منطقي.",
        },
        {
          id: "apply2",
          bloom: "apply",
          question:
            "في تطبيق شات مع AI، زي ChatGPT، الشاشة الرئيسية هدفها الأساسي إيه؟",
          options: [
            "تعرض إعلانات عن خدمات تانية للشركة.",
            "تسهّل على المستخدم إنه يبدأ حوار جديد أو يكمل حوار قديم مع الـ AI.",
            "تعرض مقالات عن آخر تطورات الذكاء الاصطناعي في العالم.",
          ],
          correctIndex: 1,
          explanation:
            "كل شاشة لازم يكون ليها هدف واحد عشان متلخبطش المستخدم. شاشة الشات هدفها الأساسي هو الحوار بين المستخدم والـ AI، أي حاجة تانية هتشتته.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question:
            "بتعمل صفحة 'محفوظاتي' اللي بتعرض حوارات المستخدم القديمة مع الـ AI. إيه أهم معلومة لازم تطلبها من مخ التطبيق (Backend)؟",
          options: [
            "قايمة بكل الحوارات اللي حصلت على التطبيق من كل المستخدمين.",
            "قايمة بحوارات المستخدم ده *هو بس*، عشان يشوف تاريخه مع الـ AI.",
            "قدرات الـ AI model الحالية، وهل هو سريع ولا بطئ.",
          ],
          correctIndex: 1,
          explanation:
            "الصفحة دي معمولة عشان تخدم المستخدم ده تحديدًا، فمينفعش يشوف حوارات ناس تانية. لازم تطلب من مخ التطبيق (Backend) بياناته هو بس. دي قاعدة أساسية عشان تحافظ على خصوصية كل مستخدم.",
        },
      ],
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
        "الجزء ده من المنصة اللي انت عليها اتبنى بنفس الطريقة. صفحة /image-gallery بدأت بفكرة بسيطة: «مكان ألم فيه كل الصور اللي عملتها بالـ AI». الفكرة دي اترجمت لـ User Flow بسيط، وبعدين لواجهة حقيقية بنفس الخطوات اللي اتعلمتها.",
      bullets: [
        "الفكرة: مكان واحد لكل الصور اللي عملها الـ AI بتاعي.",
        "الرحلة (User Flow): يفتح الصفحة ← يلاقي صوره مترتبة ← يضغط على صورة يكبرها.",
        "التنفيذ: شاشة في الواجهة (Component) بتطلب من مخ التطبيق (Backend) صور المستخدم ده بس. بالظبط زي ما هتتعلم.",
      ],
      pathAngle: "builder",
      link: {
        label: "افتح /image-gallery وشوف بنفسك",
        href: "/image-gallery",
      },
    },
  },
];