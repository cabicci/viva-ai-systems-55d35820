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
 * V2 Editor: @GPT-4
 *
 * Rules:
 * 1. No Theory Without Tension: Start with the pain of AI hallucination.
 * 2. Quick Win in 30s: Move the "try our assistant" case study to the top.
 * 3. Example Before Term: Use the manager/file cabinet analogy for RAG.
 * 4. One Term Max: Focus only on "RAG", remove the long list of concepts.
 * 5. Simple Mission: Change the mission to a single, simple question.
 * 6. Egyptian Dialect: Full conversion to Cairo Ammiya.
 * 7. No Repetition: Consolidate the "what is RAG" explanation into one concept block.
 * 8. Momentum: Create a flow: Problem → Solution Demo → Concept → How-to → Apply.
 */
export const BUILDER_M9_RAG_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "Phase 3 — AI Power",
    title: "دلوقتي هنخلي تطبيقك ذكي بجد",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "خلصت Phase 1 (فهمت AI) و Phase 2 (بنيت تطبيق له واجهة وداتابيز وتسجيل دخول). تطبيقك دلوقتي شغّال، بس الـ AI اللي جواه لسه بيرد من معلوماته العامة — مش من بياناتك إنت.",
        "Phase 3 هي اللي بتفرّق تطبيقك عن أي chatbot عادي. هنا الـ AI بيبدأ يقرا ملفاتك، يفتكر محادثاتك، ويتصرف زي موظف عندك مش زي assistant عام.",
        "أول مفهوم في الـ phase ده — وأهم واحد — اسمه RAG. خلينا نشوف ليه.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "المشكلة",
    title: "ليه الـ AI بتاعك ساعات بيألّف إجابات؟",
    tone: "primary",
    block: {
      kind: "comparison",
      left: {
        label: "غلط: تسأل الـ AI سؤال مباشر",
        body: "بتسأل GPT عن سعر منتجك، فيرد: \"سعره 29 دولار\". بس إنت عمرك ما بعته بالسعر ده! الـ AI هنا بيألّف (Hallucination) لأنه مشفش بياناتك، فبيخمّن إجابة شكلها منطقي. النتيجة: العميل ياخد معلومة غلط، ويفقد الثقة فيك.",
      },
      right: {
        label: "صح: تخلّي الـ AI يقرأ بياناتك الأول",
        body: "قبل ما الـ AI يجاوب، السيستم بتاعك بيدوّر في ملفاتك (زي الأسعار وسياسة الاسترجاع)، ويلاقي الحتة الصح، ويقول للـ AI: \"جاوب من الورقة دي بس\". النتيجة: إجابة دقيقة من بياناتك، مش تأليف. ولو المعلومة مش موجودة، بيقول \"معرفش\" بكل أمانة.",
      },
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جرّب دلوقتي",
    title: "شوف مساعد بيرد من بيانات حقيقية",
    tone: "accent",
    block: {
      kind: "caseStudy",
      title: "المساعد بيستخدم RAG على knowledge_chunks",
      summary:
        "المساعد اللي في المنصة هنا مش بيألّف. لما بتسأله، هو الأول بيدوّر في كل الدروس اللي إنت بتدرسها، وبعدين يجاوب من المحتوى ده بالظبط. جرّب اسأله عن أي حاجة اتعلمتها وشوف هيرد إزاي.",
      bullets: [
        "knowledge_chunks جدول فيه كل الدروس متقسمة حتت صغيرة (chunks).",
        "البحث بيتم بالأرقام (vector search) عشان يلاقي أقرب معلومة لسؤالك.",
        "النتيجة: المساعد بيرد من محتوى المنصة، مش من معلومات Gemini العامة.",
      ],
      pathAngle: "builder",
      link: { label: "جرّب المساعد بنفسك", href: "/ai-assistant" },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "الحل السحري",
    title: "المصطلح الوحيد اللي محتاج تعرفه",
    block: {
      kind: "concepts",
      items: [
        {
          term: "RAG (Retrieval-Augmented Generation)",
          meaning: "طريقة بتخلي الـ AI يرد من بياناتك إنت. بنلاقي (Retrieve) المعلومة الصح من ملفاتك، نضيفها (Augment) لسؤالك، وبعدين نخليه يجاوب (Generate). باختصار: بحث + سؤال = إجابة دقيقة.",
          example: "تخيل بتسأل مديرك سؤال. بدل ما يجاوب من دماغه، بيفتح الدرج، يطلع الفايل المخصوص بتاع الموضوع ده، ويقرالك منه الإجابة. ده بالظبط اللي بيعمله الـ RAG."
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "شوف بعينك",
    title: "الـ RAG شغال إزاي خطوة بخطوة",
    block: {
      kind: "lessonVideo",
      caption: "فيديو بيشرح الرحلة كاملة: من أول تقطيع الملفات، لتخزينها، للبحث فيها، لحد ما الـ AI يطلع إجابة نهائية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "تحت الغطا",
    title: "رحلة السؤال من أول ما بيتكتب لحد الإجابة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: ragDiagram,
      alt: "رسم بياني للـ RAG: السؤال بيتحول لـ vector ويدور في قاعدة بيانات المستندات، وأكتر chunks شبهه بترجع وتتدمج مع السؤال في prompt واحد للـ LLM، اللي بيطلع الإجابة النهائية.",
      caption:
        "لما بتسأل، السيستم بيحوّل سؤالك لأرقام ويدوّر بيها في قاعدة بياناتك عشان يلاقي أكتر حتت شبهه. بعدين ياخد الحتت دي مع سؤالك الأصلي ويبعتهم للـ AI في طلب واحد. كده بنضمن الإجابة تبقى من بياناتك، مش من تأليف الـ AI.",
      label: "معمارية الـ RAG — الـ 3 خطوات الأساسية",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "اختبر فهمك",
    title: "جاوب على الأسئلة دي",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m9-l24-rag-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو عايز تعمل مساعد دعم فني لمتجر إلكتروني عشان يرد على أسئلة الزباين، إيه أول خطوة هتعملها عشان تجهز بياناتك؟",
          options: [
            "هتاخد وصف المنتجات وسياسات الشحن وتقسمها حتت صغيرة (chunks) وتخزنها في قاعدة بيانات مع الـ embedding بتاعها.",
            "هتعمل fine-tuning لموديل AI كبير زي GPT عشان يتعلم تفاصيل المنتجات وسياسات الشحن.",
            "هتكتب بنفسك كل الإجابات المحتملة لأسئلة الزباين وتخزنها في جدول في قاعدة البيانات."
          ],
          correctIndex: 0,
          explanation: "صح! أول خطوة هي الـ Indexing، بنقسّم المحتوى لـ chunks ونعملها embedding عشان نقدر نبحث فيها بسرعة لما يجي سؤال من المستخدم."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "بعد ما الزبون يسأل سؤال، إيه اللي بيحصل قبل ما الـ AI يبدأ يكوّن إجابته؟",
          options: [
            "الـ AI بيفتكر كل حاجة يعرفها عن الموضوع وبيبدأ يجاوب.",
            "السيستم بيدور في الـ chunks اللي متخزنة وبيجيب أكتر ٥ قطع شبه سؤال الزبون.",
            "السيستم بيطلب من الزبون معلومات أكتر عشان يفهم قصده بالضبط."
          ],
          correctIndex: 1,
          explanation: "بالظبط! دي خطوة الـ Retrieval، السيستم بيجيب المعلومات المناسبة من قاعدة البيانات (الـ chunks) اللي ليها علاقة بسؤال المستخدم قبل ما يمررها للـ AI."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "إيه فايدة إنك تحط 'السياق' (chunks) في الـ prompt بتاع الـ AI قبل ما يجاوب؟",
          options: [
            "عشان توفر وقت الـ AI وميحتاجش يدور على المعلومة بنفسه.",
            "عشان الـ AI يرد من معلوماتك الخاصة بس ومايألّفش إجابات عامة ممكن تكون غلط.",
            "عشان تزيد سرعة استجابة الـ AI مهما كان حجم البيانات اللي بيدور فيها."
          ],
          correctIndex: 1,
          explanation: "تمام! دي خطوة الـ Augment، حقن السياق في الـ prompt بيخلي الـ AI يرد إجابة بناءً على بياناتك الخاصة وبيمنع التأليف (Hallucinations)."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission: دورك تطبّق",
    title: "صمم فكرة مساعد ذكي",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "دلوقتي إنت فهمت الفكرة. كل الـ Assistants اللي بتستخدمها (زي في Notion أو Intercom) شغالة بنفس المبدأ ده.",
      prompt:
        "فكر في تطبيق أو بيزنس محتاج مساعد ذكي.\n\nإيه أهم ملف أو قاعدة بيانات هتديها للـ AI عشان يرد على أسئلة العملاء صح؟\n\nمثال: لو بعمل مساعد لعيادة، أهم ملف هو 'قايمة بمواعيد الدكاترة المتاحة'.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "تسليم كامل",
          weight: 100,
          criteria: [
            "حددت البيزنس أو التطبيق بوضوح.",
            "حددت مصدر المعلومات (Knowledge Base) اللي الـ AI هيستخدمه.",
            "المثال بتاعك منطقي وبيحل مشكلة حقيقية.",
          ],
        },
      ],
    },
  },
];