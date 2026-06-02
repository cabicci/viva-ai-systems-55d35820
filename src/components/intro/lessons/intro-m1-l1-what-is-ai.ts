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
import aiAssistantScreenshot from "@/assets/lessons/intro-m1-l1-what-is-ai-assistant.jpg";

/**
 * Intro · Lesson 01 — AI يعني إيه فعلًا (v2: Tension-First)
 */
export const WHAT_IS_AI_CONTENT: IntroLessonContent = [
  {
    icon: AlertCircle,
    eyebrow: "TENSION",
    title: "بتسمع «AI» في كل حتة وحاسس إنك متأخر؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل يوم في حد بيقولك «الـ AI هيغيّر شغلك» أو «استخدم ChatGPT» — وإنت لسه مش فاهم هو إيه أصلًا.",
        "المشكلة مش إنك متأخر. المشكلة إن محدش وقفلك ٣ دقايق وقالك بالظبط الحكاية إيه.",
        "الدرس ده هيفك اللغز في كلمتين، عشان تبقى عارف بتتعامل مع إيه قبل ما تبدأ تجرّب.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "٤ مصطلحات بس",
    title: "اللي محتاج تعرفه دلوقتي",
    block: {
      kind: "concepts",
      items: [
        {
          term: "AI (ذكاء اصطناعي)",
          meaning: "برامج بتقلّد قدرات بشرية زي الفهم والكلام والقرار.",
          example: "لما Google Maps يقولك «الطريق ده أسرع» — ده AI بسيط.",
        },
        {
          term: "Model (موديل)",
          meaning: "البرنامج نفسه اللي اتدرّب وبقى جاهز يرد عليك.",
          example: "ChatGPT و Gemini و Claude — كلهم Models مختلفة.",
        },
        {
          term: "Training (تدريب)",
          meaning: "المرحلة اللي بنوريّ فيها الـ AI ملايين الأمثلة عشان يتعلم.",
          example: "زي ما الطفل بيتعلم لغة من سماع الناس، الـ AI اتعلم من نصوص الإنترنت.",
        },
        {
          term: "Generative AI",
          meaning: "نوع من الـ AI بيولّد محتوى جديد — كلام، صور، كود.",
          example: "ChatGPT بيكتبلك إيميل من الصفر، مش بس بيرد بإجابة جاهزة.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — الـ AI في ٣٠ ثانية",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      url: "/lessons/intro/intro-m1-l1-what-is-ai.mp4",
      durationLabel: "0:29",
      caption: "شرح بصوت أشرف بالعامية — من غير مصطلحات معقدة.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "Quick Win",
    title: "أداة بتاخد طلب وتطلّع نتيجة — بس",
    block: {
      kind: "paragraphs",
        paragraphs: [
        "١. **مش سحر** — هو برنامج شاف ملايين الأمثلة، وبيستخدمها يطلّعلك رد قريب من اللي طلبته.",
        "٢. **مش بديل ليك** — هو زي الآلة الحاسبة: بيوفّر وقت، بس القرار في إيدك.",
        "٣. **مش وحش جاي ياخد شغلك** — اللي هياخد شغلك هو حد تاني بيستخدم AI، مش الـ AI نفسه.",
        "**القاعدة:** متحاولش تفهمه نظري. افتحه وجرّبه في حاجة بسيطة من يومك — هتفهمه في دقيقتين.",
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "في AI شغّال جوّه المنصة دلوقتي",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: aiAssistantScreenshot,
      alt: "صفحة /ai-assistant — مساعد AI داخل المنصة بيرد بناءً على الدرس.",
      caption:
        "ده /ai-assistant بتاعنا. مش demo ولا فيديو — AI حقيقي شغّال، بيقرا الدرس قبل ما يرد. مثال إن الـ AI أداة عملية مش حاجة بعيدة عنك.",
      label: "من المنصة — /ai-assistant",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "نفس الكلمة — فهمين مختلفين",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — تتعامل معاه كإنسان",
        body: "تفترض إنه فاهم نيّتك، وتزعل لما الرد يطلع مش زي ما إنت متوقع. النتيجة: تستنّى ٦ شهور وإنت بتدوّر على «أحسن AI».",
      },
      right: {
        label: "RIGHT — تتعامل معاه كأداة",
        body: "تفتح أي AI، تكتب طلب محدد، تشوف الرد، وتعدّل الطلب. كل تجربة بتزوّد فهمك. بعد أسبوع تكون اتعلمت أكتر من ٦ شهور قراية.",
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
      lessonId: "intro-m1-l1-what-is-ai-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "كريم خايف الـ AI ياخد شغله كمحاسب. إيه الفهم الصح؟",
          options: [
            "الـ AI مش هياخد شغله، لكن محاسب تاني بيستخدم AI ممكن.",
            "لازم يسيب شغله ويتعلم برمجة.",
            "الـ AI سحر ومفيش حاجة هتقف قدامه.",
          ],
          correctIndex: 0,
          explanation: "الـ AI أداة. الخطر مش منه — من حد تاني في شغلك بيستخدمه أحسن منك.",
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "نهى عايزة تفهم الـ AI، فتحت ١٠ مقالات نظرية. الأحسن تعمل إيه؟",
          options: [
            "تكمّل قراية لحد ما تفهم كل التفاصيل التقنية.",
            "تفتح ChatGPT وتطلب منه يساعدها في حاجة بسيطة من يومها.",
            "تستنّى كورس متخصص.",
          ],
          correctIndex: 1,
          explanation: "الفهم بييجي من التجربة، مش من القراية. تجربة واحدة بتعلّمك أكتر من ١٠ مقالات.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "محمد بيقول «الـ AI بيفكّر». ده صح ولا غلط؟",
          options: [
            "صح — هو فعلًا بيفهم زينا.",
            "غلط — هو بيحسب احتمالات بناءً على أمثلة شافها قبل كده، مش بيفكّر بمعنى البشر.",
            "مش مهم نعرف.",
          ],
          correctIndex: 1,
          explanation: "ده فرق مهم: لما تفهم إنه بيحسب احتمالات، هتعرف ليه أحيانًا بيغلط وإزاي تتعامل معاه.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "Mission — جرّبه في حاجة من يومك",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "ممنوع تخلص الدرس ده نظري. اختار حاجة بسيطة من يومك وجرّب AI واحد فيها.",
      prompt:
        "في تسليمك اكتب:\n\n١) إيه الحاجة ا