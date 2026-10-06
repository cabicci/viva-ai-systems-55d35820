import { Link } from "@tanstack/react-router";
import { BookOpen, ListChecks, Users } from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { LineIntroduction } from "@/components/site/LearningLines";
import { useLocale } from "@/lib/locale/locale-context";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { getAcademicOverviewCopy } from "@/lib/academic-education/overview-copy";

const icons = [BookOpen, ListChecks, Users];
const colors = ["var(--pastel-mint)", "var(--pastel-blue)", "var(--pastel-pink)"];

/** Public introduction only; course cards and lesson access remain server-authorized. */
export function AcademicOverviewPage() {
  const { locale, dir } = useLocale();
  const search = useLocaleLinkSearch();
  const c = getAcademicOverviewCopy(locale);
  const numbers = new Intl.NumberFormat(locale === "en" ? "en" : "ar");
  return (
    <div className="flex min-h-dvh flex-col" dir={dir}>
      <Navbar variant="account" />
      <main id="main-content" className="flex-1">
        <LineIntroduction line="academic" />
        <section className="container mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">{c.title}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground md:text-lg">{c.body}</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {c.features.map((feature, i) => {
              const Icon = icons[i];
              return (
                <article
                  key={feature.title}
                  className="rounded-3xl border border-border/60 bg-card p-6"
                >
                  <div
                    className="mb-5 grid h-14 w-14 place-items-center rounded-full"
                    style={{ background: colors[i] }}
                  >
                    <Icon aria-hidden className="h-6 w-6 text-foreground/80" strokeWidth={1.75} />
                  </div>
                  <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                </article>
              );
            })}
          </div>
        </section>
        <section className="container mx-auto px-4 py-16 md:py-24">
          <h2 className="mb-12 text-center text-3xl font-bold md:text-5xl">{c.journey}</h2>
          <ol className="mx-auto max-w-3xl space-y-5">
            {c.steps.map((step, i) => (
              <li
                key={step}
                className="flex items-center gap-4 rounded-3xl border border-border/60 bg-card p-6"
              >
                <span
                  className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-xl font-black"
                  style={{ background: colors[i] }}
                >
                  {numbers.format(i + 1)}
                </span>
                <p className="min-w-0 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="glass rounded-3xl p-6 text-center md:p-16">
            <h2 className="text-3xl font-black md:text-5xl">{c.courses}</h2>
            <p className="mx-auto mt-5 max-w-2xl leading-relaxed text-muted-foreground">
              {c.coursesBody}
            </p>
            <Link
              to="/academic/curriculum"
              search={search()}
              className="mt-8 inline-flex min-h-11 items-center rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground"
            >
              {c.browse}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
