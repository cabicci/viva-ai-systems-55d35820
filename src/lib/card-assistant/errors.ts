import type { AssistantRetryEvidence } from "./retry";
/** Adapters may deliberately supply localized, learner-safe error copy. */
export class AssistantRequestError extends Error {
  constructor(message: string, public readonly status = 500, public readonly retry?: AssistantRetryEvidence) {
    super(message);
    this.name = "AssistantRequestError";
  }
}
