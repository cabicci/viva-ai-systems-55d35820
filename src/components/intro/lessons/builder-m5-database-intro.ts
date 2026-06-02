import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import databaseScreenshot from "@/assets/lessons/builder-m5-database-intro.jpg";

/**
 * Builder · M5 · Lesson 03 — Database: مكان البيانات
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 *
 * يقفل M5 (Frontend → Backend → Database) ويمهد لـ M6 (Pages & Components).
 */
export const BUILDER_M5_DATABASE_INTRO_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "Database: المكان اللي البيانات بتعيش فيه فعلاً",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الـ Frontend بيعرض. الـ Backend بيشتغل. طب البيانات نفسها بتتخزّن فين؟",
        "الذاكرة المؤقتة (RAM) بتموت لما السيرفر يقفل. لازم مكان دائم.",
        "ده الـ Database — ثالث ضلع في أي app حقيقي.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "مصطلحات الدرس",
    title: "اللي هتسمعه في الدرس ده",
    block: {
      kind: "concepts",
      items: [
        { term: "Schema", meaning: "خريطة أو \"رسمة\" بتحدد شكل الجداول والبيانات هتمشي إزاي.", example: "زي ما المحاسب بيعمل \"دفتر يومية\" فيه خانة للتاريخ والسعر، دي خريطة البيانات." },
        { term: "Primary Key", meaning: "كود مميز لكل سطر، مستحيل يتكرر عشان نعرف نوصل للبيان.", example: "زي رقم البطاقة للعميل، ما ينفعش اتنين يكون ليهم نفس الرقم في السيستم." },
        { term: "Foreign Key", meaning: "مفتاح بيوصل جدول بجدول تاني عشان نربط البيانات ببعض.", example: "رقم موبايل العميل \"Foreign Key\" في جدول الفواتير عشان نعرف الفاتورة دي تخص مين." },
        { term: "Nullability / Null", meaning: "يعني الخانة مسموح تكون \"فاضية\" مش مكتوب فيها أي حاجة.", example: "لو بتسجل بيانات عميل ومعاكش رقم بيتهم، بتسيب الخانة Null يعني فاضية مؤقتاً." },
        { term: "SQL", meaning: "لغة بسيطة بنطلب بيها من قاعدة البيانات تنفذ أوامر معينة.", example: "بتكتب أمر بسيط زي \"هات لي كل المبيعات اللي تمت النهاردة\"، والبرنامج بينفذ." },
        { term: "Table", meaning: "مكان جوه قاعدة البيانات بنرص فيه البيانات في جداول منظمة.", example: "زي شيت الإكسيل اللي فيه أسماء العملاء، متقسم صفوف وأعمدة." },
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "قبل ما تكمّل",
    title: "الكود في الدروس الجاية مرجع — مش امتحان",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "🛑 وقفة مهمة قبل ما تكمّل — اقراها مرة واحدة وانساها:",
        "هتشوف من هنا لآخر المسار كود (SQL، JavaScript، تعريفات تقنية). الكود ده **مش مطلوب منك تحفظه ولا تكتبه ولا حتى تفهمه سطر سطر**. وجوده هنا زي ما الدكتور بيريك أشعة عشان تطمن — مش عشان تشخّص بنفسك.",
        "Lovable هي اللي بتكتب الكود ده لك. شغلك إنك تفهم **الفكرة** اللي تحت الكود (إيه اللي بيحصل وليه)، مش الـ syntax. لو الكود رعبك — تخطّاه واقرا الشرح اللي حواليه. هتلاقي نفس المعنى بكلام بشري.",
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج الأول",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption: "إيه هو الـ Database، وليه الـ RAM مش كفاية، وإمتى تحتاج جدول جديد.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Database = جدول منظّم بيتقرا بـ SQL",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Database (قاعدة بيانات) = برنامج متخصّص في تخزين بيانات منظّمة بشكل دائم. الفرق بينه وبين ملف Excel: بيدير ملايين السطور، بيحمي البيانات لو السيرفر وقع، وبيسمح لكذا مستخدم يقروا/يكتبوا في نفس الوقت من غير ما البيانات تتلخبط.",
        "أشهر نوع هو Relational Database (PostgreSQL، MySQL). البيانات بتتحط في Tables — كل جدول له Columns (أعمدة بنوع محدّد: نص، رقم، تاريخ) و Rows (سطور = سجلات فعلية). مثلاً جدول users فيه columns: id، email، created_at.",
        "بتكلّمه بلغة اسمها SQL: SELECT (هات)، INSERT (ضيف)، UPDATE (عدّل)، DELETE (امسح). الـ Backend (M5.2) هو اللي بيكتب الـ SQL — مش الـ Frontend. الـ Frontend بينادي API، الـ API بيعمل query على الـ Database، يرجّع JSON للـ Frontend.",
        "نقطة أمان حرجة: مين له حق يقرأ/يكتب إيه؟ ده اسمه Row Level Security (RLS). كل مستخدم المفروض يشوف بياناته هو بس — مش بيانات حد تاني. هنرجع لها بالتفصيل في M7.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "كل رقم في اللوحة جاي من Database",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: databaseScreenshot,
      alt: "صفحة /dashboard — كروت إحصائيات (Introduction 4/0، 18/0 دروس مكتملة، 0 يوم سلسلة)، وكروت تقدم لكل مسار (Introduction 0/4، Builder 0/12، Creator 0/2)",
      caption:
        "كل رقم شايفه على الشاشة دي مش mockup — جاي من Database حقيقي. \"مرحبًا، صديقي\" جاي من جدول profiles (column: display_name). \"4 / 0\" يعني فيه 4 دروس متاحة و0 مكتملة (جدول lesson_completions، WHERE user_id = me). \"0 يوم — السلسلة\" نتيجة query بيحسب الفرق بين تواريخ آخر دروس مكتملة. شريط التقدم \"0/12\" في Builder = COUNT من جدول lessons WHERE module IN builder. لو فتحت الصفحة من جهاز تاني هتلاقي نفس الأرقام بالظبط — لأنها مش متخزّنة في الـ Frontend، متخزّنة في الـ Database.",
      label: "من الموقع — صفحة /dashboard",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "غلطة المبتدئ: تخزّن البيانات في المكان الغلط",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — تخزّن في الـ Frontend (localStorage / state)",
        body: "\"خلاص هحفظ تقدّم المستخدم في localStorage بتاع المتصفح.\" المشكلة: لو فتح من جهاز تاني → التقدم اختفى. لو مسح cache → اختفى. لو غيّر متصفح → اختفى. مفيش backup، مفيش analytics، مفيش حماية. localStorage مكانه بيانات مؤقتة فقط (مثلاً تفضيل الـ theme).",
      },
      right: {
        label: "RIGHT — أي بيانات لازم تعيش = Database",
        body: "أي حاجة المفروض المستخدم يلاقيها بكرة، أو على جهاز تاني، أو إنت كصاحب التطبيق محتاج تشوفها → Database. التقدم، الرسائل، الإعدادات، الاشتراكات. القاعدة: \"هل لو السيرفر اتقفل وفتح تاني، البيانات دي لازم تكون لسه موجودة؟\" لو الإجابة آه → Database.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "ارسم Schema لأول جدول في تطبيقك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m5-database-intro-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "إنت شغال على تطبيق جديد لـ 'قائمة مهام' وعايز تعمل أول جدول تخزّن فيه المهام دي. بما إن كل مستخدم له مهامه الخاصة بيه، إيه أهم عمود لازم تحطه في الجدول ده عشان نربط المهمة بصاحبها؟",
          options: [
            "task_name (text)",
            "due_date (date)",
            "user_id (uuid)"
          ],
          correctIndex: 2,
          explanation: "user_id هو اللي بيربط المهام بالمستخدم اللي عملها، وده ضروري عشان كل مستخدم يشوف مهامه بس، زي ما شرحنا في الـ Row Level Security."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "لو بتصمم جدول لـ 'الملاحظات' (notes) في تطبيقك، وإنت عايز الملاحظة دي تكون ليها عنوان، ومحتوى، وتاريخ إنشاء. إيه أهم عمودين منهم ماينفعش يكونوا فاضيين (not nullable) عشان الملاحظة تكون مفيدة وتتسجل صح في الـ database؟",
          options: [
            "title (text) و created_at (date)",
            "content (text) و is_private (boolean)",
            "title (text) و category (text)"
          ],
          correctIndex: 0,
          explanation: "عنوان الملاحظة وتاريخ إنشائها أساسيين عشان نقدر نميّز الملاحظة دي ونعرف إتعملت إمتى. لو مش موجودين، إيه فايدة الملاحظة؟"
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "تطبيقك عامل زي 'سجل عادات يومية'. لما مستخدم جديد بيسجل دخول من جهاز تاني، إزاي الـ database هتعرف ترجعله العادات اللي كان مسجلها قبل كده بالظبط؟",
          options: [
            "عن طريق الـ id بتاع كل habit",
            "باستخدام الـ user_id اللي كل habit مرتبطة بيه",
            "عن طريق الـ created_at بتاع كل habit"
          ],
          correctIndex: 1,
          explanation: "الـ user_id هو المفتاح اللي بيربط كل سجل (ملاحظة، مهمة، عادة) بالمستخدم بتاعه، ففيه بنقدر نجيب كل البيانات الخاصة بيه."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "ارسم Schema ابتدائية لـ ٣ tables",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Database = حقيقة المشروع. هترسم ٣ tables بـ columns وعلاقات وnullability.",
      prompt:
        "لكل table من ٣ اكتب:\n\nTable: [name]\n- Columns: [name + type + nullable?]\n- Primary key:\n- Foreign keys (لو فيه):\n- ٢ سيناريوهات استخدام (مين بيكتب فيها / مين بيقرأ منها):\n\nفي الآخر: ارسم العلاقة بين الـ ٣ tables (one-to-many / many-to-many) بالـ ASCII أو نصي.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "٣ tables بـ types صحيحة",
          weight: 60,
          criteria: [
            "كل column ليها type (text/uuid/timestamp...).",
            "Primary keys + foreign keys محددين.",
          ],
        },
        {
          label: "العلاقات + الاستخدام",
          weight: 40,
          criteria: [
            "العلاقات بين الـ tables موصوفة بدقة (1:N / N:M).",
            "سيناريوهات الاستخدام حقيقية مش «المستخدم يقرأ».",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "تقدّمك في كل درس متخزّن في PostgreSQL",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "تقدّمك في كل درس متخزّن في PostgreSQL",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. كل لما تخلص درس، صف جديد بيتحط في جدول lesson_progress. كل عَلَامة ✓ بتشوفها في /dashboard أصلها صف في database. ده اللي بنشرحه: البيانات بتعيش في tables.",
      bullets: [
        "جدول lesson_progress: user_id + lesson_id + status + timestamp.",
        "RLS policies بتضمن إنك تشوف بياناتك إنت بس.",
        "افتح /dashboard — كل ✓ هناك = SELECT statement شغّال خلف الستار.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /dashboard", href: "/dashboard" },
    },
  }
];
