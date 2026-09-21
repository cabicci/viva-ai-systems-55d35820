import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  applyAnalyticsConsent,
  persistAnalyticsConsent,
  readAnalyticsConsent,
  trackPageViewOnce,
  type AnalyticsConsent,
} from "@/lib/analytics";

export function AnalyticsConsentGate() {
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
        aria-label="إعدادات ملفات الارتباط والتحليلات"
        className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-3xl rounded-2xl border border-border bg-background/95 p-4 shadow-2xl backdrop-blur"
      >
        <p className="text-sm font-bold">خصوصيتك أولًا</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          لن نشغّل أدوات التحليل أو Meta Pixel قبل موافقتك. يمكنك الرفض الآن أو سحب موافقتك لاحقًا
          من إعدادات الخصوصية.{" "}
          <Link to="/privacy" className="text-primary underline">
            سياسة الخصوصية
          </Link>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
            onClick={() => choose("denied")}
          >
            رفض
          </button>
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            onClick={() => choose("granted")}
          >
            موافقة
          </button>
        </div>
      </aside>
    );
  }
  return (
    <>
      <button
        type="button"
        className="fixed bottom-3 start-3 z-[90] rounded-full border border-border bg-background/90 px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur"
        aria-expanded={settingsOpen}
        aria-controls="analytics-consent-settings"
        onClick={() => setSettingsOpen((open) => !open)}
      >
        إعدادات الخصوصية
      </button>
      {settingsOpen ? (
        <aside
          id="analytics-consent-settings"
          aria-label="إعدادات الخصوصية"
          className="fixed bottom-14 start-3 z-[100] w-[min(22rem,calc(100vw-1.5rem))] rounded-2xl border border-border bg-background p-4 shadow-2xl"
        >
          <p className="text-sm font-bold">التحليلات والتسويق</p>
          <p className="mt-1 text-sm text-muted-foreground">
            الحالة الحالية: {consent === "granted" ? "مسموح" : "مرفوض"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {consent === "granted" ? (
              <button
                type="button"
                className="rounded-lg border border-destructive px-3 py-2 text-sm text-destructive"
                onClick={() => choose("denied")}
              >
                سحب الموافقة
              </button>
            ) : (
              <button
                type="button"
                className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                onClick={() => choose("granted")}
              >
                السماح بالتحليلات
              </button>
            )}
          </div>
        </aside>
      ) : null}
    </>
  );
}
