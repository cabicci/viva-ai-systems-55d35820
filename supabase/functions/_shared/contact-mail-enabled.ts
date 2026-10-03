/** The owner-enabled direct route and its durable retries share one decision. */
export function contactMailEnabled(existing: string | undefined, direct: string | undefined) {
  return existing === "true" || direct === "true";
}
