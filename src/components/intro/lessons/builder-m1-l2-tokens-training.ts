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

/** Builder · M1 · Lesson 02 — Tokens والتدريب (v3: Lesson Shape pilot) */
export const BUILDER_M1_TOKENS_TRAINING_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ ليه الطلب الطويل بياخد وقت أطول وتكلفة أكتر — وإزاي ده يأثر على كل Prompt هتكتبه.",
        "ليه دلوقتي؟ لما تبني ميزة AI في منتجك، كل حرف بيتحاسب عليه. الاختصار مش ترف — ده تصميم.",
        "هتعمل إيه بعد الدرس؟ هتقارن Prompt قصير وطويل وتقول إيه اللي هتشيله.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "Prompt طويل — والرد بطيء أو غالي",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كتبت مقدمة طويلة و«من فضلك» و«يا صديقي» — والرد جه بعد وقت، أو API فاتورتك زادت.",
        "مش بالضرورة الموديل «بطيء» — غالبًا إنت بعتّ كلام أكتر من اللازم.",
        "في Lovable أو Cursor: كل ما الـ context أكبر، كل ما البناء والرد أبطأ. القاعدة: اختصر، تكسب.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "المدخلات والمخرجات الطويلة = وقت وتكلفة أكتر",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الـ AI بيقسّم كلامك لقطع صغيرة (Tokens) — مش لازم تحفظ التفاصيل دلوقتي.",
        "كل Token في الداخل وكل Token في الرد بيتحاسب عليه: سرعة، تكلفة، وحد الذاكرة.",
        "لما تبني: System Prompt طويل + سياق المستخدم + تاريخ المحادثة = فاتورة ووقت. اختصر اللي مش ضروري.",
        "اختصر الطلب، حدّد المطلوب، شيل المقدمات — نفس النتيجة غالبًا بأقل تكلفة.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "نفس الطلب — صياغتين",
    block: {
      kind: "comparison",
      left: {
        label: "حشو ومقدمات",
        body: "«يا صديقي الذكاء الاصطناعي، من فضلك لو سمحت ممكن تساعدني في حاجة بسيطة وهي إنك تلخّصلي المقال ده...» — كل المقدمة دي عدّاد بيلف على الفاضي.",
      },
      right: {
        label: "مباشر",
        body: "«لخّص المقال ده في ٣ نقط.» — جملة قصيرة، رد أسرع، تكلفة أقل، ونفس النتيجة.",
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
          term: "Token (توكن)",
          meaning: "قطعة صغيرة من النص — الكلمة أو جزء منها. الـ AI بيحاسب عليها في الداخل والخارج.",
          example: "«مرحبا» ممكن تبقى توken أو اتنين حسب اللغة والموديل.",
        },
        {
          term: "Training (التدريب)",
          meaning: "مرحلة قبل ما تستخدم الموديل — بيتعلّم من كمّ هائل من النصوص. إنت مش بتدربه؛ بتستخدمه.",
          example: "ChatGPT «اتدرب» على نصوص الإنترنت — إنت بس بتكتب Prompt.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — ليه الطول بيأثر",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "Tokens والتدريب باختصار: ليه الإدخال والإخراج الطويل بيكلف أكتر. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "من الطلب للرد — كل خطوة بتحاسب",
    tone: "primary",
    block: {
      kind: "diagram",
      id: "ai-summarization-flow",
      label: "مسار المعالجة",
      caption:
        "Prompt → تقسيم Tokens → الموديل → رد. كل خطوة في المسار بتستهلك Tokens. لما تختصر الطلب، بتختصر المسار كله.",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m1-l2-tokens-training-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "لو الـ AI بطيء في الرد، إيه أول حاجة تجربها؟",
          options: [
            "تغيّر الموديل فورًا.",
            "تختصر طلبك وتشيل المقدمات الزيادة.",
            "تستنى وتعيد المحاولة من غير تغيير.",
          ],
          correctIndex: 1,
          explanation:
            "اختصار الطلب أسرع تحسين — قبل ما تغيّر أدوات أو موديلات.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "Prompt قصير vs طويل — إيه اللي هتشيل؟",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "هتاخد نفس الطلب وصياغتين: واحدة طويلة وواحدة مختصرة.\n\n١٠ دقايق كفاية.",
      prompt:
        "في تسليمك:\n\n١) الطلب الطويل (اكتبه أو انسخه):\n\n٢) الطلب المختصر (نفس المطلوب، أقل كلام):\n\n٣) إيه اللي شيلته من الطويل؟ (مقدمات، تكرار، تفاصيل زيادة):\n\n٤) لو الميزة دي في منتجك هتشتغل ١٠٠ مرة/يوم — الاختصار هيوفر إيه؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "الطلب الطويل:\n[...]\n\nالطلب المختصر:\n[...]\n\nاللي اتشال:\n- [...]\n- [...]\n\nالتوفير المتوقع:\n[وقت / تكلفة / وضوح]",
      rubric: [
        {
          label: "مقارنة حقيقية",
          weight: 60,
          criteria: [
            "الطلبين لنفس المطلوب.",
            "المختصر فعلًا أقصر.",
          ],
        },
        {
          label: "تحليل الاختصار",
          weight: 40,
          criteria: [
            "حدّدت إيه اتشال ولِيه.",
            "ربطت بالتكلفة أو السرعة في منتج.",
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
        "فهمت إيه؟ الطلب الطويل = وقت وتكلفة أكتر. الاختصار جزء من تصميم أي ميزة AI.",
        "تقدر تعمل إيه؟ تكتب Prompts مباشرة وتشيل الحشو قبل ما تبعت.",
        "اللي جاي: طبقة الـ Prompt — ليه الطلب = سلوك المنتج.",
      ],
    },
  },
];
