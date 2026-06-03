import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import instructionsExamplesScreenshot from "@/assets/lessons/builder-m2-l4-instructions-examples.jpg";

/**
 * Builder · M2 · Lesson 02 — Instructions vs Examples
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 */
export const BUILDER_M2_INSTRUCTIONS_EXAMPLES_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "Instructions ولا Examples؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تقوله يعمل إيه،",
        "ولا توريه شكل اللي عايزه؟",
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
        { term: "Instructions (التعليمات)", meaning: "الأوامر المباشرة اللي بتكتبها للذكاء الاصطناعي عشان ينفذ مهمة معينة.", example: "لما تقول للصناعي \"اعملي كذا\"، دي التعليمات اللي بيمشي عليها." },
        { term: "Prompt (البرومبت)", meaning: "هي الرسالة الكاملة اللي بتبعتها للـ AI (التعليمات + الأمثلة).", example: "لما تطلب من المساعد يكتب إيميلات وتقول له \"اكتب بأسلوب ودي لشغل التسويق\"." },
        { term: "Role (الدور)", meaning: "تحديد وظيفة الـ AI (زي \"خبير ضرائب\") عشان يجاوب بدقة.", example: "زي ما بتعرف نفسك في الإيميل إنك \"المحاسب المالي\" للشركة." },
        { term: "Output Format (شكل الرد)", meaning: "شكل الرد اللي عاوزه (نقط، جدول، أو ملف معين).", example: "أطلب منه يحسب ضريبة وفي الآخر أقوله \"طلع النتيجة في جدول\"." },
        { term: "Few-shot (أمثلة توضيحية)", meaning: "إنك تديله شوية أمثلة توضحه يشتغل إزاي قبل ما يجاوب.", example: "بتقوله: \"خد 3 فواتير أهم عشان تعرف نظامي، وكمل إنت الباقي\"." },
        { term: "Zero-shot (من غير أمثلة)", meaning: "بتطلب الطلب مباشرة من غير ما تدي أي أمثلة للـ AI.", example: "بتقوله: \"حل المسألة دي فوراً\" من غير ما توريه أي حلول قديمة." },
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
      caption: "الفرق بين إنك توصف للـ AI، أو تديله مثال يقلّده.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "وصف بالكلام، ولا نموذج جاهز؟",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Instruction = بتوصف المطلوب بكلامك. زي: \"اكتبلي عنوان قصير وجذاب لمنتج عطر\".",
        "Example = بتوريه نموذج ليه نفس الشكل اللي إنت عايزه. زي: \"على نمط 'رائحة بتفضّل بعدك' — اعملي 5 عناوين زيّه لمنتجات تانية\".",
        "الـ AI شاطر جدًا في التقليد. أوقات مثال واحد بيوصّل المعنى أحسن من فقرة شرح كاملة.",
        "القاعدة: لو الشكل أو الأسلوب صعب توصفه بالكلام — وريه مثال. لو السياق واضح ومحتاج خطوات — اكتبلوه instructions.",
        "الأفضل غالبًا = الاتنين مع بعض. تعليمات قصيرة + 1-3 أمثلة. ده اللي بيتسمّى Few-shot prompting.",
        "ولو طلبت من غير أمثلة خالص (تعليمات بس) — ده Zero-shot. مناسب لمهام بسيطة زي «ترجم الجملة دي» أو «لخّص الفقرة».",
        "حدّد كمان شكل الرد (Output Format): «اعمل ٥ عناوين على شكل قائمة مرقّمة» أو «رد بـ JSON فيه title و subtitle». ده بيخلّي الرد جاهز للاستخدام أو الربط ببرنامج تاني.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "كروت المسارات في الصفحة الرئيسية",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: instructionsExamplesScreenshot,
      alt: "الصفحة الرئيسية للمنصة — قسم 'من باني إلى صاحب أعمال' بـ 5 كروت متطابقة الشكل",
      caption:
        "الـ 5 كروت دي (الباني، المُبدع، المُؤتمت، المحلّل، صاحب الأعمال) كلها بنفس الهيكل بالظبط: badge مرحلة + أيقونة + عنوان + role label + وصف. ده مكنش من instructions طويلة — كان كارت واحد كـ مثال + جملة: \"اعمل 4 زيّه للمسارات التانية\". الـ AI قلّد الـ pattern وطلّع الـ 4 الباقيين بنفس الإيقاع.",
      label: "من الموقع — صفحة /",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "إمتى تستخدم إيه",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — وصف طويل بدون مثال",
        body: "بتفضل تشرح وتشرح: \"عايز عنوان عاطفي مش مباشر يخلّي القارئ يحس بـ...\". الـ AI بيتلخبط لإن الكلام مفتوح للتفسير، فبيطلّع حاجة جنب اللي إنت متخيّله.",
      },
      right: {
        label: "RIGHT — مثال + تعليمة قصيرة",
        body: "بتقوله: \"على نمط 'رائحة بتفضّل بعدك' — اعملي 5 زيّه\". الـ AI شاف الشكل والمزاج والطول، فبيقلّد بدقة. مثال واحد = 100 كلمة شرح.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "جرّب Few-shot في دقيقتين",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m2-l4-instructions-examples-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "إنت عايز الـ AI يكتبلك بوستات سوشيال ميديا عن عادات يومية بتأثر في المزاج، بس محتاجهم بنفس الشكل ده: \"فطار متوازن بيخلي يومك أحسن\". إيه أحسن طريقة عشان الـ AI يفهم اللي إنت عايزه بالظبط؟",
          options: [
            "أديله أمثلة كتير زي اللي في دماغي (Few-shot prompting).",
            "أكتبله تعليمات طويلة ومفصلة قوى عن شكل الجملة.(Instructions)",
            "أقوله بس يكتبلي بوستات عن العادات اليومية وخلاص (Zero-shot)."
          ],
          correctIndex: 0,
          explanation: "لما يكون المطلوب شكل أو أسلوب معين صعب توصفه بالكلام، الأفضل إنك تدي الـ AI أمثلة (Examples) عشان يقلدها، وده اللي بنسميه Few-shot prompting."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "لو إنت بتطلب من الـ AI يلخصلك مقال، وعايزه يعمل الخطوات دي بالترتيب: اقرا المقال، حدد الأفكار الرئيسية، لخص كل فكرة في سطر، جمع التلخيص في فقرة واحدة. إيه الأنسب عشان تضمن الـ AI يمشي على الخطوات دي؟",
          options: [
            "أكتبله تعليمات واضحة بالخطوات اللي يعملها (Instructions).",
            "أديله مثال واحد بس لمقال متلخص جاهز (One-shot example).",
            "أقوله لخص المقال وخلاص وهو هيتصرف (Zero-shot)."
          ],
          correctIndex: 0,
          explanation: "لو المهمة محتاجة خطوات واضحة أو سياق معين، الأفضل إنك تكتبله تعليمات (Instructions) تقول للـ AI يعمل إيه بالظبط."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "إنت عايز الـ AI يطلعلك أسماء منتجات جديدة، بس بشرط إن الإسم يكون من كلمة واحدة بس ومكون من 5 حروف ومفيهوش حرف الـ 'كاف'. إيه الطريقة الأمثل عشان تضمن إن الشروط دي كلها تتنفذ؟",
          options: [
            "أديله تعليمات واضحة عن شروط الإسم المطلوب، مع مثالين-تلاتة ملتزمين بالشروط دي (Few-shot prompting).",
            "أقوله يطلع أسماء منتجات وخلاص من غير أي شروط عشان محدش يزهق (Zero-shot).",
            "أديله مثال لاسم منتج واحد بس وأقوله اعمل زيه (One-shot example)."
          ],
          correctIndex: 0,
          explanation: "الأفضل غالبًا هو إنك تجمع الاتنين مع بعض: تعليمات قصيرة ومحددة للطلبات الصعبة، مع 1-3 أمثلة بتوري الـ AI الشكل اللي إنت عايزه، وده اسمه Few-shot prompting."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "حوّل Prompt ضعيف لـ Prompt بـ Examples فعّالة",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Few-shot examples هي اللي بتحوّل رد عام لرد بأسلوبك إنت. هتاخد prompt ضعيف وتحطّ ٣ أمثلة Input→Output ترفع جودته.",
      prompt:
        "في تسليمك:\n\n١) Prompt ضعيف بتطلبه (مثال: «اكتب وصف منتج»):\n٢) رد الموديل على الـ Prompt الضعيف (انسخه):\n٣) نفس الـ Prompt + ٣ أمثلة Input→Output بأسلوبك:\n٤) رد الموديل المحسّن (انسخه):\n٥) في سطرين: إيه اللي اتغير، ولِيه الـ Examples اشتغلت؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "Before vs After حقيقي",
          weight: 60,
          criteria: [
            "نسخت الردين قبل وبعد بدون تلخيص.",
            "الـ ٣ أمثلة بأسلوب متسق (مش عشوائية).",
          ],
        },
        {
          label: "تحليل التحسن",
          weight: 40,
          criteria: [
            "وصفت تغيّر محدد (أسلوب/بنية/طول) مش «بقى أحسن».",
            "استخدمت مصطلح من الدرس (few-shot / pattern matching).",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "Few-shot examples في المساعد",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "Few-shot examples في المساعد",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. system prompt المساعد فيه ٣ examples (سؤال → جواب) قبل ما يبدأ. ده مش صدفة — أمثلة بتعلّم الـ AI الـ format المطلوب أحسن من أي instructions طويلة.",
      bullets: [
        "مثال واحد ع الرد لما المستخدم يسأل سؤال خارج المنصة.",
        "مثال على الرد القصير لما السؤال واضح، والرد الطويل لما يحتاج خطوات.",
        "النتيجة: المساعد بيلتزم بالـ format من غير ما نكتبله ١٠٠ قاعدة.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /assistant-runtime", href: "/assistant-runtime" },
    },
  }
];