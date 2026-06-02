import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import relationsDiagram from "@/assets/lessons/concepts/relations-diagram.jpg";

/**
 * Builder · M8 · Lesson 02 — Relations بين الجداول
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 *
 * يبني على M8.1 (Tables & Columns) — دلوقتي بنوصّل الجداول ببعض.
 */
export const BUILDER_M8_RELATIONS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "البيانات مش بتعيش لوحدها — كل جدول مربوط بحاجة تانية",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "في M8.1 صمّمت جدول واحد بشكل صح. بس التطبيق الحقيقي = جداول كتير مربوطة ببعض.",
        "User عنده tasks. الـ task ليه tags. الـ tag ممكن يبقى على tasks كتير. الربط ده اسمه Relation.",
        "لو ربطت غلط، البيانات هتتكرر، الـ queries هتبقى بطيئة، ومستحيل تعدّل حاجة من غير ما تكسر حاجة تانية.",
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
        { term: "SQL", meaning: "اللغة أو الأوامر اللي بنكتبها عشان نكلم قاعدة البيانات.", example: "زي لغة الإشارة بينك وبين قاعدة البيانات عشان تفهمها إنت عاوز تخزن إيه أو تمسح إيه." },
        { term: "Foreign Key (FK)", meaning: "عمود في جدول بنسجل فيه ID جاي من جدول تاني عشان نربطهم.", example: "لو فاتح محل ملابس، الـ ID بتاع الزبون اللي بنحطه جنب الفاتورة بتاعته عشان نعرف تخص مين." },
        { term: "Index (فهرس)", meaning: "طريقة بتخلي قاعدة البيانات تلاقي المعلومة بسرعة من غير ما تدور في كله.", example: "زي \"نوتة\" المحصل، بدل ما يدور في كل الفواتير، بيروح لرقم الفاتورة علطول عشان ينجز وقت." },
        { term: "Cascade", meaning: "خاصية بتخلي أي تغيير أو مسح في جدول يسمّع لوحده في الباقي.", example: "لو مسحت اسم \"مورد\" من جدول الموردين، كل البضاعة بتاعته تتمسح أوتوماتيك من مخزنك." },
        { term: "Junction Table (الوسيط)", meaning: "جدول وسيط بنعمله عشان نربط حاجتين ببعض ليهم علاقة \"Many-to-Many\".", example: "لو بتبيع كورسات لطلاب، بنعمل \"جدول خناقة\" في النص نربط فيه ID الطالب مع ID الكورس." },
        { term: "UUID (الكود الفريد)", meaning: "كود طويل ومعقد بيستخدم كـ ID فريد عشان البيانات متدخلش في بعض.", example: "زي رقم البطاقة القومي، مستحيل يتكرر وصعب حد يخمنه، أضمن من الـ ID العادي." },
        { term: "Join (الربط)", meaning: "أمر بنستخدمه عشان نجمع بيانات من جدولين أو أكتر ونطلعهم مع بعض.", example: "لما تطلب كشف حساب بيجيب بياناتك من جدول العملاء مع تفاصيل معاملاتك من جدول الخزنة." },
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
      caption: "Foreign Keys، One-to-Many، Many-to-Many، وإمتى تستخدم كل واحد.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "٣ أنواع علاقات بس — لازم تعرفهم كويس",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "1) One-to-One (1:1): سطر في جدول A بيقابله سطر واحد في جدول B. مثال: user ↔ profile. بنعملها لما عايزين نقسّم بيانات حساسة (auth) عن بيانات عامة (profile). التنفيذ: profile.user_id uuid unique references users(id) on delete cascade.",
        "2) One-to-Many (1:N): سطر في A بيقابله كذا سطر في B. ده الأكتر شيوعًا. مثال: user → tasks (المستخدم عنده tasks كتير، بس كل task تخص مستخدم واحد). التنفيذ: tasks.user_id uuid references users(id) on delete cascade. الـ FK بيتحط في الجدول \"الكتير\" (tasks).",
        "3) Many-to-Many (N:M): سطر في A بيقابله كذا سطر في B والعكس. مثال: tasks ↔ tags (task ليه tags كتير، والـ tag على tasks كتير). مينفعش FK مباشر — لازم جدول وسيط (junction table): task_tags(task_id uuid references tasks(id) on delete cascade, tag_id uuid references tags(id) on delete cascade, primary key(task_id, tag_id)).",
        "قاعدة الـ ON DELETE: cascade (يتمسح معاه)، set null (يبقى null)، restrict (ارفض المسح). للـ user_id غالبًا cascade، للـ category_id غالبًا restrict (ميصحّش تمسح category لسه فيها products).",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "Foreign Keys: إزاي الجداول بتتربط ببعض",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: relationsDiagram,
      alt: "Diagram لـ 3 جداول: users و posts و comments، بتربطهم foreign keys (user_id, post_id) في علاقات one-to-many",
      caption:
        "الـ diagram ده بيوضّح علاقة جدولين أو أكتر. كل جدول له primary key (id فريد لكل سطر)، والـ foreign key في جدول تاني (زي posts.user_id) بيشاور على الـ id بتاع السطر المرتبط. ده اللي يخلّينا نقول \"الـ user ده عمل posts كذا\" بـ JOIN بسيط. الـ cascade بيخلّي لو مسحنا user، كل الـ posts والـ comments بتاعته تتمسح تلقائي — مفيش سطور يتيمة.",
      label: "Database Relations — كيف تتربط الجداول",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "تكرار البيانات vs ربطها صح",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — كل حاجة في جدول واحد، أو tags كنص مفصول بفواصل",
        body: "جدول tasks(id, user_email, user_name, user_avatar, title, tags). كل task بتعيد إيميل واسم المستخدم — لو غيّر اسمه، لازم تعدّل ١٠٠ سطر. وحقل tags = 'urgent,work,personal' كنص. النتيجة: مستحيل تـ filter بـ tag (كل WHERE بيبقى LIKE بطيء)، ومستحيل تعرف كل الـ tasks اللي عليها tag معيّن من غير full scan. أي تعديل في tag واحد = تحديث آلاف السطور.",
      },
      right: {
        label: "RIGHT — جداول منفصلة + FKs + junction للـ N:M",
        body: "users(id, email, name)، tasks(id, user_id references users(id) on delete cascade, title)، tags(id, name unique)، task_tags(task_id, tag_id, PK مركّب). دلوقتي: تغيير اسم المستخدم = سطر واحد. كل tasks اللي عليها tag 'urgent' = JOIN سريع باستخدام index على tag_id. مسح user = مسح كل tasks بتاعته تلقائيًا (cascade). البيانات مش بتتكرر، والـ DB بيضمن التماسك.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "ارسم Relations الـ schema بتاعك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m8-relations-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "شركة 'أكل بيتي' عايزة تعمل تطبيق طلبات. فيه جدول لـ 'المستخدمين' وجدول لـ 'المنتجات'. كل منتج بتضيفه بيتعمل بواسطة مستخدم واحد (الشيف اللي طبخه). المستخدم الواحد ممكن يعمل منتجات كتير. لو مستخدم اتمسح، إيه اللي المفروض يحصل للمنتجات اللي عملها؟",
          options: [
            "المنتجات بتاعته تتمسح أوتوماتيكي عشان ميبقاش فيه منتجات ملهاش صاحب.",
            "المنتجات بتاعته تفضل موجودة بس الـ user_id بتاعها يبقى فاضي (NULL).",
            "النظام يرفض يمسح المستخدم ده طول ما لسه عنده منتجات مسجلة باسمه."
          ],
          correctIndex: 0,
          explanation: "في الحالة دي، العلاقة 1:N (مستخدم لمنتجات كتير). لو المستخدم اتمسح والمنتجات فضلت بـ user_id مش موجود، ده هيعمل مشاكل. الـ ON DELETE CASCADE مناسب هنا عشان يضمن إن المنتجات (الـ children) تتشال لما الـ user (الـ parent) يتشال."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "تصميم لجدول 'الكورسات' وجدول 'الطلاب'. الطالب الواحد ممكن يشترك في كذا كورس، والكورس الواحد ممكن يشترك فيه كذا طالب. عايز تعمل كويري (Query) سريع جداً يجيبلك كل الكورسات اللي فيها طالب معين. إيه أحسن حاجة تعملها عشان تسرّع الكويري ده على الـ Foreign Key?",
          options: [
            "الـ Foreign Key ده لازم يتعمله Index عشان الـ Join يكون أسرع.",
            "الـ database بيعمل Index للـ Foreign Key تلقائيًا، فمش محتاج تعمل حاجة.",
            "الـ Foreign Key ملوش علاقة بسرعة الـ Query، المهم الجدول الوسيط يبقى صغير."
          ],
          correctIndex: 0,
          explanation: "الـ Foreign Keys (خاصة في العلاقات Many-to-Many اللي بتستخدم جدول وسيط) بتستخدم كتير في الـ JOINs. الـ Index بيسرّع البحث عن البيانات المرتبطة بيها بشكل كبير. مش كل الـ databases بتعمل Index تلقائيًا للـ FKs."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "في سيستم مكتبة، عندك جدول لـ 'الكتب' وجدول لـ 'التصنيفات' (مثلاً: روايات، علوم، تاريخ). الكتاب الواحد ممكن يكون ليه تصنيف واحد، والتصنيف ممكن يبقى فيه كتب كتير. لو قررت تمسح تصنيف معين (زي 'روايات بوليسية' مثلاً)، إيه اللي المفروض يحصل للكتب اللي كانت تحت التصنيف ده، عشان المكتبة متبوظش؟",
          options: [
            "يتمسح التصنيف بس، والكتب بتاعته الـ category_id بتاعها يبقى NULL.",
            "النظام يرفض مسح التصنيف ده طول ما لسه فيه كتب تابعة ليه.",
            "الكتب اللي كانت تحت التصنيف ده تتمسح معاه أوتوماتيكي."
          ],
          correctIndex: 1,
          explanation: "في سيناريو زي ده، مينفعش الكتب تتمسح (معلومات مهمة). إن الـ category_id يبقى NULL غالبًا مش مرغوب فيه (كتاب بلا تصنيف). الحل الأنسب هو ON DELETE RESTRICT اللي بيمنع مسح التصنيف طالما فيه كتب مرتبطة بيه، عشان يبقى فيه وقت تتنقل الكتب دي لتصنيف تاني أو تعملها حاجة قبل مسح التصنيف."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "ارسم ٣ علاقات مختلفة في schema واحدة",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "1:1 / 1:N / N:M — كل واحدة ليها طريقة تطبيق مختلفة. هترسم الـ ٣ في schema واحدة بأمثلة حقيقية.",
      prompt:
        "في تسليمك:\n\n١) 1:1 — مثال (user ↔ profile)؟ ارسم الـ schema (٢ tables + الـ FK).\n٢) 1:N — مثال (user ↔ posts)؟ ارسم.\n٣) N:M — مثال (users ↔ projects بـ membership)؟ ارسم الـ ٣ tables (٢ + جدول junction).\n٤) لكل نوع، اكتب SQL مبسّط للـ JOIN اللي بيجيب data:\n   - 1:1 → ...\n   - 1:N → ...\n   - N:M → ...",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "٣ علاقات بـ schema",
          weight: 60,
          criteria: [
            "الـ ٣ موصوفين بـ tables و FKs.",
            "الـ junction table في N:M فيه composite key أو unique.",
          ],
        },
        {
          label: "SQL Joins صحيحة",
          weight: 40,
          criteria: [
            "كل JOIN فيه ON بشرط صحيح.",
            "الـ N:M JOIN فيه ٢ joins مش واحد.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "user_roles ↔ user_id — أبسط Foreign Key في المنصة",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "user_roles ↔ user_id — أبسط Foreign Key في المنصة",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. جدول user_roles مربوط بـ auth.users عن طريق user_id. ده اللي بيخلّي has_role() function تشتغل وتعرف إنت admin ولا مستخدم عادي. علاقة 1-to-many حقيقية.",
      bullets: [
        "user_roles.user_id → auth.users.id (foreign key مع cascade delete).",
        "Security definer function has_role() بتمنع recursive RLS.",
        "نفس الـ pattern تقدر تطبّقه في أي تطبيق فيه أدوار.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /admin", href: "/admin" },
    },
  }
];
