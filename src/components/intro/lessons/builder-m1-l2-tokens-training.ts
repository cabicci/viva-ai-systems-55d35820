import {
  Lightbulb,
  Scale,
  Rocket,
} from "lucide-react";
import type { IntroLessonContent } from "../intro-lesson-types";

/**
 * Builder · M1 · Lesson 02 — Tokens والتدريب  (v5 — مخفّف بعد سيميوليشن v11)
 *
 * قرار v11: الدرس ده كان بيعمل drop-cliff (7 quit + confusion 5 + bore 5).
 * الحل: نختصره جدًا لفكرة واحدة فقط — "الكلام الطويل بيكلّفك أكتر ووقت أطول".
 * مفيش tokenizer، مفيش tokens بالعربي vs الإنجليزي، مفيش case study تقني.
 * المصطلح "Token" بيتقال في سطر واحد بس، والباقي يستنّى لما حد يحتاجه فعلًا في درس prompting.
 */
export const BUILDER_M1_TOKENS_TRAINING_BLOCKS: IntroLessonContent = [
  {
    icon: Lightbulb,
    eyebrow: "فكرة الدرس",
    title: "ليه الـ AI ساعات بطيء أو غالي؟",
    tone: "primary",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "كل ما الرسالة اللي بتبعتها للـ AI أطول، الرد بياخد وقت أطول، والتكلفة بتزيد. زي عدّاد التاكسي — كل ما المشوار يطوّل، الفاتورة تكبر.",
        "ده اللي بيخلّي طلب قصير ومباشر يطلع أسرع وأرخص بكتير من طلب مليان حشو ومقدمات. مش لازم تفهم تفاصيل تقنية دلوقتي — كفاية تعرف القاعدة دي وتطبقها.",
      ],
    },
  },
  {
    icon: Scale,
    eyebrow: "الفرق العملي",
    title: "نفس الطلب — صياغتين",
    block: {
      kind: "comparison",
      left: {
        label: "غلط: حشو ومقدمات",
        body:
          "'يا صديقي الذكاء الاصطناعي، من فضلك لو سمحت ممكن تساعدني في حاجة بسيطة وهي إنك تلخصلي المقال ده...' — كل المقدمة دي عداد بيلف على الفاضي.",
      },
      right: {
        label: "صح: مباشر",
        body:
          "'لخّص المقال ده في 3 نقط.' — جملة قصيرة، رد أسرع، تكلفة أقل، ونفس النتيجة.",
      },
    },
  },
  {
    icon: Rocket,
    eyebrow: "ملاحظة جانبية",
    title: "الاسم التقني لو حد سألك",
    block: {
      kind: "paragraphs",
      paragraphs: [
        "الـ AI بيقسم كلامك لقطع صغيرة اسمها **Tokens**، وبيحاسبك عليها. مش مهم دلوقتي تحفظ ده — مهم بس تفتكر القاعدة: **اختصر، تكسب**.",
      ],
    },
  },
  {
    icon: Rocket,
    eyebrow: "اختبر فهمك",
    title: "سؤال واحد بس",
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
            "تغيّر الموديل.",
            "تختصر طلبك وتشيل المقدمات الزيادة.",
            "تستنى وتعيد المحاولة.",
          ],
          correctIndex: 1,
          explanation:
            "كل ما الطلب أقصر، الرد أسرع والتكلفة أقل. ده أبسط تحسين تقدر تعمله.",
        },
      ],
    },
  },
];
