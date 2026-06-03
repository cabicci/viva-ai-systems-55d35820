import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen,
  FlaskConical,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import debuggingImg from "@/assets/lessons/unique/builder-m6-l18-debugging.jpg";

export const BUILDER_M6_DEBUGGING_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بعد الدرس ده هتقدر",
    title: "تعرف تعمل إيه لو الدنيا بازت",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Playbook عملي: لو AI app غلط، هتعرف منين تبدأ تشوف، من غير ما تخاف.",
      ],
    },
  },
  {
    icon: Sparkles,
    eyebrow: "لحظة الحقيقة لأي Builder",
    title: "الشاشة بيّضت فجأة؟ مبروك.",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل واحد بيبني تطبيق بيوصل للحظة دي: العميل ييجي يكلم الـ AI، يلاقي زرار مش شغال، أو تطلعله شاشة بيضا فاضية.",
        "اللحظة دي هي اللي بتفصل بين فكرة AI حلوة، وتطبيق AI حقيقي الناس بتستخدمه. الفرق بين المبتدئ والمحترف مش إن كوده مفيهوش غلطات، الفرق هو إنه بيعرف إزاي يبقى 'دكتور' للكود بتاعه.",
        "الـ AI المساعد (زي ChatGPT) بيحل أي مشكلة في ثواني، بس بشرط واحد: توصفله الحالة صح.",
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
        "في أي متصفح (Chrome, Firefox, Edge)، دوس على زرار F12 في الكيبورد. هيفتحلك شاشة على الجنب اسمها الـ Console.",
        "دي أوضة العمليات اللي بتشوف منها إيه اللي بيحصل في **كواليس التطبيق (Backend)**. ٩٩٪ من المشاكل اللي بتخلي الشاشة تبيّض أو التطبيق يعلّق، بيبقى ليها رسالة غلط (error) حمرا مستنياك هناك. دي أول حاجة تبص عليها، دايماً.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الوصفة السحرية",
    title: "٤ معلومات بتحل ٩٠٪ من المشاكل",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "١. **رسالة الغلط بالنص (Copy/Paste):** زي «TypeError: Cannot read property 'map' of undefined». الـ AI بيفهمها فورًا.",
        "٢. **عنوان الغلط (اسم الفايل ورقم السطر):** زي «at Chat.tsx:42». دي بتديله العنوان بالظبط.",
        "٣. **السيناريو (إيه اللي حصل بالترتيب):** «العميل كتب 'أهلاً'، داس Enter، فطلع الغلط ده».",
        "٤. **النتيجة الصح (إيه اللي كان المفروض يحصل):** «المفروض كان الـ AI يرد عليه بـ 'أهلاً بيك!'». من غير دي، الـ AI مش هيعرف إنت عايز توصل لإيه.",
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
        "لاحظ إن الـ prompt فيه رسالة الغلط بالظبط (TypeError...) واسم الفايل ورقم السطر. لما تديله تشخيص دقيق، هيديك حل دقيق. لما ترمي كلام عام زي 'التطبيق بايظ'، هيرد عليك باقتراحات عامة وتفضل تلف حوالين نفسك.",
      label: "تشخيص دقيق = حل فوري",
    },
  },
  {
    icon: Scale,
    eyebrow: "الفرق بين دقيقة وساعة",
    title: "إزاي تسأل صح عشان تاخد حل صح",
    block: {
      kind: "comparison",
      left: {
        label: "غلط: «الـ AI مش بيرد»",
        body: "الـ AI المساعد هيرد عليك بـ ١٠ احتمالات عامة: «اتأكد من الـ API key، شوف النت، يمكن السيرفر واقع...». هتفضل تلف حوالين نفسك ساعة ومش هتحل حاجة.",
      },
      right: {
        label: "صح: رسالة الغلط + السيناريو + النتيجة الصح",
        body: "«لما العميل بيكتب سؤال ويدوس Enter، بيطلعلي في الـ Console الرسالة دي: `TypeError: Cannot read property 'map' of undefined at Chat.tsx:42`. المفروض كان الـ AI يرد عليه». في ٣٠ ثانية، الـ AI هيديك الحل بالظبط.",
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
        {
          term: "Error Message (رسالة الغلط)",
          meaning:
            "رسالة من السيستم بتقولك إن فيه حاجة باظت ومحتاجة تتصلح، وبتوصف نوع المشكلة بالظبط.",
          example:
            "زي لما ميكانيكي العربيات يقولك 'البطارية نايمة'، دي رسالة غلط واضحة ومحددة، مش مجرد 'العربية مش بتدور'.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "خلّي الـ AI يبقى المبرمج المساعد بتاعك",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "تخيل إن الـ AI بتاعك بيهنّج لما اليوزر يسأله سؤال طويل. مهمتك تكتب الـ prompt اللي هتسأل بيه الـ AI المساعد (زي ChatGPT أو Claude) إزاي تحل المشكلة دي.",
      prompt:
        "في تسليمك، اكتب prompt كامل للـ AI. الـ prompt لازم يكون فيه الـ ٤ معلومات اللي اتعلمناها:\n\n١. رسالة غلط (ممكن تخترع واحدة شكلها حقيقي زي `TypeError: user.profile is undefined`)\n٢. السيناريو اللي بيسبب المشكلة (١، ٢، ٣...)\n٣. إيه النتيجة الصح اللي كانت المفروض تحصل.\n٤. جزء الكود الصغير اللي فيه المشكلة.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "الـ prompt فيه الـ ٤ عناصر",
          weight: 70,
          criteria: [
            "فيه رسالة غلط واضحة.",
            "فيه سيناريو منطقي للمشكلة.",
            "فيه وصف للنتيجة المتوقعة.",
            "فيه جزء من الكود.",
          ],
        },
        {
          label: "الـ prompt واضح ومباشر",
          weight: 30,
          criteria: [
            "الـ AI يقدر يفهم المشكلة من الـ prompt بس.",
            "مفيهوش كلام عام زي «الكود بايظ».",
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
          question:
            "عميل اشتكى إن لما بيكتب سؤال للـ AI بتاعك ويدوس Enter، الشاشة بتبقى بيضا ومفيش حاجة بتحصل. إيه أول خطوة لازم تعملها عشان تفهم المشكلة؟",
          options: [
            "أفتح الـ Console في المتصفح (F12) عشان أشوف إذا كان فيه رسالة غلط ظاهرة.",
            "أجرّب أغير مكان الزرار في الكود وأشوف لو المشكلة هتتحل.",
            "أبعت للعميل أقوله يجرب تاني.",
          ],
          correctIndex: 0,
          explanation:
            "أول حاجة تعملها في أي مشكلة هي إنك تفتح الـ Console، لأن ٩٩٪ من الأخطاء بتظهر هناك، حتى لو الشاشة بيضا.",
        },
        {
          id: "apply2",
          bloom: "apply",
          question:
            "ظهر لك error غريب وقررت تطلب مساعدة من الـ AI. إيه أحسن طريقة توصف بيها المشكلة عشان تاخد حل دقيق وسريع؟",
          options: [
            "أقول للـ AI: 'الكود بتاعي بايظ، صلحهولي.'",
            "أديله رسالة الغلط بالنص، واسم الفايل ورقم السطر، وأوصفله السيناريو، وأقوله إيه اللي كان المفروض يحصل.",
            "أديله كل الكود بتاع المشروع وأقوله 'فيه حاجة غلط'.",
          ],
          correctIndex: 1,
          explanation:
            "عشان الـ AI يساعدك صح، لازم تديله الـ ٤ معلومات الأساسية: رسالة الغلط، مكانها، سيناريو المشكلة، والنتيجة اللي كنت متوقعها.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question:
            "ظهرلك error في المتصفح بيقول: 'TypeError: Cannot read properties of undefined (reading 'length')'. إيه الجزء من الـ error ده اللي لازم تنسخه للـ AI؟",
          options: [
            "كلمة 'TypeError' بس.",
            "الرسالة كلها: 'TypeError: Cannot read properties of undefined (reading 'length')'.",
            "كلمة 'length' بس.",
          ],
          correctIndex: 1,
          explanation:
            "الـ AI بيتعرف على رسالة الغلط فورًا لما تديهاله كاملة وبالحرف (نسخ/لصق). كل كلمة في الرسالة بتساعده يشخص المشكلة صح.",
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "إزاي بنستخدم ده في Lovable",
    title: "إزاي بنعرف الـ AI بتاعنا غلط في إيه؟",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل غلطة بتتحول لدرس لتحسين الـ AI",
      summary:
        "لما عميل بيكلم أي AI مبني على Lovable، كل سؤال وإجابة بيتسجلوا في **المخزن الذكي (Database)**. لو الـ AI رد رد غريب أو حصل error في **الكواليس (Backend)**، بنسجل الـ error ده مع المحادثة نفسها. ده بيخلينا نعرف بالظبط إيه السؤال اللي لخبط الـ AI، ونقدر نصلحه.",
      bullets: [
        "كل مرة الـ AI مش بيرد صح، بنسجل رسالة الغلط اللي طلعت في الكواليس.",
        "بنربط رسالة الغلط دي بسؤال العميل اللي سببها.",
        "ده بيخلينا نحسّن الـ prompt بتاع الـ AI أو نصلّح الكود عشان ميتلخبطش في نفس السؤال تاني.",
      ],
      pathAngle: "builder",
      link: { label: "شوف سجل الأخطاء ده بنفسك", href: "/build-logs" },
    },
  },
];