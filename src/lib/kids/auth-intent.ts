import { parseLocaleSearchParam } from "@/lib/locale/locale-search";

export type AuthIntentSearch = { locale?: string; intent?: "kids" };

export function parseAuthIntentSearch(raw: Record<string, unknown>): AuthIntentSearch {
  return {
    ...parseLocaleSearchParam(raw),
    intent: raw.intent === "kids" ? "kids" : undefined,
  };
}

export function kidsSignupRedirect(origin: string, search: AuthIntentSearch): string {
  if (search.intent !== "kids") return `${origin}/dashboard`;
  const destination = new URL("/kids", origin);
  if (search.locale) destination.searchParams.set("locale", search.locale);
  return destination.toString();
}
