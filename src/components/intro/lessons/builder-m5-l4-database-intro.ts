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
import databaseScreenshot from "@/assets/lessons/builder-m5-l4-database-intro.jpg";

/** Builder · M5 · Lesson 04 — Database Intro (v3: Lesson Shape pilot) */
export const BUILDER_M5_DATABASE_INTRO_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ أي تطبيق محتاج «ذاكرة» — مكان يحفظ فيه العملاء والمحادثات.",
        "ليه دلوقتي؟ من غير مخزن، العميل يرجع بكرة يلاقي كل حاجة فاضية.",
        "هتعمل إيه بعد الدرس؟ هتصمّم جدول بـ ٤ أعمدة — زي Excel sheet لتطبيقك.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "العميل رجع بعد أسبوع — والتطبيق نسيانه",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "العميل كلم AI بتاعك، خد إجابة ممتازة، وقفل التطبيق.",
        "بعد أسبوع فتح تاني — مفيش محادثة، مفيش اسمه، كأنه أول مرة.",
        "التطبيق من غير ذاكرة = إنسان من غير ذاكرة. كل يوم بداية جديدة.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "التطبيق محتاج ذاكرة — مش بس شاشة وشغل",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Frontend = تشوف. Backend = يشتغل. Database = يفتكر.",
        "أي معلومة لازم تفضل موجودة بكرة — محادثات، أسماء، طلبات — مكانها المخزن.",
        "فكّر فيه زي Excel sheet على سيرفر: صف لكل عميل، أعمدة للمعلومات.",
        "مش مطلوب SQL دلوقتي — مطلوب تعرف: إيه اللي لازم يتخزّن؟",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "متصفح العميل vs مخزن على السيرفر",
    block: {
      kind: "comparison",
      left: {
        label: "تخزين في المتصفح بس",
        body: "المحادثات على جهاز العميل. فتح من موبايل تاني = فاضي. مسح cache = كل حاجة راحت.",
      },
      right: {
        label: "مخزن على السيرفر",
        body: "البيانات محفوظة برا جهاز العميل. يرجع من أي موبايل — يلاقي محادثاته. ده Database.",
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
          term: "Database (المخزن)",
          meaning: "الأرشيف الدايم — بيحفظ عملاء، محادثات، وأي حاجة لازم تفضل.",
          example: "«آخر سؤال سأله العميل» — محفوظ في صف في الجدول.",
        },
        {
          term: "Table (جدول)",
          meaning: "صفوف وأعمدة — زي Excel. كل صف = عميل أو محادثة.",
          example: "أعمدة: الاسم | الإيميل | آخر زيارة | آخر سؤال.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — ليه Excel مش كفاية؟",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي المخزن الذكي بيحفظ ملايين الصفوف من غير ما يبطّأ. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "بيانات محفوظة — مش على جهازك",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: databaseScreenshot,
      alt: "Dashboard يعرض تقدّم في الدروس — علامات إنجاز.",
      caption:
        "التقدّم ده مش على جهازك — لو فتحت من موبايل تاني هتلاقيه. ده لأنه محفوظ في مخزن. تطبيقك هيشتغل بنفس الفكرة.",
      label: "ذاكرة برا الجهاز",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m5-l4-database-intro-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "العميل فتح التطبيق بعد ٦ شهور ويلاقي كل طلباته القديمة. البيانات دي جاية من فين؟",
          options: [
            "من الواجهة على موبايله.",
            "من الكواليس اللي بتشتغل دلوقتي.",
            "من المخزن — Database.",
          ],
          correctIndex: 2,
          explanation:
            "أي معلومة قديمة محفوظة ومرجّعة = Database. الواجهة تعرض — المخزن يحفظ.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "صمّم جدول بـ ٤ أعمدة لتطبيقك",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي تخطيط — مش SQL. فكّر زي Excel sheet.\n\n٥–١٠ دقايق كفاية.",
      prompt:
        "في تسليمك اكتب:\n\n١) اسم الجدول (مثلاً: «عملاء» أو «محادثات»):\n\n٢) ٤ أعمدة — لكل عمود:\n   - اسم العمود:\n   - نوع المعلومة (نص / رقم / تاريخ):\n   - مثال قيمة:\n\n٣) لِيه كل عمود مهم؟ (جملة لكل واحد)\n\nمثال:\n| الاسم | نص | «أحمد» | عشان نعرف مين |\n| آخر سؤال | نص | «إزاي أبيع أكتر؟» | عشان AI يكمل من حيث وقف |",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "اسم الجدول:\n[ ]\n\nعمود ١:\nالاسم: [ ]\nالنوع: [ ]\nمثال: [ ]\nلِيه مهم: [ ]\n\nعمود ٢:\n...\n\n(كرّر لـ ٤ أعمدة)",
      rubric: [
        {
          label: "٤ أعمدة واضحة",
          weight: 60,
          criteria: [
            "كل عمود فيه اسم + نوع + مثال.",
            "الأعمدة مربوطة بتطبيق AI — مش عشوائية.",
          ],
        },
        {
          label: "السبب منطقي",
          weight: 40,
          criteria: [
            "كل عمود له «لِيه مهم».",
            "المعلومات تساعد التطبيق «يفتكر» العميل.",
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
        "فهمت إيه؟ التطبيق = واجهة + كواليس + ذاكرة. من غير مخزن، العميل يتنسى.",
        "تقدر تعمل إيه؟ عندك جدول بـ ٤ أعمدة — أساس أي تطبيق AI.",
        "اللي جاي: Mini Win — ليه «صغير ومنشور» أحسن من «كامل ومش متجرب».",
      ],
    },
  },
];
