import type { SupportedLocale } from "./locale/types";

export const MISSION_AI_LOCALES = [
  "ar-EG",
  "ar-MSA",
  "ar-Gulf",
  "en",
] as const satisfies readonly SupportedLocale[];

export type MissionAIPromptLocale = (typeof MISSION_AI_LOCALES)[number];

type RubricCriterion = {
  label: string;
  weight: number;
  criteria: readonly string[];
};

type PromptPair = {
  systemPrompt: string;
  userPrompt: string;
};

function evaluationSystemPrompt(locale: MissionAIPromptLocale, passThreshold: number): string {
  switch (locale) {
    case "ar-EG":
      return `أنت مدرّب داعم بيقيّم مهام تعليمية للمبتدئين بالعربية المصرية. هدفك تشجّع التجربة وتفتح الباب للدرس اللي بعده، مش تمنع التقدم.

مهمتك:
1. تقيّم تسليم الطالب حسب الـ Rubric (٠-١٠٠ لكل معيار).
2. ابدأ feedback كل معيار بنقطة قوة واحدة (حاجة عملها صح)، بعدين نقطة تحسين واحدة محددة. سطر-سطرين بس.
3. احسب overall score = ∑(score × weight) / 100.
4. passed = overall ≥ ${passThreshold}. لو الطالب ملا أغلب نقاط الـ rubric حتى لو ناقص تفصيلة، اعتبره pass. التسليم الفاضي أو اللي مالوش علاقة بالموضوع فقط هو اللي يفشل.
5. summary: ٢-٣ جمل مشجّعة بتلخّص اللي اتعمل صح + اللي يقدر يحسّنه.
6. nextStep: نصيحة عملية واحدة قابلة للتطبيق دلوقتي.
7. socraticQuestion: سؤال واحد بس على أضعف معيار يخلّيه يفكّر. لو الإجابة قوية (٨٠+)، سيب الحقل ده "".

قواعد:
- ردّ JSON فقط، مفيش أي نص خارج JSON.
- عربية مصرية بسيطة، مفيش مصطلحات معقدة.
- متبخلش في الدرجات لو الطالب اجتهد — درجات الـ ٧٠+ مسموحة وطبيعية لتسليم متوسط مكتمل.`;
    case "ar-MSA":
      return `أنت مدرّب داعم تقيّم مهام تعليمية للمبتدئين بالعربية الفصحى المبسطة. هدفك تشجيع التجربة وفتح الطريق إلى الدرس التالي، لا منع التقدّم.

مهمتك:
1. قيّم تسليم المتعلّم حسب معيار التقييم (0-100 لكل معيار).
2. ابدأ ملاحظات كل معيار بنقطة قوة واحدة، ثم اذكر تحسيناً واحداً محدداً. استخدم سطراً أو سطرين فقط.
3. احسب overall score = ∑(score × weight) / 100.
4. passed = overall ≥ ${passThreshold}. إذا استوفى المتعلّم معظم نقاط المعيار ولو نقص تفصيل صغير فاعتبره ناجحاً. لا يفشل إلا التسليم الفارغ أو غير المرتبط بالمهمة.
5. summary: جملتان أو ثلاث جمل مشجعة تلخّص ما أُنجز جيداً وما يمكن تحسينه.
6. nextStep: نصيحة عملية واحدة قابلة للتطبيق الآن.
7. socraticQuestion: سؤال واحد عن أضعف معيار يساعده على التفكير. إذا كانت الإجابة قوية (80+) فاترك الحقل "".

قواعد:
- أعد JSON فقط من دون أي نص خارجه.
- استخدم عربية فصحى بسيطة ومباشرة.
- لا تكن شحيحاً في الدرجات عند وجود جهد واضح؛ درجات 70+ طبيعية لتسليم متوسط مكتمل.`;
    case "ar-Gulf":
      return `أنت مدرّب داعم تقيّم مهام تعليمية للمبتدئين بالعربية الخليجية البسيطة. هدفك تشجّع التجربة وتفتح الطريق للدرس اللي بعده، مو تمنع التقدّم.

مهمتك:
1. قيّم تسليم المتعلّم حسب الـ Rubric (0-100 لكل معيار).
2. ابدأ feedback كل معيار بنقطة قوة وحدة، وبعدها اذكر تحسين واحد محدد. سطر أو سطرين بس.
3. احسب overall score = ∑(score × weight) / 100.
4. passed = overall ≥ ${passThreshold}. إذا غطّى المتعلّم أغلب نقاط الـ rubric حتى لو ناقص تفصيل بسيط، اعتبره pass. ما يفشل إلا التسليم الفاضي أو اللي ما له علاقة بالمهمة.
5. summary: جملتين أو ثلاث جمل مشجعة تلخّص اللي انعمل صح واللي يقدر يحسّنه.
6. nextStep: نصيحة عملية وحدة قابلة للتطبيق الحين.
7. socraticQuestion: سؤال واحد عن أضعف معيار يساعده يفكّر. إذا كانت الإجابة قوية (80+)، خلّ الحقل "".

قواعد:
- ردّ JSON فقط، من دون أي نص خارجه.
- استخدم عربية خليجية بسيطة وواضحة.
- لا تبخل بالدرجات إذا المتعلّم اجتهد؛ درجات 70+ طبيعية لتسليم متوسط مكتمل.`;
    case "en":
      return `You are a supportive coach evaluating beginner learning missions in clear English. Encourage experimentation and help the learner continue to the next lesson.

Your task:
1. Evaluate the learner submission against the rubric (0-100 for each criterion).
2. Start each criterion's feedback with one strength, then give one specific improvement. Use only one or two lines.
3. Calculate overall score = ∑(score × weight) / 100.
4. Set passed = overall ≥ ${passThreshold}. If the learner covers most rubric points with only a minor detail missing, pass the submission. Fail only empty or off-topic submissions.
5. summary: two or three encouraging sentences covering what was done well and what can improve.
6. nextStep: one practical action the learner can take now.
7. socraticQuestion: one question about the weakest criterion that helps the learner think. If the answer is strong (80+), use "".

Rules:
- Return JSON only, with no text outside JSON.
- Use simple, direct English.
- Give fair credit for clear effort; scores of 70+ are normal for a complete, average submission.`;
  }
}

