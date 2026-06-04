import {
  MessageCircle,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import automatorM5WhatsappFlowScreenshot from "@/assets/lessons/unique/automator-m6-l2-whatsapp-flow.jpg";
/**
 * Automator · M5 · Lesson 02 — WhatsApp Flow ذكي
 */
export const AUTOMATOR_M6_L2_WHATSAPP_FLOW_BLOCKS: IntroLessonContent = [
  {
    icon: MessageCircle,
    eyebrow: "HERO",
    title: "WhatsApp Flow ذكي",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "مش بس ردّ آلي.",
        "محادثة بتفهم وتقرّر.",
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
        { term: "Webhook", meaning: "زي \"مخبر\" بيبلغ برنامجك أول ما حاجة تحصل على واتساب.", example: "لو زبون بعت \"السعر كام\"، الـ Webhook يروح يبلغ البرنامج بتاعك فوراً عشان يرد عليه." },
        { term: "Broadcast", meaning: "إرسال رسالة لواحدة لمجموعة أرقام كبيرة في نفس الوقت.", example: "التاجر بيستخدمها عشان يبعت عروض العيد لكل الزباين اللي عنده في رسالة واحدة." },
        { term: "Context Layer / Retrieval", meaning: "قدرة الذكاء الاصطناعي إنه يفتكر الكلام اللي دار بينك وبين الزبون.", example: "زي ما حد يبعتلك \"رقمك كام\" فترد عليه \"أنا قلتلك قبل كده إنه 010..\" عشان فاكر كلامه." },
        { term: "Template Message", meaning: "رسالة جاهزة واتساب لازم يوافق عليها قبل ما تبعتها للناس.", example: "لو بعت رسالة \"تم الشحن\"، دي لازم واتساب يوافق عليها الأول." },
        { term: "LLM Node (الرد الذكي)", meaning: "عقل الذكاء الاصطناعي اللي بيفهم الكلام وبيرد عليه من غير برمجة.", example: "صاحب محل هدوم بيستخدمها عشان يخلي البوت يرد كأنه بياع شاطر وفاهم الموضة." },
        { term: "WhatsApp Cloud API", meaning: "طريقة رسمية وسهلة من شركة \"ميتا\" عشان تربط واتساب ببرنامجك.", example: "لو لسه بتبدأ وجربت الـ Cloud دي أرخص ومباشرة من غير وسيط." },
        { term: "Twilio", meaning: "شركة وسيطة بتوفرلك أدوات احترافية لربط الواتساب والرسائل ببرامجك.", example: "شركات الشحن الكبيرة بتستخدمه عشان يربطوا رسايلهم بسيستم عالمي مضمون." },
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
      caption: "إزاي تبني WhatsApp flow متكامل — من أول رسالة لآخر follow-up.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "الـ Flow الكامل",
    block: {
      kind: "numberedList",
      items: [
        "Trigger: رسالة واردة من عميل (Webhook من WhatsApp Business API).",
        "Filter: رسالة spam بتترمي، رسالة معتمدة بتكمل.",
        "Router: صنّف النية — استفسار / شكوى / شراء / متابعة.",
        "LLM Node: صياغة رد مناسب لو ردّ فوري.",
        "Action: حفظ في CRM، تنبيه فريق، ردّ تلقائي، أو تحويل لـ human.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "Context Layer بتاعنا",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM5WhatsappFlowScreenshot,
      alt: "سكرين شوت من المنصة",
      caption:
        "المنصة بتعتمد على Context Layer عشان تفهم كل interaction. نفس الفكرة في WhatsApp: كل رسالة لازم يكون وراها context (من العميل ده، إيه اللي تناقشنا فيه، إيه stage بتاعه). الـ automation بيعمل retrieval من CRM الأول قبل ما يرد.",
      label: "من المنصة — صفحة /operational-layers",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "Broadcast vs Conversation",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — بتهاجم الناس بـ broadcast",
        body: "بتبعت نفس الرسالة لـ 500 واحد من غير ما يكونوا طلبوا حاجة. WhatsApp بيبلّغك. الناس بيبلّغوا. الرقم بيتحظر.",
      },
      right: {
        label: "RIGHT — Conversation بعد consent",
        body: "العميل ملّأ form أو ابعت رسالة الأول. ردّك تلقائي بس مفيد. كل رسالة جاية بتعمل update للـ context. العميل بيفضل موجود عشان المحادثة بتتكيّف معاه.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "ارسم WhatsApp Flow على ورقة",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m6-l2-whatsapp-flow-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "عميل بعت رسالة: 'عايز أطلب منتج معين رقم (أ)، ممكن؟'. إيه أول خطوة الـ WhatsApp Flow الذكي المفروض يعملها بعد ما يستقبل الرسالة دي؟",
          options: [
            "يصنّف الرسالة ويشوف نية العميل (Router).",
            "يبعتله رد آلي بـ 'مرحباً بك'.",
            "يحوّل المحادثة لموظف خدمة عملاء."
          ],
          correctIndex: 0,
          explanation: "أول خطوة بعد استلام أي رسالة هي تصنيف نية العميل (Router) عشان السيستم يعرف يتصرف صح، زي ما وضحنا في فكرة 'صنّف النية'."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "عميل بعت رسالة: 'فين طلبيتي؟'. لو السيستم لقى إن العميل ده ليه طلب سابق وعايز يعرف حالته، إيه الإجراء المناسب اللي ممكن يعمله الـ 'Action' Node؟",
          options: [
            "يرد عليه بـ Template Message فيها تفاصيل تتبع الطلب.",
            "يسجل الرسالة دي في CRM على إنها شكوى.",
            "يعمل Broadcast لكل العملاء بتوع المتابعة."
          ],
          correctIndex: 0,
          explanation: "في حالة السؤال عن الطلبية، الـ Action Node ممكن يستخدم Template Message جاهزة عشان يرد بتفاصيل تتبع الطلب، وده يعتبر رد تلقائي فعال زي ما ذكرنا في 'Action: ردّ تلقائي'."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "لو عميل بعت رسالة 'إيه أسعاركم؟' والـ WhatsApp Flow بتاعك مبرمج إنه يرد بـ List Message فيها كل الأسعار. تصنيف الرسالة دي بيقع تحت أي مصطلح من المصطلحات اللي اتكلمنا عليها؟",
          options: [
            "Interactive Message.",
            "Template Message.",
            "Broadcast."
          ],
          correctIndex: 0,
          explanation: "الـ List Message اللي فيها اختيارات تعتبر نوع من أنواع الـ Interactive Message، ودي رسالة فيها أزرار أو قائمة زي ما وضحنا في المصطلحات."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم WhatsApp flow بـ ٣ branches",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "WhatsApp = القناة الأقرب للعميل. هتصمم flow بـ trigger + router + ٣ ردود مختلفة حسب نية الرسالة.",
      prompt:
        "في تسليمك:\n\n١) Use case + الـ Bot هيتعامل مع إيه؟\n٢) Trigger — إزاي بتستقبل الرسالة (WhatsApp Cloud API / Twilio / أداة)?\n٣) Intent detection — إزاي بتعرف نية الرسالة؟ (Keywords / LLM classifier)\n٤) Branch 1 — Greeting → رد:\n٥) Branch 2 — Question عن منتج → رد:\n٦) Branch 3 — يطلب مساعدة بشري → escalation:\n٧) Memory — الـ Bot بيتذكر الـ conversation context إزاي؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "Flow + ٣ branches",
          weight: 60,
          criteria: [
            "Intent detection بآلية محددة.",
            "الـ ٣ branches بـ ردود فعلية مختلفة.",
          ],
        },
        {
          label: "Escalation + Memory",
          weight: 40,
          criteria: [
            "Escalation بـ trigger محدد + شخص محدد.",
            "Memory بآلية حقيقية مش «هيفتكر».",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "Assistant flow في /ai-assistant = same idea",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "Assistant flow في /ai-assistant = same idea",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Automator — نفس اللي بتتعلمه. بدل WhatsApp، عندنا في-app messaging مع الـ assistant. State بيتحفظ في session. ولو سألت سؤال ورجعت بعد ساعة، بيفتكر إنت إيه آخر سؤال سألته. نفس الـ stateful flow.",
      bullets: [
        "Session state في assistant-session-store.",
        "كل سؤال + رد بيتخزّن مع timestamp.",
        "تقدر ترجع لـ thread قديم في أي وقت.",
      ],
      pathAngle: "automator",
      link: { label: "افتح /ai-assistant", href: "/ai-assistant" },
    },
  }
];
