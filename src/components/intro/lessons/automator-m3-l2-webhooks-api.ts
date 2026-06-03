import {
  Webhook,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical, HeartHandshake } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import automatorM3WebhooksApiScreenshot from "@/assets/lessons/unique/automator-m3-l2-webhooks-api.jpg";
/**
 * Automator · M3 · Lesson 02 — Webhooks & APIs
 */
export const AUTOMATOR_M3_WEBHOOKS_API_BLOCKS: IntroLessonContent = [
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
    icon: Webhook,
    eyebrow: "HERO",
    title: "Webhooks & APIs",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "ببساطة: ده الطريقة اللي البرامج بتتكلم بيها مع بعض.",
        "متخضش من الأسماء — الفكرة سهلة جدًا وهنشرحها خطوة خطوة.",
      ],
    },
  },
  {
    icon: HeartHandshake,
    eyebrow: "اطمن",
    title: "مش لازم تحفظ كل حاجة",
    tone: "accent",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الدرس ده فيه كلمات تقنية كتير — عادي متفهمهاش كلها من أول مرة.",
        "ركّز بس على فكرتين: API = إنت بتسأل. Webhook = حد بيقولك. خلاص كده.",
        "باقي المصطلحات (Token، HMAC، Payload…) هتشوفها في الـ nodes جاهزة، مش هتكتبها بإيدك.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "٣ كلمات بس",
    title: "الكلمات اللي تهمك دلوقتي",
    block: {
      kind: "concepts",
      items: [
        { term: "API", meaning: "إنت بتسأل برنامج تاني وبيرد عليك.", example: "زي ما تكلم 16528 وتسأل عن رصيدك — إنت اللي بدأت المكالمة." },
        { term: "Webhook", meaning: "برنامج تاني بيرن عليك أول ما يحصل حاجة.", example: "زي رنة فودافون كاش لما حد يحولك فلوس — هي اللي جاتلك من غير ما تسأل." },
        { term: "Payload", meaning: "البيانات اللي بتتبعت جوه الرسالة.", example: "زي اسم العميل ورقم تليفونه اللي جوه الرسالة." },
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
      caption: "الفرق بين API call و Webhook، وإزاي تستخدمهم في nodes حقيقية.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "فكرتين بس مش أكتر",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "API = إنت اللي بتروح تسأل. مثال: 'هاتلي أوردرات النهارده'.",
        "Webhook = هي اللي بتيجيلك. مثال: 'في أوردر جديد دلوقتي!'.",
        "والأحلى: في n8n وMake فيه nodes جاهزة للاتنين — مش هتكتب كود.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "الـ backend بتاع المنصة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: automatorM3WebhooksApiScreenshot,
      alt: "سكرين شوت من المنصة",
      caption:
        "المنصة بتتكلم مع الـ backend عن طريق endpoints زي اللي شفتها في Builder M5. أي workflow في Make/n8n يقدر يستدعي نفس الـ endpoints دي بنفس الـ keys. كل اللي بنعمله في Automator مبني على نفس الفكرة دي.",
      label: "من المنصة — درس Backend API في Builder",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "إزاي تتجنب أكبر غلطة",
    block: {
      kind: "comparison",
      left: {
        label: "غلط — بتجرب على طول",
        body: "بتربط الـ node وتشغّله، وييجي رد '401 Unauthorized'، وتفضل ساعة تدور على السبب.",
      },
      right: {
        label: "صح — اقرا الـ docs الأول",
        body: "تفتح صفحة الـ API بتاع الخدمة، تشوف بيطلب مفتاح إزاي، تحطه في الـ node، وتجرب. ٥ دقايق بس.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "Webhook + API في scenario واحد",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "automator-m3-l2-webhooks-api-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "إنت عايز تعمل أتمتة إن كل ما عميل جديد يسجل في موقعك الإلكتروني (اللي بيبعت Webhook)، بياناته تتبعت أوتوماتيك لـ CRM (نظام إدارة علاقات العملاء) بتاعك عن طريق API. إيه الـ HTTP Method اللي هتستخدمه عشان تضيف بيانات العميل الجديد ده للـ CRM؟",
          options: [
            "GET",
            "POST",
            "DELETE"
          ],
          correctIndex: 1,
          explanation: "بنستخدم الـ POST لما بنحب ننشئ (نضيف) بيانات جديدة في الـ API، وده اللي هيحصل هنا عشان نضيف بيانات العميل في الـ CRM."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "لو عايز تجيب معلومات عن منتج معين من API بتاع متجر إلكتروني، ومحتاج تبعتله الـ ID بتاع المنتج ده عشان يجيبلك بياناته. الجزء اللي بيحتوي على البيانات دي في الـ request بنسميه إيه؟",
          options: [
            "Webhook",
            "Payload",
            "Endpoint"
          ],
          correctIndex: 1,
          explanation: "الـ Payload هو البيانات اللي بتتبعت في الـ request، وهنا بيانات المنتج (الـ ID) هي اللي هتتبعت."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "إيه الفرق الجوهري بين الـ API Call والـ Webhook في طريقة تبادل المعلومات بين الأنظمة؟",
          options: [
            "الـ API Call بيستخدم الـ GET بس، والـ Webhook بيستخدم الـ POST بس.",
            "الـ API Call أنت اللي بتبعت الـ request، والـ Webhook الخدمة هي اللي بتبعتلك الـ request لما حدث يحصل.",
            "الـ Webhook بيرجعلك JSON، والـ API Call بيرجعلك XML بس."
          ],
          correctIndex: 1,
          explanation: "في الـ API Call إنت اللي بتروح تجيب المعلومة، لكن في الـ Webhook الخدمة هي اللي بتبعتلك المعلومة لما يحصل حدث معين، وده الفرق الأساسي بينهم."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "تطبيق بسيط",
    title: "اختر سيناريو واحد واكتبه",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "مش هتكتب كود — بس تفكر في سيناريو حقيقي وتكتبه في ٣ سطور.",
      prompt:
        "اكتب في ٣ سطور:\n\n١) السيناريو: إيه الحاجة اللي لما تحصل عايز السيستم يتحرك؟ (مثال: عميل جديد سجّل)\n٢) النوع: ده API (أنا بسأل) ولا Webhook (هما بيقولولي)؟\n٣) بعدها هيحصل إيه؟ (مثال: يتبعتله رسالة ترحيب)",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "السيناريو واضح",
          weight: 50,
          criteria: [
            "في حدث محدد (مش كلام عام).",
            "اخترت API أو Webhook وعارف ليه.",
          ],
        },
        {
          label: "النتيجة واضحة",
          weight: 50,
          criteria: [
            "عارف هيحصل إيه بعد ما الحدث يجي.",
            "تقدر تشرحه لحد تاني في جملة.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "Webhook callbacks في /api/public/*",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "Webhook callbacks في /api/public/*",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Automator — نفس اللي بتتعلمه. لو ربطنا الـ payment provider، الـ webhook بيوصل على /api/public/payment-webhook. الـ endpoint بيتحقّق من signature الأول، ثم بيحدّث user_subscriptions. ده الـ pattern اللي اتعلّمته بالظبط.",
      bullets: [
        "Endpoints تحت /api/public/* مفتوحة بدون auth.",
        "أول حاجة: HMAC signature verification.",
        "بعدها: parse + validate Zod schema قبل أي write.",
      ],
      pathAngle: "automator",
      link: { label: "افتح /system-state", href: "/system-state" },
    },
  }
];
