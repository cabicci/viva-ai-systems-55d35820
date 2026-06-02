import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import rlsDiagram from "@/assets/lessons/concepts/rls-diagram.jpg";

/**
 * Builder · M7 · Lesson 02 — RLS وحماية بيانات المستخدم
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 *
 * يبني على M7.1 (JWT بيقول للسيرفر "إنت مين") و M5.3 (DB، جداول).
 */
export const BUILDER_M7_RLS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "RLS: حارس على باب كل سطر في الـ Database",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "في الدرس اللي فات، الـ JWT بيقول للسيرفر \"ده إنت\".",
        "النهارده هنرد على السؤال الأخطر: طب إنت تقدر تشوف إيه؟",
        "الإجابة بتتكتب في الـ Database نفسه — مش في كود الـ Backend.",
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
        { term: "Frontend & Backend", meaning: "الـ Frontend واجهة الموقع، والـ Backend هو الشغل اللي ورا اللي مش بنشوفه.", example: "الـ Frontend هو الفاترينة اللي الزبون بيشوفها، والـ Backend هو المخزن والورق اللي في ضهر المحل." },
        { term: "Query (استعلام)", meaning: "أمر أو طلب بتبعته للأكسيل أو الـ Database عشان تجيب معلومة معينة.", example: "لما صاحب المحل يكتب \"هات لي فواتير شهر 5\"، ده كدة عمل Query للبيانات." },
        { term: "Policy (سياسة)", meaning: "قاعدة كود بتحدد مين من الموظفين مسموح له يلمس بيانات معينة.", example: "زي ما تقول للموظف \"ممنوع تفتح ملفات غير حساباتك إنت\"، ده كود بيعمل كدة." },
        { term: "Service Role (مفتاح الإدارة)", meaning: "مفتاح مع المدير بيدي له صلاحية يدخل على كل حاجة من غير قيود.", example: "أمين مخزن معاه مفتاح يفتح أي درج، مبيفرقش معاه أي قفل أو شروط." },
        { term: "auth.uid()", meaning: "كود شفرة بيعرف السيستم مين العميل اللي فاتح دلوقتي حالا.", example: "لما المحاسب يفتح السيستم، البرنامج بيعرف الـ ID بتاعه هو عشان يوريه فواتيره بس." },
        { term: "Subquery (استعلام فرعي)", meaning: "سؤال صغير جوه سؤال كبير عشان تصفي البيانات بدقة أكتر.", example: "زي ملف جوه ملف؛ بتدور على فواتير المورد اللي \"ساكن في القاهرة\" (بنشوف السكن الأول)." },
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
      caption: "إيه الـ RLS، إزاي بتمنع أي مستخدم إنه يدس أنفه في بيانات حد تاني، وليه حماية في الـ Backend وحدها مش كفاية.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Row Level Security = فلتر بيتلصق على كل query",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "في M5.3 شفت إن الجداول فيها column اسمه user_id — ده بيقول كل سطر يخصّ مين. بس مفيش حاجة لوحدها بتمنع مستخدم B إنه يقرأ سطور مستخدم A — لازم نضيف قاعدة.",
        "RLS (Row Level Security) = ميزة مدمجة في PostgreSQL. لما بتفعّلها على جدول، بتكتب Policy = شرط SQL بيتلصق تلقائيًا على كل query. مثلاً Policy على جدول tasks: USING (user_id = auth.uid()). معناها: أي SELECT بيرجّع بس السطور اللي فيها user_id = الـ user_id الجاي من الـ JWT المحقّق.",
        "الجميل في RLS إنها بتشتغل في طبقة الـ Database نفسها — مش في الـ Backend. حتى لو الـ Backend عنده bug ونسي يفلتر، الـ DB هيرفض. ده اسمه \"defense in depth\" — لو السيرفر هنج أو السيكورتي فيه خرم، الداتابيز لسه صاحية وقافلة الباب.",
        "في كل عملية policy منفصلة: SELECT (هات), INSERT (ضيف), UPDATE (عدّل), DELETE (امسح). أكتر غلط شائع: تفعّل SELECT policy وتنسى DELETE — فيبقى أي مستخدم يقدر يمسح بيانات حد تاني. القاعدة: كل عملية محتاجة policy خاصة بيها.",
        "شكل الـ Policy في SQL (مش مطلوب تحفظه — للتوضيح بس):\n```\nCREATE POLICY \"users see own tasks\"\nON tasks FOR SELECT\nUSING (auth.uid() = user_id);\n```\nاللي بيحصل: لما أي مستخدم يعمل `SELECT * FROM tasks`، الـ DB تلقائيًا بتضيف `WHERE user_id = <جايني من الـ JWT>`. الفلتر بيتلصق على كل query من غير ما الـ Backend يفكّر.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "إزاي RLS بتفلتر السطور لكل مستخدم",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: rlsDiagram,
      alt: "Diagram يوضح Row Level Security: جدول users فيه سطور لـ User A و B و C، وفي النص shield بيمثّل RLS Policy، وكل user على اليمين بيشوف بس السطور بتاعته",
      caption:
        "الـ diagram ده بيوضّح إزاي RLS بتشتغل على مستوى الـ Database. الجدول واحد فيه سطور لكل المستخدمين، لكن لما User A يعمل query، الـ Policy (auth.uid() = user_id) بتفلتر تلقائيًا وترجّع له سطوره هو بس. User B و C كل واحد يشوف سطوره. الفلتر مش في كود الـ Backend — هو في الـ DB نفسه، فحتى لو الـ Backend اتخرق، الحماية لسه شغّالة.",
      label: "Row Level Security — كيف يعمل الفلتر",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "ليه الحماية في الـ Backend وحدها مش كفاية",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — تعتمد على الـ Backend بس",
        body: "\"خلاص هكتب في الـ Backend: WHERE user_id = currentUser.id قبل أي query.\" المشكلة: ١) لو نسيت في endpoint واحد بس، البيانات كلها بقت على البحري. ٢) لو في الفريق حد كتب query مباشر للـ DB من غير ما يمر بالـ Backend (script، migration، tool)، الـ filter غير موجود. ٣) لو الـ token اتسرّب أو الـ logic فيها bug، مفيش طبقة حماية تانية.",
      },
      right: {
        label: "RIGHT — RLS = خط دفاع نهائي في الـ DB",
        body: "فعّل RLS على كل جدول فيه بيانات مستخدمين، واكتب policy لكل عملية (SELECT/INSERT/UPDATE/DELETE). لو الـ Backend نسي يفلتر، أو حد ضرب الـ DB direct، الـ RLS بترفض. + اختبر فعليًا: سجّل بحساب A، احفظ بيانات. اعمل logout، سجّل بحساب B، حاول تجيب بيانات A بـ id مباشر. لو رجّع \"empty\" → الـ RLS شغّالة. لو رجّع البيانات → فيه ثغرة.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "ارسم Policies للجدول اللي عملته في M5.3",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m7-rls-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو بتعمل أبلكيشن لإدارة المهام الشخصية (To-Do List)، وعاوز تتأكد إن كل يوزر يشوف مهامه هو بس، ومحدش يقدر يشوف مهام حد تاني، إيه أنسب رول للـSELECT policy على جدول الـ `tasks`؟",
          options: [
            "USING (user_id = auth.uid())",
            "USING (true)",
            "USING (user_id IS NOT NULL)"
          ],
          correctIndex: 0,
          explanation: "الـ `auth.uid()` بترجع الـID بتاع المستخدم اللي عامل Logged in، وده بيضمن إن كل مستخدم يشوف المهام اللي الـ `user_id` بتاعها مطابق للـID بتاعه هو بس، زي ما الدرس وضح."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "فريق الديفيلوبرز بتاعك عمل أبلكيشن شات داخلي للشركة، وعاوزين يتأكدوا إن أي رسالة بتتبعت بتتسجل بالـ `user_id` الصحيح بتاع اللي بعتها، ومحدش يعرف يبعت رسالة باسم حد تاني. إيه الـ policy اللي هتطبقها على عملية الـ INSERT عشان تضمن ده؟",
          options: [
            "WITH CHECK (auth.uid() = user_id) OR USING (is_admin = true)",
            "WITH CHECK (user_id = auth.uid())",
            "USING (true)"
          ],
          correctIndex: 1,
          explanation: "الـ `WITH CHECK` في الـ INSERT policy بتضمن إن الـ `user_id` اللي هيتسجل في السطر الجديد يكون هو هو الـ `auth.uid()` بتاع المستخدم اللي بيعمل عملية الإضافة، وده بيمنع أي تزوير."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "لو بتصمم أبلكيشن للمشاريع المشتركة (Collaborative Projects)، وبتفترض إن أي حد مشارك في المشروع يقدر يعدل أي 'task' جوه المشروع ده. جدول الـ `tasks` فيه `project_id`، وجدول تاني اسمه `project_members` بيربط الـ `user_id` بالـ `project_id`. إزاي ممكن تصمم الـ UPDATE policy عشان تسمح لأعضاء المشروع بس بالتعديل؟",
          options: [
            "USING (user_id = auth.uid())",
            "USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()))",
            "USING (true)"
          ],
          correctIndex: 1,
          explanation: "الـ Policy دي بتستخدم SUBQUERY عشان تتأكد إن الـ `project_id` بتاع الـ task اللي بيتم تعديلها موجود ضمن المشاريع اللي المستخدم الحالي (auth.uid()) عضو فيها، ودي طريقة صحيحة عشان تأمن نفسك بكذا قفل فوق بعض في سيناريوهات أعقد."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "اكتب RLS Policies لـ ٣ Scenarios شائعة",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "RLS = أمان الـ row by row. هتكتب policies بنصية واضحة لـ ٣ حالات حقيقية.",
      prompt:
        "لكل scenario من ٣:\n\nScenario X:\n- Table: [name]\n- Use case: [مثلاً «المستخدم يشوف بس البوستات بتاعته»]\n- Policy (SQL أو نصي):\n  - SELECT: [الشرط]\n  - INSERT: [الشرط]\n  - UPDATE/DELETE: [الشرط]\n- ايه السيناريو اللي ممكن يخرق الـ policy لو ما اتكتبتش صح؟\n\nاختار ١) profiles ٢) posts ٣) team_members (متعدد المستخدمين).",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "٣ policies كاملة",
          weight: 60,
          criteria: [
            "كل scenario فيه شرط SELECT + INSERT على الأقل.",
            "الـ team_members policy بتعالج multi-user مش زي posts.",
          ],
        },
        {
          label: "Attack scenario",
          weight: 40,
          criteria: [
            "كل policy معاه سيناريو الخرق المحتمل.",
            "الـ attack حقيقي (مش «حد هيخترق»).",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "RLS بتحرس كل جدول في المنصة",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "RLS بتحرس كل جدول في المنصة",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. لو حاولت تقرا تقدّم متعلّم تاني من DevTools، الـ database هترفض. كل جدول فيه RLS policy بـ auth.uid() = user_id — نفس الـ pattern اللي اتعلّمته بالظبط.",
      bullets: [
        "lesson_progress, mission_submissions, lesson_notes — كلهم بـ RLS.",
        "Policy: USING (auth.uid() = user_id) — ممنوع تشوف غير بياناتك.",
        "حتى لو الـ frontend غلط، الـ database مش هيرجّع لك بيانات غيرك.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /account", href: "/account" },
    },
  }
];
