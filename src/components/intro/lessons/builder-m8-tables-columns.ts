import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import tablesScreenshot from "@/assets/lessons/builder-m8-tables-columns.jpg";

/**
 * Builder · M8 · Lesson 01 — Tables & Columns
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 *
 * يبني على M5.3 (Database مفهوم) و M7.2 (RLS) — دلوقتي بنتعمّق في تصميم الجداول.
 */
export const BUILDER_M8_TABLES_COLUMNS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "الجدول هو وحدة البناء — صمّمه صح من الأول",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "في M5.3 شفت إن الـ Database = جداول.",
        "النهارده هتتعلّم إزاي تصمّم جدول واحد بشكل صح: إيه أنواع البيانات، إيه القواعد، وإيه أكتر غلط بيخرّب التطبيق بعد أشهر.",
        "تصميم جدول وحش = ألم لكل حد هيشتغل على المشروع بعدك (وأنت كمان).",
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
        { term: "Primary Key (PK)", meaning: "البصمة اللي بتميز كل سطر في الجدول ومبتتكررش أبداً.", example: "زي رقم البطاقة أو كود الصنف، مستحيل يتكرر لعميلين مختلفين." },
        { term: "snake_case", meaning: "طريقة كتابة أسماء العواميد باستخدام \"شرطة تحتية\" بدل المسافة.", example: "لو بتسجل أسماء الأصناف، بلاش تسيب مسافات، اكتبها كده: item_price عشان السيستم ميهنجش." },
        { term: "UUID", meaning: "كود طويل ومعقد جداً بنستخدمه كمعرف فريد بدل الكلام العادي.", example: "بدل ما تكتب \"الإسكندرية\"، السيستم بيديله كود طويل ومعقد يضمن إنه عالمي ومبيغلطش." },
        { term: "Schema", meaning: "رسمة بتوضح تقسيم الجدول، عواميده إيه، ونوع كل بيان فيها.", example: "زي لما توصف \"تاريخ الأوردر\"، \"اسم العميل\"، و\"سعر القطعة\"." },
        { term: "Bottleneck", meaning: "عنُق الزجاجة، يعني حتة في السيستم بتخلي الشغل يبطأ ويقف.", example: "لما تطلب تقرير مبيعات سنة والسيستم يلف كتير، يبقى فيه زحمة بيانات معطلاه." },
        { term: "Audit Trail", meaning: "نظام مراقبة بيسجل كل حركة أو تعديل حصل في البيانات.", example: "زي سجل \"مين عدل سعر المنتج ده والساعة كام\" عشان تحاسب الموظفين." },
        { term: "JSONB", meaning: "نوع بيانات بيشيل معلومات كتير ومرنة جوه خانة واحدة.", example: "زي مخزن فيه \"وصف المنتج\" بخصايص كتير متغيرة (لون، مقاس، خامة)." },
        { term: "Cascade Delete", meaning: "تأثير الدومينو؛ لما تمسح حاجة، كل اللي مربوط بيها بيتمسح.", example: "لو مسحت \"عميل\"، السيستم بيمسح كل \"فواتيره\" معاه أوتوماتيك عشان الدنيا متنكشش." },
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
      caption: "إزاي تختار نوع كل column، فين تستخدم nullable، وليه primary key مش مجرد رقم.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Column = نوع + قاعدة + قيمة افتراضية",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل column في الجدول له تعريف من ٤ أجزاء: الاسم (snake_case، مثلاً user_id) — النوع (uuid، text، integer، boolean، timestamp، jsonb) — القيد (nullable أو not null) — القيمة الافتراضية (default). الـ ٤ بيقرّروا سلوكه.",
        "أنواع شائعة لازم تعرفها: uuid (للـ ids — أحسن من integer لأنه فريد عالميًا، آمن، مش هيتنبأ بيه)، text (نصوص بأي طول)، integer/bigint (أرقام صحيحة)، numeric (أرقام بفواصل عشرية، للأموال)، boolean (true/false)، timestamptz (تاريخ ووقت بـ timezone)، jsonb (object كامل في عمود).",
        "Primary Key = العمود اللي بيميّز كل سطر. الأفضل: id uuid primary key default gen_random_uuid(). Foreign Key = column بيشاور على primary key في جدول تاني (مثلاً user_id uuid references users(id) on delete cascade). الـ cascade مهم — لو المستخدم اتمسح، tasks بتاعته تتمسح معاه تلقائيًا.",
        "أعمدة Audit لازمة في كل جدول جدّي: id (PK)، created_at (timestamptz default now())، updated_at (timestamptz). بيخلّوك تجاوب على \"إمتى ده اتعمل؟\" و \"إمتى آخر تعديل؟\" — أسئلة هتجيلك بعد أسبوع من الـ launch.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "كل سطر في الـ Runtime Context = صف من جدول",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: tablesScreenshot,
      alt: "صفحة /system-state — كروت Paths 6، Live Lessons 85/18، Routes 12، وتحت Runtime Context Layer كروت currentPath، currentRoute=system-state/، currentUser=guest",
      caption:
        "الصفحة دي بتعرض حالة المنصة بشكل بيشبه صف من جدول. شوف الـ \"Runtime Context Layer\": كل بطاقة (currentPath، currentRoute، currentUser) تشبه column في جدول واحد، والقيم اللي تحتها (—، system-state/، guest) تشبه السطر اللي يخصّك دلوقتي. لو الجدول ده اتخزّن في DB، التعريف هيكون: current_path text nullable, current_route text not null, current_user text default 'guest'. الكروت العلوية (Paths=6, Lessons=85/18, Routes=12) دي نتيجة COUNT أو aggregate من جداول تانية. كل رقم هنا بيرجع لـ schema قرار اتاخد لما الجداول اتعملت في الأول.",
      label: "من الموقع — صفحة /system-state",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "غلطات تصميم بتدفع تمنها بعد ٦ شهور",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — كل حاجة text، مفيش defaults، مفيش audit",
        body: "اعمل الجدول بسرعة: name text، age text، price text، items text (هحط جوّاه list مفصول بفواصل). كل حاجة nullable عشان \"يمكن نحتاج\". مفيش created_at. النتيجة: query سهل بيبقى مستحيل (إزاي تعمل sort بـ price لو هي text \"99.5\"؟)، تقارير غلط، الـ cascade مش شغّال، ومحدش يعرف إمتى البيانات اتدخلت.",
      },
      right: {
        label: "RIGHT — أنواع صح + audit columns + قيود ضرورية",
        body: "id uuid PK default gen_random_uuid()، user_id uuid references users(id) on delete cascade، title text not null، price numeric(10,2) not null، tags text[] (مصفوفة حقيقية)، metadata jsonb default '{}'، is_published boolean default false، created_at timestamptz default now()، updated_at timestamptz default now(). دلوقتي تقدر تـ sort/filter/aggregate صح، والـ DB بنفسه بيرفض البيانات الناقصة — مش بتعتمد على Frontend.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "ارفع schema اللي عملته في M5.3 لمستوى production",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m8-tables-columns-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "أنت شغال على database لـ 'App' جديد بيسجل بيانات المستخدمين. محتاج تعمل عمود لـ 'id' بتاع كل user. إيه أحسن نوع بيانات تستخدمه وليه؟",
          options: [
            "uuid، لأنه فريد عالميًا ومش هيتنبأ بيه وسهل ربطه بأي نظام تاني.",
            "integer، لأنه أسرع في البحث ومناسب للأرقام المتسلسلة.",
            "text، عشان أقدر أدخل أي رمز أو حرف كـ id."
          ],
          correctIndex: 0,
          explanation: "الـ uuid أحسن من integer لـ ids المستخدمين لأنه بيضمن تفرد عالمي وبيزود الأمان لأنه مش متسلسل، وده بيخليه صعب التنبؤ بيه."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "عندك جدول للمنتجات في متجر إلكتروني. لكل منتج في عمود 'price'. إيه المفروض يكون نوع العمود ده، وهل ينفع يكون not null؟",
          options: [
            "numeric not null، عشان نقدر نحط فيه أرقام بـ فواصل عشرية (فلوس) وميصحش المنتج ملوش سعر.",
            "integer nullable، عشان ممكن يكون منتج لسه تحت التسعير وممكن السعر يكون رقم صحيح بس.",
            "text not null، عشان يمكن السعر يتكتب بصيغة معينة فيها عملة."
          ],
          correctIndex: 0,
          explanation: "الـ numeric هو النوع المناسب للمبالغ المالية لأنه بيتعامل مع أرقام بفواصل عشرية بدقة، والـ 'not null' منطقي لأن المنتج لازم يكون ليه سعر."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "لو بتصمم جدول للمهام (tasks) وعاوز تربط كل مهمة بمستخدم معين (user_id). إيه اللي يحصل لما المستخدم ده يتمسح من الجدول الرئيسي؟",
          options: [
            "cascade، بحيث كل المهام المرتبطة بالمستخدم ده تتمسح معاه تلقائيًا عشان الداتا متتراكمش وتفضل نظيفة.",
            "restrict، بحيث يمنع مسح المستخدم طالما لسه فيه مهام مرتبطة بيه.",
            "set null، بحيث الـ user_id في المهام بتاعته يبقى null ويتم الحفاظ على المهمة بس من غير ربط بمستخدم."
          ],
          correctIndex: 0,
          explanation: "الـ 'on delete cascade' هو الأنسب هنا. لما المستخدم يتمسح، المفروض المهام اللي كان مسئول عنها تتأثر، ومسحها 'cascading' بيحافظ على نظافة قاعدة البيانات وبيمنع وجود بيانات مالهاش صاحب."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم Schema لتطبيق حقيقي (٤+ tables)",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Schema سليم = نص المشروع. هترسم ٤+ tables بكل التفاصيل لتطبيق حقيقي من بالك.",
      prompt:
        "اختار تطبيق (Marketplace / SaaS / Community...) واكتب:\n\nلكل table:\n- Name + وصف:\n- Columns: name | type | nullable? | default? | unique?\n- Indexes (لو فيه):\n- Relations مع tables تانية:\n\nفي الآخر:\n- ايه أكبر قرار صعب اخدته في الـ Schema ولِيه؟\n- لو الـ data كبرت ١٠٠ مرة، فين هيكون الـ bottleneck؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "٤+ tables بـ schema كامل",
          weight: 60,
          criteria: [
            "كل column عندها type + nullable + sensible default.",
            "Relations محددين بأسماء FK واضحة.",
          ],
        },
        {
          label: "قرار + Bottleneck",
          weight: 40,
          criteria: [
            "شرحت قرار محدد مش «اخترت uuid».",
            "Bottleneck معه سبب تقني (index / join / N+1).",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "جدول lesson_progress = أبسط مثال تطبيقي",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "جدول lesson_progress = أبسط مثال تطبيقي",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. أبسط جدول في المنصة: 6 أعمدة بس — id, user_id, lesson_id, status, created_at, updated_at. ده كل اللي محتاجينه عشان نتابع تقدّمك. ميغرّك بكتر أعمدة من الأول.",
      bullets: [
        "user_id + lesson_id = composite key منطقي (unique constraint).",
        "status = enum (not-started / in-progress / completed).",
        "بدأنا بـ 4 أعمدة، زوّدنا 2 لما احتجناهم — مش العكس.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /dashboard", href: "/dashboard" },
    },
  }
];
