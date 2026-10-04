import { useLocale } from "@/lib/locale/locale-context";
import { adminOfferCopy } from "@/lib/commerce/admin-offer-copy";
export function OfferPhone({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { locale } = useLocale(),
    s = adminOfferCopy(locale);
  return (
    <div className="space-y-1">
      <label className="grid gap-1">
        {s.phone}
        <input
          type="tel"
          autoComplete="tel"
          dir="ltr"
          className="min-h-11 w-full rounded border bg-background p-2"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="+201012345678"
          maxLength={50}
          required
        />
      </label>
      <p className="text-sm text-muted-foreground">{s.phoneHint}</p>
    </div>
  );
}
