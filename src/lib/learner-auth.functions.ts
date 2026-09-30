import { createServerFn } from "@tanstack/react-start";

/** Verify the request before a lesson loader can return authored content. */
export const assertLearnerSession = createServerFn({ method: "GET" }).handler(async () => {
  const { resolveVerifiedRequestUser } = await import("@/lib/ssr-request-auth.server");
  const user = await resolveVerifiedRequestUser();
  return user ? { userId: user.userId } : null;
});
