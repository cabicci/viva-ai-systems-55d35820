/**
 * Lightweight regex-based parser for ar-EG lesson TS block files
 * (src/components/intro/lessons/{id}.ts). We deliberately avoid a full
 * TS/AST parser: these files are machine-formatted with a consistent
 * "Lesson Shape pilot" layout (array of `{ icon, eyebrow, title, tone?,
 * block: {...} }` objects), so a small string/bracket-aware scanner is
 * enough to recover real lesson content for master authoring.
 */

export interface ArEgComparison {
  leftLabel: string;
  leftBody: string;
  rightLabel: string;
  rightBody: string;
}

export interface ArEgConceptItem {
  term: string;
  meaning: string;
  example: string;
}

export interface ArEgRubricItem {
  label: string;
  weight: number;
}

export interface ArEgSection {
  eyebrow: string;
  title: string;
  kind: string;
  raw: string;
  paragraphs?: string[];
  comparison?: ArEgComparison;
  concepts?: ArEgConceptItem[];
  screenshot?: { src?: string; alt?: string; caption?: string; label?: string };
  diagram?: { id?: string; label?: string; caption?: string };
  mission?: { intro?: string; rubric: ArEgRubricItem[] };
}

export interface ArEgParseResult {
  sections: ArEgSection[];
  orientationParagraphs: string[];
  tensionParagraphs: string[];
  coreIdeaTitle: string;
  coreIdeaParagraphs: string[];
  comparison: ArEgComparison | null;
  concepts: ArEgConceptItem[];
  missionIntro: string;
  missionRubric: ArEgRubricItem[];
  visual: { kind: "screenshot" | "diagram" | null; caption: string; captionRaw: string; id?: string; label?: string; alt?: string };
  warnings: string[];
}

