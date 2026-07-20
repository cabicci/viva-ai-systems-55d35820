import { createHash } from "node:crypto";
import type { CellReceipt, LessonVisualMaster, Locale, Method } from "../types";

export interface SkipContractInput {
  cellId: string;
  lessonId: string;
  locale: Locale;
  method: Method;
  sourceSha: string;
  masterChecksum: string;
  receiptVersion: "lesson-visual-receipt/v1";
}

export function fingerprintSkipContract(input: SkipContractInput): string {
  const canonical = JSON.stringify({
    cellId: input.cellId,
    lessonId: input.lessonId,
    locale: input.locale,
    masterChecksum: input.masterChecksum,
    method: input.method,
    receiptVersion: input.receiptVersion,
    sourceSha: input.sourceSha,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Skip only when an ACCEPTED receipt fingerprint matches the current contract.
 */
export function shouldSkipCell(args: {
  existing: CellReceipt | null | undefined;
  master: LessonVisualMaster;
  locale: Locale;
}): { skip: boolean; reason: string } {
  const { existing, master, locale } = args;
  if (!existing) {
    return { skip: false, reason: "no prior receipt" };
  }
  if (existing.status !== "ACCEPTED") {
    return { skip: false, reason: `prior status ${existing.status}` };
  }
  const cellId = `${master.lessonId}__${locale}`;
  const expected = fingerprintSkipContract({
    cellId,
    lessonId: master.lessonId,
    locale,
    method: master.method,
    sourceSha: master.sourceSha,
    masterChecksum: master.checksum,
    receiptVersion: "lesson-visual-receipt/v1",
  });
  if (existing.fingerprint !== expected) {
    return { skip: false, reason: "fingerprint mismatch — retry required" };
  }
  if (existing.masterChecksum !== master.checksum) {
    return { skip: false, reason: "master checksum changed" };
  }
  if (existing.sourceSha !== master.sourceSha) {
    return { skip: false, reason: "sourceSha changed" };
  }
  return { skip: true, reason: "ACCEPTED fingerprint match" };
}

export function makeAcceptedReceipt(args: {
  master: LessonVisualMaster;
  locale: Locale;
  artifactSha256: string | null;
}): CellReceipt {
  const cellId = `${args.master.lessonId}__${args.locale}`;
  const fingerprint = fingerprintSkipContract({
    cellId,
    lessonId: args.master.lessonId,
    locale: args.locale,
    method: args.master.method,
    sourceSha: args.master.sourceSha,
    masterChecksum: args.master.checksum,
    receiptVersion: "lesson-visual-receipt/v1",
  });
  return {
    receiptVersion: "lesson-visual-receipt/v1",
    cellId,
    lessonId: args.master.lessonId,
    locale: args.locale,
    method: args.master.method,
    status: "ACCEPTED",
    sourceSha: args.master.sourceSha,
    masterChecksum: args.master.checksum,
    fingerprint,
    artifactSha256: args.artifactSha256,
    producedAt: new Date().toISOString(),
    error: null,
  };
}
