import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Scale,
  Rocket,
  BrainCircuit,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";
import databaseScreenshot from "@/assets/lessons/builder-m5-l4-database-intro.jpg";

/**
 * Builder · M5 · Lesson 12 — Database Intro (v4 reframing)
 * Opener: "لو العميل رجع بعد أسبوع، إزاي التطبيق يفتكره؟"
 * مسار التفكير: Excel sheet → customer list → المخزن الذكي.
 * ممنوع في الدرس ده: SQL، Schema، Relations (هتيجي في m7).
 */
export const BUILDER_M5_DATABASE_INTRO_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بعد الدرس ده هتقدر",
    title: "تخلّي تطبيقك يفتكر كل عميل ومحادثاته",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "لو العميل رجع بعد أسبوع، إزاي التطبيق هيفتكره؟ إزاي هيلاقي محادثته السابقة مع الـ AI؟ ده اللي هنحلّه دلوقتي.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "ابدأ من حاجة عارفها",
    title: "كل شركة عندها 'شيت Excel' للعملاء",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أي شركة بتشتغل صح عندها list فيها العملاء — اسم، تليفون، آخر طلب، ملاحظات. ممكن تكون على Excel أو على CRM زي HubSpot.",
        "اللي بيخلّي الشركة 'تفتكر' العميل هو الـ list دي. لو اتمسحت، الشركة بتنسى كل حاجة.",
        "تطبيقك الذكي محتاج نفس الفكرة بالظبط — مكان دايم بيحفظ فيه كل عميل وكل محادثة، عشان لما يرجع بكرة يلاقي كل حاجة في مكانها.",
      ],
    },
  },
  {
    icon: BrainCircuit,
    eyebrow: "الاسم التقني (آخر حاجة)",
    title: "الـ list الدايمة دي اسمها 'المخزن الذكي'",
    block: {
      kind: "concepts",
      items: [
        {
          term: "المخزن الذكي (Database)",
          meaning:
            "الأرشيف الدايم اللي بيشيل كل بيانات تطبيقك — العملاء، محادثاتهم مع الـ AI، اشتراكاتهم. أي حاجة لازم تفضل موجودة لما العميل يرجع بكرة، مكانها هنا.",
          example:
            "زي شيت Excel ضخم بس على سيرفر، آمن، وبيقدر يشيل ملايين الصفوف من غير ما يبطّأ.",
        },
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "مثال حي من المنصة",
    title: "تقدمك في المنصة عايش في مخزن ذكي",
    tone: "accent",
    block: {
      kind: "screenshot",
      src: databaseScreenshot,
      alt: "صفحة الداش بورد في Lovable بتعرض التقدم في الدروس",
      caption:
        "كل علامة ✓ شايفها هنا مش متخزنة على جهازك — لو فتحت من الموبايل هتلاقي نفس الأرقام. ده لإنها عايشة في المخزن الذكي. تطبيقك هيشتغل بنفس الطريقة بالظبط.",
      label: "من حسابك في Lovable",
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "اتفرج وافهم أكتر",
    title: "ليه المخزن الذكي أحسن من ملف Excel عادي؟",
    tone: "accent",
    block: {
      kind: "lessonVideo",
      caption:
        "Excel بيقف عند آلاف الصفوف. المخزن الذكي بيشيل ملايين بدون ما يبطّأ، وبيخلّي ألف عميل يدخلوا في نفس الوقت من غير ما يحصل تضارب.",
    },
  },
  {
    icon: Scale,
    eyebrow: "غلطة لازم تتجنبها",
    title: "إيه اللي يروح فين؟",
    block: {
      kind: "comparison",
      left: {
        label: "غلط: تخزّن في متصفح العميل",
        body:
          "محادثات الـ AI، بيانات العميل، اشتراكاته — لو حطيتها في متصفحه بس، أول ما يفتح من جهاز تاني هيلاقي كل حاجة فاضية.",
      },
      right: {
        label: "صح: في المخزن الذكي",
        body:
          "أي بيانات لازم تفضل موجودة بكرة، أو محتاج العميل يلاقيها من أي جهاز، مكانها المخزن الذكي. وبس.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اكتب قائمة الـ list بتاع تطبيقك",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "من غير أي مصطلحات تقنية — فكّر زي صاحب شركة بيرتّب Excel sheet. إيه المعلومات اللي تطبيقك محتاج يفتكرها عن كل عميل عشان لما يرجع يلاقي حاجاته؟",
      prompt:
        "اكتب 3-4 معلومات تطبيقك محتاج يحفظها عن كل عميل. مثال: اسم العميل، آخر سؤال سأله للـ AI، تاريخ آخر زيارة...\n\nمتفكرش في SQL أو جداول — فكّر في Excel sheet بس.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخت",
      rubric: [
        {
          label: "فهم الغرض",
          weight: 60,
          criteria: [
            "المعلومات اللي اخترتها فعلاً بتساعد التطبيق 'يفتكر' العميل.",
            "كل معلومة ليها معنى واضح ومرتبط بالـ AI app.",
          ],
        },
        {
          label: "البساطة",
          weight: 40,
          criteria: [
            "مفيش مصطلحات تقنية معقدة.",
            "الـ list محصورة في 3-4 معلومات أساسية بس.",
          ],
        },
      ],
    },
  },
];
