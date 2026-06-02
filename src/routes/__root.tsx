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

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AI Ecosystem Platform — منصة التعلم التنفيذي بالذكاء الاصطناعي" },
      { name: "description", content: "منظومة تعليمية حية مبنية على الذكاء الاصطناعي. تعلّم بالتنفيذ، ابنِ أنظمة حقيقية، وأطلق أعمالك." },
      { property: "og:title", content: "AI Ecosystem Platform — منصة التعلم التنفيذي بالذكاء الاصطناعي" },
      { property: "og:description", content: "منظومة تعليمية حية مبنية على الذكاء الاصطناعي. تعلّم بالتنفيذ، ابنِ أنظمة حقيقية، وأطلق أعمالك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "AI Ecosystem Platform — منصة التعلم التنفيذي بالذكاء الاصطناعي" },
      { name: "twitter:description", content: "منظومة تعليمية حية مبنية على الذكاء الاصطناعي. تعلّم بالتنفيذ، ابنِ أنظمة حقيقية، وأطلق أعمالك." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2ff7d28b-6ca1-4afc-8485-fe9bb532111e/id-preview-b6e3732b--db3e0659-63cc-4b7e-8985-61692a4adc4a.lovable.app-1778443747615.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2ff7d28b-6ca1-4afc-8485-fe9bb532111e/id-preview-b6e3732b--db3e0659-63cc-4b7e-8985-61692a4adc4a.lovable.app-1778443747615.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "EducationalOrganization",
              "@id": "https://ai-ecosystem-hub-72.lovable.app/#organization",
              name: "AI Ecosystem Platform",
              alternateName: "منصة AI Ecosystem",
              url: "https://ai-ecosystem-hub-72.lovable.app",
              description:
                "منظومة تعليمية حية مبنية على الذكاء الاصطناعي. تعلّم بالتنفيذ، ابنِ أنظمة حقيقية، وأطلق أعمالك.",
              inLanguage: "ar",
              areaServed: { "@type": "Place", name: "MENA" },
              educationalCredentialAwarded: "Certificate of Completion",
            },
            {
              "@type": "WebSite",
              "@id": "https://ai-ecosystem-hub-72.lovable.app/#website",
              url: "https://ai-ecosystem-hub-72.lovable.app",
              name: "AI Ecosystem Platform",
              inLanguage: "ar",
              publisher: { "@id": "https://ai-ecosystem-hub-72.lovable.app/#organization" },
            },
            {
              "@type": "ItemList",
              "@id": "https://ai-ecosystem-hub-72.lovable.app/#paths",
              name: "مسارات التعلم بالذكاء الاصطناعي",
              itemListOrder: "https://schema.org/ItemListUnordered",
              numberOfItems: 5,
              itemListElement: [
                {
                  "@type": "Course",
                  position: 1,
                  name: "Builder — بناء تطبيقات AI",
                  description:
                    "اتعلّم تبني تطبيقات وأنظمة AI من الصفر باستخدام LLMs، RAG، Agents، وقواعد بيانات.",
                  provider: { "@id": "https://ai-ecosystem-hub-72.lovable.app/#organization" },
                  inLanguage: "ar",
                  educationalLevel: "Beginner to Advanced",
                  hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: "PT80H" },
                  offers: { "@type": "Offer", category: "Pro", availability: "https://schema.org/InStock" },
                },
                {
                  "@type": "Course",
                  position: 2,
                  name: "Creator — صناعة المحتوى بـ AI",
                  description:
                    "اتعلّم صناعة محتوى يوصل ويبيع: هوك، سكريبت، CTA، تصوير موبايل، Analytics.",
                  provider: { "@id": "https://ai-ecosystem-hub-72.lovable.app/#organization" },
                  inLanguage: "ar",
                  educationalLevel: "Beginner to Intermediate",
                  hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: "PT40H" },
                  offers: { "@type": "Offer", category: "Pro", availability: "https://schema.org/InStock" },
                },
                {
                  "@type": "Course",
                  position: 3,
                  name: "Automator — أتمتة العمليات بـ n8n و AI",
                  description:
                    "اتعلّم تأتمت شغلك: Triggers/Actions، Webhooks، RAG في n8n، WhatsApp flows.",
                  provider: { "@id": "https://ai-ecosystem-hub-72.lovable.app/#organization" },
                  inLanguage: "ar",
                  educationalLevel: "Beginner to Advanced",
                  hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: "PT50H" },
                  offers: { "@type": "Offer", category: "Pro", availability: "https://schema.org/InStock" },
                },
                {
                  "@type": "Course",
                  position: 4,
                  name: "Analyst — تحليل البيانات واتخاذ القرار",
                  description:
                    "من السؤال الصح للقرار: AI summarization، patterns vs outliers، dashboards أسبوعية.",
                  provider: { "@id": "https://ai-ecosystem-hub-72.lovable.app/#organization" },
                  inLanguage: "ar",
                  educationalLevel: "Beginner to Intermediate",
                  hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online", courseWorkload: "PT35H" },
                  offers: { "@type": "Offer", category: "Pro", availability: "https://schema.org/InStock" },
                },
                {
                  "@type": "Course",
                  position: 5,
                  name: "Business — قيادة المنظومة",
                  description:
                    "من القرارات للقيادة: weekly rhythm، customer lifecycle، delegate-or-automate، scaling.",
                  provider: { "@id": "https://ai-ecosystem-hub-72.lovable.app/#organization" },
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
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: RouteNotFound,
  errorComponent: RouteError,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        <a href="#main-content" className="skip-to-content">
          تخطّى للمحتوى الأساسي
        </a>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CloudHydration />
        <Outlet />
        <BackToDashboard />
        <Toaster richColors position="top-center" dir="rtl" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
