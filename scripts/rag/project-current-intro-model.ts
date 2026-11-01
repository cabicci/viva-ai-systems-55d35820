#!/usr/bin/env bun
/** Deterministic source preparation only. Review the diff before release approval/indexing. */
import fs from "node:fs";
import path from "node:path";
import { projectCurrentIntroModelPackage } from "../../src/lib/rag/current-lesson-parity";
import { serializePackageCanonical } from "../../src/lib/rag/project-egyptian-to-package";
import type { RagLocalizedLessonPackage } from "../../src/lib/locale-lessons/types";

const root = path.resolve(import.meta.dirname, "../..");
for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"]) {
  const file = path.join(root, `src/lib/locale-lessons/${locale}/lessons/intro-m1-l1-what-is-ai.json`);
  const original = JSON.parse(fs.readFileSync(file, "utf8")) as RagLocalizedLessonPackage;
  const candidate = projectCurrentIntroModelPackage(original);
  fs.writeFileSync(file, serializePackageCanonical(candidate), "utf8");
  console.log(JSON.stringify({ lessonId: candidate.lessonId, locale: candidate.locale, canonicalVersion: candidate.canonicalVersion,
    requiresSourceReview: true, indexingPerformed: false }));
}
