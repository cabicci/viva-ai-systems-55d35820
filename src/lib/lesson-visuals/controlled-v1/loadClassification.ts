import { readFileSync } from "node:fs";
import { CLASSIFICATION_100_PATH, MEDIA_MAP_COPY_PATH } from "./paths";
import type { Classification100 } from "./types";
import { EXPECTED_COUNTS, EXPECTED_TOTAL_LESSONS } from "./constants";
import { sha256HexOfFile } from "./goldenRefs";

let cached: Classification100 | null = null;

/**
 * Loads the frozen, committed classification (docs/lesson-visuals/controlled-v1/classification-100.json).
 * This is the ONLY classification source used at build/runtime — it does not depend on
 * E:/Masaarat/Worktrees/_external-audits being present (CI does not have that path).
 */
export function loadClassification100(
  opts: { path?: string; useCache?: boolean } = {},
): Classification100 {
  const path = opts.path ?? CLASSIFICATION_100_PATH;
  if (opts.useCache !== false && cached && path === CLASSIFICATION_100_PATH) {
    return cached;
  }
  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw) as Classification100;
  if (path === CLASSIFICATION_100_PATH) cached = parsed;
  return parsed;
}

export interface ClassificationValidationResult {
  ok: boolean;
  errors: string[];
}

/** Structural + count validation of the frozen classification. Does not touch legacy v1. */
export function validateClassification100(
  classification: Classification100 = loadClassification100(),
): ClassificationValidationResult {
  const errors: string[] = [];

  if (classification.lessons.length !== EXPECTED_TOTAL_LESSONS) {
    errors.push(
      `expected ${EXPECTED_TOTAL_LESSONS} lessons, found ${classification.lessons.length}`,
    );
  }

  const seen = new Set<string>();
  const counts: Record<string, number> = {
    MASAARAT_SCREENSHOT: 0,
    AUTHORIZED_EXTERNAL_SCREENSHOT: 0,
    INSTRUCTIONAL_COMPOSITION: 0,
  };
  for (const lesson of classification.lessons) {
    if (seen.has(lesson.lessonId)) {
      errors.push(`duplicate lessonId in classification: ${lesson.lessonId}`);
    }
    seen.add(lesson.lessonId);

    if (!(lesson.route in counts)) {
      errors.push(
        `lesson ${lesson.lessonId} has invalid route: ${lesson.route}`,
      );
      continue;
    }
    counts[lesson.route] += 1;

    if ((lesson.route as string) === "DIAGRAM") {
      errors.push(
        `lesson ${lesson.lessonId} still uses legacy DIAGRAM route label; must be INSTRUCTIONAL_COMPOSITION`,
      );
    }
  }

  for (const [route, expected] of Object.entries(EXPECTED_COUNTS)) {
    if (counts[route] !== expected) {
      errors.push(
        `route ${route}: expected ${expected}, found ${counts[route] ?? 0}`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

/** Verifies the repo-committed media-map copy is byte-identical to the recorded checksum. */
export function verifyMediaMapCopyChecksum(expectedSha256: string): {
  ok: boolean;
  actualSha256: string;
} {
  const actualSha256 = sha256HexOfFile(MEDIA_MAP_COPY_PATH);
  return {
    ok: actualSha256.toLowerCase() === expectedSha256.toLowerCase(),
    actualSha256,
  };
}
