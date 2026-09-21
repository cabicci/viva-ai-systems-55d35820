export const GTM_CONTAINER_ID = "GTM-5BVZ85DR";
export const META_PIXEL_ID = "2165346577381544";
export const ANALYTICS_CONSENT_STORAGE_KEY = "masaarat.analytics-consent.v1";

export type AnalyticsConsent = "granted" | "denied" | null;

type DataLayerEvent = Record<string, unknown>;
type MetaPixelFunction = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: MetaPixelFunction;
  loaded: boolean;
  version: string;
};

type AnalyticsWindow = Window & {
  dataLayer?: DataLayerEvent[];
  fbq?: MetaPixelFunction;
  _fbq?: MetaPixelFunction;
};

const GTM_SCRIPT_ID = "masaarat-gtm-script";
const META_SCRIPT_ID = "masaarat-meta-pixel-script";
const CONSENT_EVENT = "masaarat:analytics-consent";

let analyticsGranted = false;
let metaInitialized = false;
let lastTrackedUrl: string | null = null;
function browserWindow(): AnalyticsWindow | null {
  return typeof window === "undefined" ? null : (window as AnalyticsWindow);
}

function browserDocument(): Document | null {
  return typeof document === "undefined" ? null : document;
}

export function readAnalyticsConsent(): AnalyticsConsent {
  const win = browserWindow();
  if (!win) return null;
  const value = win.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

export function persistAnalyticsConsent(consent: Exclude<AnalyticsConsent, null>): void {
  const win = browserWindow();
  if (!win) return;
  win.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, consent);
  win.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
}

function ensureGtm(win: AnalyticsWindow, doc: Document): void {
  win.dataLayer = win.dataLayer ?? [];
  if (
    doc.getElementById(GTM_SCRIPT_ID) ||
    doc.querySelector('script[src*="googletagmanager.com/gtm.js?id="]')
  ) {
    return;
  }
  win.dataLayer.push({
    event: "gtm.js",
    "gtm.start": Date.now(),
  });
  const script = doc.createElement("script");
  script.id = GTM_SCRIPT_ID;
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(GTM_CONTAINER_ID);
  doc.head.appendChild(script);
}

function ensureMetaPixel(win: AnalyticsWindow, doc: Document): void {
  if (!win.fbq) {
    const fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    } as MetaPixelFunction;
    fbq.queue = [];
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    win.fbq = fbq;
    win._fbq = fbq;
  }

  if (
    !doc.getElementById(META_SCRIPT_ID) &&
    !doc.querySelector('script[src*="connect.facebook.net/en_US/fbevents.js"]')
  ) {
    const script = doc.createElement("script");
    script.id = META_SCRIPT_ID;
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    doc.head.appendChild(script);
  }
  if (!metaInitialized) {
    win.fbq("init", META_PIXEL_ID);
    metaInitialized = true;
  }
  win.fbq("consent", "grant");
}

export function applyAnalyticsConsent(consent: AnalyticsConsent): void {
  const win = browserWindow();
  const doc = browserDocument();
  analyticsGranted = consent === "granted";

  if (!win || !doc) return;
  win.dataLayer = win.dataLayer ?? [];

  if (consent === "granted") {
    win.dataLayer.push({
      event: "masaarat_consent_update",
      analytics_storage: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
    });
    ensureGtm(win, doc);
    ensureMetaPixel(win, doc);
    return;
  }

  lastTrackedUrl = null;
  win.dataLayer.push({
    event: "masaarat_consent_update",
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  win.fbq?.("consent", "revoke");
  doc.getElementById(GTM_SCRIPT_ID)?.remove();
  doc.getElementById(META_SCRIPT_ID)?.remove();
}

export function trackPageViewOnce(url: string): boolean {
  if (!analyticsGranted || url === lastTrackedUrl) return false;

  const win = browserWindow();
  if (!win) return false;

  const absoluteUrl = new URL(url, win.location.origin);
  lastTrackedUrl = absoluteUrl.href;
  win.dataLayer = win.dataLayer ?? [];
  win.dataLayer.push({
    event: "masaarat_page_view",
    page_location: absoluteUrl.href,
    page_path: absoluteUrl.pathname + absoluteUrl.search,
    page_title: browserDocument()?.title ?? "",
  });
  win.fbq?.("track", "PageView");
  return true;
}

export function resetAnalyticsRuntimeForTests(): void {
  analyticsGranted = false;
  metaInitialized = false;
  lastTrackedUrl = null;
  const win = browserWindow();
  const doc = browserDocument();
  doc?.getElementById(GTM_SCRIPT_ID)?.remove();
  doc?.getElementById(META_SCRIPT_ID)?.remove();
  if (win) {
    delete win.fbq;
    delete win._fbq;
    win.dataLayer = [];
  }
}
