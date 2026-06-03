import {
  Sparkles,
  PlayCircle,
  Lightbulb,
  Rocket,
  Scale,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

/**
 * Builder · M6 · Lesson 18 — Debugging (v4 reframing)
 * Goal: cut 50%, reframe as practical playbook "لو الدنيا بازت نعمل إيه"،
 * بدون stack traces مرعبة أو deep dive تقني. حماس مش رعب.
 */
export const BUILDER_M6_DEBUGGING_BLOCKS: IntroLessonContent = [
  {
    icon: Sparkles,
    eyebrow: "بعد الدرس ده هتقدر",
    title: "تعرف تعمل إيه لو الدنيا بازت",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "Playbook بسيط من 3 خطوات. لما تطبيقك يغلط، هتعرف منين تبدأ — من غير ما تخاف ومن غير ما تعرف برمجة.",
      ],
    },
  },
  {
    icon: Lightbulb,
    eyebrow: "خد نفس",
    title: "أي تطبيق بيغلط. ده طبيعي.",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "أكبر شركات في العالم تطبيقاتها بتغلط كل يوم. الفرق بين اللي بيكمل واللي بيقف، إن اللي بيكمل عنده playbook بسيط بيتبعه لما الدنيا تبوظ.",
        "في الدرس ده هتاخد الـ playbook ده — 3 خطوات بس، تقدر تعملها وانت قاعد.",
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "الخطوة 1",
    title: "اوصف اللي بيحصل في جملة واحدة",
    tone: "accent",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "بدل ما تقول 'التطبيق بايظ'، قول بالظبط: 'لما العميل بيكتب رسالة ويدوس Send، الشاشة بتفضل بتلف ومفيش رد بيجي'.",
        "الجملة دي لوحدها بتفرق فرق هايل. هي اللي هتورّيك إيه اللي بتدور عليه، وهي اللي هتسأل بيها مساعد Lovable.",
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "الخطوة 2",
    title: "ارجع لآخر تعديل عملته",
    tone: "accent",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "في 90% من المرات، الغلطة بتيجي من آخر تعديل عملته في تطبيقك. اسأل نفسك: 'إيه آخر حاجة غيّرتها قبل ما الدنيا تبوظ؟'",
        "في Lovable، تقدر ترجع لأي نسخة قديمة من تطبيقك في ثواني. لو التعديل الأخير سبب المشكلة، رجّع، واتحرّك بهدوء.",
      ],
    },
  },
  {
    icon: PlayCircle,
    eyebrow: "الخطوة 3",
    title: "اطلب من Lovable يصلّحها",
    tone: "accent",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "اكتب لمساعد Lovable الـ 3 معلومات دي:",
        "**1. اللي بيحصل**: 'لما العميل يدوس Send، الشاشة بتلف من غير رد.'",
        "**2. اللي كان المفروض يحصل**: 'المفروض الـ AI يرد على رسالته.'",
        "**3. آخر تعديل**: 'آخر حاجة عملتها كانت إني ضفت زرار جديد.'",
        "كده. مساعد Lovable هيشخّص المشكلة ويصلّحها. مش مطلوب منك تعرف برمجة.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "الفرق بين دقيقة وساعة",
    title: "وصف عام vs وصف واضح",
    block: {
      kind: "comparison",
      left: {
        label: "غلط: 'التطبيق بايظ'",
        body:
          "هيرد عليك بـ 10 اقتراحات عامة، وانت هتفضل تلف حوالين نفسك. مفيش حد يقدر يساعد على وصف ناقص.",
      },
      right: {
        label: "صح: الـ 3 معلومات بالظبط",
        body:
          "في ثواني هيعرف المشكلة فين بالظبط، ويقترح حل مباشر تقدر تطبّقه فورًا.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "مهمتك",
    title: "اكتب playbook خاص بتطبيقك",
    tone: "primary",
    block: {
      kind: "mission",
      intro:
        "تخيّل إن تطبيقك بازت — أي حاجة. اكتب الـ 3 معلومات اللي هتبعتها لمساعد Lovable.",
      prompt:
        "اكتب 3 سطور بس:\n\n1. اللي بيحصل (سيناريو واقعي ومحدد).\n2. اللي كان المفروض يحصل.\n3. آخر حاجة غيّرتها قبل ما الدنيا تبوظ.",
      buttonLabel: "انسخ التعليمات",
      copiedLabel: "اتنسخ",
      rubric: [
        {
          label: "الـ 3 معلومات موجودة",
          weight: 70,
          criteria: [
            "وصف واضح ومحدد لاللي بيحصل (مش عام).",
            "وصف للنتيجة المفروضة.",
            "ذكر آخر تعديل.",
          ],
        },
        {
          label: "البساطة",
          weight: 30,
          criteria: [
            "كل سطر مكتوب بكلمات بسيطة من غير مصطلحات تقنية.",
          ],
        },
      ],
    },
  },
];
