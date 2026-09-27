import { redirect } from "@tanstack/react-router";
import { assertLearnerSession } from "@/lib/learner-auth.functions";

/** Keep the public curriculum open, but require a verified session for every lesson route. */
export async function requireLearnerBeforeLoad() {
  try {
    const session = await assertLearnerSession();
    if (session?.userId) return;
  } catch {
    // Verification failures must not allow the lesson loader to run.
  }
  throw redirect({ to: "/login", replace: true });
}
