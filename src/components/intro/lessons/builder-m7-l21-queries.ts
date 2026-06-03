import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import queriesScreenshot from "@/assets/lessons/builder-m7-l21-queries.jpg";

/**
 * Builder · M8 · Lesson 03 — Queries: ازاي بتجيب البيانات
 * V2: Tension (slow page) → Quick Win (Failure×Right) → Concept (Query) → How-to (4 questions) → Example → Mission (1 query)
 */
export const BUILDER_M8_QUERIES_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "المشكلة",
    title: "صفحتك بتقعد 6 ثواني تحمّل... والتانية 200 ميللي ثانية. إيه الفرق؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "صممت الجداول وربطتها ببعض. بس لما جيت تعرض الداتا للمستخدم، الأبليكيشن بطيء وممل. كل كليك بياخد ثواني عشان يرد.",
        "تفتكر المشكلة في السيرفر؟ لأ. 90% من الوقت، المشكلة في *الطريقة* اللي بتطلب بيها الداتا. الطريقة دي اسمها Query.",
        "الـ query الغلط بيخلّي الصفحة تحمّل في ٦ ثواني. الصح بيخليها تحمّل في ٢٠٠ms من نفس الجداول ونفس السيرفر. في الدرس ده هتتعلم إزاي تكتب الـ query الصح.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "جرّب دلوقتي",
    title: "شوف الفرق بنفسك بين الطلب الغلط والصح",
    block: {
      kind: "comparison",
      left: {
        label: "غلط — هات كل حاجة وبعدين فلتر",
        body: "const { data } = await supabase.from('tasks').select('*');\nconst mine = data.filter(t => t.user_id === userId && t.status === 'pending').slice(0, 20);\n\nالنتيجة: لو الجدول فيه ١٠٠ ألف task، الـ DB بيرجّعهم كلهم (ممكن يبقوا ميجابايتس) عشان في الآخر تستخدم ٢٠ بس. بطيء، وبيستهلك نت، وغير آمن.",
      },
      right: {
        label: "صح — اطلب اللي محتاجه بالظبط",
        body: "supabase.from('tasks')\n  .select('id, title, status')\n  .eq('user_id', userId)\n  .eq('status', 'pending')\n  .order('created_at', { ascending: false })\n  .range(0, 19);\n\nالنتيجة: الـ DB بيرجّع ٢٠ سطر بس بالأعمدة اللي انت عايزها. سريع، خفيف، وآمن. فرق السما من الأرض في الأداء.",
      },
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
    icon: BookOpen,
    eyebrow: "المصطلح الوحيد للدرس",
    title: "Query",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Query",
          meaning: "سؤال محدد بتسأله لقاعدة البيانات (DB) عشان تجيبلك حتة داتا معينة.",
          example: "لما تفتح فيسبوك، الموبايل بتاعك بيبعت Query للسيرفر يقوله \"هاتلي آخر 10 بوستات من صحابي\". البوستات اللي بترجعلك دي هي نتيجة الـ Query."
        },
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "أي Query في الدنيا عبارة عن 4 أسئلة",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "عشان تكتب query صح، محتاج تجاوب على ٤ أسئلة بالترتيب: عايز إيه (SELECT) — منين (FROM) — بشروط إيه (WHERE) — مترتب ومتقسم إزاي (ORDER BY + LIMIT). لو فهمت دول، تقدر تكتب أي query.",
        "**1. عايز إيه (SELECT):** حدد الأعمدة اللي محتاجها بالظبط، مش كل حاجة. `SELECT id, title` أحسن مليون مرة من `SELECT *` لأنها بتقلل حجم الداتا اللي بتتنقل.",
        "**2. منين (FROM + JOIN):** لو الداتا في جدولين، بتربطهم بـ `JOIN`. مثلاً عشان تجيب اسم اليوزر جنب التاسك بتاعته. `INNER JOIN` بتجيب المشترك بس، `LEFT JOIN` بتجيب كل التاسكات حتى لو اليوزر بتاعها اتمسح.",
        "**3. بشروط إيه (WHERE):** دي الفلاتر بتاعتك. `WHERE status = 'pending'` بتجيب التاسكات اللي لسه مخلصتش بس. أي عمود بتفلتر بيه كتير، لازم تعمله حاجة اسمها `index` (زي فهرس الكتاب) عشان البحث يبقى صاروخ.",
        "**4. مترتب ومتقسم إزاي (ORDER BY + LIMIT):** `ORDER BY created_at desc` بترتب من الأحدث للأقدم. `LIMIT 20` بتجيب أول ٢٠ نتيجة بس، عشان الـ pagination.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "مثال حقيقي",
    title: "كل رقم في الداشبورد دي وراه Query",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: queriesScreenshot,
      alt: "صفحة تقرير فيها ٤ كروت إحصائية: عدد جداول الـ DB، عدد الـ Edge Functions، عدد الدروس المنشورة، ونسبة التغطية.",
      caption:
        "الصفحة دي مش بتعرض جدول خام — دي ٤ queries منفصلين بيجروا ورا بعض. كارت \"الدروس المنشورة 18/85\" ده وراه query بتقول: `SELECT count(*) FILTER (WHERE status='published'), count(*) FROM lessons`. لو العمود بتاع `status` ده من غير index، والجدول فيه مليون درس، الـ query دي ممكن تاخد ثواني طويلة. الـ index بيخليها تاخد أجزاء من الثانية.",
      label: "من لوحة تحكم Lovable",
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "اكتب Query تجيب آخر 10 مهام",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "مهمتك بسيطة: هتكتب query واحدة بس بتعمل حاجة بنشوفها كل يوم في أي أبليكيشن مهام.",
      prompt:
        "باستخدام الـ Supabase client syntax اللي شفته فوق، اكتب الـ query اللي بتعمل الآتي:\n\n1. تجيب الداتا من جدول اسمه `tasks`.\n2. تختار الأعمدة دي بس: `id`, `title`, `status`.\n3. تجيب بس التاسكات اللي الـ `user_id` بتاعها بيساوي `current_user_id`.\n4. ترتبهم من الأحدث للأقدم (باستخدام عمود `created_at`).\n5. تجيب أول 10 نتايج بس.",
      buttonLabel: "انسخ المطلوب",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "الـ Query صحيحة",
          weight: 100,
          criteria: [
            "استخدمت `select` عشان تحدد الأعمدة.",
            "استخدمت `eq` عشان تفلتر بالـ user_id.",
            "استخدمت `order` عشان ترتب صح.",
            "استخدمت `limit` أو `range` عشان تجيب 10 بس.",
          ],
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "اختبر نفسك",
    title: "جاوب على الأسئلة دي",
    tone: "primary",
    block: {
      kind: "quiz",
      lessonId: "builder-m7-l21-queries-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "شغال على داشبورد بتعرض مهام الموظفين، والمستخدم اشتكى إن الصفحة بطيئة قوي. لقيت إن الـ query اللي بتجيب المهام بتاخد ٦ ثواني. إيه أول حاجة تشك فيها؟",
          options: [
            "إني بستخدم `SELECT *` بدل ما أحدد الأعمدة اللي محتاجها بالظبط.",
            "الـ `JOIN` اللي عاملها كتير ومحتاجة تتقسم على أكتر من query.",
            "الـ database server محتاج إمكانياته تعلى عشان يبقى أقوى."
          ],
          correctIndex: 0,
          explanation: "أول وأسهل حاجة تعمل فرق ضخم هي إنك تطلب بس الأعمدة اللي محتاجها. `SELECT *` بتجبر الـ DB يقرأ ويبعت داتا كتير مالهاش لازمة، وده بيبطّئ كل حاجة."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "بتبني صفحة بحث، والمستخدم بيقدر يدور على اسم المهمة (title) ويفلتر بالـ (status). لاحظت إن البحث بالـ title بطيء جداً، لكن الفلترة بالـ status سريعة. إيه السبب الأكيد؟",
          options: [
            "العمود بتاع الـ `status` معمول عليه index والعمود بتاع الـ `title` لأ.",
            "البحث بـ `ilike` في الـ title أبطأ من `eq` في الـ status.",
            "الـ `status` فيه قيم قليلة متكررة والـ `title` فيه قيم كتير مختلفة."
          ],
          correctIndex: 0,
          explanation: "الـ Index بيعمل زي فهرس للكتاب. لما تفلتر بعمود عليه index، الـ DB بيروح للفهرس ويجيب الداتا بسرعة. لو مفيش index، بيضطر يقرأ الجدول كله سطر سطر، وده بطيء جداً."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "بتعرض قايمة بالـ tasks، والمفروض كل task يظهر جنبها اسم اليوزر اللي عملها. استخدمت `INNER JOIN` بين جدول الـ `tasks` وجدول الـ `users`. لما جيت تختبر، لقيت إن فيه مهام مش بتظهر خالص. إيه التفسير المنطقي؟",
          options: [
            "فيه مهام اليوزر بتاعها اتمسح من جدول الـ `users`.",
            "الـ `INNER JOIN` بترجع بس السطور اللي ليها match في الجدولين.",
            "كان المفروض أستخدم `LEFT JOIN` عشان أضمن ظهور كل المهام."
          ],
          correctIndex: 1,
          explanation: "التفسير هو في طبيعة الـ `INNER JOIN` نفسها: هي معمولة عشان تجيب الحاجات المشتركة بس. لو فيه task اليوزر بتاعها اتمسح، هي بالنسبالها مالهاش match في جدول اليوزرز، فمش هتظهر في النتيجة."
        }
      ]
    },
  },
];