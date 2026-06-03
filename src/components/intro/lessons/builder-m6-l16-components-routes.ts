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
    eyebrow: "المشكلة",
    title: "ليه الكود بتاعك بيتحول لـ 'سباجيتي'؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أكتر حاجة محبطة للمبرمج: يغير لون زرار في حتة، وينسى يغيره في ٩ حتت تانية. فجأة، الموقع بتاعك بقى شكله مش متناسق ومليان لخبطة.",
        "ده بيحصل لما بتكرر نفس الكود بـ copy-paste. في الأول بتبقى حركة سريعة، بس مع الوقت بتبقى كابوس صيانة.",
        "الدرس ده هيوريك إزاي تبني واجهات زي الليجو: قطع بتركبها جنب بعض، ولما تعدّل قطعة واحدة، التعديل يسمّع في كل مكان بتستخدمها فيه.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "جرّب دلوقتي",
    title: "بص على أي موقع كبير بعين الـ Developer",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: componentsScreenshot,
      alt: "صفحة /curriculum — كرت Creator بداخله ModuleCard بدرسين، وكرت Automator بداخله موديولين كل واحد فيه LessonRow",
      caption:
        "الصفحة دي تبان معقدة، بس هي في الحقيقة تكرار لـ ٣-٤ قوالب بسيطة. فيه \"كرت مسار\" كبير، جواه \"كرت موديول\" أصغر، وجوه كل موديول فيه \"صف دروس\". نفس القوالب بالظبط، بس البيانات اللي جواها مختلفة. دي فكرة الـ Components.",
      label: "من موقع Lovable — صفحة /curriculum",
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "شوف بعينك: إزاي بنبني بالـ Components",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption: "إيه هو الـ Component، وإزاي بيتغذّى بالبيانات (Props)، والفرق بينه وبين الصفحة (Route).",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "السر كله: قالب + بيانات = Component",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تخيل الـ Component ده قطعة ليجو. ممكن يبقى زرار، كارت منتج، أو قايمة جانبية. بدل ما تبني شكل الكارت ٢٠ مرة في ٢٠ مكان، انت بتصمم \"قالب الكارت\" مرة واحدة بس.",
        "طب إزاي نفس القالب بيعرض منتجات مختلفة؟ عن طريق حاجة اسمها **Props**. الـ Props هي البيانات اللي بتبعتها للقالب. مثلاً، عندك قالب اسمه `ProductCard`، مرة تبعتله `title=\"تيشيرت\"` و `price=\"300\"`، ومرة تانية تبعتله `title=\"بنطلون\"` و `price=\"500\"`. نفس القالب، بيانات مختلفة، نتيجة مختلفة.",
        "الـ **Route** هو الصفحة الكاملة اللي ليها عنوان في الـ browser (زي `/products`). الـ **Component** هو قطعة جوه الصفحة دي (زي `ProductCard` أو `Sidebar`). الصفحة نفسها (الـ Route) هي مجرد component كبير بيجمع components أصغر جواه.",
        "قاعدة مهمة: كل component المفروض يعمل حاجة واحدة بس. لو لقيت نفسك بتعمل component واحد فيه ٣٠٠ سطر كود وبيعمل كل حاجة، قسمه لقطع أصغر. ده بيخلي الكود سهل يتفهم ويتصلح.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "صح x غلط",
    title: "امتى تعمل Component وامتى لأ؟",
    block: {
      kind: "comparison",
      left: {
        label: "غلط — كل حاجة من الأول",
        body: "\"هعمل كارت في صفحة المنتجات، وكارت تاني شبهه في صفحة العروض، وتالت في الداش بورد.\" النتيجة؟ ٣ نسخ من نفس الكود. لما تيجي تغير لون، لازم تفتكر تعدل في الـ ٣ أماكن. ولو نسيت واحد، الموقع شكله هيبوظ.",
      },
      right: {
        label: "صح — قاعدة الـ 3 مرات",
        body: "أول مرة محتاج قطعة UI: اكتبها في مكانها عادي. تاني مرة: ممكن تعمل copy-paste، لسه بدري. تالت مرة: اقف. دي إشارة إنك لازم تطلّع الكود ده في Component منفصل وتستخدمه في الـ ٣ أماكن. كده بتتجنب الفذلكة الزيادة، وفي نفس الوقت بتحافظ على الكود نضيف ومنظم.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "اختبر نفسك",
    title: "مخك بيفكر كـ Component Developer؟",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m6-l16-components-routes-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو بتصمم صفحة 'كورساتي' على موقع تعليمي، ومحتاج تعرض كروت لكل كورس. كل كارت فيه اسم الكورس وصورته ونسبة التقدم. إيه أنسب طريقة تستخدم بيها الـ 'CourseCard' component؟",
          options: [
            "أعمل 'CourseCard' واحد، وأمرر له بيانات كل كورس كـ 'props' عشان يعرض أشكال مختلفة منه.",
            "أعمل لكل كورس 'component' جديد باسم 'CourseCard1', 'CourseCard2' وهكذا.",
            "أدمج كل الكروت في component واحد كبير اسمه 'MyCoursesPage' وخلاص."
          ],
          correctIndex: 0,
          explanation: "الـ Component معمولة عشان تتكتب مرة وتستخدم كذا مرة ببيانات (Props) مختلفة. ده بيقلل التكرار وبيخلي الكود منظم."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "في الـ sitemap بتاعك، صفحة الـ '/dashboard' فيها 'Sidebar' و 'Navbar'. المفروض دول يتحطوا فين عشان يظهروا في كل صفحات الموقع؟",
          options: [
            "في ملف الـ '__root.tsx' مرة واحدة بس.",
            "في كل صفحة (route) لوحدها.",
            "أعملهم component واحد اسمه 'Layout' وأكرره في كل الصفحات."
          ],
          correctIndex: 0,
          explanation: "الـ Layout components زي الـ 'Sidebar' والـ 'Navbar' بتتحط في الملف الرئيسي مرة واحدة عشان تظهر في كل الصفحات، على عكس الـ components اللي بتتغير من صفحة للتانية."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "وانت بتقسم صفحة البروفايل، عملت component اسمه 'UserProfileSection' بيعرض صورة المستخدم وبياناته وقايمة بالبوستات بتاعته وزرار تعديل. إيه أحسن حاجة تعملها عشان تخلي الكود منظم؟",
          options: [
            "أسيبه زي ما هو، كلها حاجات ليها علاقة بالبروفايل.",
            "أقسمه لـ components أصغر: 'UserAvatar', 'UserDetails', 'UserPostsList', 'EditProfileButton'.",
            "أخليه component واحد، بس أحط كل جزء في فايل لوحده."
          ],
          correctIndex: 1,
          explanation: "قاعدة الـ single responsibility بتقول إن كل component المفروض يعمل حاجة واحدة بس. تقسيمه لـ components أصغر بيخلي كل واحد مسؤول عن وظيفته، وده بيسهل الصيانة والتطوير."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "ارسم خريطة الـ Components لتطبيقك",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "قبل ما تكتب سطر كود واحد، لازم تخطط. مهمتك دلوقتي إنك تحلل فكرة تطبيقك وتطلع منها خريطة للـ Routes (الصفحات) والـ Components (القطع).",
      prompt:
        "في ورقة أو أي برنامج رسم، اعمل الآتي:\n\n١) **ارسم شخبطة سريعة للصفحة الرئيسية** بتاعت تطبيقك. مش لازم تبقى فنان، مربعات وخطوط كفاية.\n\n٢) **من الرسمة دي، طلّع قايمة بالـ Components** اللي بتتكرر أو ممكن تتكرر. زي (Button, ProductCard, Header, ...الخ).\n\n٣) **جنب كل Component، اكتب إيه الـ Props (البيانات)** اللي محتاجها عشان شكله أو محتواه يتغير. مثال: `ProductCard` محتاج `(image, title, price)`.\n\n٤) **سؤال بونس:** فيه component منهم محتاج يبقى عنده \"ذاكرة\" داخلية (state)؟ زي مثلاً مربع بحث بيفتكر الكلام اللي كتبته. لو آه، هو إيه وليه؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "التحليل الأساسي",
          weight: 60,
          criteria: [
            "رسمة واضحة للصفحة الرئيسية.",
            "قايمة فيها ٥+ components على الأقل بأسماء منطقية.",
            "كل component متحدد له الـ props اللي محتاجها.",
          ],
        },
        {
          label: "التفكير المتقدم",
          weight: 40,
          criteria: [
            "قادر يحدد component محتاج state.",
            "شرح منطقي لسبب احتياج الـ state ده.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "مثال حي من المنصة",
    title: "صفحة المناهج مبنية بنفس الطريقة",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "/curriculum مبني من 5 routes + components مشتركة",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. صفحة /curriculum فيها route رئيسي، وكل مسار (Builder, Creator, ...) هو route ابن له. والـ component اللي بيعرض كل درس هو هو في كل المسارات.",
      bullets: [
        "ملف الـ Route الرئيسي `curriculum.tsx` بيحتوي على الـ child routes.",
        "الـ Component بتاع `LessonLink` مشترك في كل المسارات.",
        "أي تغيير في تصميم `LessonLink` بيظهر فورًا في كل مكان.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /curriculum وشوف بنفسك", href: "/curriculum" },
    },
  }
];