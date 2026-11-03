import {
  Sparkles,
  AlertCircle,
  PlayCircle,
  Lightbulb,
  Scale,
  Rocket,
  BookOpen,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

/** Business · M4 · Lesson 02 — Reactive Relapse (v3: Lesson Shape pilot) */
export const BUSINESS_M4_L2_REACTIVE_RELAPSE_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ حتى بعد بناء نظام، الضغط يرجّعك Reactive — والـ AI يساعدك تراقب الإشارات وتلخّص التحذيرات.",
        "ليه دلوقتي؟ بنيت إيقاع وSOP وفكّرت في التوسّع. الرجوع للإطفاء أخطر لما تحس إنك «خلّصت».",
        "هتعمل إيه بعد الدرس؟ هتحدد أهم ٢ محفّز relapse وقاعدة حماية لكل واحد.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "رجعت تفتح الواتساب أول الصبح — تاني",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أسبوعين نظام حلو — بعدين حملة ناجحة، شكوى كبيرة، أو ضغط كاش — وفجأة إنت تاني في ردود ومطافئ.",
        "Relapse مش فشل أخلاقي — ده إشارة إن محفّز ضغط كسر الحماية.",
        "محفّزات شائعة: نمو مفاجئ، فجوة فريق، شكاوى متكررة، ضغط كاش. الـ AI يلخّص الأسبوع ويقولك «إيه اللي زاد عن المعتاد».",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "راقب المحفّز — مش بس «كون منضبط»",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Relapse يبدأ صغير: تفتح رسالة «بس دي» قبل بلوك الاستراتيجية — وبعدين اليوم كله Reactive.",
        "قاعدة الحماية بسيطة وقابلة للتنفيذ: «مفيش واتساب قبل ٩:٣٠» أو «أي شكوى كبيرة → مسودة AI + رد بعد ساعة».",
        "الـ AI يساعدك أسبوعيًا: لخّص شكاوى العملاء، عدّد الرسائل، حدّد موضوع متكرر — إشارة مبكرة قبل ما تغرق.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمة واحدة",
    title: "مصطلح واحد بس",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Reactive Relapse (رجوع للإطفاء)",
          meaning: "ترجع تدير اليوم بالردود والأزمات بعد فترة نظام — بسبب محفّز ضغط.",
          example: "بعد إطلاق منتج: ٣ أيام ردود فقط — بلوك الاستراتيجية اختفى.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — إزاي تكتشف الرجوع بدري",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "محفّزات الـ relapse وقواعد الحماية. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "أمل «هعدّي الأزمة» vs قاعدة حماية",
    block: {
      kind: "comparison",
      left: {
        label: "بدون قواعد",
        body: "«الأسبوع ده استثناء» — وبعدين شهر كامل Reactive.",
      },
      right: {
        label: "مع قواعد + AI",
        body: "محفّز معروف + قاعدة + ملخص أسبوعي من الـ AI — ترجع للنظام أسرع.",
      },
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "دورة الرجوع للإطفاء",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "reactive-relapse-cycle",
      label: "Relapse Cycle",
      caption:
        "المحفّز → إطفاء → تعب → تأجيل النظام. قاطع الدورة بقاعدة واحدة واضحة.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "business-m4-l2-reactive-relapse-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "بعد شهر نظام، مبيعات قفزت والواتساب انفجر. أحسن رد أول؟",
          options: [
            "تسيب النظام خالص — المبيعات أهم.",
            "تعرف المحفّز، تستخدم AI للتلخيص، وتطبّق قاعدة حماية واحدة.",
            "توظّف فورًا من غير SOP.",
          ],
          correctIndex: 1,
          explanation:
            "النمو محفّز شائع للـ relapse. التلخيص بالـ AI + قاعدة يحافظوا على جزء من النظام.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "٢ محفّز + قاعدة حماية",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "فكّر في آخر مرة حسّيت إنك رجعت Reactive (أو قريب منها). حدّد أهم ٢ محفّز عندك — واكتب قاعدة حماية بسيطة لكل واحد.\n\nمش وعد أبدي — قواعد تقدر تنفّذها الأسبوع الجاي.",
      prompt:
        "في تسليمك اكتب:\n\n١) محفّز relapse #١:\n٢) قاعدة حماية #١:\n٣) محفّز relapse #٢:\n٤) قاعدة حماية #٢:\n٥) سؤال واحد هتسأله للـ AI كل أسبوع للمراقبة:",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "١) محفّز ١:\n   [مثال: ضغط كاش]\n٢) قاعدة ١:\n   [مثال: مراجعة كاش كل اثنين قبل أي صرف كبير]\n\n٣) محفّز ٢:\n   [مثال: شكاوى متكررة]\n٤) قاعدة ٢:\n   [مثال: AI يلخّص الشكاوى يوم الجمعة]\n\n٥) سؤال أسبوعي للـ AI:\n   [اكتب هنا]",
      rubric: [
        {
          label: "محفّزات حقيقية",
          weight: 60,
          criteria: ["٢ محفّز من تجربتك — مش قائمة عامة."],
        },
        {
          label: "قواعد قابلة للتنفيذ",
          weight: 40,
          criteria: ["قاعدتان بسيطتان + سؤال مراقبة أسبوعي."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت حماية النظام",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ الـ relapse متوقع تحت الضغط — والـ AI يساعدك تراقب بدري.",
        "تقدر تعمل إيه؟ عندك قواعد حماية لأخطر محفّزين عندك.",
        "اللي جاي: مراجعة أسبوعية أعمق — مش إيقاع يومي بس، بل «إيه اللي اتغيّر؟»",
      ],
    },
  },
];
