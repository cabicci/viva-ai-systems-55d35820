import {
  Sparkles,
  AlertCircle,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import queriesScreenshot from "@/assets/lessons/builder-m7-l3-queries.jpg";

/** Builder · M7 · Lesson 03 — Queries (v3: Lesson Shape pilot · optional depth) */
export const BUILDER_M8_QUERIES_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ Query = سؤال للمخزن — «هاتلي محادثات العميل ده من آخر أسبوع» مش «هات كل حاجة».",
        "ليه دلوقتي؟ بعد ما صمّمت الجداول وربطتهم، محتاج تسأل المخزن صح — وإلا الصفحة هتتحمّل في ثواني.",
        "هتعمل إيه بعد الدرس؟ هتكتب ٣ أسئلة بلغة بسيطة — المخزن هيجاوب عليها.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "الصفحة بتحمّل ٦ ثواني — والـ AI «بطيء»",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "العميل بيفتح سجل محادثاته — وبيستنى ٦ ثواني. يفتكر الـ AI بطيء، بس المشكلة في السؤال للمخزن.",
        "السؤال الغلط: «هات كل المحادثات» — السيرفر بيرجع ١٠٠ ألف سطر وانت محتاج ٢٠ بس.",
        "السؤال الصح: «هات ٢٠ محادثة للعميل ده — الأحدث الأول» — ٢٠٠ ميللي ثانية.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "Query = سؤال محدد للمخزن",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أي سؤال = ٤ أجزاء: عايز إيه (SELECT) — منين (FROM) — بشروط إيه (WHERE) — مترتب إزاي (ORDER + LIMIT).",
        "SELECT الأعمدة اللي محتاجها بس — مش `SELECT *`. WHERE `user_id = العميل الحالي` — عشان ميشوفش بيانات حد تاني.",
        "ORDER BY `created_at` desc + LIMIT 20 = الأحدث ٢٠ بس. السؤال الواضح = صفحة سريعة.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "هات كل حاجة vs اطلب اللي محتاجه",
    block: {
      kind: "comparison",
      left: {
        label: "غلط — هات كل حاجة وبعدين فلتر",
        body: "`select('*')` من جدول فيه ١٠٠ ألف محادثة — السيرفر بيرجعهم كلهم عشان تعرض ٢٠. بطيء، تقيل، وغير آمن.",
      },
      right: {
        label: "صح — سؤال محدد",
        body: "«هات `id, title, status` من `tasks` — للعميل ده بس — الأحدث الأول — ١٠ بس.» سريع، خفيف، آمن.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للسؤال",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Query (سؤال للمخزن)",
          meaning: "أمر محدد بتبعته للمخزن عشان يجيبلك معلومة معينة.",
          example: "«هات آخر ١٠ محادثات للعميل ده» — ده Query.",
        },
        {
          term: "WHERE (شرط)",
          meaning: "الفلتر اللي بيحدّد مين أو إيه اللي هيتجاب.",
          example: "`WHERE user_id = العميل_الحالي` — محادثاته هو بس.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — إزاي تسأل المخزن صح",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تكتب سؤال للمخزن يجيب بياناتك بسرعة. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "كل رقم وراه سؤال للمخزن",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: queriesScreenshot,
      alt: "صفحة تقرير فيها ٤ كروت إحصائية: عدد جداول الـ DB، عدد الـ Edge Functions، عدد الدروس المنشورة، ونسبة التغطية",
      caption:
        "الصفحة دي مش جدول خام — دي أسئلة منفصلة للمخزن. كل كارت = Query محدد. السؤال الواضح = رقم يتحدّث بسرعة.",
      label: "Queries في لوحة التحكم",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m7-l3-queries-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "صفحة سجل المحادثات بطيئة — لقيت السؤال بياخد ٦ ثواني. إيه أول حاجة تشك فيها؟",
          options: [
            "إني بستخدم `SELECT *` بدل ما أحدد الأعمدة اللي محتاجها.",
            "إن السيرفر محتاج إمكانيات أعلى.",
            "إن الـ JOIN كتير ومحتاجة تتقسم.",
          ],
          correctIndex: 0,
          explanation:
            "أول وأسهل حاجة: اطلب الأعمدة اللي محتاجها بس. `SELECT *` بيبطّئ كل حاجة.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اكتب ٣ أسئلة بلغة بسيطة",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "فكّر في تطبيقك — إيه الأسئلة اللي الصفحات محتاجة تجاوب عليها؟ اكتبها بلغة بسيطة.\n\n١٠–١٥ دقيقة كفاية.",
      prompt:
        "في تسليمك اكتب ٣ أسئلة بلغة عادية — لكل سؤال:\n\n١) السؤال بلغة بسيطة (مثال: «هات آخر ١٠ مهام للعميل الحالي»):\n\n٢) من أنهي جدول/جداول؟\n\n٣) إيه الشروط؟ (مين؟ إيه الحالة؟ إيه الفترة؟)\n\n٤) الترتيب والعدد؟ (الأحدث الأول؟ كام نتيجة؟)",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "سؤال ١:\n[بلغة بسيطة]\nمن: [جدول/جداول]\nشروط: [مين / إيه / إمتى]\nترتيب وعدد: [الأحدث أولاً / ١٠ بس]\n\nسؤال ٢:\n...\n\nسؤال ٣:\n...",
      rubric: [
        {
          label: "٣ أسئلة واضحة",
          weight: 60,
          criteria: [
            "كل سؤال بلغة بسيطة — مش SQL معقّد.",
            "الأسئلة تخدم صفحات حقيقية في التطبيق.",
          ],
        },
        {
          label: "شروط وحدود",
          weight: 40,
          criteria: [
            "فيه فلتر (مين / إيه الحالة) — مش «هات كل حاجة».",
            "فيه ترتيب أو حد للعدد.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت الأسئلة",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ Query = سؤال محدد للمخزن. السؤال الواضح = صفحة سريعة وآمنة.",
        "تقدر تعمل إيه؟ عندك ٣ أسئلة بلغة بسيطة — جاهزة تتحوّل لكود أو prompt في Lovable.",
        "اللي جاي: Sessions & JWT — إزاي تعرف مين العميل اللي داخل وتحمي بياناته.",
      ],
    },
  },
];
