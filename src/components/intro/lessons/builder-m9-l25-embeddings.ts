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
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 *
 * يبني على M8 (Database) — دلوقتي بنخزّن المعنى نفسه كأرقام عشان الـ AI يفهمه.
 */
export const BUILDER_M9_EMBEDDINGS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "الـ AI مش بيقرأ كلامك — بيقرأ أرقام",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "في M8 خزّنت بيانات في جداول. الـ DB بيعرف يقارن الأرقام والنصوص بدقة، بس مش بيعرف يفهم \"المعنى\".",
        "لو سألت الـ DB: \"هات اللي شبه طلبي\"، مش هيعرف يجاوب — لأن الكلام ده مش = أو LIKE، ده تشابه دلالي.",
        "الحل = Embedding: نحوّل أي نص (سؤال، درس، منتج) لـ vector من أرقام، والمعنى المتشابه بيبقى قريب رياضيًا.",
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
        { term: "Chunking", meaning: "تقطيع النص الطويل لحتت صغيرة عشان الـ AI يعرف يعالجها ويفهمها.", example: "زي ما بتقسم مقال طويل لفقرات صغيرة عشان تبعتها في رسالة واتساب لعميلك وتعرف تناقشه فيها." },
        { term: "Vector (قائمة أرقام) constellations", meaning: "قائمة أرقام بتوصف \"هوية\" الكلمة أو النص عشان الكمبيوتر يفهمها.", example: "تخيل لو بتوصف قميص بـ (لون، مقاس، تمن)، دي قائمة أرقام بتعرف الـ AI القميص ده إيه." },
        { term: "Embedding", meaning: "عملية تحويل الكلمات لـ Vector (أرقام) عشان الـ AI يقيس معناها.", example: "زي ما تحول مواصفات \"فستان سهرة\" و\"بدلة عريس\" لأرقام بتعبر عن شياكتهم وقيمتهم." },
        { term: "High-dimensional space (فضاء الأبعاد)", meaning: "تخيل خيالي فيه كذا اتجاه مش بس طول وعرض، بيجمع صفات كتير.", example: "بدل ما توصف الشغل بطول وعرض بس، بتوصفه بمليون حاجة (سعر، جودة، وقت) سوا." },
        { term: "Similarity (التشابه)", meaning: "قياس المسافة بين رقمين عشان نعرف النصوص قريبة من بعض في المعنى؟", example: "زي ما تدور على \"أكل بيتي\" فيطلع لك \"محشي\" و\"ملوخية\" بدل \"سندوتشات\" سريعة." },
        { term: "Cosine Distance (<=>)", meaning: "علامة في الكود بتستخدم لقياس المسافة بين معاني الكلمات عشان نقارنهم.", example: "دي الأداة أو المسطرة اللي بتعرف الـ AI \"المسافة\" بين معاني الكلمات بالظبط." },
        { term: "Vector Database", meaning: "دولاب مخزن كبير بنحط فيه الـ Vectors عشان ندور بالمعنى مش بالكلمة.", example: "زي ما تاجر ملابس يخزن آلاف الموديلات بأرقامها عشان لما زبون يطلب \"حاجة شيك\" تطلع له." },
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
      caption: "Embedding Models، Vector، Cosine Similarity، و pgvector في Postgres.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Embedding = إحداثيات للكلام في فضاء المعنى",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "تخيّل خريطة عملاقة، فيها كل كلمة وكل جملة لها مكان. الكلام المتشابه في المعنى = نقاط قريبة من بعض. \"عربية\" قريبة من \"سيارة\"، بعيدة عن \"موزة\". الخريطة دي مش 2D — هي مئات أو آلاف الأبعاد (مثلاً 1536 بُعد في OpenAI text-embedding-3-small، أو 3072 في Gemini gemini-embedding-001). كل بُعد = جانب من المعنى.",
        "الـ Embedding Model = موديل AI متخصّص بس في تحويل النص لـ vector. بتديله نص، بيرجّعلك array من أرقام بطول ثابت (مثلاً ١٥٣٦ أو ٣٠٧٢ رقم زي [0.012, -0.04, 0.83, ...]) حسب الموديل. نفس النص بيدّيك نفس الـ vector دايمًا. النصين المختلفين بنفس المعنى بيدّوا vectors قريبة.",
        "Cosine Similarity = الزاوية بين vector و vector. قيمتها بين -1 و 1. الـ 1 = نفس الاتجاه (معنى متطابق). 0 = مفيش علاقة. -1 = عكس. ده اللي بنستخدمه نقول: \"هات أقرب ١٠ نصوص لسؤالي\" → ORDER BY cosine_similarity DESC LIMIT 10.",
        "تخزين في DB: pgvector = extension في Postgres بتضيف نوع column جديد اسمه vector(1536). بتعمل: alter table lessons add column embedding vector(1536). لكل lesson، بتحسب embedding للنص بتاعها وتخزّنه. وقت البحث: select * from lessons order by embedding <=> $1 limit 10 (الـ <=> = cosine distance operator).",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "إزاي النص بيتحوّل لـ vector والمعاني المتقاربة بتقع جنب بعض",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: embeddingsDiagram,
      alt: "Diagram لـ embeddings: جملة بتتحوّل لـ vector أرقام، والـ vectors بتتموضع في فراغ ثلاثي الأبعاد، الجمل المتشابهة قريبة من بعض والمختلفة بعيدة",
      caption:
        "الـ embedding model بياخد النص ويطلّع منه vector — مجموعة أرقام بتمثّل المعنى. الـ vectors بتتموضع في فراغ متعدّد الأبعاد بحيث الجمل اللي معناها قريب (زي \"قطة بتلعب\" و \"كلب بيجري\") تكون قريبة جغرافيًا، والجمل البعيدة في المعنى (زي \"البورصة\" أو \"الفيزياء\") تكون بعيدة. ده اللي بيخلّينا نـ search بالمعنى، مش بالكلمات.",
      label: "Text Embeddings — من نص لـ vector لـ semantic space",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "البحث بالكلمات vs البحث بالمعنى",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — ILIKE %query%",
        body: "select * from lessons where title ilike '%' || $1 || '%' or body ilike '%' || $1 || '%'. لو المستخدم كتب \"إزاي الـ AI بيعرف يرد؟\"، الـ query هيدوّر على نص حرفي \"إزاي الـ AI\" في العناوين. النتيجة: ٠ نتايج، رغم إن عندك ٥ دروس بتشرح ده بكلمات تانية. أو نتايج كتير ضعيفة لأن الكلمة موجودة بس في سياق مختلف.",
      },
      right: {
        label: "RIGHT — embedding + cosine similarity",
        body: "بتاخد سؤال المستخدم → embedding → select id, title from lessons order by embedding <=> $1 limit 5. النتيجة: أعلى ٥ دروس متشابهة دلاليًا، حتى لو الكلمات مختلفة. \"إزاي الـ AI بيرد؟\" يرجّع دروس عن tokens, sampling, context — رغم إن كلمة \"يرد\" مش فيهم. ده اللي بيخلّي ChatGPT و Perplexity يحسّوا إنهم \"فاهمين\".",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "ارسم خطة تخزين Embeddings لمحتوى تطبيقك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m9-l25-embeddings-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "مدونة أكلات صحية فيها وصفات كتير، كل وصفة ليها 'اسم' و 'المكونات' و 'طريقة التحضير'. اليوزر عايز يدور على وصفات \"مكوناتها قليلة وسهلة تتحضر بسرعة\". إيه أحسن حقل نعمله embedding عشان الـ AI يفهم قصده؟",
          options: [
            "اسم الوصفة بس",
            "طريقة التحضير بس",
            "نجمع (اسم الوصفة + المكونات + طريقة التحضير) ونعملهم embedding واحد"
          ],
          correctIndex: 2,
          explanation: "عشان الـ AI يقدر يفهم المعنى الشامل للوصفة وهل هي \"سهلة وسريعة\" لازم يكون عنده كل السياق المتاح في حقول 'اسم الوصفة' و 'المكونات' و 'طريقة التحضير' مجتمعين."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "لو عندك موقع عقارات والعميل بيبحث عن \"شقق واسعة فيها بلكونة كبيرة وإطلالة على النيل\". بيانات الشقة متخزنة كـ 'عنوان'، 'تفاصيل'، 'مساحة'، 'عدد الغرف'. أي من دول ممكن تستخدمه كـ `text_for_embedding`؟",
          options: [
            "الحقل اللي فيه الـ 'عنوان' بس",
            "الحقل اللي فيه 'تفاصيل' الشقة (اللي بتوصف مميزاتها بالتفصيل)",
            "نجمع 'مساحة' و 'عدد الغرف' في الـ embedding"
          ],
          correctIndex: 1,
          explanation: "حقل 'تفاصيل' الشقة هو اللي غالبًا بيحتوي على الوصف الغني زي 'بلكونة كبيرة' و 'إطلالة على النيل'، وده اللي الـ AI هيستخدمه للبحث الدلالي عن طريق الـ embedding."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "عندك موقع أخبار بيعرض مقالات، وكل مقال ليه 'عنوان' و 'محتوى'. المقالات الطويلة ممكن توصل لـ 5000 كلمة. إزاي تتعامل مع الـ embedding للمقالات دي عشان تضمن دقة البحث وتقليل التكلفة؟",
          options: [
            "اعمل embedding لـ 'العنوان' بس عشان أوفر",
            "اعمل embedding لـ 'المحتوى' كله بغض النظر عن طوله",
            "أقسم 'المحتوى' لأجزاء صغيرة (chunks) وكل جزء ليه الـ embedding بتاعه"
          ],
          correctIndex: 2,
          explanation: "النص الطويل (> 8000 token) لازم يتقسّم لـ chunks عشان نضمن إن الـ embedding موديل يشتغل بكفاءة ويتجنب تجاوز limit التوكنز، وكمان عشان البحث يبقى أدق لكل جزء من المقال."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم Embedding pipeline لمصدر محتوى حقيقي",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Embeddings = حوّل النص لأرقام بتقيس المعنى. هتصمم pipeline لمصدر محتوى (مدونتك / دروسك / كتالوج منتجاتك).",
      prompt:
        "في تسليمك:\n\n١) المصدر (مثال: ٥٠٠ مقال مدونة):\n٢) Chunking — هتقسم النص ازاي؟ (حجم كل chunk + overlap):\n٣) Embedding model — أنهي + ليه (text-embedding-3-small مثلاً)؟\n٤) Storage — فين هتخزّن الـ vectors؟ (Supabase pgvector / Pinecone)\n٥) Index type + dimension:\n٦) لو حد سأل سؤال، الـ flow بالكامل من السؤال للنتيجة (٤-٥ خطوات).",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "Pipeline كامل",
          weight: 60,
          criteria: [
            "Chunking strategy مع رقم محدد للحجم.",
            "Model + storage + index type كلهم محددين.",
          ],
        },
        {
          label: "Query flow",
          weight: 40,
          criteria: [
            "وصفت رحلة السؤال للنتيجة بـ ٤-٥ خطوات.",
            "Flow فيه embed query + similarity search + ranking.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "knowledge_chunks فيه عمود embedding من نوع vector",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "knowledge_chunks فيه عمود embedding من نوع vector",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. كل chunk من المحتوى متحوّل لـ vector فيه 1536 رقم بيمثّل المعنى. لما تسأل سؤال، بنحوّل سؤالك لنفس النوع من الـ vectors ونبحث عن أقرب الـ chunks بـ cosine similarity.",
      bullets: [
        "بنستخدم pgvector extension في PostgreSQL.",
        "كل chunk حجم متوسط 500 token = embedding وزنه ~6KB.",
        "الـ search بـ HNSW index — سرعته milliseconds حتى مع آلاف الـ chunks.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /ai-assistant", href: "/ai-assistant" },
    },
  }
];
