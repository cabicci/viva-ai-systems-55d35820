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
import firstPromptImg from "@/assets/lessons/unique/builder-m6-first-prompt.jpg";

export const BUILDER_M6_FIRST_PROMPT_TO_LOVABLE_BLOCKS: IntroLessonContent = [
  {
    icon: Lightbulb,
    eyebrow: "المشكلة",
    title: "ليه الـ AI بيطلع حاجة مش اللي في بالي؟",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أكيد جربت تطلب من AI حاجة وطلعلك نتيجة أي كلام. كتبتله 'اعملي موقع لكافيه'، فجابلك تصميم ألوانه فاقعة، أقسام مش هي اللي عايزها، وصور من بتاعت الإعلانات.",
        "المشكلة مش في الـ AI. المشكلة إننا بنتعامل معاه كأنه بيقرأ أفكارنا. الـ AI بينفذ اللي بتكتبه بالحرف، مش اللي بتتمناه.",
      ],
    },
  },
  {
    icon: Sparkles,
    eyebrow: "جرّب دلوقتي",
    title: "شوف الفرق لما تحدد طلبك",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: firstPromptImg,
      alt: "مثال لواجهة Lovable — prompt على الشمال، preview على اليمين",
      caption:
        "بص الـ prompt ده مش مجرد 'اعملي موقع'. مكتوب فيه نوع الصفحة (landing page)، والنشاط (coffee shop)، والأقسام المطلوبة بالاسم (hero, menu, contact). النتيجة؟ قريبة جدًا من اللي في دماغنا من أول مرة. ده شكل أول prompt صح.",
      label: "Lovable — مثال أول prompt",
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption: "مثال حي — prompt قصير vs prompt مفصّل، والفرق في الناتج.",
    },
  },
  {
    icon: Scale,
    eyebrow: "السر",
    title: "الفرق بين prompt ضايع وprompt صح",
    block: {
      kind: "comparison",
      left: {
        label: "ضايع 👎: «اعمل موقع لكافيه»",
        body: "٣ كلمات. بتسيب الـ AI يخمّن كل حاجة: الألوان، الأقسام، الصور. هتفضل تعدّل عليه ٦ مرات عشان توصل للي عايزه، وكل تعديل بيضيع وقت وتركيز.",
      },
      right: {
        label: "صح 👍: وصفة من ٥ أجزاء",
        body: "«(١) الهدف: Landing page لكافيه في القاهرة. (٢) النطاق: صفحة واحدة بس. (٣) الأقسام: Hero بصورة وزرار حجز، Menu بـ ٦ أطباق، Contact بـ form وخريطة. (٤) الستايل: دافي، ألوان بنّي وبيج. (٥) الممنوعات: متعملش login.» ده prompt يطلع نتيجة تتنشر.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "مصطلح الدرس",
    title: "مواصفات الطلب (Prompt Spec)",
    block: {
      kind: "concepts",
      items: [
        {
          term: "مواصفات الطلب (Spec)",
          meaning:
            "الروشتة التفصيلية اللي بتوصف فيها للـ AI إنت عايز إيه بالظبط، وإيه لأ.",
          example:
            "زي ما بتروح لترزي وتديله مواصفات البدلة: المقاس، لون القماش، عدد الزراير. الـ Spec هو مواصفات البرنامج بتاعك.",
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "اختبر نفسك",
    title: "هتعرف تكتب prompt صح؟",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m6-l15-first-prompt-to-lovable-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "إنت بتبني صفحة لشركة عقارات بـ Lovable، وعايزه يعمل الصفحة الرئيسية بس. إيه أحسن طريقة تحدد بيها الـ Scope (النطاق)؟",
          options: [
            "النطاق: صفحة واحدة بس، هي الـ Home Page.",
            "اعملي صفحة رئيسية لشركة عقارات وخلاص.",
            "دي صفحة شركة عقارات، ظبطها.",
          ],
          correctIndex: 0,
          explanation:
            "عشان تمنع الـ AI يخمن، لازم تحدد النطاق بوضوح: 'صفحة واحدة بس، وهي كذا'.",
        },
        {
          id: "apply2",
          bloom: "apply",
          question:
            "الديزاينر بعتلك رسمة (wireframe) لصفحة. إزاي توصف أول قسم للـ AI، اللي هو فيه صورة كبيرة شمال، وعنوان وزرار يمين؟",
          options: [
            "القسم الأول: hero، فيه صورة شمال وعنوان وزرار يمين.",
            "القسم الأول: Hero section فيه صورة على الشمال، وجنبه عنوان رئيسي وزرار تسجيل دخول.",
            "القسم الأول: صورة وعنوان وزرار.",
          ],
          correctIndex: 1,
          explanation:
            "كل ما كنت وصفي أكتر في تفاصيل القسم، كل ما الـ AI فهم قصدك بالظبط ومطلعش حاجة غريبة.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question:
            "بتبني صفحة لشركة أكل صحي، ومش عايز أي حاجة ليها علاقة بالدفع أو الطلبات تظهر دلوقتي. إيه أحسن حاجة تكتبها في جزء 'الممنوعات'؟",
          options: [
            "مش عايزين دفع أو طلبات دلوقتي.",
            "الممنوعات: تجنب أي forms للدفع أو الطلبات في النسخة دي.",
            "ابعد عن صفحات الدفع والطلبات.",
          ],
          correctIndex: 1,
          explanation:
            "استخدام كلمات واضحة ومحددة في 'الممنوعات' بيخلي الـ AI يعرف حدوده فين بالظبط.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اكتب prompt يبني قسم واحد صح",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "أول prompt بتكتبه بيحدد 70% من نجاح مشروعك. دلوقتي هتطبق اللي اتعلمته وتكتب prompt بسيط وواضح.",
      prompt:
        "لمشروع 'عيادة بيطرية أونلاين'، اكتب prompt من 3 أجزاء بس:\n\n1. الهدف: [اكتب الهدف في جملة واحدة]\n2. الأقسام: [اوصف قسم الـ Hero بس: إيه على اليمين وإيه على الشمال؟]\n3. الستايل: [اختار لونين أساسيين ونبرة بصرية، زي 'مودرن ومريح']",
      buttonLabel: "انسخ المطلوب",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "وضوح الـ Prompt",
          weight: 60,
          criteria: [
            "الـ 3 أجزاء مكتوبين ومش فاضيين.",
            "وصف قسم الـ Hero فيه تفاصيل كافية (يمين وشمال).",
          ],
        },
        {
          label: "الستايل والتحديد",
          weight: 40,
          criteria: [
            "الستايل فيه لونين على الأقل ونبرة واضحة.",
            "الهدف محدد ومش عام (مش مجرد 'موقع كويس').",
          ],
        },
      ],
    },
  },
  {
    icon: Sparkles,
    eyebrow: "من كواليس lovable",
    title: "ده الـ prompt اللي بدأنا بيه المنصة دي",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "ده الـ prompt اللي بدأنا بيه المنصة دي",
      summary:
        "الجزء اللي إنت فيه ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. أول prompt كتبناه كان بسيط جدًا: «اعمل landing page لمنصة تعليم AI بالعربي، فيها hero section و5 مسارات تعليمية». النتيجة الأولية ظهرت في 30 ثانية، وكملنا عليها من ساعتها.",
      bullets: [
        "بدأنا بنطاق صغير جدًا: صفحة رئيسية وبس.",
        "كل جزء جديد في المنصة بيبدأ بـ prompt منفصل.",
        "تقدر ترجع لكل النسخ الأولى في الـ git history بتاع المشروع لو حابب.",
      ],
      pathAngle: "builder",
      link: { label: "افتح الصفحة الرئيسية", href: "/" },
    },
  },
];