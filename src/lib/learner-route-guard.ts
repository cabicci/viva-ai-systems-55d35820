import { redirect } from "@tanstack/react-router";
import { assertLearnerSession } from "@/lib/learner-auth.functions";
import { parseAuthIntentSearch } from "@/lib/kids/auth-intent";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";

/** Keep the public curriculum open, but require a verified session for every lesson route. */
export async function requireLearnerBeforeLoad(context?: {
  location: { pathname: string };
  search: { locale?: string };
}) {
  try {
    const session = await assertLearnerSession();
    if (session?.userId) return;
  } catch {
    // Verification failures must not allow the lesson loader to run.
  }
  const locale = await resolveRouteHeadLocale({ searchLocale: context?.search.locale });
  const search = parseAuthIntentSearch({ locale, returnTo: context?.location.pathname });
  throw redirect({ to: "/login", search, replace: true });
}
