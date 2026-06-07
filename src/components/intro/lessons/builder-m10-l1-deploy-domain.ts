import {
  Sparkles,
  AlertCircle,
  PlayCircle,
  Lightbulb,
  Scale,
  Rocket,
  BookOpen,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import deployScreenshot from "@/assets/lessons/builder-m10-l1-deploy-domain.jpg";

/** Builder · M10 · Lesson 01 — Deploy & Domain (v3: Lesson Shape pilot) */
export const BUILDER_M10_DEPLOY_DOMAIN_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ إزاي تطلّع تطبيقك بلينك عام — وتخلي الأسرار في مكان محمي.",
        "ليه دلوقتي؟ بنيت واجهة ومخزن وAI — بس لسه على localhost. محدش غيرك يقدر يستخدمه.",
        "هتعمل إيه بعد الدرس؟ هتفرّق بين حاجة «عامة» (لينك، اسم) وحاجة «سرية» (API keys).",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "تطبيق جامد — بس محبوس على جهازك",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل حاجة شغالة على `localhost` — بس محدش في العالم يقدر يفتحها.",
        "تبعت `localhost:5173` لصاحبك — مش هيفتح عنده. التطبيق لسه فكرة على جهازك.",
        "Deploy = تطلّعه للإنترنت. بس في نفس الوقت — مفتاح OpenAI لازم يفضل سر، مش في الكود.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "لينك عام + أسرار محمية",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Deploy = الكود يروح سيرفر — الناس تفتحه من URL عام (زي `my-app.com`).",
        "الأسرار (API keys، مفاتيح المخزن) تروح «خزنة» على السيرفر — Environment Variables — مش في GitHub.",
        "الفرق: اللي الناس تشوفه (لينك، واجهة) vs اللي لازم يفضل مخفي (مفاتيح).",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "مفتاح في الكود vs مفتاح في خزنة",
    block: {
      kind: "comparison",
      left: {
        label: "غلط — سر في الكود",
        body: "مفتاح OpenAI في ملف على GitHub — أي حد يشوفه ويستخدمه على حسابك. كارثة مالية وأمان.",
      },
      right: {
        label: "صح — سر في Env Vars",
        body: "الكود Public — المفاتيح في خزنة السيرفر بس. اللينك عام، الأسرار محمية.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للبداية",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Deploy (إطلاق)",
          meaning: "نقل التطبيق من جهازك لسيرفر — URL عام أي حد يفتحه.",
          example: "من localhost → `https://my-ai-app.com`.",
        },
        {
          term: "Environment Variables",
          meaning: "خزنة أسرار على السيرفر — مفاتيح API وكلمات سر المخزن.",
          example: "OPENAI_API_KEY في إعدادات Production — مش في الكود.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — من localhost للعالم",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "Deploy، دومين، HTTPS، وخزنة الأسرار — خطوة بخطوة. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "سجل البناء — إطلاق ناجح",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: deployScreenshot,
      alt: "صفحة سجل البناء بتوضح تاريخ عمليات النشر للتطبيق.",
      caption:
        "كل deploy = نسخة جديدة على الإنترنت. سجل البناء يورّيك إيه نجح وإيه فشل — مش صندوق أسود.",
      label: "سجل البناء",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m10-l1-deploy-domain-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "التطبيق شغال على جهازك. إيه أخطر حاجة تنساها قبل الإطلاق؟",
          options: [
            "مفاتيح API في خزنة Production — مش في الكود أو GitHub.",
            "لون زرار «Submit» في الواجهة.",
            "عدد صفحات الـ 404.",
          ],
          correctIndex: 0,
          explanation:
            "أسرار غلط = التطبيق يقع أو يتسرق. اللينك عام — والأسرار لازم تفضل في الخزنة.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "قايمة: عام vs سري",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "قبل Deploy — فرّق إيه اللي الناس تشوفه وإيه اللي لازم يفضل مخفي.\n\n١٠ دقايق.",
      prompt:
        "في تسليمك اكتب:\n\n**عام (OK للناس تشوفه):**\n- [...]\n- [...]\n- [...]\n\n**سري (خارج النطاق للكود العام):**\n- [...]\n- [...]\n- [...]\n\n**سؤال:** أنهي سر لو اتسرّب أخطر — ولِيه؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "عام:\n1. [...]\n2. [...]\n3. [...]\n\nسري:\n1. [...]\n2. [...]\n3. [...]\n\nأخطر سر:\n[...]\nلِيه: [...]",
      rubric: [
        {
          label: "تصنيف صح",
          weight: 60,
          criteria: [
            "٣ حاجات عامة (URL، واجهة، محتوى عام).",
            "٣ أسرار (API keys، DB password، JWT secret).",
          ],
        },
        {
          label: "أولوية الخطر",
          weight: 40,
          criteria: [
            "حدّدت أخطر سر بسبب منطقي (فلوس، بيانات مستخدمين، ...).",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ Deploy = لينك عام. الأسرار = في خزنة — مش في الكود.",
        "تقدر تعمل إيه؟ عندك قايمة عام vs سري جاهزة قبل الإطلاق.",
        "اللي جاي: أول ١٠ مستخدمين — الواقع يعلّمك أكتر من أي خطة.",
      ],
    },
  },
];
