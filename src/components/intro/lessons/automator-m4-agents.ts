import {
  Bot,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen,
  Link2, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import automatorM4AgentsScreenshot from "@/assets/lessons/unique/automator-m4-agents.jpg";
/**
 * Automator · M4 · Lesson 03 — Agents بياخدوا قرارات
 */
export const AUTOMATOR_M4_AGENTS_BLOCKS: IntroLessonContent = [
  {
    icon: Lightbulb,
    eyebrow: "تنبيه: درس تقني",
    title: "ده درس متقدّم — اتخطّاه لو لسه في البداية",
    tone: "accent",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الدرس ده فيه مفاهيم تقنية للناس اللي شغّالة فعلاً على n8n. لو لسه بتتعلم الأساسيات، تقدر تعدّيه دلوقتي وترجعله بعدين — مش هيأثر على باقي رحلتك.",
        "لو فاهم الأساسيات وعايز تعمّق، يلا نكمل.",
      ],
    },
  },
  {
    icon: Bot,
    eyebrow: "HERO",
    title: "Agents بياخدوا قرارات",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Workflow بينفّذ خطوات معروفة.",
        "Agent بيقرّر هو الخطوة الجاية إيه.",
      ],
    },
  },
  {
    icon: Link2,
    eyebrow: "🔗 ربط بـ Builder M9",
    title: "نفس Agent اللي بنيناه — بس في n8n",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "في Builder M9 اتعلمنا إن Agent = LLM + Tools + Loop. نفس المعادلة هنا.",
        "الفرق: n8n عنده AI Agent node جاهز بيعمل الـ loop لوحده. إنت بتعرّفله الـ tools (HTTP، DB query، send WhatsApp) ويتصرّف.",
        "لو لسه مكملتش Builder M9: Agent في سطر = AI بياخد قرار يستخدم أنهي أداة ومتى، بدل ما إنت تحدّد كل خطوة. الفكرة بسيطة، التطبيق بقى لعبة.",
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
        { term: "JSON (فورمات البيانات)", meaning: "طريقة تنظيم البيانات عشان البرامج تفهمها وتبدلها مع بعض بسهولة.", example: "زي ورقة \"بيانات العميل\" اللي فيها (الاسم: فلان، المبلغ: 100) بس مكتوبة بشكل البرنامج بيفهمه ويطلعه في كشف الحساب." },
        { term: "Arguments (المعطيات)", meaning: "المعلومات أو الأرقام اللي لازم تديها للأداة عشان تعرف تشتغل.", example: "لو عايز الـ Agent يحول فلوس، الـ Arguments هي (رقم الحساب والمبلغ)؛ دي \"البيانات\" اللي من غيرها المهمة مش هتكمل." },
        { term: "Nodes (النقطة)", meaning: "محطة أو خطوة واحدة جوه \"خريطة الشغل\" اللي الـ Agent بيمشي عليها.", example: "لو بتعمل خريطة لرد آلي، أول Node هي \"استلام الرسالة\"، وتاني Node هي \"البحث في المخزن\". كل واحدة خطوة محددة." },
        { term: "API / HTTP (الوصلة)", meaning: "وصلة \"سحرية\" بتخلي برنامجين مختلفين يبعتوا بيانات لبعض ويشتغلوا سوا.", example: "الـ API هو \"الفيشة\" اللي بتوصل موقع المحل ببرنامج الشحن عشان يبعتله بيانات الأوردرات أوتوماتيك." },
        { term: "Tokens (تكلفة التشغيل)", meaning: "العملة اللي بتدفعها لشركة الـ AI مقابل كل كلمة بيكتبها أو بيقرأها.", example: "زي شحن العداد بالكارت؛ كل ما الـ Agent يفكر أو يرد على زبون بيخصم \"وحدات\" من الرصيد اللي إنت شاحنه." },
        { term: "Tool (الأداة)", meaning: "مهمة أو وظيفة الـ Agent معاه صلاحية يفتحها ويستخدمها عشان يخلص شغله.", example: "زي ما بتدي \"الآلة الحاسبة\" للمحاسب عشان يجمع، إنت بتدي \"أداة بحث\" للـ Agent عشان يدور على الأسعار." },
        { term: "Agent (الآجنت)", meaning: "موظف ذكي بيفكر ويستخدم أدوات عشان يوصل لهدف إنت محدده.", example: "محاسب آلي بتبعتله فواتيرك، بيفضل يراجعها ويستخدم \"آلة حاسبة\" لحد ما يخلص ميزانية الشهر لوحده." },
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
      caption: "الفرق بين workflow ثابت و agent بياخد قرارات.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Workflow vs Agent",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "في الـ workflow العادي، إنت اللي بترتّب الخطوات: A → B → C. لو حصل حاجة برّه التوقّع، الـ scenario بيقف.",
        "في الـ agent، إنت بتدّيله: هدف + مجموعة tools. هو اللي بيقرّر يستخدم أنهي tool وبأي ترتيب.",
        "n8n عنده AI Agent node جاهز. بتعرّفله الـ tools (HTTP, DB query, send WhatsApp) وهو بيشتغل عليهم بناءً على الـ goal.",
        "Agents مناسبة لما الخطوات مش ثابتة (دعم فني، research، تنفيذ طلبات معقّدة).",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "درس Agents في Builder",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM4AgentsScreenshot,
      alt: "سكرين شوت من المنصة",
      caption:
        "في Builder M9 شفنا إن الـ Agent عبارة عن LLM + tools + loop. في Automator هتطبّق نفس الفكرة في n8n: نفس الـ pattern، بس بـ nodes بدل كود.",
      label: "من المنصة — درس Agents في Builder",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "Agent بدون حدود vs Agent مضبوط",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — Agent مفتوح على آخره",
        body: "بتدّيله access لكل الـ tools من غير قواعد. بيدخل loop لانهائي بيستدعي tools كل ثانية، بياكلك tokens، أو ممكن ينفّذ action ضارة (يبعت رسالة غلط لـ 1000 عميل).",
      },
        right: {
          label: "RIGHT — Agent بحدود واضحة",
          body: "بتحدّد: max steps = 10، tools محدودة (read only في الأول)، أي action تأثيرها كبير (send, delete, charge) بتمرّ على human approval. الـ agent ذكي بس مش طايش.",
        },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "صمّم أول agent على ورقة",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m4-agents-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "مدربك طلب منك تعمل أوتوميشن لموظف دعم فني بيستقبل شكاوى العملاء. الشكاوى دي ممكن تكون عن مشاكل تقنية، أو عايز يغيّر عنوانه، أو استفسار عن فاتورة. إنت هتقرّر هتستخدم Agent ولا workflow عادي؟",
          options: [
            "أستخدم Agent عشان أنواع الشكاوى كتير والخطوات مش ثابتة.",
            "أستخدم workflow عادي عشان كل شكوى ليها خطوات محددة ومعروفة.",
            "أستخدم workflow عادي بس أحط فيه شروط كتير عشان يغطي كل الاحتمالات."
          ],
          correctIndex: 0,
          explanation: "الـ Agents مناسبة لما الخطوات مش ثابتة زي حالات الدعم الفني، لأن الـ Agent بيقرّر Tool المناسبة للتعامل مع الشكوى."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "أحمد عايز يعمل أوتوميشن لعملية الـ Onboarding للموظفين الجداد. العملية دي ثابتة: بيبعت ميل ترحيب، بيضيفه على الـ HR system، وبيعمله account على سيستم الشركة. إيه الأنسب لعملية زي دي؟",
          options: [
            "Agent يقدر يختار الـ tools المناسبة للـ Onboarding.",
            "Workflow عادي بيرتّب الخطوات A → B → C بشكل تسلسلي.",
            "Agent بس هحطله شرط الموافقة البشرية على كل خطوة."
          ],
          correctIndex: 1,
          explanation: "الـ Workflow العادي مناسب لما الخطوات معروفة وثابتة ومتوقعة، زي خطوات الـ Onboarding اللي ليها تسلسل محدد."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "إنت شغال على Agent وطلب منك تدّيله 'Tools' معينة. إيه من اللي جاي ده يعتبر 'Tool' لـ Agent؟",
          options: [
            "الهدف اللي الـ Agent عايز يوصله.",
            "إنه يقرّر يستدعى الـ 'Slack API' عشان يبعت رسالة.",
            "الـ 'Loop' اللي الـ Agent بيعملها عشان يوصل للقرار."
          ],
          correctIndex: 1,
          explanation: "الـ 'Tool' هي function/API الـ Agent مسموحله يستدعيها عشان ينفذ مهمة، زي استدعاء Slack API لإرسال رسالة."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم Agent يقدر يستخدم ٢ tools في حلقة",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Agent في الـ workflow = LLM + memory + tools. هتصممه بحدود واضحة وstopping condition.",
      prompt:
        "في تسليمك:\n\n١) المهمة (مثال: customer support agent يحل مشكلة من ٣ tools):\n٢) System Prompt للـ agent (دور + متى يستخدم أنهي tool + حدود):\n٣) Tool 1: name + input/output + متى يستخدمه:\n٤) Tool 2: نفس الشكل\n٥) Memory — الـ agent بيتذكّر إيه بين الـ iterations؟\n٦) Stopping condition — إمتى يقف؟ (Max iterations / done flag / time)\n٧) Escalation — لو فشل، يحوّل لمين؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "Agent + Tools",
          weight: 60,
          criteria: [
            "System Prompt فيه قاعدة اختيار tool واضحة.",
            "Memory + iterations معرّفين.",
          ],
        },
        {
          label: "Stop + Escalate",
          weight: 40,
          criteria: [
            "Stopping condition قابلة للقياس.",
            "Escalation path مش «هيرسل إيميل».",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "المساعد = Agent بتتولّى قرارات tool selection",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "المساعد = Agent بتتولّى قرارات tool selection",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Automator — نفس اللي بتتعلمه. المساعد مش workflow ثابت. بياخد قرار: «المستخدم بيسأل عن تقدّمه؟ هاستخدم get_user_progress. بيسأل عن مفهوم؟ هاستخدم search_knowledge». Agent مش flow.",
      bullets: [
        "Function calling في Gemini = Agent capability.",
        "Tool registry محدّد في كود + descriptions واضحة.",
        "كل tool call بيتسجّل في /assistant-runtime → Tools tab.",
      ],
      pathAngle: "automator",
      link: { label: "افتح /assistant-runtime", href: "/assistant-runtime" },
    },
  }
];
