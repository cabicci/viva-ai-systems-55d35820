import type {
  AdaptationTargetLocale,
  AdaptedLessonPackage,
  LocalizedLessonPackage,
} from "../../../src/lib/locale-lessons/types.ts";
import {
  localizedTextForField,
  type LocalizedTextMap,
} from "./localized-text-map.ts";

type PathSegment = string | number;

function parseFieldPath(fieldPath: string): PathSegment[] {
  const segments: PathSegment[] = [];
  const pattern = /([^.\[\]]+)|\[(\d+)\]/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(fieldPath)) !== null) {
    if (match[1] !== undefined) {
      segments.push(match[1]);
    } else if (match[2] !== undefined) {
      segments.push(Number.parseInt(match[2], 10));
    }
  }

  return segments;
}

export function getValueAtFieldPath(root: unknown, fieldPath: string): unknown {
  let current: unknown = root;
  for (const segment of parseFieldPath(fieldPath)) {
    if (current === null || current === undefined) return undefined;
    if (typeof segment === "number") {
      current = (current as unknown[])[segment];
    } else {
      current = (current as Record<string, unknown>)[segment];
    }
  }
  return current;
}

export function setValueAtFieldPath(
  root: unknown,
  fieldPath: string,
  value: string,
): void {
  const segments = parseFieldPath(fieldPath);
  if (segments.length === 0) {
    throw new Error(`Invalid field path: ${fieldPath}`);
  }

  let current: unknown = root;
  for (let index = 0; index < segments.length - 1; index++) {
    const segment = segments[index]!;
    if (typeof segment === "number") {
      current = (current as unknown[])[segment];
    } else {
      current = (current as Record<string, unknown>)[segment];
    }
    if (current === null || current === undefined) {
      throw new Error(`Missing path segment for ${fieldPath}`);
    }
  }

  const last = segments[segments.length - 1]!;
  if (typeof last === "number") {
    (current as unknown[])[last] = value;
  } else {
    (current as Record<string, unknown>)[last] = value;
  }
}

export function cloneCanonicalPackage(
  source: LocalizedLessonPackage,
): LocalizedLessonPackage {
  return structuredClone(source);
}

export function buildAdaptedPackageShell(
  source: LocalizedLessonPackage,
  targetLocale: AdaptationTargetLocale,
  generatedAt: string,
): AdaptedLessonPackage {
  const cloned = cloneCanonicalPackage(source);
  const { sourceFile: _sourceFile, ...rest } = cloned;

  return {
    ...rest,
    locale: targetLocale,
    adaptedFrom: {
      locale: "ar-MSA",
      lessonId: source.lessonId,
      canonicalVersion: source.canonicalVersion,
      sourcePackagePath: source.sourceFile,
    },
    generatedAt,
  };
}

/** Deep-clone canonical JSON and replace only extracted text field paths. */
export function injectLocalizedFields(
  source: LocalizedLessonPackage,
  textMap: LocalizedTextMap,
  targetLocale: AdaptationTargetLocale,
  generatedAt: string,
): AdaptedLessonPackage {
  if (textMap.lessonId !== source.lessonId) {
    throw new Error(
      `text map lessonId ${textMap.lessonId} does not match source ${source.lessonId}`,
    );
  }

  const artifact = buildAdaptedPackageShell(source, targetLocale, generatedAt);

  for (const field of textMap.fields) {
    const before = getValueAtFieldPath(artifact, field.fieldPath);
    if (typeof before !== "string") {
      throw new Error(
        `Cannot inject non-string field at ${field.fieldPath} for ${source.lessonId}`,
      );
    }
    setValueAtFieldPath(artifact, field.fieldPath, localizedTextForField(field));
  }

  return artifact;
}
