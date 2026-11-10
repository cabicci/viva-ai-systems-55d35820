import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
type RecoveredFixture = { needsRepair?: boolean };

const state = vi.hoisted(() => ({
  defaultCollector: vi.fn<
    (options?: {
      root: string;
    }) => Promise<{ perLocale: Record<string, { recoveredIds: string[] }> }>
  >(() => {
    throw new Error("Real reference collector forbidden");
  }),
  defaultBaseline: vi.fn(() => {
    throw new Error("Real baseline forbidden");
  }),
}));
vi.mock("../../scripts/locale-lessons/lib/source-package.ts", () => ({
  readJsonFile: async (file: string) => JSON.parse(await fs.readFile(file, "utf8")),
}));
vi.mock("../../scripts/locale-lessons/collect-phase13b-recovered-report.ts", () => ({
  collectPhase13BRecoveredReport: state.defaultCollector,
  PHASE13B_RECOVERED_PACKAGES_ROOT: "unreachable-reference-root",
}));
vi.mock("../../scripts/locale-lessons/lib/phase13b-merge-readiness.ts", () => ({
  PHASE13B_RECOVERED_LOCALES: ["ar-MSA", "ar-Gulf", "en"],
  loadPhase13BRecoveredMsaAuditBaseline: state.defaultBaseline,
  packageNeedsRepair: (_s: unknown, p: RecoveredFixture) => p.needsRepair,
  repairRecoveredPackage: (_s: unknown, p: RecoveredFixture) => ({ ...p, needsRepair: false }),
  auditRecoveredPackage: (_s: unknown, p: RecoveredFixture) =>
    p.needsRepair ? [{ severity: "error", kind: "synthetic" }] : [],
  summarizeAuditIssues: (issues: unknown[]) => ({ total: issues.length }),
  buildValidationSummary: () => {
    throw Error("Unrelated validation forbidden");
  },
}));
vi.mock("../../scripts/locale-lessons/lib/phase13b-semantic-diff.ts", () => ({
  deepEqual: (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b),
}));
import { repairAllRecoveredPackages } from "../../scripts/locale-lessons/repair-phase13b-recovered-packages.ts";
import { withCopiedReferenceTree } from "../../src/test/owned-reference-tree";
async function put(p: string, data: string) {
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, data);
}
async function snapshot(dir: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  async function walk(d: string) {
    for (const n of await fs.readdir(d)) {
      const p = path.join(d, n),
        st = await fs.lstat(p);
      if (st.isSymbolicLink()) out[path.relative(dir, p)] = "LINK:" + (await fs.readlink(p));
      else if (st.isDirectory()) await walk(p);
      else out[path.relative(dir, p)] = (await fs.readFile(p)).toString("hex");
    }
  }
  await walk(dir);
  return out;
}

let root: string;
beforeEach(async () => {
  root = await fs.mkdtemp(path.join(await fs.realpath(os.tmpdir()), "masaarat-recovered-fixture-"));
  state.defaultCollector.mockReset();
  state.defaultCollector.mockImplementation(async (options) => {
    if (!options?.root) throw new Error("Real reference collector forbidden");
    const perLocale: Record<string, { recoveredIds: string[] }> = {};
    for (const locale of ["ar-MSA", "ar-Gulf", "en"]) {
      const files = await fs.readdir(path.join(options.root, locale));
      perLocale[locale] = {
        recoveredIds: files
          .filter((file) => file.endsWith(".json"))
          .map((file) => file.slice(0, -5)),
      };
    }
    return { perLocale };
  });
  state.defaultBaseline.mockClear();
});
afterEach(async () => {
  const parent = await fs.realpath(os.tmpdir());
  const owned = await fs.realpath(root);
  if (owned !== root || path.dirname(owned) !== parent)
    throw new Error("Fixture ownership mismatch");
  await fs.rm(owned, { recursive: true, force: true });
});

describe("Recovered locale packages use owned repair fixtures", () => {
  it("repairs only an owned clone, remains idempotent and removes only that clone", async () => {
    const reference = path.join(root, "reference-recovered");
    for (const locale of ["ar-MSA", "ar-Gulf", "en"])
      await put(
        path.join(reference, locale, "synthetic-lesson.json"),
        JSON.stringify({ lessonId: "synthetic-lesson", locale, needsRepair: locale !== "ar-MSA" }),
      );
    const before = await snapshot(reference);
    let copied = "";
    await withCopiedReferenceTree(reference, async (packagesRoot) => {
      copied = packagesRoot;
      const first = await repairAllRecoveredPackages({ packagesRoot });
      const second = await repairAllRecoveredPackages({ packagesRoot });
      expect(first.filesWritten).toBe(2);
      expect(second.filesWritten).toBe(0);
      expect(second.auditAfter).toBe(0);
      expect(await snapshot(reference)).toEqual(before);
    });
    expect(await snapshot(reference)).toEqual(before);
    await expect(fs.stat(copied)).rejects.toMatchObject({ code: "ENOENT" });
    expect(
      state.defaultCollector.mock.calls.every(([input]) => typeof input?.root === "string"),
    ).toBe(true);
    expect(state.defaultBaseline).not.toHaveBeenCalled();
  });
  it("clone cleanup after callback failure cannot remove original reference files", async () => {
    const source = path.join(root, "reference");
    await put(path.join(source, "sentinel.json"), "DO NOT DELETE");
    let ownedClone = "";
    await expect(
      withCopiedReferenceTree(source, async (clone) => {
        ownedClone = clone;
        await fs.writeFile(path.join(clone, "sentinel.json"), "changed owned clone");
        throw Error("synthetic failure");
      }),
    ).rejects.toThrow("synthetic failure");
    expect(await fs.readFile(path.join(source, "sentinel.json"), "utf8")).toBe("DO NOT DELETE");
    await expect(fs.stat(ownedClone)).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("clone refuses links instead of copying foreign writable references", async () => {
    const source = path.join(root, "reference"),
      target = path.join(root, "target");
    await put(path.join(source, "sentinel.json"), "untouched");
    await put(path.join(target, "synthetic.json"), "target untouched");
    await fs.symlink(
      target,
      path.join(source, "linked"),
      process.platform === "win32" ? "junction" : "dir",
    );
    await expect(withCopiedReferenceTree(source, async () => {})).rejects.toThrow(
      "Linked reference",
    );
    expect(await fs.readFile(path.join(target, "synthetic.json"), "utf8")).toBe("target untouched");
  });
});
