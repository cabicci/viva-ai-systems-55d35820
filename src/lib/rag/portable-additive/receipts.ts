import { sha256Json } from "./identity";
import type { AuditReceipt } from "./types";

let receiptSeq = 0;

export function resetReceiptSeqForTests(): void {
  receiptSeq = 0;
}

export function createAuditReceipt(input: {
  operation: AuditReceipt["operation"];
  batchId: string | null;
  ok: boolean;
  details: Record<string, unknown>;
  timestamp?: string;
}): AuditReceipt {
  receiptSeq += 1;
  const timestamp = input.timestamp ?? "1970-01-01T00:00:00.000Z";
  const receiptId = sha256Json({
    n: receiptSeq,
    operation: input.operation,
    batchId: input.batchId,
    ok: input.ok,
    details: input.details,
    timestamp,
  }).slice(0, 24);

  return {
    receiptId,
    operation: input.operation,
    batchId: input.batchId,
    ok: input.ok,
    timestamp,
    details: input.details,
  };
}
