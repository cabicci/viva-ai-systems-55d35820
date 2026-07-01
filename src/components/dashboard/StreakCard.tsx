import { Flame } from "lucide-react";
import { useStreak } from "@/lib/entitlements";
import { useUiString } from "@/lib/locale/use-ui-strings";

const STAT_CARD_BASE =
  "group rounded-2xl p-5 card-lift animate-fade-up border border-border/60";
const STAT_CARD_STYLE = { background: "var(--gradient-hero)" as const };

export function StreakCard({ delay = 0 }: { delay?: number }) {
  const { streak } = useStreak();
  const t = useUiString();
  const current = streak.current_streak;
  const longest = streak.longest_streak;

  const nextMilestone =
    current < 3 ? 3 : current < 7 ? 7 : current < 30 ? 30 : current < 100 ? 100 : null;
  const remaining = nextMilestone ? nextMilestone - current : 0;

  return (
    <div
      className={`${STAT_CARD_BASE} h-full min-h-[160px] flex items-center gap-4`}
      style={{ ...STAT_CARD_STYLE, animationDelay: `${delay}ms` }}
    >
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-[image:var(--gradient-primary)] group-hover:scale-110 transition-transform shrink-0">
        <Flame className="h-6 w-6 text-primary-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{t("dashboard.streak.label")}</p>
        <p className="text-2xl font-black leading-tight mt-0.5">
          <span dir="ltr" className="tabular-nums">
            {current}
          </span>
          <span className="text-sm font-bold text-muted-foreground"> {t("dashboard.streak.days")}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {current === 0
            ? t("dashboard.streak.startToday")
            : nextMilestone
              ? t("dashboard.streak.daysToMilestone")
                  .replace("{remaining}", String(remaining))
                  .replace("{milestone}", String(nextMilestone))
              : t("dashboard.streak.longest").replace("{longest}", String(longest))}
        </p>
      </div>
    </div>
  );
}
