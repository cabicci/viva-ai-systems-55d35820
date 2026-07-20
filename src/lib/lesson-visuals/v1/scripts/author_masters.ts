/**
 * author_masters — builds docs/lesson-visuals/v1/masters/{lessonId}.master.json
 * for all 100 lessons in src/lib/locale-lessons/en/manifest.json, from the
 * real en / ar-MSA / ar-Gulf JSON packages and the ar-EG TS block files.
 *
 * Does NOT generate production visual assets. Does NOT commit/push/dispatch.
 * Run: bun run src/lib/lesson-visuals/v1/scripts/author_masters.ts
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type {
  ComparisonPack,
  ContentBrief,
  FactualClaim,
  LabelEntry,
  LessonVisualMaster,
  Locale,
  Method,
} from "../types";
import { BANNED_GENERIC_LABELS, LOCALES } from "../types";
import { canonicalChecksum } from "./canonical";
import { parseArEgLessonFile, unescapeJsString, type ArEgParseResult } from "./parse_ar_eg";

const SOURCE_SHA = "540582d10d12ca1e0aa3c7246daf7a70972c9ba5";
const REPO_ROOT = resolve(import.meta.dir, "../../../../..");
const MASTERS_DIR = resolve(REPO_ROOT, "docs/lesson-visuals/v1/masters");
const LEDGERS_DIR = resolve(REPO_ROOT, "docs/lesson-visuals/v1/ledgers");
const EN_MANIFEST_PATH = resolve(REPO_ROOT, "src/lib/locale-lessons/en/manifest.json");

// ---------------------------------------------------------------------------
// Locale package types (loose — we only read fields we need)
// ---------------------------------------------------------------------------

interface LessonTable {
  headers: string[];
  rows: string[][];
}

interface LessonSection {
  role: string;
  heading?: string;
  subtitle?: string;
  contentMarkdown: string;
  bullets: string[];
  tables: LessonTable[];
  mission?: {
    intro: string;
    delivery: string[];
    rubric: { dimension: string; weight: number; criteria: string }[];
  };
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

interface LocaleLessonJson {
  locale: string;
  lessonId: string;
  pathId: string;
  moduleId: string;
  title: string;
  titleEn?: string;
  summary: string;
  estimatedMinutes: number;
  sections: LessonSection[];
}

interface EnManifest {
  locale: string;
  lessonCount: number;
  requiredLessonCount: number;
  lessonIds: string[];
}

// ---------------------------------------------------------------------------
// Small string helpers
// ---------------------------------------------------------------------------

function loadJson<T>(absPath: string): T {
  return JSON.parse(readFileSync(absPath, "utf8")) as T;
}

function stripBold(s: string): string {
  return s.replace(/\*\*/g, "").trim();
}

function firstBold(md: string): string | null {
  const m = /\*\*(.+?)\*\*/.exec(md);
  return m ? m[1].trim() : null;
}

function findSectionByRole(data: LocaleLessonJson, re: RegExp): LessonSection | undefined {
  return data.sections.find((s) => re.test(s.role));
}

/** Concise real-content summary of a section: prefer bullets, else first paragraph. */
function sectionSummary(section: LessonSection | undefined, maxLen = 220): string {
  if (!section) return "";
  if (section.bullets && section.bullets.length > 0) {
    const text = stripBold(section.bullets.slice(0, 2).join(" "));
    return text.length > maxLen ? text.slice(0, maxLen).trim() : text;
  }
  const md = section.contentMarkdown ?? "";
  const firstPara = md.split(/\n\n/)[0] ?? md;
  const text = stripBold(firstPara).replace(/\s*\n\s*/g, " ").trim();
  return text.length > maxLen ? text.slice(0, maxLen).trim() : text;
}

function coreIdeaFromSection(section: LessonSection | undefined, maxLen = 220): string {
  if (!section) return "";
  const bold = firstBold(section.contentMarkdown ?? "");
  if (bold) return bold.length > maxLen ? bold.slice(0, maxLen).trim() : bold;
  return sectionSummary(section, maxLen);
}

/**
 * A quote candidate that is guaranteed to be a literal substring of the raw
 * source file: single line (JSON escapes real newlines, so crossing one
 * would break equality), no quote/backslash characters (those are escaped
 * differently on disk than in the decoded JS string).
 */
