export const GTM_CONTAINER_ID = "GTM-5BVZ85DR";
export const GA4_MEASUREMENT_ID = "G-MDMNHQCK5G";
export const META_PIXEL_ID = "2165346577381544";
export const ANALYTICS_CONSENT_STORAGE_KEY = "masaarat.analytics-consent.v1";

export type AnalyticsConsent = "granted" | "denied" | null;

type DataLayerEvent = Record<string, unknown>;
type ConsentState = Record<
  "analytics_storage" | "ad_storage" | "ad_user_data" | "ad_personalization",
  "granted" | "denied"
>;
type MetaPixelFunction = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  push: MetaPixelFunction;
  loaded: boolean;
  version: string;
};

type AnalyticsWindow = Window & {
  dataLayer?: (DataLayerEvent | IArguments)[];
  gtag?: (command: "consent", action: "default" | "update", state: ConsentState) => void;
  [key: `ga-disable-${string}`]: boolean | undefined;
  fbq?: MetaPixelFunction;
  _fbq?: MetaPixelFunction;
};

const GTM_SCRIPT_ID = "masaarat-gtm-script";
const META_SCRIPT_ID = "masaarat-meta-pixel-script";
const CONSENT_EVENT = "masaarat:analytics-consent";

let analyticsGranted = false;
let consentInitialized = false;
let lastAppliedConsent: AnalyticsConsent | undefined;
let gtmRequested = false;
let gtmStartQueued = false;
let metaRequested = false;
let metaInitialized = false;
let lastTrackedUrl: string | null = null;
function browserWindow(): AnalyticsWindow | null {
  return typeof window === "undefined" ? null : (window as unknown as AnalyticsWindow);
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
    gtmRequested ||
    doc.getElementById(GTM_SCRIPT_ID) ||
    doc.querySelector('script[src*="googletagmanager.com/gtm.js?id="]')
  ) {
    gtmRequested = true;
    return;
  }
  gtmRequested = true;
  if (!gtmStartQueued) {
    win.dataLayer.push({ event: "gtm.js", "gtm.start": Date.now() });
    gtmStartQueued = true;
  }
  const script = doc.createElement("script");
  script.id = GTM_SCRIPT_ID;
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(GTM_CONTAINER_ID);
  script.addEventListener(
    "error",
    () => {
      gtmRequested = false;
      script.remove();
    },
    { once: true },
  );
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
    !metaRequested &&
    !doc.getElementById(META_SCRIPT_ID) &&
    !doc.querySelector('script[src*="connect.facebook.net/en_US/fbevents.js"]')
  ) {
    const script = doc.createElement("script");
    script.id = META_SCRIPT_ID;
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    script.addEventListener(
      "error",
      () => {
        metaRequested = false;
        script.remove();
      },
      { once: true },
    );
    doc.head.appendChild(script);
  }
  metaRequested = true;
  if (!metaInitialized) {
    win.fbq("init", META_PIXEL_ID);
    metaInitialized = true;
  }
  win.fbq("consent", "grant");
}

function consentState(value: "granted" | "denied"): ConsentState {
  return {
    analytics_storage: value,
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
  };
}

function initializeGoogleConsent(win: AnalyticsWindow): void {
  if (consentInitialized) return;
  win.dataLayer = win.dataLayer ?? [];
  // Google's documented page-code fallback for a GTM-managed Google tag.
  // Commands use the gtag arguments format, not a custom event object.
  win.gtag =
    win.gtag ??
    function () {
      // eslint-disable-next-line prefer-rest-params -- Preserve Google's documented gtag arguments-object protocol.
      win.dataLayer!.push(arguments);
    };
  win[`ga-disable-${GA4_MEASUREMENT_ID}`] = true;
  win.gtag("consent", "default", consentState("denied"));
  consentInitialized = true;
}

export function applyAnalyticsConsent(consent: AnalyticsConsent): void {
  const win = browserWindow();
  const doc = browserDocument();
  analyticsGranted = consent === "granted";

  if (!win || !doc) return;
  initializeGoogleConsent(win);
  // Removing script nodes does not unload their runtime. Disable the known
  // Google tag before a withdrawal update can reach that already-loaded runtime.
  win[`ga-disable-${GA4_MEASUREMENT_ID}`] = !analyticsGranted;
  if (consent === lastAppliedConsent) return;
  lastAppliedConsent = consent;
  const state = consentState(analyticsGranted ? "granted" : "denied");
  win.gtag!("consent", "update", state);
  win.dataLayer!.push({ event: "masaarat_consent_update", ...state });

  if (consent === "granted") {
    ensureGtm(win, doc);
    ensureMetaPixel(win, doc);
    return;
  }

  lastTrackedUrl = null;
  if (win.fbq && !win.fbq.callMethod) {
    // A late-loading SDK must not replay queued page views after withdrawal.
    win.fbq.queue = win.fbq.queue.filter(
      (args) => args[0] !== "track" && args[0] !== "trackCustom",
    );
  }
  win.fbq?.("consent", "revoke");
  doc.getElementById(GTM_SCRIPT_ID)?.remove();
  doc.getElementById(META_SCRIPT_ID)?.remove();
}

export function trackPageViewOnce(url: string, title = browserDocument()?.title ?? ""): boolean {
  if (!analyticsGranted) return false;

  const win = browserWindow();
  if (!win) return false;

  const absoluteUrl = new URL(url, win.location.origin);
  if (absoluteUrl.href === lastTrackedUrl) return false;
  lastTrackedUrl = absoluteUrl.href;
  win.dataLayer = win.dataLayer ?? [];
  win.dataLayer.push({
    event: "masaarat_page_view",
    page_location: absoluteUrl.href,
    page_path: absoluteUrl.pathname + absoluteUrl.search,
    page_title: title,
  });
  win.fbq?.("track", "PageView");
  return true;
}

export function resetAnalyticsRuntimeForTests(): void {
  analyticsGranted = false;
  consentInitialized = false;
  lastAppliedConsent = undefined;
  gtmRequested = false;
  gtmStartQueued = false;
  metaRequested = false;
  metaInitialized = false;
  lastTrackedUrl = null;
  const win = browserWindow();
  const doc = browserDocument();
  doc?.getElementById(GTM_SCRIPT_ID)?.remove();
  doc?.getElementById(META_SCRIPT_ID)?.remove();
  if (win) {
    delete win.gtag;
    delete win[`ga-disable-${GA4_MEASUREMENT_ID}`];
    delete win.fbq;
    delete win._fbq;
    win.dataLayer = [];
  }
}
