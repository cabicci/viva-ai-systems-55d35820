import fs from "node:fs";
import path from "node:path";

export type ScientificCorrectionCategory =
  | "ar-MSA-quiz-corruption"
  | "ar-Gulf-generic-quiz"
  | "en-generic-quiz"
  | "en-placeholder-distractor"
  | "en-production-residue-visual";

export interface ScientificQuizReplacement {
  question: string;
  options: [string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface ScientificCorrectionRecord {
  issueId: string;
  lessonId: string;
  locale: "ar-MSA" | "ar-Gulf" | "en";
  category: ScientificCorrectionCategory;
  runtimePackagePath: string;
  recoveredPackagePath: string;
  sectionIndex: number;
  fieldPaths: string[];
  approvedReplacementQuiz?: ScientificQuizReplacement;
  approvedReplacementContentMarkdown: string;
  currentEvidenceQuiz?: ScientificQuizReplacement;
  severity: "Critical" | "High" | "Medium" | "Low";
  RAGReindexRequired: true;
  VideoRegenerationRequired: false;
}

const TRANSCRIPT_PATH =
  "C:/Users/HI-TECH/.cursor/projects/e-Masaarat-viva-ai-systems-55d35820/agent-transcripts/70630150-44fd-48a4-93a8-9bded6a4891a/70630150-44fd-48a4-93a8-9bded6a4891a.jsonl";

const CATEGORY_BY_GROUP: Record<string, ScientificCorrectionCategory> = {
  "GROUP A": "ar-MSA-quiz-corruption",
  "GROUP B": "ar-Gulf-generic-quiz",
  "GROUP C": "en-generic-quiz",
  "GROUP D": "en-placeholder-distractor",
  "GROUP E": "en-production-residue-visual",
};

export const AG4_ISSUE_ID_PATTERN = /^AG4-(?:ARMSA|ARGULF|EN-(?:QUIZ|PLACE|VIS))-\d{3}$/;

const AG4_HEADER_ISSUE_ID_PATTERN =
  /^#### (AG4-(?:ARMSA|ARGULF|EN-(?:QUIZ|PLACE|VIS))-\d{3})/;

function recoveredPathFor(locale: string, lessonId: string): string {
  return `src/lib/locale-lessons/ar-MSA/reports/phase13b-recovered-packages/${locale}/${lessonId}.json`;
}

function runtimePathFor(locale: string, lessonId: string): string {
  return `src/lib/locale-lessons/${locale}/lessons/${lessonId}.json`;
}

const LOCALE_BY_GROUP: Record<string, ScientificCorrectionRecord["locale"]> = {
  "GROUP A": "ar-MSA",
  "GROUP B": "ar-Gulf",
  "GROUP C": "en",
  "GROUP D": "en",
  "GROUP E": "en",
};

function tableValue(section: string, key: string): string | undefined {
  const re = new RegExp(`\\|\\s*${key}\\s*\\|\\s*\`([^\`]+)\`\\s*\\|`);
  const match = section.match(re)?.[1];
  if (match) return match;
  if (key === "fieldPath") {
    const fieldRe = /\|\s*fieldPath\s*\|\s*`(sections\[\d+\]\.[^`]+)`/;
    return section.match(fieldRe)?.[1];
  }
  return undefined;
}

function currentGroupLocale(text: string, position: number): ScientificCorrectionRecord["locale"] {
  let locale: ScientificCorrectionRecord["locale"] = "ar-MSA";
  for (const [group, value] of Object.entries(LOCALE_BY_GROUP)) {
    if (text.lastIndexOf(`### ${group}`, position) >= 0) locale = value;
  }
  return locale;
}

function tablePlainValue(section: string, key: string): string | undefined {
  const re = new RegExp(`\\|\\s*${key}\\s*\\|\\s*([^|\\n]+)\\s*\\|`);
  return section.match(re)?.[1]?.trim();
}

function parseSectionIndex(fieldPath: string): number {
  const match = fieldPath.match(/sections\[(\d+)\]/);
  if (!match) throw new Error(`Cannot parse section index from: ${fieldPath}`);
  return Number(match[1]);
}

