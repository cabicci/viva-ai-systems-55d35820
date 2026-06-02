import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import queriesScreenshot from "@/assets/lessons/builder-m8-queries.jpg";

/**
 * Builder · M8 · Lesson 03 — Queries: ازاي بتجيب البيانات
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 *
 * يبني على M8.1 (Tables) و M8.2 (Relations) — دلوقتي بنكتب الـ SELECT/JOIN/WHERE.
 */
export const BUILDER_M8_QUERIES_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "كل رقم بتشوفه على الشاشة = query وراه",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "صمّمت الجداول (M8.1)، ربطتها (M8.2). دلوقتي السؤال: إزاي تجيب البيانات وتعرضها للمستخدم؟",
        "الإجابة = Query. كل كرت في الـ dashboard، كل list، كل عداد، كل فلتر — كله بينتهي بـ SELECT بيتنفّذ على DB.",
        "الـ query الوحش بيخلّي الصفحة تحمّل في ٦ ثواني. الصح بيخليها تحمّل في ٢٠٠ms من نفس الجداول.",
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
        { term: "Query / SELECT", meaning: "طلب معلومات محددة من قاعدة البيانات عشان تظهرلك على الشاشة.", example: "لما تطلب تقرير مبيعات شهر 5 من السيستم عشان تشوف مين أكتر عميل اشترى." },
        { term: "Index / الفهرس", meaning: "زي فهرس الكتاب، بيسرع تدوير السيستم على المعلومة بدل ما يدور في كله.", example: "تخيل دفتر الحسابات ملهوش فهرس، هتتعب عقبال ما تلاقي اسم العميل، الـ Index بيخليك توصله في ثانية." },
        { term: "Payload", meaning: "الحمولة أو البيانات الفعلية اللي مبعوتة في الطلب بتاعك.", example: "لما تبعت ملف Excel تقيل فيه داتا كتير لإيميل عميل، الملف ده هو الـ Payload." },
        { term: "Bandwidth", meaning: "عرض الطريق اللي البيانات بتمشي فيه، بيحدد كمية المعلومات اللي بتتنقل.", example: "زي ماسورة المية، كل ما كانت واسعة تعدي مية أكتر في وقت قليل. كذلك سرعة نقل البيانات." },
        { term: "Syntax (التقطيت والنقط)", meaning: "القواعد اللي بنرص بيها الكود والرموز عشان الجهاز يفهم قصدنا إيه.", example: "زي ما المحاسب بيكتب (اسم العميل.المبلغ)، دي طريقة بنفهم بيها الجهاز الـ \"اسم\" ده تبع أنهي \"جدول\"." },
        { term: "SQL Injection (الهكر)", meaning: "طريقة \"خبيثة\" الهكر بيستخدمها عشان يسرق بيانات أو يبوظ السيستم عن طريق خانات الكتابة.", example: "زي ما حد يكتب في خانة \"اسم العميل\" كود يمسح كل الحسابات، ده هكر بيستغل غلطة في الكتابة." },
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
      caption: "SELECT, WHERE, JOIN, COUNT, ORDER BY, LIMIT — وإمتى تستخدم index.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Query = ٤ أسئلة بتقولها للـ DB",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل query بتجاوب على ٤ أسئلة بالترتيب: عايز إيه (SELECT) — منين (FROM + JOIN) — بشروط إيه (WHERE) — مرتّب وممزّق إزاي (ORDER BY + LIMIT). لو فهمت الترتيب ده، تقدر تكتب أي query في الدنيا.",
        "SELECT: حدّد الأعمدة اللي محتاجها بالظبط، مش *. SELECT id, title, created_at أحسن من SELECT * لأنها بتقلّل الـ payload وبتسرّع الـ response. للأعداد: SELECT count(*) أو count(distinct user_id).",
        "JOIN: بتربط جدولين عن طريق FK. SELECT t.title, u.name FROM tasks t INNER JOIN users u ON u.id = t.user_id. INNER JOIN = بس اللي ليه match. LEFT JOIN = كل سطور tasks حتى لو الـ user اتمسح. للـ N:M بتعمل JOIN مرتين: tasks → task_tags → tags.",
        "WHERE + ORDER BY + LIMIT: WHERE user_id = $1 AND status = 'pending' بتفلتر، ORDER BY created_at desc بترتّب، LIMIT 20 OFFSET 0 بتجيب صفحة. الـ $1 = parameterized query — مش بتحط القيم في النص مباشرة (ده SQL injection). أي عمود بتعمل عليه WHERE أو ORDER BY كتير → اعمله index، وإلا الـ DB هيقرأ الجدول كله كل مرة.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "كل عداد في الـ Master Report = query",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: queriesScreenshot,
      alt: "صفحة تقرير — ٤ كروت إحصائية: DB جداول 2 (1 migration)، Edge Functions 3، الدروس المنشورة 18/85 (24 موديول · 6 مسارات)، Runtime Coverage 50%",
      caption:
        "الصفحة دي مش بتعرض جدول خام — دي ٤ queries منفصلين. كرت \"DB جداول = 2\" هو SELECT count(*) FROM information_schema.tables WHERE table_schema='public'. كرت \"الدروس المنشورة 18/85\" هو SELECT count(*) FILTER (WHERE status='published') AS shipped, count(*) AS total FROM lessons. \"24 موديول · 6 مسارات\" = SELECT count(*) FROM modules و count(*) FROM paths. كل رقم تشوفه = query بيجري لما تفتح الصفحة. لو الـ lessons.status من غير index، الـ count ده هياخد ثواني لما الجدول يكبر — ده الفرق بين schema مصمّم صح و schema بيتعب التطبيق.",
      label: "من الموقع — صفحة تقرير",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "جيب الكل وفلتر في الـ Frontend vs اسأل الـ DB صح",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — SELECT * ثم filter في JavaScript",
        body: "const { data } = await supabase.from('tasks').select('*'); const mine = data.filter(t => t.user_id === userId && t.status === 'pending').slice(0, 20). النتيجة: لو الجدول فيه ١٠٠ ألف task، الـ DB بيرجّع كلها للـ Frontend (ميجابايت من البيانات) عشان تستخدم ٢٠ منهم. + RLS مش هيحميك لو نسيت .eq('user_id'، + مفيش index بيتستخدم، + الـ pagination مش حقيقية.",
      },
      right: {
        label: "RIGHT — اسأل الـ DB بالظبط على اللي محتاجه",
        body: "supabase.from('tasks').select('id, title, status, created_at').eq('user_id', userId).eq('status', 'pending').order('created_at', { ascending: false }).range(0, 19). الـ DB بيستخدم index على (user_id, status)، بيرجّع ٢٠ سطر بس بأعمدة محدّدة، الـ pagination حقيقية، والـ RLS بتتطبّق فوقها كطبقة حماية تانية. النتيجة: 200ms بدل 6s، وbandwidth أقل ١٠٠ مرة.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اكتب ٥ Queries حقيقية على الـ schema بتاعك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m8-queries-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "شغال على داشبورد بتعرض مهام الموظفين، والمستخدم طلب إن الصفحة تظهر أسرع. لقيت إن الـ SQL query اللي بتجيب كل المهام دي بتاخد ٦ ثواني. إيه أول حاجة ممكن تبص عليها عشان تحسن الأداء؟",
          options: [
            "بستخدم SELECT * بدل ما أحدد الأعمدة اللي محتاجها بالظبط.",
            "الـ JOINs اللي عاملها كتير ومحتاجة تتقسم على أكتر من query.",
            "الـ database server محتاج ترقية عشان يبقى أقوى."
          ],
          correctIndex: 0,
          explanation: "أول خطوة هي تحديد الأعمدة المطلوبة بالظبط (SELECT id, title, ...) وده بيقلل حجم البيانات اللي الـ DB بيجيبها وبيسرّع الاستجابة."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "بتبني صفحة بحث وفيها فلاتر. المستخدم بيقدر يدور على اسم المهمة (title) ويفلتر بالـ (status). لاحظت إن البحث بالـ title بطيء جداً، في حين الفلترة بالـ status كويسة. إيه السبب المحتمل؟",
          options: [
            "الـ column بتاع الـ status معمول عليه index والـ column بتاع الـ title لأ. ",
            "استخدام ilike في الـ title أبطأ من eq في الـ status.",
            "الـ status فيه عدد قليل من القيم والـ title فيه قيم كتير."
          ],
          correctIndex: 0,
          explanation: "أي عمود بيتعمل عليه WHERE أو ORDER BY كتير، لو اتعمل عليه index بيسرّع الـ query بشكل كبير. لو الـ title مش معمول عليه index والـ status معمول، ده هيخلي البحث في الـ title بطيء."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "بتعرض قائمة بالـ tasks، والمفروض كل task يظهر جنبها اسم اليوزر اللي عملها. استخدمت INNER JOIN بين جدول الـ tasks وجدول الـ users. جيت تختبر لقيت إن فيه مهام مش بتظهر خالص. إيه التفسير المنطقي؟",
          options: [
            "بعض المهام مش مرتبطة بيوزر موجود في جدول الـ users (يعني الـ user اتمسح).",
            "الـ INNER JOIN بترجع بس السطور اللي ليها match في الجدولين.",
            "يفضل استخدام LEFT JOIN عشان تضمن ظهور كل المهام حتى لو مفيش يوزر."
          ],
          correctIndex: 1,
          explanation: "الـ INNER JOIN بترجع بس السطور اللي الـ FK بتاعها ليه match في الجدول التاني. لو الـ user اتمسح، الـ task بتاعه مش هتظهر. الحل إنك تستخدم LEFT JOIN. "
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "اكتب ٣ Queries لـ ٣ استخدامات حقيقية",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Queries = اللي بتعصر بيها قيمة من الـ DB. هتكتب ٣ queries حقيقية بـ filter + sort + limit.",
      prompt:
        "لكل query من ٣ اكتب:\n\nQuery X:\n- الغرض في جملة:\n- SQL (أو Supabase client syntax):\n- الـ Indexes اللي محتاجاها عشان تشتغل بسرعة:\n- لو الـ table فيه مليون row، الـ query هتاخد كام تقريباً؟\n\nاختار:\n١) آخر ١٠ بوستات للمستخدم الحالي.\n٢) عدد البوستات لكل user (aggregate).\n٣) بوستات فيها كلمة معيّنة + ترتيب بـ relevance.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "٣ queries صحيحة",
          weight: 60,
          criteria: [
            "Syntax صحيح في كل query.",
            "Filters + sort + limit كلهم موجودين حيث محتاج.",
          ],
        },
        {
          label: "Indexes + Performance",
          weight: 40,
          criteria: [
            "حدّدت index واحد على الأقل لكل query.",
            "تقدير الأداء واقعي (مش «هتاخد ثانية»).",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "كل widget في /dashboard = query واحد",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل widget في /dashboard = query واحد",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. StreakCard بيشغّل SELECT current_streak FROM user_streaks. ReviewsDueCard بيشغّل SELECT count(*) FROM lesson_review_schedule WHERE next_review_at <= now(). كل رقم على الشاشة وراه query.",
      bullets: [
        "بنستخدم Supabase client للـ queries من الـ Frontend.",
        "الـ queries كلها بتمر على RLS — مفيش سرب بيانات.",
        "افتح DevTools → Network هتشوف كل query وردّه.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /dashboard", href: "/dashboard" },
    },
  }
];
