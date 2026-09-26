import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { useLocale } from "@/lib/locale/locale-context";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { getKidsPrivacyCopy } from "@/lib/kids/privacy-copy";

export const Route = createFileRoute("/kids/privacy")({
  validateSearch: (raw: Record<string, unknown>) => parseLocaleSearchParam(raw),
  head: () => ({ meta: [{ title: "سياسة خصوصية مسارات كيدز | Masaarat Kids Privacy" }] }),
  component: KidsPrivacyPage,
});

function KidsPrivacyPage() {
  const { locale, dir } = useLocale();
  const localeSearch = useLocaleLinkSearch();
  const copy = getKidsPrivacyCopy(locale);
  return (
    <div className="flex min-h-dvh flex-col" dir={dir}>
      <Navbar />
      <main id="main-content" className="container mx-auto max-w-3xl flex-1 px-4 py-12">
        <Link
          to="/kids"
          search={localeSearch()}
          className="text-sm font-bold text-primary hover:underline"
        >
          {copy.back}
        </Link>
        <article className="mt-8 space-y-8 rounded-3xl border border-border/60 bg-card p-6 md:p-10">
          <header>
            <h1 className="text-3xl font-black">{copy.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{copy.updated}</p>
            <p className="mt-5 leading-relaxed">{copy.intro}</p>
          </header>
          {copy.sections.map((section) => (
            <section key={section.title} className="space-y-2">
              <h2 className="text-xl font-bold">{section.title}</h2>
              <p className="leading-relaxed text-muted-foreground">{section.body}</p>
            </section>
          ))}
          <a href={`mailto:${copy.contact}`} className="font-semibold text-primary underline">
            {copy.contact}
          </a>
        </article>
      </main>
      <Footer />
    </div>
  );
}
