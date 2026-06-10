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
import aiAssistantScreenshot from "@/assets/lessons/intro-m1-l1-what-is-ai-assistant.jpg";

/**
 * Intro · Lesson 01 — AI يعني إيه فعلًا (v3: Lesson Shape pilot)
 */
export const WHAT_IS_AI_CONTENT: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ الـ AI مش سحر — هو أداة بتاخد طلب منك وترجعلك رد. زي مساعد ذكي على الموبايل.",
        "ليه دلوقتي؟ الكل بيتكلم عن AI، وطبيعي تحس إن الموضوع كبير. الدرس ده يفكّكها لك في خطوات بسيطة من غير تعقيد.",
        "هتعمل إيه بعد الدرس؟ هتجرّب AI واحد في حاجة صغيرة من يومك — وتبقى واثق إنك تقدر تكمل باقي المسار.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "بتسمع عن AI كتير ومش واضح تبدأ منين؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "طبيعي. في ناس بتقولك «استخدم ChatGPT» من غير ما تشرحلك هو إيه أصلًا.",
        "مش مطلوب منك تبقى خبير النهاردة. المطلوب بس تفهم الفكرة الأساسية وتجرّبها مرة واحدة بإيدك.",
        "لو حسّيت إن الكلام كتير، خُدها خطوة خطوة — كل قسم صغير ولوحده.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "الـ AI أداة مساعدة — مش سحر ولا بديل عنك",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الـ AI برنامج اتعلّم من أمثلة كتير، وبيطلّعلك رد قريب من اللي طلبته. زي الآلة الحاسبة: بتوفر وقت، بس القرار في إيدك.",
        "مش بيفكّر زي الإنسان — بيحسب أنسب رد من اللي شافه قبل كده. عشان كده أحيانًا بيغلط، وده طبيعي.",
        "اللي يفرق معاك مش إنك تفهم كل التفاصيل التقنية — إنك تفتح أي أداة وتجرّب طلب بسيط. التجربة هتفهمك أسرع من أي شرح طويل.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين هتسمعهم كتير",
    block: {
      kind: "concepts",
      items: [
        {
          term: "AI (ذكاء اصطناعي)",
          meaning: "برنامج بيساعدك في حاجة محددة — كتابة، تلخيص، تنظيم أفكار.",
          example: "لما تطلب من ChatGPT يكتبلك رسالة — ده استخدام AI.",
        },
        {
          term: "Model (موديل)",
          meaning: "اسم البرنامج الجاهز اللي بتتكلم معاه.",
          example: "ChatGPT و Gemini و Claude — كل واحد Model مختلف بس الفكرة واحدة.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — نفس الفكرة في دقيقتين",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      url: "/lessons/intro/intro-m1-l1-what-is-ai.mp4",
      durationLabel: "2:30",
      caption: "شرح بصوت أشرف بالعامية. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "نفس الأداة — فهمين مختلفين",
    block: {
      kind: "comparison",
      left: {
        label: "لو فهمته غلط",
        body: "تتوقع إنه فاهم نيّتك من أول مرة، وتزعل لما الرد يطلع مش مظبوط. فتسيبه وتقول «مش شغال معايا».",
      },
      right: {
        label: "لو فهمته صح",
        body: "تكتب طلب واضح، تشوف الرد، وتعدّل سؤالك. كل محاولة بتعلّمك إزاي تتعامل معاه كأداة — مش كإنسان.",
      },
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "حلقة واحدة: سؤال → رد → تعديل",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: aiAssistantScreenshot,
      alt: "مثال بصري: مربع سؤال فوق ورد الـ AI تحته — زي أي شات AI.",
      caption:
        "الفكرة كلها في حلقة بسيطة: إنت تسأل → الـ AI يرد → إنت تستخدم الرد أو تعدّله. الصورة توضّح الشكل — مش محتاج تفهم برمجة ولا إعدادات.",
      label: "مثال على شكل المحادثة",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "intro-m1-l1-what-is-ai-apply",
      items: [
        {
          id: "apply1",
          bloom: "understand",
          question: "أحسن طريقة تبدأ بيها تفهم الـ AI النهاردة؟",
          options: [
            "تقرأ ١٠ مقالات تقنية الأول.",
            "تفتح ChatGPT أو Gemini وتطلب منه حاجة بسيطة من يومك.",
            "تستنّى لحد ما «تبقى جاهز».",
          ],
          correctIndex: 1,
          explanation: "تجربة واحدة صغيرة بتعلّمك أكتر من قراية طويلة. ده بالظبط اللي هتعمله في المهمة.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "جرّب AI في حاجة بسيطة من يومك",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي هتخليك تطبق فكرة الدرس على موقف حقيقي — مش محتاج إجابة مثالية.\n\nهتفتح أي AI مجاني (ChatGPT أو Gemini أو Claude)، تطلب منه حاجة صغيرة من يومك، وتكتب إيه اللي حصل.\n\nلو مفيش حساب دلوقتي: اكتب الطلب اللي كنت هتبعتّه + الأداة اللي هتفتحها لما تجهّز — ده مقبول.",
      prompt:
        "في تسليمك اكتب بالترتيب:\n\n١) إيه اللي طلبته من الـ AI؟ (أو اللي كنت هتطلبه لو مفيش حساب بعد)\n٢) أنهي أداة استخدمت أو هتستخدم؟\n٣) الرد كان إيه — في سطر أو سطرين (أو «لسه هجرب»):\n٤) إيه اللي فاجأك في التجربة؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "١) طلبت من الـ AI:\n   [اكتب هنا]\n\n٢) الأداة:\n   [ChatGPT / Gemini / Claude / غيرهم]\n\n٣) الرد:\n   [اكتب هنا]\n\n٤) اللي فاجأني:\n   [اكتب هنا]",
      rubric: [
        {
          label: "جرّبت بنفسك",
          weight: 70,
          criteria: [
            "فيه طلب واضح بعتّه لـ AI وشفت رد — أو محاولة مخطّطة (الطلب + الأداة) لو مفيش حساب بعد.",
          ],
        },
        {
          label: "ملاحظة منك",
          weight: 30,
          criteria: ["كتبت حاجة بسيطة عن تجربتك — حتى لو الرد مش مظبوط."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت الخطوة الأولى",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ الـ AI أداة مساعدة — بتاخد طلب وترجعلك رد. مش سحر، ومش بديل عنك.",
        "تقدر تعمل إيه؟ تفتح أي AI مجاني وتطلب منه حاجة بسيطة من غير خوف.",
        "اللي جاي: في الدرس الجاي هتتعلم تكتب أول Prompt واضح — أول خطوة عملية بعد ما فهمت الأداة.",
      ],
    },
  },
];
