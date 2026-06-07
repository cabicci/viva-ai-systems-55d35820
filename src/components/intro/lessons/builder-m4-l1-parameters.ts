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
import temperatureScreenshot from "@/assets/lessons/builder-m4-l1-parameters.jpg";

/** Builder · M4 · Lesson 01 — Temperature (v3: Lesson Shape pilot) */
export const BUILDER_M4_TEMPERATURE_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ Temperature = توازن بين ثبات الردود وإبداعها — وإمتى تظبطها في كل ميزة AI.",
        "ليه دلوقتي؟ نفس السؤال مرتين بردّين مختلفين — مش دايمًا «غلط»؛ ممكن إعداداتك.",
        "هتعمل إيه بعد الدرس؟ هتختار Temperature لـ ٣ حالات: حقائق، محتوى، شات.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "نفس السؤال — ردّين مختلفين",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "سألت AI نفس السؤال مرتين — وطلع ردّين مختلفين. تحس إنه «مش موثوق».",
        "أحيانًا عايز تنوّع (أفكار إعلانات). وأحيانًا عايز نفس الإجابة (كود، أرقام).",
        "في منتجك: ميزة استخراج بيانات = ثبات. ميزة brainstorming = إبداع. لازم تفصل.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "Temperature = ثبات vs إبداع",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل كلمة الـ AI بيختارها من احتمالات. Temperature بتقول: خُد الأكثر توقّعًا (ثبات) ولا جرّأة (إبداع)؟",
        "منخفض (~٠.٢): نفس السؤال ≈ نفس الرد. للحقائق، الكود، استخراج JSON.",
        "متوسط (~٠.٥): توازن — إيميلات، شرح، شات عام.",
        "عالي (~١): تنوّع وأفكار جديدة — عناوين، حملات، محتوى إبداعي.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "دقة vs brainstorming",
    block: {
      kind: "comparison",
      left: {
        label: "Temperature واطية",
        body: "«استخرج السعر من النص.» — عايز نفس النتيجة كل مرة. واطي = موثوق للمنتج.",
      },
      right: {
        label: "Temperature عالية",
        body: "«اقترح ٥ slogans لبراند قهوة.» — عايز مفاجآت. عالي = أفكار مختلفة كل مرة.",
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
          term: "Temperature",
          meaning: "إعداد رقمي: قريب من ٠ = ثبات. عالي = إبداع وتنوّع.",
          example: "OpenAI: ~٠.٢ حقائق، ~٠.٥ توازن، ~١ إبداع.",
        },
        {
          term: "Parameters (معاملات)",
          meaning: "إعدادات API زي Temperature — بتظبط سلوك الموديل من برّه الـ Prompt.",
          example: "ميزة «تلخيص» temp واطية — ميزة «أفكار» temp عالية.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — امتى تعلّي وامتى توطّي",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "Temperature — ثبات vs إبداع في تصميم المنتج. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "نفس الشكل — لأن الثبات مطلوب",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: temperatureScreenshot,
      alt: "خريطة منهج — كروت دروس بنفس التنسيق.",
      caption:
        "كروت الدروس نفس الشكل — صفر مفاجآت. ده مناسب لمحتوى منظم (temp واطية). لو كانت temp عالية، كل كارت كان هيطلع بترتيب وأسلوب مختلف — صعب تمشي في المنهج.",
      label: "تنسيق ثابت = temp واطية",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m4-l1-parameters-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "بتكتب كود لازم يطلع صح من أول مرة. إيه الأنسب؟",
          options: [
            "Temperature واطية — ثبات ودقة.",
            "Temperature عالية — أفكار جديدة.",
            "Temperature متوسطة — للدردشة بس.",
          ],
          correctIndex: 0,
          explanation:
            "الكود والحقائق = temp واطية. الإبداع للـ brainstorming بس.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "Temperature لـ ٣ ميزات",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "هتظبط Temperature لثلاث حالات في منتج تتخيله.\n\n١٠–١٥ دقيقة.",
      prompt:
        "في تسليمك:\n\n١) ميزة حقائق (استخراج بيانات، أسئلة FAQ، ترجمة حرفية):\n   - Temperature: [واطية / متوسطة / عالية]\n   - لِيه:\n\n٢) ميزة محتوى (بوستات، عناوين، أفكار):\n   - Temperature: [...]\n   - لِيه:\n\n٣) ميزة شات (مساعد يتكلم مع المستخدم):\n   - Temperature: [...]\n   - لِيه:",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "حقائق:\nTemp: [...]\nلِيه: [...]\n\nمحتوى:\nTemp: [...]\nلِيه: [...]\n\nشات:\nTemp: [...]\nلِيه: [...]",
      rubric: [
        {
          label: "٣ اختيارات منطقية",
          weight: 60,
          criteria: [
            "حقائق → واطية.",
            "محتوى → أعلى من الحقائق.",
          ],
        },
        {
          label: "سبب لكل واحد",
          weight: 40,
          criteria: [
            "كل «لِيه» مربوط بثبات أو تنوّع.",
            "شات في نطاق معقول (مش extreme غلط).",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت البداية",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ Temperature = ثبات vs إبداع — ميزة ميزة مش رقم واحد للكل.",
        "تقدر تعمل إيه؟ تختار إعداد لكل نوع: حقائق، محتوى، شات.",
        "اللي جاي: Transition — من Prompting لبناء المنتج.",
      ],
    },
  },
];
