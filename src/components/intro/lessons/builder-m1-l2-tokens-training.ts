import {
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen,
  FlaskConical,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import tokensScreenshot from "@/assets/lessons/builder-m1-tokens.jpg";

/**
 * Builder · M1 · Lesson 02 — Tokens والتدريب  (v4 reframing)
 * الترتيب الجديد: المشكلة الواقعية → التكلفة البسيطة → فكرة القطمة → مقارنة عملية → المصطلح التقني آخر حاجة → اختبار + مهمة
 * القاعدة: الفايدة قبل المصطلح.
 */
export const BUILDER_M1_TOKENS_TRAINING_BLOCKS: IntroLessonContent = [
  {
    icon: Lightbulb,
    eyebrow: "السؤال المهم",
    title: "ليه ساعات الـ AI يرد كويس وساعات لأ؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "في يوم بتطلب من الـ AI حاجة، يرد عليك بسرعة ورده ممتاز. وفي يوم تاني تطلب نفس النوع من الحاجة، تلاقيه بطيء، ولو شغّال على API الفاتورة جت أعلى من المتوقع.",
        "السبب مش في الـ AI نفسه. السبب في حاجة واحدة بسيطة جدًا بتتحكم في السرعة والتكلفة والدقة. لو فهمتها، هتعرف توفّر وقت وفلوس على طول.",
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "بمثال حقيقي",
    title: "إزاي رسالة طويلة بتكلّفك أكتر",
    tone: "accent",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تخيّل إنك بتكلم AI assistant عن مشكلة في شغلك. كل رسالة بتبعتها بيتحاسب عليها — وكل رد بيرجعلك بيتحاسب عليه كمان. زي عداد الموبايل بالظبط.",
        "كل ما الكلام أطول، العدّاد بيلف أسرع، والـ AI بياخد وقت أطول عشان يقرا ويرد. ده اللي بيخلّي محادثة طويلة تكلّف 10 أضعاف محادثة قصيرة على نفس السؤال.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "الفكرة في سطر",
    title: "الـ AI مش بيقرا كلمات — بيقرا 'قطم'",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أي كلمة بتبعتها للـ AI بتتقسم لـ 'قطم' صغيرة قبل ما يفهمها. ممكن الكلمة الواحدة تتقسم لقطمة واحدة، وممكن لـ 3 قطم، حسب اللغة وطول الكلمة.",
        "العربي عمومًا بيتقسم لقطم أكتر من الإنجليزي. يعني نفس الجملة بالعربي ممكن تكلّفك ضعف اللي بتكلّفه بالإنجليزي — ودي معلومة بتفرق في الفاتورة فعلاً.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "الفرق العملي",
    title: "إزاي تكتب طلب يوفر عليك",
    block: {
      kind: "comparison",
      left: {
        label: "غلط: حشو وكلام كتير",
        body:
          "'يا صديقي الذكاء الاصطناعي، من فضلك لو سمحت ممكن تساعدني في حاجة بسيطة...' — كل المقدمة دي قطم على الفاضي. بتزوّد التكلفة، بتأخر الرد، وبتشتت الـ AI عن سؤالك الحقيقي.",
      },
      right: {
        label: "صح: مباشر وواضح",
        body:
          "'لخّص المقال ده في 3 نقط' — جملة قصيرة، طلب محدد، نتيجة أسرع. قطم أقل = رد أسرع + تكلفة أقل + تركيز أعلى من الـ AI على المهم.",
      },
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "مثال حي من المنصة",
    title: "الـ Hero بتاع موقعنا",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: tokensScreenshot,
      alt: "الصفحة الرئيسية للمنصة",
      caption:
        "العنوان ده اتبنى بطلب قصير ومباشر. لو كان متكتب بحشو، كان هياخد قطم أكتر بـ 40%، ويدّي نفس النتيجة بالظبط.",
      label: "من الموقع — صفحة /",
    },
  },
  {
    icon: BookOpen,
    eyebrow: "الاسم التقني (آخر حاجة)",
    title: "الـ 'قطمة' دي اسمها Token",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Token",
          meaning:
            "هي الـ 'قطمة' اللي الـ AI بيقسم بيها كلامك. كل حرف، كلمة، أو حتى علامة ترقيم ممكن تبقى token. التكلفة والسرعة بتتحسب بعدد الـ tokens — مش بعدد الكلمات.",
          example:
            "جملة 'صباح الخير' = حوالي 3-4 tokens بالعربي، بس 'Good morning' = 2 tokens بالإنجليزي.",
        },
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
      lessonId: "builder-m1-l2-tokens-training-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو الـ AI بطيء قوي في الرد على prompt طويل، ده ليه؟",
          options: [
            "البيانات اللي اتدرّب عليها كانت قليلة.",
            "الـ prompt فيه tokens كتير قوي محتاج يعالجها.",
            "الـ AI محتاج يتحدّث.",
          ],
          correctIndex: 1,
          explanation:
            "كل ما tokens الـ prompt أكتر، الـ AI بياخد وقت أطول. ده السبب الرئيسي للبطء.",
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "ليه نفس الجملة بالعربي بتكلّف أكتر من الإنجليزي؟",
          options: [
            "لأن العربي صعب على الـ AI.",
            "لأن الكلمة الواحدة بالعربي بتتقسم لـ tokens أكتر.",
            "لأن السيرفر بعيد عن مصر.",
          ],
          correctIndex: 1,
          explanation:
            "الـ tokenizer بيقسم الكلمات العربية لقطم أكتر، فالـ tokens بتزيد وبالتالي التكلفة بتزيد.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "إيه أحسن نصيحة لتوفير التكلفة في طلباتك للـ AI؟",
          options: [
            "زوّد تفاصيل ومقدمات كتير عشان يفهمك.",
            "اختصر وركّز على الكلمات الأساسية بس.",
            "استخدم لغة معقدة عشان يبان ذكي.",
          ],
          correctIndex: 1,
          explanation: "كل ما الـ tokens قلّت، التكلفة قلّت والسرعة زادت.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "جرّب تقلل الـ Tokens بنفسك",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "هتكتب نفس الطلب بطريقتين — مرة طويلة ومرة مختصرة — وتقارن عدد الـ tokens عشان تحس بالفرق عمليًا.",
      prompt:
        "افتح [OpenAI Tokenizer](https://platform.openai.com/tokenizer) واتبع الخطوات:\n\n١) اكتب prompt طويل فيه حشو ومقدمات.\n٢) اكتب نفس الطلب بشكل مختصر ومباشر.\n٣) سجّل عدد الـ tokens لكل واحدة.\n٤) قارن الفرق وكتبه في تسليمك.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "صياغتين مختلفتين",
          weight: 50,
          criteria: [
            "الصياغتين بيطلبوا نفس الحاجة، واحدة فيها حشو والتانية مباشرة.",
          ],
        },
        {
          label: "حساب دقيق للـ Tokens",
          weight: 50,
          criteria: ["حسبت الـ tokens صح لكل صياغة وكتبت الفرق بينهم."],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "عدّاد الـ Tokens في Lovable",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "عدّاد الـ Tokens في Lovable",
      summary:
        "في صفحة المساعد الشخصي، بنوريك دايمًا عدد الـ tokens لسؤالك ورد الـ AI. كل طلب بيتحسب بالـ tokens الداخلة والخارجة. ده قانون اللعبة لكل AI app هتبنيه.",
      bullets: [
        "كل رسالة بنحسب tokens الداخل والخارج.",
        "لو المحادثة طوّلت أوي، بنمسح أقدم رسايل عشان نوفّر.",
        "التكلفة والسرعة بتتحسب بالـ token — مش بالكلمة.",
      ],
      pathAngle: "builder",
      link: { label: "افتح المساعد الشخصي", href: "/assistant-runtime" },
    },
  },
];
