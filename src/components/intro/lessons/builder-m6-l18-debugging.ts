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
    eyebrow: "HERO",
    title: "لما الـ AI يغلط — متخفش",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل Builder بيقابل errors. الفرق هو إنك تعرف تقرا الـ error وتوصّفه.",
        "الـ AI بيصلّح أي error — بشرط إنك تديله الـ error نفسه، مش وصف عام.",
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
        { term: "Error message (رسالة الخطأ)", meaning: "رسالة من السيستم بتقولك إن فيه حاجة باظت ومحتاجة تتصلح.", example: "زي لما مندوب الشحن يكلمك يقولك (العنوان غلط)، دي رسالة بتقول فين المشكلة بالظبط." },
        { term: "Stack trace", meaning: "خريطة بتعرفك الـ error بدأ فين ومشي إزاي لحد ما وصل عندك.", example: "لو بتراجع حسابات محل ولقيت عجز، بتفتح الدفاتر وترجع بالراجع لحد ما تعرف مين صرف وبوظ الدنيا." },
        { term: "Console (الكونسول)", meaning: "شاشة بنشوف فيها كل اللي بيحصل \"تحت السطح\" في البرنامج.", example: "زي كشف الحساب اللي بيطلعه المحاسب عشان يشوف كل حركة فلوس حصلت في المحل." },
        { term: "Reproduce (تكرار الخطأ)", meaning: "إنك تخلي المشكلة تحصل تاني عن طريق إنك تمشي على نفس خطواتها.", example: "لو زبون اشتكى إن الويب سايت بيعلق، بتجرب تطلب أوردر بنفس طريقته عشان تشوف المشكلة بنفسك." },
        { term: "Frontend (الواجهة)", meaning: "أي حاجة ظاهرة قدام عين المستخدم، زي الزراير والألوان والكلام.", example: "زي ديكور المحل واليافطة والأرفف اللي الزبون بيشوفها وبيتعامل معاها وهو بيشتري." },
        { term: "Backend (الكواليس)", meaning: "الكواليس اللي فيها البيانات والقواعد اللي بتشغل البرنامج وبتخزن المعلومات.", example: "زي المخزن اللي المشتري مش بيشوفه، بس فيه كل البضاعة والحسابات والأوراق." },
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
      caption: "إزاي تفتح Console وتاخد الـ error وتوصّفه للـ AI.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "٤ معلومات بتحل ٩٠٪ من الـ errors",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "١. الـ Error Message بالظبط (نسخ/لصق، مش وصف بكلامك): «TypeError: Cannot read property 'map' of undefined». الـ AI بيتعرّف عليها فوراً.",
        "٢. الـ Stack Trace أو اسم الملف والسطر: «at Dashboard.tsx:42». ده بيوجّه الـ AI على المكان بالظبط.",
        "٣. خطوات إعادة الإنتاج: «دوست على زرار Login، فتحت modal، كتبت email، دوست Submit، طلع الـ error». من غير ده، الـ AI بيخمّن.",
        "٤. اللي إنت توقّعته يحصل: «المفروض كان يفتح dashboard». من غير كدة، الـ AI هيتوه منك ومش هيعرف لو الـ error هو فعلاً مشكلة ولا behavior مقصود.",
        "افتح Console (F12 في أي متصفح). كل error بيظهر هناك. لو الشاشة بيضا فجأة بدون error — في 99% فيه exception في الـ Console. أول حاجة تعملها في أي مشكلة: افتح Console.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "Error + Context = حل",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: debuggingImg,
      alt: "Console فيه error أحمر، وتحته رد الـ AI بيشخّص المشكلة",
      caption:
        "لاحظ الـ error مكتوب بالظبط (TypeError + اسم الملف والسطر). الـ AI رد بـ تشخيص دقيق ومش بكلام عام. لما تدي الـ AI نص الـ error الفعلي + سياق، بيرد زي كده. لما تقول «مش شغّال» بس، بيرد بـ ١٠ احتمالات وانت تختار.",
      label: "Console + AI = حل",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "إزاي تطلب مساعدة",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — «الصفحة مش شغّالة»",
        body: "الـ AI بيرد بـ ١٠ احتمالات: «جرّب تعمل refresh، شوف الـ network، تأكد من الـ env variables...». انت بتجرّب كل واحدة، ولا واحدة هي المشكلة. ساعة وضاعت.",
      },
      right: {
        label: "RIGHT — Error + خطوات + متوقّع",
        body: "«لما اضغط على Login بطلع: TypeError: Cannot read property 'map' of undefined at Dashboard.tsx:42. المفروض كان يفتح /dashboard». الـ AI: «المشكلة في السطر ٤٢ — الـ users array undefined قبل ما الـ fetch يخلص. ضيف check قبل الـ map». ٣٠ ثانية، الـ bug اتصلّح.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اعمل error متعمّد واتعامل معاه",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m6-l18-debugging-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "إنت شغال على مشروع Lovable، والمفروض إنك بتظبط زرار بيفتح modal. لما بتدوس على الزرار، الشاشة بتبيض تمامًا ومفيش حاجة بتحصل. إيه أول خطوة لازم تعملها عشان تفهم المشكلة وتحلها؟",
          options: [
            "افتح Console المتصفح (F12) عشان تشوف إذا كان فيه error ظاهر هناك.",
            "جرب غير مكان الزرار في الكود و شوف لو المشكلة هتتحل.",
            "اسأل زميلك المبرمج إيه المشكلة دي عشان يساعدك."
          ],
          correctIndex: 0,
          explanation: "أول حاجة تعملها في أي مشكلة هي إنك تفتح Console، لأن 99% من الـ errors بتظهر هناك، حتى لو الشاشة بيضا."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "في مشروعك، ظهر لك error غريب. قعدت تبص في الكود شوية بس مش فاهم إيه اللي بيحصل بالظبط. قررت إنك تطلب مساعدة من الـ AI. إيه أحسن طريقة عشان تساعد الـ AI يلاقيلك الحل بسرعة وبدقة؟",
          options: [
            "تقول للـ AI: 'الكود بتاعي بايظ، صلحلي Error.' وتسيبه هو يعيش مع نفسه.",
            "تدي للـ AI الـ Error Message بالظبط و الـ Stack Trace أو اسم الملف والسطر، وتوصفله خطوات إعادة إنتاج الـ error، وتقوله إيه اللي كان المفروض يحصل.",
            "تدي للـ AI الجزء اللي فيه الكود اللي انت عاملة، وتقوله 'ده الكود بتاعي، فيه حاجة غلط.'."
          ],
          correctIndex: 1,
          explanation: "عشان الـ AI يصلّح أي error، لازم تديله الـ error نفسه مش وصف عام، يعني الـ Error Message بالظبط، والـ Stack Trace، و خطوات إعادة الإنتاج، وإيه اللي المفروض كان يحصل."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "ظهرلك error في المتصفح بيقول: 'TypeError: Cannot read properties of undefined (reading 'length')'. إيه الجزء من الـ error ده اللي الـ AI هيستخدمه عشان يتعرف على المشكلة أساسًا ويحدد نوعها؟",
          options: [
            "كلمة 'TypeError' بس.",
            "العبارة كلها: 'TypeError: Cannot read properties of undefined (reading 'length')'.",
            "كلمة 'length' بس."
          ],
          correctIndex: 1,
          explanation: "الـ AI بيتعرف على الـ Error Message فورًا لما ياخده بالظبط (نسخ/لصق)، مش وصف عام. الجملة الكاملة هي اللي بتوضحله نوع المشكلة."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "حلّل bug حقيقي بطريقة منظّمة",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Debugging مش حظ. هتاخد bug حصلك (أو تتخيّل واحد) وتمشي على ٤ خطوات: Reproduce → Isolate → Hypothesize → Fix.",
      prompt:
        "في تسليمك:\n\n١) Bug في جملة (إيه اللي بيحصل × إيه المتوقع):\n٢) Reproduce — الـ ٣ خطوات اللي بتطلّعه دايماً:\n٣) Isolate — وصلت لنقطة الـ failure في إيه؟ (frontend / backend / DB / network)\n٤) Hypotheses — ٢ تفسيرات محتملة:\n٥) Fix — أنهي hypothesis اتأكدت وكان الحل إيه؟\n٦) Lesson — هتغيّر إيه في طريقة كتابتك عشان ما يحصلش تاني؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "الـ ٤ خطوات بمحتوى",
          weight: 60,
          criteria: [
            "Reproduce بـ ٣ خطوات قابلة للتكرار.",
            "فيه ٢ hypotheses منفصلين قبل الحل.",
          ],
        },
        {
          label: "Lesson قابل للتطبيق",
          weight: 40,
          criteria: [
            "استخرجت تغيير في طريقتك مش «هاخد بالي».",
            "الـ Lesson مربوط بالـ root cause.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "/build-logs — كل error في المنصة بيتسجّل هنا",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "/build-logs — كل error في المنصة بيتسجّل هنا",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. بدل ما نخفي الأخطاء، عملنا صفحة /build-logs بتعرض كل serverFn اشتغلت وكل error حصل. ده اللي اتعلّمته: الـ error مش عدوّك، هو دليلك.",
      bullets: [
        "كل client error بيتبعت لجدول client_error_logs.",
        "Stack trace كامل + الـ URL اللي حصل فيه الـ error.",
        "بنراجع الـ logs أسبوعيًا ونصلّح أعلى ٣ errors تكرارًا.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /build-logs", href: "/build-logs" },
    },
  }
];