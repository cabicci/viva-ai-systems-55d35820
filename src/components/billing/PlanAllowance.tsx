import { useLocale } from "@/lib/locale/locale-context";
import { commercialCopy } from "@/lib/billing/commercial-copy";

export function PlanAllowance({ family = false }: { family?: boolean }) {
  const { locale } = useLocale();
  const copy = commercialCopy(locale);
  return (
    <div className="my-5 space-y-2 text-sm leading-relaxed">
      <p className="font-semibold">{family ? copy.family : copy.included}</p>
      <p className="text-muted-foreground">{copy.renewal}</p>
    </div>
  );
}

export function RenewalNotice() {
  const { locale } = useLocale();
  const copy = commercialCopy(locale);
  return (
    <aside className="space-y-2 rounded-xl border p-4 text-sm leading-relaxed text-muted-foreground">
      <p>{copy.renewal}</p>
      <p>{copy.monthly}</p>
    </aside>
  );
}
