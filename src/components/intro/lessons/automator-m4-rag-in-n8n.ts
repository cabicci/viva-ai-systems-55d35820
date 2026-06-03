import {
  BookMarked,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen,
  Link2, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import automatorM4RagInN8NScreenshot from "@/assets/lessons/unique/automator-m4-rag-in-n8n.jpg";
/**
 * Automator · M4 · Lesson 02 — RAG جوه الـ Automation
 */
export const AUTOMATOR_M4_RAG_IN_N8N_BLOCKS: IntroLessonContent = [
  {
    icon: Lightbulb,
    eyebrow: "اختياري — للمتقدمين",
    title: "لو هدفك استخدام AI في شغلك فقط، تقدر تعدّي الدرس ده بأمان",
    tone: "accent",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الدرس ده فيه مفاهيم تقنية للناس اللي شغّالة فعلاً على n8n. لو لسه بتتعلم الأساسيات، تقدر تعدّيه دلوقتي وترجعله بعدين — مش هيأثر على باقي رحلتك.",
        "لو فعلًا عايز تبني — يلا نكمل.",
      ],
    },
  },
  {
    icon: BookMarked,
    eyebrow: "HERO",
    title: "RAG جوه الـ Workflow",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الـ LLM لوحده مش عارف منتجك.",
        "RAG بيخلّيه يرد من معرفتك إنت.",
      ],
    },
  },
  {
    icon: Link2,
    eyebrow: "🔗 ربط بـ Builder M9",
    title: "نفس RAG اللي اتعلمناه — بس بـ nodes",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "لو خلّصت Builder M9، إنت عارف الـ pipeline: Embeddings → Vector Search → LLM Call. نفس الـ 3 خطوات هنا بالظبط.",
        "الفرق: في Builder بتكتب الكود اللي بيعمل الـ pipeline. هنا بتسحب 3 nodes جاهزين في n8n وتربطهم.",
        "لو لسه مكملتش Builder M9: RAG في جملة = الـ AI يرد من معرفتك إنت (FAQs، مستندات) مش من معرفته العامة. اقرا الباراجراف اللي تحت يكفّيك للدرس.",
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
        { term: "Chunking", meaning: "تقطيع الملفات الطويلة لحتت صغيرة عشان الذكاء الاصطناعي يفهمها براحته.", example: "لو معاك عقد ٥٠ صفحة، بتقسمه لفقرات عشان الكمبيوتر ميتوهش وهو بيقرا كل ده مرة واحدة." },
        { term: "Embeddings", meaning: "تحويل الكلام لأرقام بتعبر عن معناه عشان الكمبيوتر يفهمه ويقارنه.", example: "زي ما البار كود بيعبر عن سعر المنتج، الـ Embedding بيعبر عن \"معنى\" الكلمة في شكل أرقام." },
        { term: "Vector DB (Database)", meaning: "مخزن شاطر بيسيف البيانات بالأرقام ويخليك تدور فيها بالمعنى مش بالكلمة.", example: "زي أرشيف المحاسب، بتدور فيه بالمعنى؛ لو سألت عن \"الفلوس\" يطلعلك \"الخزنة، الفواتير، والرواتب\" في ثانية." },
        { term: "Indexing", meaning: "عملية تنظيم وتجهيز ملفاتك وتخزينها في المخزن عشان تبقى جاهزة للبحث.", example: "مرحلة \"تستيف\" البضاعة؛ بترتب ملفاتك وتخزنها في الـ Vector DB عشان لما تحتاجها تلاقيها جاهزة." },
        { term: "Retrieval", meaning: "إنك تشد وتطلع المعلومة المناسبة من الداتابيز وقت ما الذكاء الاصطناعي يحتاجها.", example: "مرحلة \"سحب\" الملف؛ لما العميل يسأل، السيستم بيجري يجيب المعلومة الصح من وسط مليون ورقة." },
        { term: "RAG (Retrieval-Augmented Generation)", meaning: "إنك تخلي الذكاء الاصطناعي يذاكر ملفاتك أنت قبل ما يجاوب على أي سؤال.", example: "زي موظف شاطر قدامه \"كتالوج\" المحل؛ بيبص فيه الأول وبعدين يرد على العميل بذكاء." },
        { term: "Connecting Nodes", meaning: "توصيل أدوات الشغل ببعض في n8n عشان المهام تنفذ بعضها أوتوماتيك.", example: "تخيلها زي الوصلات؛ بتوصل \"أداة استقبال الإيميلات\" بـ \"أداة الرد الآلي\" بخط عشان يشتغلوا ورا بعض." },
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
      caption: "إزاي تبني RAG pipeline كامل جوه n8n/Make.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "RAG = خطوتين قبل الـ LLM",
    block: {
      kind: "numberedList",
      items: [
        "Indexing (مرة واحدة): الـ docs/FAQ بتاعتك → chunks → embeddings → تتخزّن في Vector DB.",
        "Retrieval (وقت كل سؤال): سؤال المستخدم → embedding → بحث في الـ Vector DB → جايب top 3 chunks.",
        "Generation: الـ chunks دي + السؤال بيتبعتوا للـ LLM كـ context، فبيرد من بياناتك إنت مش من المعرفة العامة.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "RAG في المنصة بتاعتنا",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM4RagInN8NScreenshot,
      alt: "سكرين شوت من المنصة",
      caption:
        "مساعد المنصة مش بيرد من تدريب الموديل بس — بيعمل retrieval من الدروس بتاعتنا الأول، وبعدين بيرد. ده اللي هتعمله في n8n: نفس الـ 3 خطوات (Embed → Search → LLM Call) بس كـ nodes.",
      label: "من المنصة — درس RAG في Builder",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "Plain LLM vs RAG",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — LLM بدون RAG",
        body: "بتسأل البوت 'سعر المنتج X؟'. الـ LLM ميعرفش، فيخترع رقم. العميل يجي يشتري بالسعر ده وإنت في ورطة.",
      },
      right: {
        label: "RIGHT — LLM + RAG",
        body: "بتعمل retrieval من Vector DB فيها الـ price list. الـ chunk اللي فيه السعر بيتحط في الـ prompt. الـ LLM يرد بالسعر الصح بصياغة لطيفة. غلطة الاختراع ماتحصلش.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "ابني RAG flow بسيط",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m4-rag-in-n8n-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو عندك شركة تأمين وعايز تعمل تشات بوت يرد على أسئلة العملاء عن وثائق التأمين بتاعتك بالظبط، إيه أهم خطوة لازم تعملها قبل ما التشات بوت يبدأ يرد على الناس؟",
          options: [
            "تاخد كل وثائق التأمين بتاعتك وتحوّلها لـ embeddings وتخزّنها في Vector DB.",
            "تدرب موديل لغة كبير (LLM) مخصوص على وثائق التأمين بتاعتك من الصفر.",
            "تظبط الـ prompt بتاع الـ LLM عشان يبقى friendly مع العملاء."
          ],
          correctIndex: 0,
          explanation: "الخطوة دي (اللي بنسميها Indexing) هي اللي بتخلي الـ LLM يقدر يوصل للمعلومات المحددة بتاعتك عن طريق RAG، بدل ما يعتمد على معرفته العامة."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "عميل سأل التشات بوت بتاعك: 'إيه تغطية حادث السيارة في وثيقة التأمين الذهبية؟'. التشات بوت استخدم RAG ولقى 3 قطع نصية (chunks) مرتبطة بالسؤال ده. إيه اللي المفروض يحصل بعد كده عشان الـ LLM يدي إجابة دقيقة؟",
          options: [
            "الـ LLM يروح يبحث في معرفته العامة عن 'تأمين السيارات' ويرد.",
            "الـ 3 قطع دول هيتبعُتوا للـ LLM كـ context مع سؤال العميل عشان يرد بناءً عليهم.",
            "التشات بوت هيقول للعميل يديله رقم وثيقته عشان يدور بنفسه."
          ],
          correctIndex: 1,
          explanation: "دي خطوة الـ Generation، الـ chunks المترجعة من الـ Vector DB هي دي الـ context اللي بيتبعت للـ LLM عشان يرد، وده بيضمن إنه يرد من معلومات محددة."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "بتعمل تشات بوت للعملاء باستخدام RAG، ولقيت إن على طول العملاء بيشتكوا إن البوت بيرد إجابات عامة ومش مرتبطة بمنتجاتك، مع إنك عملت indexing لكل بياناتك. تفتكر إيه ممكن تكون المشكلة في الـ workflow بتاعك؟",
          options: [
            "يمكن الـ embeddings بتاعت الأسئلة مش بتطلع مظبوطة فمش بتجيب الـ chunks الصح من الـ Vector DB.",
            "الـ LLM اللي بتستخدمه قديم ومحتاج تحديث.",
            "السيرفر اللي عليه الـ Vector DB بطيء."
          ],
          correctIndex: 0,
          explanation: "لو الـ embeddings بتاعت السؤال مش دقيقة، الـ Vector DB مش هتعرف تجيب الـ chunks المناسبة، وبالتالي الـ LLM مش هيلاقي الـ context الصح ويرد من معرفته العامة."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم RAG Workflow في n8n لمصدر حقيقي",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "RAG في n8n = Knowledge base + Query + LLM + Response. هتصممه step-by-step لمصدر حقيقي.",
      prompt:
        "في تسليمك:\n\n١) Knowledge source (مثال: FAQ شركة + ٥٠ ملف PDF منتجات):\n٢) Indexing workflow:\n   - كل قد إيه بيشتغل؟\n   - Chunking + Embedding + Storage (أنهي vector DB)؟\n٣) Query workflow:\n   - Trigger (مثال: webhook من شات)\n   - Steps: embed query → search → top-k → format context → LLM → response\n٤) Citation — هترجّع للمستخدم المصدر إزاي؟\n٥) لو الـ retrieval ما لقاش حاجة relevant، الـ flow يعمل إيه؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "Pipeline + Query flow",
          weight: 60,
          criteria: [
            "Indexing وQuery كلهم موصوفين بـ steps.",
            "Chunking + embedding + storage محددين.",
          ],
        },
        {
          label: "Citation + Fallback",
          weight: 40,
          criteria: [
            "Citation strategy واضحة.",
            "Fallback مش «هيرد فاضي».",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "RAG في المساعد = نفس الفكرة بدل n8n",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "RAG في المساعد = نفس الفكرة بدل n8n",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Automator — نفس اللي بتتعلمه. نفس الـ pattern: vector search → context retrieval → LLM call. الفرق إنها اتعملت داخل serverFn بدل n8n workflow. الـ idea اللي اتعلّمتها متطبّقة بلغة كود.",
      bullets: [
        "Step 1: embed سؤال المستخدم.",
        "Step 2: search في knowledge_chunks بـ cosine similarity.",
        "Step 3: inject أعلى 5 chunks في الـ LLM prompt.",
      ],
      pathAngle: "automator",
      link: { label: "افتح /ai-assistant", href: "/ai-assistant" },
    },
  }
];
