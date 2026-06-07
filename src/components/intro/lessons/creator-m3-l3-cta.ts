import {
  Sparkles,
  AlertCircle,
  Lightbulb,
  Scale,
  BookOpen,
  PlayCircle,
  Image as ImageIcon,
  Rocket,
  CheckCircle2,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import ctaScreenshot from "@/assets/lessons/creator-m3-l3-cta.jpg";

export const CREATOR_M2_CTA_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "CTA الصح بيحرّك الناس بخطوة مفيدة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "لو الفيديو حلو بس مفيهوش طلب واضح، غالبا المشاهد هيقفل وخلاص.",
        "الهدف النهاردة إنك تطلب خطوة واحدة مفيدة للمشاهد وليك، مش مجرد «لايك يا جماعة».",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "المشكلة",
    title: "الطلبات الكتير بتلخبط المشاهد",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "لما تقول في نفس اللحظة تابعني واعمل لايك وكومنت وشير وسيف، المتفرج غالبا مش هيعمل ولا حاجة.",
        "الضغط من غير قيمة بيبان بسرعة، وده بيقلل الثقة في المحتوى.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "اختار CTA واحد على قد هدف الفيديو",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل فيديو ليه هدف واحد: تفاعل، حفظ ومشاركة، أو محادثة بيع.",
        "CTA القوي بيجمع ٣ حاجات: واضح، سهل التنفيذ، وليه فايدة مباشرة للمشاهد.",
        "لو هدفك بناء جمهور، اسأل سؤال حقيقي يخلي الناس ترد بخبرة.",
        "لو هدفك انتشار مفيد، اطلب حفظ أو مشاركة بشكل محدد.",
        "لو هدفك Leads، اطلب رسالة خاصة بكلمة واضحة وخطوة بعدها.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مقارنة سريعة",
    title: "رجاء عام vs خطوة مقصودة",
    block: {
      kind: "comparison",
      left: {
        label: "الأسلوب المشتت",
        body: "«لو عجبك اعمل كل حاجة» طلب عام ومش مرتبط بهدف، فالنتيجة غالبا ضعيفة.",
      },
      right: {
        label: "الأسلوب الذكي",
        body: "«ابعتلي كلمة خطة في DM عشان أبعتلك القالب» طلب واحد، واضح، ومربوط بقيمة.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "مصطلحات مهمة",
    title: "٣ مصطلحات تكفي",
    block: {
      kind: "concepts",
      items: [
        {
          term: "CTA",
          meaning: "الجملة اللي بتطلب من المشاهد يعمل خطوة بعد الفيديو.",
          example: "اكتب أكتر تحدي بيقابلك في أول أسبوع",
        },
        {
          term: "Save/Share CTA",
          meaning: "طلب حفظ أو مشاركة لما يكون المحتوى مرجعي ومفيد بعدين.",
          example: "احفظ الفيديو وابعتُه لحد هيستفيد منه",
        },
        {
          term: "Lead CTA",
          meaning: "طلب مباشر يفتح محادثة جدية مع مهتم حقيقي.",
          example: "ابعت كلمة عرض في DM عشان أبعتلك التفاصيل",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "تطبيق CTA عملي",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "شرح سريع لاختيار CTA مناسب. لو مستعجل، تقدر تتخطى الفيديو وتكمل على المهمة مباشرة.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "مثال بصري",
    title: "لقطة CTA واضح",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: ctaScreenshot,
      alt: "مثال عملي على CTA محدد داخل محتوى قصير",
      caption:
        "لاحظ إن الطلب واضح ومحدد: خطوة واحدة فقط، ومكتوبة بلغة بسيطة يفهمها أي مشاهد بسرعة.",
      label: "cta.jpg",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "اختيار CTA المناسب للموقف",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "creator-m3-l3-cta-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "لو الفيديو بيشرح طريقة مختصرة مفيدة، وأنسب هدف ليه إن الناس ترجعله بعدين وتبعته لحد محتاجه، أنهي CTA أفضل؟",
          options: [
            "لو عجبك اعمل لايك وفولو وكومنت دلوقتي",
            "احفظ الفيديو وابعتُه لشخص ممكن يستفيد منه",
            "ابعتلي DM حالا عشان أحجزلك مكالمة",
          ],
          correctIndex: 1,
          explanation:
            "ده CTA مرتبط بهدف المحتوى فعلا: حفظ ومشاركة، من غير ضغط ولا تشتيت.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمة تطبيق",
    title: "اكتب ٣ CTAs جاهزين للنشر",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "هتكتب ٣ CTA لنفس فكرة محتوى: واحد سؤال، واحد حفظ أو مشاركة، وواحد Lead في DM. الهدف إنك تفرق بينهم وتختار الصح حسب هدفك.",
      prompt:
        "املأ النموذج ده:\n\n١) فكرة الفيديو في سطر:\n٢) CTA سؤال يفتح نقاش:\n٣) CTA حفظ أو مشاركة:\n٤) CTA Lead عبر DM:\n٥) هتستخدم أنهي واحد في النسخة النهائية وليه؟",
      buttonLabel: "انسخ المهمة",
      copiedLabel: "اتنسخت",
      template:
        "فكرة الفيديو:\n[اكتب الفكرة]\n\nCTA سؤال:\n[اكتب سؤال يفتح ردود]\n\nCTA حفظ أو مشاركة:\n[اكتب طلب حفظ او مشاركة واضح]\n\nCTA Lead عبر DM:\n[اكتب الطلب + الكلمة اللي هيتبعت بها]\n\nCTA النهائي وليه:\n[اختيارك]",
      rubric: [
        {
          label: "وضوح الصياغة",
          weight: 50,
          criteria: ["كل CTA فيه فعل واضح ومفهوم."],
        },
        {
          label: "ارتباط بالهدف",
          weight: 50,
          criteria: ["الاختيار النهائي متبرر بهدف الفيديو."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "قفلة واثقة",
    title: "إنت جاهز تطلب خطوة مفيدة",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "دلوقتي عندك طريقة بسيطة: هدف واحد، CTA واحد، قيمة واضحة.",
        "نفّذ المهمة على فيديو حقيقي، وهتلاحظ فرق في التفاعل وجودة الرسائل اللي بتوصلك.",
      ],
    },
  },
];
