/**
 * Deterministic canonical-quiz fixer for ar-MSA lessons.
 *
 * Authorized scope (per Step-2 instruction):
 *   1. quiz.options has fewer than 2 entries
 *   2. quiz.correctIndex out of range
 *   3. empty quiz.question
 *   4. unbalanced "**" markers in any learner-facing string
 *
 * Read-only with respect to: lessonId, section order, role, non-text fields,
 * Egyptian ar-EG production lessons (never touched — this script targets
 * ONLY src/lib/locale-lessons/ar-MSA/).
 *
 * Does NOT call OpenAI / does NOT generate ar-Gulf or English.
 *
 * Two observed broken patterns:
 *   A) quiz.options has 1 entry which starts with "**الإجابة الصحيحة:**".
 *      Strip prefix → correct answer. Append 2 generic placeholder
 *      distractors (clearly-wrong, MSA, non-domain-specific).
 *   B) quiz.options has 2 distractors prefixed "خيار 2:" / "خيار 3:" but
 *      no entry for the correct answer; the correct answer lives in
 *      bullets[0] as "****الإجابة الصحيحة** (correctIndex: N):** …".
 *      Reconstruct: pull correct text out of bullets[0], strip prefix,
 *      strip "خيار N: " from distractors, build options = [correct,
 *      …distractors], correctIndex = 0.
 *
 * Empty question → use section.heading minus "Quiz — " prefix when it
 * carries meaning; otherwise a generic MSA fallback.
 *
 * Unbalanced ** → append one closing ** (mirrors sanitizer behaviour).
 */
import { promises as fs } from "node:fs";
import path from "node:path";

const LESSONS_DIR = path.resolve("src/lib/locale-lessons/ar-MSA/lessons");

const GENERIC_DISTRACTORS = [
  "خيار غير ملائم؛ يتجاهل المعطيات الأساسية في القسم أعلاه.",
  "إجابة جزئية تفوّت السياق وتتجاهل الخطوة التالية للقرار.",
];
const GENERIC_QUESTION_FALLBACK = "ما الخيار الأنسب وفقًا لما ورد في القسم أعلاه؟";

function stripCorrectPrefix(s: string): string {
  // Handles: "**الإجابة الصحيحة:** ..." and
  // "****الإجابة الصحيحة** (correctIndex: N):** ..."
  return s
    .replace(/^\*+\s*الإجابة\s*الصحيحة\s*\*+\s*\(\s*correctIndex\s*:\s*\d+\s*\)\s*:\s*\*+\s*/u, "")
    .replace(/^\*+\s*الإجابة\s*الصحيحة\s*:\s*\*+\s*/u, "")
    .replace(/^\*+\s*Correct\s*answer\s*:\s*\*+\s*/iu, "")
    .trim();
}

function stripOptionPrefix(s: string): string {
  return s.replace(/^\s*\*{0,2}\s*(?:ال)?خيار\s*[\u0660-\u0669\u06F0-\u06F90-9]+\s*:\s*\*{0,2}\s*/u, "").trim();
}

function balanceBold(s: string): string {
  const n = (s.match(/\*\*/g) ?? []).length;
  return n % 2 === 0 ? s : s + "**";
}

function deriveQuestionFromHeading(heading: string | undefined): string {
  if (!heading || typeof heading !== "string") return GENERIC_QUESTION_FALLBACK;
  const cleaned = heading
    .replace(/^Quiz\s*[—–-]\s*/i, "")
    .replace(/^Quiz\s*:?\s*/i, "")
    .replace(/correctIndex\s*:\s*\d+/i, "")
    .trim();
  if (!cleaned || /^[\s\-—–]*$/.test(cleaned)) return GENERIC_QUESTION_FALLBACK;
  // If heading is itself a question, use as-is; else turn into one.
  if (/[?؟]$/.test(cleaned)) return cleaned;
  return `${cleaned}: ما الخيار الأنسب؟`;
}

interface FixCounts {
  optionsRebuiltFromBullets: number; // pattern B
  distractorsAdded: number;           // pattern A
  questionsFilled: number;
  correctIndexClamped: number;
  boldBalanced: number;
  lessonsTouched: Set<string>;
}

function balanceAllBoldInPlace(obj: unknown, counts: FixCounts): unknown {
  if (typeof obj === "string") {
    const b = balanceBold(obj);
    if (b !== obj) counts.boldBalanced++;
    return b;
  }
  if (Array.isArray(obj)) return obj.map((x) => balanceAllBoldInPlace(x, counts));
  if (obj && typeof obj === "object") {
    const o: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      o[k] = balanceAllBoldInPlace(v, counts);
    }
    return o;
  }
  return obj;
}

