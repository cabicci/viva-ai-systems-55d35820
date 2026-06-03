import {
  Zap,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import automatorM2TriggersActionsScreenshot from "@/assets/lessons/unique/automator-m3-l2-triggers-actions.jpg";
/**
 * Automator · M2 · Lesson 02 — Triggers + Actions
 */
export const AUTOMATOR_M2_TRIGGERS_ACTIONS_BLOCKS: IntroLessonContent = [
  {
    icon: Zap,
    eyebrow: "HERO",
    title: "Triggers + Actions",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل automation بتبدأ بحدث (Trigger).",
        "وبتنتهي بفعل واحد أو أكتر (Actions).",
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
        { term: "Payload / JSON", meaning: "البيانات الفعلية اللي بتتنقل بين البرامج في شكل رسالة أو علبة بيانات.", example: "زي لما زبون يملأ فورم عندك، البيانات اللي بتتبعت (اسمه وتليفونه) هي الـ Payload دي." },
        { term: "Input / Output", meaning: "الـ Input هو المعلومات اللي بتدخلها، والـ Output هو النتيجة اللي بتطلع.", example: "رصيد المخزن هو الـ Input، والتقرير النهائي اللي بيطلع للمدير هو الـ Output." },
        { term: "Database / DB", meaning: "المكان اللي بتخزن فيه بيانات شغلك بشكل منظم ومحمي.", example: "بدل ما تسجل مبيعاتك في كشكول ورق، الـ Database تطبيق زي Excel بس أذكى ومنظم أكتر." },
        { term: "API / HTTP Request", meaning: "دي الطريقة اللي البرامج بتكلم بيها بعض وتطلب بيانات من بعض.", example: "الـ API زي الجرس، والـ Request هي \"رنة الجرس\" نفسها عشان تطلب خدمة معينة." },
        { term: "Polling", meaning: "الأداة بتفضل تسأل الموقع \"فيه جديد؟\" كل فترة معينة.", example: "زي لما الـ Zapier يفضل يشوف هل جالك ايميل جديد كل 5 دقايق ولا لأ." },
        { term: "Webhook", meaning: "الخدمة بتبعت البيانات للأداة \"فورا\" أول ما حاجة تحصل.", example: "أول ما زبون يشتري من موقعك، الموقع بيبعت إشارة فورية للأداة تبدأ شغلها." },
        { term: "Trigger & Action", meaning: "الـ Trigger هو الشرارة اللي بتبدأ الشغل، والـ Action هو التنفيذ.", example: "لما يجيلك رسالة واتساب (Trigger)، الأداة تسجل بيانات العميل في شيت (Action)." },
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
      caption: "أنواع الـ Triggers والـ Actions وإزاي تركّبهم مع بعض.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Trigger واحد → Actions كتير",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل workflow هيكلها بسيط: حاجة بتحصل (Trigger) → خطوة أو أكتر بتتنفّذ كرد فعل (Actions).",
        "Triggers أنواع: Schedule (كل ساعة)، Webhook (لما حاجة تحصل)، Polling (الأداة بتسأل كل X دقيقة)، Manual (لما تضغط زرار).",
        "Actions أنواع: HTTP request، إضافة صف في DB، إرسال إيميل/رسالة، استدعاء AI، تحويل بيانات.",
        "كل action بياخد output الـ action اللي قبله كـ input. فالـ workflow عاملة زي السير اللي ماشي ورا بعضه.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "رحلة المستخدم في المنصة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM2TriggersActionsScreenshot,
      alt: "سكرين شوت من المنصة",
      caption:
        'كل خطوة في صفحة /dashboard دي عبارة عن (Trigger → Action). مثلاً: المستخدم خلّص درس (Trigger) → سجّل تقدّمه في الـ DB + فتحله الدرس اللي بعده + بعتله notification (3 Actions). نفس الفكرة هتطبّقها على شغلك.',
      label: "من المنصة — صفحة /dashboard",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "Polling vs Webhook",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — Polling لكل حاجة",
        body: "بتخلّي الـ workflow يسأل كل دقيقة 'في رسالة جديدة؟'. بتاكل tasks كتير، وبتدفع فلوس على مشاوير على الفاضي، والـ response بيتأخّر دقيقة كاملة.",
      },
      right: {
        label: "RIGHT — Webhook لما يكون متاح",
        body: "بتخلّي الخدمة (WhatsApp، Stripe، Typeform) تبعتلك فورًا لما حاجة تحصل. سرعة فورية، tasks أقل بكتير، تكلفة أقل.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "ابني أول scenario في 5 دقائق",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m3-l2-triggers-actions-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو عايز تتابع الـ Facebook Ads بتاعتك أول ما تصرف 1000 جنيه عشان تاخد قرار، إيه أنسب نوع Trigger تستخدمه عشان الأوتوميشن يشتغل؟",
          options: [
            "Webhook، عشان Facebook هيبعت إشعار فوراً لما توصل للـ limit ده.",
            "Polling، عشان الأوتوميشن يسأل Facebook كل دقيقة لو المصروف وصل لـ 1000 جنيه.",
            "Schedule، الأوتوميشن هيشتغل كل ساعة ويشيك على المصروف."
          ],
          correctIndex: 0,
          explanation: "الـ Webhook هو الأنسب للحالات اللي الأداة أو الخدمة (زي Facebook) بتبعتلك إشعار فوري لما حدث معين يحصل (زي الوصول لـ 1000 جنيه مصروف)، ده بيوفر استهلاك الموارد وبيكون أسرع."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "مدير مشروع طلب منك تعمل أوتوميشن يبعت تقرير يومي شامل لعدد التسجيلات الجديدة في الـ CRM الساعة 9 الصبح بالظبط. إيه الـ Trigger والـ Action اللي هتستخدمهم في الأوتوميشن ده؟",
          options: [
            "Trigger: Schedule كل يوم الساعة 9 الصبح. Action: استدعاء API لـ CRM عشان تاخد عدد التسجيلات الجديدة وتبعته في إيميل.",
            "Trigger: Webhook من الـ CRM أول ما يحصل تسجيل جديد. Action: أضف التسجيل الجديد لتقرير وابعته.",
            "Trigger: Polling كل 10 دقايق للـ CRM. Action: خد آخر 10 تسجلات وابعته في رسالة على Slack."
          ],
          correctIndex: 0,
          explanation: "الـ Schedule مناسب جداً للمهام اللي بتحصل في توقيتات محددة (زي كل يوم الساعة 9 الصبح). والـ Action هيكون مجموعة خطوات لجمع البيانات (عن طريق API) وبعتها (عن طريق إيميل)."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "عندك موقع بتبيع عليه كورسات. عايز أول ما عميل يشتري كورس جديد، تبعتله فوراً رسالة ترحيبية على الواتساب فيها تفاصيل الكورس. إيه الـ Trigger والـ Action اللي هتعملهم هنا؟",
          options: [
            "Trigger: Webhook من بوابة الدفع أو الـ CMS أول ما تتم عملية شراء. Action: إرسال رسالة واتساب للعميل.",
            "Trigger: Polling كل 5 دقايق لقاعدة البيانات بتاعت الطلبات. Action: لو فيه طلب جديد، ابعت رسالة واتساب.",
            "Trigger: Manual، أول ما تشوف طلب جديد تدوس على زرار عشان تبعت رسالة الواتساب."
          ],
          correctIndex: 0,
          explanation: "الـ Webhook هو الأنسب لأحداث بتحصل لحظياً ومحتاجة رد فعل فوري (زي عملية الشراء). والـ Action هو إنك تبعت رسالة واتساب بناءً على الـ output بتاع الـ Trigger ده."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "صمّم Workflow بـ Trigger + ٣ Actions",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "Workflow بسيط = Trigger واحد + Actions متتالية. هتصممه بالتفصيل قبل أي tool.",
      prompt:
        "في تسليمك:\n\n١) Goal الـ Workflow في سطر:\n٢) Trigger:\n   - النوع (Webhook / Schedule / Event):\n   - الـ payload المتوقع (مثال JSON):\n٣) Action 1:\n   - الـ tool/service:\n   - Input من الـ trigger:\n   - Output:\n٤) Action 2: نفس الشكل (يستخدم output الـ action 1):\n٥) Action 3: نفس الشكل\n٦) Success — إزاي تعرف إنه اشتغل تمام؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "Workflow كامل",
          weight: 60,
          criteria: [
            "Trigger معه payload متوقع.",
            "كل action بتستخدم output اللي قبلها بوضوح.",
          ],
        },
        {
          label: "Success metric",
          weight: 40,
          criteria: [
            "حدّدت نتيجة قابلة للقياس مش «هيرسل الإيميل».",
            "الـ Goal مربوط بالـ Success metric.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "كل learner_event = Trigger في المنصة",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "كل learner_event = Trigger في المنصة",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Automator — نفس اللي بتتعلمه. كل ما تخلّص درس، event بيتسجّل. الـ event ده هو Trigger — والـ Actions اللي بتشتغل: تحديث streak، تحديث review schedule، إضافة badge، تحديث dashboard. trigger واحد → 4 actions.",
      bullets: [
        "Trigger: lesson_completed → DB function تتولّى الباقي.",
        "Actions متسلسلة: update streak → schedule review → award badge.",
        "كله شغّال بـ Postgres functions و triggers.",
      ],
      pathAngle: "automator",
      link: { label: "افتح /dashboard", href: "/dashboard" },
    },
  }
];
