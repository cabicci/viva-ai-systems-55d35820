import { describe, expect, it } from "vitest";
import {
  fingerprintSkipContract,
  makeAcceptedReceipt,
  shouldSkipCell,
} from "../../../src/lib/lesson-visuals/v1/receipts/skipContract";
import type { LessonVisualMaster } from "../../../src/lib/lesson-visuals/v1/types";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const master = JSON.parse(
  readFileSync(
    resolve(import.meta.dirname, "fixtures/tiny-synthetic.master.json"),
    "utf8",
  ),
) as LessonVisualMaster;

describe("skip/retry contract", () => {
  it("skips only on ACCEPTED fingerprint match", () => {
    const accepted = makeAcceptedReceipt({
      master,
      locale: "en",
      artifactSha256: null,
    });
    expect(shouldSkipCell({ existing: accepted, master, locale: "en" })).toEqual(
      {
        skip: true,
        reason: "ACCEPTED fingerprint match",
      },
    );
  });

  it("retries when fingerprint mismatches", () => {
    const accepted = makeAcceptedReceipt({
      master,
      locale: "en",
      artifactSha256: null,
    });
    const mutated = {
      ...accepted,
      fingerprint: "0".repeat(64),
    };
    const result = shouldSkipCell({
      existing: mutated,
      master,
      locale: "en",
    });
    expect(result.skip).toBe(false);
    expect(result.reason).toContain("fingerprint mismatch");
  });

  it("retries FAILED receipts", () => {
    const failed = {
      ...makeAcceptedReceipt({ master, locale: "en", artifactSha256: null }),
      status: "FAILED" as const,
    };
    expect(
      shouldSkipCell({ existing: failed, master, locale: "en" }).skip,
    ).toBe(false);
  });

  it("fingerprint is stable", () => {
    const a = fingerprintSkipContract({
      cellId: `${master.lessonId}__en`,
      lessonId: master.lessonId,
      locale: "en",
      method: master.method,
      sourceSha: master.sourceSha,
      masterChecksum: master.checksum,
      receiptVersion: "lesson-visual-receipt/v1",
    });
    const b = fingerprintSkipContract({
      cellId: `${master.lessonId}__en`,
      lessonId: master.lessonId,
      locale: "en",
      method: master.method,
      sourceSha: master.sourceSha,
      masterChecksum: master.checksum,
      receiptVersion: "lesson-visual-receipt/v1",
    });
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });
});
