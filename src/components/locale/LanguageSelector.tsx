import { localeUiEnabled } from "@/lib/locale/feature-flags";
import { useLocale } from "@/lib/locale/locale-context";
import { useLocaleNavigation } from "@/lib/locale/use-locale-navigation";
import { useUiString } from "@/lib/locale/use-ui-strings";
import {
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "@/lib/locale/types";
import type { UiStringKey } from "@/lib/locale/ui-strings";

const LOCALE_OPTION_KEYS: Record<SupportedLocale, UiStringKey> = {
  "ar-EG": "locale.option.arEG",
  "ar-MSA": "locale.option.arMSA",
  "ar-Gulf": "locale.option.arGulf",
  en: "locale.option.en",
};

function LanguageSelectorInner() {
  const { locale } = useLocale();
  const applyLocale = useLocaleNavigation();
  const t = useUiString();

  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <span className="sr-only">{t("locale.selector.srOnly")}</span>
      <select
        value={locale}
        onChange={(event) => applyLocale(event.target.value as SupportedLocale)}
        className="rounded-md border border-border/50 bg-background px-2 py-1 text-sm text-foreground"
        aria-label={t("locale.selector.label")}
      >
        {SUPPORTED_LOCALES.map((supportedLocale) => (
          <option key={supportedLocale} value={supportedLocale}>
            {t(LOCALE_OPTION_KEYS[supportedLocale])}
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
