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
import tablesScreenshot from "@/assets/lessons/builder-m7-l1-tables-columns.jpg";

/** Builder · M7 · Lesson 01 — Tables & Columns (v3: Lesson Shape pilot · optional depth) */
export const BUILDER_M8_TABLES_COLUMNS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ الجدول = نوع بيانات (مستخدمين، محادثات). العمود = صفة لكل صف (اسم، تاريخ، تقييم).",
        "ليه دلوقتي؟ Builder عمق اختياري — بس لو تطبيقك بيخزّن بيانات، التصميم الصح من الأول بيوفر مشاكل بعدين.",
        "هتعمل إيه بعد الدرس؟ هتصمّم ٣ جداول لبيانات تطبيقك — كل جدول بأعمدته وأنواعها.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "كل حاجة text — والتطبيق بطيء ومش دقيق",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بتصمم أول جدول في المخزن الذكي (Database) — وكل عمود نوعه `text`. سهل في البداية، بس بعد شهور التطبيق بطيء.",
        "تقييم المستخدم في `text`؟ السيستم مش هيعرف يحسب متوسط التقييمات. التاريخ في `text`؟ مش هيعرف يرتّب من الأحدث.",
        "الجدول = إيه نوع البيانات. العمود = إيه الصفة. النوع الغلط = مشاكل من أول يوم.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "الجدول = نوع — العمود = صفة بنوعها",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل جدول بيمثّل نوع واحد: `users`، `conversations`، `documents` — مش «كل حاجة في جدول واحد».",
        "كل عمود = صفة + نوع بيانات: `id` = uuid، `rating` = integer، `created_at` = timestamptz.",
        "قواعد مهمة: `not null` للحقول الأساسية. `uuid` للـ IDs. `numeric` للفلوس. `timestamptz` للتواريخ.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "كل حاجة text vs أنواع مظبوطة",
    block: {
      kind: "comparison",
      left: {
        label: "غلط — كل الأعمدة text",
        body: "`user_rating text` — السيستم مش هيعرف يحسب متوسط. `created_at text` — مش هيعرف يرتّب زمنيًا. بطيء ومش دقيق.",
      },
      right: {
        label: "صح — كل عمود بنوعه",
        body: "`user_rating integer`، `created_at timestamptz default now()`، `id uuid primary key`. تقدر تحلل وتطوّر بسهولة.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للمخزن",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Table (جدول)",
          meaning: "مكان تخزّن فيه نوع واحد من البيانات — زي شيت Excel لموضوع واحد.",
          example: "جدول `conversations` — كل صف = محادثة واحدة.",
        },
        {
          term: "Column (عمود)",
          meaning: "صفة لكل صف — ليها نوع بيانات محدد.",
          example: "`title text not null` — عنوان إجباري نصي.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — تصميم جدول صح",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تبني جدول بأنواع وأعمدة مظبوطة من الأول. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "الـ AI بيقرأ الجداول عشان يفهم السياق",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: tablesScreenshot,
      alt: "صفحة /system-state بتعرض حالة المنصة الحالية في شكل كروت زي currentPath و currentUser",
      caption:
        "قبل ما الـ AI يجاوب، بيبص على جداول زي دي: مين اللي بيسأل (`currentUser`) وفاتح أنهي صفحة (`currentPath`). التصميم الصح = ذاكرة سريعة ودقيقة.",
      label: "جداول السياق",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m7-l1-tables-columns-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "بتعمل جدول `services` وفيه عمود `price` (سعر الخدمة). إيه أنسب نوع؟",
          options: [
            "`numeric not null` — الفلوس لازم تكون دقيقة ومينفعش خدمة من غير سعر.",
            "`integer nullable` — رقم صحيح وممكن السعر يكون لسه متسعّرش.",
            "`text not null` — عشان أكتب السعر بصيغة زي «١٠٠ جنيه».",
          ],
          correctIndex: 0,
          explanation:
            "`numeric` للفلوس عشان الكسور العشرية. `not null` لأن كل خدمة معروضة لازم يكون ليها سعر.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "صمّم ٣ جداول لتطبيقك",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "فكّر في بيانات تطبيقك — إيه اللي محتاج يتخزّن؟ صمّم ٣ جداول بأعمدتها وأنواعها.\n\n١٠–١٥ دقيقة كفاية.",
      prompt:
        "في تسليمك اكتب ٣ جداول — لكل جدول:\n\n١) اسم الجدول (مثال: `users`):\n\n٢) إيه نوع البيانات اللي بيمثّله؟\n\n٣) الأعمدة — لكل عمود:\n   - الاسم:\n   - النوع (uuid / text / integer / timestamptz / numeric...):\n   - not null ولا nullable؟\n\n٤) فيه `id uuid primary key`؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "جدول ١: [اسم]\nالنوع: [إيه بيمثّل]\nالأعمدة:\n- id: uuid primary key\n- [...]: [نوع] [not null/nullable]\n- [...]: [نوع] [not null/nullable]\n\nجدول ٢:\n...\n\nجدول ٣:\n...",
      rubric: [
        {
          label: "٣ جداول منطقية",
          weight: 50,
          criteria: [
            "كل جدول بيمثّل نوع بيانات واحد — مش كل حاجة في جدول.",
            "فيه `id uuid primary key` في كل جدول.",
          ],
        },
        {
          label: "أنواع الأعمدة صح",
          weight: 50,
          criteria: [
            "التواريخ `timestamptz` — مش text.",
            "الأرقام والتقييمات integer أو numeric — مش text.",
            "الحقول الأساسية `not null` حيث يناسب.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت التصميم",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ الجدول = نوع بيانات. العمود = صفة بنوعها. النوع الصح من الأول = تطبيق سريع ودقيق.",
        "تقدر تعمل إيه؟ عندك ٣ جداول مصمّمة — جاهزة تربطها ببعض.",
        "اللي جاي: Relations — إزاي تربط الجداول عشان تجاوب على أسئلة حقيقية زي «محادثات العميل ده».",
      ],
    },
  },
];
