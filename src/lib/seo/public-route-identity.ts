export const PUBLIC_ROUTE_PATHS = {
  home: "/",
  contact: "/contact",
  curriculum: "/curriculum",
  pricing: "/pricing",
  privacy: "/privacy",
  terms: "/terms",
} as const;

/** Keep the existing language-neutral sitemap policy; never copy search/hash. */
export function buildPublicRouteIdentity(kind: keyof typeof PUBLIC_ROUTE_PATHS) {
  const url = `https://masaarat.ai${PUBLIC_ROUTE_PATHS[kind]}`;
  return {
    meta: [{ property: "og:url", content: url }],
    links: [{ rel: "canonical", href: url }],
  };
}
