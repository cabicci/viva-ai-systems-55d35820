import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ANALYTICS_CONSENT_COPY } from "@/lib/analytics-consent-copy";
import { useLocale } from "@/lib/locale/locale-context";
import {
  applyAnalyticsConsent,
  persistAnalyticsConsent,
  readAnalyticsConsent,
  trackPageViewOnce,
  type AnalyticsConsent,
} from "@/lib/analytics";

export function AnalyticsConsentGate() {
  const { locale, dir, lang } = useLocale();
  const copy = ANALYTICS_CONSENT_COPY[locale];
  const locationHref = useRouterState({
    select: (state) => state.location.href,
  });
  const [hydrated, setHydrated] = useState(false);
  const [consent, setConsent] = useState<AnalyticsConsent>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setConsent(readAnalyticsConsent());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    applyAnalyticsConsent(consent);
    if (consent === "granted") {
      trackPageViewOnce(locationHref);
    }
  }, [consent, hydrated, locationHref]);

  function choose(next: Exclude<AnalyticsConsent, null>) {
    persistAnalyticsConsent(next);
    setConsent(next);
    setSettingsOpen(false);
  }

  if (!hydrated) return null;
  if (consent === null) {
    return (
      <aside
        aria-label={copy.ariaLabel}
        dir={dir}
        lang={lang}
        className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-3xl rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur"
      >
        <p className="text-sm font-bold">{copy.title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {copy.description}{" "}
          <Link to="/privacy" className="text-primary underline">
            {copy.privacyPolicy}
          </Link>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
            onClick={() => choose("denied")}
          >
            {copy.deny}
          </button>
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            onClick={() => choose("granted")}
          >
            {copy.accept}
          </button>
        </div>
      </aside>
    );
  }
  return (
    <>
      <button
        type="button"
        dir={dir}
        lang={lang}
        className="fixed bottom-3 start-3 z-[90] rounded-full border border-border bg-background/90 px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur"
        aria-label={copy.settingsAria}
        aria-expanded={settingsOpen}
        aria-controls="analytics-consent-settings"
        onClick={() => setSettingsOpen((open) => !open)}
      >
        {copy.settings}
      </button>
      {settingsOpen ? (
        <aside
          id="analytics-consent-settings"
          aria-label={copy.settingsAria}
          dir={dir}
          lang={lang}
          className="fixed bottom-14 start-3 z-[100] w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-border bg-background p-4 shadow-2xl"
        >
          <p className="text-sm font-bold">{copy.category}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {copy.statusLabel}: {consent === "granted" ? copy.allowed : copy.denied}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {consent === "granted" ? (
              <button
                type="button"
                className="rounded-lg border border-destructive px-3 py-2 text-sm text-destructive"
                onClick={() => choose("denied")}
              >
                {copy.withdraw}
              </button>
            ) : (
              <button
                type="button"
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                onClick={() => choose("granted")}
              >
                {copy.allow}
              </button>
            )}
          </div>
        </aside>
      ) : null}
    </>
  );
}