function formatRubric(locale: MissionAIPromptLocale, rubric: readonly RubricCriterion[]): string {
  const weightLabel = locale === "en" ? "weight" : "الوزن";
  return rubric
    .map(
      (criterion, index) =>
        `${index + 1}. ${criterion.label} (${weightLabel}: ${criterion.weight}%)\n   - ${criterion.criteria.join("\n   - ")}`,
    )
    .join("\n\n");
}

export function buildMissionEvaluationPrompts(input: {
  locale: MissionAIPromptLocale;
  passThreshold: number;
  lessonTitle: string;
  missionPrompt: string;
  rubric: readonly RubricCriterion[];
  submissionText: string;
}): PromptPair {
  const rubricText = formatRubric(input.locale, input.rubric);
  const userPrompt =
    input.locale === "en"
      ? `Lesson: ${input.lessonTitle}

Mission:
${input.missionPrompt}

Rubric:
${rubricText}

Learner submission:
${input.submissionText}

Return exactly this JSON shape:
{
  "overallScore": <number 0-100>,
  "passed": <true|false>,
  "perCriterion": [
    {"label": "<criterion name from the rubric>", "score": <number 0-100>, "feedback": "<one or two lines>"}
  ],
  "summary": "<two or three sentences>",
  "nextStep": "<one practical action>",
  "socraticQuestion": "<one specific question about the weakest criterion, or an empty string for a strong answer>"
}`
      : input.locale === "ar-EG"
        ? `الدرس: ${input.lessonTitle}

المهمة:
${input.missionPrompt}

الـ Rubric:
${rubricText}

تسليم الطالب:
${input.submissionText}

ردّ بالـ JSON الشكل ده بالظبط:
{
  "overallScore": <رقم ٠-١٠٠>,
  "passed": <true|false>,
  "perCriterion": [
    {"label": "<اسم المعيار من الـ Rubric>", "score": <رقم ٠-١٠٠>, "feedback": "<سطر-سطرين>"}
  ],
  "summary": "<٢-٣ جمل>",
  "nextStep": "<نصيحة عملية واحدة>",
  "socraticQuestion": "<سؤال واحد محدد على أضعف معيار، أو نص فارغ لو الإجابة قوية>"
}`
        : `الدرس: ${input.lessonTitle}

المهمة:
${input.missionPrompt}

معيار التقييم:
${rubricText}

تسليم المتعلّم:
${input.submissionText}

أعد النتيجة بهذا الشكل الدقيق من JSON:
{
  "overallScore": <رقم 0-100>,
  "passed": <true|false>,
  "perCriterion": [
    {"label": "<اسم المعيار من معيار التقييم>", "score": <رقم 0-100>, "feedback": "<سطر أو سطران>"}
  ],
  "summary": "<جملتان أو ثلاث جمل>",
  "nextStep": "<نصيحة عملية واحدة>",
  "socraticQuestion": "<سؤال واحد محدد عن أضعف معيار، أو نص فارغ إذا كانت الإجابة قوية>"
}`;

  return {
    systemPrompt: evaluationSystemPrompt(input.locale, input.passThreshold),
    userPrompt,
  };
}
