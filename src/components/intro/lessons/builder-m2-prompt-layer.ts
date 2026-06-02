import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import promptClarityScreenshot from "@/assets/lessons/builder-m1-prompt-clarity.jpg";

/**
 * Builder · M1 · Lesson 02 (v3 — unified 5-part rhythm)
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 */
export const BUILDER_M2_PROMPT_LAYER_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "أول طبقة أوامر للمساعد",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "طريقة كلامك مع الـ AI",
        "بتغيّر النتيجة بالكامل.",
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
        { term: "Prompt (أمر)", meaning: "الطلب أو الرسالة اللي بتبعتها للـ AI عشان ينفذ لك مهمة.", example: "«اكتبلي بوست فيس بوك يشد الزباين لمحل الموبايلات بتاعي»." },
        { term: "System Prompt (قواعد اللعبة)", meaning: "القواعد والتعليمات الأساسية اللي بتحدد للـ AI شخصيته وممنوعاته.", example: "«إنت محاسب شاطر، راجع القيود دي وطلع الغلطات، وممنوع تغير الأرقام»." },
        { term: "Output Format (شكل النتيجة)", meaning: "شكل النتيجة اللي إنت عاوزها، زي جدول أو لستة أو كود.", example: "«اعملي جدول فيه (اسم العميل) و(المبلغ) و(تاريخ السداد)، بلاش رغي كتير»." },
        { term: "Markdown (تنسيق الجداول)", meaning: "طريقة لتنسيق الكلام بتخلي الحاجة تظهر في شكل جداول أو عناوين.", example: "«طلعلي كشف الحساب في شكل جدول (Markdown) عشان أنقله لملف إكسيل بسهولة»." },
        { term: "Context (السياق)", meaning: "كل المعلومات اللي بتعرف الـ AI الموقف عشان يرد عليك صح.", example: "لما تقوله «طلعلي صافي الربح للمحل ده» ويكون معاك ميزانية السنة اللي فاتت." },
        { term: "Constraints (الحدود)", meaning: "القيود اللي بتحطها للـ AI عشان ما يفتيش أو يغلط.", example: "«ممنوع تطلع أي أرقام من دماغك، التزم بس باللي في الفاتورة دي»." },
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
      caption: "إزاي وضوح طلبك بيغيّر شكل الرد بالكامل.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "كل ما كنت أوضح، النتيجة تبقى أحسن",
    block: {
      kind: "paragraphs",
      paragraphs: [
        'لو قلت للـ AI: "اعمل خطة"، النتيجة هتبقى عامة جدًا.',
        'لو قلت: "اعمل خطة تسويق لمخبز صغير في مصر لمدة 30 يوم"، النتيجة هتبقى مختلفة تمامًا.',
        "كل ما كنت أوضح، الـ AI يعرف يساعدك أحسن.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "صفحة /curriculum في موقعنا",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: promptClarityScreenshot,
      alt: "صفحة خريطة المنهج في المنصة — هيدر، شريط تقدّم، ومراحل مرقّمة",
      caption:
        'الصفحة دي اتبنت بـ prompt واضح: "اعمل صفحة \'خريطة المنهج\' فيها هيدر بعنوان وعدد دروس، شريط تقدّم نسبي، ومراحل مرقّمة تحتها كروت دروس". لو الـ prompt كان "اعملي صفحة منهج" بس، كنا طلعنا قائمة عادية بدون هيكل. نفس الـ AI — الفرق كله في وضوح الطلب.',
      label: "من الموقع — صفحة /curriculum",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "إزاي تكتب طلبك صح",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — طلب غامض",
        body: "بتقوله 'اعمل خطة' وخلاص. الـ AI مش عارف خطة لإيه ولا لمين، فبيرد رد عام مفيهوش حاجة تنفّذها.",
      },
      right: {
        label: "RIGHT — طلب واضح",
        body: "بتقوله: 'اعمل خطة محتوى لمطعم بيتزا في القاهرة لمدة أسبوع'. السياق + المدة + الجمهور = رد عملي تقدر تستخدمه.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "جرّب الفرق بإيدك في دقيقتين",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m2-prompt-layer-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو عايزين الـ AI يعمل لنا بوستات سوشيال ميديا لمحل حلويات جديد اسمه 'سكر زيادة' بيبيع كنافة بالمانجة في القاهرة، وإحنا عاوزينه يقترح أفكار لبوستات لمدة أسبوع. إيه أنسب طريقة نكتب بيها الـ Prompt عشان الرد يبقى زي ما إحنا عايزين بالظبط؟",
          options: [
            "اكتب بوستات سوشيال ميديا",
            "اقترح أفكار لبوستات سوشيال ميديا لمدة أسبوع لمحل حلويات جديد اسمه 'سكر زيادة' في القاهرة بيبيع كنافة بالمانجة.",
            "اعمل خطة تسويق لمحل حلويات"
          ],
          correctIndex: 1,
          explanation: "الخيار ده بيستعمل الـ Specificity والـ Clarity عشان يوضح كل التفاصيل اللي الـ AI محتاجها (اسم المحل، المنتج، المكان، المدة)، وده بيضمن رد أدق وأحسن بكتير زي ما الدرس وضح."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "صاحب كافيتريا في أسوان عاوز الـ AI يعمل له شوية اقتراحات للوجبات الخفيفة والقهوة الجديدة اللي ممكن يقدمها في الصيف. كتب Prompt بيقول: 'اعمل اقتراحات للكافيتريا.' تفتكر الـ AI هيرد عليه برد useful ليه؟",
          options: [
            "أيوه، الـ AI ذكي وهيفهم لوحده هو عايز إيه بالظبط.",
            "لأ، الـ Prompt عام زيادة عن اللزوم ومفيهوش معلومات كفاية عن المطلوب أو السياق عشان الـ AI يقدر يساعده صح.",
            "ممكن يديله اقتراحات، بس مش هتكون مناسبة للصيف أو لأسوان."
          ],
          correctIndex: 1,
          explanation: "الـ Prompt هنا ناقصه Context و Specificity. الـ AI مش هيعرف إن الكافيتريا في أسوان ولا إنها في الصيف، فمش هيقدر يقدم اقتراحات مفيدة ومناسبة. لازم نوفر معلومات أكتر للـ AI عشان يقدر يساعدنا أحسن."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "مدير مشروع بيطلب من الـ AI يعمل له 'خطة'. الـ AI رد بخطة عامة جداً ومفيهاش أي تفاصيل لمشروعه. إيه المشكلة الأساسية في الـ Prompt اللي استخدمها المدير؟",
          options: [
            "الـ AI مكنش شاطر كفاية ومفهيمش قصده.",
            "الـ Prompt كان ناقصه Clarity و Specificity تحديداً عن نوع الخطة والمشروع اللي بيتكلم عنه.",
            "المدير كان المفروض يكلم الـ AI بطريقة ودية أكتر عشان يفهم."
          ],
          correctIndex: 1,
          explanation: "المشكلة الرئيسية هنا إن الـ Prompt كان شامل وعام زيادة عن اللزوم. لو المدير كان حدد نوع الخطة (مثلاً: خطة تسويق، خطة عمل) والمشروع اللي بيتكلم عنه، كان الـ AI هيرد برد أدق ومفيد أكتر زي ما شرحنا في أهمية الوضوح والتحديد."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "ابني Prompt من ٣ طبقات لمساعد ذكي حقيقي",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "هتصمم System / User / Output Format لمساعد بيخدم حالة استخدام محددة عندك (مثلاً بوت دعم فني، مساعد كتابة...).",
      prompt:
        "في تسليمك:\n\n١) حالة الاستخدام في سطر (مين المساعد + لمين بيخدم):\n٢) System Prompt — الدور + النبرة + الحدود (٥-٨ سطور):\n٣) User Prompt مثال — سؤال حقيقي محتمل من المستخدم:\n٤) Output Format — هتفرض إيه على الرد؟ (JSON / Markdown / بنية محددة)\n٥) إيه اللي ممنوع المساعد يعمله مهما حصل؟ (في System Prompt صراحة)",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "الـ ٣ طبقات بمحتوى ملموس",
          weight: 60,
          criteria: [
            "System فيه دور + نبرة + حدود واضحة، مش «اتصرف كمساعد ذكي».",
            "Output Format محدد ببنية (مش وصف عام).",
          ],
        },
        {
          label: "الحدود + الممنوعات",
          weight: 40,
          criteria: [
            "كتبت ممنوعات صريحة في الـ System (مثال: ممنوع تطلع info طبية).",
            "الـ User Prompt حقيقي يقدر يكشف لو الـ System شغال.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "System prompt المساعد جوّه /assistant-runtime",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "System prompt المساعد جوّه /assistant-runtime",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. المساعد في المنصة معاه system prompt مكتوب بعناية، بيحدّد إزاي يرد، إيه يقول وإيه ميقولش. ده اللي شفته في الدرس — أول طبقة أوامر.",
      bullets: [
        "الـ prompt مكتوب بصيغة واضحة: «إنت مساعد لمنصة تعليمية…».",
        "بنحدّد له الـ tone (مصري بسيط) والـ scope (ميخرجش بره الدروس).",
        "تقدر تشوف الـ prompt الكامل في /assistant-runtime تحت تبويب «Prompt».",
      ],
      pathAngle: "builder",
      link: { label: "افتح /assistant-runtime", href: "/assistant-runtime" },
    },
  }
];
