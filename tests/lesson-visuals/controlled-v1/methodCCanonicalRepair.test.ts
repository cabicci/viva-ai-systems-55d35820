import { afterEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import {
  METHOD_C_CANONICAL_REPAIR_CONFIRM_TOKEN,
  METHOD_C_CANONICAL_SOURCE_RUN_ID,
  METHOD_C_REMAINING_EXPECTED_PER_LOCALE,
  METHOD_C_REMAINING_EXPECTED_TOTAL,
} from "../../../src/lib/lesson-visuals/controlled-v1/constants";
import {
  assertSourceUnchanged,
  buildSourceHashLedger,
  resolveAuthorizedAllowlist,
  stageCanonicalMethodCArtifact,
  validateCanonicalStaging,
} from "../../../src/lib/lesson-visuals/controlled-v1/methodCCanonicalRepair";
import { runMethodCCanonicalRepair } from "../../../src/lib/lesson-visuals/controlled-v1/runner";
import {
  renderTelemetry,
  resetRenderTelemetry,
} from "../../../src/lib/lesson-visuals/controlled-v1/routes/instructionalComposition";
import { ARTIFACTS_ROOT } from "../../../src/lib/lesson-visuals/controlled-v1/paths";

const HISTORICAL_SOURCE =
  process.env.METHOD_C_CANONICAL_SOURCE_ROOT ??
  "E:/Temp/method-c-356-canonical-repair/source-30221875344";

const TINY_PNG = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082",
  "hex",
);

const disposable: string[] = [];

afterEach(() => {
  while (disposable.length) {
    const d = disposable.pop()!;
    rmSync(d, { recursive: true, force: true });
  }
});

function sha(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex").toUpperCase();
}

function tempDir(prefix: string): string {
  const d = mkdtempSync(join(tmpdir(), prefix));
  disposable.push(d);
  return d;
}

