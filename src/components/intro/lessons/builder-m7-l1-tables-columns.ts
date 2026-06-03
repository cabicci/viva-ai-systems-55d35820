import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen,
  FlaskConical,
} from "lucide-react";
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
    eyebrow: "بعد الدرس ده هتقدر",
    title: "تنظّم بيانات تطبيقك زي شيت Excel محترف",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتعرف إزاي تقرر إيه اللي يبقى عمود وإيه اللي يبقى جدول لوحده.",
      ],
    },
  },
  {
    icon: Sparkles,
    eyebrow: "أساس الـ AI بتاعك",
    title: "غلطة في تصميم المخزن بتخلي الـ AI بتاعك غبي",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تخيل الـ AI بتاعك بعد 6 شهور... بقى عليه ضغط، وبدأ يبقى بطيء وبيدي إجابات غريبة أو ناقصة. العملاء بيشتكوا.",
        "السبب؟ غالبًا قرار خدته في ثانيتين وانت بتصمم أول جدول في **المخزن الذكي (Database)**. اختيار `text` عشان تخزن بيه تقييم المستخدم (اللي هو المفروض رقم) ممكن يخلي الـ AI مش عارف يحسب متوسط التقييمات عشان يطور من نفسه.",
        "الدرس ده هيوريك إزاي تصمم جداول صح من الأول، عشان تبني ذاكرة قوية للـ AI بتاعك، تستحمل ملايين المستخدمين وتفضل سريعة وذكية.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "جرّب الفرق",
    title: "تصميم يكبّر الـ AI بتاعك، وتصميم يوقّعه",
    block: {
      kind: "comparison",
      left: {
        label: "تصميم هيخلي الـ AI بطيء ومش دقيق",
        body: "جدول بيخزن محادثات العملاء: كله `text` وخلاص. `user_message text`, `ai_response text`, `user_rating text`. النتيجة؟ لو حبيت تعرف متوسط تقييمات العملاء عشان تحسّن الـ AI، السيستم هيتلخبط بين تقييم '5' وتقييم '4.5' ومش هيعرف يحسب صح. كارثة.",
      },
      right: {
        label: "تصميم يستحمل ملايين المحادثات",
        body: "كل عمود له نوعه المظبوط: `user_message text not null`، `ai_response text`، `user_rating integer` (عشان الأرقام)، `created_at timestamptz` (عشان تعرف كل محادثة حصلت امتى بالظبط). كده تقدر تحلل أداء الـ AI وتطوره بسهولة.",
      },
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "الـ AI بيشوف إيه؟",
    title: "الـ AI بتاعك بيقرأ جداول عشان يفهمك",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: tablesScreenshot,
      alt: "صفحة /system-state بتعرض حالة المنصة الحالية في شكل كروت زي currentPath و currentUser.",
      caption:
        "قبل ما الـ AI بتاعك يجاوب، بيبص على جدول زي ده في المخزن الذكي عشان يعرف السياق: مين اللي بيسأل (`currentUser`) وفاتح أنهي صفحة (`currentPath`). التصميم الصح للجدول ده بيخلّي الـ AI بتاعك 'ذكي سياقيًا' (context-aware) وبيديله ذاكرة قصيرة المدى.",
      label: "من المنصة — صفحة /system-state",
    },
  },
  {
    icon: BookOpen,
    eyebrow: "المصطلحات الأساسية",
    title: "الـ Schema: الرسم الهندسي لذاكرة الـ AI",
    block: {
      kind: "concepts",
      items: [
        {
          term: "المخزن الذكي (Database)",
          meaning:
            "الأرشيف اللي بنشيّل فيه كل حاجة تخص التطبيق بتاعك: معلومات المستخدمين، محادثاتهم مع الـ AI، وكل البيانات اللي الـ AI بيحتاجها عشان يشتغل.",
          example:
            "لما عميل يسأل الـ AI سؤال، المحادثة دي بتتخزن في جدول جوه المخزن الذكي.",
        },
        {
          term: "Schema",
          meaning:
            "الرسم الهندسي أو الخريطة اللي بتوصف كل جدول في المخزن الذكي: عواميده إيه، نوع البيانات في كل عامود، وإيه القواعد اللي بتحكمه.",
          example:
            "الـ Schema بيقول: جدول 'المحادثات' فيه عامود 'تقييم_المستخدم' وده لازم يكون رقم صحيح بين 1 و 5 ومينفعش يبقى فاضي.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "شوف بعينك: تصميم جدول لذاكرة الـ AI",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تبني جدول يخزّن محادثات المستخدمين مع الـ AI بتاعك صح، وإيه أهمية الـ timestamp عشان تعرف تطوّر أداء الـ AI مع الوقت.",
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
          question:
            "بتعمل جدول للمستخدمين اللي هيكلموا الـ AI بتاعك. إيه أحسن نوع داتا تستخدمه لـ `id` بتاع كل user؟",
          options: [
            "uuid، لأنه فريد على مستوى العالم، آمن، ومحدش يقدر يخمّنه.",
            "integer، لأنه أسرع في البحث ومناسب للأرقام اللي ورا بعض.",
            "text، عشان أقدر أدخل أي رمز أو حرف كـ id.",
          ],
          correctIndex: 0,
          explanation:
            "الـ uuid هو الاختيار الأفضل للـ IDs العامة زي بتاعة المستخدمين. بيخلّي السيستم بتاعك آمن أكتر عشان أرقام الـ IDs مش متسلسلة، وبيضمن إن مفيش اتنين users هياخدوا نفس الـ ID حتى لو شغال على كذا سيرفر.",
        },
        {
          id: "apply2",
          bloom: "apply",
          question:
            "عندك جدول للخدمات اللي الـ AI بيقدمها (AI services)، وفيه عامود `price`. تختارله نوع إيه؟ وهل تسمح إنه يبقى فاضي؟",
          options: [
            "numeric و not null، عشان الفلوس لازم تبقى دقيقة ومينفعش خدمة من غير سعر.",
            "integer و nullable، يمكن السعر يكون رقم صحيح بس، وممكن خدمة تكون لسه متسعّرتش.",
            "text و not null، عشان يمكن السعر يتكتب بصيغة معينة فيها عملة زي '100 جنيه'.",
          ],
          correctIndex: 0,
          explanation:
            "الـ `numeric` هو النوع المخصص للفلوس عشان بيتعامل مع الكسور العشرية بدقة عالية. والمنطقي إنه يكون `not null` لأن كل خدمة معروضة للبيع لازم يكون ليها سعر.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question:
            "بتصمم جدول لمحادثات الـ AI مربوط بجدول المستخدمين. لما تمسح user، إيه المفروض يحصل للمحادثات بتاعته؟",
          options: [
            "المحادثات بتاعته تتمسح معاه أوتوماتيك (يمسحوا مع بعض - cascade)، عشان المخزن يفضل نضيف ومفيهوش داتا ملهاش صاحب.",
            "السيستم يرفض يمسح الـ user طالما لسه عنده محادثات (restrict).",
            "المحادثات تفضل موجودة بس خانة الـ user_id بتاعتها تبقى فاضية (set null).",
          ],
          correctIndex: 0,
          explanation:
            "الأفضل هنا هو الـ cascade delete. لما الـ user يتمسح، محادثاته القديمة مبتكونش ليها لازمة، فمسحها معاه بيحافظ على المخزن الذكي نضيف ومنطقي، وبيمنع وجود داتا 'يتيمة' ملهاش صاحب.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك: ابنِ ذاكرة الـ AI",
    title: "صلّح تصميم مخزن المعرفة للـ AI",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "ده schema لجدول هيخزّن الملفات اللي الـ AI بتاعك هيقرأها عشان يجاوب على أسئلة العملاء (نظام RAG). بس التصميم ده هيخلي الـ AI بطيء ومش دقيق. مهمتك تصلحه.",
      prompt:
        "**الـ Schema الغلط:**\n- `title`: text\n- `content`: text\n- `source`: text\n- `last_updated`: text\n\n**مهمتك:**\nاكتب الـ Schema الصح، مستخدمًا الأنواع والقواعد اللي اتعلمتها. فكّر في:\n1.  أنواع البيانات الصح (للتواريخ، ولعدّ الكلمات).\n2.  إيه الخانات اللي مينفعش تبقى فاضية (not null).\n3.  إيه الأعمدة الأساسية اللي ناقصة عشان الجدول يبقى جاهز للاستخدام الفعلي (زي الـ id).",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "تصليح الأنواع والقواعد",
          weight: 70,
          criteria: [
            "استخدم `text not null` للـ title والـ content.",
            "استخدم `timestamptz` مع `default now()` لعامود `created_at`.",
            "استخدم `timestamptz` لعامود `updated_at`.",
            "ضاف عامود `token_count integer` عشان يحلل حجم الملفات.",
          ],
        },
        {
          label: "إضافة أعمدة أساسية (Audit)",
          weight: 30,
          criteria: [
            "ضاف `id uuid primary key` عشان كل ملف يبقى له هوية فريدة.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "مثال من قلب Lovable",
    title: "إزاي جدول بسيط بيخلي تجربة تعلمك 'ذكية'",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "جدول lesson_progress = أساس التخصيص",
      summary:
        "جدول `lesson_progress` اللي بيسجل انت خلصت إيه، هو أبسط مثال عملي على التصميم الصح. 6 عواميد بس بيخلونا نتابع تقدّمك. البيانات دي هي اللي بتخلينا نرشح لك الدروس الجاية، وفي المستقبل، هي اللي هتخلي أي AI مساعد في المنصة يفهم إنت واقف فين بالظبط.",
      bullets: [
        "الـ `user_id` مع الـ `lesson_id` بيعملوا مع بعض مفتاح فريد (unique constraint) عشان نضمن إنك متسجلش نفس الدرس مرتين.",
        "عامود الـ `status` نوعه متحدد (enum) عشان يقبل قيم معينة بس: 'not-started', 'in-progress', 'completed'. ده بيمنع الأخطاء.",
        "البيانات دي هي الخطوة الأولى عشان نبني AI Tutor مخصوص ليك، بيقترح عليك مهام ومشاريع على قد مستواك بالظبط.",
      ],
      pathAngle: "builder",
      link: { label: "افتح الـ Dashboard وشوف تقدّمك", href: "/dashboard" },
    },
  },
];