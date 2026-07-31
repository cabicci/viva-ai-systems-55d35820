import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  runFull400,
  runPreflight,
  runReportOnly,
} from "../../../src/lib/lesson-visuals/controlled-v1/runner";
import { FULL_400_CONFIRM_TOKEN } from "../../../src/lib/lesson-visuals/controlled-v1/constants";
import {
  ARTIFACTS_CELLS_DIR,
  ARTIFACTS_ROOT,
  DOCS_CONTROLLED_V1_GOLDEN,
} from "../../../src/lib/lesson-visuals/controlled-v1/paths";
import {
  generateInstructionalComposition,
  renderTelemetry,
  resetRenderTelemetry,
} from "../../../src/lib/lesson-visuals/controlled-v1/routes/instructionalComposition";

describe("controlled-v1 full-400 confirmation gate", () => {
  it("fails when confirm token is missing", () => {
    const result = runFull400(undefined);
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain("confirm_full_400");
  });

  it("fails when confirm token is present but not an exact match", () => {
    for (const bad of [
      "run_authorized_400",
      "RUN_AUTHORIZED_400 ",
      "RUN AUTHORIZED 400",
      "yes",
      "true",
      "RUN_AUTHORIZED_4000",
    ]) {
      const result = runFull400(bad);
      expect(result.ok).toBe(false);
      expect(result.receipts).toEqual([]);
    }
  });

  it("does not touch the filesystem (no receipts written) when the token is wrong", () => {
    const before = runFull400("nope");
    expect(before.receipts.length).toBe(0);
  });

  it("the exact required token is recognized by the gate constant", () => {
    expect(FULL_400_CONFIRM_TOKEN).toBe("RUN_AUTHORIZED_400");
  });
});

const FORBIDDEN_IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex").toUpperCase();
}

function inventoryImages(root: string): { png: number; otherRaster: number; paths: string[] } {
  if (!existsSync(root)) return { png: 0, otherRaster: 0, paths: [] };
  const paths: string[] = [];
  let png = 0;
  let otherRaster = 0;
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      const lower = entry.name.toLowerCase();
      const dot = lower.lastIndexOf(".");
      const ext = dot >= 0 ? lower.slice(dot) : "";
      if (!FORBIDDEN_IMAGE_EXTS.has(ext)) continue;
      paths.push(full);
      if (ext === ".png") png += 1;
      else otherRaster += 1;
    }
  };
  walk(root);
  return { png, otherRaster, paths };
}

function goldenFingerprint(): Record<string, string> {
  const out: Record<string, string> = {};
  if (!existsSync(DOCS_CONTROLLED_V1_GOLDEN)) return out;
  for (const name of readdirSync(DOCS_CONTROLLED_V1_GOLDEN).sort()) {
    const full = join(DOCS_CONTROLLED_V1_GOLDEN, name);
    if (statSync(full).isFile()) out[name] = sha256File(full);
  }
  return out;
}

describe("controlled-v1 zero-render proof (preflight / report-only)", () => {
  let isolatedRoot: string;
  let priorZeroRender: string | undefined;
  let goldenBefore: Record<string, string>;
  let artifactsPngBefore: number;
  let cellsPngBefore: number;

  beforeEach(() => {
    priorZeroRender = process.env.CONTROLLED_V1_ZERO_RENDER;
    process.env.CONTROLLED_V1_ZERO_RENDER = "1";
    resetRenderTelemetry();
    isolatedRoot = mkdtempSync(resolve(tmpdir(), "controlled-v1-zero-render-"));
    mkdirSync(join(isolatedRoot, "visual-cells"), { recursive: true });
    writeFileSync(join(isolatedRoot, "visual-cells", ".keep"), "probe");
    goldenBefore = goldenFingerprint();
    artifactsPngBefore = inventoryImages(ARTIFACTS_ROOT).png;
    cellsPngBefore = inventoryImages(ARTIFACTS_CELLS_DIR).png;
  });

  afterEach(() => {
    if (priorZeroRender === undefined) delete process.env.CONTROLLED_V1_ZERO_RENDER;
    else process.env.CONTROLLED_V1_ZERO_RENDER = priorZeroRender;
    resetRenderTelemetry();
    rmSync(isolatedRoot, { recursive: true, force: true });
  });

  function assertZeroRenderCounters(): void {
    expect(renderTelemetry.rendererCalls).toBe(0);
    expect(renderTelemetry.browserLaunches).toBe(0);
    expect(renderTelemetry.paidProviderCalls).toBe(0);
    expect(inventoryImages(isolatedRoot).png).toBe(0);
    expect(inventoryImages(isolatedRoot).otherRaster).toBe(0);
    expect(inventoryImages(ARTIFACTS_ROOT).png).toBe(artifactsPngBefore);
    expect(inventoryImages(ARTIFACTS_CELLS_DIR).png).toBe(cellsPngBefore);
    expect(readdirSync(join(isolatedRoot, "visual-cells"))).toEqual([".keep"]);
    expect(goldenFingerprint()).toEqual(goldenBefore);
  }

  it("preflight never renders, launches Chrome, or writes visual outputs", () => {
    const result = runPreflight();
    expect(result.mode).toBe("preflight");
    expect(result.ok).toBe(true);
    expect(result.receipts).toEqual([]);
    assertZeroRenderCounters();

    // Live renderer entry remains fail-closed under the zero-render latch.
    expect(() =>
      generateInstructionalComposition({
        lessonId: "intro-m1-l4-ai-can-cannot",
        locale: "en",
        position: 4,
        title: "blocked",
      }),
    ).toThrow(/BLOCKED_ZERO_RENDER/);
    assertZeroRenderCounters();
  });

  it("report-only never renders, launches Chrome, or writes visual outputs", () => {
    const result = runReportOnly();
    expect(result.mode).toBe("report-only");
    expect(result.ok).toBe(true);
    assertZeroRenderCounters();
  });
});
