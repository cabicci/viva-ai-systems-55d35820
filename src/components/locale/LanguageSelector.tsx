import { localeUiEnabled } from "@/lib/locale/feature-flags";
import { useLocale } from "@/lib/locale/locale-context";
import { useLocaleNavigation } from "@/lib/locale/use-locale-navigation";
import {
  LOCALE_META,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/locale/types";

function LanguageSelectorInner() {
  const { locale } = useLocale();
  const applyLocale = useLocaleNavigation();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <span className="sr-only">اختر اللغة</span>
      <select
        value={locale}
        onChange={(event) => applyLocale(event.target.value as SupportedLocale)}
        className="rounded-md border border-border/50 bg-background px-2 py-1 text-sm text-foreground"
        aria-label="اختر اللغة"
      >
        {SUPPORTED_LOCALES.map((supportedLocale) => (
          <option key={supportedLocale} value={supportedLocale}>
            {LOCALE_META[supportedLocale].displayName}
          </option>
        ))}
      </select>
    </label>
  );
}

export function LanguageSelector() {
  if (!localeUiEnabled) {
    return null;
  }

  return <LanguageSelectorInner />;
}
