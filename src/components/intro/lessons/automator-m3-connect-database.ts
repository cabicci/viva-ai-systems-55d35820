import {
  Database,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import automatorM3ConnectDatabaseScreenshot from "@/assets/lessons/unique/automator-m3-connect-database.jpg";
/**
 * Automator · M3 · Lesson 01 — وصّل الـ DB من Builder
 */
export const AUTOMATOR_M3_CONNECT_DATABASE_BLOCKS: IntroLessonContent = [
  {
    icon: Lightbulb,
    eyebrow: "تنبيه: درس تقني",
    title: "ده درس متقدّم — اتخطّاه لو لسه في البداية",
    tone: "accent",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الدرس ده فيه مفاهيم تقنية للناس اللي شغّالة فعلاً على n8n. لو لسه بتتعلم الأساسيات، تقدر تعدّيه دلوقتي وترجعله بعدين — مش هيأثر على باقي رحلتك.",
        "لو فاهم الأساسيات وعايز تعمّق، يلا نكمل.",
      ],
    },
  },
  {
    icon: Database,
    eyebrow: "HERO",
    title: "وصّل الـ Automation بالـ Database",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الـ workflow بقى يقدر يقرا ويكتب",
        "في نفس الـ DB بتاعت منتجك.",
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
        { term: "Schema (التقسيمة)", meaning: "الخريطة أو \"التقسيمة\" اللي بتحدد شكل الجداول والبيانات جوه الداتا.", example: "زي لما تقسم دفتر الحسابات خانات: اسم العميل، التاريخ، والمبلغ المدفوع." },
        { term: "Native vs API", meaning: "الـ Native إضافة جوه السيستم نفسه، والـ API وسيط بيكلم داتا بعيدة.", example: "زي لما تروح تطلع بضاعة بنفسك (Native) أو تبعت مندوب شركة شحن يجيبها لك (API)." },
        { term: "Connection String", meaning: "زي \"لينك\" طويل فيه عنوان ومفتاح الداتا عشان البرنامج يفتحها.", example: "زي \"عقد الإيجار\" اللي فيه العنوان والمفتاح عشان البرنامج يوصل للداتا." },
        { term: "RLS (Security Rules)", meaning: "قواعد أمان بتحدد لكل موظف يشوف إيه ومايشوفش إيه في الداتا.", example: "زي ما تدي للمحاسب صلاحية يشوف \"أرقام المبيعات\" بس، وميشوفش \"أرباح الشركة\" الإجمالية." },
        { term: "Service Role Key", meaning: "مفتاح سري فيه صلاحيات المدير الكبير، بيعدي من أي حماقية أو قيود.", example: "زي \"مفتاح الخزنة\" اللي مع صاحب الشغل، بيفتح كل حاجة وممنوع حد غيره يشيله." },
        { term: "Queue (الطابور)", meaning: "طابور بينظم الشغل لما الطلبات تزيد فجأة عشان السيستم ميهنجش.", example: "لو جالك 100 أوردر مرة واحدة، بتحطهم في \"نوتة\" وتنفذهم بالترتيب عشان متنساش حد." },
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
      caption: "إزاي تربط Make/n8n بالـ DB بتاعت Builder بأمان.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "3 طرق لربط DB",
    block: {
      kind: "numberedList",
      items: [
        "Native Module — لو الأداة فيها module جاهز لـ Supabase/Postgres، استخدمه. بسيط وآمن.",
        "HTTP + REST API — تستدعي endpoints الـ DB مباشرة بـ Service Role Key. مرن جدًا.",
        "Webhook من الـ DB — الـ DB نفسها بتبعت إشارة (Database Webhook) للـ workflow لما حاجة تتغيّر.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "الـ DB بتاعتنا",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM3ConnectDatabaseScreenshot,
      alt: "سكرين شوت من المنصة",
      caption:
        "المنصة دي كلها بياناتها (مستخدمين، تقدّم في الدروس، notes) في DB واحدة. لو عايز أبني automation بتبعت تنبيه لمّا حد يخلّص مسار كامل، الـ workflow هيقرا من نفس الـ DB دي، بنفس الـ keys اللي اتعلّمتها في Builder M5.",
      label: "من المنصة — مقدمة الـ DB في Builder",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "إزاي تأمّن الاتصال",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — Service Key في الـ workflow على المكشوف",
        body: "بتلصق الـ key في node عادي. لو حد فتح الـ scenario يقدر يشوفه. ولو الـ workflow اتشارك كـ template، الـ key اتسرّب لكل الناس.",
      },
      right: {
        label: "RIGHT — Connection محفوظ كـ Credential",
        body: "بتعرّف الـ connection مرة واحدة كـ Credential مشفّر، والـ nodes بتشاور عليه باسم. الـ key نفسه ميظهرش في أي export.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اعمل أول read query",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m3-connect-database-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "مديرك طلب منك تعمل workflow عشان تبعت إيميلات تهنئة للعملاء الجداد كل يوم الصبح. بيانات العملاء موجودة في جدول 'customers_new' في الـ DB بتاعتكم. إيه أنسب طريقة توصل بيها الـ workflow ده بالـ DB؟",
          options: [
            "أستخدم الـ module الجاهز بتاع Supabase/Postgres لو متوفر في أداة الـ Automation.",
            "أستخدم الـ HTTP + REST API عشان أبعت queries للـ DB بـ Service Role Key.",
            "أفعل Database Webhook في الـ DB عشان تبعت للـ workflow تلقائي."
          ],
          correctIndex: 0,
          explanation: "الـ Native Module هو الأبسط والأكثر أمانًا لو متاح، وبيخلي الشغل على الـ DB مباشر وسهل من غير ما تحتاج تكتب أكواد كتير أو تقلق من تفاصيل الـ APIs."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "فيه جدول 'orders' في الـ DB، وعايز أول ما أي طلب جديد يتضاف، الـ workflow يبعت إشعار للمخزن. إيه أنسب طريقة تعمل بيها ده بأقل تدخل يدوي؟",
          options: [
            "أعمل Schedule في الـ workflow عشان يقرا الجدول كل دقيقة ويشوف لو فيه طلبات جديدة.",
            "أستخدم Database Webhook يتبعت من الـ DB للـ workflow لما الطلب يتضاف.",
            "أستدعي الـ DB بـ HTTP requests كل شوية عشان أتحقق من التغييرات."
          ],
          correctIndex: 1,
          explanation: "الـ Database Webhook هو الأنسب للحالة دي عشان بيخلي الـ DB تبعت إشارة للـ workflow تلقائي أول ما يحصل تغيير، وده أسرع وأكفأ من إن الـ workflow يفضل يستعلم عن التغييرات باستمرار."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "الشركة بتاعتك محتاجة تعمل تقرير يومي عن 'أكثر 10 منتجات مبيعًا' من الـ DB، والتقرير ده بيتعمل بـ query معقد. إيه اللي المفروض تعمله عشان تضمن إن الـ workflow يقدر ينفذ الـ query ده؟",
          options: [
            "أُضمن إن الـ Connection String اللي بستخدمه صح وموجه للـ DB الصح.",
            "أستخدم Service Role Key عشان أضمن إن الـ workflow له صلاحية ينفذ الـ query ده ويتجاوز الـ RLS.",
            "أركز على إني أخلي الـ workflow يقرا 5 صفوف بس من أي جدول عشان أتأكد إن الاتصال شغال."
          ],
          correctIndex: 1,
          explanation: "الـ Service Role Key ضروري هنا عشان يدي صلاحيات إدارية للـ workflow ويتجاوز الـ RLS، وده يضمن إن الـ workflow يقدر ينفذ الـ query المعقد ده من غير مشاكل صلاحيات."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم Workflow بيكتب وبيقرأ من Database",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "DB في الـ workflow = Memory للـ automation. هتصمم flow بيكتب + يقرأ + يحدّث.",
      prompt:
        "في تسليمك:\n\n١) Use case + الـ table اللي هتشتغل عليه (اسم + ٤-٥ columns):\n٢) Insert flow — إمتى بنضيف row؟ من فين الـ data؟\n٣) Read flow — إمتى بنقرأ؟ بـ ايه condition؟ (WHERE clause)\n٤) Update flow — إمتى بنحدّث؟ ايه الـ trigger؟\n٥) Duplicate prevention — إزاي هتمنع تكرار row؟ (unique constraint / upsert / check قبل insert)\n٦) لو الـ DB ضربت، الـ workflow يعمل إيه؟ (retry / queue / fail silently)",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "CRUD operations واضحة",
          weight: 60,
          criteria: [
            "Insert/Read/Update كلهم متعرّفين بـ trigger وdata.",
            "Schema بسيط فيه ٤-٥ columns بأنواع.",
          ],
        },
        {
          label: "Duplicates + Failures",
          weight: 40,
          criteria: [
            "Duplicate prevention بآلية حقيقية مش «هتأكد».",
            "Failure handling بخطة فعلية مش «هيرسل error».",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "كل serverFn بتتكلم مع PostgreSQL",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل serverFn بتتكلم مع PostgreSQL",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Automator — نفس اللي بتتعلمه. serverFn = code python بيشغّل queries على PostgreSQL. الـ Automation الحقيقية هي إن كل request من frontend بيمر على layer واحد بـ business logic + DB connection — مش بنفتح connections كل مرة.",
      bullets: [
        "Pooled connections من Supabase — مفيش overhead.",
        "كل serverFn بياخد supabase client من middleware.",
        "Queries كلها typed بـ TypeScript من types.ts.",
      ],
      pathAngle: "automator",
      link: { label: "افتح /system-state", href: "/system-state" },
    },
  }
];
