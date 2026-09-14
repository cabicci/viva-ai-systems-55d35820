import { afterEach, describe, expect, it } from "vitest";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { stageCanonicalMethodCArtifact } from "../../../src/lib/lesson-visuals/controlled-v1/methodCCanonicalRepair";

const temporaryRoots: string[] = [];

afterEach(() => {
  while (temporaryRoots.length > 0) {
    rmSync(temporaryRoots.pop()!, { recursive: true, force: true });
  }
});

function temporaryRoot(): string {
  const root = mkdtempSync(join(tmpdir(), "method-c-staging-safety-"));
  temporaryRoots.push(root);
  return root;
}

function stageEmptyFixture(stagingRoot: string) {
  return stageCanonicalMethodCArtifact({
    sourceArtifactRoot: join(dirname(stagingRoot), "missing-source"),
    stagingRoot,
    allowlist: [],
    sourceLedger: [],
    expectedTotal: 0,
    expectedPerLocale: 0,
  });
}

describe("Method C canonical staging-root safety", () => {
  it("creates an absent staging root", () => {
    const stagingRoot = join(temporaryRoot(), "new-staging");
    expect(existsSync(stagingRoot)).toBe(false);

    const result = stageEmptyFixture(stagingRoot);

    expect(result.ok).toBe(true);
    expect(existsSync(result.sanitationReportPath)).toBe(true);
  });

  it("uses an existing empty staging root", () => {
    const stagingRoot = join(temporaryRoot(), "empty-staging");
    mkdirSync(stagingRoot);
    expect(readdirSync(stagingRoot)).toEqual([]);

    const result = stageEmptyFixture(stagingRoot);

    expect(result.ok).toBe(true);
    expect(existsSync(result.provenancePath)).toBe(true);
  });

  it("refuses a nonempty staging root and preserves nested contents", () => {
    const stagingRoot = join(temporaryRoot(), "unrelated-target");
    const sentinelPath = join(stagingRoot, "nested", "sentinel.txt");
    mkdirSync(dirname(sentinelPath), { recursive: true });
    writeFileSync(sentinelPath, "preserve-me", "utf8");

    expect(() => stageEmptyFixture(stagingRoot)).toThrow(
      `canonical staging root must be absent or empty: ${resolve(stagingRoot)}`,
    );

    expect(readFileSync(sentinelPath, "utf8")).toBe("preserve-me");
    expect(readdirSync(stagingRoot)).toEqual(["nested"]);
    expect(readdirSync(dirname(sentinelPath))).toEqual(["sentinel.txt"]);
    expect(existsSync(join(stagingRoot, "artifacts"))).toBe(false);
  });

  it("refuses a staging root that is not a directory", () => {
    const stagingRoot = join(temporaryRoot(), "sentinel.txt");
    writeFileSync(stagingRoot, "preserve-me", "utf8");

    expect(() => stageEmptyFixture(stagingRoot)).toThrow(
      `canonical staging root is not a directory: ${resolve(stagingRoot)}`,
    );

    expect(readFileSync(stagingRoot, "utf8")).toBe("preserve-me");
  });
});