function parseCodeBlock(section: string, label: string): string | undefined {
  const marker = `**${label}:**`;
  const idx = section.indexOf(marker);
  if (idx < 0) return undefined;
  const after = section.slice(idx + marker.length);
  const fenceStart = after.indexOf("```");
  if (fenceStart < 0) return undefined;
  const rest = after.slice(fenceStart + 3);
  const langEnd = rest.indexOf("\n");
  const bodyStart = langEnd >= 0 ? langEnd + 1 : 0;
  const fenceEnd = rest.indexOf("```", bodyStart);
  if (fenceEnd < 0) return undefined;
  return rest.slice(bodyStart, fenceEnd).trim();
}

function parseQuizBlock(section: string, label: string): ScientificQuizReplacement | undefined {
  const raw = parseCodeBlock(section, label);
  if (!raw) return undefined;
  const parsed = JSON.parse(raw) as ScientificQuizReplacement;
  if (!Array.isArray(parsed.options) || parsed.options.length !== 3) {
    throw new Error(`Quiz ${label} must have exactly 3 options`);
  }
  return parsed;
}

function currentGroupCategory(text: string, position: number): ScientificCorrectionCategory {
  let category: ScientificCorrectionCategory = "ar-MSA-quiz-corruption";
  for (const [group, cat] of Object.entries(CATEGORY_BY_GROUP)) {
    const idx = text.lastIndexOf(`### ${group}`, position);
    if (idx >= 0) category = cat;
  }
  return category;
}

