import type { RagLocalizedLessonPackage, LocalizedLessonSection, RagPackageLocale } from "@/lib/locale-lessons/types";
import { CURRENT_INTRO_MODEL_CONCEPTS } from "@/lib/locale-lessons/current-intro-model-concept";
import { sha256CanonicalJson } from "./canonical-checksum";

const LESSON = "intro-m1-l1-what-is-ai";
export const CURRENT_LESSON_REVISION_PREFIX = "current-lesson-content-sha256-";
const isModelCorrection = (p: RagLocalizedLessonPackage) => p.lessonId === LESSON && Object.hasOwn(CURRENT_INTRO_MODEL_CONCEPTS, p.locale);
const line = (row: string[]) => `${row[0]}: ${row[1]}${row[2] ? ` (${row[2]})` : ""}`;
const plainTerm = (value: string) => value.replace(/\*\*/g, "").trim();
const tableLine = (row: string[]) => `| ${row.join(" | ")} |`;
const modelRow = (locale: RagPackageLocale, term: string) => {
  const concept = CURRENT_INTRO_MODEL_CONCEPTS[locale];
  return [term, concept.meaning, concept.example];
};

/** Keep every header, separator and other term's markdown exactly as supplied. */
function replaceModelMarkdown(section: LocalizedLessonSection, locale: RagPackageLocale, row: string[]): string {
  const lines = section.contentMarkdown.split("\n");
  const indexes = lines.flatMap((text, index) => {
    const cells = text.split("|");
    return cells.length >= 3 && plainTerm(cells[1]) === CURRENT_INTRO_MODEL_CONCEPTS[locale].term ? [index] : [];
  });
  if (indexes.length !== 1) throw new Error("CURRENT_LESSON_CORRECTION_SHAPE");
  lines[indexes[0]] = tableLine(row);
  return lines.join("\n");
}

/** A content revision is not an approval. The existing source/release review is still required. */
export function currentLessonPackageRevision(pkg: RagLocalizedLessonPackage): string {
  const { canonicalVersion: _version, generatedAt: _stamp, ...content } = pkg;
  return CURRENT_LESSON_REVISION_PREFIX + sha256CanonicalJson(content);
}

/** Prepare only the commissioned Model correction, retaining every other lesson field. */
export function projectCurrentIntroModelPackage(input: RagLocalizedLessonPackage): RagLocalizedLessonPackage {
  if (!isModelCorrection(input)) throw new Error("CURRENT_LESSON_CORRECTION_SCOPE");
  const pkg = structuredClone(input);
  const section = pkg.sections[3];
  if (section?.tables.length !== 1 || section.tables[0].rows.length !== 2 ||
    plainTerm(section.tables[0].rows[1][0]) !== CURRENT_INTRO_MODEL_CONCEPTS[pkg.locale].term)
    throw new Error("CURRENT_LESSON_CORRECTION_SHAPE");
  section.tables[0].rows[1] = modelRow(pkg.locale, section.tables[0].rows[1][0]);
  if (pkg.locale === "ar-EG") {
    section.bullets = section.tables[0].rows.map(line);
    section.contentMarkdown = section.bullets.join("\n\n");
  } else {
    if (section.bullets.length) throw new Error("CURRENT_LESSON_CORRECTION_SHAPE");
    section.contentMarkdown = replaceModelMarkdown(section, pkg.locale, section.tables[0].rows[1]);
  }
  pkg.generatedAt = "2026-11-01T00:00:00.000Z";
  pkg.canonicalVersion = currentLessonPackageRevision(pkg);
  return pkg;
}

/** Current release generation must not silently reuse a stale display projection. */
export function assertCurrentLessonPackageParity(pkg: RagLocalizedLessonPackage, recordVersion: string | null = pkg.canonicalVersion): void {
  if (!isModelCorrection(pkg)) return;
  if (recordVersion !== pkg.canonicalVersion) throw new Error("CURRENT_LESSON_RECORD_REVISION_MISMATCH");
  if (pkg.canonicalVersion !== currentLessonPackageRevision(pkg)) throw new Error("CURRENT_LESSON_REVISION_MISMATCH");
  const section = pkg.sections[3], rows = section?.tables[0]?.rows;
  if (!rows || rows.length !== 2 || section.tables.length !== 1 ||
    plainTerm(rows[1][0]) !== CURRENT_INTRO_MODEL_CONCEPTS[pkg.locale].term ||
    JSON.stringify(rows[1]) !== JSON.stringify(modelRow(pkg.locale, rows[1][0])))
    throw new Error("CURRENT_LESSON_DISPLAY_PARITY_MISMATCH");
  if (pkg.locale === "ar-EG") {
    if (JSON.stringify(section.bullets) !== JSON.stringify(rows.map(line)) || section.contentMarkdown !== rows.map(line).join("\n\n"))
      throw new Error("CURRENT_LESSON_DISPLAY_PARITY_MISMATCH");
  } else if (section.bullets.length || section.contentMarkdown !== replaceModelMarkdown(section, pkg.locale, rows[1])) {
    throw new Error("CURRENT_LESSON_DISPLAY_PARITY_MISMATCH");
  }
}
