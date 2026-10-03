import { dispatchImmediateMail } from "./mail-dispatch.server";

/** Only the verified request actor; confirmation already persisted the outbox. */
export async function attemptAccountWelcome(userId: string) {
  if (process.env.ACCOUNT_WELCOME_ENABLED !== "true") return;
  // Only the worker owns claims/sends, including immediate attempts and retries.
  return dispatchImmediateMail({ stream: "welcome", id: userId });
}
