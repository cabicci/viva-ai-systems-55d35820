/**
 * Build PHASE13B_MERGE_READINESS_SEMANTIC_DIFF.json comparing origin/main to HEAD.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { PHASE13B_RECOVERED_PACKAGES_ROOT } from "./collect-phase13b-recovered-report.ts";
import { PHASE13B_RECOVERED_LOCALES } from "./lib/phase13b-merge-readiness.ts";
import {
  buildSemanticDiffManifest,
  isAllowedMechanicalChange,
  type SemanticDiffManifest,
} from "./lib/phase13b-semantic-diff.ts";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const REPORT_PATH = path.join(REPO_ROOT, "docs/reports/PHASE13B_MERGE_READINESS_SEMANTIC_DIFF.json");

async function listPackageRelPaths(): Promise<string[]> {
  const paths: string[] = [];
  for (const locale of PHASE13B_RECOVERED_LOCALES) {
    const dir = path.join(PHASE13B_RECOVERED_PACKAGES_ROOT, locale);
    const entries = await fs.readdir(dir);
    for (const file of entries.filter((f) => f.endsWith(".json")).sort()) {
      paths.push(
        path.relative(REPO_ROOT, path.join(dir, file)).replace(/\\/g, "/"),
      );
    }
  }
  return paths;
}

function gitModifiedRelPaths(): Set<string> {
  const raw = execSync("git diff --name-only origin/main", {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  return new Set(
    raw
      .split("\n")
      .map((line) => line.trim().replace(/\\/g, "/"))
      .filter((line) => line.includes("phase13b-recovered-packages/")),
  );
}

export async function buildReport(): Promise<SemanticDiffManifest> {
  const packageRelPaths = await listPackageRelPaths();
  const manifest = await buildSemanticDiffManifest({
    repoRoot: REPO_ROOT,
    baseRef: "origin/main",
    headRef: "HEAD",
    packageRelPaths,
    gitModifiedRelPaths: gitModifiedRelPaths(),
  });

  const disallowed = manifest.packages.flatMap((pkg) =>
    pkg.changes
      .filter((c) => !isAllowedMechanicalChange(c))
      .map((c) => ({
        package: `${pkg.locale}/${pkg.lessonId}`,
        pointer: c.pointer,
        category: c.category,
        before: c.before,
        after: c.after,
      })),
  );

  const output = {
    ...manifest,
    disallowedChanges: disallowed,
    disallowedChangeCount: disallowed.length,
  };

  await fs.mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await fs.writeFile(REPORT_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");
  return output;
}

if (import.meta.main) {
  buildReport()
    .then((report) => {
      console.log(
        JSON.stringify(
          {
            reportPath: REPORT_PATH,
            packagesScanned: report.packagesScanned,
            gitModifiedCount: report.gitModifiedCount,
            semanticChangePackageCount: report.semanticChangePackageCount,
            formattingOnlyCount: report.formattingOnlyCount,
            changesByCategory: report.changesByCategory,
            disallowedChangeCount: (report as { disallowedChangeCount?: number })
              .disallowedChangeCount,
          },
          null,
          2,
        ),
      );
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
