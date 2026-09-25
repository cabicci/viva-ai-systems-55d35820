import { SITE_STRUCTURED_DATA } from "@/lib/seo/site-structured-data";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { BackToDashboard } from "@/components/site/BackToDashboard";
import { RouteError, RouteNotFound } from "@/components/site/route-boundaries";
import { CloudHydration } from "@/components/site/CloudHydration";
import { AnalyticsConsentGate } from "@/components/site/AnalyticsConsent";
import { LocaleRouterProvider } from "@/lib/locale/locale-router-provider";
import { useLocale } from "@/lib/locale/locale-context";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { readLocaleRuntimeInputs } from "@/lib/locale/read-locale-runtime-inputs";
import { resolvePublicLocale } from "@/lib/locale/resolve-public-locale";
import { buildLocalizedPublicMeta } from "@/lib/locale/build-localized-public-meta";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { getUiString } from "@/lib/locale/ui-strings";
import { LOCALE_META, type SupportedLocale } from "@/lib/locale/types";

type RootLoaderData = {
  effectiveLocale: SupportedLocale;
  serverCountryCode?: string;
  serverCookieLocale?: string;
  serverUrlLocale?: string;
};

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  validateSearch: (raw: Record<string, unknown>) => parseLocaleSearchParam(raw),
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({
      searchLocale: match.search.locale,
    });
    const { meta: localizedMeta } = buildLocalizedPublicMeta(locale, "root");
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        ...localizedMeta,
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { property: "og:image", content: "https://masaarat.ai/brand/masaarat-og.png" },
        { name: "twitter:image", content: "https://masaarat.ai/brand/masaarat-og.png" },
      ],
      links: [
        { rel: "icon", href: "/brand/masaarat-icon.png", type: "image/png" },
        { rel: "apple-touch-icon", href: "/brand/masaarat-icon.png" },
        {
          rel: "stylesheet",
          href: appCss,
        },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap",
        },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(SITE_STRUCTURED_DATA),
        },
      ],
    };
  },
  loader: async () => {
    try {
      const { urlLocale, cookieLocale, countryCode } = await readLocaleRuntimeInputs();
      const localeRuntime = resolvePublicLocale({
        urlLocale,
        cookieLocale,
        countryCode,
      });
      return {
        effectiveLocale: localeRuntime.locale as SupportedLocale,
        serverCountryCode: countryCode,
        serverCookieLocale: cookieLocale,
        serverUrlLocale: urlLocale,
      };
    } catch {
      return {
        effectiveLocale: "ar-EG",
        serverCountryCode: undefined,
        serverCookieLocale: undefined,
        serverUrlLocale: undefined,
      };
    }
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: RouteNotFound,
  errorComponent: RouteError,
});

const FALLBACK_LOADER_DATA: RootLoaderData = {
  effectiveLocale: "ar-EG" as SupportedLocale,
};

function useRootLoaderDataSafe(): RootLoaderData {
  const data = Route.useLoaderData() as RootLoaderData | undefined;
  return data ?? FALLBACK_LOADER_DATA;
}

function RootShell({ children }: { children: React.ReactNode }) {
  const { effectiveLocale } = useRootLoaderDataSafe();
  const meta = LOCALE_META[effectiveLocale] ?? LOCALE_META["ar-EG"];

  return (
    <html lang={meta.lang} dir={meta.dir} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <a href="#main-content" className="skip-to-content">
          {getUiString(effectiveLocale, "a11y.skipToContent")}
        </a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { effectiveLocale, serverCountryCode, serverCookieLocale, serverUrlLocale } =
    useRootLoaderDataSafe();

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleRouterProvider
        initialLocale={effectiveLocale}
        serverCountryCode={serverCountryCode}
        serverCookieLocale={serverCookieLocale}
        serverUrlLocale={serverUrlLocale}
      >
        <AuthProvider>
          <CloudHydration />
          <AnalyticsConsentGate />
          <Outlet />
          <BackToDashboard />
          <LocaleToaster />
        </AuthProvider>
      </LocaleRouterProvider>
    </QueryClientProvider>
  );
}

function LocaleToaster() {
  const { dir } = useLocale();
  return <Toaster richColors position="top-center" dir={dir} />;
}
