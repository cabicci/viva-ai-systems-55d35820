// This is the existing, paused GTM pixel's ID. The application is its sole active owner.
export const TIKTOK_PIXEL_ID = "DAP5613C77UFPT800490";
const SCRIPT_ID = "masaarat-tiktok-pixel-script";
const METHODS = [
  "page",
  "track",
  "identify",
  "instances",
  "debug",
  "on",
  "off",
  "once",
  "ready",
  "alias",
  "group",
  "enableCookie",
  "disableCookie",
  "holdConsent",
  "revokeConsent",
  "grantConsent",
];
type Queue = unknown[][] & Record<string, unknown>;
type Pixel = Queue & {
  methods: string[];
  setAndDefer: (queue: Queue, method: string) => void;
  instance: (id: string) => Queue;
  load: (id: string, options?: Record<string, unknown>) => void;
  _i?: Record<string, Queue>;
  _t?: Record<string, number>;
  _o?: Record<string, Record<string, unknown>>;
};
type PixelWindow = Window & { ttq?: Pixel; TiktokAnalyticsObject?: string };
let scriptRequested = false;
let allowed = false;

function invoke(method: string, ...args: unknown[]) {
  if (typeof window === "undefined") return;
  const pixel = (window as PixelWindow).ttq;
  const fn = pixel?.[method];
  if (typeof fn === "function") fn.apply(pixel, args);
}

function bootstrap(win: PixelWindow): Pixel {
  if (win.ttq) return win.ttq;
  const pixel = [] as unknown as Pixel;
  win.TiktokAnalyticsObject = "ttq";
  win.ttq = pixel;
  pixel.methods = METHODS;
  pixel.setAndDefer = (queue, method) => {
    queue[method] = (...args: unknown[]) => queue.push([method, ...args]);
  };
  for (const method of METHODS) pixel.setAndDefer(pixel, method);
  pixel.instance = (id) => {
    const instance = ((pixel._i ??= {})[id] ??= [] as unknown as Queue);
    for (const method of METHODS) pixel.setAndDefer(instance, method);
    return instance;
  };
  pixel.load = (id, options = {}) => {
    const instance = [] as unknown as Queue;
    instance._u = "https://analytics.tiktok.com/i18n/pixel/events.js";
    (pixel._i ??= {})[id] = instance;
    (pixel._t ??= {})[id] = Date.now();
    (pixel._o ??= {})[id] = options;
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `${instance._u}?sdkid=${encodeURIComponent(id)}&lib=ttq`;
    script.addEventListener(
      "error",
      () => {
        scriptRequested = false;
        script.remove();
      },
      { once: true },
    );
    document.head.appendChild(script);
  };
  return pixel;
}

export function applyTikTokConsent(granted: boolean): void {
  allowed = granted;
  if (typeof window === "undefined" || typeof document === "undefined") return;
  try {
    if (!granted) {
      const pixel = (window as PixelWindow).ttq;
      // A late SDK must not replay page/registration data from before withdrawal.
      if (Array.isArray(pixel)) {
        for (let i = pixel.length - 1; i >= 0; i--) {
          if (["page", "track", "identify"].includes(String(pixel[i]?.[0]))) pixel.splice(i, 1);
        }
      }
      invoke("revokeConsent");
      document.getElementById(SCRIPT_ID)?.remove();
      return;
    }
    const pixel = bootstrap(window as PixelWindow);
    if (!scriptRequested && !document.getElementById(SCRIPT_ID)) {
      invoke("holdConsent");
      pixel.load(TIKTOK_PIXEL_ID);
      scriptRequested = true;
    }
    invoke("grantConsent");
  } catch {
    // Marketing measurement is optional; never block the website or authentication.
  }
}

export function trackTikTokPageView(): void {
  if (allowed) {
    try {
      invoke("page");
    } catch {
      /* Isolate vendor failures. */
    }
  }
}

export function trackTikTokRegistration(): void {
  if (allowed) {
    try {
      invoke("track", "CompleteRegistration");
    } catch {
      /* Isolate vendor failures. */
    }
  }
}

export function resetTikTokForTests(): void {
  allowed = false;
  scriptRequested = false;
  if (typeof document !== "undefined") document.getElementById(SCRIPT_ID)?.remove();
  if (typeof window !== "undefined") {
    delete (window as PixelWindow).ttq;
    delete (window as PixelWindow).TiktokAnalyticsObject;
  }
}
