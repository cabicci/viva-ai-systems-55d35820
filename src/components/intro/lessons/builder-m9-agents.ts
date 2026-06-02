import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import agentsDiagram from "@/assets/lessons/concepts/agents-diagram.jpg";

/**
 * Builder · M9 · Lesson 03 — Agents: AI بياخد قرارات
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 *
 * يبني على M9.2 (RAG) — RAG بيرد. Agent بيرد ويعمل حاجة (tool calls).
 */
export const BUILDER_M9_AGENTS_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "HERO",
    title: "Agent = AI بياخد قرارات ويستخدم أدوات لوحده",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "RAG (M9.2) بيرد على الأسئلة. بس لو المستخدم قال \"احجزلي ميعاد بكرة الساعة ٤\" — دي مش إجابة، دي عملية.",
        "Agent = LLM + مجموعة tools (functions) + قدرة يقرّر إمتى ينادي tool ومتى يخلّص. بدل ما يرد بنص، بياخد actions حقيقية.",
        "Agent مكتوب صح بيعمل في ٣٠ ثانية اللي اليوزر كان هياخد ٥ دقايق يعمله بإيده — ودي القفزة من \"chatbot\" لـ \"عامل ذكي\".",
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
        { term: "Agent", meaning: "برنامج ذكي بيفكر ويقرر يستخدم أدوات إيه عشان يخلص مهمة.", example: "زي مسوق معاه شيت إكسيل وقلم وبوصلة، وبيقرر لوحده يستخدم إيه عشان يزود المبيعات." },
        { term: "Tool", meaning: "أي برنامج أو خدمة خارجية الـ Agent يقدر يناديها تخلصه.", example: "زي ما التاجر بيستخدم \"آلة حاسبة\" أو \"سرش جوجل\" عشان يعرف سعر الدولار." },
        { term: "Parameters (Inputs)", meaning: "البيانات أو الخانات اللي الأداة محتاجاها منك عشان تشتغل صح.", example: "لو قلت للـ Agent \"ابعت إيميل\"، لازم توصفله الـ Parameters يعني (الإيميل، والمحتوى)." },
        { term: "Loop (ReAct)", meaning: "دايرة بيلف فيها الـ Agent: يفكر، ينفذ، يشوف النتيجة، ويكرر.", example: "زي المحاسب اللي بيراجع الفواتير فاتورة فاتورة، ويفضل شغال لحد ما يخلصهم كلهم." },
        { term: "Autonomy (الاستقلالية)", meaning: "قدرة الـ Agent إنه يختار خطواته من غير ما إنت تتدخل.", example: "زي سواق أوبر، إنت بتديله الوجهة (الهدف) وهو بيسوق ويختار الطرق لوحده." },
        { term: "Multi-step Planner", meaning: "لما الـ Agent يخطط لمجموعة خطوات ورا بعض عشان يوصل لهدف كبير.", example: "زي مدير مشروع بيقسم حملة إعلانية لمراحل: (تصميم، ثم كتابة، ثم نشر)." },
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
      caption: "Tool Calling، ReAct loop، multi-step agents، وفين تحط human-in-the-loop.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Tools + Loop = Agent",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Tool = function عادية في كودك (مثلاً createBooking، sendEmail، searchProducts) بتوصّفها للـ LLM في الـ schema بتاعها (الاسم، الوصف، الـ parameters). الموديل بيشوف القايمة دي ضمن الـ prompt ويقرّر إمتى يستخدم أنهي واحد.",
        "Tool Calling Loop (الـ ReAct pattern):\n  1) المستخدم يبعت request\n  2) الموديل يفكّر، ويرجّع: \"عايز أنادي searchProducts({ query: 'laptop' })\"\n  3) الكود بتاعك ينفّذ الـ function ويرجّع النتيجة للموديل\n  4) الموديل ياخد النتيجة، يفكّر تاني، يقرّر: ينادي tool تاني، ولا يخلّص ويرد على المستخدم\n  5) الـ loop يقف لما الموديل يرجّع رد نهائي بدون tool call.",
        "أنواع الـ Agents حسب التعقيد:\n  - Single-tool: tool واحد بس (chatbot يقدر يبحث في قاعدة بيانات)\n  - Multi-tool: ٣-١٠ tools (دعم فني يقدر يبحث، ينشئ تذكرة، يبعت إيميل)\n  - Multi-step planner: agent يخطّط steps قبل ينفّذ (للمهام المعقّدة)\n  - Multi-agent: agents بتتكلّم مع بعضها (researcher → writer → reviewer)",
        "Guardrails ضروريّة: لكل tool خطير (يمسح، يدفع، يبعت لمستخدمين تانيين) → ضع human-in-the-loop (\"تأكّد إنك عايز تحجز ميعاد ٤ مساءً؟ نعم/لا\"). حدّد max_iterations عشان الـ loop ميتعلّقش. سجّل كل tool call في DB (audit log) عشان لو حصل غلط تعرف ترجع.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "AI Agent: Think → Act → Observe → Repeat",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: agentsDiagram,
      alt: "Diagram لـ AI Agent: LLM في النص، وحواليه أدوات (Search, Calculator, Database, Email, Calendar)، مع loop بيدور Think → Act → Observe → Repeat",
      caption:
        "الـ Agent مش مجرد LLM بيرد. هو LLM + tools + loop. لما يجي سؤال، الـ agent بيفكّر (Think)، يقرّر يستخدم أي tool (Act)، يشوف النتيجة (Observe)، ويكرّر لحد ما يوصل للإجابة النهائية. ده اللي بيخلّيه يقدر يتعامل مع مهام معقّدة تحتاج بحث، حسابات، أو وصول لبيانات حيّة — مش بس generate نص من اللي اتدرّب عليه.",
      label: "AI Agent — Tools في Loop",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "Chatbot يقول vs Agent يعمل",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — Chatbot كلامه لذيذ بس عاجز",
        body: "المستخدم: \"عايز ألغي اشتراكي\". الـ AI: \"تمام، عشان تلغي اشتراكك، روح على Settings → Billing → Cancel Subscription، اضغط تأكيد\". المستخدم يقفل الصفحة محبط. النتيجة: قدّمت معلومة بدل ما تعمل الفعل. المستخدم يحس إن الـ AI cosmetic مش حقيقي.",
      },
      right: {
        label: "RIGHT — Agent بينفّذ بنفسه",
        body: "tools = [getSubscription, cancelSubscription, sendConfirmationEmail].\nالمستخدم: \"عايز ألغي اشتراكي\".\nAgent: ينادي getSubscription({ user_id }) → يلاقي Plan: Pro، renews 2026-06-15.\nAgent يرد: \"اشتراكك Pro بيتجدّد 15 يونيو. تأكيد إلغاء؟\"\nالمستخدم: \"نعم\".\nAgent ينادي cancelSubscription({ id, reason: 'user_request' }) ثم sendConfirmationEmail(...).\nAgent يرد: \"تمام، تم الإلغاء. هيكمّل شغّال لحد 15 يونيو وبعدها يقف\".\nالنتيجة: مهمة اتعملت في ٢٠ ثانية بدون ما المستخدم يلمس Settings.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "صمّم أول Agent لتطبيقك (3 tools كحد أقصى)",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m9-agents-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "عميل جه يشتكي إن المنتج اللي اشتراه فيه عيب ومش لاقي فاتورته. الـ Agent بتاعك عنده tool اسمها `search_user_orders` بتجيب طلبات العميل بناءً على الـ ID بتاعه، و tool تانية اسمها `create_support_ticket` عشان يفتح شكوى. إيه المفروض الـ Agent يعمله الأول؟",
          options: [
            "يستخدم `search_user_orders` الأول عشان يلاقي طلبات العميل ويدور على الفاتورة.",
            "يستخدم `create_support_ticket` على طول عشان يفتح شكوى للعميل.",
            "يسأل العميل عن رقم الفاتورة أو أي بيانات تانية يقدر بيها يلاقي الطلب."
          ],
          correctIndex: 0,
          explanation: "الـ System Prompt بيوضّح إن الخطوة الأولى دايمًا البحث عن حل، وده ينطبق على البحث عن بيانات الطلب قبل عمل أي إجراء تاني."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "العميل في السيناريو اللي فات عايز يرجع المنتج اللي فيه عيب ويرجع له فلوسه. الـ Agent لقى الطلب لكن مفيش tool اسمها `process_refund` والـ FAQs مفيهاش أي معلومة عن استرجاع الفلوس. إيه التصرف الصح للـ Agent في الحالة دي؟",
          options: [
            "يقول للعميل إنه مش لاقي حل ويرفض يرجع المنتج.",
            "يقترح على العميل إنه يفتح تذكرة دعم عشان فريق خدمة العملاء يتولى الموضوع، وياخد موافقة العميل.",
            "يدور على tool تانية أو يحاول يخمن طريقة ليرجع الفلوس."
          ],
          correctIndex: 1,
          explanation: "الـ System Prompt بيقول: لو مالقيتش إجابة أو المستخدم مش راضي، اقترح تفتح تذكرة واخد موافقته، وده بيحافظ على حدود قدرات الـ Agent."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "الـ Agent بتاعك بيحاول ينفذ tool اسمها `delete_user_data` بناءً على طلب العميل، بس السيستم رجع له `error: 'Auth token expired'`. الـ Agent المفروض يتصرف إزاي بناءً على الـ Guardrails اللي حطيتها؟",
          options: [
            "يعتذر للعميل ويقول له إنه مش قادر ينفذ الطلب دلوقتي بسبب مشكلة تقنية ويسجل الـ error في الـ audit log.",
            "يحاول ينفذ نفس الـ tool تاني كذا مرة عشان ممكن تكون مشكلة لحظية.",
            "ياخد طلب العميل وياجله لوقت تاني لما الـ token يشتغل تاني ويقول للعميل إنه هيرد عليه بعدين."
          ],
          correctIndex: 0,
          explanation: "في حالات الفشل، لو الـ Tool رجّع error، الـ Agent لازم يعتذر للمستخدم وميعيدش المحاولة بشكل لا نهائي، ويسجل ده في الـ audit log."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم Agent بـ ٣ Tools لمهمة محددة",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Agent = LLM + tools + loop. هتصمم agent محدد بـ ٣ tools يقدر يخلّص مهمة حقيقية.",
      prompt:
        "في تسليمك:\n\n١) المهمة في سطر (مثال: research agent يجمع تقرير سوق):\n٢) System Prompt للـ agent (الدور + الحدود + متى يستخدم أنهي tool):\n٣) Tools (٣):\n   - Tool 1: name + description + inputs + outputs\n   - Tool 2: ...\n   - Tool 3: ...\n٤) Stopping condition — إمتى الـ loop يقف؟ (max steps / done flag / time)\n٥) سيناريو يفشل فيه الـ agent + إزاي هتتعامل؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "Agent + Tools واضحين",
          weight: 60,
          criteria: [
            "System Prompt فيه دور + حدود + قاعدة اختيار tool.",
            "الـ ٣ tools كل واحدة بـ inputs/outputs محددين.",
          ],
        },
        {
          label: "Stopping + Failure",
          weight: 40,
          criteria: [
            "Stopping condition معرّفة بشكل قابل للقياس.",
            "Failure scenario معه استراتيجية مش «هيشتغل بقى».",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "المساعد عنده tools يستخدمها — مش بس بيرد",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "المساعد عنده tools يستخدمها — مش بس بيرد",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. المساعد مش LLM عادي. لو سألته «وريني تقدّمي»، هو بياخد قرار يستخدم tool اسمه get_user_progress، يجيب البيانات، ويرد بناءً عليها. ده agent مش chatbot.",
      bullets: [
        "Tools المتاحة: search_knowledge, get_user_progress, get_current_lesson.",
        "الـ LLM بياخد قرار يستخدم أنهي tool حسب السؤال.",
        "تقدر تشوف الـ tool calls في /assistant-runtime → «Tools».",
      ],
      pathAngle: "builder",
      link: { label: "افتح /assistant-runtime", href: "/assistant-runtime" },
    },
  }
];
