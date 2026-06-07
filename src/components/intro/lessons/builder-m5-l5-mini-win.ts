import {
  Sparkles,
  AlertCircle,
  PlayCircle,
  Lightbulb,
  Scale,
  Rocket,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

/** Builder · M5 · Lesson 05 — Mini Win (v3: Lesson Shape pilot) */
export const BUILDER_M5_MINI_WIN_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ «صغير ومنشور» أحسن من «كامل ومش متجرب» — Mini Win قبل الكمال.",
        "ليه دلوقتي؟ خلّصت ٣ طبقات: واجهة، كواليس، مخزن. وقت توقّف وتثبّت.",
        "هتعمل إيه بعد الدرس؟ هتعرّف Mini Win لتطبيقك — أصغر نسخة تقدر تنشرها وتجربها.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "بتخطّط لتطبيق ضخم — ومش بتبدأ",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "عندك ٢٠ feature في دماغك: login، دفع، ٥ لغات، dashboard، notifications...",
        "بعد شهر لسه بتخطّط — ومفيش حاجة شغّالة قدام حد حقيقي.",
        "المشكلة مش الفكرة. المشكلة إنك مستني «الكمال» قبل ما تجرب.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "صغير ومنشور > كامل ومش متجرب",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Mini Win = أصغر نسخة من تطبيقك تقدر تنشرها وتجربها مع مستخدم حقيقي.",
        "صفحة واحدة + action واحد + نتيجة واحدة = كفاية للبداية.",
        "Feedback من ٣ مستخدمين أهم من ٣٠ feature مفيش حد جربهم.",
        "Phase 2 خلّصت المفاهيم — Phase 3 هتبني. Mini Win هو جسرك.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "تطبيق كامل في دماغك vs Mini Win",
    block: {
      kind: "comparison",
      left: {
        label: "«هعمل كل حاجة الأول»",
        body: "٣ شهور تخطيط. login + دفع + ١٠ صفحات. مفيش حد جرب — ومفيش feedback.",
      },
      right: {
        label: "Mini Win في أسبوع",
        body: "صفحة واحدة: اكتب سؤال → AI يرد. ٥ أصدقاء جربوا. عرفت إيه يشتغل وإيه لأ.",
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
          term: "Mini Win (انتصار صغير)",
          meaning: "أصغر نسخة منشورة تثبت إن الفكرة تشتغل — مش prototype في دماغك.",
          example: "«AI يلخّص مقال» — صفحة واحدة، لصق + زرار + ملخص. بس.",
        },
        {
          term: "MVP (Minimum Viable Product)",
          meaning: "نفس الفكرة بالإنجليزي — أقل منتج يقدر يوصل قيمة حقيقية.",
          example: "Uber بدأ بـ «اطلب عربية» — من غير Uber Eats ولا Uber Freight.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — ليه «صغير» أسرع",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي Mini Win بيوفر شهور — وإزاي feedback حقيقي أهم من features كتير. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "شوفها ببساطة",
    title: "٣ طبقات — جاهزة للبناء",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Frontend: العميل يشوف ويدوس.",
        "Backend: AI يشتغل ورا.",
        "Database: التطبيق يفتكر.",
        "Mini Win = أقل حاجة في كل طبقة — بس تشتغل end-to-end.",
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m5-l5-mini-win-check",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "سارة عندها فكرة AI app فيها ١٥ feature. إيه أحسن خطوة قبل Phase 3؟",
          options: [
            "تعرّف Mini Win — أصغر نسخة تنشرها وتجربها.",
            "تكمّل تخطيط الـ ١٥ feature كلها.",
            "تتعلم React و SQL الأول.",
          ],
          correctIndex: 0,
          explanation:
            "Mini Win الأول — feedback حقيقي أهم من خطة كاملة من غير تجربة.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "عرّف Mini Win لتطبيقك",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي تعريف — مش بناء. ٥–١٠ دقايق.\n\nاستخدم Product Request من درس الانتقال.",
      prompt:
        "في تسليمك اكتب:\n\n١) الفكرة (جملة):\n\n٢) Mini Win — أصغر نسخة منشورة:\n   - صفحة واحدة: إيه اللي العميل يشوفه؟\n   - action واحد: إيه اللي يدوس عليه؟\n   - نتيجة واحدة: إيه اللي يحصل؟\n\n٣) إيه اللي مش في Mini Win (عشان بعدين):\n   - [feature 1]\n   - [feature 2]\n\n٤) مين أول ٣ ناس هتجرب معاهم؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "الفكرة:\n[جملة]\n\nMini Win:\nصفحة: [ ]\naction: [ ]\nنتيجة: [ ]\n\nمش دلوقتي:\n- [ ]\n- [ ]\n\nأول ٣ testers:\n1. [ ]\n2. [ ]\n3. [ ]",
      rubric: [
        {
          label: "Mini Win محدّد",
          weight: 60,
          criteria: [
            "صفحة + action + نتيجة — مش «تطبيق كامل».",
            "تقدر تتخيّلها منشورة في أسبوع.",
          ],
        },
        {
          label: "حدود واضحة",
          weight: 40,
          criteria: [
            "فيه «مش دلوقتي» — إيه اللي مستني.",
            "فيه ٣ testers محدّدين.",
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
        "فهمت إيه؟ صغير ومنشور > كامل ومش متجرب. Mini Win = جسرك لـ Phase 3.",
        "تقدر تعمل إيه؟ عندك تعريف Mini Win + حدود + ٣ testers.",
        "اللي جاي: من فكرة لصفحة — إزاي أي idea تبقى شاشات وخطوات.",
      ],
    },
  },
];
