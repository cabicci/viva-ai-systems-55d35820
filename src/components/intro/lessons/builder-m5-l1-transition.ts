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
import transitionImage from "@/assets/lessons/unique/builder-m5-l1-transition.jpg";

/** Builder · M5 · Lesson 01 — Phase 2 Transition (v3: Lesson Shape pilot) */
export const BUILDER_M5_TRANSITION_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ البناء يبدأ بوصف واضح — مش بكود. إيه التطبيق؟ لمين؟ وإيه الهدف؟",
        "ليه الانتقال ده؟ خلّصت مرحلة «تكلّم AI». دلوقتي هتوصف فكرة تطبيق — Lovable أو أدوات تانية هتبني من وصفك.",
        "هتعمل إيه بعد الدرس؟ ٣ جمل بس: فكرة + مستخدم + هدف. مش برمجة.",
        "إنت مش بتحوّل لمبرمج. إنت بتتعلّم توصف منتج — والأداة تبني من وصفك.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "عندك فكرة جامدة — ومش عارف تبدأ منين",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بتفتح Lovable أو أي أداة وتكتب «اعملي تطبيق AI» — ويطلعلك حاجة عامة مش اللي في دماغك.",
        "المشكلة مش الأداة. المشكلة إنك ما حدّدتش: مين هيستخدمه؟ وعايز يوصل لإيه؟",
        "الحل: ٣ جمل واضحة قبل أي أداة. مش محتاج JavaScript — محتاج وصف منتج.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "البناء يبدأ بطلب منتج واضح — مش بكود",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أي تطبيق = ٣ طبقات بسيطة: واجهة (اللي العميل يشوفه)، كواليس (اللي يشتغل ورا)، مخزن (اللي يفتكر).",
        "الخطوة الأولى مش كود — هي وصف المنتج: فكرة + مستخدم + هدف.",
        "لما التلاتة واضحين، Lovable (مساعد بناء) يفهمك من أول مرة.",
        "إنت مش بتحوّل لمبرمج. إنت بتتعلّم توصف — والأداة تبني. ده جسر ثقة قبل الدروس التقنية.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "«اعملي تطبيق» vs طلب منتج واضح",
    block: {
      kind: "comparison",
      left: {
        label: "طلب غامض",
        body: "«اعملي تطبيق AI للمطاعم» — الأداة تخمّن كل حاجة. هتعدّل ٥ مرات ومش هتوصل.",
      },
      right: {
        label: "طلب منتج واضح",
        body: "«تطبيق لصاحب مطعم صغير — العميل يكتب مكوناته والـ AI يقترح وصفة. الهدف: أول وصفة في ٣٠ ثانية» — ده بداية بناء حقيقية.",
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
          term: "Product Request (طلب المنتج)",
          meaning: "وصف بسيط: إيه التطبيق، لمين، وإيه اللي المستخدم عايز يوصله.",
          example: "«مساعد AI لطلاب الجامعة — يلخّص محاضرات PDF في ٥ نقاط».",
        },
        {
          term: "Phase 2 (مرحلة البناء)",
          meaning: "تحوّل فكرة AI من شات لمنتج حقيقي: شاشات + تخزين + منطق.",
          example: "Phase 1 = تكلّم AI. Phase 2 = ابنيله بيت يعيش فيه.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — من الكلام للبناء",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي Phase 1 (تكلّم AI) بتتحوّل لـ Phase 2 (تطبيق حقيقي). لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "الجسر — من Prompts لطبقات التطبيق",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: transitionImage,
      alt: "رسمة: على الشمال فقاعات شات، وعلى اليمين شاشة تطبيق + سيرفر + مخزن — سهم بيوصل الاتنين.",
      caption:
        "خلّصت مرحلة «تكلّم AI». دلوقتي هتبني له بيت: واجهة يشوفها العميل، كواليس تشتغل، ومخزن يفتكر.",
      label: "من الكلام للبناء",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m5-l1-transition-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "سارة عايزة تبني تطبيق AI يساعد أصحاب محلات يكتبوا أوصاف منتجات. إيه أحسن أول خطوة؟",
          options: [
            "تكتب فكرة التطبيق + المستخدم + الهدف — قبل ما تفتح أي أداة.",
            "تفتح Lovable وتكتب «اعملي تطبيق AI».",
            "تتعلم JavaScript الأول.",
          ],
          correctIndex: 0,
          explanation:
            "Product Request الأول — لما تعرف «لمين» و«لإيه»، أي أداة تفهمك. الكود ييجي بعد.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اكتب طلب منتجك — فكرة + مستخدم + هدف",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي كتابة — مش برمجة. ٥–١٠ دقايق كفاية.\n\nاختار فكرة تطبيق AI (حتى لو بسيطة) واكتب التلاتة.",
      prompt:
        "في تسليمك اكتب:\n\n١) الفكرة (جملة واحدة): التطبيق بيعمل إيه؟\n\n٢) المستخدم (جملة واحدة): مين هيستخدمه؟\n\n٣) الهدف (جملة واحدة): المستخدم عايز يوصل لإيه لما يخلص؟\n\nمثال:\n- الفكرة: AI يلخّص مقالات طويلة\n- المستخدم: صحفي بيقرأ كتير كل يوم\n- الهدف: ياخد ملخص في دقيقة بدل ٢٠",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "الفكرة:\n[جملة واحدة]\n\nالمستخدم:\n[مين بالظبط]\n\nالهدف:\n[إيه اللي يوصله لما يخلص]",
      rubric: [
        {
          label: "التلاتة واضحين",
          weight: 60,
          criteria: [
            "كل سطر جملة واحدة — مش فقرة.",
            "المستخدم محدّد (مش «الناس» بس).",
          ],
        },
        {
          label: "الهدف قابل للقياس",
          weight: 40,
          criteria: [
            "الهدف يوصف نتيجة — مش «تطبيق حلو».",
            "تقدر تتخيّل المستخدم «خلص» إمتى.",
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
        "فهمت إيه؟ البناء يبدأ بوصف واضح — مش بكود. إنت مش بتحوّل لمبرمج.",
        "تقدر تعمل إيه؟ عندك ٣ جمل جاهزين — ده جسر ثقة قبل الدروس التقنية.",
        "اللي جاي: Frontend vs Backend — إزاي تفرّق بين اللي العميل يشوفه واللي يشتغل ورا.",
      ],
    },
  },
];
