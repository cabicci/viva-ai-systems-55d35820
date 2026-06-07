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
import promptClarityScreenshot from "@/assets/lessons/builder-m2-l1-prompt-layer.jpg";

/** Builder · M2 · Lesson 01 — طبقة الـ Prompt (v3: Lesson Shape pilot) */
export const BUILDER_M2_PROMPT_LAYER_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ الـ Prompt مش «سؤال واحد» — ده الطبقة اللي بتحدّد سلوك أي ميزة AI في منتجك.",
        "ليه دلوقتي؟ في Lovable و Cursor، أول Prompt للمساعد = أول تجربة للمستخدم. الغموض هنا = منتج ضعيف.",
        "هتعمل إيه بعد الدرس؟ هتكتب System Instruction لمساعد بسيط.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "«اعمل خطة» — والرد أي كلام",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "طلبت من AI حاجة عامة — وطلع رد عام مفيهوش فايدة.",
        "زي ما تسأل صاحبك «ناكل إيه؟» فيرد «أي حاجة». المشكلة مش الذكاء — المشكلة نقص التفاصيل.",
        "لما تبني مساعد في منتجك، الـ System Prompt هو «شخصية وقواعد المساعد» — لو ناقص، كل مستخدم هيشوف نفس الردود الفارغة.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "الـ Prompt = سلوك المنتج",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Prompt = كل اللي بتكتبه للـ AI: System Instruction (مين هو وإزاي يرد) + طلب المستخدم.",
        "في Builder: الـ System Prompt ثابت خلف الكواليس — المستخدم بيشوف بس مربع السؤال. بس أنت اللي بتحدّد السلوك.",
        "كل ما الطلب أوضح (منتج، جمهور، مدة، شكل الرد)، كل ما المخرجات قابلة للاستخدام في منتج حقيقي.",
        "مش محتاج كود — محتاج تفكير منتج: المساعد ده بيخدم مين؟ وإيه اللي يردّه وإيه اللي يرفضه؟",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "طلب غامض vs طلب واضح",
    block: {
      kind: "comparison",
      left: {
        label: "طلب غامض",
        body: "«اعمل خطة تسويق.» — الـ AI مش عارف لإيه ولا لمين. النتيجة كلام عام منسوخ.",
      },
      right: {
        label: "طلب واضح",
        body: "«اعمل خطة تسويق لمطعم بيتزا جديد في القاهرة — أسبوع واحد، جمهور شباب ١٨–٢٥.» — رد عملي تقدر تنفّذه.",
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
          term: "Prompt (الأمر)",
          meaning: "الطلب اللي بتكتبه للـ AI — كل ما كان أوضح، كل ما الرد أدق.",
          example: "«لخّص في ٣ نقط» أحسن من «لخّص.»",
        },
        {
          term: "System Instruction (تعليمات النظام)",
          meaning: "النص الثابت اللي بيحدّد دور المساعد قبل أي سؤال من المستخدم.",
          example: "«إنت مساعد دعم لمحل عصير — رد بالعامية المصرية، جمل قصيرة.»",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — وضوح الطلب بيغيّر كل حاجة",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي الـ Prompt layer بتحدّد سلوك المساعد في أي منتج. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "صفحة منظمة — نتيجة Prompt واضح",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: promptClarityScreenshot,
      alt: "صفحة خريطة منهج — هيدر، شريط تقدّم، ومراحل مرقّمة.",
      caption:
        "الصفحة دي اتبنت بـ Prompt فيه: الهيكل، الترتيب، وشكل كل مرحلة. لو الطلب كان «اعمل صفحة منهج» بس، كان هيطلع لستة عادية. الفرق = تفاصيل في الـ Prompt.",
      label: "صفحة منهج منظمة",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m2-l1-prompt-layer-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "عايز AI يعمل بوستات لمحل حلويات «سكر زيادة» في القاهرة — كنافة بالمانجة — لمدة أسبوع. إيه أحسن Prompt؟",
          options: [
            "اكتب بوستات سوشيال ميديا",
            "اقترح أفكار بوستات لمدة أسبوع لمحل «سكر زيادة» في القاهرة — كنافة بالمانجة",
            "اعمل خطة تسويق لمحل حلويات",
          ],
          correctIndex: 1,
          explanation:
            "التفاصيل (الاسم، المنتج، المكان، المدة) = رد قابل للاستخدام في منتج حقيقي.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اكتب System Instruction لمساعد",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "هتكتب تعليمات نظام لمساعد AI بسيط — مش محادثة، بل «قواعد الشغل».\n\n١٠–١٥ دقيقة.",
      prompt:
        "في تسليمك اكتب System Instruction لمساعد واحد من دول (اختار واحد):\n\n- مساعد دعم لمتجر أونلاين\n- مساعد يشرح دروس لمبتدئين\n- مساعد يقترح أفكار محتوى\n\nلازم يتضمّن:\n\n١) مين المساعد (دور واحد):\n\n٢) إزاي يتكلم (لغة، طول، نبرة):\n\n٣) إيه اللي يردّ عليه وإيه اللي يرفضه:\n\n٤) مثال سؤال مستخدم + رد متوقّع في سطرين",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "System Instruction:\n\nالدور:\n[...]\n\nأسلوب الكلام:\n[...]\n\nيرد على:\n- [...]\n\nيرفض:\n- [...]\n\nمثال:\nس: [...]\nج: [...]",
      rubric: [
        {
          label: "تعليمات واضحة",
          weight: 60,
          criteria: [
            "الدور محدّد — مش «مساعد عام».",
            "فيه قواعد رد ورفض.",
          ],
        },
        {
          label: "مثال عملي",
          weight: 40,
          criteria: [
            "المثال يطابق القواعد.",
            "الرد قابل للتخيل في منتج.",
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
        "فهمت إيه؟ الـ Prompt = سلوك المنتج. System Instruction تحدّد المساعد قبل أول سؤال.",
        "تقدر تعمل إيه؟ تكتب تعليمات نظام واضحة لأي ميزة AI — من غير كود.",
        "اللي جاي: Instructions vs Examples — ليه المثال أقوى من الوصف.",
      ],
    },
  },
];
