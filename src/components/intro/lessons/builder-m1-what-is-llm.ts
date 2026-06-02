import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import llmScreenshot from "@/assets/lessons/builder-m1-what-is-llm.jpg";

export const BUILDER_M1_WHAT_IS_LLM_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "في ٣٠ ثانية",
    title: "الـ AI = موظف بيخمّن الكلمة اللي جاية",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "ChatGPT وClaude وGemini كلهم بيعملوا حاجة واحدة: بيخمّنوا الكلمة اللي بعد كلامك.",
        "زي موظف قرا ملايين الكتب، فبيقدر يكمّل أي جملة بشكل منطقي.",
        "مش لازم تحفظ مصطلحات. كل اللي محتاجه دلوقتي: تعرف إنه بيخمّن، مش بيعرف.",
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "ربح سريع",
    title: "جرّب بنفسك دلوقتي — ٦٠ ثانية",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "افتح ChatGPT أو Gemini أو مساعد المنصة، والصق الـ prompt ده بالظبط. هتشوف بنفسك إزاي بيخمّن.",
      prompt:
        "كمّل الجملة دي بثلاث نهايات مختلفة، وقولّي ليه كل واحدة منطقية:\n\n«النهارده الصبح صحيت ولقيت...»",
      buttonLabel: "انسخ الـ prompt",
      copiedLabel: "اتنسخ ✓",
      rubric: [
        {
          label: "جرّبت فعلاً",
          weight: 100,
          criteria: [
            "نسخت الـ prompt وبعتّه لأي AI.",
            "شفت إنه طلّع نهايات مختلفة — ده معناه إنه بيخمّن، مش بيقرا إجابة محفوظة.",
          ],
        },
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "٣ حاجات بس",
    title: "اللي محتاج تعرفه دلوقتي",
    block: {
      kind: "concepts",
      items: [
        { term: "بيخمّن، مش بيعرف", meaning: "بيتوقّع الكلمة اللي بعد كلامك بناءً على اللي اتدرّب عليه. مش بيفتح Google.", example: "تقوله «اكتبلي إيميل»، يكمّل كلمة كلمة لحد ما الإيميل يخلص." },
        { term: "ChatGPT / Claude / Gemini", meaning: "أشهر ٣ تطبيقات. زي تويوتا/هيونداي/كيا — كلهم بيوصّلوك.", example: "ChatGPT الأشهر، Claude بيكتب أحسن، Gemini مدمج مع Google." },
        { term: "ممكن يغلط بثقة", meaning: "ساعات بيخترع معلومة وهو واثق. علشان كده لازم تتأكد من أي رقم أو تاريخ.", example: "تسأله «إمتى اتأسست الشركة الفلانية؟»، يقولك تاريخ غلط من غير ما يحس." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج لو حابب تتعمّق",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption: "تعريف مبسّط للـ LLM وإزاي بيشتغل من جوّه.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "مساعد المنصة بتاعتك",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: llmScreenshot,
      alt: "صفحة مساعد المنصة — input لكتابة سؤال وعرض سياق المتعلم",
      caption:
        "المساعد ده مش مبرمج بإجابات جاهزة. وراه LLM بياخد سؤالك مع سياقك (المسار، الموديول، الدرس) ويتوقّع الرد المناسب. علشان كده بيقدر يرد على أي سؤال — حتى اللي محدش كتب إجابته قبل كده.",
      label: "من الموقع — صفحة /ai-assistant",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "إزاي تفكّر فيه صح",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — بتعامله كموسوعة",
        body: "بتفترض إنه عنده حقائق مضمونة ومحدّثة. الحقيقة: اتدرّب لحد تاريخ معين، وممكن يخترع معلومة وهو واثق منها.",
      },
      right: {
        label: "RIGHT — بتعامله كآلة توقّع لغوي",
        body: "بتعرف إنه شاطر في الصياغة والترجمة والتلخيص والكود، وبتديله سياق ومراجع علشان يطلّع رد دقيق. التحقّق من المعلومة دور المستخدم، مش دور الموديل.",
      },
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "اختبار سريع",
    title: "سؤال واحد بس",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m1-what-is-llm-apply",
      items: [
        {
          id: "apply1",
          bloom: "understand",
          question: "سألت ChatGPT عن خبر حصل امبارح، فجاوبك بثقة بتفاصيل غلط. إيه السبب الأقرب؟",
          options: [
            "بيخمّن من اللي اتدرّب عليه، والخبر ده مكانش موجود وقت التدريب.",
            "في عطل في الموقع.",
            "لازم تدفع اشتراك علشان يجاوب صح."
          ],
          correctIndex: 0,
          explanation: "الـ AI بيخمّن من بيانات قديمة. لو الخبر جديد، هيخترع تفاصيل بدل ما يقولك «معرفش»."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission اختياري",
    title: "اكشف حدوده بنفسك",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "ابعت سؤال واحد لأي AI يخلّيه يبيّن إنه بيخمّن. بعدين الصق سؤالك ورده هنا.",
      prompt:
        "اسأله عن حدث حصل في آخر شهرين، أو عن شخص مش مشهور. بعدين اكتب:\n\n١) السؤال:\n٢) رده (انسخ آخر فقرة):\n٣) فين بان إنه بيخمّن؟ (سطرين)",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "السؤال + الرد",
          weight: 50,
          criteria: [
            "السؤال محدّد (حدث/شخص/تاريخ).",
            "نسخت الرد كما هو، مش تلخيص.",
          ],
        },
        {
          label: "التحليل",
          weight: 50,
          criteria: [
            "حدّدت فين بان إنه بيخمّن (جملتين).",
          ],
        },
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "للفضوليين فقط",
    title: "اتفك الاسم: Large + Language + Model",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "ده قسم اختياري — تخطّاه لو مش مهتم بالتفاصيل التقنية.",
        "Large — كبير. مليارات الـ parameters (أوزان داخلية بيتعلّمها وقت التدريب). GPT-4 فيه أكتر من تريليون parameter.",
        "Language — لغة. اتدرّب على كتب ومقالات وكود ومحادثات بشرية حقيقية.",
        "Model — موديل إحصائي، مش قاعدة بيانات. بيحوّل كلامك لأرقام، وبيحسب أكتر كلمة احتمالها تيجي بعد كده.",
        "أشهرهم: GPT (OpenAI)، Claude (Anthropic)، Gemini (Google)، Llama (Meta).",
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "/ai-assistant — LLM بيرد عليك جوّه المنصة",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "/ai-assistant — LLM بيرد عليك جوّه المنصة",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. صفحة /ai-assistant عبارة عن LLM متظبّط على محتوى المنصة. لما تسأله سؤال، بيستقبل الكلام بتاعك كـ prompt ويرجّعك جواب نصّي زيّه زي اللي اتعلّمته في الدرس.",
      bullets: [
        "بنستخدم Gemini عشان نولّد الردود — نفس نوع الـ LLM اللي شرحناه.",
        "كل سؤال بيتبعت + سياق المتعلم (Context) قبل ما الـ LLM يرد.",
        "الرد بيرجع streaming token-by-token عشان تحس بيه وهو بيتولّد.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /ai-assistant", href: "/ai-assistant" },
    },
  }
];