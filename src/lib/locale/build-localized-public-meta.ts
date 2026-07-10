import { getUiString } from "@/lib/locale/ui-strings";
import type { SupportedLocale } from "./types";

export type PublicRouteMetaKind = "home" | "pricing" | "terms" | "login" | "root";

export type RouteMetaTag =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string };

function withSocialTags(title: string, description: string): RouteMetaTag[] {
  return [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
}

const META_KEYS: Record<
  PublicRouteMetaKind,
  { title: Parameters<typeof getUiString>[1]; description: Parameters<typeof getUiString>[1] }
> = {
  home: {
    title: "meta.public.home.title",
    description: "meta.public.home.description",
  },
  pricing: {
    title: "meta.public.pricing.title",
    description: "meta.public.pricing.description",
  },
  terms: {
    title: "meta.public.terms.title",
    description: "meta.public.terms.description",
  },
  login: {
    title: "meta.public.login.title",
    description: "meta.public.login.description",
  },
  root: {
    title: "meta.root.title",
    description: "meta.root.description",
  },
};

export function buildLocalizedPublicMeta(
  locale: SupportedLocale,
  kind: PublicRouteMetaKind,
): { meta: RouteMetaTag[] } {
  const keys = META_KEYS[kind];
  const title = getUiString(locale, keys.title);
  const description = getUiString(locale, keys.description);
  return { meta: withSocialTags(title, description) };
}
