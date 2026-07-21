import { validateAllMasters } from "./masterSchema";
import { validateManifest } from "./manifest";
import { validateLocaleIntegrity } from "./localeIntegrity";
import { validateEvidence } from "./evidence";
import { validateGenericLabelBan } from "./genericLabelBan";
import { validateGrounding } from "./grounding";
import {
  templateSimilarityReport,
  validateTemplateSimilarity,
} from "./templateSimilarity";
import { validateFontsPresent } from "./textBounds";
import { validateSvgSafety } from "./svgSafety";
import type { ValidationIssue } from "./shared";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { REPO_ROOT } from "./shared";

export type ValidationReport = {
  ok: boolean;
  issues: ValidationIssue[];
  templateSimilarity: Record<string, number>;
};

export function runAllValidators(options?: {
  sampleSvg?: string;
}): ValidationReport {
  const issues: ValidationIssue[] = [
    ...validateAllMasters(),
    ...validateManifest(),
    ...validateLocaleIntegrity(),
    ...validateEvidence(),
    ...validateGenericLabelBan(),
    ...validateGrounding({ writeAuditLedger: false }),
    ...validateTemplateSimilarity(),
    ...validateFontsPresent(),
  ];

  if (options?.sampleSvg) {
    issues.push(...validateSvgSafety(options.sampleSvg));
  }

  const workflow = resolve(
    REPO_ROOT,
    ".github/workflows/lesson-driven-400-visual-pipeline.yml",
  );
  if (existsSync(workflow)) {
    const yaml = readFileSync(workflow, "utf8");
    if (!yaml.includes("workflow_dispatch")) {
      issues.push({
        gate: "workflow",
        message: "workflow must be workflow_dispatch only",
      });
    }
    if (/^\s*push:\s*$/m.test(yaml) || /^\s*pull_request:\s*$/m.test(yaml)) {
      issues.push({
        gate: "workflow",
        message: "workflow must not trigger on push/pull_request",
      });
    }
    for (const key of [
      "execution_sha",
      "approved_content_sha",
      "max_parallel",
      "fail-fast",
      "control_room_authorization_id",
      "approved_manifest_sha256",
      "dispatch_actor",
      "dispatch-authority",
    ]) {
      if (!yaml.includes(key)) {
        issues.push({
          gate: "workflow",
          message: `workflow missing expected key: ${key}`,
        });
      }
    }
  } else {
    issues.push({ gate: "workflow", message: `missing workflow ${workflow}` });
  }

  const dispatchDoc = resolve(REPO_ROOT, "docs/lesson-visuals/v1/DISPATCH_AUTHORIZATION.md");
  if (!existsSync(dispatchDoc)) {
    issues.push({ gate: "dispatch", message: "missing DISPATCH_AUTHORIZATION.md" });
  }

  return {
    ok: issues.length === 0,
    issues,
    templateSimilarity: existsSync(
      resolve(REPO_ROOT, "docs/lesson-visuals/v1/masters"),
    )
      ? templateSimilarityReport()
      : {},
  };
}

export {
  validateAllMasters,
  validateManifest,
  validateLocaleIntegrity,
  validateEvidence,
  validateGenericLabelBan,
  validateGrounding,
  validateTemplateSimilarity,
  validateFontsPresent,
  validateSvgSafety,
};
