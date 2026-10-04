import { useLocale } from "@/lib/locale/locale-context";
import { getLineCopy } from "@/lib/learning-lines";
export function KidsBrand({ compact = false }: { compact?: boolean }) {
  const { locale } = useLocale();
  return (
    <span className="inline-flex max-w-full rounded-lg p-2" aria-label={getLineCopy(locale).kids}>
      <img
        src="/brand/masaarat-kids.png"
        width={2048}
        height={497}
        alt={getLineCopy(locale).kids}
        className={
          compact
            ? "h-6 w-auto min-w-0 max-w-full object-contain"
            : "h-14 w-auto min-w-0 max-w-full object-contain"
        }
        loading="lazy"
      />
    </span>
  );
}
