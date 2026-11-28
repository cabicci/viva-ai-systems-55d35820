type Submission = { section?: string; result?: { state?: string } };
type InitialDecision = { version?: string; events?: Submission[] };

export function mayReadSikkaUpdate(decision: InitialDecision | null, edition?: string) {
  return Boolean(
    edition &&
    decision?.version === edition &&
    decision.events?.some(
      (event) =>
        event.section === "apply" &&
        (event.result?.state === "awaiting_review" || event.result?.state === "submitted"),
    ),
  );
}
