export type RouteVisibility = "public" | "private" | "utility";

export type RouteCatalogEntry = {
  source: string;
  pattern: string;
  visibility: RouteVisibility;
  sitemap: boolean;
  robotsPath?: string;
};

export const ROUTE_CATALOG = [
  { source: "index.tsx", pattern: "/", visibility: "public", sitemap: true },
  { source: "contact.tsx", pattern: "/contact", visibility: "public", sitemap: true },
  { source: "curriculum.tsx", pattern: "/curriculum", visibility: "public", sitemap: true },
  { source: "kids.tsx", pattern: "/kids", visibility: "public", sitemap: false },
  { source: "kids.index.tsx", pattern: "/kids", visibility: "public", sitemap: true },
  {
    source: "kids.$levelId.tsx",
    pattern: "/kids/level-*",
    visibility: "utility",
    sitemap: false,
    robotsPath: "/kids/level-",
  },
  {
    source: "kids.$levelId.index.tsx",
    pattern: "/kids/level-*",
    visibility: "utility",
    sitemap: false,
    robotsPath: "/kids/level-",
  },
  {
    source: "kids.$levelId.$lessonNumber.tsx",
    pattern: "/kids/level-*/*",
    visibility: "private",
    sitemap: false,
    robotsPath: "/kids/level-",
  },
  { source: "pricing.tsx", pattern: "/pricing", visibility: "public", sitemap: true },
  { source: "privacy.tsx", pattern: "/privacy", visibility: "public", sitemap: true },
  { source: "terms.tsx", pattern: "/terms", visibility: "public", sitemap: true },
  {
    source: "[index].tsx",
    pattern: "/index",
    visibility: "utility",
    sitemap: false,
    robotsPath: "/index",
  },
  {
    source: "login.tsx",
    pattern: "/login",
    visibility: "utility",
    sitemap: false,
    robotsPath: "/login",
  },
  {
    source: "signup.tsx",
    pattern: "/signup",
    visibility: "utility",
    sitemap: false,
    robotsPath: "/signup",
  },
  {
    source: "forgot-password.tsx",
    pattern: "/forgot-password",
    visibility: "utility",
    sitemap: false,
    robotsPath: "/forgot-password",
  },
  {
    source: "reset-password.tsx",
    pattern: "/reset-password",
    visibility: "utility",
    sitemap: false,
    robotsPath: "/reset-password",
  },
  {
    source: "onboarding.tsx",
    pattern: "/onboarding",
    visibility: "utility",
    sitemap: false,
    robotsPath: "/onboarding",
  },
  {
    source: "account.tsx",
    pattern: "/account",
    visibility: "private",
    sitemap: false,
    robotsPath: "/account",
  },
  {
    source: "admin.index.tsx",
    pattern: "/admin/",
    visibility: "private",
    sitemap: false,
    robotsPath: "/admin",
  },
  {
    source: "ai-assistant.tsx",
    pattern: "/ai-assistant",
    visibility: "private",
    sitemap: false,
    robotsPath: "/ai-assistant",
  },
  {
    source: "analytics.tsx",
    pattern: "/analytics",
    visibility: "private",
    sitemap: false,
    robotsPath: "/analytics",
  },
  {
    source: "assistant-runtime.tsx",
    pattern: "/assistant-runtime",
    visibility: "private",
    sitemap: false,
    robotsPath: "/assistant-runtime",
  },
  {
    source: "build-logs.tsx",
    pattern: "/build-logs",
    visibility: "private",
    sitemap: false,
    robotsPath: "/build-logs",
  },
  {
    source: "dashboard.tsx",
    pattern: "/dashboard",
    visibility: "private",
    sitemap: false,
    robotsPath: "/dashboard",
  },
  {
    source: "image-gallery.tsx",
    pattern: "/image-gallery",
    visibility: "private",
    sitemap: false,
    robotsPath: "/image-gallery",
  },
  {
    source: "image-gallery.index.tsx",
    pattern: "/image-gallery/",
    visibility: "private",
    sitemap: false,
    robotsPath: "/image-gallery",
  },
  {
    source: "image-gallery.$path.tsx",
    pattern: "/image-gallery/*",
    visibility: "private",
    sitemap: false,
    robotsPath: "/image-gallery",
  },
  {
    source: "learn.$pathId.$lessonId.tsx",
    pattern: "/learn/*",
    visibility: "private",
    sitemap: false,
    robotsPath: "/learn/",
  },
  {
    source: "roadmap.index.tsx",
    pattern: "/roadmap/",
    visibility: "private",
    sitemap: false,
    robotsPath: "/roadmap",
  },
  {
    source: "roadmap.$id.tsx",
    pattern: "/roadmap/*",
    visibility: "private",
    sitemap: false,
    robotsPath: "/roadmap",
  },
  {
    source: "start.tsx",
    pattern: "/start",
    visibility: "private",
    sitemap: false,
    robotsPath: "/start",
  },
  {
    source: "system-state.tsx",
    pattern: "/system-state",
    visibility: "private",
    sitemap: false,
    robotsPath: "/system-state",
  },
] as const satisfies readonly RouteCatalogEntry[];

export const PUBLIC_SITEMAP_PATHS = ROUTE_CATALOG.filter((route) => route.sitemap).map(
  (route) => route.pattern,
);
