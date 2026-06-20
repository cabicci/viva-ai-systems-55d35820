import { promises as fs } from "node:fs";
import path from "node:path";
import { ARCHIVED_LESSON_ID_SET } from "../../src/lib/archived-lessons.ts";
import { INTRO_LESSON_CONTENT } from "../../src/components/intro/lessons/index.ts";
import type {
  LocalizedLessonManifest,
  LocalizedLessonPackage,
} from "../../src/lib/locale-lessons/types.ts";
import { parseCanonicalLessonMarkdown } from "./parse-canonical-lesson.ts";

const REPO_ROOT = path.resolve(import.meta.dir, "../..");
const CANONICAL_DIR = path.join(
  REPO_ROOT,
  "docs/playbooks/adaptive-canonical",
);
const OUTPUT_DIR = path.join(REPO_ROOT, "src/lib/locale-lessons/ar-MSA");
const LESSONS_DIR = path.join(OUTPUT_DIR, "lessons");

function activeLessonIds(): string[] {
  return Object.keys(INTRO_LESSON_CONTENT)
    .filter((id) => !ARCHIVED_LESSON_ID_SET.has(id))
    .sort();
}

export interface GenerationReport {
  sourceCount: number;
  generatedCount: number;
  missingIds: string[];
  extraIds: string[];
  archivedIncluded: string[];
}

export async function generateArMsaPackage(
  generatedAt = new Date().toISOString(),
): Promise<GenerationReport> {
  const expectedIds = activeLessonIds();
  const expectedSet = new Set(expectedIds);

  const canonicalFiles = (await fs.readdir(CANONICAL_DIR))
    .filter((file) => file.endsWith(".canonical.md"))
    .sort();

  const packages: LocalizedLessonPackage[] = [];
  const parsedIds: string[] = [];

  for (const file of canonicalFiles) {
    const lessonIdFromName = file.replace(/\.canonical\.md$/, "");
    const sourcePath = path.join(CANONICAL_DIR, file);
    const md = await fs.readFile(sourcePath, "utf8");
    const pkg = parseCanonicalLessonMarkdown(
      md,
      path.relative(REPO_ROOT, sourcePath).replace(/\\/g, "/"),
      generatedAt,
    );

    if (pkg.lessonId !== lessonIdFromName) {
      throw new Error(
        `lessonId mismatch in ${file}: yaml=${pkg.lessonId}, filename=${lessonIdFromName}`,
      );
    }

    parsedIds.push(pkg.lessonId);
    packages.push(pkg);
  }

  const parsedSet = new Set(parsedIds);
  const missingIds = expectedIds.filter((id) => !parsedSet.has(id));
  const extraIds = parsedIds.filter((id) => !expectedSet.has(id));
  const archivedIncluded = parsedIds.filter((id) =>
    ARCHIVED_LESSON_ID_SET.has(id),
  );

  if (missingIds.length > 0 || extraIds.length > 0 || archivedIncluded.length > 0) {
    throw new Error(
      [
        "Arabic Fusha package validation failed.",
        missingIds.length ? `missing: ${missingIds.join(", ")}` : "",
        extraIds.length ? `extra: ${extraIds.join(", ")}` : "",
        archivedIncluded.length
          ? `archived included: ${archivedIncluded.join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  if (packages.length !== 100) {
    throw new Error(`expected 100 lessons, got ${packages.length}`);
  }

  await fs.mkdir(LESSONS_DIR, { recursive: true });

  for (const pkg of packages) {
    const outPath = path.join(LESSONS_DIR, `${pkg.lessonId}.json`);
    await fs.writeFile(outPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
  }

  const manifest: LocalizedLessonManifest = {
    locale: "ar-MSA",
    generatedAt,
    canonicalSource: "docs/playbooks/adaptive-canonical",
    lessonCount: packages.length,
    lessonIds: expectedIds,
  };

  await fs.writeFile(
    path.join(OUTPUT_DIR, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );

  return {
    sourceCount: canonicalFiles.length,
    generatedCount: packages.length,
    missingIds,
    extraIds,
    archivedIncluded,
  };
}

async function main() {
  const report = await generateArMsaPackage();
  console.log(
    `Generated ${report.generatedCount}/${report.sourceCount} ar-MSA lesson packages in src/lib/locale-lessons/ar-MSA/lessons/`,
  );
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
