import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Image as ImageIcon,
  Scale,
  Rocket,
  BookOpen,
  FlaskConical,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import temperatureScreenshot from "@/assets/lessons/builder-m4-l8-parameters.jpg";

/**
 * Builder · M4 · Lesson 01 — Temperature
 * Format: Hero → Quick Win (Quiz) → Video → Concept → Deep Dive → Example → Mission → Case Study
 */
export const BUILDER_M4_TEMPERATURE_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "البداية",
    title: "زر الإبداع — وزر الدقة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "عمرك سألت الـ AI نفس السؤال مرتين، وجابلك ردين مختلفين تمامًا؟",
        "ده مش سحر. ده زرار واحد بس بتتحكم فيه: ساعات تخلّيه **يدقّق** ويرد نفس الإجابة كل مرة، وساعات تخلّيه **يبدع** ويفاجئك.",
        "في الدرس ده هتعرف امتى تستخدم كل واحد — والاسم التقني هنقوله في الآخر بس.",
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "جرّب دلوقتي",
    title: "امتى تعلّي وامتى توطّي؟",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m4-l8-parameters-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "بتكتب كود برمجي ولازم يطلع صح من أول مرة. الـ AI ينفّع له أنهي زر؟",
          options: [
            "زر الدقة",
            "زر الإبداع",
          ],
          correctIndex: 0,
          explanation:
            "صح. في الأكواد والترجمة الحرفية واستخراج البيانات، عايزين إجابة واحدة ثابتة — مش مفاجآت.",
        },
        {
          id: "apply2",
          bloom: "apply",
          question:
            "مديرك عايز 5 أفكار مجنونة لحملة إعلانات. تختار أنهي زر؟",
          options: [
            "زر الدقة",
            "زر الإبداع",
          ],
          correctIndex: 1,
          explanation:
            "بالظبط. في الـ brainstorming وتوليد أفكار جديدة، عايزين مفاجآت وتنوّع.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question:
            "بتكتب إيميل لعميل: واضح بس مش جامد. أنهي زر أنسب؟",
          options: [
            "زر الدقة",
            "ما بين الاتنين",
            "زر الإبداع",
          ],
          correctIndex: 1,
          explanation:
            "تمام. مزيج خفيف بين الدقة والإبداع — رد محترم بس مش روبوتي.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج وافهم اللعبة",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption: "إيه هي الـ Temperature، وإمتى توطّيها وإمتى تعلّيها.",
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "زر واحد بيتحرّك بين الدقة والإبداع",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل مرة الـ AI بيكتب كلمة، بيبقى قدامه كذا احتمال. الزر ده بيقوله: تاخد أكتر كلمة متوقعة (دقة)، ولا تفاجئنا وتاخد واحدة أقل توقعًا (إبداع)؟",
        "**زر الدقة:** إجابات متوقعة وثابتة. ممتاز للأكواد، استخراج البيانات، الترجمة الحرفية.",
        "**ما بين الاتنين:** مزيج خفيف. كويس للإيميلات، الشرح، الدردشة العادية.",
        "**زر الإبداع:** مفاجآت وأفكار جديدة. للـ brainstorming، عناوين، شِعر، أي حاجة محتاجة خيال.",
        "الخلاصة: عايز \"الإجابة الصح\" — دقة. عايز \"١٠ أفكار مختلفة\" — إبداع.",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "الاسم التقني (آخر حاجة)",
    title: "الزر ده اسمه Temperature",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Temperature",
          meaning:
            "رقم بتلفّه في إعدادات الـ AI: قريب من الصفر = دقة وثبات. عالي = إبداع ومفاجآت.",
          example:
            "في OpenAI الرقم بيتراوح من 0 لـ 2 تقريبًا. منخفض (~0.2) = دقة. متوسط (~0.5) = توازن. عالي (~1) = إبداع. الموديلز التانية ممكن أرقامها تختلف، بس نفس المبدأ.",
        },
      ],
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "مثال حي",
    title: "ليه كروت المنهج شكلها متكرر؟",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: temperatureScreenshot,
      alt: "خريطة المنهج — كرت موديول Introduction بأربع دروس بنفس التنسيق المتطابق",
      caption:
        "بص على كروت الدروس دي: ٤ دروس، نفس الشكل، نفس الترتيب، صفر مفاجآت. ده لأنها معمولة بـ Temperature واطية (حوالي 0.2). دي معلومات منظمة، مش قطعة فنية. لو كنا عملناها بـ Temperature عالية، كان كل كارت هيطلع بترتيب مختلف، وعناوين بأسلوب مختلف، ومكنتش هتعرف تمشي في المنهج. في المقابل، اسم المسار نفسه \"Builder\" والـ tagline بتاعه طلعوا من جلسة brainstorming بـ Temperature عالية عشان كنا محتاجين شخصية، مش مجرد نظام.",
      label: "من الموقع — صفحة /curriculum",
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "جرّب الفرق بنفسك",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "في المهمة دي هتفتح أي AI Playground (زي بتاع OpenAI أو Claude) وتشوف الفرق بعينك بين الـ Temperature الواطية والعالية.",
      prompt:
        "افتح الـ Playground واطلب منه الآتي:\n`اقترح 3 أسماء لبراند قهوة جديد.`\n\n1. مرة بـ Temperature واطية (زي 0.1)\n2. مرة بـ Temperature عالية (زي 1.2)\n\n**في تسليمك،** حط أحسن اسم من كل تجربة، وقول في سطر واحد: ليه الاسم اللي طلع من الـ Temperature العالية كان مبدع أكتر؟",
      buttonLabel: "انسخ تعليمات المهمة",
      copiedLabel: "اتنسخت!",
      rubric: [
        {
          label: "التسليم الكامل",
          weight: 100,
          criteria: [
            "حطيت اسمين: واحد من تجربة الـ temp الواطية وواحد من العالية.",
            "شرحت في سطر واحد ليه الـ temp العالية بتطلع نتايج مبدعة أكتر، واستخدمت كلمة \"إبداع\" أو \"عشوائية\".",
          ],
        },
      ],
    },
  },
  {
    icon: FlaskConical,
    eyebrow: "من كواليس Lovable",
    title: "الـ AI Assistant بتاعنا متظبط على ٠.٤",
    tone: "primary",
    block: {
      kind: "caseStudy",
      title: "الـ AI Assistant بتاعنا متظبط على ٠.٤",
      summary:
        "الـ AI Assistant اللي في المنصة هنا معمول بنفس مسار Builder اللي بتتعلمه. ظابطين الـ Temperature بتاعته على 0.4 عن قصد. الرقم ده واطي كفاية عشان إجاباته التعليمية تكون دقيقة وشبه بعض، وعالي كفاية عشان ميحسسكش إنه بيرد ردود محفوظة ومملة. لو عليناها لـ 1.2 هتلاقيه بيألّف إجابات غريبة.",
      bullets: [
        "أسئلة عن القواعد (زي «إزاي أكتب prompt؟») — Temperature واطية = إجابة موحدة ودقيقة.",
        "جرّب اسأله نفس السؤال مرتين — هتلاقي الردود قريبة جدًا من بعض بس مش نسخة طبق الأصل.",
      ],
      pathAngle: "builder",
      link: { label: "جرّب الـ AI Assistant", href: "/ai-assistant" },
    },
  },
];