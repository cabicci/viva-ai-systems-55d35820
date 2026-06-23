import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { writeLocaleCookie } from "./locale-cookie";
import { resolvePublicLocale } from "./resolve-public-locale";
import {
  DEFAULT_LOCALE,
  LOCALE_META,
  type LocaleDirection,
  type SupportedLocale,
} from "./types";

export interface LocaleContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  lang: string;
  dir: LocaleDirection;
  displayName: string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

type LocaleProviderProps = {
  children: ReactNode;
  urlLocale?: string;
  cookieLocale?: string;
  initialLocale?: SupportedLocale;
  effectiveLocale?: SupportedLocale;
};

export function LocaleProvider({
  children,
  urlLocale,
  cookieLocale,
  initialLocale,
  effectiveLocale,
}: LocaleProviderProps) {
  const derivedLocale = useMemo(
    () =>
      effectiveLocale ??
      initialLocale ??
      resolvePublicLocale({ urlLocale, cookieLocale }).locale,
    [effectiveLocale, initialLocale, urlLocale, cookieLocale],
  );

  const [manualLocale, setManualLocale] = useState<SupportedLocale | null>(null);

  useEffect(() => {
    setManualLocale(null);
  }, [derivedLocale]);

  const locale = manualLocale ?? derivedLocale;

  const setLocale = useCallback((nextLocale: SupportedLocale) => {
    writeLocaleCookie(nextLocale);
    setManualLocale(nextLocale);
  }, []);

  const value = useMemo<LocaleContextValue>(() => {
    const meta = LOCALE_META[locale];
    return {
      locale,
      setLocale,
      lang: meta.lang,
      dir: meta.dir,
      displayName: meta.displayName,
    };
  }, [locale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}

export { DEFAULT_LOCALE };