/** Unescape a simple JS double-quoted string body (\\n, \\", \\\\) for display. */
export function unescapeJsString(raw: string): string {
  return raw
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

/** Find the index of the character matching the bracket/brace/paren at openIdx, skipping string literals. */
function findMatching(text: string, openIdx: number): number {
  const open = text[openIdx];
  const close = open === "{" ? "}" : open === "[" ? "]" : open === "(" ? ")" : null;
  if (!close) return -1;
  let depth = 0;
  let i = openIdx;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      i++;
      while (i < text.length) {
        if (text[i] === "\\") {
          i += 2;
          continue;
        }
        if (text[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return -1;
}

/** Split all top-level `{ ... }` object literals inside `text` (string-literal aware). */
function splitTopLevelObjects(text: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      i++;
      while (i < text.length) {
        if (text[i] === "\\") {
          i += 2;
          continue;
        }
        if (text[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      continue;
    }
    if (ch === "{") {
      const end = findMatching(text, i);
      if (end === -1) break;
      out.push(text.slice(i, end + 1));
      i = end + 1;
      continue;
    }
    i++;
  }
  return out;
}

function matchField(text: string, field: string): string | null {
  const re = new RegExp(`\\b${field}\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, "s");
  const m = re.exec(text);
  return m ? m[1] : null;
}

function matchNumberField(text: string, field: string): number | null {
  const re = new RegExp(`\\b${field}\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`);
  const m = re.exec(text);
  return m ? Number(m[1]) : null;
}

function extractBracketBody(text: string, field: string, openChar: "[" | "{"): string | null {
  const re = new RegExp(`\\b${field}\\s*:\\s*\\${openChar}`);
  const m = re.exec(text);
  if (!m) return null;
  const openIdx = m.index + m[0].length - 1;
  const closeIdx = findMatching(text, openIdx);
  if (closeIdx === -1) return null;
  return text.slice(openIdx + 1, closeIdx);
}

/** Extract every top-level double-quoted string literal inside an array body. */
function extractStringArray(arrayBody: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < arrayBody.length) {
    const ch = arrayBody[i];
    if (ch === '"') {
      let j = i + 1;
      let buf = "";
      while (j < arrayBody.length && arrayBody[j] !== '"') {
        if (arrayBody[j] === "\\") {
          buf += arrayBody[j] + (arrayBody[j + 1] ?? "");
          j += 2;
          continue;
        }
        buf += arrayBody[j];
        j++;
      }
      out.push(unescapeJsString(buf));
      i = j + 1;
      continue;
    }
    i++;
  }
  return out;
}

export function parseArEgLessonFile(raw: string, warnings: string[] = []): ArEgParseResult {
  const arrayMatch = /:\s*IntroLessonContent\s*=\s*\[/.exec(raw);
  let body = raw;
  if (arrayMatch) {
    const openIdx = arrayMatch.index + arrayMatch[0].length - 1;
    const closeIdx = findMatching(raw, openIdx);
    body = closeIdx !== -1 ? raw.slice(openIdx + 1, closeIdx) : raw;
  } else {
    warnings.push("ar-EG: could not locate IntroLessonContent array literal; scanning whole file");
  }

  const objects = splitTopLevelObjects(body);
  const sections: ArEgSection[] = [];

  for (const obj of objects) {
    const eyebrow = matchField(obj, "eyebrow") ?? "";
    const title = matchField(obj, "title") ?? "";
    const blockBody = extractBracketBody(obj, "block", "{");
    if (blockBody === null) continue;
    const kind = matchField(blockBody, "kind") ?? "";

    const section: ArEgSection = {
      eyebrow: unescapeJsString(eyebrow),
      title: unescapeJsString(title),
      kind,
      raw: blockBody,
    };

    if (kind === "paragraphs") {
      const arrBody = extractBracketBody(blockBody, "paragraphs", "[");
      section.paragraphs = arrBody ? extractStringArray(arrBody) : [];
    } else if (kind === "comparison") {
      const leftBody = extractBracketBody(blockBody, "left", "{");
      const rightBody = extractBracketBody(blockBody, "right", "{");
      if (leftBody && rightBody) {
        section.comparison = {
          leftLabel: unescapeJsString(matchField(leftBody, "label") ?? ""),
          leftBody: unescapeJsString(matchField(leftBody, "body") ?? ""),
          rightLabel: unescapeJsString(matchField(rightBody, "label") ?? ""),
          rightBody: unescapeJsString(matchField(rightBody, "body") ?? ""),
        };
      }
    } else if (kind === "concepts") {
      const itemsBody = extractBracketBody(blockBody, "items", "[");
      const items: ArEgConceptItem[] = [];
      if (itemsBody) {
        for (const itemObj of splitTopLevelObjects(itemsBody)) {
          items.push({
            term: unescapeJsString(matchField(itemObj, "term") ?? ""),
            meaning: unescapeJsString(matchField(itemObj, "meaning") ?? ""),
            example: unescapeJsString(matchField(itemObj, "example") ?? ""),
          });
        }
      }
      section.concepts = items;
    } else if (kind === "screenshot") {
      section.screenshot = {
        alt: unescapeJsString(matchField(blockBody, "alt") ?? ""),
        caption: unescapeJsString(matchField(blockBody, "caption") ?? ""),
        label: unescapeJsString(matchField(blockBody, "label") ?? ""),
      };
    } else if (kind === "diagram") {
      section.diagram = {
        id: matchField(blockBody, "id") ?? undefined,
        label: unescapeJsString(matchField(blockBody, "label") ?? ""),
        caption: unescapeJsString(matchField(blockBody, "caption") ?? ""),
      };
    } else if (kind === "mission") {
      const intro = matchField(blockBody, "intro") ?? "";
      const rubricArrBody = extractBracketBody(blockBody, "rubric", "[");
      const rubric: ArEgRubricItem[] = [];
      if (rubricArrBody) {
        for (const itemObj of splitTopLevelObjects(rubricArrBody)) {
          const label = matchField(itemObj, "label");
          const weight = matchNumberField(itemObj, "weight");
          if (label !== null && weight !== null) {
            rubric.push({ label: unescapeJsString(label), weight });
          }
        }
      }
      section.mission = { intro: unescapeJsString(intro), rubric };
    }

    sections.push(section);
  }

  const paragraphSections = sections.filter((s) => s.kind === "paragraphs");
  const orientationParagraphs = paragraphSections[0]?.paragraphs ?? [];
  const tensionParagraphs = paragraphSections[1]?.paragraphs ?? [];
  const coreIdeaSection = paragraphSections[2];
  const coreIdeaParagraphs = coreIdeaSection?.paragraphs ?? [];
  const coreIdeaTitle = coreIdeaSection?.title ?? sections[0]?.title ?? "";

  const comparisonSection = sections.find((s) => s.kind === "comparison");
  const comparison = comparisonSection?.comparison ?? null;

  const conceptsSection = sections.find((s) => s.kind === "concepts");
  const concepts = conceptsSection?.concepts ?? [];

  const missionSection = sections.find((s) => s.kind === "mission");
  const missionIntro = missionSection?.mission?.intro ?? "";
  const missionRubric = missionSection?.mission?.rubric ?? [];

  const screenshotSection = sections.find((s) => s.kind === "screenshot");
  const diagramSection = sections.find((s) => s.kind === "diagram");
  const visual: ArEgParseResult["visual"] = screenshotSection
    ? {
        kind: "screenshot",
        caption: screenshotSection.screenshot?.caption ?? "",
        captionRaw: matchField(screenshotSection.raw, "caption") ?? "",
        alt: screenshotSection.screenshot?.alt ?? "",
      }
    : diagramSection
      ? {
          kind: "diagram",
          caption: diagramSection.diagram?.caption ?? "",
          captionRaw: matchField(diagramSection.raw, "caption") ?? "",
          id: diagramSection.diagram?.id,
          label: diagramSection.diagram?.label,
        }
      : { kind: null, caption: "", captionRaw: "" };

  if (!comparison) warnings.push("ar-EG: no comparison block found");
  if (orientationParagraphs.length === 0) warnings.push("ar-EG: no orientation paragraphs found");
  if (!coreIdeaTitle) warnings.push("ar-EG: no core-idea title found");
  if (!visual.kind) warnings.push("ar-EG: no screenshot/diagram block found");

  return {
    sections,
    orientationParagraphs,
    tensionParagraphs,
    coreIdeaTitle,
    coreIdeaParagraphs,
    comparison,
    concepts,
    missionIntro,
    missionRubric,
    visual,
    warnings,
  };
}
