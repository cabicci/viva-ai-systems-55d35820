import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import embeddingsDiagram from "@/assets/lessons/concepts/embeddings-diagram.jpg";

/**
 * Builder · M9 · Lesson 01 — Embeddings: لغة الـ AI الرقمية
 * V2 Editor: Expert Instructional Designer + Egyptian Dialect Specialist
 *
 * RULES APPLIED:
 * 1. No Theory Without Tension: Starts with the pain of DBs not understanding "meaning".
 * 2. Quick Win in 30s: The visual diagram is now the second block for an immediate "aha" moment.
 * 3. Example before Term: The visual diagram serves as the sensory example before the "Embedding" concept is formally defined.
 * 4. One Technical Term: The lesson now focuses exclusively on "Embedding". The long list of concepts is removed.
 * 5. Simple Mission: The mission is simplified to two direct questions about the user's own project.
 * 6. Pure Egyptian Dialect: All text is rewritten in Cairo Ammiya.
 * 7. No Repetition: The dense "الفكرة" block and repetitive "Concepts" block were removed, their essential ideas woven into other sections.
 * 8. Momentum: The flow is now Problem -> Visual -> Concept -> How-To -> Apply -> Mission -> Real-world proof.
 *
 * NOTE: The video block was removed to maintain an active learning flow and avoid passive content, per V2 principles.
 */
