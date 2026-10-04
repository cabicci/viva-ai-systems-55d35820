import { useLocale } from "@/lib/locale/locale-context";
import { getLineCopy } from "@/lib/learning-lines";
export function KidsBrand({ compact = false }: { compact?: boolean }) {
  const { locale } = useLocale();
  return (
    <span className="inline-flex rounded-lg bg-black p-2" aria-label={getLineCopy(locale).kids}>
      <img
        src="/brand/masaarat-kids.png"
        width={1536}
        height={373}
        alt={getLineCopy(locale).kids}
        className={compact ? "h-6 w-auto" : "h-14 w-auto max-w-full object-contain"}
        loading="lazy"
      />
    </span>
  );
}
