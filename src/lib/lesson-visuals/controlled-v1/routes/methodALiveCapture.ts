/**
 * Fail-closed Method A live capture against the disposable local-dev target.
 * Writes PNG bytes only after all locale/route/readiness/redaction/network assertions pass.
 * Never imports from lesson-visuals/v1. Never captures Production.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  METHOD_A_M7L1_FOUR_PILOT_AUTH_ID,
  METHOD_A_M7L1_FOUR_PILOT_LESSON_ID,
  PILOT_MASAARAT_LESSON_ID,
} from "../constants";
import { readPngDimensions } from "../goldenRefs";
import type { Locale } from "../types";

export const METHOD_A_LOCAL_APP_ORIGIN = "http://127.0.0.1:55440";
export const METHOD_A_LOCAL_SUPABASE_ORIGIN = "http://127.0.0.1:55431";
export const METHOD_A_LOCAL_SYSTEM_STATE_PATH = "/system-state";

const FORBIDDEN_MARKERS = [
  "abyqqeboyrkkwhjpwmtd",
  "masaarat.ai",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
] as const;

const ALLOWED_LOOPBACK_PORTS = new Set([55440, 55431, 55432, 55433, 55434, 55435]);

export interface MethodACaptureEvidence {
  requestedLocale: Locale;
  resolvedLocale: string | null;
  direction: string | null;
  route: string;
  finalUrl: string;
  readiness: Record<string, boolean | string | number>;
  redaction: Record<string, boolean>;
  networkAudit: {
    total: number;
    allowed: number;
    blockedNonLocal: number;
    forbidden: number;
    samples: Array<{ method: string; action: string; urlSanitized: string }>;
  };
  assertions: string[];
}

export interface MethodACaptureSuccess {
  ok: true;
  png: Buffer;
  width: number;
  height: number;
  sha256: string;
  htmlPath: string;
  evidence: MethodACaptureEvidence;
}

export interface MethodACaptureFailure {
  ok: false;
  errors: string[];
  evidence: MethodACaptureEvidence | null;
}

export type MethodACaptureResult = MethodACaptureSuccess | MethodACaptureFailure;

export interface MethodACaptureInput {
  lessonId: string;
  locale: Locale;
  cellId: string;
  /** Directory that will hold final.png + final-review.html (written only on success). */
  outputDir: string;
  appOrigin?: string;
  supabaseOrigin?: string;
  secretsRoot?: string;
  /** Injected for unit tests — skips live browser. */
  captureFn?: (args: { locale: Locale; appOrigin: string }) => Promise<{
    png: Buffer;
    finalUrl: string;
    evidence: MethodACaptureEvidence;
  }>;
}

function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) out[m[1]!.trim()] = m[2]!.trim();
  }
  return out;
}

function sanitizeUrl(url: string): string {
  return url.replace(
    /([?&](access_token|refresh_token|token|apikey|Authorization|password)=)[^&]+/gi,
    "$1REDACTED",
  );
}

function containsForbidden(s: string): boolean {
  const lower = s.toLowerCase();
  return FORBIDDEN_MARKERS.some((f) => lower.includes(f.toLowerCase()));
}

function isAllowedLoopbackUrl(url: string, appOrigin: string, supabaseOrigin: string): boolean {
  if (
    url.startsWith("data:") ||
    url.startsWith("blob:") ||
    url.startsWith("about:") ||
    url.startsWith("chrome:") ||
    url.startsWith("chrome-extension:") ||
    url.startsWith("devtools:")
  ) {
    return true;
  }
  try {
    const u = new URL(url);
    const host = u.hostname;
    if (host !== "127.0.0.1" && host !== "localhost" && host !== "::1") return false;
    const port = Number(
      u.port || (u.protocol === "https:" || u.protocol === "wss:" ? "443" : "80"),
    );
    if (ALLOWED_LOOPBACK_PORTS.has(port)) return true;
    return url.startsWith(appOrigin) || url.startsWith(supabaseOrigin);
  } catch {
    return false;
  }
}

