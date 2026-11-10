/** Only existing ledger settlement or replay evidence crosses the transport. */
export type AssistantRetryEvidence = { chargedUnits?: 0 | 1; replay?: true; error?: string };

const terminalConflicts = new Set([
  "ASSISTANT_REQUEST_EXPIRED", "ASSISTANT_REQUEST_CONFLICT",
  "ASSISTANT_ATTEMPT_CONFLICT", "ASSISTANT_REQUEST_NOT_FOUND",
]);

export function terminalAssistantErrorStatus(error: unknown): 400 | 409 | undefined {
  if (error === "ASSISTANT_INVALID_REQUEST") return 400;
  return typeof error === "string" && terminalConflicts.has(error) ? 409 : undefined;
}

// Callers use their guarded reader so a stale response cannot alter a current request.
export function readAssistantRetryEvidence(read: (key: "chargedUnits" | "replay" | "error") => unknown): AssistantRetryEvidence {
  const chargedUnits = read("chargedUnits");
  const replay = read("replay");
  const error = read("error");
  return {
    ...(chargedUnits === 0 || chargedUnits === 1 ? { chargedUnits } : {}),
    ...(replay === true ? { replay } : {}),
    ...(typeof error === "string" && terminalAssistantErrorStatus(error) !== undefined ? { error } : {}),
  };
}

export function isTerminalAssistantRetry(status: unknown, evidence: AssistantRetryEvidence): boolean {
  return evidence.chargedUnits === 0 || evidence.chargedUnits === 1 || evidence.replay === true ||
    ((status === 400 || status === 409) && terminalAssistantErrorStatus(evidence.error) === status);
}
