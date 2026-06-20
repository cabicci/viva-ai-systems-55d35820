import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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

export function LocaleProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: SupportedLocale;
}) {
  const [locale, setLocale] = useState<SupportedLocale>(initialLocale);

  const value = useMemo<LocaleContextValue>(() => {
    const meta = LOCALE_META[locale];
    return {
      locale,
      setLocale,
      lang: meta.lang,
      dir: meta.dir,
      displayName: meta.displayName,
    };
  }, [locale]);

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
