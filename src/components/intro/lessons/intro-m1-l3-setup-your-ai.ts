import {
  AlertCircle,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import setupScreenshot from "@/assets/lessons/intro-m1-l3-setup-your-ai.jpg";

/**
 * Intro · Lesson 03 — افتح أول AI ليك في دقيقتين (v2: Tension-First)
 */
export const INTRO_SETUP_YOUR_AI_CONTENT: IntroLessonContent = [
  {
    icon: AlertCircle,
    eyebrow: "TENSION",
    title: "لسه بتتفرج على الدروس من غير ما تفتح AI؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "ده زي إنك تتعلم السواقة من غير ما تقعد ورا الدركسيون.",
        "لو مفيش أداة مفتوحة قدامك، كل درس بعد كده هيبقى كلام لطيف بس مش مهارة.",
        "الدرس ده هدفه بسيط قوي: تفتح أول Chatbot وتبعت أول رسالة — النهارده مش بعدين.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "٤ مصطلحات بس",
    title: "اللي محتاج تعرفه قبل ما تفتح الحساب",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Chatbot",
          meaning: "واجهة محادثة بتكتب فيها سؤال والـ AI يرد عليك.",
          example: "ChatGPT و Claude و Gemini كلهم Chatbots.",
        },
        {
          term: "Free Tier",
          meaning: "استخدام مجاني بحد يومي أو شهري من غير اشتراك.",
          example: "تقدر تخلص دروس المنصة كلها تقريبًا بالنسخة المجانية.",
        },
        {
          term: "Login",
          meaning: "تسجيل دخول بحسابك عشان المحادثات تتسجل وتعرف ترجع لها.",
          example: "Gemini غالبًا بيفتح بحساب Google مباشرة.",
        },
        {
          term: "Message Box",
          meaning: "مربع الكتابة اللي تحت في واجهة الـ Chatbot.",
          example: "هنا هتكتب أول prompt ليك وتضغط Enter.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — افتح أداة واحدة وابعت أول رسالة",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      url: "/lessons/intro/intro-m1-l3-setup-your-ai.mp4",
      durationLabel: "0:41",
      caption: "خطوة عملية قصيرة: اختيار أداة، فتح الحساب، أول رسالة.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "Quick Win",
    title: "اختار واحد بس — متقارنش التلاتة دلوقتي",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "١. لو عايز أسهل بداية: افتح ChatGPT.",
        "٢. لو حساب Google جاهز وعايز دخول سريع: افتح Gemini.",
        "٣. لو كتابتك طويلة وعايز أسلوب مرتب: جرّب Claude.",
        "**المهم:** متفتحش التلاتة وتقعد تقارن. افتح واحد، ابعت رسالة، وخلاص كده إنت بدأت فعليًا.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "كل الواجهات شبه بعض",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: setupScreenshot,
      alt: "ثلاث واجهات Chatbot: مربع كتابة في الأسفل ومحادثة تظهر فوق",
      caption:
        "الواجهة مش محتاجة شرح طويل: مربع كتابة تحت، الرد يظهر فوق. أول رسالة أهم من اختيار الأداة المثالية.",
      label: "Chatbot interface",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "نفس البداية — نتيجتين مختلفتين",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — تقارن وتستنى",
        body: "تفتح فيديوهات عن ChatGPT و Claude و Gemini وتستنى تعرف الأفضل. بعد أسبوع: لسه مبعتش ولا prompt.",
      },
      right: {
        label: "RIGHT — افتح واحد وابعت",
        body: "اختار ChatGPT أو Gemini، سجّل دخول، واكتب: «إنت تقدر تساعدني في إيه في شغلي/دراستي؟» كده بدأت.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "اختبر فهمك",
    title: "٣ مواقف سريعة",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "intro-m1-l3-setup-your-ai-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "سارة لسه مبتدئة ومتوترة من الاختيارات. تعمل إيه؟",
          options: [
            "تختار Chatbot واحد وتبعت أول رسالة بسيطة.",
            "تفتح ١٠ فيديوهات مقارنة الأول.",
            "تستنى لما تحتاجه في شغل مهم.",
          ],
          correctIndex: 0,
          explanation: "الهدف مش اختيار مثالي. الهدف أول تفاعل حقيقي.",
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "محمود قلقان من الاشتراكات. إيه الرد الصح؟",
          options: [
            "لازم يدفع عشان يتعلم.",
            "الـ Free Tier كافي للتجارب والدروس الأولى.",
            "الأدوات المجانية مش بترد بالعربي.",
          ],
          correctIndex: 1,
          explanation: "المطلوب في البداية بسيط، والنسخ المجانية كافية للتطبيق.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "بعد ما تفتح الأداة، أول خطوة عملية؟",
          options: [
            "تدور في الإعدادات.",
            "تبعت سؤال بسيط عن حاجة محتاجها فعلًا.",
            "تقفل الصفحة وتكمل الدروس نظري.",
          ],
          correctIndex: 1,
          explanation: "المهارة بتبدأ من أول prompt، مش من الإعدادات.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "Mission — افتح وابعت",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "ممنوع تخلص الدرس ده نظري. افتح أداة واحدة وابعت رسالة واحدة بس.",
      prompt:
        "في تسليمك اكتب:\n\n١) اخترت أنهي Chatbot؟ وليه في جملة؟\n٢) عملت Login؟ نعم/لأ — لو لأ، إيه اللي وقفك؟\n٣) أول prompt بعتّه — انسخه زي ما هو:\n٤) أول رد جالك — لخّصه في سطرين:\n٥) إيه حاجة واحدة هتجربها عليه بكرة؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "تنفيذ فعلي",
          weight: 80,
          criteria: ["في أداة اتفتحت ورسالة اتبعتت ورد اتشاف."],
        },
        {
          label: "خطوة تالية",
          weight: 20,
          criteria: ["في تجربة صغيرة واضحة هتتعمل بكرة."],
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "جزء من المنصة",
    title: "نفس المنطق استخدمناه في بناء المنصة",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "بدأنا بأداة واحدة قبل ما نوسّع",
      summary:
        "المنصة نفسها ما بدأتش بعشر أدوات. بدأنا بأداة AI واحدة واضحة، جرّبنا عليها الدروس والسكريبتات، وبعدها وسّعنا الاستخدام لما بقى فيه نتيجة.",
      bullets: [
        "أول هدف: prompt واحد يطلع شرح مفهوم.",
        "بعدها: نفس النمط اتكرر للدروس والفيديوهات.",
        "القاعدة: ابدأ صغير، اثبت إن الطريقة شغالة، بعدين كبّر.",
      ],
      pathAngle: "business",
    },
  },
];
