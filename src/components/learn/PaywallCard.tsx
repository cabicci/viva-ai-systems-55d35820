import { Lock, BadgeCheck, Route, ArrowLeft } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useUiString } from "@/lib/locale/use-ui-strings";

/* Inline paywall used inside the lesson page when a free user
 * tries to open a Pro-only lesson. */
export function PaywallCard({
  pathTitle,
  pathId,
}: {
  pathTitle: string;
  pathId: string;
}) {
  const t = useUiString();

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-8 text-center space-y-5">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[image:var(--gradient-primary)]">
        <Lock className="h-6 w-6 text-primary-foreground" />
      </div>
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-primary">
          <BadgeCheck className="h-3 w-3" /> Pro
        </span>
        <h2 className="text-2xl font-black">{t("learn.paywall.title")}</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t("learn.paywall.body").replace("{pathTitle}", pathTitle)}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 justify-center items-center">
        <Button asChild variant="violet" size="lg">
          <Link to="/pricing">
            <BadgeCheck className="h-4 w-4" /> {t("learn.paywall.activatePro")}
          </Link>
        </Button>
        <Button asChild variant="glass" size="lg">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4 rotate-180" />{" "}
            {t("learn.paywall.backToDashboard")}
          </Link>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("learn.paywall.pathFooter")
          .replace("{pathTitle}", pathTitle)
          .replace("{pathId}", pathId)}
      </p>
    </div>
  );
}

/* Inline "complete intro first" gate */
export function IntroGateCard({
  done,
  total,
}: {
  done: number;
  total: number;
}) {
  const t = useUiString();
  const remaining = Math.max(total - done, 0);

  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/[0.05] p-8 text-center space-y-5">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[image:var(--gradient-accent)]">
        <Route className="h-6 w-6 text-accent-foreground" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black">{t("learn.introGate.title")}</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t("learn.introGate.body")}
        </p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t("learn.introGate.remaining")
            .replace("{remaining}", String(remaining))
            .replace("{total}", String(total))}
        </p>
      </div>
      <Button asChild variant="hero" size="lg">
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4 rotate-180" /> {t("learn.introGate.startIntro")}
        </Link>
      </Button>
    </div>
  );
}
