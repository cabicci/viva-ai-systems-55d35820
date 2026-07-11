import { readFileSync } from "node:fs";
import path from "node:path";
import type { LocalizedLessonPackage } from "../../../src/lib/locale-lessons/types.ts";
import { sha256Hex } from "./checksum.ts";
import { localeLessonsDir } from "./paths.ts";
import type { ExtractedScript, VideoLocale } from "./types.ts";

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\|[^|\n]+\|/g, " ")
    .replace(/#{1,6}\s+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractScriptFromPackage(
  pkg: LocalizedLessonPackage,
): ExtractedScript {
  const sections = pkg.sections.map((s) => {
    const parts = [s.contentMarkdown, ...s.bullets].filter(Boolean);
    const raw = parts.join("\n");
    return {
      role: s.role,
      heading: s.heading,
      text: stripMarkdown(raw),
    };
  });

  const fullText = sections.map((s) => s.text).join("\n\n");

  return {
    lessonId: pkg.lessonId,
    locale: pkg.locale as VideoLocale,
    title: pkg.title,
    sections,
    fullText,
    checksum: sha256Hex(fullText),
  };
}

export function extractScript(locale: VideoLocale, lessonId: string): ExtractedScript {
  const abs = path.join(localeLessonsDir(locale), `${lessonId}.json`);
  const pkg = JSON.parse(readFileSync(abs, "utf8")) as LocalizedLessonPackage;
  if (pkg.locale !== locale) {
    throw new Error(`Locale mismatch in ${abs}: expected ${locale}, got ${pkg.locale}`);
  }
  return extractScriptFromPackage(pkg);
}

export function extractAllScripts(
  entries: Array<{ locale: VideoLocale; lessonId: string }>,
): ExtractedScript[] {
  return entries.map((e) => extractScript(e.locale, e.lessonId));
}
