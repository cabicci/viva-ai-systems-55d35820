import { getUiString } from "@/lib/locale/ui-strings";
import { getKidsCopy } from "@/lib/kids/copy";
import type { SupportedLocale } from "./types";
import { buildPublicRouteIdentity } from "@/lib/seo/public-route-identity";

export type PublicRouteMetaKind =
  | "home"
  | "kids"
  | "pricing"
  | "terms"
  | "privacy"
  | "contact"
  | "login"
  | "root";

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
  Exclude<PublicRouteMetaKind, "kids">,
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
  privacy: {
    title: "meta.public.privacy.title",
    description: "meta.public.privacy.description",
  },
  contact: {
    title: "meta.public.contact.title",
    description: "meta.public.contact.description",
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
): { meta: RouteMetaTag[]; links?: { rel: string; href: string }[] } {
  if (kind === "kids") {
    const copy = getKidsCopy(locale);
    const identity = buildPublicRouteIdentity(kind);
    return {
      meta: [...withSocialTags(`${copy.title} — Masaarat`, copy.intro), ...identity.meta],
      links: identity.links,
    };
  }
  const keys = META_KEYS[kind];
  const title = getUiString(locale, keys.title);
  const description = getUiString(locale, keys.description);
  const meta = withSocialTags(title, description);
  if (kind === "root" || kind === "login") return { meta };
  const identity = buildPublicRouteIdentity(kind);
  return { meta: [...meta, ...identity.meta], links: identity.links };
}
