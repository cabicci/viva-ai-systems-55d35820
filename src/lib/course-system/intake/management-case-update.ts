const caseUpdates = new Map([
  ["AC-MGT-CHANGE", "sikka-update"],
  ["AC-MGT-STRAT", "mishwar-update"],
  ["AC-MGT-CONT", "supply-update"],
  ["AC-MGT-BOARD", "board-update"],
]);

export function initialDecisionForUpdate(request: {
  area: string;
  course: string;
  lesson: string;
  asset: string;
}) {
  if (
    request.area === "academic" &&
    caseUpdates.get(request.course) === request.asset &&
    request.lesson === request.course + "-L40"
  ) {
    return request.course + "-L39";
  }
}

type Submission = { section?: string; result?: { state?: string } };
type InitialDecision = { version?: string; events?: Submission[] };

export function hasSubmittedInitialDecision(decision: InitialDecision | null, edition?: string) {
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
