import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import componentsScreenshot from "@/assets/lessons/builder-m6-l16-components-routes.jpg";

/**
 * Builder · M6 · Lesson 05 — Components & Routes
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 *
 * يبني على M6.1 (Sitemap) — دلوقتي إزاي نبني الصفحات نفسها من قطع قابلة لإعادة الاستخدام.
 */
export const BUILDER_M6_COMPONENTS_ROUTES_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "Components: ليجو الـ Frontend",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "في الدرس اللي فات قسّمت تطبيقك لصفحات (Routes).",
        "النهارده هتقسّم كل صفحة لقطع أصغر بتتكرّر — Components.",
        "ده اللي بيخلّي الـ Frontend الحقيقي قابل للصيانة بدل ما يبقى فوضى.",
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
        { term: "Frontend", meaning: "وش البرنامج أو الموقع، ده الجزء اللي اليوزر بيشوفه ويتعامل معاه.", example: "زي واجهة المحل اللي الزبون بيشوفها، والبراند والألوان والديكور." },
        { term: "Component", meaning: "قطعة من واجهة الموقع بتقدر تكرر استخدامها في كذا مكان.", example: "زي زرار \"شراء\" تقدر تستخدمه في كل صفحات متجرك الإلكتروني." },
        { term: "Props", meaning: "المعلومات اللي بتبعتها للـ Component عشان يغير شكله أو محتواه.", example: "لو عندك كرت صنف، الصنف \"قميص\" والسعر \"200\" هما الـ Props." },
        { term: "State/Stateful", meaning: "حالة الـ Component الحالية، زي هل الزرار ده مضغوط ولا لأ؟", example: "لو العداد في شيت الإكسيل اتغير من 5 لـ 6، دي حالة جديدة." },
        { term: "TanStack Router", meaning: "الأداة اللي بتتحكم في نقل اليوزر بين صفحات الموقع المختلفة.", example: "ده المنظم اللي بيقول لو العميل داس \"مشترياتي\" وديه لصفحة الطلبات فوراً." },
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
      caption: "إيه الـ Component، إزاي بيتغذّى بـ Props، والفرق بينه وبين الـ Route.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Component = قالب + بيانات (Props)",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Component = قطعة UI قابلة لإعادة الاستخدام. زرار، كرت، modal، header — كل واحد فيهم component. بدل ما تكتب كود الكرت ٢٠ مرة في ٢٠ مكان، بتكتبه مرة واحدة وبتستخدمه ٢٠ مرة بقيم مختلفة.",
        "القيم اللي بتدخل للـ component اسمها Props. مثلاً <PathCard title=\"Creator\" lessons={2} /> — نفس الـ component، بـ props مختلفة، بيطلع شكل مختلف. ده اللي بيخلّي ٣ كروت مسارات في صفحة واحدة بنفس التصميم بالظبط من غير duplication.",
        "Routes vs Components — الفرق المهم: الـ Route = صفحة كاملة لها URL (/curriculum). الـ Component = قطعة جوّه الصفحة (PathCard، Sidebar). الـ Route نفسه component، بس مربوط بـ URL في نظام الـ routing (في Lovable: TanStack Router).",
        "قاعدة التقسيم (single responsibility): كل component يعمل حاجة واحدة. لو لقيت نفسك بتكتب component فيه ٣٠٠ سطر ومسؤول عن header + form + list في نفس الوقت — قسّمه. كل قطعة منهم component لوحده.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "نفس الـ Component بـ Props مختلفة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: componentsScreenshot,
      alt: "صفحة /curriculum — كرت Creator بداخله ModuleCard بدرسين، وكرت Automator بداخله موديولين كل واحد فيه LessonRow",
      caption:
        "الصورة دي بتشرح هرم الـ components في صفحة واحدة. الـ Route = /curriculum. جوّاه: PathCard مرة لـ Creator ومرة لـ Automator — نفس الـ component، props مختلفة (title، icon، subtitle، modules). جوّه كل PathCard فيه ModuleCard (\"Content Thinking\"، \"اللغة الأساسية\"، \"الأدوات\") — برضه نفس الـ component، بيتكرّر بـ data مختلفة. وجوّه كل ModuleCard فيه LessonRow (\"إيه الـ LLM؟\"، \"Prompt الـ\"، \"Frontend vs Backend\"). ٣ levels من الـ components، كل واحد له شغلة واحدة. لو غيّرت تصميم LessonRow في ملف واحد، كل الدروس في كل الصفحات هتتغيّر تلقائيًا.",
      label: "من الموقع — صفحة /curriculum",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "متى تعمل Component جديد ومتى لأ",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — كل صفحة تكتب كل حاجة من الأول",
        body: "\"هكتب كرت المسار في curriculum، وكرت تاني شبهه في dashboard، وكرت تالت في profile.\" نتيجة: ٣ نسخ من نفس الكود. لما تيجي تغيّر اللون، لازم تفتكر كل الأماكن. ولو نسيت واحد، التطبيق هيبقى inconsistent. هتقع في bugs بسبب فرق بسيط بين النسخ.",
      },
      right: {
        label: "RIGHT — قاعدة \"٣ مرات\" (Rule of Three)",
        body: "أول مرة بتكتب قطعة UI: اكتبها inline. ثاني مرة بتحتاجها: copy-paste — لسه بدري. ثالث مرة: قف. استخرجها لـ component بـ props. الفايدة: مفيش over-engineering للحاجات اللي بتستخدم مرة، ومفيش chaos للحاجات اللي بتتكرّر. الـ component اسمه يوصف وظيفته (PathCard مش BlueBox).",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "حدّد components تطبيقك في ١٠ دقايق",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m6-l16-components-routes-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو بتصمم صفحة 'كورساتي' على موقع تعليمي، ومحتاج تعرض كروت لكل كورس الطالب مسجل فيه. كل كارت بيعرض اسم الكورس، صورة الكورس، ومدى التقدم فيه (نسبة مئوية). أي من دول أنسب طريقة عشان تستخدم الـ 'CourseCard' component؟",
          options: [
            "أعمل 'CourseCard' واحد، وأمرر له بيانات كل كورس كـ 'props' عشان يعرض أشكال مختلفة منه.",
            "أعمل لكل كورس 'component' جديد باسم 'CourseCard1', 'CourseCard2' وهكذا، عشان كل واحد يعرض بيانات كورس معين.",
            "أدمج الكروت دي كلها في 'MyCoursesPage' component واحد كبير ومقسمهمش، كده كده هما في نفس الصفحة."
          ],
          correctIndex: 0,
          explanation: "الـ Component معمول عشان يتكتب مرة واحدة ويستخدم أكتر من مرة بقيم مختلفة (Props). ده بيقلل الـ duplication وبيخلي الكود مترتب."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "عندك الـ sitemap بتاع تطبيقك، وصفحة الـ '/dashboard' فيها 'Sidebar' على الشمال، 'Navbar' فوق، وفيه 'UserStats' بيعرض إحصائيات المستخدم، و'RecentActivities' بيعرض آخر الأنشطة. إيه الـ components اللي المفروض يتحطوا في الـ '__root.tsx' مرة واحدة بس عشان يظهروا في كل الصفحات؟",
          options: [
            "الـ 'Sidebar' والـ 'Navbar' بس.",
            "الـ 'UserStats' والـ 'RecentActivities' بس.",
            "كل دول: 'Sidebar', 'Navbar', 'UserStats', 'RecentActivities'."
          ],
          correctIndex: 0,
          explanation: "الـ Layout components زي الـ 'Sidebar' والـ 'Navbar' بتتحط في الـ '__root.tsx' مرة واحدة عشان تظهر في كل الصفحات، بعكس الـ content components اللي بتظهر في صفحات معينة."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "وانت بتقسم صفحة الـ '/profile' بتاعت تطبيقك لـ components، لاحظت إنك عامل component اسمه 'UserProfileSection' بيعرض صورة المستخدم، وبياناته الشخصية، وكمان قائمة بالـ posts بتاعته، وزرار لتعديل البيانات. إيه أفضل خطوة تعملها عشان تلتزم بمبدأ الـ 'single responsibility'؟",
          options: [
            "أسيبه زي ما هو، كده كده كل ده متعلق بالـ 'profile' بتاع المستخدم.",
            "أقسمه لـ components أصغر: 'UserAvatar', 'UserDetails', 'UserPostsList', 'EditProfileButton'.",
            "أخليه component واحد، بس أحط كل جزء في فايل لوحده عشان الكود يبقى منظم."
          ],
          correctIndex: 1,
          explanation: "قاعدة الـ single responsibility بتقول إن كل component يعمل حاجة واحدة بس. الـ component اللي بيعمل أكتر من حاجة المفروض يتقسم لـ components أصغر كل واحد مسؤول عن وظيفته."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "اعمل خريطة Routes + Components للتطبيق",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Routes = الصفحات، Components = الأجزاء القابلة لإعادة الاستخدام. هترسم الاتنين قبل أي كود.",
      prompt:
        "في تسليمك:\n\n١) Routes (على الأقل ٤): \n   - / → Home\n   - /xxx → ...\n   - ...\n٢) Components قابلة لإعادة الاستخدام (على الأقل ٥) — كل واحدة بـ Props متوقعة:\n   - Button (variant, size, onClick)\n   - ...\n٣) أنهي صفحة بتستخدم أنهي components؟ (جدول صغير)\n٤) فيه component لازم يكون stateful (له state داخلي) وليه؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "Routes + Components واضحين",
          weight: 60,
          criteria: [
            "٤+ routes + ٥+ components بأسماء حقيقية.",
            "Components عندها Props متوقعة مش «zhe button».",
          ],
        },
        {
          label: "Mapping + State",
          weight: 40,
          criteria: [
            "جدول/قائمة بربط Pages × Components.",
            "حدّدت component stateful بسبب منطقي.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "/curriculum مبني من 5 routes + components مشتركة",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "/curriculum مبني من 5 routes + components مشتركة",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. صفحة /curriculum فيها route رئيسي + child routes لكل path. والـ component اللي بيعرض كل lesson card هو نفسه في الـ 5 مسارات — components قابلة لإعادة الاستخدام.",
      bullets: [
        "Route file: curriculum.tsx مع <Outlet /> للـ child routes.",
        "Component LessonLink مشترك في الـ 5 مسارات.",
        "أي تغيير في الـ component بيظهر فورًا في كل مكان.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /curriculum", href: "/curriculum" },
    },
  }
];
