import { createFileRoute } from "@tanstack/react-router";
import { LockKeyhole, UserRoundCheck } from "lucide-react";
import { ContactForm } from "@/components/site/ContactForm";
import { Footer } from "@/components/site/Footer";
import { Navbar } from "@/components/site/Navbar";
import { buildLocalizedPublicMeta } from "@/lib/locale/build-localized-public-meta";
import { useLocale } from "@/lib/locale/locale-context";
import { parseLocaleSearchParam } from "@/lib/locale/locale-search";
import { resolveRouteHeadLocale } from "@/lib/locale/resolve-route-head-locale";
import { useUiString } from "@/lib/locale/use-ui-strings";

export const Route = createFileRoute("/contact")({
  validateSearch: (raw: Record<string, unknown>) => parseLocaleSearchParam(raw),
  head: async ({ match }) => {
    const locale = await resolveRouteHeadLocale({ searchLocale: match.search.locale });
    return buildLocalizedPublicMeta(locale, "contact");
  },
  component: ContactPage,
});

function ContactPage() {
  const t = useUiString();
  const { dir } = useLocale();

  return (
    <div className="min-h-dvh overflow-hidden" dir={dir}>
      <Navbar />
      <main id="main-content" className="relative">
        <div className="pointer-events-none absolute -right-44 top-10 h-[28rem] w-[28rem] rounded-full bg-primary/15 blur-[110px]" />
        <div className="pointer-events-none absolute -left-44 bottom-10 h-[26rem] w-[26rem] rounded-full bg-accent/20 blur-[110px]" />
        <div className="container relative mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:py-20">
          <section className="pt-4 lg:sticky lg:top-28 lg:pt-10">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
              {t("contact.eyebrow")}
            </p>
            <h1 className="mt-4 text-4xl font-black leading-[1.15] md:text-5xl">
              {t("contact.title")}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              {t("contact.subtitle")}
            </p>

            <div className="mt-9 grid gap-3 text-sm text-foreground/75 sm:grid-cols-2 lg:grid-cols-1">
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white/55 p-4 backdrop-blur">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <LockKeyhole className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>{t("contact.trust.private")}</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-white/55 p-4 backdrop-blur">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                  <UserRoundCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>{t("contact.trust.noAccount")}</span>
              </div>
            </div>
          </section>

          <ContactForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
