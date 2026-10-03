/** The owner-enabled direct route and its durable retries share one decision. */
export function contactMailEnabled(direct: string | undefined) {
  return direct === "true";
}
