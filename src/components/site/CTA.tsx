import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { useUiString } from "@/lib/locale/use-ui-strings";

export function CTA() {
  const { user, loading } = useAuth();
  const t = useUiString();
  const localeSearch = useLocaleLinkSearch();

  return (
    <section className="container mx-auto px-4 py-24">
      <div className="relative glass rounded-3xl overflow-hidden p-12 md:p-16 text-center">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute -top-20 right-1/3 h-60 w-60 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-20 left-1/4 h-60 w-60 rounded-full bg-accent/30 blur-3xl" />
        <div className="relative">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight">
            {t("cta.section.title")}{" "}
            <span className="text-gradient">{t("cta.section.titleHighlight")}</span>
          </h2>
          <p className="mt-5 text-muted-foreground text-lg max-w-xl mx-auto whitespace-pre-line">
            {t("cta.section.body")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {loading ? null : user ? (
              <Button asChild variant="hero" size="xl">
                <Link to="/dashboard" search={localeSearch()}>
                  {t("cta.myDashboard")}{" "}
                  <ArrowLeft className="h-4 w-4 animate-arrow-nudge-always" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="hero" size="xl">
                  <Link to="/signup">
                    {t("cta.createAccount")}{" "}
                    <ArrowLeft className="h-4 w-4 animate-arrow-nudge-always" />
                  </Link>
                </Button>
                <Button asChild variant="glass" size="xl">
                  <Link to="/login">{t("cta.signIn")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
