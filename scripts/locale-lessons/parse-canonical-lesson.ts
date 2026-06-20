import type {
  LocalizedLessonMission,
  LocalizedLessonPackage,
  LocalizedLessonQuiz,
  LocalizedLessonRubricRow,
  LocalizedLessonSection,
  LocalizedLessonTable,
} from "../../src/lib/locale-lessons/types.ts";

function readMetadataField(md: string, field: string): string | undefined {
  const re = new RegExp(`\\*\\*${field}\\*\\*\\s*\\|\\s*\`([^\`]+)\``, "i");
  return md.match(re)?.[1]?.trim();
}

function readYamlScalar(yaml: string, key: string): string | undefined {
  const re = new RegExp(`^\\s*${key}:\\s*(.+)$`, "m");
  const raw = yaml.match(re)?.[1]?.trim();
  if (!raw) return undefined;
  return raw.replace(/^["']|["']$/g, "");
}

function readYamlNumber(yaml: string, key: string): number | undefined {
  const value = readYamlScalar(yaml, key);
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function readYamlNestedScalar(
  yaml: string,
  parent: string,
  key: string,
): string | undefined {
  const block = yaml.match(
    new RegExp(
      `^\\s*${parent}:\\n([\\s\\S]*?)(?=^[a-z][a-z0-9_]*:|\\Z)`,
      "m",
    ),
  )?.[1];
  if (!block) return undefined;
  return readYamlScalar(block, key);
}

function readYamlNestedNumber(
  yaml: string,
  parent: string,
  key: string,
): number | undefined {
  const block = yaml.match(
    new RegExp(
      `^\\s*${parent}:\\n([\\s\\S]*?)(?=^[a-z][a-z0-9_]*:|\\Z)`,
      "m",
    ),
  )?.[1];
  if (!block) return undefined;
  return readYamlNumber(block, key);
}

function parseMarkdownTable(tableText: string): LocalizedLessonTable | null {
  const lines = tableText
    .trim()
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));
  if (lines.length < 2) return null;

  const splitRow = (line: string) =>
    line
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());

  const headers = splitRow(lines[0]);
  const rows = lines.slice(2).map(splitRow);
  return { headers, rows };
}

function parseBullets(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
}

function parseNumberedList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s/.test(line))
    .map((line) => line.replace(/^\d+\.\s*/, "").trim());
}

function extractTables(text: string): {
  tables: LocalizedLessonTable[];
  withoutTables: string;
} {
  const tables: LocalizedLessonTable[] = [];
  const withoutTables = text.replace(
    /(\|[^\n]+\|\n\|[-:\s|]+\|\n(?:\|[^\n]+\|\n?)+)/g,
    (block) => {
      const parsed = parseMarkdownTable(block);
      if (parsed) tables.push(parsed);
      return "";
    },
  );
  return { tables, withoutTables };
}

function parseQuizSection(content: string): LocalizedLessonQuiz | undefined {
  const correctIndexMatch =
    content.match(/correctIndex:\s*(\d+)/i) ??
    content.match(/\(correctIndex:\s*(\d+)\)/i);
  const questionMatch = content.match(/\*\*السؤال:\*\*\s*(.+)/);
  const explanationMatch = content.match(/\*\*التفسير:\*\*\s*(.+)/);

  const options = parseBullets(content).filter((line) =>
    /^(?:\*\*)?(?:الإجابة الصحيحة|خيار)/i.test(line),
  );

  if (
    !questionMatch &&
    !correctIndexMatch &&
    options.length === 0 &&
    !explanationMatch
  ) {
    return undefined;
  }

  return {
    question: questionMatch?.[1]?.trim(),
    correctIndex: correctIndexMatch
      ? Number(correctIndexMatch[1])
      : undefined,
    options,
    explanation: explanationMatch?.[1]?.trim(),
  };
}

function parseMissionSection(content: string): LocalizedLessonMission | undefined {
  const introMatch = content.match(/\*\*المقدمة:\*\*\s*([\s\S]*?)(?=\n\*\*|$)/);
  const deliveryHeader = content.indexOf("**التسليم:**");
  const rubricHeader = content.indexOf("**معايير التقييم");

  let deliveryBlock = "";
  if (deliveryHeader >= 0) {
    const end =
      rubricHeader >= 0 ? rubricHeader : content.length;
    deliveryBlock = content.slice(deliveryHeader, end);
  }

  const { tables } = extractTables(content);
  const rubricTable = tables.find(
    (table) =>
      table.headers.some((h) => /البعد|الوزن|المعيار/i.test(h)) &&
      table.rows.length > 0,
  );

  const rubric: LocalizedLessonRubricRow[] =
    rubricTable?.rows.map((row) => ({
      dimension: row[0] ?? "",
      weight: Number.parseInt((row[1] ?? "").replace(/[^\d]/g, ""), 10) || 0,
      criteria: row[2] ?? "",
    })) ?? [];

  const delivery = parseNumberedList(deliveryBlock);
  const intro = introMatch?.[1]?.replace(/\n+/g, " ").trim();

  if (!intro && delivery.length === 0 && rubric.length === 0) {
    return undefined;
  }

  return { intro, delivery, rubric };
}

