import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import debuggingImg from "@/assets/lessons/unique/builder-m6-l18-debugging.jpg";

export const BUILDER_M6_DEBUGGING_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "أول خطوة ليك كـ Builder",
    title: "الشاشة بيّضت فجأة؟ مبروك.",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل Builder حقيقي بيوصل للحظة دي: الأبلكيشن بيهنّج، الزرار مش شغال، أو بتطلع شاشة بيضا فاضية.",
        "الفرق بين المبتدئ والمحترف مش إن الكود بتاعه مبيغلطش، الفرق هو إنه بيعرف يتعامل مع الغلط إزاي. الـ AI بيحل أي bug في ثواني، بس بشرط واحد: توصفله المشكلة صح.",
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "جرّب دلوقتي",
    title: "أول رد فعل ليك: دوس F12",
    tone: "accent",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "في أي متصفح (Chrome, Firefox, Edge)، دوس على زرار F12 في الكيبورد. هيفتحلك شاشة جانبية اسمها الـ Console.",
        "دي الصندوق الأسود بتاع أي ويب سايت. ٩٩٪ من المشاكل اللي بتخلي الشاشة تبيّض أو الأبلكيشن يعلّق بيبقى ليها رسالة خطأ (error) حمرا مستنياك هناك. دي أول حاجة تبص عليها، دايماً.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الوصفة السحرية",
    title: "٤ معلومات بتحل ٩٠٪ من الـ bugs",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "١. **رسالة الـ Error بالحرف (copy/paste):** زي «TypeError: Cannot read property 'map' of undefined». الـ AI بيفهمها فورًا.",
        "٢. **مكان الـ Error (اسم الفايل ورقم السطر):** زي «at Dashboard.tsx:42». دي بتديله العنوان بالظبط.",
        "٣. **إزاي المشكلة حصلت (خطوات التكرار):** «دوست على زرار Login، كتبت الإيميل، دوست Submit، فطلع الـ error».",
        "٤. **إيه اللي المفروض كان يحصل:** «المفروض كان يفتح صفحة الـ dashboard». من غير دي، الـ AI مش هيعرف إنت عايز توصل لإيه.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "ده اللي الـ AI محتاجه، بالحرف",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: debuggingImg,
      alt: "Console فيه error أحمر، وتحته رد الـ AI بيشخّص المشكلة",
      caption:
        "لاحظ إن الـ prompt فيه رسالة الـ Error بالظبط (TypeError...) واسم الفايل ورقم السطر. عشان كده الـ AI رد بتشخيص دقيق وحل مباشر. لما تقوله «الكود بايظ» بس، بيرد بـ ١٠ احتمالات عامة وتفضل تلف حوالين نفسك.",
      label: "Error + تفاصيل = حل فوري",
    },
  },
  {
    icon: Scale,
    eyebrow: "صح وغلط",
    title: "الفرق بين ساعة ضايعة و٣٠ ثانية",
    block: {
      kind: "comparison",
      left: {
        label: "غلط: «الصفحة مش شغالة»",
        body: "الـ AI هيرد عليك بـ ١٠ احتمالات عامة: «جرّب تعمل refresh، شوف النت، اتأكد من الـ keys...». هتجرّب كل واحدة، ومفيش حاجة هتشتغل. ساعة من عمرك ضاعت.",
      },
      right: {
        label: "صح: Error + خطوات + المتوقع",
        body: "«لما بضغط Login بيطلعلي: TypeError: Cannot read property 'map' of undefined at Dashboard.tsx:42. المفروض كان يوديني على /dashboard». الـ AI هيرد: «المشكلة في سطر ٤٢، الـ array بتاع الـ users لسه فاضي. حط check قبله». ٣٠ ثانية، والـ bug اتحل.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "مصطلح الدرس",
    title: "كلمة واحدة هتسمعها كتير",
    block: {
      kind: "concepts",
      items: [
        { term: "Error Message (رسالة الخطأ)", meaning: "رسالة من السيستم بتقولك إن فيه حاجة باظت ومحتاجة تتصلح، وبتوصف نوع المشكلة بالظبط.", example: "زي لما ميكانيكي العربيات يقولك (البطارية نايمة)، دي رسالة خطأ واضحة ومحددة، مش مجرد (العربية مش بتدور)." },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اكتب prompt يحل bug",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "أحسن طريقة تتعلم بيها الـ debugging هي إنك تعملها بنفسك. مهمتك هي إنك تكتب prompt للـ AI يحل بيه bug (حقيقي حصلك أو حتى من خيالك).",
      prompt:
        "في تسليمك، اكتب prompt كامل للـ AI. الـ prompt لازم يكون فيه الـ ٤ معلومات اللي اتعلمناها:\n\n١. رسالة الـ Error (ممكن تخترع واحدة شكلها حقيقي زي `TypeError: user.profile is undefined`)\n٢. خطوات تكرار المشكلة (١، ٢، ٣...)\n٣. إيه اللي المفروض كان يحصل بدل الـ error ده.\n٤. الكود اللي فيه المشكلة (جزء صغير بس).",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "الـ prompt فيه الـ ٤ عناصر",
          weight: 70,
          criteria: [
            "فيه رسالة error واضحة.",
            "فيه خطوات تكرار منطقية.",
            "فيه وصف للنتيجة المتوقعة.",
          ],
        },
        {
          label: "الـ prompt واضح ومباشر",
          weight: 30,
          criteria: [
            "الـ AI يقدر يفهم المشكلة من الـ prompt بس.",
            "مفيش كلام عام زي «الكود بايظ».",
          ],
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "اختبر نفسك",
    title: "اتأكد إنك فهمت",
    tone: "primary",
    block: {
      kind: "quiz",
      lessonId: "builder-m6-l18-debugging-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "إنت شغال على مشروع Lovable، ولما بتدوس على زرار معين، الشاشة بتبيض تمامًا ومفيش حاجة بتحصل. إيه أول خطوة لازم تعملها عشان تفهم المشكلة؟",
          options: [
            "افتح Console المتصفح (F12) عشان تشوف إذا كان فيه error ظاهر هناك.",
            "أجرّب أغير مكان الزرار في الكود وأشوف لو المشكلة هتتحل.",
            "أسأل زميلي يساعدني."
          ],
          correctIndex: 0,
          explanation: "أول حاجة تعملها في أي مشكلة هي إنك تفتح الـ Console، لأن ٩٩٪ من الـ errors بتظهر هناك، حتى لو الشاشة بيضا."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "ظهر لك error غريب وقررت تطلب مساعدة من الـ AI. إيه أحسن طريقة توصف بيها المشكلة عشان تاخد حل دقيق وسريع؟",
          options: [
            "أقول للـ AI: 'الكود بتاعي بايظ، صلحهولي.'",
            "أديله رسالة الـ Error بالظبط، واسم الفايل ورقم السطر، وأوصفله خطوات تكرار المشكلة، وأقوله إيه اللي كان المفروض يحصل.",
            "أديله كل الكود بتاع المشروع وأقوله 'فيه حاجة غلط'."
          ],
          correctIndex: 1,
          explanation: "عشان الـ AI يساعدك صح، لازم تديله الـ ٤ معلومات الأساسية: رسالة الـ error، مكانه، خطوات تكراره، والنتيجة اللي كنت متوقعها."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "ظهرلك error في المتصفح بيقول: 'TypeError: Cannot read properties of undefined (reading 'length')'. إيه الجزء من الـ error ده اللي لازم تنسخه للـ AI؟",
          options: [
            "كلمة 'TypeError' بس.",
            "الرسالة كلها: 'TypeError: Cannot read properties of undefined (reading 'length')'.",
            "كلمة 'length' بس."
          ],
          correctIndex: 1,
          explanation: "الـ AI بيتعرف على رسالة الـ Error فورًا لما تديهاله كاملة وبالحرف (نسخ/لصق). كل كلمة في الرسالة بتساعده يشخص المشكلة صح."
        }
      ]
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "/build-logs — كل غلطة بتتحول لدرس",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "/build-logs — كل error في المنصة بيتسجّل هنا",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. بدل ما نخفي الأخطاء، عملنا صفحة /build-logs بتعرض كل عملية وكل error حصل. ده اللي اتعلّمته: الـ error مش عدوّك، هو دليلك للتحسين.",
      bullets: [
        "كل error بيحصل عند أي مستخدم بيتبعت لجدول عندنا.",
        "بنخزن رسالة الـ error كاملة والصفحة اللي حصل فيها.",
        "بنراجع الـ logs دي أسبوعيًا ونصلّح أكتر أخطاء بتتكرر.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /build-logs", href: "/build-logs" },
    },
  }
];