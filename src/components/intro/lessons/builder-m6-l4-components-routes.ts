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
import componentsScreenshot from "@/assets/lessons/builder-m6-l4-components-routes.jpg";

/** Builder · M6 · Lesson 04 — Components & Routes (v3: Lesson Shape pilot · optional depth) */
export const BUILDER_M6_COMPONENTS_ROUTES_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ التطبيق = قطع صغيرة قابلة لإعادة الاستخدام (Components) + صفحات لها عنوان (Routes).",
        "ليه دلوقتي؟ Builder عمق اختياري — بس لو بتبني منتج، الدرس ده يمنعك تكرر نفس الكود في كل صفحة.",
        "هتعمل إيه بعد الدرس؟ هتحدّد ٣ components و٣ صفحات لتطبيقك — قبل أي كود.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "زرار أزرق هنا وأخضر هناك — والتطبيق شكله ملخبط",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بتبني واجهة التطبيق، وكل صفحة شكلها مختلف شوية. زرار الإرسال لونه أزرق في الشات وأخضر في الإعدادات.",
        "المشكلة مش التصميم — المشكلة إنك كرّرت نفس الكود بـ copy-paste. أي تعديل بسيط = تلف على التطبيق كله.",
        "الحل: تبني القطعة مرة واحدة وتستخدمها في كل مكان.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "قطعة قابلة لإعادة الاستخدام + مسار لكل صفحة",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Component = قطعة ليجو: زرار، فقاعة رسالة، كارت محادثة. بتصممها مرة وتستخدمها ببيانات مختلفة (Props).",
        "Route = الصفحة الكاملة اللي ليها عنوان في المتصفح — زي `/chat` أو `/settings`.",
        "الصفحة نفسها component كبير بيجمع components أصغر جواه. قاعدة: كل component يعمل حاجة واحدة بس.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "تكرار الكود vs قاعدة الـ ٣ مرات",
    block: {
      kind: "comparison",
      left: {
        label: "غلط — نفس الشكل في ٣ أماكن",
        body: "تعمل شكل رسالة المستخدم في الشات، وتكرره في السجل، وتكرره في الإعدادات. لما تغيّر حجم الخط، لازم تفتكر تعدّل في الـ ٣ أماكن — ولو نسيت واحد، الواجهة هتبوظ.",
      },
      right: {
        label: "صح — Component مرة واحدة",
        body: "أول مرة: اكتبها عادي. تاني مرة: ممكن copy-paste. تالت مرة: اقف — دي إشارة إنك لازم تطلّعها في Component منفصل. تعدّل مرة واحدة ويسمّع في كل مكان.",
      },
    },
  },
  {
    icon: BookOpen,
    eyebrow: "كلمتين بس",
    title: "مصطلحين للواجهة",
    block: {
      kind: "concepts",
      items: [
        {
          term: "Component (مكوّن)",
          meaning: "قطعة واجهة بتتكتب مرة وتتستخدم كذا مرة ببيانات مختلفة.",
          example: "`ChatBubble` — مرة sender=User ومرة sender=AI، نفس القالب.",
        },
        {
          term: "Route (مسار)",
          meaning: "الصفحة الكاملة اللي ليها عنوان في المتصفح.",
          example: "`/chat` = صفحة الشات، `/history` = صفحة المحادثات القديمة.",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — Components و Routes في التطبيق",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "إزاي تقسّم واجهة التطبيق لقطع قابلة لإعادة الاستخدام وصفحات واضحة. لو معندكش وقت، كمل قراية — الدرس مكتفي لوحده.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "٣–٤ قوالب بس — والواجهة تبان معقّدة",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: componentsScreenshot,
      alt: "صفحة /curriculum — كرت Creator بداخله ModuleCard بدرسين، وكرت Automator بداخله موديولين كل واحد فيه LessonRow",
      caption:
        "أي واجهة احترافية — حتى الصفحة دي — تبان معقدة، بس في الحقيقة تكرار لـ ٣–٤ قوالب بسيطة. ModuleCard و LessonRow = Components بتتكرر ببيانات مختلفة.",
      label: "Components في الواجهة",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m6-l4-components-routes-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "محتاج تعرض كارت لكل محادثة سابقة — عنوان وملخص وتاريخ. إيه أنسب طريقة؟",
          options: [
            "Component واحد `ConversationCard` — أمرّر له بيانات كل محادثة كـ Props.",
            "Component جديد لكل محادثة: `ConversationCard1`، `ConversationCard2`...",
            "أدمج كل الكروت في component واحد كبير `HistoryPage` وخلاص.",
          ],
          correctIndex: 0,
          explanation:
            "الـ Component معمولة عشان تتكتب مرة وتستخدم ببيانات مختلفة — ده بيقلل التكرار وبيخلي التعديل في مكان واحد.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "حدّد ٣ components و٣ صفحات لتطبيقك",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "قبل أي كود — خطّط الواجهة على الورق. المهمة دي تصميم، مش برمجة.\n\n١٠–١٥ دقيقة كفاية.",
      prompt:
        "في تسليمك اكتب:\n\n١) ٣ صفحات (Routes) — لكل واحدة:\n   - المسار (مثال: `/chat`):\n   - الهدف (العميل بيعمل إيه هنا؟):\n\n٢) ٣ Components بتتكرر في الصفحات دي — لكل واحد:\n   - الاسم (مثال: `SendButton`):\n   - الـ Props اللي محتاجها (مثال: `label`, `onClick`):\n   - في أنهي صفحة/صفحات بيظهر؟\n\n٣) فيه component محتاج «ذاكرة» داخلية (state)؟ إيه ولِيه؟",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "صفحة ١:\nالمسار: [/...]\nالهدف: [...]\n\nصفحة ٢:\nالمسار: [/...]\nالهدف: [...]\n\nصفحة ٣:\nالمسار: [/...]\nالهدف: [...]\n\nComponent ١:\nالاسم: [...]\nProps: [...]\nيظهر في: [...]\n\nComponent ٢:\n...\n\nComponent ٣:\n...\n\nComponent بـ state:\n[اسم + لِيه]",
      rubric: [
        {
          label: "٣ صفحات واضحة",
          weight: 50,
          criteria: [
            "كل Route لها مسار وهدف — مش مجرد اسم.",
            "الصفحات تغطي رحلة العميل الأساسية.",
          ],
        },
        {
          label: "٣ Components بـ Props",
          weight: 50,
          criteria: [
            "كل Component ليه اسم و Props محدّدة.",
            "محدّد فين بيظهر — مش مجرد قائمة عشوائية.",
          ],
        },
      ],
    },
  },
  {
    icon: CheckCircle2,
    eyebrow: "خلّصت التقسيم",
    title: "إيه اللي عندك دلوقتي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "فهمت إيه؟ التطبيق = Components قابلة لإعادة الاستخدام + Routes لكل صفحة. تعدّل القطعة مرة — تسمّع في كل مكان.",
        "تقدر تعمل إيه؟ عندك خريطة ٣ صفحات و٣ components — جاهزة لأول prompt في Lovable.",
        "اللي جاي: Iteration Loop — إزاي تحسّن الواجهة تعديل واحد كل مرة من غير ما تبوّظ اللي شغال.",
      ],
    },
  },
];