function enrichSection(section: LocalizedLessonSection): void {
  const { tables, withoutTables } = extractTables(section.contentMarkdown);
  section.tables = tables;
  section.bullets = parseBullets(withoutTables);

  const roleKey = section.role.toLowerCase();
  if (roleKey.includes("quiz")) {
    section.quiz = parseQuizSection(section.contentMarkdown);
  }
  if (roleKey.includes("mission")) {
    section.mission = parseMissionSection(section.contentMarkdown);
  }
}

export function parseMsaSections(msaSection: string): LocalizedLessonSection[] {
  const lines = msaSection.split("\n");
  const sections: LocalizedLessonSection[] = [];
  let current: LocalizedLessonSection | null = null;
  let bodyLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("### ")) {
      if (current) {
        current.contentMarkdown = bodyLines.join("\n").trim();
        enrichSection(current);
        sections.push(current);
      }

      const heading = line.slice(4).trim();
      const dashIdx = heading.indexOf(" — ");
      const role = dashIdx >= 0 ? heading.slice(0, dashIdx).trim() : heading;
      const subtitle = dashIdx >= 0 ? heading.slice(dashIdx + 3).trim() : undefined;

      current = {
        role,
        heading,
        subtitle,
        contentMarkdown: "",
        bullets: [],
        tables: [],
      };
      bodyLines = [];
      continue;
    }

    if (!current) continue;
    if (line.startsWith("> **Dialect:**")) continue;
    bodyLines.push(line);
  }

  if (current) {
    current.contentMarkdown = bodyLines.join("\n").trim();
    enrichSection(current);
    sections.push(current);
  }

  return sections;
}

function readMissionYaml(yaml: string): {
  type?: string;
  intent?: string;
} {
  const missionBlock = yaml.match(
    /^\s*mission:\n([\s\S]*?)(?=^[a-z][a-z0-9_]*:|\Z)/m,
  )?.[1];
  if (!missionBlock) return {};
  return {
    type: readYamlScalar(missionBlock, "type"),
    intent: readYamlScalar(missionBlock, "intent"),
  };
}

function normalizeMarkdown(md: string): string {
  return md.replace(/\r\n/g, "\n");
}

function extractYamlBlock(md: string): string {
  const match = md.match(/```yaml\r?\n([\s\S]*?)```/);
  return match?.[1]?.trim() ?? "";
}

function extractMsaSection(md: string): string {
  const match = md.match(
    /## 4\. Arabic MSA canonical lesson text([\s\S]*?)(?=## 5\.)/,
  );
  return match?.[1]?.trim() ?? "";
}

export function parseCanonicalLessonMarkdown(
  md: string,
  sourceFile: string,
  generatedAt: string,
): LocalizedLessonPackage {
  const normalized = normalizeMarkdown(md);
  const yamlBlock = extractYamlBlock(normalized);
  const msaSection = extractMsaSection(normalized);

  if (!yamlBlock) {
    throw new Error(`missing yaml block in ${sourceFile}`);
  }
  if (!msaSection) {
    throw new Error(`missing §4 MSA text in ${sourceFile}`);
  }

  const lessonId = readYamlScalar(yamlBlock, "lessonId");
  if (!lessonId) {
    throw new Error(`missing lessonId in yaml for ${sourceFile}`);
  }

  const sections = parseMsaSections(msaSection);
  const firstSubtitle = sections.find((s) => s.subtitle)?.subtitle;
  const titleEn = readYamlNestedScalar(yamlBlock, "meta", "title");
  const productionTitle =
    normalized.match(/\*\*productionTitle \(ar-EG\)\*\*\s*\|\s*([^\|]+)\|/i)?.[1]?.trim() ??
    readMetadataField(normalized, "productionTitle");

  const missionYaml = readMissionYaml(yamlBlock);
  const missionSection = sections.find((s) =>
    s.role.toLowerCase().includes("mission"),
  );
  if (missionSection?.mission && missionYaml.intent) {
    missionSection.mission.yamlIntent = missionYaml.intent;
    missionSection.mission.yamlType = missionYaml.type;
  }

  return {
    locale: "ar-MSA",
    lessonId,
    canonicalVersion:
      readYamlScalar(yamlBlock, "canonicalVersion") ?? "unknown",
    pathId: readMetadataField(normalized, "pathId"),
    moduleId: readMetadataField(normalized, "moduleId"),
    productionRoute: readMetadataField(normalized, "productionRoute"),
    titleEn: titleEn?.replace(/^["']|["']$/g, ""),
    title: firstSubtitle ?? productionTitle ?? titleEn ?? lessonId,
    summary: readYamlNestedScalar(yamlBlock, "meta", "oneAha"),
    estimatedMinutes: readYamlNestedNumber(yamlBlock, "meta", "estimatedMinutes"),
    nextLessonId:
      readYamlNestedScalar(yamlBlock, "links", "nextLessonId") ??
      yamlBlock.match(/links:[\s\S]*?nextLessonId:\s*(\S+)/)?.[1],
    sections,
    sourceFile,
    generatedAt,
  };
}