export const BUILDER_M9_EMBEDDINGS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "المشكلة",
    title: "الـ AI مش بيفهم كلامك، بيفهم أرقام",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "في M8 خزّنت بيانات في جداول. الداتابيز شاطرة قوي في مقارنة الأرقام والنصوص الحرفية، بس مبتعرفش تفهم \"المعنى\".",
        "لو سألت الداتابيز: \"هاتلي الحاجات اللي شبه طلبي ده\"، هترد تقولك معرفش. لأن كلمة \"شبه\" دي مش عملية حسابية زي `=` أو `LIKE`.",
        "طب إيه الحل عشان نخلي البحث \"ذكي\" ويفهم المعنى؟ هنا بييجي دور الـ Embeddings.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "جرّب تشوف المعنى بعينك",
    title: "إزاي الكلام بيتحوّل لخريطة معاني",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: embeddingsDiagram,
      alt: "رسم بياني للـ embeddings: جملة بتتحول لقايمة أرقام (vector)، والـ vectors دي بتترسم في فضاء ثلاثي الأبعاد، الجمل اللي معناها قريب بتبقى جنب بعضها.",
      caption:
        "تخيل إن كل كلمة أو جملة ليها مكان على خريطة. الكلام اللي معناه قريب من بعضه (زي \"قطة بتلعب\" و \"كلب بيجري\") بيبقوا نقط قريبة من بعض. والكلام اللي معناه بعيد (زي \"البورصة\") بيبقى في حتة تانية خالص. هي دي فكرة الـ Embeddings ببساطة.",
      label: "من نص لـ Vector لخريطة معاني",
    },
  },
  {
    icon: BookOpen,
    eyebrow: "المصطلح الوحيد للدرس",
    title: "Embedding: إحداثيات المعنى",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Embedding (تمثيل رقمي للمعنى)",
          meaning: "عملية تحويل أي حاجة (كلام، صور، صوت) لـ vector (قايمة أرقام طويلة)، عشان الـ AI يقدر يقيس المعنى والتشابه رياضيًا.",
          example: "زي ما الخريطة بتحوّل مكان زي \"بيتنا\" لإحداثيات (خط طول وعرض)، الـ embedding بيحوّل كلمة \"عربية\" لقايمة من 1536 رقم بتوصف معناها من كل الزوايا."
        },
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "إزاي بتشتغل؟",
    title: "البحث بالكلمة الحرفية vs. البحث بالمعنى",
    block: {
      kind: "comparison",
      left: {
        label: "غلط — البحث بـ ILIKE",
        body: "لو اليوزر كتب \"إزاي الـ AI بيرد؟\"، الكود هيدور على جملة \"إزاي الـ AI بيرد\" حرفيًا. غالبًا النتيجة هتبقى صفر، مع إن عندك دروس بتشرح ده بس بكلمات تانية. بحث غبي.",
      },
      right: {
        label: "صح — البحث بالـ Embedding",
        body: "بناخد سؤال اليوزر ونحوله لـ embedding. الكود بيدوّر على أقرب 5 دروس لسؤاله في المعنى. النتيجة: هيطلعله دروس عن الـ tokens والـ context، حتى لو كلمة \"يرد\" مش مكتوبة فيهم. بحث ذكي بيحسسك إنه \"فاهمك\".",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "إيه أهم حاجة تحوّلها لـ Embedding؟",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m9-l25-embeddings-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "في مدونة أكل صحي، كل وصفة ليها 'اسم' و'مكونات' و'طريقة تحضير'. لو اليوزر عايز يدور على \"وصفات سهلة وسريعة\"، إيه أحسن حاجة نعملها embedding؟",
          options: [
            "اسم الوصفة بس.",
            "طريقة التحضير بس.",
            "نلزق (اسم الوصفة + المكونات + طريقة التحضير) في بعض ونعملهم embedding واحد."
          ],
          correctIndex: 2,
          explanation: "عشان الـ AI يفهم إن الوصفة \"سهلة وسريعة\"، لازم يشوف الصورة كاملة: اسمها ومكوناتها وطريقة تحضيرها. كل ما تدي له سياق أكتر، فهمه للمعنى بيبقى أعمق."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "في موقع عقارات، العميل بيدور على \"شقة واسعة ببلكونة كبيرة على النيل\". بيانات الشقة هي 'عنوان'، 'تفاصيل'، 'مساحة'، 'عدد الغرف'. إيه أهم حقل تستخدمه للـ embedding؟",
          options: [
            "حقل 'العنوان' بس.",
            "حقل 'تفاصيل' الشقة (اللي فيه الوصف التفصيلي).",
            "نجمع 'المساحة' و 'عدد الغرف' كرقم واحد."
          ],
          correctIndex: 1,
          explanation: "حقل 'التفاصيل' هو اللي غالبًا فيه الكلام اللي بيوصف الإحساس زي \"بلكونة كبيرة\" و\"إطلالة على النيل\". ده الكنز اللي الـ AI بيستخدمه عشان يفهم قصد العميل بالظبط."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "عندك موقع أخبار فيه مقالات طويلة (5000 كلمة). إزاي تعمل embedding للمقالات دي عشان البحث يبقى دقيق والتكلفة قليلة؟",
          options: [
            "أعمل embedding للعنوان بس عشان أوفر.",
            "أعمل embedding للمقال كله مرة واحدة.",
            "أقسّم المقال لحتت صغيرة (chunks) وكل حتة ليها الـ embedding بتاعها."
          ],
          correctIndex: 2,
          explanation: "الموديلات ليها حد أقصى لطول النص. تقسيم المقال الطويل لـ chunks بيضمن إن كل جزء مهم من المعنى ياخد الـ embedding الخاص بيه، وده بيخلي البحث أدق ويرجعلك الفقرة المحددة اللي بتجاوب على السؤال."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم مخزن المعاني لتطبيقك",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "الـ Embedding هو اللي بيحوّل النص لأرقام بتقيس المعنى. مهمتك دلوقتي تطبّق ده على فكرة تطبيقك.",
      prompt:
        "لتطبيقك اللي بتبنيه، اختار نوع محتوى واحد (مقالات، منتجات، دروس، ...إلخ). جاوب على سؤالين:\n\n١) إيه النص بالظبط اللي هتحوّله لـ embedding عشان البحث يشتغل بالمعنى؟ (مثال: عنوان المنتج + وصفه + مراجعات العملاء)\n\n٢) اكتب مثال لسؤال من مستخدم، وإيه النتايج اللي المفروض تطلعله بناءً على البحث بالمعنى ده.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "تحديد النص للـ Embedding",
          weight: 50,
          criteria: [
            "حددت بالظبط إيه الحقول اللي هتتجمع عشان تعمل الـ embedding.",
            "شرحت ليه اختيارك ده هو اللي هيدي للـ AI أحسن سياق.",
          ],
        },
        {
          label: "مثال للبحث بالمعنى",
          weight: 50,
          criteria: [
            "كتبت سؤال واقعي من مستخدم.",
            "وصفت النتايج المتوقعة اللي بتثبت إن البحث فهم المعنى مش الكلمة الحرفية.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من منصتنا",
    title: "إزاي بنستخدم Embeddings في Lovable",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "جدول `knowledge_chunks` فيه عمود `embedding` من نوع `vector`",
      summary:
        "الجزء ده من المنصة مبني بنفس الأدوات اللي بتتعلمها. كل قطعة محتوى (chunk) بنحوّلها لـ vector (1536 رقم). لما بتسأل سؤال، بنحوّل سؤالك لنفس النوع من الـ vectors وندور على أقرب chunks ليه في المعنى.",
      bullets: [
        "بنستخدم pgvector extension جوه PostgreSQL.",
        "كل chunk حجمها حوالي 500 token، والـ embedding بتاعها مساحته 6KB.",
        "البحث بياخد أجزاء من الثانية حتى مع آلاف الـ chunks.",
      ],
      pathAngle: "builder",
      link: { label: "جرّب الـ AI Assistant", href: "/ai-assistant" },
    },
  }
];