import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import tablesScreenshot from "@/assets/lessons/builder-m7-l19-tables-columns.jpg";

/**
 * Builder · M8 · Lesson 01 — Tables & Columns
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 *
 * يبني على M5.3 (Database مفهوم) و M7.2 (RLS) — دلوقتي بنتعمّق في تصميم الجداول.
 */
export const BUILDER_M8_TABLES_COLUMNS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "البداية",
    title: "غلطة في تصميم الجدول بتدفع تمنها شهور",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تخيل تطبيقك بعد 6 شهور من الـ launch... شغال تمام، وفجأة كل حاجة بتبطأ وبقت بتضرب أخطاء غريبة.",
        "السبب؟ غالبًا قرار غلط خدته في ثانيتين وانت بتعمل أول جدول في المشروع. كلمة زي `text` بدل `numeric` ممكن توقّع سيستم كامل لما الداتا تكبر.",
        "الدرس ده هيوريك إزاي تصمم جداول صح من الأول، عشان تبني أساس يستحمل أي ضغط في المستقبل.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "جرّب دلوقتي",
    title: "اختيار واحد بيفرق بين مشروع ناجح ومشروع فاشل",
    block: {
      kind: "comparison",
      left: {
        label: "تصميم هيقع بعد شهرين",
        body: "كله `text` وخلاص: `name text`, `price text`, `items text`. كل حاجة ممكن تبقى فاضية (nullable) عشان \"يمكن نحتاج\". النتيجة؟ لو حبيت تجيب أغلى منتج، السيستم هيتلخبط بين سعر '100.00' و '99.5' ومش هيعرف يرتبهم صح. كارثة.",
      },
      right: {
        label: "تصميم يستحمل ملايين المستخدمين",
        body: "كل عمود له نوعه المظبوط: `title text not null` (مينفعش يبقى فاضي)، `price numeric` (عشان الفلوس)، `is_published boolean` (عشان أه/لأ)، `created_at timestamptz` (عشان تعرف كل حاجة اتعملت امتى). كده السيستم نفسه بيحميك من الداتا الغلط.",
      },
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "مثال حي",
    title: "كل صفحة بتشوفها أصلها جدول",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: tablesScreenshot,
      alt: "صفحة /system-state بتعرض حالة المنصة الحالية في شكل كروت زي currentPath و currentUser.",
      caption:
        "بص على صفحة الـ System State دي. كل كارت (زي `currentPath` أو `currentUser`) هو بالظبط column في جدول، والقيمة اللي تحته هي الداتا اللي في الصف بتاعك. التصميم اللي بيحدد شكل الجدول ده هو اللي بنسميه الـ Schema.",
      label: "من المنصة — صفحة /system-state",
    },
  },
  {
    icon: BookOpen,
    eyebrow: "المصطلح الوحيد للدرس",
    title: "الـ Schema: خريطة الكنز بتاعتك",
    block: {
      kind: "concepts",
      items: [
        { term: "Schema", meaning: "الرسم الهندسي أو الخريطة اللي بتوصف كل جدول في السيستم: عواميده إيه، نوع البيانات في كل عامود، وإيه القواعد اللي بتحكمه.", example: "زي ما بتقول: جدول 'المنتجات' فيه عامود 'السعر' وده لازم يكون رقم عشري ومينفعش يبقى فاضي، وعامود 'اسم_المنتج' وده لازم يكون نص." },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "شوف بعينك: تصميم جدول من الصفر",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption: "إزاي تختار النوع الصح لكل column، امتى تسيب خانة فاضية (nullable)، وليه الـ id مش مجرد رقم وخلاص.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "طبّق اللي اتعلمته",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m7-l19-tables-columns-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "بتعمل جدول للمستخدمين (users). إيه أحسن نوع داتا تستخدمه لـ `id` بتاع كل user؟",
          options: [
            "uuid، لأنه فريد على مستوى العالم، آمن، ومحدش يقدر يخمّنه.",
            "integer، لأنه أسرع في البحث ومناسب للأرقام اللي ورا بعض.",
            "text، عشان أقدر أدخل أي رمز أو حرف كـ id."
          ],
          correctIndex: 0,
          explanation: "الـ uuid هو الاختيار الأفضل للـ IDs العامة زي بتاعة المستخدمين. بيخلّي السيستم بتاعك آمن أكتر عشان أرقام الـ IDs مش متسلسلة، وبيضمن إن مفيش اتنين users هياخدوا نفس الـ ID حتى لو شغال على كذا سيرفر."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "عندك جدول للمنتجات في متجر إلكتروني، وفيه عامود 'price'. تختارله نوع إيه؟ وهل تسمح إنه يبقى فاضي؟",
          options: [
            "numeric و not null، عشان الفلوس لازم تبقى دقيقة ومينفعش منتج من غير سعر.",
            "integer و nullable، يمكن السعر يكون رقم صحيح بس، وممكن منتج يكون لسه متسعّرش.",
            "text و not null، عشان يمكن السعر يتكتب بصيغة معينة فيها عملة زي '100 جنيه'."
          ],
          correctIndex: 0,
          explanation: "الـ `numeric` هو النوع المخصص للفلوس عشان بيتعامل مع الكسور العشرية بدقة عالية. والمنطقي إنه يكون `not null` لأن كل منتج معروض للبيع لازم يكون له سعر."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "بتصمم جدول للمهام (tasks) مربوط بجدول المستخدمين (users). لما تمسح user، إيه المفروض يحصل للمهام بتاعته؟",
          options: [
            "المهام بتاعته تتمسح معاه أوتوماتيك (cascade)، عشان الداتا تفضل نضيفة ومفيش حاجة 'متشعلقة' في السيستم.",
            "السيستم يرفض يمسح الـ user طالما لسه عنده مهام (restrict).",
            "المهام تفضل موجودة بس خانة الـ user_id بتاعتها تبقى فاضية (set null)."
          ],
          correctIndex: 0,
          explanation: "الأفضل هنا هو الـ cascade delete. لما الـ user يتمسح، مهامه مبتكونش ليها لازمة، فمسحها معاه بيحافظ على قاعدة البيانات نضيفة ومنطقية، وبيمنع وجود داتا ملهاش صاحب."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك في 10 دقايق",
    title: "صلّح الـ Schema المضروب ده",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "ده schema لجدول 'products' في سيستم e-commerce، بس مليان غلطات هتعمل مشاكل بعدين. مهمتك تصلحه.",
      prompt:
        "**الـ Schema الغلط:**\n- `name`: text\n- `price`: text\n- `in_stock`: text\n- `created_date`: text\n\n**مهمتك:**\nاكتب الـ Schema الصح، مستخدمًا الأنواع والقواعد اللي اتعلمتها. فكّر في:\n1.  أنواع البيانات الصح (للأسعار، للكمية، للتاريخ).\n2.  إيه الخانات اللي مينفعش تبقى فاضية (not null).\n3.  إيه الأعمدة الأساسية اللي ناقصة عشان الجدول يبقى production-ready (زي الـ id).",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "تصليح الأنواع والقواعد",
          weight: 70,
          criteria: [
            "استخدم `numeric` للـ price.",
            "استخدم `boolean` أو `integer` للـ in_stock.",
            "استخدم `timestamptz` مع `default now()` للـ created_at.",
            "حدد `not null` للأعمدة الأساسية زي name و price.",
          ],
        },
        {
          label: "إضافة أعمدة أساسية (Audit)",
          weight: 30,
          criteria: [
            "ضاف `id uuid primary key`.",
            "ضاف `updated_at timestamptz`.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "أبسط جدول عندنا بيشغّل المنصة",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "جدول lesson_progress = أبسط مثال تطبيقي",
      summary:
        "جدول `lesson_progress` اللي بيسجل انت خلصت إيه، هو أبسط مثال عملي. 6 عواميد بس بيعملوا الشغل كله عشان نتابع تقدّمك. الأهمية مش في الكترة، الأهمية في التصميم الصح من الأول.",
      bullets: [
        "الـ `user_id` مع الـ `lesson_id` بيعملوا مع بعض مفتاح فريد (unique constraint) عشان نضمن إنك متسجلش نفس الدرس مرتين.",
        "عامود الـ `status` نوعه متحدد (enum) عشان يقبل قيم معينة بس: 'not-started', 'in-progress', 'completed'.",
        "بدأنا بـ 4 عواميد بس، وزوّدنا اتنين لما احتجناهم. ابدأ بسيط وكبّر لما تحتاج، مش العكس.",
      ],
      pathAngle: "builder",
      link: { label: "افتح الـ Dashboard وشوف تقدّمك", href: "/dashboard" },
    },
  }
];