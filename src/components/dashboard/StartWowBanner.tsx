import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Compass, X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import {
  isWowExperienceSeen,
  markWowExperienceSeen,
} from "@/lib/learner-events";
import { useUiString } from "@/lib/locale/use-ui-strings";

const FIRST_WEEK_DAYS = 7;

export function StartWowBanner() {
  const { user } = useAuth();
  const t = useUiString();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user?.created_at || isWowExperienceSeen()) {
      setVisible(false);
      return;
    }
    const ageDays =
      (Date.now() - new Date(user.created_at).getTime()) / (24 * 60 * 60 * 1000);
    setVisible(ageDays <= FIRST_WEEK_DAYS);
  }, [user?.created_at]);

  if (!visible) return null;

  function dismiss() {
    markWowExperienceSeen();
    setVisible(false);
  }

  return (
    <div className="glass rounded-2xl border border-primary/30 p-4 md:p-5 mb-4 flex flex-col sm:flex-row sm:items-center gap-4 animate-fade-up">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <Compass className="h-5 w-5" />
        </span>
        <div>
          <p className="font-bold text-foreground text-sm mb-1">
            {t("dashboard.wow.title")}
          </p>
          <p className="text-xs text-muted-foreground leading-loose">
            {t("dashboard.wow.body")}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button asChild variant="hero" size="sm">
          <Link to="/start">
            {t("dashboard.wow.cta")}
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("dashboard.hint.close")}
          onClick={dismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
