import { useUiString } from "@/lib/locale/use-ui-strings";
import { APPROVED_PRICES_MINOR } from "@/lib/billing/catalogue/prices";
type PaidPlanKey = "pro" | "pro_plus";
function formatMinorUnits(amount: number) {
  const major = amount / 100;
  return Number.isInteger(major) ? String(major) : major.toFixed(2);
}
export function PlanPrices({ plan }: { plan: PaidPlanKey }) {
  const t = useUiString();
  const egypt = APPROVED_PRICES_MINOR.EG[plan];
  const international = APPROVED_PRICES_MINOR.INTL[plan];

  return (
    <div className="mb-5 rounded-xl border border-border/60 bg-background/60 p-4">
      <p className="font-bold">
        {formatMinorUnits(egypt.month)} EGP{" "}
        <span className="text-xs font-normal text-muted-foreground">
          / {t("pricing.price.month")}
        </span>
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatMinorUnits(egypt.year)} EGP / {t("pricing.price.year")}
      </p>
      <p className="mt-3 border-t border-border/50 pt-3 text-xs text-muted-foreground">
        {t("pricing.price.international")}: {formatMinorUnits(international.month)} USD /{" "}
        {t("pricing.price.month")} · {formatMinorUnits(international.year)} USD /{" "}
        {t("pricing.price.year")}
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground">{t("pricing.price.taxExclusive")}</p>
    </div>
  );
}
