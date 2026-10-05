import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import catalog from "@/lib/technical-education/catalog.json";
import { technicalCommand, type Delivery } from "@/lib/technical-education/client";
import { technicalUiCopy } from "@/lib/technical-education/ui-copy";
import { TechnicalLessonView } from "@/components/technical-education/TechnicalJourney";
import { FurniturePilotLesson } from "@/components/furniture-pilot/FurniturePilotLesson";
import type { TechnicalLesson } from "@/lib/technical-education/types";
import type { PilotCopy } from "../../scripts/technical-education/source/furniture-pilot/content";

export const Route = createFileRoute("/technical/learn/$lessonId")({
  validateSearch: parseLocaleSearchParam,
  component: TechnicalLessonPage,
  head: () => ({ meta: [{ name: "robots", content: "noindex,nofollow" }] }),
});
export function TechnicalLessonPage() {
  const { lessonId } = Route.useParams();
  const { locale } = useLocale();
  const { user, loading } = useAuth();
  const c = technicalUiCopy(locale);
  const record = catalog.lessons.find((l) => l.id === lessonId);
  const index = catalog.lessons.findIndex((l) => l.id === lessonId);
  const query = useQuery({
    queryKey: ["technical-lesson", user?.id, lessonId, locale],
    enabled: !!user?.id && !!record,
    queryFn: () => technicalCommand<Delivery>("lesson", lessonId, locale),
    staleTime: 0,
  });
  const href = (id: string) => `/technical/learn/${encodeURIComponent(id)}?locale=${locale}`;
  return (
    <div className="min-h-dvh">
      <Navbar variant="account" />
      {loading || (!!user && query.isPending && record) ? (
        <main className="container py-10">
          <p role="status">{c.loading}</p>
        </main>
      ) : !user ? (
        <main className="container py-10">
          <h1 className="text-2xl font-bold">{record?.title[locale] ?? c.error}</h1>
          <a className="mt-5 inline-block underline" href={`/login?locale=${locale}`}>
            {c.login}
          </a>
        </main>
      ) : !record || query.isError ? (
        <main className="container py-10">
          <p role="alert">{c.error}</p>
          <Button onClick={() => void query.refetch()}>{c.retry}</Button>
        </main>
      ) : !query.data?.allowed ? (
        <main className="container py-10">
          <h1 className="text-2xl font-bold">{record.title[locale]}</h1>
          <p className="my-5">{c.locked}</p>
          <a className="underline" href={`/technical/pricing?locale=${locale}`}>
            {c.plans}
          </a>
        </main>
      ) : (
        <>
          <div className="mx-auto max-w-7xl px-4 pt-6">
            <a className="font-bold text-primary" href={`/technical/curriculum?locale=${locale}`}>
              {c.back}
            </a>
          </div>
          {query.data.kind === "cabinet" ? (
            <FurniturePilotLesson
              key={`${user.id}:${lessonId}:${locale}`}
              locale={locale}
              copy={query.data.lesson as PilotCopy}
              video={query.data.video}
              files={query.data.files}
            />
          ) : (
            <main
              id="main-content"
              dir={locale === "en" ? "ltr" : "rtl"}
              className="mx-auto max-w-7xl space-y-6 px-4 py-8"
            >
              <TechnicalLessonView
                key={`${user.id}:${lessonId}:${locale}`}
                lesson={query.data.lesson as TechnicalLesson}
                video={query.data.video}
                files={query.data.files}
              />
            </main>
          )}
          <nav
            aria-label={c.back}
            className="mx-auto flex max-w-7xl justify-between gap-4 px-4 py-8"
          >
            {index > 0 ? (
              <a className="underline" href={href(catalog.lessons[index - 1].id)}>
                {c.previous}
              </a>
            ) : (
              <span />
            )}
            {index < catalog.lessons.length - 1 && (
              <a className="underline" href={href(catalog.lessons[index + 1].id)}>
                {c.next}
              </a>
            )}
          </nav>
        </>
      )}
      <Footer />
    </div>
  );
}