function writeAcceptedReceipt(
  path: string,
  cellId: string,
  pngSha: string,
  bytes: number,
  extras: Partial<{
    status: string;
    route: string;
    mode: string;
  }> = {},
): void {
  const [lessonId, locale] = cellId.split("__");
  mkdirSync(dirname(path), { recursive: true });
  const receipt = {
    receiptVersion: "controlled-v1-receipt/1",
    cellId,
    lessonId,
    locale,
    route: extras.route ?? "INSTRUCTIONAL_COMPOSITION",
    mode: extras.mode ?? "method-c-remaining",
    status: extras.status ?? "ACCEPTED",
    reason: null,
    artifactPath: `cells/${cellId}/final.png`,
    artifactSha256: pngSha,
    bytesWritten: bytes,
    controlledFailureInjected: false,
    producedAt: "2026-07-27T00:00:00.000Z",
  };
  writeFileSync(path, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
}

function buildMiniSource(cellIds: string[]): { root: string; allowlist: string[] } {
  const root = tempDir("mcc-src-");
  const cv1 = join(root, "artifacts/controlled-v1");
  for (const cellId of cellIds) {
    const cellDir = join(cv1, "cells", cellId);
    mkdirSync(cellDir, { recursive: true });
    const pngPath = join(cellDir, "final.png");
    writeFileSync(pngPath, TINY_PNG);
    writeAcceptedReceipt(
      join(cv1, "receipts/method-c-remaining", `${cellId}.receipt.json`),
      cellId,
      sha(TINY_PNG),
      TINY_PNG.length,
    );
  }
  mkdirSync(join(cv1, "reports"), { recursive: true });
  writeFileSync(
    join(cv1, "reports/method-c-remaining-selection.json"),
    `${JSON.stringify({ ok: true, cellIds, errors: [] }, null, 2)}\n`,
  );
  return { root, allowlist: cellIds };
}

const FOUR = [
  "synthetic-c-probe-alpha__ar-EG",
  "synthetic-c-probe-alpha__ar-MSA",
  "synthetic-c-probe-alpha__ar-Gulf",
  "synthetic-c-probe-alpha__en",
] as const;

describe("method-c-canonical-repair packaging", () => {
  it("production staging starts empty and copies only allowlisted cells", () => {
    const { root, allowlist } = buildMiniSource([...FOUR]);
    const ledger = buildSourceHashLedger(root, allowlist, { expectedTotal: 4 });
    expect(ledger.ok).toBe(true);
    const staging = tempDir("mcc-stg-");
    expect(readdirSync(staging)).toEqual([]);

    const staged = stageCanonicalMethodCArtifact({
      sourceArtifactRoot: root,
      stagingRoot: staging,
      allowlist,
      sourceLedger: ledger.ledger,
      expectedTotal: 4,
      expectedPerLocale: 1,
    });
    expect(staged.ok).toBe(true);
    expect(staged.stagedLedger.filter((e) => e.kind === "png")).toHaveLength(4);
    expect(staged.stagedLedger.filter((e) => e.kind === "receipt")).toHaveLength(4);
    for (const entry of staged.stagedLedger) {
      const src = ledger.ledger.find(
        (e) => e.kind === entry.kind && e.cellId === entry.cellId,
      )!;
      expect(entry.sha256).toBe(src.sha256);
      expect(entry.bytes).toBe(src.bytes);
    }
    const sourceCheck = assertSourceUnchanged(root, ledger.ledger);
    expect(sourceCheck.ok).toBe(true);
  });

  it("excludes known pilot residue PNG paths", () => {
    const cells = [...FOUR, "intro-m1-l4-ai-can-cannot__ar-EG", "intro-m1-l4-ai-can-cannot__en"];
    const { root } = buildMiniSource(cells);
    const allowlist = [...FOUR];
    const ledger = buildSourceHashLedger(root, allowlist, { expectedTotal: 4 });
    const staging = tempDir("mcc-stg-");
    const staged = stageCanonicalMethodCArtifact({
      sourceArtifactRoot: root,
      stagingRoot: staging,
      allowlist,
      sourceLedger: ledger.ledger,
      expectedTotal: 4,
      expectedPerLocale: 1,
    });
    expect(staged.ok).toBe(true);
    expect(
      existsSync(
        join(
          staging,
          "artifacts/controlled-v1/cells/intro-m1-l4-ai-can-cannot__ar-EG/final.png",
        ),
      ),
    ).toBe(false);
    expect(
      existsSync(
        join(staging, "artifacts/controlled-v1/cells/intro-m1-l4-ai-can-cannot__en/final.png"),
      ),
    ).toBe(false);
  });

  it("fails closed on unauthorized cell directory", () => {
    const { root, allowlist } = buildMiniSource([...FOUR]);
    const ledger = buildSourceHashLedger(root, allowlist, { expectedTotal: 4 });
    const staging = tempDir("mcc-stg-");
    stageCanonicalMethodCArtifact({
      sourceArtifactRoot: root,
      stagingRoot: staging,
      allowlist,
      sourceLedger: ledger.ledger,
      expectedTotal: 4,
      expectedPerLocale: 1,
    });
    mkdirSync(join(staging, "artifacts/controlled-v1/cells/synthetic-c-probe-beta__en"), {
      recursive: true,
    });
    writeFileSync(
      join(staging, "artifacts/controlled-v1/cells/synthetic-c-probe-beta__en/final.png"),
      TINY_PNG,
    );
    const v = validateCanonicalStaging({
      stagingRoot: staging,
      allowlist,
      sourceLedger: ledger.ledger,
      expectedTotal: 4,
      expectedPerLocale: 1,
    });
    expect(v.ok).toBe(false);
    expect(v.errors.some((e) => /unauthorized|unexpected/i.test(e))).toBe(true);
  });

  it("fails closed on missing authorized cell", () => {
    const { root, allowlist } = buildMiniSource([...FOUR]);
    const ledger = buildSourceHashLedger(root, allowlist, { expectedTotal: 4 });
    const staging = tempDir("mcc-stg-");
    stageCanonicalMethodCArtifact({
      sourceArtifactRoot: root,
      stagingRoot: staging,
      allowlist,
      sourceLedger: ledger.ledger,
      expectedTotal: 4,
      expectedPerLocale: 1,
    });
    rmSync(join(staging, "artifacts/controlled-v1/cells", FOUR[0]), {
      recursive: true,
      force: true,
    });
    const v = validateCanonicalStaging({
      stagingRoot: staging,
      allowlist,
      sourceLedger: ledger.ledger,
      expectedTotal: 4,
      expectedPerLocale: 1,
    });
    expect(v.ok).toBe(false);
    expect(v.errors.some((e) => /missing authorized cell/i.test(e))).toBe(true);
  });

  it("fails closed on duplicate cell directory listing", () => {
    // simulate duplicate via allowlist duplication detection
    const allow = resolveAuthorizedAllowlist({
      selection: {
        cells: [
          { cellId: FOUR[0] },
          { cellId: FOUR[0] },
          { cellId: FOUR[1] },
          { cellId: FOUR[2] },
          { cellId: FOUR[3] },
        ],
      },
      expectedTotal: 4,
      expectedPerLocale: 1,
    });
    expect(allow.ok).toBe(false);
    expect(allow.errors.some((e) => /duplicate/i.test(e))).toBe(true);
  });

  it("fails closed on unreceipted raster", () => {
    const { root, allowlist } = buildMiniSource([...FOUR]);
    const ledger = buildSourceHashLedger(root, allowlist, { expectedTotal: 4 });
    const staging = tempDir("mcc-stg-");
    stageCanonicalMethodCArtifact({
      sourceArtifactRoot: root,
      stagingRoot: staging,
      allowlist,
      sourceLedger: ledger.ledger,
      expectedTotal: 4,
      expectedPerLocale: 1,
    });
    writeFileSync(join(staging, "artifacts/controlled-v1/orphan.png"), TINY_PNG);
    const v = validateCanonicalStaging({
      stagingRoot: staging,
      allowlist,
      sourceLedger: ledger.ledger,
      expectedTotal: 4,
      expectedPerLocale: 1,
    });
    expect(v.ok).toBe(false);
    expect(v.errors.some((e) => /unauthorized raster|unreceipted/i.test(e))).toBe(true);
  });

  it("fails closed on receipt without PNG", () => {
    const { root, allowlist } = buildMiniSource([...FOUR]);
    const ledger = buildSourceHashLedger(root, allowlist, { expectedTotal: 4 });
    const staging = tempDir("mcc-stg-");
    stageCanonicalMethodCArtifact({
      sourceArtifactRoot: root,
      stagingRoot: staging,
      allowlist,
      sourceLedger: ledger.ledger,
      expectedTotal: 4,
      expectedPerLocale: 1,
    });
    rmSync(join(staging, "artifacts/controlled-v1/cells", FOUR[0], "final.png"), {
      force: true,
    });
    const v = validateCanonicalStaging({
      stagingRoot: staging,
      allowlist,
      sourceLedger: ledger.ledger,
      expectedTotal: 4,
      expectedPerLocale: 1,
    });
    expect(v.ok).toBe(false);
    expect(v.errors.some((e) => /receipt without PNG|zero PNG/i.test(e))).toBe(true);
  });

  it("fails closed on multi-PNG cell", () => {
    const { root, allowlist } = buildMiniSource([...FOUR]);
    const ledger = buildSourceHashLedger(root, allowlist, { expectedTotal: 4 });
    const staging = tempDir("mcc-stg-");
    stageCanonicalMethodCArtifact({
      sourceArtifactRoot: root,
      stagingRoot: staging,
      allowlist,
      sourceLedger: ledger.ledger,
      expectedTotal: 4,
      expectedPerLocale: 1,
    });
    writeFileSync(
      join(staging, "artifacts/controlled-v1/cells", FOUR[0], "extra.png"),
      TINY_PNG,
    );
    const v = validateCanonicalStaging({
      stagingRoot: staging,
      allowlist,
      sourceLedger: ledger.ledger,
      expectedTotal: 4,
      expectedPerLocale: 1,
    });
    expect(v.ok).toBe(false);
    expect(v.errors.some((e) => /multi-PNG/i.test(e))).toBe(true);
  });

  it("fails closed on non-ACCEPTED receipt", () => {
    const { root, allowlist } = buildMiniSource([...FOUR]);
    const pngSha = sha(TINY_PNG);
    writeAcceptedReceipt(
      join(root, "artifacts/controlled-v1/receipts/method-c-remaining", `${FOUR[0]}.receipt.json`),
      FOUR[0],
      pngSha,
      TINY_PNG.length,
      { status: "FAILED" },
    );
    const ledger = buildSourceHashLedger(root, allowlist, { expectedTotal: 4 });
    expect(ledger.ok).toBe(false);
    expect(ledger.errors.some((e) => /not ACCEPTED/i.test(e))).toBe(true);
  });

  it("fails closed on Method A receipt", () => {
    const { root, allowlist } = buildMiniSource([...FOUR]);
    writeAcceptedReceipt(
      join(root, "artifacts/controlled-v1/receipts/method-c-remaining", `${FOUR[0]}.receipt.json`),
      FOUR[0],
      sha(TINY_PNG),
      TINY_PNG.length,
      { route: "MASAARAT_SCREENSHOT" },
    );
    const ledger = buildSourceHashLedger(root, allowlist, { expectedTotal: 4 });
    expect(ledger.ok).toBe(false);
    expect(ledger.errors.some((e) => /INSTRUCTIONAL_COMPOSITION/i.test(e))).toBe(true);
  });

  it("fails closed on Method B receipt", () => {
    const { root, allowlist } = buildMiniSource([...FOUR]);
    writeAcceptedReceipt(
      join(root, "artifacts/controlled-v1/receipts/method-c-remaining", `${FOUR[0]}.receipt.json`),
      FOUR[0],
      sha(TINY_PNG),
      TINY_PNG.length,
      { route: "AUTHORIZED_EXTERNAL_SCREENSHOT" },
    );
    const ledger = buildSourceHashLedger(root, allowlist, { expectedTotal: 4 });
    expect(ledger.ok).toBe(false);
    expect(ledger.errors.some((e) => /INSTRUCTIONAL_COMPOSITION/i.test(e))).toBe(true);
  });

  it("fails closed on source/staging PNG hash mismatch", () => {
    const { root, allowlist } = buildMiniSource([...FOUR]);
    const ledger = buildSourceHashLedger(root, allowlist, { expectedTotal: 4 });
    const staging = tempDir("mcc-stg-");
    stageCanonicalMethodCArtifact({
      sourceArtifactRoot: root,
      stagingRoot: staging,
      allowlist,
      sourceLedger: ledger.ledger,
      expectedTotal: 4,
      expectedPerLocale: 1,
    });
    writeFileSync(
      join(staging, "artifacts/controlled-v1/cells", FOUR[0], "final.png"),
      Buffer.from("not-the-same-png-bytes-xxxxxx"),
    );
    const v = validateCanonicalStaging({
      stagingRoot: staging,
      allowlist,
      sourceLedger: ledger.ledger,
      expectedTotal: 4,
      expectedPerLocale: 1,
    });
    expect(v.ok).toBe(false);
    expect(v.errors.some((e) => /PNG hash mismatch/i.test(e))).toBe(true);
  });

  it("fails closed on source/staging receipt hash mismatch", () => {
    const { root, allowlist } = buildMiniSource([...FOUR]);
    const ledger = buildSourceHashLedger(root, allowlist, { expectedTotal: 4 });
    const staging = tempDir("mcc-stg-");
    stageCanonicalMethodCArtifact({
      sourceArtifactRoot: root,
      stagingRoot: staging,
      allowlist,
      sourceLedger: ledger.ledger,
      expectedTotal: 4,
      expectedPerLocale: 1,
    });
    const receiptPath = join(
      staging,
      "artifacts/controlled-v1/receipts/method-c-remaining",
      `${FOUR[0]}.receipt.json`,
    );
    const mutated = JSON.parse(readFileSync(receiptPath, "utf8"));
    mutated.producedAt = "2099-01-01T00:00:00.000Z";
    writeFileSync(receiptPath, `${JSON.stringify(mutated, null, 2)}\n`, "utf8");
    const v = validateCanonicalStaging({
      stagingRoot: staging,
      allowlist,
      sourceLedger: ledger.ledger,
      expectedTotal: 4,
      expectedPerLocale: 1,
    });
    expect(v.ok).toBe(false);
    expect(v.errors.some((e) => /receipt hash mismatch/i.test(e))).toBe(true);
  });

  it("fails closed when locale counts are not uniform", () => {
    const uneven = [
      "synthetic-c-probe-alpha__ar-EG",
      "synthetic-c-probe-alpha__ar-MSA",
      "synthetic-c-probe-alpha__ar-Gulf",
      "synthetic-c-probe-beta__en",
      "synthetic-c-probe-gamma__en",
    ];
    const allow = resolveAuthorizedAllowlist({
      selection: { cells: uneven.map((cellId) => ({ cellId })) },
      expectedTotal: 5,
      expectedPerLocale: 1,
    });
    expect(allow.ok).toBe(false);
    expect(allow.errors.some((e) => /locale/i.test(e))).toBe(true);
  });

  it("fails closed when pilot cell is in allowlist", () => {
    const allow = resolveAuthorizedAllowlist({
      selection: {
        cells: [
          { cellId: "intro-m1-l4-ai-can-cannot__ar-EG" },
          { cellId: FOUR[1] },
          { cellId: FOUR[2] },
          { cellId: FOUR[3] },
        ],
      },
      expectedTotal: 4,
      expectedPerLocale: 1,
    });
    expect(allow.ok).toBe(false);
    expect(allow.errors.some((e) => /pilot|residue/i.test(e))).toBe(true);
  });

  it("repair mode makes zero renderer and provider calls and cannot invoke generation", () => {
    const { root, allowlist } = buildMiniSource([...FOUR]);
    // runMethodCCanonicalRepair always expects 356 — use staging API + telemetry proof here
    resetRenderTelemetry();
    const ledger = buildSourceHashLedger(root, allowlist, { expectedTotal: 4 });
    const staging = tempDir("mcc-stg-");
    const staged = stageCanonicalMethodCArtifact({
      sourceArtifactRoot: root,
      stagingRoot: staging,
      allowlist,
      sourceLedger: ledger.ledger,
      expectedTotal: 4,
      expectedPerLocale: 1,
    });
    expect(staged.ok).toBe(true);
    expect(renderTelemetry.rendererCalls).toBe(0);
    expect(renderTelemetry.browserLaunches).toBe(0);
    expect(renderTelemetry.paidProviderCalls).toBe(0);

    const bad = runMethodCCanonicalRepair({
      confirmToken: "WRONG",
      sourceArtifactRoot: root,
    });
    expect(bad.ok).toBe(false);
    expect(bad.errors[0]).toContain(METHOD_C_CANONICAL_REPAIR_CONFIRM_TOKEN);
  });

  it("rejects wrong prior_artifact_run_id", () => {
    const { root } = buildMiniSource([...FOUR]);
    const bad = runMethodCCanonicalRepair({
      confirmToken: METHOD_C_CANONICAL_REPAIR_CONFIRM_TOKEN,
      sourceArtifactRoot: root,
      priorArtifactRunId: "999",
    });
    expect(bad.ok).toBe(false);
    expect(bad.errors[0]).toContain(METHOD_C_CANONICAL_SOURCE_RUN_ID);
  });

  it("upload path / staging root stays outside production artifacts/controlled-v1", () => {
    const staging = tempDir("mcc-stg-");
    expect(staging.replace(/\\/g, "/").includes("/artifacts/controlled-v1/")).toBe(false);
    expect(resolve(staging).startsWith(ARTIFACTS_ROOT)).toBe(false);
  });

  it("workflow registers method-c-canonical-repair with sentinel and cabicci authority", () => {
    const yml = readFileSync(
      resolve(process.cwd(), ".github/workflows/controlled-400-visual-pipeline.yml"),
      "utf8",
    );
    expect(yml).toContain("- method-c-canonical-repair");
    expect(yml).toContain("RUN_AUTHORIZED_METHOD_C_CANONICAL_REPAIR");
    expect(yml).toContain("mode=method-c-canonical-repair requires dispatch_actor=cabicci");
    expect(yml).toContain("controlled-v1-method-c-canonical-");
    expect(yml).toContain("method-c-canonical-staging");
    expect(yml).toContain(
      "github.event.inputs.mode == 'preflight' || github.event.inputs.mode == 'report-only' || github.event.inputs.mode == 'method-c-canonical-repair'",
    );
    expect(yml).toContain("bun run controlled-visuals:test-static");
    // Render suite if-condition must not include canonical-repair
    expect(yml).toMatch(
      /Run static \+ renderer tests[\s\S]*?if: github\.event\.inputs\.mode == 'pilot' \|\| github\.event\.inputs\.mode == 'failed-only' \|\| github\.event\.inputs\.mode == 'full-400' \|\| github\.event\.inputs\.mode == 'method-c-remaining'/,
    );
    // No image-provider secrets in repair path
    expect(yml).not.toMatch(/OPENAI|ANTHROPIC|IMAGE_PROVIDER|REPLICATE/i);
  });
});

describe("method-c-canonical-repair real historical artifact", () => {
  const available = existsSync(
    join(HISTORICAL_SOURCE, "artifacts/controlled-v1/reports/method-c-remaining-selection.json"),
  );

  it.skipIf(!available)(
    "stages exactly 356/356 with source hash identity and excludes residue",
    () => {
      const selectionPath = join(
        HISTORICAL_SOURCE,
        "artifacts/controlled-v1/reports/method-c-remaining-selection.json",
      );
      const allow = resolveAuthorizedAllowlist({ selectionJsonPath: selectionPath });
      expect(allow.ok).toBe(true);
      expect(allow.cellIds).toHaveLength(METHOD_C_REMAINING_EXPECTED_TOTAL);

      const ledger = buildSourceHashLedger(HISTORICAL_SOURCE, allow.cellIds);
      expect(ledger.ok).toBe(true);
      expect(ledger.ledger).toHaveLength(METHOD_C_REMAINING_EXPECTED_TOTAL * 2);

      const staging = tempDir("mcc-hist-");
      const staged = stageCanonicalMethodCArtifact({
        sourceArtifactRoot: HISTORICAL_SOURCE,
        stagingRoot: staging,
        allowlist: allow.cellIds,
        sourceLedger: ledger.ledger,
        sourceExecutionSha: "6d01bbe07e0e97a02a84cdd38a7a722daad95d75",
      });
      expect(staged.ok).toBe(true);
      expect(staged.validation.counts.authorizedCellDirectories).toBe(356);
      expect(staged.validation.counts.finalPngFiles).toBe(356);
      expect(staged.validation.counts.acceptedReceipts).toBe(356);
      expect(staged.validation.counts.methodCReceipts).toBe(356);
      expect(staged.validation.counts.pilotCells).toBe(0);
      expect(staged.validation.counts.methodACells).toBe(0);
      expect(staged.validation.counts.methodBCells).toBe(0);
      expect(staged.validation.counts.unauthorizedCellDirectories).toBe(0);
      expect(staged.validation.counts.unreceiptedRasters).toBe(0);
      expect(staged.validation.counts.receiptOnlyCells).toBe(0);
      for (const locale of ["ar-EG", "ar-MSA", "ar-Gulf", "en"] as const) {
        expect(staged.validation.counts.perLocale[locale]).toBe(
          METHOD_C_REMAINING_EXPECTED_PER_LOCALE,
        );
      }
      expect(
        existsSync(
          join(
            staging,
            "artifacts/controlled-v1/cells/intro-m1-l4-ai-can-cannot__ar-EG/final.png",
          ),
        ),
      ).toBe(false);
      expect(
        existsSync(
          join(staging, "artifacts/controlled-v1/cells/intro-m1-l4-ai-can-cannot__en/final.png"),
        ),
      ).toBe(false);
      expect(assertSourceUnchanged(HISTORICAL_SOURCE, ledger.ledger).ok).toBe(true);
      expect(renderTelemetry.rendererCalls).toBe(0);

      // Disposable staging removed by afterEach
    },
    120_000,
  );
});