function expectedDirection(locale: Locale): "rtl" | "ltr" {
  return locale === "en" ? "ltr" : "rtl";
}

function buildReviewHtml(args: {
  cellId: string;
  locale: Locale;
  direction: string;
  sha256: string;
  width: number;
  height: number;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Method A review — ${args.cellId}</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 24px; background: #f6f7f9; color: #111; }
  .meta { font-size: 13px; margin-bottom: 16px; line-height: 1.5; }
  img { max-width: 100%; height: auto; border: 1px solid #ccc; background: #fff; }
</style>
</head>
<body>
  <h1>Method A four-locale pilot — PENDING_HUMAN_REVIEW</h1>
  <div class="meta">
    <div>cellId: ${args.cellId}</div>
    <div>locale: ${args.locale}</div>
    <div>direction: ${args.direction}</div>
    <div>route: /system-state</div>
    <div>dims: ${args.width}×${args.height}</div>
    <div>sha256: ${args.sha256}</div>
    <div>authorization: ${METHOD_A_M7L1_FOUR_PILOT_AUTH_ID}</div>
    <div>productionAccepted: false</div>
  </div>
  <img src="final.png" width="${args.width}" height="${args.height}" alt="${args.cellId}" />
</body>
</html>
`;
}

function defaultSecretsRoot(): string {
  return (
    process.env.METHOD_A_LOCAL_SECRETS_ROOT ?? "E:/Temp/masaarat-lv-method-a-pilot-20260727/secrets"
  );
}

class RawCdpClient {
  private ws: WebSocket;
  private nextId = 1;
  private pending = new Map<
    number,
    { resolve: (v: unknown) => void; reject: (e: Error) => void }
  >();
  private eventHandlers = new Map<string, Array<(params: unknown, sessionId?: string) => void>>();

  private constructor(ws: WebSocket) {
    this.ws = ws;
    this.ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(String(ev.data)) as {
        id?: number;
        method?: string;
        params?: unknown;
        sessionId?: string;
        result?: unknown;
        error?: { message?: string };
      };
      if (msg.id != null && this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id)!;
        this.pending.delete(msg.id);
        if (msg.error) p.reject(new Error(msg.error.message ?? "CDP error"));
        else p.resolve(msg.result);
        return;
      }
      if (msg.method) {
        for (const h of this.eventHandlers.get(msg.method) ?? []) {
          h(msg.params, msg.sessionId);
        }
      }
    });
  }

  static async connect(httpEndpoint: string, timeoutMs = 20_000): Promise<RawCdpClient> {
    const version = (await (await fetch(httpEndpoint + "/json/version")).json()) as {
      webSocketDebuggerUrl: string;
    };
    const ws = new WebSocket(version.webSocketDebuggerUrl);
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("CDP websocket open timeout")), timeoutMs);
      ws.addEventListener("open", () => {
        clearTimeout(t);
        resolve();
      });
      ws.addEventListener("error", () => {
        clearTimeout(t);
        reject(new Error("CDP websocket error"));
      });
    });
    return new RawCdpClient(ws);
  }

  on(method: string, handler: (params: unknown, sessionId?: string) => void): void {
    const list = this.eventHandlers.get(method) ?? [];
    list.push(handler);
    this.eventHandlers.set(method, list);
  }

  send(method: string, params: Record<string, unknown> = {}, sessionId?: string): Promise<unknown> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, 60_000);
      this.pending.set(id, {
        resolve: (v) => {
          clearTimeout(t);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(t);
          reject(e);
        },
      });
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }

  close(): void {
    try {
      this.ws.close();
    } catch {
      /* ignore */
    }
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms));
}

async function liveBrowserCapture(args: {
  locale: Locale;
  appOrigin: string;
  supabaseOrigin: string;
  secretsRoot: string;
}): Promise<{ png: Buffer; finalUrl: string; evidence: MethodACaptureEvidence }> {
  const synth = loadEnvFile(resolve(args.secretsRoot, "synthetic-admin.env"));
  const email = synth.SYNTH_EMAIL;
  const password = synth.SYNTH_PASSWORD;
  if (!email || !password) {
    throw new Error("missing SYNTH_EMAIL/SYNTH_PASSWORD in synthetic-admin.env");
  }

  const networkSamples: MethodACaptureEvidence["networkAudit"]["samples"] = [];
  let allowed = 0;
  let blockedNonLocal = 0;
  let forbidden = 0;
  let total = 0;
  const assertionErrors: string[] = [];

  /**
   * Windows note: Playwright's connectOverCDP/launch hang on this host.
   * Use raw CDP over Bun WebSocket against the provisioned loopback Chrome.
   */
  const cdpHttp =
    process.env.METHOD_A_CDP_URL ?? process.env.METHOD_A_CHROME_CDP_URL ?? "http://127.0.0.1:55441";

  const browser = await RawCdpClient.connect(cdpHttp);
  let sessionId: string | undefined;
  let targetId: string | undefined;

  try {
    const created = (await browser.send("Target.createTarget", {
      url: "about:blank",
    })) as { targetId: string };
    targetId = created.targetId;
    const attached = (await browser.send("Target.attachToTarget", {
      targetId,
      flatten: true,
    })) as { sessionId: string };
    sessionId = attached.sessionId;

    const sessionSend = (method: string, params: Record<string, unknown> = {}) =>
      browser.send(method, params, sessionId);

    await sessionSend("Page.enable");
    await sessionSend("Runtime.enable");
    await sessionSend("Network.enable");

    // Passive network audit only. Playwright CDP Fetch interception races on this host
    // and previously blocked auth completion. Fail closed if forbidden markers appear.
    browser.on("Network.requestWillBeSent", (paramsUnknown, eventSessionId) => {
      if (eventSessionId && eventSessionId !== sessionId) return;
      const params = paramsUnknown as {
        request?: { url?: string; method?: string };
      };
      const url = params.request?.url ?? "";
      if (!url) return;
      total += 1;
      const sanitized = sanitizeUrl(url);
      const method = params.request?.method ?? "GET";
      if (containsForbidden(url)) {
        forbidden += 1;
        networkSamples.push({
          method,
          action: "FAIL_FORBIDDEN",
          urlSanitized: sanitized.slice(0, 180),
        });
        assertionErrors.push(`forbidden network URL: ${sanitized.slice(0, 120)}`);
        return;
      }
      if (!isAllowedLoopbackUrl(url, args.appOrigin, args.supabaseOrigin)) {
        blockedNonLocal += 1;
        networkSamples.push({
          method,
          action: "BLOCKED_NON_LOCAL",
          urlSanitized: sanitized.slice(0, 180),
        });
        assertionErrors.push(`non-loopback network URL: ${sanitized.slice(0, 120)}`);
        return;
      }
      allowed += 1;
      if (networkSamples.length < 40) {
        networkSamples.push({
          method,
          action: "ALLOW",
          urlSanitized: sanitized.slice(0, 180),
        });
      }
    });

    await sessionSend("Emulation.setDeviceMetricsOverride", {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      deviceScaleFactor: 1,
      mobile: false,
    });

    const navigate = async (url: string) => {
      await sessionSend("Page.navigate", { url });
      // Prefer readyState polling over loadEventFired (handlers stack across navigations).
      for (let i = 0; i < 40; i++) {
        await sleep(250);
        try {
          const ready = (await sessionSend("Runtime.evaluate", {
            returnByValue: true,
            expression: "document.readyState",
          })) as { result?: { value?: string } };
          if (ready.result?.value === "complete" || ready.result?.value === "interactive") break;
        } catch {
          /* context may reset during navigation */
        }
      }
      await sleep(500);
    };

    await navigate(`${args.appOrigin}/login`);

    // Prefer injecting the disposable synthetic session (no Production). UI form fill is
    // unreliable with React controlled inputs under raw CDP on this host.
    const sessionPath = resolve(args.secretsRoot, "session.json");
    if (!existsSync(sessionPath)) {
      throw new Error("missing secrets/session.json for authenticated capture");
    }
    const sessionRaw = JSON.parse(readFileSync(sessionPath, "utf8")) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      token_type?: string;
      user?: unknown;
    };
    if (!sessionRaw.access_token || !sessionRaw.refresh_token || !sessionRaw.user) {
      throw new Error("session.json missing access_token/refresh_token/user");
    }

    const inject = (await sessionSend("Runtime.evaluate", {
      awaitPromise: true,
      returnByValue: true,
      expression: `(() => {
        const session = ${JSON.stringify({
          access_token: sessionRaw.access_token,
          refresh_token: sessionRaw.refresh_token,
          expires_in: sessionRaw.expires_in ?? 3600,
          token_type: sessionRaw.token_type ?? "bearer",
          user: sessionRaw.user,
          expires_at: Math.floor(Date.now() / 1000) + Number(sessionRaw.expires_in ?? 3600),
        })};
        const keys = [
          "sb-127-auth-token",
          "sb-127.0.0.1-auth-token",
          "supabase.auth.token",
        ];
        // Also derive from current supabase URL hostname pattern used by supabase-js.
        try {
          const host = new URL(${JSON.stringify(args.supabaseOrigin)}).hostname;
          keys.push("sb-" + host.split(".")[0] + "-auth-token");
        } catch {}
        for (const key of [...new Set(keys)]) {
          localStorage.setItem(key, JSON.stringify(session));
        }
        return { keys, href: location.href };
      })()`,
    })) as { result?: { value?: { keys?: string[]; href?: string } }; exceptionDetails?: unknown };

    if (inject.exceptionDetails) {
      throw new Error("session injection failed");
    }

    // Fallback UI login if session injection alone is insufficient.
    await sessionSend("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const email = ${JSON.stringify(email)};
        const password = ${JSON.stringify(password)};
        const emailEl = document.querySelector('input[type="email"]');
        const passEl = document.querySelector('input[type="password"]');
        const btn = document.querySelector('button[type="submit"]');
        if (!emailEl || !passEl || !btn) return false;
        const setNative = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        const lastEmail = emailEl.value;
        const lastPass = passEl.value;
        if (setNative) {
          setNative.call(emailEl, email);
          setNative.call(passEl, password);
        } else {
          emailEl.value = email;
          passEl.value = password;
        }
        const trackerEmail = emailEl._valueTracker;
        const trackerPass = passEl._valueTracker;
        if (trackerEmail) trackerEmail.setValue(lastEmail);
        if (trackerPass) trackerPass.setValue(lastPass);
        emailEl.dispatchEvent(new Event("input", { bubbles: true }));
        passEl.dispatchEvent(new Event("input", { bubbles: true }));
        btn.click();
        return true;
      })()`,
    }).catch(() => undefined);

    // Wait for auth redirect away from /login
    let loggedIn = false;
    let lastHref = "";
    for (let i = 0; i < 40; i++) {
      await sleep(500);
      try {
        const loc = (await sessionSend("Runtime.evaluate", {
          returnByValue: true,
          expression: `({ href: location.href })`,
        })) as { result?: { value?: { href?: string } } };
        lastHref = loc.result?.value?.href ?? "";
        if (lastHref && !lastHref.includes("/login")) {
          loggedIn = true;
          break;
        }
      } catch {
        // Navigation can invalidate the execution context mid-evaluate.
      }
    }

    // If still on login, force navigation after storage injection and reload auth state.
    if (!loggedIn) {
      await navigate(`${args.appOrigin}/dashboard`);
      await sleep(1000);
      const loc2 = (await sessionSend("Runtime.evaluate", {
        returnByValue: true,
        expression: `({ href: location.href })`,
      })) as { result?: { value?: { href?: string } } };
      lastHref = loc2.result?.value?.href ?? lastHref;
      if (lastHref && !lastHref.includes("/login")) loggedIn = true;
    }

    if (!loggedIn)
      throw new Error(`login failed — still on /login (last=${lastHref || "unknown"})`);

    const target = `${args.appOrigin}${METHOD_A_LOCAL_SYSTEM_STATE_PATH}?locale=${encodeURIComponent(args.locale)}`;
    await navigate(target);

    // Wait for hydrated Runtime Context fields (SPA may render empty shell first).
    let ready = false;
    for (let i = 0; i < 40; i++) {
      await sleep(500);
      try {
        const probeReady = (await sessionSend("Runtime.evaluate", {
          returnByValue: true,
          expression: `(() => {
            const text = document.body ? document.body.innerText : "";
            return {
              href: location.href,
              len: text.trim().length,
              hasUser: /\\bcurrentUser\\b/.test(text),
              hasPath: /\\bcurrentPath\\b/.test(text),
              guest: /\\bguest\\b/i.test(text),
            };
          })()`,
        })) as {
          result?: {
            value?: {
              href?: string;
              len?: number;
              hasUser?: boolean;
              hasPath?: boolean;
              guest?: boolean;
            };
          };
        };
        const v = probeReady.result?.value;
        if (
          v?.href?.includes("/system-state") &&
          (v.len ?? 0) > 80 &&
          v.hasUser &&
          v.hasPath &&
          !v.guest
        ) {
          ready = true;
          break;
        }
        // If bounced to login, re-inject is insufficient — fail later via assertions.
        if (v?.href?.includes("/login")) break;
      } catch {
        /* ignore transient evaluate errors during hydration */
      }
    }
    if (!ready) {
      await sleep(1500);
    }

    const probe = (await sessionSend("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const bodyText = document.body ? document.body.innerText : "";
        const html = document.documentElement ? document.documentElement.outerHTML : "";
        return {
          href: location.href,
          pathname: location.pathname,
          locale: new URLSearchParams(location.search).get("locale"),
          direction: document.documentElement.getAttribute("dir"),
          lang: document.documentElement.getAttribute("lang"),
          title: document.title,
          bodyText,
          html,
        };
      })()`,
    })) as {
      result?: {
        value?: {
          href: string;
          pathname: string;
          locale: string | null;
          direction: string | null;
          lang: string | null;
          title: string;
          bodyText: string;
          html: string;
        };
      };
    };

    const pageState = probe.result?.value;
    if (!pageState) throw new Error("failed to probe page state via CDP");

    const finalUrl = pageState.href;
    const pathname = pageState.pathname;
    const resolvedLocale = pageState.locale;
    const direction = pageState.direction;
    const bodyText = pageState.bodyText;
    const html = pageState.html;

    const readiness = {
      resolved_route: pathname,
      authenticated_not_login: !finalUrl.includes("/login"),
      not_loading: !/loading|جاري التحميل|يرجى الانتظار/i.test(bodyText.slice(0, 400)),
      has_runtime_context: /RUNTIME CONTEXT|Runtime Context|currentUser|currentPath/i.test(
        bodyText,
      ),
      has_current_user_label: /\bcurrentUser\b/.test(bodyText),
      has_current_path_label: /\bcurrentPath\b/.test(bodyText),
      not_empty: bodyText.trim().length > 80,
      no_access_denied: !/access denied|forbidden|غير مصرح|غير مصرّح/i.test(bodyText),
      no_error_screen: !/something went wrong|خطأ غير متوقع|application error/i.test(bodyText),
      no_guest: !/\bguest\b/i.test(bodyText),
      title: pageState.title,
      lang: pageState.lang ?? "",
    };

    const redaction = {
      no_jwt_visible: !/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/.test(bodyText),
      no_service_role: !/service_role|sb_secret_/i.test(bodyText),
      no_password_literal: !/SYNTH_PASSWORD|password\s*[:=]/i.test(bodyText),
      no_forbidden_markers_in_dom: !containsForbidden(html) && !containsForbidden(bodyText),
      no_google_fonts_link: !/fonts\.googleapis|fonts\.gstatic/i.test(html),
    };

    const expectedDir = expectedDirection(args.locale);
    const assertions: string[] = [];
    if (pathname !== METHOD_A_LOCAL_SYSTEM_STATE_PATH) {
      assertions.push(`route must be /system-state; got ${pathname}`);
    }
    if (resolvedLocale !== args.locale) {
      assertions.push(
        `locale mismatch: requested ${args.locale}, resolved ${String(resolvedLocale)}`,
      );
    }
    if (direction !== expectedDir) {
      assertions.push(`direction mismatch: expected ${expectedDir}, got ${String(direction)}`);
    }
    if (!readiness.authenticated_not_login) assertions.push("not authenticated (login URL)");
    if (!readiness.has_runtime_context)
      assertions.push("Runtime Context / tables interface missing");
    if (!readiness.has_current_user_label) assertions.push("currentUser label missing");
    if (!readiness.has_current_path_label) assertions.push("currentPath label missing");
    if (!readiness.not_empty) assertions.push("page empty");
    if (!readiness.no_access_denied) assertions.push("access denied visible");
    if (!readiness.no_error_screen) assertions.push("error screen visible");
    if (!readiness.no_guest) assertions.push("guest state visible");
    if (!redaction.no_jwt_visible) assertions.push("JWT visible");
    if (!redaction.no_service_role) assertions.push("service_role/secret visible");
    if (!redaction.no_password_literal) assertions.push("password material visible");
    if (!redaction.no_forbidden_markers_in_dom) assertions.push("forbidden markers in DOM");
    if (!redaction.no_google_fonts_link) assertions.push("Google Fonts link present");
    if (forbidden > 0) assertions.push(`forbidden network requests: ${forbidden}`);
    assertions.push(...assertionErrors);

    const evidence: MethodACaptureEvidence = {
      requestedLocale: args.locale,
      resolvedLocale,
      direction,
      route: pathname,
      finalUrl: sanitizeUrl(finalUrl),
      readiness,
      redaction,
      networkAudit: {
        total,
        allowed,
        blockedNonLocal,
        forbidden,
        samples: networkSamples.slice(0, 40),
      },
      assertions,
    };

    if (assertions.length > 0) {
      throw new Error(`capture assertions failed: ${assertions.join("; ")}`);
    }

    const shot = (await sessionSend("Page.captureScreenshot", {
      format: "png",
      clip: {
        x: 0,
        y: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        scale: 1,
      },
      captureBeyondViewport: false,
    })) as { data: string };

    const pngBuf = Buffer.from(shot.data, "base64");

    if (targetId) {
      await browser.send("Target.closeTarget", { targetId }).catch(() => undefined);
    }

    return { png: pngBuf, finalUrl, evidence };
  } finally {
    browser.close();
  }
}

/**
 * Capture one Method A pilot cell. Fail-closed: does not write final.png unless assertions pass
 * and PNG dimensions match the controlled canvas.
 */
export async function captureMethodAPilotCell(
  input: MethodACaptureInput,
): Promise<MethodACaptureResult> {
  if (
    process.env.CONTROLLED_V1_ZERO_CAPTURE === "1" ||
    process.env.CONTROLLED_V1_ZERO_RENDER === "1"
  ) {
    return {
      ok: false,
      errors: [
        "BLOCKED_ZERO_CAPTURE: live Method A capture refused under ZERO_CAPTURE/ZERO_RENDER",
      ],
      evidence: null,
    };
  }

  if (
    input.lessonId !== METHOD_A_M7L1_FOUR_PILOT_LESSON_ID &&
    input.lessonId !== PILOT_MASAARAT_LESSON_ID
  ) {
    return {
      ok: false,
      errors: [`refusing non-pilot Method A lesson: ${input.lessonId}`],
      evidence: null,
    };
  }

  const appOrigin =
    input.appOrigin ?? process.env.METHOD_A_LOCAL_APP_ORIGIN ?? METHOD_A_LOCAL_APP_ORIGIN;
  const supabaseOrigin =
    input.supabaseOrigin ??
    process.env.METHOD_A_LOCAL_SUPABASE_ORIGIN ??
    METHOD_A_LOCAL_SUPABASE_ORIGIN;
  const secretsRoot = input.secretsRoot ?? defaultSecretsRoot();

  if (!appOrigin.includes("127.0.0.1") && !appOrigin.includes("localhost")) {
    return {
      ok: false,
      errors: [`app origin must be loopback-only; got ${appOrigin}`],
      evidence: null,
    };
  }
  if (/masaarat\.ai|abyqqeboyrkkwhjpwmtd|production/i.test(appOrigin)) {
    return {
      ok: false,
      errors: ["forbidden Production / Agent-4 / masaarat.ai origin"],
      evidence: null,
    };
  }

  try {
    const captured = input.captureFn
      ? await input.captureFn({ locale: input.locale, appOrigin })
      : await liveBrowserCapture({
          locale: input.locale,
          appOrigin,
          supabaseOrigin,
          secretsRoot,
        });

    if (captured.evidence.assertions.length > 0) {
      return {
        ok: false,
        errors: captured.evidence.assertions,
        evidence: captured.evidence,
      };
    }

    const dims = (() => {
      const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      if (captured.png.length < 24 || !captured.png.subarray(0, 8).equals(PNG_SIG)) {
        return null;
      }
      return {
        width: captured.png.readUInt32BE(16),
        height: captured.png.readUInt32BE(20),
      };
    })();

    if (!dims || dims.width !== CANVAS_WIDTH || dims.height !== CANVAS_HEIGHT) {
      return {
        ok: false,
        errors: [
          `PNG dimensions ${dims?.width ?? "?"}x${dims?.height ?? "?"} != ${CANVAS_WIDTH}x${CANVAS_HEIGHT} — refusing final.png`,
        ],
        evidence: captured.evidence,
      };
    }

    const sha256 = createHash("sha256").update(captured.png).digest("hex").toUpperCase();
    mkdirSync(input.outputDir, { recursive: true });
    const pngPath = join(input.outputDir, "final.png");
    const htmlPath = join(input.outputDir, "final-review.html");
    writeFileSync(pngPath, captured.png);
    writeFileSync(
      htmlPath,
      buildReviewHtml({
        cellId: input.cellId,
        locale: input.locale,
        direction: captured.evidence.direction ?? expectedDirection(input.locale),
        sha256,
        width: dims.width,
        height: dims.height,
      }),
      "utf8",
    );

    // Re-read to confirm on-disk artifact matches assertions (fail closed if tampered/missing).
    if (!existsSync(pngPath)) {
      return {
        ok: false,
        errors: ["final.png missing after write"],
        evidence: captured.evidence,
      };
    }
    const diskDims = readPngDimensions(pngPath);
    if (diskDims.width !== CANVAS_WIDTH || diskDims.height !== CANVAS_HEIGHT) {
      return {
        ok: false,
        errors: ["on-disk PNG dimension mismatch — refusing finalize"],
        evidence: captured.evidence,
      };
    }

    return {
      ok: true,
      png: captured.png,
      width: dims.width,
      height: dims.height,
      sha256,
      htmlPath,
      evidence: captured.evidence,
    };
  } catch (err) {
    return {
      ok: false,
      errors: [err instanceof Error ? err.message : String(err)],
      evidence: null,
    };
  }
}

export function writeCaptureEvidenceJson(
  path: string,
  cellId: string,
  evidence: MethodACaptureEvidence,
  sha256: string | null,
): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    `${JSON.stringify(
      {
        schemaVersion: "controlled-v1-method-a-capture-evidence/1",
        authorizationId: METHOD_A_M7L1_FOUR_PILOT_AUTH_ID,
        cellId,
        artifactSha256: sha256,
        evidence,
        producedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}
