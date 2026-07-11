import type { ExtractedScript, ScriptValidationResult, VideoLocale } from "./types.ts";
import { extractScript } from "./script-extract.ts";

const MIN_SCRIPT_CHARS = 80;

export function validateScript(
  locale: VideoLocale,
  lessonId: string,
  expectedLocale?: VideoLocale,
): ScriptValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let script: ExtractedScript;
  try {
    script = extractScript(locale, lessonId);
  } catch (err) {
    return {
      ok: false,
      lessonId,
      locale,
      errors: [`Failed to extract script: ${(err as Error).message}`],
      warnings,
    };
  }

  if (script.locale !== locale) {
    errors.push(`Script locale ${script.locale} !== expected ${locale}`);
  }
  if (expectedLocale && script.locale !== expectedLocale) {
    errors.push(`Script locale mismatch with manifest: ${expectedLocale}`);
  }
  if (script.lessonId !== lessonId) {
    errors.push(`Script lessonId ${script.lessonId} !== expected ${lessonId}`);
  }
  if (script.fullText.length < MIN_SCRIPT_CHARS) {
    errors.push(`Script too short (${script.fullText.length} chars, min ${MIN_SCRIPT_CHARS})`);
  }
  if (script.sections.length === 0) {
    errors.push("Script has no sections");
  }

  return {
    ok: errors.length === 0,
    lessonId,
    locale,
    errors,
    warnings,
  };
}

export function detectCrossLocaleContamination(
  scripts: ExtractedScript[],
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const byLesson = new Map<string, ExtractedScript[]>();

  for (const s of scripts) {
    const list = byLesson.get(s.lessonId) ?? [];
    list.push(s);
    byLesson.set(s.lessonId, list);
  }

  for (const [lessonId, group] of byLesson) {
    if (group.length < 2) continue;
    const checksums = new Set(group.map((s) => s.checksum));
    if (checksums.size < group.length) {
      errors.push(
        `${lessonId}: identical script checksum across locales — cross-locale contamination`,
      );
    }
    const texts = group.map((s) => `${s.locale}:${s.fullText.slice(0, 200)}`);
    const uniqueTexts = new Set(texts);
    if (uniqueTexts.size < group.length) {
      errors.push(`${lessonId}: duplicate script text prefix across locales`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateScriptDeterminism(
  locale: VideoLocale,
  lessonId: string,
): { ok: boolean; checksumA: string; checksumB: string } {
  const a = extractScript(locale, lessonId);
  const b = extractScript(locale, lessonId);
  return {
    ok: a.checksum === b.checksum,
    checksumA: a.checksum,
    checksumB: b.checksum,
  };
}
