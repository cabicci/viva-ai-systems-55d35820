import { isAcademicAuthReturn, isLearnerAuthReturn, isTechnicalAuthReturn, parseAuthIntentSearch } from "@/lib/kids/auth-intent";
import { isSupportedLocale } from "@/lib/locale/resolve-locale";

/** Recovery carries only validated navigation context, never a requested email or payment data. */
export function parseRecoveryIntentSearch(raw: Record<string, unknown>) {
  const { locale, returnTo, intent } = parseAuthIntentSearch(raw);
  return { locale: locale && isSupportedLocale(locale) ? locale : undefined, returnTo, intent };
}

export function recoveryRedirectUrl(origin: string, raw: Record<string, unknown>): string {
  const destination = new URL("/reset-password", origin);
  const search = parseRecoveryIntentSearch(raw);
  for (const [key, value] of Object.entries(search)) {
    if (value) destination.searchParams.set(key, value);
  }
  return destination.toString();
}

/** Shared login/recovery return; every destination is revalidated at the boundary. */
export function authReturnNavigation(raw: Record<string, unknown>) {
  const search = parseRecoveryIntentSearch(raw);
  if (search.intent === "kids") {
    return {
      to: "/kids/family" as const,
      search: { locale: search.locale },
      replace: true as const,
    };
  }
  if (isAcademicAuthReturn(search.returnTo)) {
    const lessonId = search.returnTo.slice("/academic/learn/".length);
    return {
      to: "/academic/learn/$lessonId" as const,
      params: { lessonId },
      search: { locale: search.locale },
      replace: true as const,
    };
  }
  if (isTechnicalAuthReturn(search.returnTo)) {
    const lessonId = search.returnTo.slice("/technical/learn/".length);
    return {
      to: "/technical/learn/$lessonId" as const,
      params: { lessonId },
      search: { locale: search.locale },
      replace: true as const,
    };
  }
  if (isLearnerAuthReturn(search.returnTo)) {
    const [, , pathId, lessonId] = search.returnTo.split("/");
    return {
      to: "/learn/$pathId/$lessonId" as const,
      params: { pathId, lessonId },
      search: { locale: search.locale },
      replace: true as const,
    };
  }
  return {
    to: search.returnTo ?? ("/dashboard" as const),
    search: () => ({ locale: search.locale }),
    replace: true as const,
  };
}
