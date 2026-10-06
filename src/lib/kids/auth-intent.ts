import { parseLocaleSearchParam } from "@/lib/locale/locale-search";

export const SAFE_LINE_RETURNS = [
  "/my-learning",
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
export type AuthIntentSearch = {
  locale?: string;
  intent?: "kids";
  returnTo?: (typeof SAFE_LINE_RETURNS)[number];
};

export function parseAuthIntentSearch(raw: Record<string, unknown>): AuthIntentSearch {
  return {
    ...parseLocaleSearchParam(raw),
    intent: raw.intent === "kids" ? "kids" : undefined,
    ...(typeof raw.returnTo === "string" &&
    SAFE_LINE_RETURNS.includes(raw.returnTo as (typeof SAFE_LINE_RETURNS)[number])
      ? { returnTo: raw.returnTo as (typeof SAFE_LINE_RETURNS)[number] }
      : {}),
  };
}

export function kidsSignupRedirect(origin: string, search: AuthIntentSearch): string {
  if (search.intent !== "kids") {
    if (!search.returnTo || !SAFE_LINE_RETURNS.includes(search.returnTo))
      return `${origin}/dashboard`;
    const destination = new URL(search.returnTo, origin);
    if (search.locale) destination.searchParams.set("locale", search.locale);
    return destination.toString();
  }
  const destination = new URL("/kids/family", origin);
  if (search.locale) destination.searchParams.set("locale", search.locale);
  return destination.toString();
}
