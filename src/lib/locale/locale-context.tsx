import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { readLocaleCookie, writeLocaleCookie } from "./locale-cookie";
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

function resolveInitialLocale(initialLocale?: SupportedLocale): SupportedLocale {
  if (initialLocale) return initialLocale;
  return resolvePublicLocale({ cookieLocale: readLocaleCookie() }).locale;
}

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: SupportedLocale;
}) {
  const [locale, setLocaleState] = useState<SupportedLocale>(() =>
    resolveInitialLocale(initialLocale),
  );

  const setLocale = useCallback((nextLocale: SupportedLocale) => {
    writeLocaleCookie(nextLocale);
    setLocaleState(nextLocale);
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
