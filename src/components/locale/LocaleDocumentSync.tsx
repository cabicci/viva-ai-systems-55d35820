import { useLayoutEffect } from "react";
import { useLocale } from "@/lib/locale/locale-context";

/** Keep `<html lang dir>` aligned with effective locale (client + post-hydration). */
export function LocaleDocumentSync() {
  const { lang, dir } = useLocale();

  useLayoutEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  return null;
}