function parseDetailedSections(text: string): ScientificCorrectionRecord[] {
  const chunks = text.split(/(?=#### AG4-)/).filter((s) => s.startsWith("#### AG4-"));
  const records: ScientificCorrectionRecord[] = [];

  for (const chunk of chunks) {
    const issueId = chunk.match(AG4_HEADER_ISSUE_ID_PATTERN)?.[1];
    if (!issueId) continue;

    const lessonId = tableValue(chunk, "lessonId");
    const locale =
      (tableValue(chunk, "locale") as ScientificCorrectionRecord["locale"] | undefined) ??
      currentGroupLocale(text, text.indexOf(chunk));
    const fieldPath = tableValue(chunk, "fieldPath");
    if (!lessonId || !fieldPath) {
      throw new Error(`Missing metadata for ${issueId}`);
    }

    const sectionIndex = parseSectionIndex(fieldPath);
    const category = currentGroupCategory(text, text.indexOf(chunk));
    const severity =
      (tablePlainValue(chunk, "severity") as ScientificCorrectionRecord["severity"]) ??
      (category === "ar-MSA-quiz-corruption"
        ? "Critical"
        : category === "en-production-residue-visual"
          ? "High"
          : "Medium");

    const approvedReplacementQuiz = parseQuizBlock(chunk, "approvedReplacementValue (quiz)");
    const approvedReplacementContentMarkdown = parseCodeBlock(
      chunk,
      "approvedReplacementValue (contentMarkdown)",
    );
    if (!approvedReplacementContentMarkdown) {
      throw new Error(`Missing approved contentMarkdown for ${issueId}`);
    }

    records.push({
      issueId,
      lessonId,
      locale,
      category,
      runtimePackagePath: runtimePathFor(locale, lessonId),
      recoveredPackagePath: recoveredPathFor(locale, lessonId),
      sectionIndex,
      fieldPaths: approvedReplacementQuiz
        ? [`sections[${sectionIndex}].quiz`, `sections[${sectionIndex}].contentMarkdown`]
        : [`sections[${sectionIndex}].contentMarkdown`],
      approvedReplacementQuiz,
      approvedReplacementContentMarkdown,
      currentEvidenceQuiz: parseQuizBlock(chunk, "currentValue (quiz)"),
      severity,
      RAGReindexRequired: true,
      VideoRegenerationRequired: false,
    });
  }

  return records;
}

function parseVisualTable(text: string): ScientificCorrectionRecord[] {
  const groupIdx = text.indexOf("### GROUP E");
  if (groupIdx < 0) throw new Error("GROUP E not found");
  const tableText = text.slice(groupIdx);
  const rows = [...tableText.matchAll(
    /\|\s*(AG4-EN-VIS-\d{3})\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/g,
  )];

  return rows.map((row) => {
    const [, issueId, lessonId, , approvedReplacementContentMarkdown] = row;
    if (!AG4_ISSUE_ID_PATTERN.test(issueId!)) {
      throw new Error(`Invalid visual issueId: ${issueId}`);
    }
    return {
      issueId: issueId!,
      lessonId: lessonId!,
      locale: "en" as const,
      category: "en-production-residue-visual" as const,
      runtimePackagePath: runtimePathFor("en", lessonId!),
      recoveredPackagePath: recoveredPathFor("en", lessonId!),
      sectionIndex: 5,
      fieldPaths: ["sections[5].contentMarkdown"],
      approvedReplacementContentMarkdown: approvedReplacementContentMarkdown!,
      severity: "High" as const,
      RAGReindexRequired: true as const,
      VideoRegenerationRequired: false as const,
    };
  });
}

export function loadAgent4ReportText(): string {
  const raw = fs.readFileSync(TRANSCRIPT_PATH, "utf8");
  const lines = raw.trim().split("\n");
  const obj = JSON.parse(lines[53]) as {
    message: { content: Array<{ type: string; text?: string }> };
  };
  const text = obj.message.content.find((c) => c.type === "text")?.text;
  if (!text) throw new Error("Agent 4 report text not found in transcript");
  return text;
}

export function buildScientificCorrectionManifest(): ScientificCorrectionRecord[] {
  const text = loadAgent4ReportText();
  const records = [...parseDetailedSections(text), ...parseVisualTable(text)];
  records.sort((a, b) => a.issueId.localeCompare(b.issueId));
  return records;
}

export function assertManifestInvariants(records: ScientificCorrectionRecord[]): void {
  if (records.length !== 40) {
    throw new Error(`Expected 40 records, got ${records.length}`);
  }

  const uniquePackages = new Set(records.map((r) => `${r.locale}/${r.lessonId}`));
  if (uniquePackages.size !== 39) {
    throw new Error(`Expected 39 unique packages, got ${uniquePackages.size}`);
  }

  const quizRecords = records.filter((r) => r.approvedReplacementQuiz);
  const visualRecords = records.filter((r) => !r.approvedReplacementQuiz);
  if (quizRecords.length !== 22) {
    throw new Error(`Expected 22 quiz records, got ${quizRecords.length}`);
  }
  if (visualRecords.length !== 18) {
    throw new Error(`Expected 18 visual records, got ${visualRecords.length}`);
  }

  const categories: Record<string, number> = {};
  for (const r of records) categories[r.category] = (categories[r.category] ?? 0) + 1;

  const expected = {
    "ar-MSA-quiz-corruption": 13,
    "ar-Gulf-generic-quiz": 5,
    "en-generic-quiz": 2,
    "en-placeholder-distractor": 2,
    "en-production-residue-visual": 18,
  };
  for (const [cat, count] of Object.entries(expected)) {
    if (categories[cat] !== count) {
      throw new Error(`Category ${cat}: expected ${count}, got ${categories[cat] ?? 0}`);
    }
  }
}

export function writeManifestFixture(outPath?: string): ScientificCorrectionRecord[] {
  const records = buildScientificCorrectionManifest();
  assertManifestInvariants(records);
  const target =
    outPath ??
    path.resolve(
      import.meta.dirname,
      "../../__tests__/fixtures/scientific-curriculum-corrections-manifest.json",
    );
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  return records;
}

if (import.meta.main) {
  const records = writeManifestFixture();
  console.log(
    JSON.stringify(
      {
        records: records.length,
        uniquePackages: new Set(records.map((r) => `${r.locale}/${r.lessonId}`)).size,
        quizRecords: records.filter((r) => r.approvedReplacementQuiz).length,
        visualRecords: records.filter((r) => !r.approvedReplacementQuiz).length,
        ids: records.map((r) => r.issueId),
      },
      null,
      2,
    ),
  );
}