function cleanQuoteCandidate(s: string, maxLen = 120): string {
  let t = (s.split("\n")[0] ?? "").trim();
  const badIdx = t.search(/["\\]/);
  if (badIdx !== -1) t = t.slice(0, badIdx).trim();
  if (t.length > maxLen) t = t.slice(0, maxLen).trim();
  return t;
}

function isBanned(text: string): boolean {
  const t = text.trim();
  if (t.length === 0) return true;
  return (BANNED_GENERIC_LABELS as readonly string[]).some(
    (b) => b.toLowerCase() === t.toLowerCase(),
  );
}

function jsonComparisonFromTable(data: LocaleLessonJson): ComparisonPack | null {
  const section = findSectionByRole(data, /^Comparison$/);
  const table = section?.tables?.[0];
  if (!table || table.headers.length < 2 || (table.rows[0]?.length ?? 0) < 2) return null;
  return {
    leftLabel: stripBold(table.headers[0]),
    rightLabel: stripBold(table.headers[1]),
    leftBody: stripBold(table.rows[0][0]),
    rightBody: stripBold(table.rows[0][1]),
  };
}

/**
 * Fallback for the handful of short-form lessons that have no dedicated
 * Comparison section: derive a real, lesson-specific two-sided contrast from
 * Tension (the "before" friction) vs Core idea (the "after" resolution),
 * using their subtitles/bold headline as labels and a quiz's wrong-vs-right
 * options as the supporting bodies when available.
 */
function jsonComparisonFallback(data: LocaleLessonJson): ComparisonPack | null {
  const tensionSec = findSectionByRole(data, /^Tension$/);
  const coreSec = findSectionByRole(data, /^Core idea$/);
  const orientSec = findSectionByRole(data, /^Orientation$/);
  const quizSec = findSectionByRole(data, /^Quiz$/);

  const leftLabel =
    stripBold(tensionSec?.subtitle ?? "") ||
    firstBold(tensionSec?.contentMarkdown ?? "") ||
    tensionSec?.heading ||
    stripBold(orientSec?.subtitle ?? "") ||
    firstBold(orientSec?.contentMarkdown ?? "") ||
    orientSec?.heading ||
    `${data.title} — the friction`;
  const rightLabel =
    stripBold(coreSec?.subtitle ?? "") ||
    firstBold(coreSec?.contentMarkdown ?? "") ||
    coreSec?.heading ||
    `${data.title} — the resolution`;
  if (leftLabel.length < 2 || rightLabel.length < 2) return null;

  const quizOptions = quizSec?.quiz?.options ?? [];
  const correctIdx = quizSec?.quiz?.correctIndex ?? 0;
  const wrongOption = quizOptions.find((_, i) => i !== correctIdx);
  const rightOption = quizOptions[correctIdx];

  const leftBody =
    (wrongOption && stripBold(wrongOption)) ||
    sectionSummary(tensionSec, 200) ||
    sectionSummary(orientSec, 200) ||
    leftLabel;
  const rightBody = (rightOption && stripBold(rightOption)) || sectionSummary(coreSec, 200) || rightLabel;

  return { leftLabel, rightLabel, leftBody, rightBody };
}

function jsonComparison(data: LocaleLessonJson): ComparisonPack | null {
  return jsonComparisonFromTable(data) ?? jsonComparisonFallback(data);
}

function jsonGlossaryTerms(data: LocaleLessonJson): string[] {
  const section = findSectionByRole(data, /^Glossary$/);
  const table = section?.tables?.[0];
  if (!table) return [];
  return table.rows.map((row) => stripBold(row[0] ?? "")).filter((t) => t.length > 0);
}

function visualIntentRaw(data: LocaleLessonJson): "screenshot" | "diagram" | null {
  const s = data.sections.find((sec) => /Screenshot block/i.test(sec.role) || /Diagram block/i.test(sec.role));
  if (!s) return null;
  return /Screenshot block/i.test(s.role) ? "screenshot" : "diagram";
}

function visualSection(data: LocaleLessonJson): LessonSection | undefined {
  return data.sections.find((sec) => /Screenshot block/i.test(sec.role) || /Diagram block/i.test(sec.role));
}

// ---------------------------------------------------------------------------
// Diagram id -> contentBrief.visualIntent.kind classification (closed set,
// matches the `diagram.id` union in IntroBlock).
// ---------------------------------------------------------------------------

const DIAGRAM_KIND_MAP: Record<string, ContentBrief["visualIntent"]["kind"]> = {
  "audience-persona": "system",
  "content-pillars": "system",
  "platforms-grid": "system",
  "scheduling-calendar": "process",
  "analytics-triangle": "data-relationship",
  "leads-funnel": "process",
  "pattern-vs-outlier": "comparison",
  "customer-lifecycle-funnel": "process",
  "feeling-to-question-table": "comparison",
  "decision-loop": "decision",
  "question-scorecard": "data-relationship",
  "ai-summarization-flow": "process",
  "three-sources-merge": "process",
  "decision-chain": "decision",
  "four-kpi-dashboard": "data-relationship",
  "weekly-review-timeline": "process",
  "correlation-causation": "comparison",
  "question-rewrite": "comparison",
  "decision-backlog": "decision",
  "operator-vs-leader": "comparison",
  "reactive-vs-proactive-day": "comparison",
  "weekly-theme-days": "process",
  "followup-cadence": "process",
  "delegate-automate-matrix": "decision",
  "soa-bars": "data-relationship",
  "readiness-signals": "data-relationship",
  "system-then-people": "system",
  "premature-scaling-cliff": "process",
  "reactive-relapse-cycle": "process",
  "ecosystem-loop": "system",
};

const COMPOSITION_PATTERN_BY_KIND: Record<ContentBrief["visualIntent"]["kind"], string> = {
  decision: "decision-chain-panel",
  process: "process-stage-strip",
  system: "system-map-panel",
  "data-relationship": "kpi-grid-panel",
  comparison: "two-panel-comparison",
  screenshot: "hybrid-frame-with-labels",
  diagram: "system-map-panel",
  "concept-scene": "concept-scene-metaphor",
};

const METAPHOR_KEYWORDS: RegExp[] = [
  /\bfear\b/i,
  /\bafraid\b/i,
  /\banxiet(y|ies)\b/i,
  /\boverwhelm(ed|ing)?\b/i,
  /\bconfiden(t|ce)\b/i,
  /\bjourney\b/i,
  /\bmindset\b/i,
  /\bcalm\b/i,
  /\btrust\b/i,
  /\bbrave(ry)?\b/i,
  /\bcompass\b/i,
  /\bmirror\b/i,
  /\bbridge\b/i,
  /\bidentity\b/i,
  /\bpath\b/i,
  /\blens\b/i,
  /\bfeel(ing)?s?\b/i,
];

const CONCRETE_UI_KEYWORDS: RegExp[] = [
  /\bbox\b/i,
  /\blayout\b/i,
  /\bconversation\b/i,
  /\bchat\b/i,
  /\bdashboard\b/i,
  /\bscreen\b/i,
  /\bclick\b/i,
  /\bbutton\b/i,
  /\binterface\b/i,
  /\bform\b/i,
  /\bwebhook\b/i,
  /\bdatabase\b/i,
  /\btable\b/i,
  /\bapi\b/i,
];

const MAX_CONCEPT_SCENE_LESSONS = 12;

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

function localeJsonRelPath(locale: "en" | "ar-MSA" | "ar-Gulf", id: string): string {
  return `src/lib/locale-lessons/${locale}/lessons/${id}.json`;
}

function arEgRelPath(id: string): string {
  return `src/components/intro/lessons/${id}.ts`;
}

// ---------------------------------------------------------------------------
// Bundle loading
// ---------------------------------------------------------------------------

interface LessonBundle {
  lessonId: string;
  en: LocaleLessonJson;
  arMsa: LocaleLessonJson;
  arGulf: LocaleLessonJson;
  arEg: ArEgParseResult;
}

function loadBundle(lessonId: string, warnings: string[]): LessonBundle | null {
  const enPath = resolve(REPO_ROOT, localeJsonRelPath("en", lessonId));
  const msaPath = resolve(REPO_ROOT, localeJsonRelPath("ar-MSA", lessonId));
  const gulfPath = resolve(REPO_ROOT, localeJsonRelPath("ar-Gulf", lessonId));
  const arEgPath = resolve(REPO_ROOT, arEgRelPath(lessonId));

  for (const [label, p] of [
    ["en", enPath],
    ["ar-MSA", msaPath],
    ["ar-Gulf", gulfPath],
    ["ar-EG", arEgPath],
  ] as const) {
    if (!existsSync(p)) {
      warnings.push(`${lessonId}: missing ${label} source at ${p}`);
      return null;
    }
  }

  const en = loadJson<LocaleLessonJson>(enPath);
  const arMsa = loadJson<LocaleLessonJson>(msaPath);
  const arGulf = loadJson<LocaleLessonJson>(gulfPath);
  const arEgRaw = readFileSync(arEgPath, "utf8");
  const arEgWarnings: string[] = [];
  const arEg = parseArEgLessonFile(arEgRaw, arEgWarnings);
  for (const w of arEgWarnings) warnings.push(`${lessonId}: ${w}`);

  return { lessonId, en, arMsa, arGulf, arEg };
}

function metaphorScore(bundle: LessonBundle): number {
  const en = bundle.en;
  const orientation = sectionSummary(findSectionByRole(en, /^Orientation$/), 400);
  const tension = sectionSummary(findSectionByRole(en, /^Tension$/), 400);
  const coreIdea = coreIdeaFromSection(findSectionByRole(en, /^Core idea$/), 400);
  const visual = visualSection(en);
  const visualText = visual?.contentMarkdown ?? "";
  const blob = `${orientation} ${tension} ${coreIdea} ${visualText}`;

  let score = 0;
  for (const re of METAPHOR_KEYWORDS) if (re.test(blob)) score += 1;
  for (const re of CONCRETE_UI_KEYWORDS) if (re.test(visualText)) score -= 2;
  return score;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const parseFailures: string[] = [];
  const allWarnings: string[] = [];

  const enManifest = loadJson<EnManifest>(EN_MANIFEST_PATH);
  const lessonIds = enManifest.lessonIds;
  if (lessonIds.length !== 100) {
    throw new Error(`Expected exactly 100 lessonIds in en manifest, got ${lessonIds.length}`);
  }

  mkdirSync(MASTERS_DIR, { recursive: true });
  mkdirSync(LEDGERS_DIR, { recursive: true });

  const bundles: LessonBundle[] = [];
  for (const lessonId of lessonIds) {
    const warnings: string[] = [];
    const bundle = loadBundle(lessonId, warnings);
    allWarnings.push(...warnings);
    if (!bundle) {
      parseFailures.push(lessonId);
      continue;
    }
    bundles.push(bundle);
  }

  // Rank screenshot-intent lessons by metaphor score; top N (score > 0) become
  // method 2 (AI text-free concept-scene) instead of method 4 (hybrid).
  const screenshotBundles = bundles.filter((b) => visualIntentRaw(b.en) === "screenshot");
  const scored = screenshotBundles
    .map((b) => ({ lessonId: b.lessonId, score: metaphorScore(b) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.lessonId.localeCompare(b.lessonId));
  const conceptSceneLessonIds = new Set(
    scored.slice(0, MAX_CONCEPT_SCENE_LESSONS).map((x) => x.lessonId),
  );

  type MasterDraft = Omit<LessonVisualMaster, "checksum">;
  const drafts: MasterDraft[] = [];

  for (const bundle of bundles) {
    const { lessonId, en, arMsa, arGulf, arEg } = bundle;
    const pathId = en.pathId;
    const moduleId = en.moduleId;

    const titles: Record<Locale, string> = {
      en: en.title,
      "ar-MSA": arMsa.title,
      "ar-Gulf": arGulf.title,
      "ar-EG": arEg.coreIdeaTitle || en.title,
    };

    const sourcePackages: LessonVisualMaster["sourcePackages"] = {
      en: { path: localeJsonRelPath("en", lessonId), kind: "json" },
      "ar-MSA": { path: localeJsonRelPath("ar-MSA", lessonId), kind: "json" },
      "ar-Gulf": { path: localeJsonRelPath("ar-Gulf", lessonId), kind: "json" },
      "ar-EG": { path: arEgRelPath(lessonId), kind: "ts-blocks" },
    };

    // ---- contentBrief -----------------------------------------------------
    const orientation: Record<Locale, string[]> = {
      en: (findSectionByRole(en, /^Orientation$/)?.bullets ?? []).map(stripBold).filter(Boolean),
      "ar-MSA": (findSectionByRole(arMsa, /^Orientation$/)?.bullets ?? []).map(stripBold).filter(Boolean),
      "ar-Gulf": (findSectionByRole(arGulf, /^Orientation$/)?.bullets ?? []).map(stripBold).filter(Boolean),
      "ar-EG": arEg.orientationParagraphs.filter(Boolean),
    };
    for (const locale of LOCALES) {
      if (orientation[locale].length === 0) {
        orientation[locale] = [titles[locale]];
        allWarnings.push(`${lessonId}: empty orientation for ${locale}, used title fallback`);
      }
    }

    const coreIdea: Record<Locale, string> = {
      en: coreIdeaFromSection(findSectionByRole(en, /^Core idea$/)),
      "ar-MSA": coreIdeaFromSection(findSectionByRole(arMsa, /^Core idea$/)),
      "ar-Gulf": coreIdeaFromSection(findSectionByRole(arGulf, /^Core idea$/)),
      "ar-EG": arEg.coreIdeaParagraphs[0] || arEg.coreIdeaTitle,
    };

    const tension: Record<Locale, string> = {
      en: sectionSummary(findSectionByRole(en, /^Tension$/)),
      "ar-MSA": sectionSummary(findSectionByRole(arMsa, /^Tension$/)),
      "ar-Gulf": sectionSummary(findSectionByRole(arGulf, /^Tension$/)),
      "ar-EG": arEg.tensionParagraphs[0] || arEg.orientationParagraphs[0] || titles["ar-EG"],
    };

    const missionIntro: Record<Locale, string> = {
      en: stripBold(findSectionByRole(en, /^Mission$/)?.mission?.intro || sectionSummary(findSectionByRole(en, /^Mission$/))),
      "ar-MSA": stripBold(findSectionByRole(arMsa, /^Mission$/)?.mission?.intro || sectionSummary(findSectionByRole(arMsa, /^Mission$/))),
      "ar-Gulf": stripBold(findSectionByRole(arGulf, /^Mission$/)?.mission?.intro || sectionSummary(findSectionByRole(arGulf, /^Mission$/))),
      "ar-EG": arEg.missionIntro || tension["ar-EG"],
    };

    const cmpEn = jsonComparison(en);
    const cmpMsa = jsonComparison(arMsa);
    const cmpGulf = jsonComparison(arGulf);
    if (!cmpEn || !cmpMsa || !cmpGulf) {
      parseFailures.push(`${lessonId}: missing structured Comparison table in a JSON locale`);
      continue;
    }
    const cmpArEg: ComparisonPack = arEg.comparison ?? {
      leftLabel: cmpEn.leftLabel,
      rightLabel: cmpEn.rightLabel,
      leftBody: arEg.tensionParagraphs[0] ?? cmpEn.leftBody,
      rightBody: arEg.coreIdeaParagraphs[0] ?? cmpEn.rightBody,
    };
    const comparison: Record<Locale, ComparisonPack> = {
      en: cmpEn,
      "ar-MSA": cmpMsa,
      "ar-Gulf": cmpGulf,
      "ar-EG": cmpArEg,
    };

    // ---- visual intent classification --------------------------------------
    const intentRaw = visualIntentRaw(en) ?? visualIntentRaw(arMsa) ?? "screenshot";
    const isConceptScene = intentRaw === "screenshot" && conceptSceneLessonIds.has(lessonId);

    let kind: ContentBrief["visualIntent"]["kind"];
    let method: Method;
    let diagramId: string | undefined;

    if (intentRaw === "diagram") {
      diagramId = arEg.visual.id;
      kind = (diagramId && DIAGRAM_KIND_MAP[diagramId]) || "system";
      method = 1;
    } else if (isConceptScene) {
      kind = "concept-scene";
      method = 2;
    } else {
      kind = "screenshot";
      method = 4;
    }

    const visSectionEn = visualSection(en);
    const visSummarySource = visSectionEn?.contentMarkdown ?? coreIdea.en;
    const visualSummary = cleanQuoteCandidate(visSummarySource, 160) || `Visual relationship for ${lessonId}`;

    function packageQuoteFor(locale: Locale): { path: string; field: string; quote: string } {
      const path = sourcePackages[locale].path;
      if (locale === "ar-EG") {
        const raw = arEg.visual.captionRaw || arEg.visual.caption;
        const quote = cleanQuoteCandidate(unescapeJsString(raw), 120) || cleanQuoteCandidate(titles["ar-EG"], 60);
        return { path, field: `block.caption (${arEg.visual.kind ?? "unknown"})`, quote: quote || titles["ar-EG"].slice(0, 40) };
      }
      const data = locale === "en" ? en : locale === "ar-MSA" ? arMsa : arGulf;
      const sec = visualSection(data);
      const roleLabel = sec?.role ?? "Screenshot block (intent)";
      const quote = cleanQuoteCandidate(sec?.contentMarkdown ?? "", 140) || cleanQuoteCandidate(coreIdea[locale], 100);
      return { path, field: `sections[role=${roleLabel}].contentMarkdown`, quote: quote || coreIdea[locale].slice(0, 40) };
    }

    const packageQuotes = {
      en: packageQuoteFor("en"),
      "ar-MSA": packageQuoteFor("ar-MSA"),
      "ar-Gulf": packageQuoteFor("ar-Gulf"),
      "ar-EG": packageQuoteFor("ar-EG"),
    };

    const visualIntent: ContentBrief["visualIntent"] = {
      kind,
      summary: visualSummary,
      packageQuotes,
    };

    const contentBrief: ContentBrief = {
      orientation,
      coreIdea,
      tension,
      comparison,
      missionIntro,
      visualIntent,
    };

    // ---- composition pattern + rationale -----------------------------------
    const compositionPattern = COMPOSITION_PATTERN_BY_KIND[kind];

    let methodRationale: string;
    if (method === 1) {
      methodRationale = `${lessonId}'s package marks a Diagram intent (${diagramId ?? "unlabeled"}); the underlying relationship reads as ${kind}, so a deterministic SVG panel keeps the real ${cmpEn.leftLabel}/${cmpEn.rightLabel} labels crisp in Arabic and English without any paid generation step.`;
    } else if (method === 2) {
      methodRationale = `${lessonId}'s screenshot intent centers on an abstract idea rather than a literal interface (metaphor score ${metaphorScore(bundle)}), so a text-free AI illustration communicates "${coreIdea.en}" without inventing UI chrome or rendering paid text.`;
    } else {
      methodRationale = `${lessonId}'s package marks a Screenshot intent but no allowlisted Masaarat public URL exists for this lesson, so a hybrid deterministic frame carries the real locale labels (${cmpEn.leftLabel} / ${cmpEn.rightLabel}) instead of fabricating a UI capture.`;
    }

    // ---- label packs --------------------------------------------------------
    function buildLabelPack(locale: Locale): LabelEntry[] {
      const cmp = comparison[locale];
      const path = sourcePackages[locale].path;
      const entries: LabelEntry[] = [];
      const leftText = cleanQuoteCandidate(cmp.leftLabel, 80);
      const rightText = cleanQuoteCandidate(cmp.rightLabel, 80);
      if (leftText && !isBanned(leftText)) {
        entries.push({
          id: "comparison-left",
          text: leftText,
          source: {
            path,
            field: locale === "ar-EG" ? "block.left.label" : "sections[role=Comparison].tables[0].headers[0]",
          },
        });
      }
      if (rightText && !isBanned(rightText)) {
        entries.push({
          id: "comparison-right",
          text: rightText,
          source: {
            path,
            field: locale === "ar-EG" ? "block.right.label" : "sections[role=Comparison].tables[0].headers[1]",
          },
        });
      }

      const terms =
        locale === "ar-EG"
          ? arEg.concepts.map((c) => c.term)
          : jsonGlossaryTerms(locale === "en" ? en : locale === "ar-MSA" ? arMsa : arGulf);

      terms.slice(0, 2).forEach((term, i) => {
        const text = cleanQuoteCandidate(term, 80);
        if (text && !isBanned(text) && !entries.some((e) => e.text === text)) {
          entries.push({
            id: `term-${i}`,
            text,
            source: {
              path,
              field: locale === "ar-EG" ? `block.items[${i}].term` : `sections[role=Glossary].tables[0].rows[${i}][0]`,
            },
          });
        }
      });

      if (entries.length < 2) {
        // Guaranteed fallback: title fragments are always real, lesson-specific content.
        const fallback = cleanQuoteCandidate(titles[locale], 80);
        if (fallback && !entries.some((e) => e.text === fallback)) {
          entries.push({
            id: "title-fallback",
            text: fallback,
            source: { path: sourcePackages[locale].path, field: locale === "ar-EG" ? "block.title" : "title" },
          });
        }
      }
      return entries;
    }

    const labelPacks: Record<Locale, LabelEntry[]> = {
      en: buildLabelPack("en"),
      "ar-MSA": buildLabelPack("ar-MSA"),
      "ar-Gulf": buildLabelPack("ar-Gulf"),
      "ar-EG": buildLabelPack("ar-EG"),
    };
    for (const locale of LOCALES) {
      if (labelPacks[locale].length < 2) {
        parseFailures.push(`${lessonId}: could not build 2+ labels for ${locale}`);
      }
    }

    // ---- alt texts ------------------------------------------------------------
    const altTexts: Record<Locale, string> = {
      en: `${titles.en}: "${comparison.en.leftLabel}" versus "${comparison.en.rightLabel}" — ${coreIdea.en}`.slice(0, 300),
      "ar-MSA": `${titles["ar-MSA"]}: "${comparison["ar-MSA"].leftLabel}" في مقابل "${comparison["ar-MSA"].rightLabel}" — ${coreIdea["ar-MSA"]}`.slice(0, 300),
      "ar-Gulf": `${titles["ar-Gulf"]}: "${comparison["ar-Gulf"].leftLabel}" في مقابل "${comparison["ar-Gulf"].rightLabel}" — ${coreIdea["ar-Gulf"]}`.slice(0, 300),
      "ar-EG": `${titles["ar-EG"]}: "${comparison["ar-EG"].leftLabel}" في مقابل "${comparison["ar-EG"].rightLabel}" — ${coreIdea["ar-EG"]}`.slice(0, 300),
    };

    // ---- ai prompt contract / screenshot spec ---------------------------------
    const aiPromptContract: LessonVisualMaster["aiPromptContract"] =
      method === 2
        ? {
            providerClass: "text-free-illustration",
            paidAllowed: false,
            textFree: true,
            promptRules: [
              "No embedded text, letters, numbers, or UI chrome anywhere in the image.",
              `Depict the idea behind "${titles.en}" as a literal scene or metaphor, not as software.`,
              "Use a calm editorial illustration style consistent with a warm, minimal brand palette.",
              "Keep the composition balanced so it still reads when mirrored for RTL locales.",
            ],
            costCeilingUsd: 0,
          }
        : null;
    const screenshotSpec: LessonVisualMaster["screenshotSpec"] = null;

    // ---- factual claims (rubric weights only) ---------------------------------
    const factualClaims: FactualClaim[] = [];
    function pushRubricClaims(locale: Locale, data: LocaleLessonJson) {
      const rubric = findSectionByRole(data, /^Mission$/)?.mission?.rubric ?? [];
      rubric.slice(0, 2).forEach((r, i) => {
        factualClaims.push({
          claim: `${r.weight}% of the mission rubric weight is assigned to "${stripBold(r.dimension)}"`,
          locale,
          path: sourcePackages[locale].path,
          field: `mission.rubric[${i}].weight`,
          quote: `"weight": ${r.weight}`,
        });
      });
    }
    pushRubricClaims("en", en);
    pushRubricClaims("ar-MSA", arMsa);
    pushRubricClaims("ar-Gulf", arGulf);
    arEg.missionRubric.slice(0, 2).forEach((r, i) => {
      factualClaims.push({
        claim: `${r.weight}% of the mission rubric weight is assigned to "${r.label}"`,
        locale: "ar-EG",
        path: sourcePackages["ar-EG"].path,
        field: `block.rubric[${i}].weight`,
        quote: `weight: ${r.weight}`,
      });
    });

    drafts.push({
      schemaVersion: "lesson-visual-master/v1",
      lessonId,
      pathId,
      moduleId,
      sourceSha: SOURCE_SHA,
      titles,
      sourcePackages,
      contentBrief,
      method,
      methodRationale,
      compositionPattern,
      duplicationJustification: null,
      labelPacks,
      altTexts,
      aiPromptContract,
      screenshotSpec,
      factualClaims,
    });
  }

  // ---- duplication justification pass ---------------------------------------
  const patternCounts = new Map<string, number>();
  for (const d of drafts) patternCounts.set(d.compositionPattern, (patternCounts.get(d.compositionPattern) ?? 0) + 1);

  const finalMasters: LessonVisualMaster[] = drafts.map((d) => {
    const count = patternCounts.get(d.compositionPattern) ?? 1;
    const duplicationJustification =
      count > 1
        ? `Shares the "${d.compositionPattern}" layout template with ${count - 1} other lesson(s) in this pipeline; the frame is reused for visual consistency across the path while the content stays lesson-specific — here: "${d.contentBrief.comparison.en.leftLabel}" vs "${d.contentBrief.comparison.en.rightLabel}" for ${d.lessonId}.`
        : null;
    const withJustification: Omit<LessonVisualMaster, "checksum"> = {
      ...d,
      duplicationJustification,
    };
    const checksum = canonicalChecksum(withJustification);
    return { ...withJustification, checksum };
  });

  // ---- write masters ----------------------------------------------------------
  for (const master of finalMasters) {
    const outPath = resolve(MASTERS_DIR, `${master.lessonId}.master.json`);
    writeFileSync(outPath, JSON.stringify(master, null, 2) + "\n", "utf8");
  }

  // ---- ledgers ------------------------------------------------------------------
  const generatedAt = new Date().toISOString();

  const methodCounts: Record<Method, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const m of finalMasters) methodCounts[m.method]++;

  writeFileSync(
    resolve(LEDGERS_DIR, "method_decision_ledger.json"),
    JSON.stringify(
      {
        ledgerVersion: "lesson-visuals-method-decision/v1",
        sourceSha: SOURCE_SHA,
        generatedAt,
        methodCounts,
        entries: finalMasters.map((m) => ({
          lessonId: m.lessonId,
          method: m.method,
          methodRationale: m.methodRationale,
          compositionPattern: m.compositionPattern,
          duplicationJustification: m.duplicationJustification,
        })),
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  writeFileSync(
    resolve(LEDGERS_DIR, "screenshot_rights_ledger.json"),
    JSON.stringify(
      {
        ledgerVersion: "lesson-visuals-screenshot-rights/v1",
        sourceSha: SOURCE_SHA,
        generatedAt,
        allowlistHostsChecked: ["masaarat.ai", "www.masaarat.ai", "learn.masaarat.ai", "docs.masaarat.ai"],
        note: "No safe, allowlisted Masaarat public lesson-screenshot URL is known for this candidate pipeline; method 3 is never selected, and every lesson's screenshot intent is assessed but not used.",
        entries: finalMasters
          .filter((m) => m.contentBrief.visualIntent.kind === "screenshot" || m.contentBrief.visualIntent.kind === "concept-scene" || m.method === 2 || m.method === 4)
          .map((m) => ({
            lessonId: m.lessonId,
            status: "assessed-not-used",
            reason: "No known allowlisted Masaarat public URL for this lesson's screenshot intent.",
            fallbackMethod: m.method,
          })),
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  writeFileSync(
    resolve(LEDGERS_DIR, "factual_evidence_ledger.json"),
    JSON.stringify(
      {
        ledgerVersion: "lesson-visuals-factual-evidence/v1",
        sourceSha: SOURCE_SHA,
        generatedAt,
        entries: finalMasters.map((m) => ({
          lessonId: m.lessonId,
          claimCount: m.factualClaims.length,
          claims: m.factualClaims,
        })),
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  // ---- report -------------------------------------------------------------------
  console.log(
    JSON.stringify(
      {
        masterCount: finalMasters.length,
        methodCounts,
        conceptSceneLessons: [...conceptSceneLessonIds],
        parseFailures,
        warnings: allWarnings,
        mastersDir: MASTERS_DIR,
        ledgersDir: LEDGERS_DIR,
      },
      null,
      2,
    ),
  );

  if (parseFailures.length > 0) {
    process.exitCode = 1;
  }
}

main();
