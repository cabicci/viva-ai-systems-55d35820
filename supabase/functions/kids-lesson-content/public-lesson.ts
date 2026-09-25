type Row = Record<string, unknown>;
const record = (input: unknown): input is Row =>
  Boolean(input) && typeof input === "object" && !Array.isArray(input);
function pick(input: unknown, keys: readonly string[]): Row {
  if (!record(input)) return {};
  return Object.fromEntries(keys.filter((key) => key in input).map((key) => [key, input[key]]));
}
function picks(input: unknown, keys: readonly string[]): Row[] {
  return Array.isArray(input) ? input.filter(record).map((row) => pick(row, keys)) : [];
}
const SCENE = ["id", "title", "display", "narration", "visualAction", "accent"];
const LABELS = [
  "brand",
  "level",
  "watch",
  "read",
  "try",
  "quiz",
  "mission",
  "helper",
  "next",
  "check",
  "retry",
  "correct",
  "notYet",
  "model",
  "source",
  "privacy",
  "video",
  "goal",
  "details",
  "format",
  "build",
  "clear",
  "empty",
  "rubric",
  "hintIntro",
  "done",
  "pause",
  "transcript",
  "imageZoom",
  "gallery",
];
export function studentLesson(raw: unknown): Row | null {
  if (!record(raw) || typeof raw.title !== "string" || typeof raw.locale !== "string") {
    return null;
  }
  return {
    ...pick(raw, ["locale", "title", "subtitle", "ageLabel", "objectives"]),
    scenes: picks(raw.scenes, SCENE),
    reading: picks(raw.reading, ["id", "title", "text"]),
    materials: picks(raw.materials, ["id", "title", "text", "kind"]),
    promptExamples: pick(raw.promptExamples, ["initial", "improved", "followup"]),
    activity: pick(raw.activity, ["title", "instructions", "starter"]),
    prompt: pick(raw.prompt, [
      "task",
      "details",
      "format",
      "combined",
      "bad",
      "mismatch",
      "followup",
    ]),
    vocabulary: picks(raw.vocabulary, ["term", "meaning"]),
    illustration: pick(raw.illustration, [
      "title",
      "subtitle",
      "heads",
      "texts",
      "footer",
      "credit",
    ]),
    pageIllustration: pick(raw.pageIllustration, [
      "title",
      "subtitle",
      "heads",
      "texts",
      "beforeLabel",
      "before",
      "afterLabel",
      "after",
      "footer",
      "credit",
    ]),
    labels: pick(raw.labels, LABELS),
    mission: pick(raw.mission, ["title", "instructions", "rubric"]),
    hints: picks(raw.hints, ["question", "source", "sourceScene"]),
    quiz: picks(raw.quiz, ["id", "question", "options", "source", "sourceScene"]),
  };
}
export function checkQuiz(
  raw: unknown,
  questionId: string,
  selectedIndex: number,
): { correct: boolean; explanation: string } | null {
  if (!record(raw) || !Array.isArray(raw.quiz)) return null;
  const matches = raw.quiz.filter((entry: unknown) => record(entry) && entry.id === questionId);
  if (matches.length !== 1 || !record(matches[0])) return null;
  const quiz = matches[0];
  if (
    !Array.isArray(quiz.options) ||
    !Number.isInteger(selectedIndex) ||
    selectedIndex < 0 ||
    selectedIndex >= quiz.options.length ||
    !Number.isInteger(quiz.answer) ||
    typeof quiz.explanation !== "string"
  )
    return null;
  return { correct: selectedIndex === quiz.answer, explanation: quiz.explanation };
}
