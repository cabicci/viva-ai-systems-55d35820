type Result = Record<string, unknown>;
export type AutomaticDriverDependencies = {
  call: (operation: "status" | "tick") => Promise<Result>;
  wait: (milliseconds: number) => Promise<unknown>;
  now: () => number;
  log: (message: string) => void;
};
/** Retrying deployment status is harmless. A state-changing tick is never
 * repeated after a transport error: the durable backend owns reconciliation. */
export async function runAutomaticDriver(deps: AutomaticDriverDependencies): Promise<"complete" | "disabled" | "busy" | "paused"> {
  let ready = false;
  for (let i = 0; i < 30; i++) {
    try {
      const status = await deps.call("status");
      if (status.schemaVersion === "assistant-auto-v1") {
        if (status.enabled !== true) return "disabled";
        ready = true; break;
      }
    } catch { /* only read-only readiness can be retried */ }
    await deps.wait(15000);
  }
  if (!ready) throw new Error("AUTOMATION_DEPLOYMENT_NOT_READY");
  const deadline = deps.now() + 40 * 60000;
  let held = false;
  for (let count = 0; count < 5000 && deps.now() < deadline; count++) {
    const result = await deps.call("tick");
    if (result.disabled === true || result.busy === true) {
      if (held) throw new Error("AUTOMATION_REVIEW_REQUIRED");
      return result.disabled === true ? "disabled" : "busy";
    }
    if (result.replayed === true) throw new Error("AUTOMATION_REQUEST_ALREADY_CONSUMED");
    if (result.held === true) {
      held = true;
      deps.log(JSON.stringify({ state: "held", code: /^AUTOMATION_[A-Z0-9_]{1,64}$/.test(String(result.code)) ? result.code : "AUTOMATION_OPERATION_UNAVAILABLE" }));
    } else if (result.done === true) {
      if (held || Number(result.held) > 0) throw new Error("AUTOMATION_REVIEW_REQUIRED");
      return "complete";
    } else if (result.progressed === true) {
      if (!["ai", "kids", "technical", "academic"].includes(String(result.area)) || typeof result.cardId !== "string" ||
        !/^[A-Za-z0-9-]{1,80}$/.test(result.cardId) || !Number.isSafeInteger(result.completedScopes) || !Number.isSafeInteger(result.totalScopes) ||
        Number(result.completedScopes) < 1 || Number(result.completedScopes) > Number(result.totalScopes)) throw new Error("AUTOMATION_RESPONSE_INVALID");
      if (result.cardComplete === true || count % 20 === 0) deps.log(JSON.stringify({ area: result.area, cardId: result.cardId,
        completedScopes: result.completedScopes, totalScopes: result.totalScopes, complete: result.cardComplete === true }));
    } else throw new Error("AUTOMATION_RESPONSE_INVALID");
  }
  if (held) throw new Error("AUTOMATION_REVIEW_REQUIRED");
  return "paused";
}