function fixQuiz(
  section: Record<string, unknown>,
  counts: FixCounts,
): void {
  const quiz = section.quiz as Record<string, unknown> | undefined;
  if (!quiz) return;
  const bullets = Array.isArray(section.bullets) ? (section.bullets as string[]) : [];
  let options = Array.isArray(quiz.options) ? [...(quiz.options as string[])] : [];
  let correctIndex = typeof quiz.correctIndex === "number" ? quiz.correctIndex : 0;
  let question = typeof quiz.question === "string" ? quiz.question : "";

  // Pattern B: correct answer is in bullets[0], not in options.
  const bullet0 = bullets[0] ?? "";
  const isPatternB =
    /^\*+\s*الإجابة\s*الصحيحة/u.test(bullet0) &&
    options.length >= 1 &&
    options.every((o) => /^\s*\*{0,2}\s*(?:ال)?خيار\s*[\u0660-\u0669\u06F0-\u06F90-9]+\s*:/u.test(o));

  if (isPatternB) {
    const correctText = stripCorrectPrefix(bullet0);
    const distractors = options.map(stripOptionPrefix).filter(Boolean);
    options = [correctText, ...distractors];
    correctIndex = 0;
    counts.optionsRebuiltFromBullets++;
  }

  // Pattern A: quiz.options has 1 entry with "**الإجابة الصحيحة:**".
  if (options.length === 1 && /\*+\s*الإجابة\s*الصحيحة/u.test(options[0])) {
    const correctText = stripCorrectPrefix(options[0]);
    options = [correctText, ...GENERIC_DISTRACTORS];
    correctIndex = 0;
    counts.distractorsAdded++;
  }

  // Still <2 options? Pad with generic distractors so structure is valid.
  while (options.length < 3) {
    options.push(GENERIC_DISTRACTORS[options.length - 1] ?? GENERIC_DISTRACTORS[0]);
    counts.distractorsAdded++;
  }

  // Clamp correctIndex.
  if (
    typeof correctIndex !== "number" ||
    correctIndex < 0 ||
    correctIndex >= options.length
  ) {
    correctIndex = 0;
    counts.correctIndexClamped++;
  }

  // Empty question.
  if (!question || question.trim() === "") {
    question = deriveQuestionFromHeading(section.heading as string | undefined);
    counts.questionsFilled++;
  }

  // Clean any residual "**الإجابة الصحيحة:**" / "خيار N:" prefixes in options.
  options = options.map((o) => {
    const o1 = stripCorrectPrefix(o);
    const o2 = stripOptionPrefix(o1);
    return o2 || o;
  });

  quiz.options = options;
  quiz.correctIndex = correctIndex;
  quiz.question = question;
}

async function main() {
  const files = (await fs.readdir(LESSONS_DIR)).filter((f) => f.endsWith(".json"));
  const counts: FixCounts = {
    optionsRebuiltFromBullets: 0,
    distractorsAdded: 0,
    questionsFilled: 0,
    correctIndexClamped: 0,
    boldBalanced: 0,
    lessonsTouched: new Set(),
  };

  for (const file of files) {
    const fp = path.join(LESSONS_DIR, file);
    const raw = await fs.readFile(fp, "utf8");
    const pkg = JSON.parse(raw) as { lessonId: string; sections: Record<string, unknown>[] };
    const before = JSON.stringify(pkg);

    for (const sec of pkg.sections) {
      const role = typeof sec.role === "string" ? sec.role.toLowerCase() : "";
      if (role === "quiz") fixQuiz(sec, counts);
    }
    const balanced = balanceAllBoldInPlace(pkg, counts) as typeof pkg;
    const after = JSON.stringify(balanced);
    if (after !== before) {
      counts.lessonsTouched.add(pkg.lessonId);
      await fs.writeFile(fp, JSON.stringify(balanced, null, 2) + "\n", "utf8");
    }
  }

  console.log(JSON.stringify({
    lessonsTouched: counts.lessonsTouched.size,
    optionsRebuiltFromBullets: counts.optionsRebuiltFromBullets,
    distractorsAdded: counts.distractorsAdded,
    questionsFilled: counts.questionsFilled,
    correctIndexClamped: counts.correctIndexClamped,
    boldBalanced: counts.boldBalanced,
    touchedIds: [...counts.lessonsTouched].sort(),
  }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
