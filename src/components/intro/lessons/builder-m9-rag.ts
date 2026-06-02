import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import ragDiagram from "@/assets/lessons/concepts/rag-diagram.jpg";

/**
 * Builder · M9 · Lesson 02 — RAG: AI يرد من بياناتك
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 *
 * يبني على M9.1 (Embeddings) — دلوقتي بنركّب الـ pipeline كامل: Retrieve → Augment → Generate.
 */
export const BUILDER_M9_RAG_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "RAG = الـ AI بيرد من بياناتك إنت، مش من معلومات عامة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "GPT/Gemini يعرفوا حاجات كتير عن العالم، بس مش يعرفوا حاجة عن مشروعك: أسعار منتجاتك، سياسات شركتك، دروس منصّتك.",
        "RAG (Retrieval-Augmented Generation) = ٣ خطوات بسيطة: ندوّر في بياناتنا (Retrieve) → نحقن النتايج في الـ prompt (Augment) → نخلّي الـ AI يرد (Generate).",
        "النتيجة: AI \"يعرف\" مشروعك بدون training، بدون fine-tuning، وبتكلفة ضئيلة.",
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
        { term: "Pipeline", meaning: "خطوات ماشية ورا بعض بتسلم بعض عشان تطلع نتيجة نهائية.", example: "زي مراحل شغل الماركتير: بيبدأ ببحث، بعدين كتابة، بعدين تصميم، وبعدين نشر.. كله ورا بعضه." },
        { term: "Token", meaning: "أصغر وحدة AI بيفهمها؛ ممكن تكون كلمة أو حتة من كلمة.", example: "المحاسب بياخد فاتورة كبيرة، يقرأها حتة حتة (تلاتات تلاتات) عشان يفهم التفاصيل." },
        { term: "Chunking (and Overlap)", meaning: "تقطيع الكلام لحتت صغيرة عشان الـ AI يعرف يدوّر فيها بدقة.", example: "محاسب بيقطع ملف ضرائب لحتت صغيرة عشان لما يدوّر، يلاقي المعلومة بسرعة." },
        { term: "K-Nearest Neighbors (Top-k)", meaning: "رقم إنت بتحدده، بيعرف الـ AI يجيبلك كام نتيجة بالظبط.", example: "لو بتدور على فواتير عميل، k=3 يعني الـ AI يجيبلك أكتر 3 فواتير شبه اللي بتطلبه." },
        { term: "pgvector / Vector Database", meaning: "نوع داتابيز ذكية بتخزن المعلومات في شكل أرقام عشان البحث السريع.", example: "التاجر بيحط بيانات العملاء في جدول خاص بيعرف يدوّر فيه بالمعنى مش بالكلمة." },
        { term: "Context Injection/RAG", meaning: "تزويد الـ AI بمعلومات من عندك جوه السؤال عشان يجاوب صح.", example: "بدل ما الـ AI يهبد، إنت بتبعتله بيانات \"أرصدة المخزن\" عشان يرد منها." },
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
      caption: "Pipeline RAG كامل: chunking → embed → store → retrieve → augment → generate.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Pipeline من ٣ مراحل — كل مرحلة لها دور واضح",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "المرحلة 0 — Indexing (مرة واحدة، أو لما المحتوى يتغيّر): تاخد محتواك (دروس، مقالات، docs) → تقسّمه chunks (مثلاً ٥٠٠ token لكل chunk، مع overlap ٥٠ token عشان السياق ميتقطعش) → تعمل embedding لكل chunk → تخزّنه في pgvector. النتيجة: جدول chunks(id, source_id, content, embedding vector(1536)).",
        "ليه نقسّم لـ chunks أصلاً؟ لو حقنت كتاب كامل في الـ prompt، الـ AI هيغرق في معلومات مش علاقة بالسؤال (وكمان هتدفع tokens كتير). chunks صغيرة = الـ Vector search يلاقي القطعة الأدق، والـ AI يشوف بس ٥-١٠ فقرات علاقة مباشرة. دقة أعلى + تكلفة أقل.",
        "المرحلة 1 — Retrieve: المستخدم يسأل سؤال. تعمل embedding للسؤال. تعمل query: select content from chunks order by embedding <=> $1 limit 5. بترجع أعلى ٥ chunks تشابهًا بسؤاله. ده اللي شغّال في الـ \"Retrieval Layer\" في الـ runtime بتاع المنصة (٥١٦ chunks مفهرسة).",
        "المرحلة 2 — Augment: تركّب prompt جديد فيه: السؤال + الـ ٥ chunks كـ context + تعليمات. مثال: \"أنت مساعد. جاوب على السؤال ده استنادًا فقط على المعلومات اللي تحت. لو الإجابة مش موجودة، قول \"مش متأكد\". السياق:\\n[chunk1]\\n[chunk2]\\n...\\nالسؤال: {user_question}\".",
        "المرحلة 3 — Generate: تبعت الـ prompt للـ LLM (GPT/Gemini). الموديل يولّد إجابة مبنية على الـ context. لو سألت سؤال خارج الـ context، هيقول \"مش متأكد\" بدل ما يخترع (Hallucination). دي القيمة الكبرى للـ RAG: الـ AI بيتقيّد ببياناتك.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "RAG Pipeline: السؤال → استرجاع → دمج → إجابة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: ragDiagram,
      alt: "Diagram للـ RAG: السؤال بيتحوّل لـ vector ويدور في document database، أعلى chunks بترجع وتتدمج مع السؤال في prompt واحد للـ LLM، اللي بيطلّع الإجابة النهائية",
      caption:
        "الـ RAG = Retrieve + Augment + Generate. لما يجي سؤال، الـ system بيدوّر في قاعدة المستندات بـ vector search ويطلّع أعلى chunks علاقة. بعدين بيحقنهم مع السؤال في prompt واحد للـ LLM. اللي بيخلّي الإجابة مبنيّة على معلومات حقيقية من مصدرك، مش هلوسة من الموديل، ومع كل تحديث للمستندات الإجابات بتتحدّث تلقائيًا.",
      label: "RAG Architecture — الـ 5 خطوات",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "Hallucination vs Grounded Answer",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — تبعت السؤال للـ AI من غير context",
        body: "const r = await ai.chat({ prompt: userQuestion }). المستخدم يسأل: \"كام سعر الـ Pro plan في تطبيقك؟\". الـ AI ميعرفش — فبيخترع: \"$29 شهريًا\". غلط. أو يسأل عن سياسة الإرجاع — يخترع كلام منطقي بس مش بتاعك. النتيجة: Hallucination، خسارة ثقة، ودعم فني بيتعب يصلّح أخطاء AI.",
      },
      right: {
        label: "RIGHT — Retrieve أولًا، ثم Generate",
        body: "const queryEmbedding = await embed(userQuestion);\nconst chunks = await db.from('chunks').select('content').order(`embedding <=> '${queryEmbedding}'`).limit(5);\nconst prompt = `جاوب من السياق ده فقط:\\n${chunks.join('\\n')}\\n\\nالسؤال: ${userQuestion}`;\nconst answer = await ai.chat({ prompt });\n\nالنتيجة: لو السعر موجود في docs بتاعتك، الـ AI يرجّعه بدقة. لو مش موجود، يقول \"مش لاقي المعلومة دي\" بدل ما يخترع. + بترجع الـ chunks للمستخدم كـ \"sources\" عشان يتأكد.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "صمّم RAG Pipeline لتطبيقك على ورق",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m9-rag-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو عايز تعمل مساعد دعم فني لمتجر إلكتروني عشان يرد على أسئلة الزباين عن المنتجات وسياسات الشحن، إيه أول خطوة هتعملها عشان تجهز بياناتك لـ RAG؟",
          options: [
            "هتاخد وصف المنتجات وسياسات الشحن وتقسمها قطع صغيرة (chunks) وتخزنها في قاعدة بيانات مع الـ embedding بتاعها.",
            "هتعمل fine-tuning لموديل AI كبير زي GPT عشان يتعلم تفاصيل المنتجات وسياسات الشحن.",
            "هتكتب بنفسك كل الإجابات المحتملة لأسئلة الزباين وتخزنها في جدول في قاعدة البيانات."
          ],
          correctIndex: 0,
          explanation: "أول خطوة هي الـ Indexing، بنقسّم المحتوى لـ chunks ونعملها embedding عشان نقدر نبحث فيها بشكل فعال لما يجي سؤال من المستخدم."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "بعد ما الزبون يسأل سؤال في مساعد الدعم الفني، إيه اللي بيحصل قبل ما الـ AI يبدأ يكون إجابته؟",
          options: [
            "الـ AI بيفتكر كل حاجة يعرفها عن الموضوع وبيبدأ يجاوب.",
            "النظام بيدور في الـ chunks اللي متخزنة وبيجيب أكتر ٥ قطع شبه سؤال الزبون.",
            "النظام بيطلب من الزبون إجابات أكتر عشان يفهم قصده بالضبط."
          ],
          correctIndex: 1,
          explanation: "دي خطوة الـ Retrieval، النظام بيجيب المعلومات المناسبة من قاعدة البيانات (الـ chunks) اللي ليها علاقة بسؤال المستخدم قبل ما يمررها للـ AI."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "إيه فايدة إنك تحط 'السياق' (chunks) في الـ prompt بتاع الـ AI قبل ما يجاوب على سؤال الزبون؟",
          options: [
            "عشان توفر وقت الـ AI ومايحتاجش يدور على المعلومة بنفسه.",
            "عشان الـ AI يرد من المعلومات الخاصة بيك بس ومايترجمش معلومات عامة ممكن تكون غلط أو مش دقيقة لمتجرك.",
            "عشان تزيد سرعة استجابة الـ AI مهما كان حجم البيانات اللي بيدور فيها."
          ],
          correctIndex: 1,
          explanation: "دي خطوة الـ Augment، حقن السياق في الـ prompt بيخلي الـ AI يرد إجابة بناءً على بياناتك الخاصة (Grounded Answer) وبيقلل الـ Hallucinations."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم RAG System لاستخدام حقيقي",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "RAG = Retrieval + Generation. هتصمم system كامل من السؤال للرد النهائي.",
      prompt:
        "في تسليمك:\n\n١) الـ Use case (مثال: شات بوت يجاوب عن منتجاتك):\n٢) Knowledge base — إيه فيها + كام document تقريباً؟\n٣) Retrieval — k = كام؟ (عدد الـ chunks اللي هترجعهم) + threshold للـ similarity؟\n٤) Prompt template للـ LLM (انسخه — لازم يكون فيه placeholder للـ context):\n٥) Citation strategy — هتورّيله المستخدم المصدر إزاي؟\n٦) Failure case — لو الـ retrieval ما جابش حاجة relevant، الـ system بيرد إزاي؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "RAG system كامل",
          weight: 60,
          criteria: [
            "كل المكونات (KB / Retrieval / Prompt / Citation) موجودة.",
            "Prompt template فيه placeholder حقيقي للـ context.",
          ],
        },
        {
          label: "Failure handling",
          weight: 40,
          criteria: [
            "Failure case معالج مش «هيرد عادي».",
            "Citation strategy واضحة (link / quote / number).",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "المساعد بيستخدم RAG على knowledge_chunks",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "المساعد بيستخدم RAG على knowledge_chunks",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. لما تسأل المساعد، إحنا مش بنبعت الـ LLM السؤال على طول. بنبحث الأول في جدول knowledge_chunks (محتوى المنصة كله) ونجيب أقرب ٥ chunks، وبعدين نبعتهم مع السؤال.",
      bullets: [
        "knowledge_chunks جدول فيه كل الدروس مقسّمة chunks مع embeddings.",
        "vector similarity search بـ pgvector على الـ embedding column.",
        "النتيجة: المساعد بيرد من محتوى المنصة، مش من معلومات Gemini العامة.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /ai-assistant", href: "/ai-assistant" },
    },
  }
];
