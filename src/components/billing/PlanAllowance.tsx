import { useLocale } from "@/lib/locale/locale-context";
import { commercialCopy } from "@/lib/billing/commercial-copy";
import { packageBenefits } from "@/lib/billing/package-benefits";
import { learningCopy } from "@/lib/learning/copy";

export function PlanAllowance({ family = false }: { family?: boolean }) {
  const { locale } = useLocale();
  const copy = commercialCopy(locale);
  return (
    <ul className="my-5 list-disc space-y-2 ps-5 text-sm leading-relaxed">
      <li className="font-semibold">{family ? copy.family : copy.included}</li>
      {packageBenefits(locale).paid.map((line) => (
        <li key={line}>{line}</li>
      ))}
      <li className="text-muted-foreground">{copy.renewal}</li>
      <li>{learningCopy(locale).included}</li>
    </ul>
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
