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
import journeyScreenshot from "@/assets/lessons/unique/automator-m1-l1-where-you-are.jpg";

/** Automator · M1 · Lesson 01 — أنت فين في الخريطة؟ (v3: Lesson Shape pilot) */
export const AUTOMATOR_M1_L1_WHERE_YOU_ARE_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ قبل ما تبني أي أتمتة، لازم تعرف أنهي مهام متكرّرة بتاكل وقتك كل أسبوع.",
        "ليه دلوقتي؟ بعد Builder (المنتج) و Creator (الجمهور)، Automator هو «العامل الافتراضي» اللي يخلّي الشغل المتكرّر يمشي لوحده.",
        "هتعمل إيه بعد الدرس؟ هتعدّد ٥ مهام متكرّرة وتحسب الوقت اللي بتضيعه فيهم أسبوعيًا.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "بتفتح أدوات — ومش عارف تبدأ منين",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بتسمع عن Make و Zapier و n8n — وتفتح يوتيوب وتبني Flow — وبعد أسبوع لسه بتعمل نفس الشغل بإيدك.",
        "المشكلة مش الأداة. المشكلة إنك ما عرفتش أنهي مهمة بتتكرّر وبتضيع وقتك فعلًا.",
        "العامل الافتراضي مش بيظهر من فراغ — بيشتغل على مهام واضحة ومتكرّرة إنت حدّدتها الأول.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "شوف الوقت الضايع — بعدين سلّم للعامل الافتراضي",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Automator = بناء «عامل افتراضي» يكرّر شغلك المتكرّر: ردود، نقل بيانات، تذكيرات، متابعة.",
        "Builder بنى المنتج. Creator جاب الناس. Automator يربط الاتنين ويوفّر ساعات كل أسبوع.",
        "الخطوة الأولى مش أداة — هي Audit: أي مهمة بتعملها أكتر من مرتين في الأسبوع؟ كام دقيقة كل مرة؟",
        "لما تعرف الـ ٥ مهام الأكثر تكرارًا، هتعرف فين العامل الافتراضي يشتغل الأول.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "بناء أدوات vs معرفة فين الوقت بيروح",
    block: {
      kind: "comparison",
      left: {
        label: "بناء من غير Audit",
        body: "أحمد فتح Make وبنى ٣ Flows — بس لسه بيبعت إيميلات ترحيب بإيده ساعة كل يوم. الأتمتة مش على المهمة اللي بتضيع وقته.",
      },
      right: {
        label: "Audit الأول",
        body: "أحمد عدّد: إيميل ترحيب × ٢٠ عميل × ٣ دقايق = ساعة يوميًا. أول Flow = إيميل ترحيب أوتوماتيك. وفّر ٥ ساعات في الأسبوع.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للبداية",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Time Audit (جرد الوقت)",
          meaning: "تسجيل المهام المتكرّرة ووقت كل واحدة — عشان تعرف فين العامل الافتراضي يشتغل.",
          example: "«رد على استفسار واتساب» — ١٥ مرة/أسبوع × ٤ دقايق = ساعة.",
        },
        {
          term: "Workflow (سير العمل)",
          meaning: "خطوات ثابتة من بداية لنهاية — زي ما العامل الافتراضي يمشي عليها كل مرة.",
          example: "عميل يسأل → ترد بالسعر → تسجّله في شيت.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — من Builder و Creator لـ Automator",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي Automator يكمّل اللي بدأته في Builder و Creator — وليه Audit الوقت هو الخطوة الأولى. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "خريطة الرحلة — ٥ مسارات متصلة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: journeyScreenshot,
      alt: "خريطة تعلّم بخمس مسارات متصلة — Intro و Creator و Builder و Automator و Business و Analyst.",
      caption:
        "كل مسار = مرحلة في الرحلة. Builder (منتج) → Creator (جمهور) → Automator (عامل افتراضي يوفر وقت). إنت في Automator — بس الخريطة بتوريك إزاي القرارات هنا بتكمّل اللي فات.",
      label: "خريطة الرحلة",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m1-l1-where-you-are-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "سارة بتبعت إيميل ترحيب لكل عميل جديد يدوي — ٣٠ دقيقة يوميًا. إيه أحسن خطوة قبل ما تفتح أي أداة أتمتة؟",
          options: [
            "تعدّد المهمة ووقتها وتكرارها في الأسبوع — عشان تعرف إن دي أولوية.",
            "تفتح Make وتبني Flow من غير ما تحسب الوقت.",
            "توقف ترسل إيميلات ترحيب عشان توفر وقت.",
          ],
          correctIndex: 0,
          explanation:
            "Audit الأول — لما تعرف إن «إيميل ترحيب» = ٣٠ دقيقة يوميًا، هتعرف إن دي أول مهمة للعامل الافتراضي.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اعمل Audit لأسبوعك — فين الوقت بيتضيع؟",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي مراقبة — مش بناء. قبل ما تسلّم أي شغل للعامل الافتراضي، لازم تعرف أنهي مهام بتتكرّر.\n\n١٠–١٥ دقيقة كفاية.",
      prompt:
        "في تسليمك اكتب:\n\n١) ٥ مهام متكرّرة — لكل واحدة:\n   - اسم المهمة:\n   - مرات في الأسبوع:\n   - دقايق كل مرة:\n   - الإجمالي الأسبوعي = مرات × دقايق:\n\n٢) أنهي مهمة بتاخد أكبر وقت؟\n\n٣) أنهي مهمة أبسط (٢–٣ خطوات بس)؟\n\n٤) لو هتأتمت واحدة بس النهارده — هتختار أنهي ولِيه؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "مهمة ١:\n[الاسم]\nمرات/أسبوع: [ ]\nدقايق/مرة: [ ]\nإجمالي: [ ] دقيقة\n\nمهمة ٢:\n...\n\n(كرّر لـ ٥ مهام)\n\nأكبر وقت ضايع:\n[مهمة + رقم]\n\nأبسط مهمة:\n[مهمة + لِيه]\n\nأول أتمتة:\n[مهمة + سبب]",
      rubric: [
        {
          label: "٥ مهام بأرقام",
          weight: 60,
          criteria: [
            "كل مهمة فيها مرات ودقايق — مش تقديرات عامة.",
            "الإجمالي الأسبوعي محسوب.",
          ],
        },
        {
          label: "قرار أولوية",
          weight: 40,
          criteria: [
            "حدّدت أكبر وقت ضايع وأبسط مهمة.",
            "اختيار أول أتمتة له سبب منطقي.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت البداية",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ Automator = عامل افتراضي يوفر وقت — بس لازم تعرف أنهي مهام متكرّرة بتاكله الأول.",
        "تقدر تعمل إيه؟ عندك قائمة ٥ مهام بوقتها الأسبوعي — جاهزة لاختيار أول أتمتة.",
        "اللي جاي: Systems View — إزاي أي مهمة متكرّرة تتحوّل لنظام (مُشغّل → عملية → نتيجة).",
      ],
    },
  },
];
