/**
 * validate_local — runs every local gate for the lesson-driven 400-visual
 * pipeline and exits 1 on any failure. No network calls, no paid AI, no
 * production asset generation.
 * Run: bun run src/lib/lesson-visuals/v1/scripts/validate_local.ts
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type { AuthorizedManifest, LessonVisualMaster } from "../types";
import { LOCALES } from "../types";
import { validateEvidence } from "../validators/evidence";
import { validateGenericLabelBan } from "../validators/genericLabelBan";
import { validateLocaleIntegrity } from "../validators/localeIntegrity";
import { validateManifest } from "../validators/manifest";
import { MANIFEST_PATH, MASTERS_DIR, REPO_ROOT, loadJson, quoteInFile, type ValidationIssue } from "../validators/shared";
import { canonicalChecksum } from "./canonical";

const WORKFLOW_PATH = resolve(REPO_ROOT, ".github/workflows/lesson-driven-400-visual-pipeline.yml");

// ---------------------------------------------------------------------------
// Manual JSON-Schema-shaped checks for master.schema.json (no ajv dependency)
// ---------------------------------------------------------------------------

const PATH_IDS = ["intro", "builder", "creator", "business", "automator", "analyst"];
const METHODS = [1, 2, 3, 4];
const VISUAL_KINDS = [
  "screenshot",
  "diagram",
  "comparison",
  "process",
  "system",
  "decision",
  "data-relationship",
  "concept-scene",
];

function isStr(v: unknown, minLen = 0): v is string {
  return typeof v === "string" && v.length >= minLen;
}

function pushIf(issues: ValidationIssue[], cond: boolean, lessonId: string, message: string) {
  if (cond) issues.push({ gate: "schema", lessonId, message });
}

function checkLocaleStringMap(
  issues: ValidationIssue[],
  lessonId: string,
  label: string,
  map: unknown,
  minLen = 2,
) {
  if (typeof map !== "object" || map === null) {
    issues.push({ gate: "schema", lessonId, message: `${label} is not an object` });
    return;
  }
  const rec = map as Record<string, unknown>;
  for (const locale of LOCALES) {
    pushIf(issues, !isStr(rec[locale], minLen), lessonId, `${label}.${locale} missing or too short`);
  }
  const extra = Object.keys(rec).filter((k) => !(LOCALES as readonly string[]).includes(k));
  pushIf(issues, extra.length > 0, lessonId, `${label} has unexpected keys: ${extra.join(", ")}`);
}

function validateMasterSchema(master: LessonVisualMaster): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const id = master.lessonId ?? "(unknown)";

  pushIf(issues, master.schemaVersion !== "lesson-visual-master/v1", id, "schemaVersion mismatch");
  pushIf(issues, !isStr(master.lessonId, 8) || !/^[a-z0-9]+(-[a-z0-9]+)+$/.test(master.lessonId), id, "lessonId invalid");
  pushIf(issues, !PATH_IDS.includes(master.pathId), id, `pathId invalid: ${master.pathId}`);
  pushIf(issues, !isStr(master.moduleId, 1), id, "moduleId missing");
  pushIf(issues, !isStr(master.sourceSha) || !/^[a-f0-9]{40}$/.test(master.sourceSha), id, "sourceSha invalid");

  checkLocaleStringMap(issues, id, "titles", master.titles);

  if (typeof master.sourcePackages !== "object" || master.sourcePackages === null) {
    issues.push({ gate: "schema", lessonId: id, message: "sourcePackages missing" });
  } else {
    for (const locale of LOCALES) {
      const sp = (master.sourcePackages as Record<string, { path?: string; kind?: string }>)[locale];
      pushIf(issues, !sp || !isStr(sp.path, 8), id, `sourcePackages.${locale}.path invalid`);
      pushIf(issues, !sp || !["ts-blocks", "json"].includes(sp.kind ?? ""), id, `sourcePackages.${locale}.kind invalid`);
    }
  }

  const cb = master.contentBrief;
  if (!cb) {
    issues.push({ gate: "schema", lessonId: id, message: "contentBrief missing" });
  } else {
    if (typeof cb.orientation !== "object") {
      issues.push({ gate: "schema", lessonId: id, message: "contentBrief.orientation missing" });
    } else {
      for (const locale of LOCALES) {
        const arr = (cb.orientation as Record<string, unknown>)[locale];
        pushIf(issues, !Array.isArray(arr) || arr.length < 1, id, `contentBrief.orientation.${locale} must be non-empty array`);
        if (Array.isArray(arr)) {
          arr.forEach((item, i) => pushIf(issues, !isStr(item, 2), id, `contentBrief.orientation.${locale}[${i}] too short`));
        }
      }
    }
    checkLocaleStringMap(issues, id, "contentBrief.coreIdea", cb.coreIdea);
    checkLocaleStringMap(issues, id, "contentBrief.tension", cb.tension);
    checkLocaleStringMap(issues, id, "contentBrief.missionIntro", cb.missionIntro);

    if (typeof cb.comparison !== "object" || cb.comparison === null) {
      issues.push({ gate: "schema", lessonId: id, message: "contentBrief.comparison missing" });
    } else {
      for (const locale of LOCALES) {
        const c = (cb.comparison as Record<string, { leftLabel?: string; rightLabel?: string; leftBody?: string; rightBody?: string }>)[locale];
        for (const field of ["leftLabel", "rightLabel", "leftBody", "rightBody"] as const) {
          pushIf(issues, !c || !isStr(c[field], 2), id, `contentBrief.comparison.${locale}.${field} invalid`);
        }
      }
    }

    const vi = cb.visualIntent;
    if (!vi) {
      issues.push({ gate: "schema", lessonId: id, message: "contentBrief.visualIntent missing" });
    } else {
      pushIf(issues, !VISUAL_KINDS.includes(vi.kind), id, `visualIntent.kind invalid: ${vi.kind}`);
      pushIf(issues, !isStr(vi.summary, 8), id, "visualIntent.summary too short");
      if (typeof vi.packageQuotes !== "object" || vi.packageQuotes === null) {
        issues.push({ gate: "schema", lessonId: id, message: "visualIntent.packageQuotes missing" });
      } else {
        for (const locale of LOCALES) {
          const q = (vi.packageQuotes as Record<string, { path?: string; field?: string; quote?: string }>)[locale];
          pushIf(issues, !q || !isStr(q.path, 3), id, `visualIntent.packageQuotes.${locale}.path invalid`);
          pushIf(issues, !q || !isStr(q.field, 1), id, `visualIntent.packageQuotes.${locale}.field invalid`);
          pushIf(issues, !q || !isStr(q.quote, 2), id, `visualIntent.packageQuotes.${locale}.quote invalid`);
        }
      }
    }
  }

  pushIf(issues, !METHODS.includes(master.method), id, `method invalid: ${master.method}`);
  pushIf(issues, !isStr(master.methodRationale, 12), id, "methodRationale too short");
  pushIf(issues, !isStr(master.compositionPattern, 4), id, "compositionPattern too short");
  pushIf(
    issues,
    !(master.duplicationJustification === null || isStr(master.duplicationJustification, 1)),
    id,
    "duplicationJustification must be string or null",
  );

  if (typeof master.labelPacks !== "object" || master.labelPacks === null) {
    issues.push({ gate: "schema", lessonId: id, message: "labelPacks missing" });
  } else {
    for (const locale of LOCALES) {
      const arr = (master.labelPacks as Record<string, { id?: string; text?: string; source?: { path?: string; field?: string } }[]>)[locale];
      pushIf(issues, !Array.isArray(arr) || arr.length < 2, id, `labelPacks.${locale} must have >=2 items`);
      if (Array.isArray(arr)) {
        arr.forEach((entry, i) => {
          pushIf(issues, !isStr(entry.id, 2), id, `labelPacks.${locale}[${i}].id invalid`);
          pushIf(issues, !isStr(entry.text, 2), id, `labelPacks.${locale}[${i}].text invalid`);
          pushIf(issues, !entry.source || !isStr(entry.source.path, 3), id, `labelPacks.${locale}[${i}].source.path invalid`);
          pushIf(issues, !entry.source || !isStr(entry.source.field, 1), id, `labelPacks.${locale}[${i}].source.field invalid`);
        });
      }
    }
  }

  checkLocaleStringMap(issues, id, "altTexts", master.altTexts);

  if (master.aiPromptContract !== null) {
    const c = master.aiPromptContract;
    pushIf(issues, !c || !isStr(c.providerClass, 3), id, "aiPromptContract.providerClass invalid");
    pushIf(issues, !c || c.paidAllowed !== false, id, "aiPromptContract.paidAllowed must be false");
    pushIf(issues, !c || c.textFree !== true, id, "aiPromptContract.textFree must be true");
    pushIf(issues, !c || !Array.isArray(c.promptRules) || c.promptRules.length < 1, id, "aiPromptContract.promptRules must be non-empty");
    if (c?.promptRules) c.promptRules.forEach((r, i) => pushIf(issues, !isStr(r, 4), id, `aiPromptContract.promptRules[${i}] too short`));
  }

  if (master.screenshotSpec !== null) {
    const s = master.screenshotSpec;
    pushIf(issues, !s || !isStr(s.rightsNote, 8), id, "screenshotSpec.rightsNote invalid");
    pushIf(issues, !s || s.failOnLoginRedirect !== true, id, "screenshotSpec.failOnLoginRedirect must be true");
    pushIf(issues, !s || s.allowlisted !== true, id, "screenshotSpec.allowlisted must be true");
    try {
      if (s?.url) new URL(s.url);
    } catch {
      issues.push({ gate: "schema", lessonId: id, message: "screenshotSpec.url is not a valid URI" });
    }
  }

  if (!Array.isArray(master.factualClaims)) {
    issues.push({ gate: "schema", lessonId: id, message: "factualClaims must be an array" });
  } else {
    master.factualClaims.forEach((c, i) => {
      pushIf(issues, !isStr(c.claim, 1), id, `factualClaims[${i}].claim invalid`);
      pushIf(issues, !(LOCALES as readonly string[]).includes(c.locale), id, `factualClaims[${i}].locale invalid`);
      pushIf(issues, !isStr(c.path, 3), id, `factualClaims[${i}].path invalid`);
      pushIf(issues, !isStr(c.field, 1), id, `factualClaims[${i}].field invalid`);
      pushIf(issues, !isStr(c.quote, 1), id, `factualClaims[${i}].quote invalid`);
    });
  }

  pushIf(issues, !isStr(master.checksum) || !/^[a-f0-9]{64}$/.test(master.checksum), id, "checksum invalid format");

  return issues;
}

// ---------------------------------------------------------------------------
// Gate: source path existence + checksum recomputation
// ---------------------------------------------------------------------------

function validateSourcePathsAndChecksum(masters: LessonVisualMaster[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const master of masters) {
    for (const locale of LOCALES) {
      const sp = master.sourcePackages[locale];
      const abs = resolve(REPO_ROOT, sp.path);
      if (!existsSync(abs)) {
        issues.push({ gate: "sourcePath", lessonId: master.lessonId, message: `missing source file: ${sp.path}` });
      }
    }
    const { checksum, ...rest } = master;
    const recomputed = canonicalChecksum(rest);
    if (recomputed !== checksum) {
      issues.push({
        gate: "checksum",
        lessonId: master.lessonId,
        message: `checksum mismatch: expected ${recomputed}, found ${checksum}`,
      });
    }
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Gate: 400-cell exactness of AUTHORIZED_MANIFEST + locale partition
// ---------------------------------------------------------------------------

function validateManifestExactness(masters: LessonVisualMaster[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [...validateManifest()];
  if (!existsSync(MANIFEST_PATH)) return issues;
  const manifest = loadJson<AuthorizedManifest>(MANIFEST_PATH);

  const masterIds = new Set(masters.map((m) => m.lessonId));
  const manifestIds = new Set(manifest.lessonIds);
  for (const id of masterIds) {
    if (!manifestIds.has(id)) issues.push({ gate: "manifest", lessonId: id, message: "master lessonId missing from manifest.lessonIds" });
  }
  for (const id of manifestIds) {
    if (!masterIds.has(id)) issues.push({ gate: "manifest", lessonId: id, message: "manifest lessonId has no master file" });
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Gate: duplicate/template similarity — fail only on unjustified identical
// complete briefs (same compositionPattern + same label texts, no
// duplicationJustification).
// ---------------------------------------------------------------------------

function validateDuplicateTemplates(masters: LessonVisualMaster[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const groups = new Map<string, LessonVisualMaster[]>();
  for (const m of masters) {
    const labelKey = LOCALES.map((l) => m.labelPacks[l].map((e) => e.text).join("|")).join("||");
    const key = `${m.compositionPattern}::${labelKey}`;
    const arr = groups.get(key) ?? [];
    arr.push(m);
    groups.set(key, arr);
  }
  for (const [, group] of groups) {
    if (group.length <= 1) continue;
    for (const m of group) {
      if (m.duplicationJustification === null) {
        issues.push({
          gate: "duplicateTemplate",
          lessonId: m.lessonId,
          message: `identical compositionPattern + label texts shared with ${group.length - 1} other lesson(s) but duplicationJustification is null`,
        });
      }
    }
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Gate: workflow YAML parse (best-effort, no yaml dependency), only if present
// ---------------------------------------------------------------------------

function validateWorkflowYaml(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!existsSync(WORKFLOW_PATH)) return issues; // not present -> nothing to check

  const text = readFileSync(WORKFLOW_PATH, "utf8");
  if (text.includes("\t")) {
    issues.push({ gate: "workflowYaml", message: "workflow yml contains tab characters (invalid YAML indentation)" });
  }

  const flowPairs: [string, string][] = [
    ["{", "}"],
    ["[", "]"],
  ];
  for (const [open, close] of flowPairs) {
    let depth = 0;
    let inString: string | null = null;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inString) {
        if (ch === "\\") { i++; continue; }
        if (ch === inString) inString = null;
        continue;
      }
      if (ch === '"' || ch === "'") { inString = ch; continue; }
      if (ch === "#") {
        const nl = text.indexOf("\n", i);
        i = nl === -1 ? text.length : nl;
        continue;
      }
      if (ch === open) depth++;
      else if (ch === close) depth--;
    }
    if (depth !== 0) {
      issues.push({ gate: "workflowYaml", message: `unbalanced '${open}${close}' in workflow yml (depth=${depth})` });
    }
  }

  const lines = text.split("\n");
  lines.forEach((line, i) => {
    if (/^\s*[A-Za-z0-9_.-]+:\S/.test(line) && !line.includes("://") && !/^\s*-/.test(line)) {
      issues.push({ gate: "workflowYaml", message: `line ${i + 1}: mapping key missing space after colon` });
    }
  });

  return issues;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const allIssues: ValidationIssue[] = [];

  if (!existsSync(MASTERS_DIR)) {
    console.error(`Masters dir missing: ${MASTERS_DIR}. Run author_masters.ts first.`);
    process.exit(1);
  }

  const masterFiles = readdirSync(MASTERS_DIR).filter((f) => f.endsWith(".master.json"));
  if (masterFiles.length !== 100) {
    allIssues.push({ gate: "masterCount", message: `expected exactly 100 master files, found ${masterFiles.length}` });
  }

  const masters: LessonVisualMaster[] = masterFiles.map((f) => loadJson<LessonVisualMaster>(resolve(MASTERS_DIR, f)));

  for (const master of masters) allIssues.push(...validateMasterSchema(master));
  allIssues.push(...validateSourcePathsAndChecksum(masters));
  allIssues.push(...validateManifestExactness(masters));
  allIssues.push(...validateGenericLabelBan());
  allIssues.push(...validateLocaleIntegrity());
  allIssues.push(...validateEvidence());
  allIssues.push(...validateDuplicateTemplates(masters));
  allIssues.push(...validateWorkflowYaml());

  const byGate = new Map<string, number>();
  for (const issue of allIssues) byGate.set(issue.gate, (byGate.get(issue.gate) ?? 0) + 1);

  console.log(
    JSON.stringify(
      {
        masterFilesFound: masterFiles.length,
        totalIssues: allIssues.length,
        issuesByGate: Object.fromEntries(byGate),
        issues: allIssues.slice(0, 200),
      },
      null,
      2,
    ),
  );

  if (allIssues.length > 0) {
    console.error(`validate_local FAILED with ${allIssues.length} issue(s).`);
    process.exit(1);
  }
  console.log("validate_local PASSED — all local gates green.");
}

main();
