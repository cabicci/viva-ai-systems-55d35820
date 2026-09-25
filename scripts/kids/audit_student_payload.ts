/** Audit the lesson DTO against private editorial files; keep data outside Git. */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { studentLesson } from "../../supabase/functions/kids-lesson-content/public-lesson";

const dir = process.argv[2];
if (!dir) throw Error("Usage: bun scripts/kids/audit_student_payload.ts PRIVATE_DIRECTORY");
let count = 0;
for (const level of [1, 2, 3]) {
  for (let lesson = 1; lesson <= 12; lesson++) {
    for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"]) {
      const path = resolve(
        dir,
        `level-${level}`,
        `lesson-${String(lesson).padStart(2, "0")}`,
        `${locale}.json`,
      );
      const raw = JSON.parse(readFileSync(path, "utf8"));
      const student = studentLesson(raw);
      if (
        !student ||
        !Array.isArray(student.quiz) ||
        !Array.isArray(student.hints) ||
        student.quiz.some((question) => "answer" in question || "explanation" in question) ||
        student.hints.some((hint) => "answer" in hint) ||
        "educatorNotes" in student
      ) {
        throw Error(`Private package failed learner payload audit: ${level}/${lesson}/${locale}`);
      }
      count++;
    }
  }
}
console.log(`Audited ${count} learner packages; teacher notes and answer keys excluded.`);
