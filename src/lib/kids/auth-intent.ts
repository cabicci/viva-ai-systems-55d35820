import { parseLocaleSearchParam } from "@/lib/locale/locale-search";

export const SAFE_LINE_RETURNS = [
  "/my-learning",
  "/verify-phone",
  "/ai",
  "/pricing",
  "/curriculum",
  "/kids",
  "/kids/pricing",
  "/kids/curriculum",
  "/academic",
  "/academic/curriculum",
  "/academic/pricing",
  "/technical",
  "/technical/pricing",
  "/technical/curriculum",
] as const;
type LearnerReturn =
  `/learn/${"intro" | "business" | "creator" | "analyst" | "automator" | "builder"}/${string}`;
type SafeReturn = (typeof SAFE_LINE_RETURNS)[number] | LearnerReturn;

export function isLearnerAuthReturn(value: unknown): value is LearnerReturn {
  return (
    typeof value === "string" &&
    value === value.trim() &&
    /^\/learn\/(intro|business|creator|analyst|automator|builder)\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(
      value,
    )
  );
}

/** Only fixed first-party paths or plain lesson paths; never URLs, queries or encoded redirects. */
export function isSafeAuthReturn(value: unknown): value is SafeReturn {
  return (
    typeof value === "string" &&
    (SAFE_LINE_RETURNS.includes(value as (typeof SAFE_LINE_RETURNS)[number]) ||
      isLearnerAuthReturn(value))
  );
}

export type AuthIntentSearch = {
  locale?: string;
  intent?: "kids";
  returnTo?: SafeReturn;
};

export function parseAuthIntentSearch(raw: Record<string, unknown>): AuthIntentSearch {
  return {
    ...parseLocaleSearchParam(raw),
    intent: raw.intent === "kids" ? "kids" : undefined,
    ...(isSafeAuthReturn(raw.returnTo) ? { returnTo: raw.returnTo } : {}),
  };
}

export function kidsSignupRedirect(origin: string, search: AuthIntentSearch): string {
  if (search.intent !== "kids") {
    if (!isSafeAuthReturn(search.returnTo)) return `${origin}/dashboard`;
    const destination = new URL(search.returnTo, origin);
    if (search.locale) destination.searchParams.set("locale", search.locale);
    return destination.toString();
  }
  const destination = new URL("/kids/family", origin);
  if (search.locale) destination.searchParams.set("locale", search.locale);
  return destination.toString();
}
