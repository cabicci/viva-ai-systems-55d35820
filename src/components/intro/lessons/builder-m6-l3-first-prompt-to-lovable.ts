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
import firstPromptImg from "@/assets/lessons/unique/builder-m6-l3-first-prompt-to-lovable.jpg";

/** Builder · M6 · Lesson 03 — First Prompt to Lovable (v3: Lesson Shape pilot) */
export const BUILDER_M6_FIRST_PROMPT_TO_LOVABLE_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بداية الدرس",
    title: "هتفهم إيه النهاردة؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "هتفهم إيه؟ أول prompt محتاج: goal + users + pages + style + constraints.",
        "ليه دلوقتي؟ عندك Wireframe — دلوقتي حوّله لطلب Lovable يفهمك.",
        "هتعمل إيه بعد الدرس؟ هتكتب أول prompt كامل — جاهز للنسخ في Lovable.",
      ],
    },
  },
  {
    icon: AlertCircle,
    eyebrow: "موقف مألوف",
    title: "«اعملي واجهة» — ويطلع مش اللي في بالك",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كتبت «ابنيلي واجهة AI» — طلع ألوان فاقعة وأقسام مش عايزها.",
        "AI بيبني اللي بتكتبه — مش اللي بتتمناه. ٣ كلمات = تخمين كامل.",
        "الحل: Prompt Spec — وصفة فيها ٥ أجزاء واضحة.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "الفكرة الأساسية",
    title: "أول prompt = goal + users + pages + style + constraints",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Goal: الهدف — إيه نوع الواجهة ولإيه؟",
        "Users: لمين — مين هيستخدمها؟",
        "Pages: الأقسام — اذكر Wireframe بالاسم.",
        "Style: الستايل — ألوان، نبرة، mood.",
        "Constraints: الحدود — إيه اللي مش عايزه في النسخة الأولى.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "مثال من الحياة",
    title: "«ابني واجهة» vs Prompt Spec",
    block: {
      kind: "comparison",
      left: {
        label: "٣ كلمات",
        body: "«ابنيلي واجهة كافيه» — AI يخمّن كل حاجة. ٦ تعديلات. لسه مش مظبوط.",
      },
      right: {
        label: "Prompt Spec",
        body: "Goal: landing page لكافيه + AI باريستا. Users: زباين ٢٠–٣٥. Pages: hero + منيو ٦ مشروبات + تواصل. Style: دافي، بنّي وبيج. Constraints: من غير login.",
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
          term: "Prompt Spec (مواصفات الواجهة)",
          meaning: "الوصفة الكاملة — goal, users, pages, style, constraints.",
          example: "زي مواصفات بدلة للترزي: مقاس، لون، عدد زراير.",
        },
        {
          term: "Scope (النطاق)",
          meaning: "إيه اللي في النسخة دي — وإيه اللي بعدين.",
          example: "«صفحة واحدة بس — Home» — مش «موقع كامل».",
        },
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "فيديو الدرس",
    title: "اتفرّج — prompt غامض vs واضح",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "مثال حي — الفرق في الناتج لما Prompt Spec كامل. لو معندكش وقت، كمل قراية.",
    },
  },
  {
    icon: ImageIcon,
    eyebrow: "شوفها ببساطة",
    title: "Prompt → Preview",
    tone: "primary",
    block: {
      kind: "screenshot",
      src: firstPromptImg,
      alt: "Lovable — prompt على الشمال، preview على اليمين.",
      caption:
        "الـ prompt مش «اعملي واجهة» — فيه goal، نشاط، أقسام بالاسم، وستايل. النتيجة أقرب من أول مرة.",
      label: "Prompt Spec",
    },
  },
  {
    icon: Rocket,
    eyebrow: "تأكيد سريع",
    title: "سؤال واحد — مش امتحان",
    tone: "accent",
    block: {
      kind: "quiz",
      lessonId: "builder-m6-l3-first-prompt-to-lovable-apply",
      items: [
        {
          id: "apply1",
          bloom: "apply",
          question:
            "عايز Lovable يبني Home Page بس — من غير login. إيه أحسن جزء في Prompt Spec؟",
          options: [
            "Constraints: صفحة واحدة (Home) — من غير login في النسخة الأولى.",
            "«اعملي موقع كامل».",
            "Style: ألوان حلوة.",
          ],
          correctIndex: 0,
          explanation:
            "Constraints + Scope بيحدّدوا الحدود — AI مش يخمّن features زيادة.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اكتب أول prompt لـ Lovable",
    tone: "accent",
    block: {
      kind: "mission",
      intro:
        "المهمة دي كتابة — مش تنفيذ. استخدم Wireframe من الدرس اللي فات.\n\n١٠–١٥ دقيقة.",
      prompt:
        "في تسليمك اكتب Prompt Spec كامل:\n\n**Goal:** [نوع الواجهة + إيه اللي بتعمله]\n**Users:** [مين هيستخدمها]\n**Pages:** [اذكر أقسام Wireframe — hero، أقسام، إلخ]\n**Style:** [لونين + mood — مثلاً: modern، أزرق فاتح]\n**Constraints:** [إيه اللي مش في النسخة الأولى — مثلاً: من غير دفع]\n\n(جاهز للنسخ في Lovable)",
      buttonLabel: "انسخ خطوات المهمة",
      copiedLabel: "اتنسخت ✓",
      template:
        "Goal:\n[ ]\n\nUsers:\n[ ]\n\nPages:\n- [قسم ١]: [ ]\n- [قسم ٢]: [ ]\n\nStyle:\n[لونين + mood]\n\nConstraints:\n- [ ]\n- [ ]",
      rubric: [
        {
          label: "الخمسة موجودين",
          weight: 60,
          criteria: [
            "Goal, Users, Pages, Style, Constraints — كلهم مكتوبين.",
            "Pages مربوطة بـ Wireframe — مش عامة.",
          ],
        },
        {
          label: "جاهز للنسخ",
          weight: 40,
          criteria: [
            "Style فيه لونين على الأقل.",
            "Constraints تحدّد إيه «مش دلوقتي».",
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
        "فهمت إيه؟ أول prompt = ٥ أجزاء. AI يبني اللي بتكتبه — مش اللي بتتمناه.",
        "تقدر تعمل إيه؟ عندك Prompt Spec جاهز — انسخه في Lovable وابدأ.",
        "اللي جاي: Components & Routes — إزاي الصفحات تتربط ببعض.",
      ],
    },
  },
];
