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
    icon: Sparkles,
    eyebrow: "حاجتين بس",
    title: "إزاي الـ AI بيقرا كلامك",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "حاجتين بسيطة بس هتفهم إزاي الـ AI شغّال:",
        "١) بيقطع كلامك لقطع صغيرة (Token = حتة من كلمة).",
        "٢) قرا ملايين الكتب قبل كده عشان يفهمك (ده اسمه تدريب).",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "تشبيه واحد",
    title: "Token = حتة لحمة في الشاورما",
    block: {
      kind: "concepts",
      items: [
        { term: "Token", meaning: "حتة صغيرة من الكلام. ساعات كلمة كاملة، ساعات نص كلمة.", example: "كلمة 'فاتورة' ممكن تتقسم لـ ٣ tokens. عادي." },
        { term: "التدريب", meaning: "الـ AI قرا ملايين الكتب قبل ما يتكلم معاك. ده مصدر معرفته كلها.", example: "زي محاسب خبرة ١٥ سنة شاف ألوف الفواتير — بقى عارف الشكل." },
        { term: "التكلفة", meaning: "كل ما الكلام أطول، الـ tokens أكتر، والـ AI بيستهلك أكتر. ساعتها بقى.", example: "لو بعتله رواية كاملة عشان يلخصها، طبيعي ياخد وقت أطول." },
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
      caption: "إزاي الجملة بتتقطّع لـ tokens، وليه ده بيأثّر على الرد والتكلفة.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "Token = أصغر قطعة الـ AI بيفهمها",
    block: {
      kind: "paragraphs",
      paragraphs: [
        'الـ Token مش كلمة كاملة بالضرورة — ممكن يكون جزء من كلمة، أو علامة ترقيم، أو مسافة.',
        'مثلاً "اكتبلي" ممكن تتقسم لـ ٣-٥ tokens (الرقم بيختلف من tokenizer للتاني).',
        'الـ AI اتدرّب على مليارات الجمل، وكل مرة بيتوقّع: "إيه الـ token اللي بعد كده؟" — مش أكتر ومش أقل.',
        'مقارنة سريعة لنفس المعنى:\n• "Hello, how are you today?" ≈ ٧ tokens\n• "أهلًا، إزيك النهاردة؟" ≈ ١٢-١٤ token\nنفس الجملة، الضعف تقريبًا! ده لإن العربي tokenizer بيقسم الحروف لقطع أصغر.',
        'علشان كده العربي بيتكلف ضعف الإنجليزي تقريبًا في API calls، وبيكون أبطأ شوية. لو بتبني تطبيق عربي بـ AI، حُط ده في حسابك.',
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوف بنفسك",
    title: "الـ Hero بتاع موقعنا ده",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: tokensScreenshot,
      alt: "الصفحة الرئيسية للمنصة — عنوان: تعلّم الذكاء الاصطناعي بالتنفيذ لا بالنظرية",
      caption:
        'الـ Hero ده اتبنى بـ prompt صغير: "اعملي hero بعنوان \'تعلّم الذكاء الاصطناعي بالتنفيذ لا بالنظرية\' وزرار ابدأ مجاناً" — الجملة دي بتاخد عدد tokens بالعربي أكتر من نفس المعنى بالإنجليزي بحوالي مرة ونص لمرتين (الأرقام الدقيقة بتختلف حسب الـ tokenizer). نفس النتيجة، tokens أقل بالإنجليزي.',
      label: "من الموقع — صفحة /",
    },
  },
  {
    icon: Scale,
    eyebrow: "Failure × Right",
    title: "ليه ده يهمّك وانت بتكتب prompt",
    block: {
      kind: "comparison",
      left: {
        label: "FAILURE — كلام كتير من غير داعي",
        body: "بتحشّي الـ prompt مقدمات وتكرار ('من فضلك لو سمحت ممكن تساعدني...'). كل ده tokens زيادة بتكلّفك وقت وفلوس، والـ AI ممكن يتشتّت.",
      },
      right: {
        label: "RIGHT — كلام مركّز",
        body: "بتكتب اللي محتاجه على طول وبسياق واضح. tokens أقل = رد أسرع، تكلفة أقل، ومساحة أكبر للـ AI يرد بتفصيل مفيد.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "دورك دلوقتي",
    title: "اعرف جملتك بكام token",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m1-l2-tokens-training-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو بتكتب prompt لـ AI عشان يكتبلك إعلان طويل ومفصّل عن منتج جديد، ولقيت الـ AI بياخد وقت طويل جداً عشان يرجعلك الرد، ده غالباً بيكون بسبب إيه؟",
          options: [
            "الـ trained data بتاع الـ AI فقير.",
            "الـ prompt بتاعك كان فيه tokens كتير.",
            "الـ AI محتاج تحديث للـ tokenizer بتاعه."
          ],
          correctIndex: 1,
          explanation: "لما الـ prompt بيكون فيه tokens كتير، الـ AI بياخد وقت أطول عشان يعالجها وده بيزود الـ latency (البطء) وبيخلي الرد أبطأ."
        },
        {
          id: "apply2",
          bloom: "apply",
          question: "إنت بتستخدم AI عشان يترجم \"أنا عايز كشري من عربية التحرير\" من مصري لإنجليزي. لو الـ tokenizer قسم \"كشري\" لـ 3 tokens مختلفة، ده ممكن يأثر على الترجمة إزاي؟",
          options: [
            "الـ AI هيترجم \"كشري\" بشكل أدق وأفضل.",
            "الترجمة ممكن تكون أقل دقة أو مختلفة عن المعنى الأصلي.",
            "ده ملوش أي تأثير على جودة الترجمة."
          ],
          correctIndex: 1,
          explanation: "لو الكلمة اتقسمت غلط أو بطريقة غريبة لـ tokens كتير، الـ AI ممكن يصعب عليه يفهم معناها صح، وده ممكن يخلي الترجمة مش دقيقة."
        },
        {
          id: "apply3",
          bloom: "apply",
          question: "مديرك طلب منك تكتب prompt للـ AI عشان يلخص مقال طويل جداً. إيه أحسن نصيحة تديها لزمايلك عشان يوفروا في التكلفة وسرعة الرد من الـ AI؟",
          options: [
            "يزودوا تفاصيل كتير عشان الـ AI يفهم أكتر.",
            "يحاولوا يقتصروا على الكلمات الأساسية ويقللوا عدد الـ tokens قدر الإمكان.",
            "يستخدموا لغة صعبة ومعقدة عشان الـ AI يبان ذكي."
          ],
          correctIndex: 1,
          explanation: "كل ما عدد الـ tokens في الـ prompt والرد كان أقل، الـ cost (التكلفة) بتكون أقل والـ latency (السرعة) بتكون أسرع، لأن الـ AI بيعالج كلمات أقل."
        }
      ]
    },
  },
  {
    icon: Rocket,
    eyebrow: "Mission",
    title: "احسب tokens براومبت حقيقي وقارن النتايج",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "هتاخد ٣ صياغات لنفس الطلب وتحسب tokens كل واحدة، عشان تحس بفرق التكلفة لما تشتغل APIs.",
      prompt:
        "في تسليمك اكتب:\n\n١) الطلب الأصلي اللي عايز توصله للموديل (سطر واحد):\n٢) ٣ صياغات مختلفة للـ Prompt — طويلة، متوسطة، مختصرة (انسخهم كاملين):\n٣) عدد tokens لكل صياغة (استخدم tiktokenizer.vercel.app أو platform.openai.com/tokenizer):\n٤) أنهي صياغة هتستخدم في الإنتاج ولِيه؟ — مربوط بـ tradeoff (دقة × تكلفة).\n٥) لو الموديل هيرد بـ ٢٠٠ token، إيه تقديرك لتكلفة الـ Request كله (input + output)؟",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "حساب فعلي + ٣ صياغات",
          weight: 60,
          criteria: [
            "الـ ٣ صياغات مختلفة فعلاً (مش نفس النص بكلمتين).",
            "عداد tokens موجود لكل صياغة من أداة موثوقة.",
          ],
        },
        {
          label: "قرار مبني على tradeoff",
          weight: 40,
          criteria: [
            "اخترت صياغة واحدة بسبب مرتبط بدقة × تكلفة.",
            "حسبت الـ total tokens (input + output) مش بس الـ input.",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "جزء من المنصة",
    title: "Token counter في /assistant-runtime",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "Token counter في /assistant-runtime",
      summary:
        "الجزء ده من المنصة اتبنى بمسار Builder — نفس اللي بتتعلمه. في صفحة /assistant-runtime بنعرضلك تفاصيل كل rundown للمساعد، فيها عدد الـ tokens الفعلي للسؤال والرد. ده نفس المفهوم اللي اتعلّمته — الـ AI مش بيشوف كلمات، بيشوف tokens.",
      bullets: [
        "كل request بنحسب tokens_in و tokens_out قبل ما نعرضله الجواب.",
        "لو الـ context قرب من الـ limit، بنقصّ أقدم رسالة قبل ما نبعت.",
        "Token = حوالي ٤ characters عربي/إنجليزي — وده اللي بيحدد تكلفة كل سؤال.",
      ],
      pathAngle: "builder",
      link: { label: "افتح /assistant-runtime", href: "/assistant-runtime" },
    },
  }
];
