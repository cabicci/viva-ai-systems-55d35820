import eg from "./ar-EG.json";
import msa from "./ar-MSA.json";
import gulf from "./ar-Gulf.json";
import en from "./en.json";
import type { Lesson } from "../LessonPreview";
const expanded = import.meta.glob("./expanded/*.json", {
  eager: true,
  import: "default",
}) as Record<string, Lesson[]>;
const source = { "ar-EG": eg, "ar-MSA": msa, "ar-Gulf": gulf, en };
export function courseLessons(locale: keyof typeof source): Lesson[] {
  if (expanded[`./expanded/${locale}.json`]) return expanded[`./expanded/${locale}.json`];
  const english = locale === "en";
  return source[locale].map((item, index) => {
    const options = index % 2 ? [item.wrong, item.correct] : [item.correct, item.wrong];
    return {
      id: item.id,
      locale,
      title: item.title,
      intro: item.context.start,
      goals: [item.task],
      sections: [
        {
          id: "concept",
          title: english ? "Concept and method" : "المفهوم وطريقة التطبيق",
          text: item.concept,
          reflection: item.context.reflect,
        },
      ],
      example: {
        title: english ? "Worked teaching case" : "حالة تعليمية محلولة",
        text: item.case,
        decision: item.context.fiction,
      },
      quiz: [
        {
          id: item.id + "-Q01",
          question: item.question,
          options,
          correct: index % 2 ? 1 : 0,
          explanation: item.correct + ". " + item.concept,
        },
      ],
      assignment: {
        prompt: item.task,
        fields: english
          ? [
              "Your completed output",
              "Evidence, assumptions and limitations",
              "A revision after checking your work",
            ]
          : ["المخرج الذي أنجزته", "الأدلة والافتراضات وحدودها", "تعديل أجريته بعد مراجعة عملك"],
        criteria: english
          ? [
              "Address every requested element in the task.",
              "Connect your decision to the concept and case.",
              "Show calculations or reasoning so another reader can check them.",
              "Label assumptions and missing evidence.",
              "Explain one revision and why it improves the output.",
            ]
          : [
              "استوفِ عناصر التطبيق المطلوبة في نص المهمة.",
              "اربط قرارك بالمفهوم والحالة التعليمية.",
              "أظهر الحساب أو خطوات الاستدلال حتى يمكن مراجعته.",
              "ميّز الافتراضات والأدلة الناقصة.",
              "فسّر تعديلًا واحدًا وسبب تحسينه للمخرج.",
            ],
      },
      faq: [
        {
          question: english ? "Are these real market figures?" : "هل هذه أرقام سوق فعلية؟",
          answer: item.context.fiction,
        },
        {
          question: english
            ? "Do I need a video or the assistant to complete this lesson?"
            : "هل أحتاج الفيديو أو المساعد لإنهاء الدرس؟",
          answer: english
            ? "No. Complete the reading, case, practice and review. The assistant is an optional separately paid add-on."
            : "لا. أكمل الشرح والحالة والتطبيق والمراجعة. المساعد إضافة اختيارية باشتراك مستقل.",
        },
      ],
      summary: [item.correct, item.context.reflect],
    };
  });
}
