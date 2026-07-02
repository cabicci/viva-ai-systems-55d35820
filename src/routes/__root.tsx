import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { BackToDashboard } from "@/components/site/BackToDashboard";
import { RouteError, RouteNotFound } from "@/components/site/route-boundaries";
import { CloudHydration } from "@/components/site/CloudHydration";
import { LocaleRouterProvider } from "@/lib/locale/locale-router-provider";
import { useLocale } from "@/lib/locale/locale-context";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { readLocaleRuntimeInputs } from "@/lib/locale/read-locale-runtime-inputs";
import { resolvePublicLocale } from "@/lib/locale/resolve-public-locale";
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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "مسارات — masaarat.ai | تعلّم الذكاء الاصطناعي بالتطبيق" },
      { name: "description", content: "مسارات — منظومة تعليمية عربية حية مبنية على الذكاء الاصطناعي. تعلّم بالتنفيذ، ابنِ أنظمة حقيقية، وأطلق أعمالك." },
      { property: "og:title", content: "مسارات — masaarat.ai | تعلّم الذكاء الاصطناعي بالتطبيق" },
      { property: "og:description", content: "مسارات — منظومة تعليمية عربية حية مبنية على الذكاء الاصطناعي. تعلّم بالتنفيذ، ابنِ أنظمة حقيقية، وأطلق أعمالك." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://masaarat.ai" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "مسارات — masaarat.ai | تعلّم الذكاء الاصطناعي بالتطبيق" },
      { name: "twitter:description", content: "منظومة تعليمية حية مبنية على الذكاء الاصطناعي. تعلّم بالتنفيذ، ابنِ أنظمة حقيقية، وأطلق أعمالك." },
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
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap" },
      { rel: "canonical", href: "https://masaarat.ai" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "EducationalOrganization",
              "@id": "https://masaarat.ai/#organization",
              name: "مسارات",
              alternateName: "masaarat.ai",
              url: "https://masaarat.ai",
              description:
                "منظومة تعليمية حية مبنية على الذكاء الاصطناعي. تعلّم بالتنفيذ، ابنِ أنظمة حقيقية، وأطلق أعمالك.",
              inLanguage: "ar",
              areaServed: { "@type": "Place", name: "MENA" },
              educationalCredentialAwarded: "Certificate of Completion",
            },
            {
              "@type": "WebSite",
              "@id": "https://masaarat.ai/#website",
              url: "https://masaarat.ai",
              name: "مسارات",
              alternateName: "masaarat.ai",
              inLanguage: "ar",
              publisher: { "@id": "https://masaarat.ai/#organization" },
            },
            {
              "@type": "ItemList",
              "@id": "https://masaarat.ai/#paths",
              name: "مسارات التعلم بالذكاء الاصطناعي",
              itemListOrder: "https://schema.org/ItemListUnordered",
              numberOfItems: 5,
              itemListElement: [
                {
                  "@type": "Course",
                  position: 1,
                  name: "البناء — بناء تطبيقات AI",
                  description:
                    "اتعلّم تبني تطبيقات وأنظمة AI من الصفر باستخدام LLMs، RAG، Agents، وقواعد بيانات.",
                  provider: { "@id": "https://masaarat.ai/#organization" },
                  inLanguage: "ar",
                  educationalLevel: "Beginner to Advanced",
                  hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: "PT80H" },
                  offers: { "@type": "Offer", category: "Pro", availability: "https://schema.org/InStock" },
                },
                {
                  "@type": "Course",
                  position: 2,
                  name: "المحتوى — صناعة المحتوى بـ AI",
                  description:
                    "اتعلّم صناعة محتوى يوصل ويبيع: هوك، سكريبت، CTA، تصوير موبايل، Analytics.",
                  provider: { "@id": "https://masaarat.ai/#organization" },
                  inLanguage: "ar",
                  educationalLevel: "Beginner to Intermediate",
                  hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: "PT40H" },
                  offers: { "@type": "Offer", category: "Pro", availability: "https://schema.org/InStock" },
                },
                {
                  "@type": "Course",
                  position: 3,
                  name: "الأتمتة — أتمتة العمليات بـ n8n و AI",
                  description:
                    "اتعلّم تأتمت شغلك: Triggers/Actions، Webhooks، RAG في n8n، WhatsApp flows.",
                  provider: { "@id": "https://masaarat.ai/#organization" },
                  inLanguage: "ar",
                  educationalLevel: "Beginner to Advanced",
                  hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: "PT50H" },
                  offers: { "@type": "Offer", category: "Pro", availability: "https://schema.org/InStock" },
                },
                {
                  "@type": "Course",
                  position: 4,
                  name: "التحليل — تحليل البيانات واتخاذ القرار",
                  description:
                    "من السؤال الصح للقرار: AI summarization، patterns vs outliers، dashboards أسبوعية.",
                  provider: { "@id": "https://masaarat.ai/#organization" },
                  inLanguage: "ar",
                  educationalLevel: "Beginner to Intermediate",
                  hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: "PT35H" },
                  offers: { "@type": "Offer", category: "Pro", availability: "https://schema.org/InStock" },
                },
                {
                  "@type": "Course",
                  position: 5,
                  name: "الأعمال — قيادة المنظومة",
                  description:
                    "من القرارات للقيادة: weekly rhythm، customer lifecycle، delegate-or-automate، scaling.",
                  provider: { "@id": "https://masaarat.ai/#organization" },
                  inLanguage: "ar",
                  educationalLevel: "Intermediate to Advanced",
                  hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: "PT30H" },
                  offers: { "@type": "Offer", category: "Pro", availability: "https://schema.org/InStock" },
                },
              ],
            },
          ],
        }),
      },
    ],
  }),
  loader: async () => {
    try {
      const { urlLocale, cookieLocale, countryCode } =
        await readLocaleRuntimeInputs();
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
