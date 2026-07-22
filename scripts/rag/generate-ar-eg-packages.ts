/**
 * Generate deterministic ar-EG RAG packages from frozen IntroLessonContent.
 * Does not modify Egyptian TypeScript lesson source files.
 *
 * Usage:
 *   bun run scripts/rag/generate-ar-eg-packages.ts
 *   bun run scripts/rag/generate-ar-eg-packages.ts --out <dir>
 */

import fs from "node:fs";
import path from "node:path";
import { PATHS } from "@/lib/curriculum-data";
import { loadIntroLessonContent } from "@/components/intro/lessons/lesson-registry";
import { getShippedLessonIdsInCurriculumOrder } from "@/lib/shipped-lessons";
import { egyptianLessonContentRef } from "@/lib/locale-lessons/registry";
import {
  AR_EG_PACKAGE_GENERATED_AT,
  projectEgyptianLessonToPackage,
  serializePackageCanonical,
  sourceChecksumFromTsFile,
} from "@/lib/rag/project-egyptian-to-package";
import { EXPECTED_PACKAGES_PER_LOCALE } from "@/lib/rag/constants";
import { sha256Hex } from "@/lib/rag/checksum";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");

function parseOutDir(argv: string[]): string {
  const idx = argv.indexOf("--out");
  if (idx >= 0 && argv[idx + 1]) {
    return path.resolve(argv[idx + 1]!);
  }
  return path.join(REPO_ROOT, "src/lib/locale-lessons/ar-EG");
}

function metaForLesson(lessonId: string): {
  pathId: string;
  moduleId: string;
  title: string;
  productionRoute: string;
  nextLessonId?: string;
} {
  for (const p of PATHS) {
    for (const mod of p.modules) {
      const lessons = mod.lessons;
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i]!;
        if (lesson.id !== lessonId) continue;
        const next = lessons[i + 1];
        return {
          pathId: p.id,
          moduleId: mod.id,
          title: lesson.title,
          productionRoute: `/learn/${p.id}/${lessonId}`,
          nextLessonId: next?.id,
        };
      }
    }
  }
  throw new Error(`Lesson ${lessonId} not found on PATHS`);
}

export async function generateArEgPackages(outRoot: string): Promise<{
  packageCount: number;
  lessonIds: string[];
  packageChecksums: Record<string, string>;
  sourceChecksums: Record<string, string>;
  manifestChecksum: string;
}> {
  const lessonIds = getShippedLessonIdsInCurriculumOrder();
  if (lessonIds.length !== EXPECTED_PACKAGES_PER_LOCALE) {
    throw new Error(
      `Expected ${EXPECTED_PACKAGES_PER_LOCALE} ar-EG lessons, found ${lessonIds.length}`,
    );
  }

  const lessonsDir = path.join(outRoot, "lessons");
  fs.mkdirSync(lessonsDir, { recursive: true });

  const packageChecksums: Record<string, string> = {};
  const sourceChecksums: Record<string, string> = {};

  for (const lessonId of lessonIds) {
    const content = await loadIntroLessonContent(lessonId);
    if (!content) {
      throw new Error(`Missing IntroLessonContent for ${lessonId}`);
    }
    const meta = metaForLesson(lessonId);
    const sourceFile = egyptianLessonContentRef(lessonId);
    const absTs = path.join(REPO_ROOT, sourceFile);
    const rawTs = fs.readFileSync(absTs, "utf8");
    sourceChecksums[lessonId] = sourceChecksumFromTsFile(rawTs);

    const pkg = projectEgyptianLessonToPackage(content, {
      lessonId,
      pathId: meta.pathId,
      moduleId: meta.moduleId,
      title: meta.title,
      productionRoute: meta.productionRoute,
      sourceFile,
      nextLessonId: meta.nextLessonId,
    });

    const canonical = serializePackageCanonical(pkg);
    const outPath = path.join(lessonsDir, `${lessonId}.json`);
    fs.writeFileSync(outPath, canonical, "utf8");
    packageChecksums[lessonId] = sha256Hex(canonical);
  }

  const sortedIds = [...lessonIds].sort();
  const manifest = {
    locale: "ar-EG",
    generatedAt: AR_EG_PACKAGE_GENERATED_AT,
    canonicalSource: "src/components/intro/lessons (frozen Egyptian TS)",
    lessonCount: sortedIds.length,
    lessonIds: sortedIds,
    projection: "deterministic-intro-to-rag-package-v1",
    sourceShaContract: "CONTENT_FREEZE_SHA",
  };
  const manifestJson = `${JSON.stringify(manifest, null, 2).replace(/\r\n/g, "\n")}\n`;
  fs.writeFileSync(path.join(outRoot, "manifest.json"), manifestJson, "utf8");

  return {
    packageCount: lessonIds.length,
    lessonIds: sortedIds,
    packageChecksums,
    sourceChecksums,
    manifestChecksum: sha256Hex(manifestJson),
  };
}

if (import.meta.main) {
  const outRoot = parseOutDir(process.argv.slice(2));
  const report = await generateArEgPackages(outRoot);
  console.log(
    JSON.stringify(
      {
        ok: true,
        outRoot: path.relative(REPO_ROOT, outRoot).replace(/\\/g, "/"),
        packageCount: report.packageCount,
        manifestChecksum: report.manifestChecksum,
      },
      null,
      2,
    ),
  );
}
