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
import styleControlScreenshot from "@/assets/lessons/builder-m2-l3-style-control.jpg";

/** Builder · M2 · Lesson 03 — Style Control (v3: Lesson Shape pilot) */
export const BUILDER_M2_STYLE_CONTROL_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ إزاي تخلي AI يتكلم بصوتك — مش بصوت «ChatGPT العام».",
        "ليه دلوقتي؟ المستخدم بيحس بالمنتج من نبرة المساعد والنصوص. نفس المعلومة بإحساس مختلف = منتج مختلف.",
        "هتعمل إيه بعد الدرس؟ هتكتب Voice Profile قصير لمساعد أو محتوى.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "«اكتب وصف منتج» — وطلع كليشيه",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "طلبت وصف برفان — وطلع: «اكتشف سحر الرائحة الفاخرة التي تأسر القلوب...»",
        "ده مش صوتك — ده صوت تسويقي محفوظ. كل منتج AI من غير Style Guide هيطلع نفس الكلام.",
        "Personalization = تحدّد النبرة والكلمات اللي تمثّلك — قبل ما المستخدم يشوف أول رد.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "AI بصوتك = تجربة مخصّصة",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Style = الشكل: رسمي ولا كاجوال؟ نقط ولا فقرات؟",
        "Tone = الإحساس: هادي، حماسي، مطمّن؟",
        "Persona = الشخصية الكاملة: «اتكلم كأنك خبير قهوة بيكلم مبتدئ».",
        "في Builder: Voice Profile في الـ System Prompt = كل رد يبان إنه من منتجك — مش من أي شات عام.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "طلب عايم vs طلب بنبرة",
    block: {
      kind: "comparison",
      left: {
        label: "طلب عايم",
        body: "«اكتب وصف برفان.» — نبرة تسويقية مكررة: «فاخر»، «سحر»، «أسر القلوب».",
      },
      right: {
        label: "طلب بنبرة",
        body: "«اكتب وصف برفان — نبرة شاعر هادي، جملتين، من غير ‚فاخر‘ أو ‚سحر‘، للقرّاء.» — «ريحة بتفضل في الأوضة بعد ما تقفل الكتاب.»",
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
          term: "Tone (النبرة)",
          meaning: "الإحساس اللي بيوصل من الكلام — رسمي، ودود، حماسي، هادي.",
          example: "إيميل لعميل (رسمي) ≠ دردشة مع صاحب (ودود).",
        },
        {
          term: "Voice Profile (ملف الصوت)",
          meaning: "وصف قصير لأسلوب كلام منتجك — تضيفه في System Prompt.",
          example: "«جمل قصيرة، عامية مصرية، من غير كلمات تسويقية — استبدل ‚فاخر‘ بـ ‚مريح‘.»",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — النبرة بتغيّر المنتج",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "Style و Tone — إزاي تظبطهم في أي Prompt. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "نبرة واضحة — مش صدفة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: styleControlScreenshot,
      alt: "قسم فلسفة — أربع مبادئ بجمل قصيرة.",
      caption:
        "«تنفيذ قبل التنظير»، «نظام مش فوضى» — جمل قصيرة، موقف واضح. ده نتيجة Prompt حدّد النبرة: manifesto، من غير كليشيهات. نفس المعنى بنبرة «تسويقية» كان هيبان منتج تاني.",
      label: "نص بنبرة محددة",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m2-l3-style-control-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "بتشرح أداة جديدة لمبتدئين — عايزهم يحسّوا إنك واحد منهم. إيه النبرة الأنسب؟",
          options: [
            "تقنية معقدة — مصطلحات كتير",
            "صاحب متحمس — بسيط وودود",
            "تحذيرية — تخوف من الغلط",
          ],
          correctIndex: 1,
          explanation:
            "نبرة الصاحب بتريّح المبتدئ — وده اللي تثبّته في Voice Profile المساعد.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اعمل Voice Profile",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "هتكتب ملف صوت قصير لمساعد أو محتوى منتجك.\n\n١٠–١٥ دقيقة.",
      prompt:
        "في تسليمك:\n\n١) النبرة في ٣ كلمات (مثال: ودود، مباشر، بسيط):\n\n٢) كلمة تتجنّبها + البديل (مثال: بدل «حضرتك» → «أنت»):\n\n٣) مثال قبل/بعد:\n   - رد AI عام (سطر)\n   - نفس الرد بصوت برنامجك (سطر)",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "Voice Profile:\n\nالنبرة (٣ كلمات):\n[...]\n\nتتجنّب / البديل:\n[...] → [...]\n\nقبل (AI عام):\n[...]\n\nبعد (صوتك):\n[...]",
      rubric: [
        {
          label: "ملف صوت واضح",
          weight: 60,
          criteria: [
            "النبرة محددة — مش «احترافي» بس.",
            "فيه كلمة + بديل.",
          ],
        },
        {
          label: "قبل / بعد",
          weight: 40,
          criteria: [
            "المثمان مختلفين فعلًا.",
            "التاني يطابق الـ Profile.",
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
        "فهمت إيه؟ Style و Tone = هوية المنتج في كل رد AI.",
        "تقدر تعمل إيه؟ Voice Profile جاهز تضيفه في System Prompt.",
        "اللي جاي: Context Layer — السياق الصح في الوقت الصح.",
      ],
    },
  },
];
