import { createServerFn } from "@tanstack/react-start";

/** No browser-supplied identity, recipient or email content. */
export const requestAccountWelcome = createServerFn({ method: "POST" }).handler(async () => {
  const { resolveVerifiedRequestUser } = await import("@/lib/ssr-request-auth.server");
  const user = await resolveVerifiedRequestUser();
  if (!user) return null;
  const { attemptAccountWelcome } = await import("@/lib/account-welcome.server");
  await attemptAccountWelcome(user.userId);
  return null;
});
