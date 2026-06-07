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
import aiVsSoftwareScreenshot from "@/assets/lessons/intro-m1-l5-ai-vs-software.jpg";

/**
 * Intro · Lesson 05 — AI مش زي البرامج العادية (v3: Lesson Shape pilot)
 */
export const AI_VS_SOFTWARE_CONTENT: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ مش كل مهمة محتاجة AI — والبرنامج العادي مش أضعف، هو بس مختلف.",
        "ليه دلوقتي؟ في الدرس اللي فات عرفت إمتى تثق في الـ AI وإمتى تراجع. النهاردة هتعرف إمتى تختار AI أصلًا.",
        "هتعمل إيه بعد الدرس؟ هتختار الأداة المناسبة لـ ٣ مهام من حياتك — AI، برنامج، أو الاتنين مع بعض.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "بتستخدم AI في كل حاجة — وبتتفاجئ لما النتيجة تطلع غريبة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الآلة الحاسبة تحسب ٢+٢ = ٤ كل مرة. Excel يجمع نفس الأرقام بنفس النتيجة. ده Software (برنامج) بقواعد ثابتة.",
        "الـ AI بيكتب ويفكّر باللغة — الرد ممكن يختلف شوية كل مرة حسب سؤالك.",
        "لما تخلط بينهم، هتسأل في المكان الغلط وتفتكر إن «AI مش شغال». الحل: تختار الأداة الصح للمهمة.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "برنامج ثابت للحساب — AI مرن للكلام",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Software ثابت: آلة حاسبة، Excel، CRM، تقويم، نظام فواتير — نفس المدخل يطلع نفس النتيجة. ممتاز لما العملية واضحة ومتكررة.",
        "AI مرن: يساعدك تكتب، تلخّص، تفكّر، تقارن، تشرح — ممتاز لما المهمة محتاجة لغة أو حكم أو تنويع.",
        "أحسن نتيجة غالبًا من الاتنين: Excel يحسب الأرقام، والـ AI يكتب ملخص بسيط للإدارة. التقويم يحفظ المواعيد، والـ AI يصيغ رسالة تذكير.",
        "مش محتاج تفهم برمجة. محتاج بس تسأل: المهمة دي محتاجة دقة ثابتة ولا صياغة وتفكير؟",
      ],
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "فرق بسيط بين أداتين",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Software (برنامج)",
          meaning: "أداة بقواعد ثابتة — نفس المدخل يطلع نفس النتيجة.",
          example: "Excel يجمع الأرقام. التقويم يحفظ الموعد.",
        },
        {
          term: "AI (ذكاء اصطناعي)",
          meaning: "مساعد باللغة — بيفهم سؤالك ويطلع رد مناسب للسياق.",
          example: "يكتبلك ٣ صيغ لإيميل أو يلخّص ملاحظاتك.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — برنامج ثابت vs AI مرن",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      url: "/lessons/intro/intro-m1-l5-ai-vs-software.mp4",
      durationLabel: "0:36",
      caption:
        "الفرق اللي يحدد تختار أنهي أداة. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "اختيار الأداة أهم من قوة الأداة",
    block: {
      kind: "comparison",
      left: {
        label: "AI لكل حاجة",
        body: "تخليه يحسب فاتورة أو يطلع رقم دقيق من الذاكرة — ممكن تلاقي فرق أو خطأ.",
      },
      right: {
        label: "كل أداة في مكانها",
        body: "Excel أو الآلة للحساب. Google للمصادر. AI للشرح والصياغة والترتيب.",
      },
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "مهمتين — أداتين مختلفتين",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: aiVsSoftwareScreenshot,
      alt: "مقارنة بصرية بين برنامج بقواعد ثابتة وAI يرد بمرونة",
      caption:
        "تخيّل عمود للبرامج الثابتة (حساب، جدولة، أرشفة) وعمود للـ AI (كتابة، تلخيص، أفكار). كثير من الشغل الحقيقي بيستخدم الاتنين — مش واحد بس.",
      label: "متى تستخدم إيه",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "intro-m1-l5-ai-vs-software-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question: "عندك ٢٠٠ رقم مبيعات وعايز الإجمالي بالظبط. أحسن أداة؟",
          options: [
            "Excel أو آلة حاسبة",
            "AI بس من غير شيت",
            "مولّد صور",
          ],
          correctIndex: 0,
          explanation: "الحساب الدقيق محتاج برنامج ثابت. AI ييجي بعدها للملخص لو محتاج.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اختار الأداة المناسبة لـ ٣ مهام",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "اختار ٣ مهام من حياتك أو شغلك — صغيرة وحقيقية — وحدد لكل واحدة:\n\n• AI\n• Software (برنامج)\n• الاتنين مع بعض\n\nمش مطلوب تجربة معقدة. المطلوب قرار واضح ليه اخترت الأداة دي.",
      prompt:
        "في تسليمك اكتب لكل مهمة:\n\n١) المهمة (جملة):\n٢) اخترت: AI / Software / الاتنين\n٣) ليه (سطر أو سطرين):\n\nكرر لـ ٣ مهام.",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "مهمة ١:\n- المهمة: [اكتب هنا]\n- الأداة: [AI / Software / الاتنين]\n- ليه: [اكتب هنا]\n\nمهمة ٢:\n- المهمة: [اكتب هنا]\n- الأداة: [اكتب هنا]\n- ليه: [اكتب هنا]\n\nمهمة ٣:\n- المهمة: [اكتب هنا]\n- الأداة: [اكتب هنا]\n- ليه: [اكتب هنا]",
      rubric: [
        {
          label: "اختيار منطقي",
          weight: 70,
          criteria: ["٣ مهام مع أداة مناسبة لكل واحدة — حتى لو بسيط."],
        },
        {
          label: "مهام حقيقية",
          weight: 30,
          criteria: ["المهام من حياتك أو شغلك — مش أمثلة عامة فاضية."],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت الخطوة الخامسة",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ البرنامج للدقة والتكرار. الـ AI للغة والأفكار. كثير من الشغل محتاج الاتنين.",
        "تقدر تعمل إيه؟ تبص لأي مهمة وتقول: دي محتاجة حساب ثابت ولا كلام ولا الاتنين؟",
        "اللي جاي: في الدرس الجاي هنتكلم عن الخوف والتأخر — وإزاي تكمل تتعلم من غير ما تحس إنك متأخر أو «مش تقني».",
      ],
    },
  },
];
