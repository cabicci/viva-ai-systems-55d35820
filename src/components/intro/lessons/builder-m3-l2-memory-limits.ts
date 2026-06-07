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
import memoryLimitsScreenshot from "@/assets/lessons/builder-m3-l2-memory-limits.jpg";

/** Builder · M3 · Lesson 02 — حدود الذاكرة (v3: Lesson Shape pilot) */
export const BUILDER_M3_MEMORY_LIMITS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ ليه AI «بينسى» — وإزاي تصمّم منتجك يحفظ اللي لازم يتحفظ.",
        "ليه دلوقتي؟ محادثة طويلة = سياق يتملّى. من غير تصميم، المساعد هيبان «بيتكلم حيطة».",
        "هتعمل إيه بعد الدرس؟ هتحدّد ٣ حاجات التطبيق لازم يفتكرها دايمًا.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "اتفقتوا — وبعد ١٠ رسايل نسي",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "شرحت فكرة، اتفقتوا على خطة — وبعد شوية الـ AI بدأ يقترح عكس اللي قلته.",
        "مش إنت — الـ AI فعلًا بينسى. ده مش عيب شخصي؛ ده حد في التصميم.",
        "لما تبني ميزة AI، مش تتوقّع إن «الشات» يحفظ كل حاجة — التطبيق لازم يحفظ اللي مهم.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "AI مش بيفتكر للأبد",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Context Window = «شباك ذاكرة» — الـ AI شايف آخر كم كلمة بس. اللي قبل كده وقع من المكتب.",
        "علامات إنك خرجت برّا الشباك: يكرر نفسه، ينسى اسمك، يناقض قرارات، يخترع تفاصيل.",
        "الحل في المنتج: التطبيق يحفظ ٣–٥ حقائق ثابتة (اسم، تفضيلات، قرارات) ويمرّرها مع كل طلب.",
        "في المحادثة: ملخّص قصير كل ١٥–٢٠ رسالة — «ملخص الوضع: ١)... ٢)...»",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "ترغي وتستنى vs تلخّص وتمرّر",
    block: {
      kind: "comparison",
      left: {
        label: "«كمّل من الأول»",
        body: "شات ٣٠ رسالة — «كمّل من اللي قلتهولك.» هو نسي. هيبدأ يهبد — وإنت هتبني على معلومات غلط.",
      },
      right: {
        label: "ملخّص + تمرير من التطبيق",
        body: "«ملخص: ١) المشروع... ٢) القرارات... ٣) المفتوح...» + التطبيق يمرّر اسم المستخدم وتفضيلاته كل مرة.",
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
          term: "Context Window (شباك الذاكرة)",
          meaning: "أقصى كم نص الـ AI «شايفه» في المحادثة — مش أرشيف دائم.",
          example: "بعد ٥٠ رسالة، أول رسالة اتمسحت من ذاكرته المؤقتة.",
        },
        {
          term: "State Snapshot (لقطة حالة)",
          meaning: "ملخّص قصير للوضع الحالي — تعيده للـ AI لما الشات يطوّل.",
          example: "«قررنا: لون أزرق، جمهور شباب، المفتوح: صفحة التسعير.»",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — حدود الذاكرة",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "Context Window — إزاي تتعامل معاه في تصميم المنتج. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "ذاكرة محدودة — تصميم صريح",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: memoryLimitsScreenshot,
      alt: "مساعد AI — تنبيه إن الإجابات تعتمد على السياق المتاح.",
      caption:
        "التنبيه ده مش قانوني — ده اعتراف إن الذاكرة ليها حد. المساعد شايف سياقك + جزء من المحتوى — مش «كل حاجة». في منتجك: حدّد إيه اللي التطبيق يحفظه برّه الشات ويمرّره كل مرة.",
      label: "سياق محدود — بوضوح",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m3-l2-memory-limits-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "بعد أسبوع شات، الـ AI نسي اسمك وناقض قرار اتفقتوا عليه. إيه أقرب سبب؟",
          options: [
            "خرجت برّا Context Window — المعلومات وقعت من الشباك.",
            "الـ AI عمل هلوسة مفاجئة من غير علاقة بالذاكرة.",
            "المشكلة في لهجتك.",
          ],
          correctIndex: 0,
          explanation:
            "لما ينسى أساسيات — غالبًا المعلومة مش في الشباك. الحل: التطبيق يحفظ ويمرّر.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "٣ حاجات التطبيق لازم يفتكرها",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "تخيّل تطبيق فيه مساعد AI — حدّد ٣ حقائق لازم التطبيق يحفظها (مش الـ AI يتذكرها لوحده).\n\n١٠–١٥ دقيقة.",
      prompt:
        "في تسليمك:\n\n١) نوع التطبيق (مثال: متجر، تعليم، حجز):\n\n٢) ٣ حاجات لازم يفتكرها دايمًا — لكل واحدة:\n   - إيه الحقيقة؟\n   - ليه مهمة لو نسيها؟\n   - إزاي التطبيق يمرّرها (حقل DB، session، أول كل Prompt):\n\n٣) جملة State Snapshot لو المحادثة طوّلت",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "التطبيق:\n[...]\n\n١) [...]\n   ليه: [...]\n   إزاي: [...]\n\n٢) [...]\n   ليه: [...]\n   إزاي: [...]\n\n٣) [...]\n   ليه: [...]\n   إزاي: [...]\n\nState Snapshot:\n«[...]»",
      rubric: [
        {
          label: "٣ حقائق عملية",
          weight: 60,
          criteria: [
            "كل حقيقة ليها سبب «لو نسي».",
            "طريقة التمرير واقعية.",
          ],
        },
        {
          label: "Snapshot",
          weight: 40,
          criteria: [
            "الملخّص قصير ومركّز.",
            "يغطي قرارات أو حالة حالية.",
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
        "فهمت إيه؟ AI بينسى — التطبيق هو اللي يفتكر. Context Window حدّ مش ميزة.",
        "تقدر تعمل إيه؟ تحدّد ٣ حقائق + Snapshot لأي ميزة محادثة.",
        "اللي جاي: Temperature — ثبات vs إبداع.",
      ],
    },
  },
];
