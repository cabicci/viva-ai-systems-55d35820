import {
  Sparkles,
  AlertCircle,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import setupScreenshot from "@/assets/lessons/intro-m1-l3-setup-your-ai.jpg";

/**
 * Intro · Lesson 03 — افتح أول AI ليك في دقيقتين (v3: Lesson Shape pilot)
 */
export const INTRO_SETUP_YOUR_AI_CONTENT: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ أول فوز حقيقي = تفتح AI واحد وتبعت رسالة بسيطة — من غير تعقيد.",
        "ليه دلوقتي؟ في الدرس اللي فات تعلمت تكتب Prompt (تعليمات بتكتبها للـ AI) أوضح. النهاردة هتجرّبه بإيدك مش بس على الورق.",
        "هتعمل إيه بعد الدرس؟ هتكون فاتح أداة وابعت أول رسالة — وده يفتحلك باقي المسار.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "بتتفرج على الدروس من غير ما تفتح AI؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "ده زي إنك تتعلم السواقة من غير ما تقعد ورا الدركسيون.",
        "لو مفيش أداة مفتوحة، كل درس بعد كده هيبقى كلام حلو — بس مش مهارة.",
        "الدرس ده هدفه بسيط: تفتح Chatbot واحد وتبعت رسالة واحدة النهاردة.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "افتح واحد — جرّب — وخلاص بدأت",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الـ Chatbot (واجهة محادثة) شكلها بسيط: مربع كتابة تحت، والرد يظهر فوق. زي أي واتساب — بس الطرف التاني AI.",
        "مش محتاج تختار «الأداة المثالية». ChatGPT أو Gemini أو Claude — أي واحد مجاني يكفي للبداية.",
        "مش محتاج API (وسيلة تخلي برنامجين يكلموا بعض) ولا اشتراك مدفوع. النسخة المجانية كافية لتجارب الدروس الأولى.",
        "أول رسالة ممكن تكون بسيطة: «إنت تقدر تساعدني في إيه في شغلي؟» أو استخدم الـ Prompt (تعليمات بتكتبها للـ AI) اللي كتبته في الدرس اللي فات.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمة واحدة",
    title: "مصطلح واحد بس",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Chatbot (محادثة AI)",
          meaning: "صفحة أو تطبيق تكتب فيه سؤال والـ AI يرد عليك فورًا.",
          example: "ChatGPT و Gemini و Claude — كلهم Chatbots بنفس الفكرة.",
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
      caption:
        "خطوة عملية قصيرة: اختيار أداة، فتح الحساب، أول رسالة. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "نفس البداية — نتيجتين مختلفتين",
    block: {
      kind: "comparison",
      left: {
        label: "تقارن وتستنى",
        body: "تفتح فيديوهات مقارنة وتستنى «الأفضل». بعد أسبوع: لسه مبعتش ولا رسالة.",
      },
      right: {
        label: "تفتح وتجرّب",
        body: "تختار ChatGPT أو Gemini، تسجّل دخول، وتبعت سؤال بسيط. في دقايق إنت بدأت فعلًا.",
      },
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "كل الواجهات شبه بعض",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: setupScreenshot,
      alt: "ثلاث واجهات Chatbot: مربع كتابة في الأسفل ومحادثة تظهر فوق",
      caption:
        "الواجهة مش محتاجة شرح طويل: مربع كتابة تحت، الرد يظهر فوق. أول رسالة أهم من اختيار الأداة المثالية.",
      label: "شكل أي Chatbot",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "intro-m1-l3-setup-your-ai-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "سارة مبتدئة ومتوترة من اختيار الأداة. أحسن خطوة دلوقتي؟",
          options: [
            "تفتح Chatbot واحد وتبعت أول رسالة بسيطة.",
            "تقارن ١٠ فيديوهات قبل ما تفتح أي حاجة.",
            "تستنى لما تحتاج AI في شغل مهم.",
          ],
          correctIndex: 0,
          explanation: "الهدف مش اختيار مثالي. الهدف أول تفاعل حقيقي — وبعدين تتحسّن.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "افتح AI واحد وابعت رسالة بسيطة",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "الدرس ده محتاج تجربة صغيرة بإيدك. افتح ChatGPT أو Gemini أو Claude (أي واحد مجاني)، وسجّل دخول لو طلب منك.\n\nابعت رسالة واحدة — ممكن الـ Prompt اللي كتبته في الدرس اللي فات، أو سؤال بسيط زي «إنت تقدر تساعدني في إيه؟»",
      prompt:
        "في تسليمك اكتب:\n\n١) أنهي Chatbot فتحت؟\n٢) أول رسالة بعتّها — انسخها زي ما هي:\n٣) أول رد جالك — لخّصه في سطرين:\n٤) إيه حاجة واحدة هتجربها عليه بكرة؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "١) الأداة:\n   [ChatGPT / Gemini / Claude / غيرهم]\n\n٢) أول رسالة:\n   [انسخ هنا]\n\n٣) أول رد:\n   [اكتب هنا]\n\n٤) هجرب بكرة:\n   [اكتب هنا]",
      rubric: [
        {
          label: "تجربة حقيقية",
          weight: 70,
          criteria: ["فتحت أداة وابعت رسالة — حتى لو بسيطة."],
        },
        {
          label: "خطوة تالية",
          weight: 30,
          criteria: ["كتبت حاجة هتجربها تاني — حتى لو صغيرة."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت الخطوة التالتة",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ أول فوز = فتح + رسالة واحدة. مش محتاج إعدادات معقدة ولا اشتراك.",
        "تقدر تعمل إيه؟ تفتح أي AI مجاني وتبعت طلب واضح زي اللي تعلمته — وتشوف الرد.",
        "اللي جاي: في الدرس الجاي هتعرف إيه اللي الـ AI يقدر يعمله بأمان — وإيه اللي لازم تتأكد منه بنفسك.",
      ],
    },
  },
];
