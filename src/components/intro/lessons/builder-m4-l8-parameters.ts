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
    title: "Temperature: زرار الإبداع (أو الملل)",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "عمرك سألت الـ AI نفس السؤال مرتين، وجابلك ردين مختلفين تمامًا؟",
        "ده مش سحر، ده زرار اسمه Temperature. وانت اللي بتتحكم فيه.",
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
            "لو بتعمل كود برمجي والمفروض دقته 100%، تختار Temperature عاملة إزاي عشان تضمن إنه شغال صح؟",
          options: [
            "Temperature واطية (0.0 - 0.3)",
            "Temperature متوسطة (0.4 - 0.7)",
            "Temperature عالية (0.8 - 1.2+)",
          ],
          correctIndex: 0,
          explanation:
            "صح! لما نكون محتاجين دقة وثبات، زي في الأكواد، بنقلل الـ Temperature عشان الـ AI يختار الإجابة المتوقعة وميخترعش.",
        },
        {
          id: "apply2",
          bloom: "apply",
          question:
            "مديرك عايز 5 أفكار لحملة إعلانات جديدة، ولازم تكون مجنونة ومختلفة. تختار Temperature عاملة إزاي؟",
          options: [
            "Temperature واطية (0.0 - 0.3)",
            "Temperature متوسطة (0.4 - 0.7)",
            "Temperature عالية (0.8 - 1.2+)",
          ],
          correctIndex: 2,
          explanation:
            "بالظبط! الـ Temperature العالية بتزوّد الإبداع والمفاجآت، وده مثالي لمهام زي الـ brainstorming أو توليد أفكار تسويقية جديدة.",
        },
        {
          id: "apply3",
          bloom: "apply",
          question:
            "بتكتب إيميل لعميل مهم تشرحله تفاصيل خدمة. عايز الإيميل يكون واضح، بس في نفس الوقت ميبقاش ممل أو رد آلي. تختار أنهي Temperature؟",
          options: [
            "Temperature واطية (0.0 - 0.3)",
            "Temperature متوسطة (0.4 - 0.7)",
            "Temperature عالية (0.8 - 1.2+)",
          ],
          correctIndex: 1,
          explanation:
            "تمام. الـ Temperature المتوسطة بتعمل توازن كويس بين الدقة والإبداع الخفيف، وده بيخليها مناسبة لكتابة الإيميلات والشرح.",
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
    icon: BookOpen,
    eyebrow: "مصطلح الدرس",
    title: "مصطلح واحد بس: الـ Temperature",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Temperature (زرار الإبداع)",
          meaning:
            "الزرار اللي بتلفّه عشان تقرر الـ AI يكون \"موظف ملتزم\" ولا \"فنان مبدع\".",
          example:
            "تخيل بتكتب بوست. لو الـ Temperature بصفر، كل مرة هتكتب \"صباح الخير\" هتطلع بنفس الشكل. لو عليتها، مرة ممكن يضيف emoji وردة 🌻، ومرة يضيف \"يا أهل الخير\".",
        },
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة",
    title: "من الثبات للإبداع برقم واحد",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل مرة الـ AI بيكتب كلمة، بيبقى قدامه لستة احتمالات. الـ Temperature هي اللي بتقوله: خد أول كلمة في اللستة (ثبات)، ولا خُش في اللي بعده وفاجئنا (إبداع)؟",
        "**Temperature واطية (0 – 0.3):** إجابات متوقعة، دقيقة، وممكن تكون مملة. ممتازة للمهام اللي عايزة إجابة صح واحدة: أكواد، استخراج بيانات، ترجمة حرفية.",
        "**Temperature متوسطة (0.4 – 0.7):** توازن بين الدقة والإبداع الخفيف. مناسبة لكتابة الإيميلات، الشرح، والدردشة العادية.",
        "**Temperature عالية (0.8 – 1.2+):** إبداع صافي، مفاجآت، وأفكار جديدة. استخدمها في الـ brainstorming، عناوين مقالات، شعر، أو أي حاجة محتاجة خيال.",
        "ملحوظة: الأرقام دي بتاعت OpenAI. موديلز تانية ممكن أرقامها تختلف، بس المبدأ واحد: صفر = ثبات، ورقم عالي = إبداع.",
        "الخلاصة: لو عايز \"الإجابة الصح\" — وطّيها. لو عايز \"١٠ أفكار مختلفة\" — علّيها.",
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