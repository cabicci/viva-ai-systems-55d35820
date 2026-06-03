import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen, FlaskConical } from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import tokensScreenshot from "@/assets/lessons/builder-m1-tokens.jpg";

/**
 * Builder · M1 · Lesson 02 — Tokens والتدريب
 * Format: Hero → Video → Concept → Platform Screenshot → Failure×Right → Mission
 */
export const BUILDER_M1_TOKENS_TRAINING_BLOCKS: IntroLessonContent = [
  {
    icon: Lightbulb,
    eyebrow: "السؤال المهم",
    title: "ليه الـ AI ساعات بيبطّأ أو بيكلّفك أكتر؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أوقات تطلب حاجة من الـ AI، تلاقيه خد وقت طويل قوي عشان يرد. أو لو بتستخدم الـ API بتاعه، تلاقي الفاتورة جت أغلى من اللي كنت متوقعه.",
        "السبب في الحالتين دول غالبًا حاجة واحدة بسيطة قوي، وهي الطريقة اللي الـ AI بيشوف بيها كلامك.",
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "جرّب في 30 ثانية",
    title: "شوف كلامك بيتقطّع كام حتة",
    tone: "accent",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "قبل ما نشرح أي حاجة، روح على [أداة OpenAI Tokenizer](https://platform.openai.com/tokenizer) وجرّب تكتب جملة زي دي: 'لخص المقال ده في 3 نقط'. شوف هيطلعلك كام token.",
        "دلوقتي جرب تكتب نفس الطلب بالإنجليزي: 'Summarize this article in 3 points'.",
        "لاحظت الفرق في عدد الـ tokens؟ الرقم ده هو مفتاح كل حاجة هنشرحها دلوقتي.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "التشبيه الأول",
    title: "الـ AI بيشوف كلامك زي سيخ الشاورما",
    block: {
      kind: "concepts",
      items: [
        { term: "Token", meaning: "الـ 'قطمة' اللي الـ AI بيقسم بيها كلامك عشان يفهمه. مش شرط تكون كلمة كاملة، ممكن تبقى نص كلمة أو حتى علامة ترقيم.", example: "جملة 'صباح الخير' ممكن تتقسم لـ 3 أو 4 tokens، حسب الأداة اللي بتقطّع (tokenizer)." },
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "مثال حي من شغلنا",
    title: "الـ Hero بتاع موقعنا ده",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: tokensScreenshot,
      alt: "الصفحة الرئيسية للمنصة — عنوان: تعلّم الذكاء الاصطناعي بالتنفيذ لا بالنظرية",
      caption:
        "الـ Hero ده اتبنى بـ prompt بسيط. لو كتبناه بالإنجليزي، كان هياخد tokens أقل بحوالي 40%، ويدي نفس النتيجة. توفير في الوقت والفلوس.",
      label: "من الموقع — صفحة /",
    },
  },
  {
    icon: Scale,
    eyebrow: "الغلطة والصح",
    title: "إزاي تكتب prompt يوفر عليك",
    block: {
      kind: "comparison",
      left: {
        label: "غلط: حشو وكلام كتير",
        body: "بتكتب مقدمات ملهاش لازمة وتكرر كلامك ('يا صديقي الذكاء الاصطناعي، من فضلك لو سمحت عايزك تساعدني...'). كل ده tokens على الفاضي بتزوّد التكلفة وبتشتت الـ AI.",
      },
      right: {
        label: "صح: كلام مباشر وواضح",
        body: "بتدخل في الموضوع على طول. بتدي سياق واضح وطلب محدد. tokens أقل = رد أسرع، تكلفة أقل، وتركيز أعلى من الـ AI.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اختبر فهمك",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m1-l2-tokens-training-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو بتكتب prompt طويل ومفصّل عشان تعمل إعلان، ولقيت الـ AI بطيء قوي في الرد، ده غالبًا ليه؟",
          options: [
            "البيانات اللي الـ AI اتدرب عليها كانت قليلة.",
            "الـ prompt بتاعك كان فيه tokens كتير قوي.",
            "الـ tokenizer بتاع الـ AI محتاج يتحدّث."
          ],
          correctIndex: 1,
          explanation: "كل ما الـ prompt كان فيه tokens أكتر، الـ AI بياخد وقت أطول عشان يعالجه ويرد عليك. ده بيزوّد البطء وبيأخر الرد."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "بتستخدم AI عشان يترجم 'أنا عايز كشري'. لو كلمة 'كشري' اتقسمت لـ 3 tokens، ده ممكن يأثر على الترجمة إزاي؟",
          options: [
            "الـ AI هيترجم 'كشري' بشكل أدق.",
            "الترجمة ممكن تطلع مش دقيقة أو معناها مختلف.",
            "ده مش هيأثر خالص على جودة الترجمة."
          ],
          correctIndex: 1,
          explanation: "لو كلمة أساسية اتقسمت لـ tokens كتير بطريقة غريبة، الـ AI ممكن يتلخبط وميفهمش معناها صح، وده بيأثر على دقة الترجمة."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "مديرك طلب منك تكتب prompt يلخص مقال طويل. إيه أحسن نصيحة عشان توفر في التكلفة والسرعة؟",
          options: [
            "زوّد تفاصيل زيادة عن اللزوم عشان الـ AI يفهم أكتر.",
            "اختصر على قد ما تقدر وركّز على الكلمات الأساسية عشان تقلل الـ tokens.",
            "استخدم لغة صعبة ومعقدة عشان الـ AI يبان ذكي."
          ],
          correctIndex: 1,
          explanation: "كل ما عدد الـ tokens في الطلب والرد قل، التكلفة بتقل والسرعة بتزيد، لإن الـ AI بيعالج كلام أقل."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "جرّب تقلل الـ Tokens بنفسك",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "هتكتب نفس الطلب بطريقتين، مرة طويلة ومرة مختصرة، وتقارن عدد الـ tokens عشان تحس بالفرق عمليًا.",
      prompt:
        "في تسليمك، حط الحاجات دي:\n\n١) الصياغة الطويلة للـ prompt بتاعك.\n٢) الصياغة المختصرة لنفس الـ prompt.\n٣) عدد الـ tokens لكل واحدة (استخدم [OpenAI Tokenizer](https://platform.openai.com/tokenizer)).\n٤) الفرق في عدد الـ tokens كان كام؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "صياغتين مختلفتين",
          weight: 50,
          criteria: [
            "الصياغتين بيطلبوا نفس الحاجة بس واحدة أطول من التانية بشكل واضح.",
          ],
        },
        {
          label: "حساب دقيق للـ Tokens",
          weight: 50,
          criteria: [
            "حسبت الـ tokens صح لكل صياغة وكتبت الفرق بينهم.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "عداد الـ Tokens في Lovable",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "عداد الـ Tokens في Lovable",
      summary:
        "في صفحة المساعد الشخصي، بنوريك دايمًا عدد الـ tokens لسؤالك ورد الـ AI. ده نفس المفهوم بالظبط — الـ AI مش بيقرأ كلمات، بيقرأ tokens. كل حاجة ليها تمن.",
      bullets: [
        "كل طلب بنحسب الـ tokens اللي داخلة واللي خارجة.",
        "لو المحادثة قربت تملى الذاكرة، بنمسح أقدم رسايل.",
        "التكلفة والسرعة بتتحسب بالـ token. ده قانون اللعبة.",
      ],
      pathAngle: "builder",
      link: { label: "افتح المساعد الشخصي", href: "/assistant-runtime" },
    },
  }
];