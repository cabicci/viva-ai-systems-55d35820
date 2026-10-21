/** Adapters may deliberately supply localized, learner-safe error copy. */
export class AssistantRequestError extends Error {
  constructor(message: string, public readonly status = 500) { super(message); this.name = "AssistantRequestError"; }
}
