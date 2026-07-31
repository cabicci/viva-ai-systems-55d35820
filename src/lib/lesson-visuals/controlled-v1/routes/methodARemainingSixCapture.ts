/**
 * Fail-closed Method A live capture for the six remaining lessons
 * (CR-LV-METHOD-A-QUERY-CONCEPT-NORMALIZATION-SIX-LESSON-SINGLE-RUN-20260728-01).
 *
 * Patterned after ./methodALiveCapture.ts but intentionally separate: that file is
 * never modified by this module. Writes PNG bytes only after all locale/route/
 * readiness/redaction/network/lesson-specific assertions pass. Never imports from
 * lesson-visuals/v1. Never captures Production.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  METHOD_A_REMAINING_SIX_AUTH_ID,
  METHOD_A_REMAINING_SIX_CELL_IDS,
  METHOD_A_REMAINING_SIX_LESSON_IDS,
} from "../constants";
import { readPngDimensions } from "../goldenRefs";
import { DOCS_CONTROLLED_V1_CAPTURE } from "../paths";
import type { Locale } from "../types";
import type { CaptureSessionConfig } from "./masaaratScreenshot";

export const METHOD_A_REMAINING_SIX_APP_ORIGIN = "http://127.0.0.1:55440";
export const METHOD_A_REMAINING_SIX_SUPABASE_ORIGIN = "http://127.0.0.1:55431";

const FORBIDDEN_MARKERS = [
  "abyqqeboyrkkwhjpwmtd",
  "masaarat.ai",
  "fonts.googleapis.com",
  "fonts.gstatic.com",
] as const;

const ALLOWED_LOOPBACK_PORTS = new Set([55440, 55431, 55432, 55433, 55434, 55435]);

const ARABIC_RE = /[\u0600-\u06FF]/;
const EGYPTIAN_MARKERS_RE = /(أيوه|دلوقتي|مفيش|هيتفعّل|لسه|هنعلن|بتاخدك)/;

export interface MethodARemainingSixCaptureConfig extends CaptureSessionConfig {
  path?: string;
  search?: string;
  concept?: string;
  cellAllowlist?: string[];
  readiness?: string[];
  selectors?: string[];
  framing?: string;
  masking?: string[];
  forbiddenStates?: string[];
  directionByLocale?: Partial<Record<Locale, "rtl" | "ltr">>;
}

/**
 * Loads the Control-Room-authorized capture config for one of the six remaining
 * Method A lessons. Returns null (fail closed) for any lesson outside the
 * authorized six, or when the config file is missing / fails to parse.
 */
export function loadRemainingSixCaptureConfig(
  lessonId: string,
): MethodARemainingSixCaptureConfig | null {
  if (!(METHOD_A_REMAINING_SIX_LESSON_IDS as readonly string[]).includes(lessonId)) {
    return null;
  }
  const path = resolve(DOCS_CONTROLLED_V1_CAPTURE, `${lessonId}.capture.json`);
  if (!existsSync(path)) return null;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as MethodARemainingSixCaptureConfig;
    if (parsed.schemaVersion !== "controlled-v1-capture-config/1") return null;
    if (parsed.lessonId !== lessonId) return null;
    if (parsed.environment !== "local-dev") return null;
    return parsed;
  } catch {
    return null;
  }
}

export interface MethodARemainingSixCaptureEvidence {
  lessonId: string;
  concept: string | null;
  requestedLocale: Locale;
  resolvedLocale: string | null;
  direction: string | null;
  route: string;
  finalUrl: string;
  readiness: Record<string, boolean | string | number>;
  redaction: Record<string, boolean | number>;
  networkAudit: {
    total: number;
    allowed: number;
    blockedNonLocal: number;
    forbidden: number;
    samples: Array<{ method: string; action: string; urlSanitized: string }>;
  };
  assertions: string[];
}

export interface MethodARemainingSixCaptureSuccess {
  ok: true;
  png: Buffer;
  width: number;
  height: number;
  sha256: string;
  htmlPath: string;
  evidence: MethodARemainingSixCaptureEvidence;
}

export interface MethodARemainingSixReadinessSuccess {
  ok: true;
  readinessOnly: true;
  evidence: MethodARemainingSixCaptureEvidence;
}

export interface MethodARemainingSixCaptureFailure {
  ok: false;
  errors: string[];
  evidence: MethodARemainingSixCaptureEvidence | null;
}

export type MethodARemainingSixCaptureResult =
  | MethodARemainingSixCaptureSuccess
  | MethodARemainingSixReadinessSuccess
  | MethodARemainingSixCaptureFailure;

export interface MethodARemainingSixCaptureInput {
  lessonId: string;
  locale: Locale;
  cellId: string;
  /** Directory that will hold final.png + final-review.html (written only on success). */
  outputDir: string;
  appOrigin?: string;
  supabaseOrigin?: string;
  secretsRoot?: string;
  /**
   * When true, navigate + assert readiness/network/locale/framing contracts only;
   * do not capture or write PNG bytes. Used for the mandatory all-24 pre-capture gate.
   */
  readinessOnly?: boolean;
  /** Injected for unit tests — skips live browser. */
  captureFn?: (args: {
    lessonId: string;
    locale: Locale;
    appOrigin: string;
    config: MethodARemainingSixCaptureConfig;
    readinessOnly?: boolean;
  }) => Promise<{
    png: Buffer;
    finalUrl: string;
    evidence: MethodARemainingSixCaptureEvidence;
    readinessOnly?: boolean;
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

function expectedDirection(
  locale: Locale,
  config: MethodARemainingSixCaptureConfig,
): "rtl" | "ltr" {
  return config.directionByLocale?.[locale] ?? (locale === "en" ? "ltr" : "rtl");
}

function defaultSecretsRoot(): string {
  return (
    process.env.METHOD_A_LOCAL_SECRETS_ROOT ?? "E:/Temp/masaarat-lv-method-a-pilot-20260727/secrets"
  );
}

function buildReviewHtml(args: {
  cellId: string;
  lessonId: string;
  locale: Locale;
  concept: string | null;
  direction: string;
  sha256: string;
  width: number;
  height: number;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Method A remaining six — PENDING_HUMAN_REVIEW</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 24px; background: #f6f7f9; color: #111; }
  .meta { font-size: 13px; margin-bottom: 16px; line-height: 1.5; }
  img { max-width: 100%; height: auto; border: 1px solid #ccc; background: #fff; }
</style>
</head>
<body>
  <h1>Method A remaining six — PENDING_HUMAN_REVIEW</h1>
  <div class="meta">
    <div>cellId: ${args.cellId}</div>
    <div>lessonId: ${args.lessonId}</div>
    <div>locale: ${args.locale}</div>
    <div>direction: ${args.direction}</div>
    <div>concept: ${args.concept ?? ""}</div>
    <div>dims: ${args.width}×${args.height}</div>
    <div>sha256: ${args.sha256}</div>
    <div>authorization: ${METHOD_A_REMAINING_SIX_AUTH_ID}</div>
    <div>productionAccepted: false</div>
  </div>
  <img src="final.png" width="${args.width}" height="${args.height}" alt="${args.cellId}" />
</body>
</html>
`;
}

/**
 * Raw CDP client over a Bun WebSocket. Copied from methodALiveCapture.ts —
 * Playwright's connectOverCDP/launch hang on this host, so the pilot and the
 * remaining-six run both drive Chrome directly over the DevTools protocol.
 */
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

/** Generic PII masking applied after per-lesson framing, regardless of lessonId. */
const MASK_SENSITIVE_TEXT_EXPRESSION = `(() => {
  document.querySelectorAll("[data-method-a-privacy-mask]").forEach((n) => n.remove());
  const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/;
  const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const JWT_RE = /eyJ[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]+\\.[a-zA-Z0-9_-]+/;
  const maskRect = (r, id) => {
    if (!r || r.width < 4 || r.height < 4) return false;
    const mask = document.createElement("div");
    mask.setAttribute("data-method-a-privacy-mask", id);
    mask.style.cssText = [
      "position:fixed",
      "left:" + Math.max(0, r.x - 2) + "px",
      "top:" + Math.max(0, r.y - 2) + "px",
      "width:" + (r.width + 4) + "px",
      "height:" + (r.height + 4) + "px",
      "background:#111827",
      "border-radius:6px",
      "z-index:2147483647",
      "pointer-events:none",
    ].join(";");
    document.documentElement.appendChild(mask);
    return true;
  };
  let candidates = 0;
  let masked = 0;
  for (const el of document.querySelectorAll("*")) {
    if (el.children.length !== 0) continue;
    const t = (el.textContent || "").trim();
    if (!t) continue;
    if (EMAIL_RE.test(t) || UUID_RE.test(t) || JWT_RE.test(t)) {
      candidates += 1;
      if (maskRect(el.getBoundingClientRect(), "pii-" + candidates)) masked += 1;
    }
  }
  return { candidates, masked };
})()`;

const HIDE_PHASE_RIBBON_EXPRESSION = `
  document.querySelectorAll('a[href="/roadmap"]').forEach((el) => {
    const ribbon = el.closest("a") || el;
    ribbon.setAttribute("data-method-a-frame-hide", "1");
    ribbon.style.setProperty("display", "none", "important");
  });
`;

/** Per-lesson prepare/readiness expressions. Each returns { ok, errors, ...fields }. */
function buildPrepareExpression(lessonId: string): string {
  switch (lessonId) {
    case "builder-m2-l1-prompt-layer":
      return `(() => {
        ${HIDE_PHASE_RIBBON_EXPRESSION}
        const errors = [];
        const pathEl = document.querySelector("#path-builder");
        if (!pathEl) return { ok: false, errors: ["#path-builder not found"] };
        let moduleRows = pathEl.querySelectorAll("[id^='module-']");
        if (moduleRows.length === 0) {
          const toggle = pathEl.querySelector("button");
          if (toggle) toggle.click();
        }
        pathEl.scrollIntoView({ block: "start" });
        const pathText = pathEl.innerText || "";
        const progressBar = pathEl.querySelector('[role="progressbar"]');
        const ariaNow = progressBar ? Number(progressBar.getAttribute("aria-valuenow")) : NaN;
        const pctMatch = pathText.match(/(\\d{1,3})\\s*%/);
        // dashboard.progress.path embeds {done}/{total} — accept non-zero done counts too
        const doneMatch = pathText.match(/(\\d+)\\s*[\\/|من]\\s*(\\d+)/);
        const doneValue = doneMatch ? Number(doneMatch[1]) : 0;
        const progressValue = !Number.isNaN(ariaNow) && ariaNow > 0
          ? ariaNow
          : pctMatch
            ? Number(pctMatch[1])
            : doneValue;
        moduleRows = pathEl.querySelectorAll("[id^='module-']");
        const lessonRows = pathEl.querySelectorAll("[id^='lesson-']");
        if (progressValue <= 0) errors.push("builder path progress is not > 0");
        if (moduleRows.length === 0) errors.push("no numbered module stages visible under #path-builder");
        return { ok: errors.length === 0, errors, progressValue, doneValue, moduleCount: moduleRows.length, lessonCount: lessonRows.length };
      })()`;

    case "builder-m2-l2-instructions-examples":
      return `(() => {
        ${HIDE_PHASE_RIBBON_EXPRESSION}
        const errors = [];
        const ids = ["path-business", "path-creator", "path-analyst", "path-automator", "path-builder"];
        const present = ids.filter((id) => document.getElementById(id));
        if (present.length !== ids.length) {
          errors.push("missing path cards: " + ids.filter((id) => !present.includes(id)).join(","));
        }
        const first = document.getElementById(ids[0]);
        if (first) first.scrollIntoView({ block: "start" });
        return { ok: errors.length === 0, errors, presentCount: present.length };
      })()`;

    case "builder-m3-l1-context-layer":
      // FloatingAssistantLauncher opens on pointerup (not click) and commits asynchronously.
      // Guard against double-toggle during prepare polling.
      return `(() => {
        const errors = [];
        const fab = document.querySelector('[aria-controls="lesson-assistant"]');
        if (!fab) {
          errors.push('assistant FAB [aria-controls="lesson-assistant"] not found');
          return { ok: false, errors };
        }
        const panel = document.getElementById("lesson-assistant");
        if (panel) {
          const text = panel.innerText || "";
          const hasContext = /Current context|السياق الحالي/i.test(text);
          if (!hasContext) errors.push("assistant panel missing Current context / السياق الحالي label");
          return { ok: errors.length === 0, errors, fabFound: true, hasContext };
        }
        if (fab.getAttribute("aria-expanded") !== "true") {
          if (!window.__lvMethodAFabOpenAttempted) {
            window.__lvMethodAFabOpenAttempted = true;
            const rect = fab.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            const opts = (buttons) => ({
              bubbles: true,
              cancelable: true,
              composed: true,
              pointerId: 1,
              pointerType: "mouse",
              isPrimary: true,
              clientX: x,
              clientY: y,
              button: 0,
              buttons,
            });
            fab.dispatchEvent(new PointerEvent("pointerdown", opts(1)));
            fab.dispatchEvent(new PointerEvent("pointerup", opts(0)));
          }
          errors.push("#lesson-assistant panel did not open");
          return { ok: false, errors, fabFound: true };
        }
        errors.push("#lesson-assistant panel did not open");
        return { ok: false, errors, fabFound: true };
      })()`;

    case "builder-m6-l4-components-routes":
      return `(() => {
        const errors = [];
        window.scrollTo(0, Math.floor(document.body.scrollHeight * 0.28));
        const modules = document.querySelectorAll("[id^='module-']");
        const lessons = document.querySelectorAll("[id^='lesson-']");
        // Curriculum path cards are section.rounded-3xl blocks labeled "PATH · …"
        // (they do not use #path-* ids on this route).
        const pathSections = [...document.querySelectorAll("section.rounded-3xl")].filter((s) =>
          /PATH\\s*[·•]|PATH\\s+/i.test((s.innerText || "").slice(0, 160)),
        );
        if (modules.length < 2) errors.push("fewer than 2 module cards visible: " + modules.length);
        if (lessons.length < 4) errors.push("fewer than 4 lesson rows visible: " + lessons.length);
        if (pathSections.length < 2) errors.push("fewer than 2 path sections present: " + pathSections.length);
        return { ok: errors.length === 0, errors, moduleCount: modules.length, lessonCount: lessons.length, pathSectionCount: pathSections.length };
      })()`;

    case "builder-m7-l3-queries":
      return `(() => {
        const errors = [];
        const bodyText = document.body.innerText || "";
        if (/جارٍ التحميل|جاري التحميل|loading/i.test(bodyText.slice(0, 200))) {
          errors.push("analytics still loading");
          return { ok: false, errors };
        }
        const grid =
          document.querySelector("section.grid.grid-cols-2") ||
          document.querySelector("main section.grid");
        const cards = grid ? grid.children.length : 0;
        if (cards !== 4) errors.push("expected 4 KPI cards, found " + cards);
        const text = grid ? grid.innerText : bodyText;
        const hasStreak = /streak|السلسلة/i.test(text);
        const hasTime = /learning time|وقت التعل|وقت التعلم|time learned/i.test(text);
        const hasLessons = /completed lessons|دروس خلّصتها|دروس خلصتها|lessons completed/i.test(text);
        const hasMissions = /completed missions|المهام المنجزة|missions completed|\\bmissions?\\b/i.test(text);
        if (!hasStreak) errors.push("missing streak KPI label");
        if (!hasTime) errors.push("missing learning-time KPI label");
        if (!hasLessons) errors.push("missing completed-lessons KPI label");
        if (!hasMissions) errors.push("missing completed-missions KPI label");
        return { ok: errors.length === 0, errors, kpiCardCount: cards };
      })()`;

    case "builder-m10-l2-first-users":
      return `(() => {
        ${HIDE_PHASE_RIBBON_EXPRESSION}
        const errors = [];
        const introEl = document.getElementById("path-intro");
        if (!introEl) errors.push("#path-intro not found");
        window.scrollTo(0, 0);
        // Match leaf labels only — div[textContent] hits ancestors first and then the
        // first "%/٪" in that huge subtree is often a 0% path card.
        const leafLabel = (re) =>
          [...document.querySelectorAll("p,span,h1,h2,h3,label")].find((el) => {
            const t = (el.textContent || "").trim();
            return t.length > 0 && t.length < 80 && re.test(t);
          });
        const overallNode = leafLabel(/^(Overall progress|تقدّمك الكلي|تقدمك الكلي)$/);
        const overallCard = overallNode
          ? (overallNode.closest("div.group") ||
              overallNode.closest("[class*='min-h-']") ||
              overallNode.parentElement?.parentElement?.parentElement)
          : null;
        const overallText = overallCard ? overallCard.innerText || "" : "";
        const pctMatch = overallText.match(/(\\d{1,3})\\s*[%٪]/);
        let progressValue = pctMatch ? Number(pctMatch[1]) : 0;
        if (progressValue <= 0) {
          const doneMatch =
            overallText.match(/(\\d+)\\s*\\/\\s*(\\d+)/) ||
            overallText.match(/(\\d+)\\s+of\\s+(\\d+)/i) ||
            overallText.match(/(\\d+)\\s+من\\s+(\\d+)/);
          if (doneMatch && Number(doneMatch[1]) > 0) progressValue = Math.max(1, Number(doneMatch[1]));
        }
        if (progressValue <= 0) {
          const statsGrid = document.querySelector("main .grid.gap-4.mb-8");
          const statsText = statsGrid ? statsGrid.innerText || "" : "";
          for (const m of statsText.matchAll(/(\\d{1,3})\\s*[%٪]/g)) {
            const n = Number(m[1]);
            if (n > 0) progressValue = Math.max(progressValue, n);
          }
        }
        const streakNode = leafLabel(/^(Activity streak|سلسلة النشاط)$/);
        const streakCard = streakNode
          ? (streakNode.closest("div.group") ||
              streakNode.closest("[class*='min-h-']") ||
              streakNode.parentElement?.parentElement?.parentElement)
          : null;
        const streakText = streakCard ? streakCard.innerText || "" : "";
        const streakMatch = streakText.match(/(\\d{1,3})\\s*(day|days|أيام|يوم)/i);
        let streakValue = streakMatch ? Number(streakMatch[1]) : 0;
        if (streakValue <= 0) {
          const statsGrid = document.querySelector("main .grid.gap-4.mb-8");
          const statsText = statsGrid ? statsGrid.innerText || "" : "";
          const m = statsText.match(/(\\d{1,3})\\s*(day|days|أيام|يوم)/i);
          if (m) streakValue = Number(m[1]);
        }
        if (progressValue <= 0) errors.push("overall progress not > 0");
        if (streakValue <= 0) errors.push("streak not > 0");
        return {
          ok: errors.length === 0,
          errors,
          progressValue,
          streakValue,
          pathIntroPresent: !!introEl,
          overallFound: !!overallNode,
          streakFound: !!streakNode,
        };
      })()`;

    default:
      return `(() => ({ ok: false, errors: ["no prepare script for lessonId"] }))()`;
  }
}

interface PrepareResult {
  ok?: boolean;
  errors?: string[];
  [key: string]: unknown;
}

async function liveBrowserCaptureRemainingSix(args: {
  lessonId: string;
  locale: Locale;
  appOrigin: string;
  supabaseOrigin: string;
  secretsRoot: string;
  config: MethodARemainingSixCaptureConfig;
  readinessOnly?: boolean;
}): Promise<{
  png: Buffer;
  finalUrl: string;
  evidence: MethodARemainingSixCaptureEvidence;
  readinessOnly?: boolean;
}> {
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
  const synth = loadEnvFile(resolve(args.secretsRoot, "synthetic-admin.env"));
  const email = synth.SYNTH_EMAIL;
  const password = synth.SYNTH_PASSWORD;

  const networkSamples: MethodARemainingSixCaptureEvidence["networkAudit"]["samples"] = [];
  let allowed = 0;
  let blockedNonLocal = 0;
  let forbidden = 0;
  let total = 0;
  const assertionErrors: string[] = [];

  const cdpHttp =
    process.env.METHOD_A_CDP_URL ?? process.env.METHOD_A_CHROME_CDP_URL ?? "http://127.0.0.1:55441";

  const browser = await RawCdpClient.connect(cdpHttp);
  let sessionId: string | undefined;
  let targetId: string | undefined;

  try {
    // Disposable CDP hygiene: close leaked page targets from prior cells so the
    // browser does not accumulate dozens of tabs mid-batch.
    try {
      const listed = (await browser.send("Target.getTargets")) as {
        targetInfos?: Array<{ targetId: string; type: string; url?: string }>;
      };
      for (const info of listed.targetInfos ?? []) {
        if (info.type !== "page") continue;
        await browser
          .send("Target.closeTarget", { targetId: info.targetId })
          .catch(() => undefined);
      }
    } catch {
      /* best-effort */
    }

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
    // Disposable-only: block known external lesson-media hosts so captures stay loopback-local.
    await sessionSend("Network.setBlockedURLs", {
      urls: [
        "*mediadelivery.net*",
        "*bunnycdn*",
        "*b-cdn.net*",
        "*youtube.com*",
        "*youtu.be*",
        "*vimeo.com*",
        "*fonts.googleapis.com*",
        "*fonts.gstatic.com*",
        "*masaarat.ai*",
      ],
    }).catch(() => undefined);

    browser.on("Network.requestWillBeSent", (paramsUnknown, eventSessionId) => {
      if (eventSessionId && eventSessionId !== sessionId) return;
      const params = paramsUnknown as { request?: { url?: string; method?: string } };
      const url = params.request?.url ?? "";
      if (!url) return;
      total += 1;
      const sanitized = sanitizeUrl(url);
      const method = params.request?.method ?? "GET";
      // Requests we explicitly block are expected and must not fail the capture.
      if (
        /mediadelivery\.net|bunnycdn|b-cdn\.net|youtube\.com|youtu\.be|vimeo\.com|fonts\.googleapis|fonts\.gstatic|masaarat\.ai/i.test(
          url,
        )
      ) {
        networkSamples.push({
          method,
          action: "BLOCKED_BY_POLICY",
          urlSanitized: sanitized.slice(0, 180),
        });
        return;
      }
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
        networkSamples.push({ method, action: "ALLOW", urlSanitized: sanitized.slice(0, 180) });
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
        const keys = ["sb-127-auth-token", "sb-127.0.0.1-auth-token", "supabase.auth.token"];
        try {
          const host = new URL(${JSON.stringify(args.supabaseOrigin)}).hostname;
          keys.push("sb-" + host.split(".")[0] + "-auth-token");
        } catch {}
        for (const key of [...new Set(keys)]) {
          localStorage.setItem(key, JSON.stringify(session));
        }
        return { keys, href: location.href };
      })()`,
    })) as { result?: { value?: unknown }; exceptionDetails?: unknown };

    if (inject.exceptionDetails) {
      throw new Error("session injection failed");
    }

    if (email && password) {
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
    }

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
        /* navigation can invalidate the execution context mid-evaluate */
      }
    }

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

    const targetPath = args.config.path ?? "/dashboard";
    const extraSearch = args.config.search ? `&${args.config.search}` : "";
    const target = `${args.appOrigin}${targetPath}?locale=${encodeURIComponent(args.locale)}${extraSearch}`;
    await navigate(target);

    // Wait for hydration past the initial empty SPA shell.
    for (let i = 0; i < 30; i++) {
      await sleep(400);
      try {
        const probeReady = (await sessionSend("Runtime.evaluate", {
          returnByValue: true,
          expression: `(() => ({ len: (document.body ? document.body.innerText : "").trim().length, href: location.href }))()`,
        })) as { result?: { value?: { len?: number; href?: string } } };
        const v = probeReady.result?.value;
        if ((v?.len ?? 0) > 80 && !(v?.href ?? "").includes("/login")) break;
      } catch {
        /* transient during hydration */
      }
    }
    await sleep(400);

    // Poll lesson-specific prepare until ready (progress animations / React Query hydration).
    let prepareResult: PrepareResult = { ok: false, errors: ["prepare not run"] };
    for (let attempt = 0; attempt < 25; attempt++) {
      const prepare = (await sessionSend("Runtime.evaluate", {
        returnByValue: true,
        expression: buildPrepareExpression(args.lessonId),
      })) as { result?: { value?: PrepareResult }; exceptionDetails?: unknown };
      prepareResult = prepare.result?.value ?? {
        ok: false,
        errors: ["prepare script returned no value"],
      };
      if (prepare.exceptionDetails) {
        prepareResult = { ok: false, errors: ["prepare script threw an exception"] };
      }
      if (prepareResult.ok) break;
      await sleep(400);
    }
    for (const e of prepareResult.errors ?? []) assertionErrors.push(e);

    // Lesson-specific two-step flow: open assistant, then verify the panel content
    // once it has rendered (no submit is ever clicked).
    if (args.lessonId === "builder-m3-l1-context-layer") {
      await sleep(800);
      const panelCheck = (await sessionSend("Runtime.evaluate", {
        returnByValue: true,
        expression: `(() => {
          const errors = [];
          const panel = document.getElementById("lesson-assistant");
          if (!panel) { errors.push("#lesson-assistant panel did not open"); return { ok: false, errors }; }
          const text = panel.innerText || "";
          const hasContext = /Current context|السياق الحالي/i.test(text);
          if (!hasContext) errors.push("assistant panel missing Current context / السياق الحالي label");
          return { ok: errors.length === 0, errors, hasContext };
        })()`,
      })) as { result?: { value?: PrepareResult } };
      const panelValue = panelCheck.result?.value;
      if (panelValue?.ok) {
        // Clear transient prepare-poll errors once the panel is genuinely open.
        for (let i = assertionErrors.length - 1; i >= 0; i--) {
          if (/lesson-assistant|Current context|السياق الحالي/i.test(assertionErrors[i] ?? "")) {
            assertionErrors.splice(i, 1);
          }
        }
      } else {
        for (const e of panelValue?.errors ?? []) assertionErrors.push(e);
      }
    }

    await sleep(200);

    const mask = (await sessionSend("Runtime.evaluate", {
      returnByValue: true,
      expression: MASK_SENSITIVE_TEXT_EXPRESSION,
    })) as { result?: { value?: { candidates?: number; masked?: number } } };
    const maskCandidates = mask.result?.value?.candidates ?? 0;
    const maskedCount = mask.result?.value?.masked ?? 0;
    if (maskCandidates > 0 && maskedCount < maskCandidates) {
      assertionErrors.push(`only masked ${maskedCount}/${maskCandidates} sensitive text nodes`);
    }
    await sleep(200);

    const probe = (await sessionSend("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => {
        const bodyText = document.body ? document.body.innerText : "";
        const html = document.documentElement ? document.documentElement.outerHTML : "";
        const root = document.querySelector("[dir]") || document.documentElement;
        const main = document.querySelector("main");
        const chromeText = [
          document.querySelector("nav")?.innerText || "",
          document.querySelector("aside")?.innerText || "",
          document.querySelector("[data-sidebar]")?.innerText || "",
        ].join("\\n");
        // document.title is intentionally excluded from chrome purity: some
        // first-party routes (e.g. /analytics) ship a fixed Arabic <title>
        // while learner chrome follows the requested locale.
        return {
          href: location.href,
          pathname: location.pathname,
          locale: new URLSearchParams(location.search).get("locale"),
          direction: root.getAttribute("dir"),
          lang: document.documentElement.getAttribute("lang"),
          title: document.title,
          bodyText,
          chromeText,
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
          chromeText: string;
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
    const chromeText = pageState.chromeText ?? pageState.title ?? "";
    const html = pageState.html;

    const forbiddenStates = args.config.forbiddenStates ?? [
      "login",
      "loading",
      "blank",
      "error",
      "denied",
      "guest",
    ];
    const stateProbes: Record<string, boolean> = {
      login: finalUrl.includes("/login"),
      loading: /loading|جاري التحميل|جارٍ التحميل|يرجى الانتظار/i.test(bodyText.slice(0, 400)),
      blank: bodyText.trim().length <= 80,
      error: /something went wrong|خطأ غير متوقع|application error/i.test(bodyText),
      denied: /access denied|forbidden|غير مصرح|غير مصرّح/i.test(bodyText),
      paywall: /upgrade to pro|اشترك الآن|ترقية/i.test(bodyText),
      guest: /\bguest\b/i.test(bodyText),
    };

    const readiness: Record<string, boolean | string | number> = {
      resolved_route: pathname,
      authenticated_not_login: !stateProbes.login,
      not_empty: bodyText.trim().length > 80,
      title: pageState.title,
      lang: pageState.lang ?? "",
    };
    for (const state of forbiddenStates) {
      readiness[`no_${state}`] = !stateProbes[state];
    }

    const redaction = {
      no_jwt_visible: !/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/.test(bodyText),
      no_service_role: !/service_role|sb_secret_/i.test(bodyText),
      no_password_literal: !/SYNTH_PASSWORD|password\s*[:=]/i.test(bodyText),
      no_forbidden_markers_in_dom: !containsForbidden(html) && !containsForbidden(bodyText),
      no_google_fonts_link: !/fonts\.googleapis|fonts\.gstatic/i.test(html),
      pii_candidates: maskCandidates,
      pii_masked: maskedCount,
    };

    const expectedDir = expectedDirection(args.locale, args.config);
    const assertions: string[] = [];
    if (resolvedLocale !== args.locale) {
      assertions.push(
        `locale mismatch: requested ${args.locale}, resolved ${String(resolvedLocale)}`,
      );
    }
    if (direction !== expectedDir) {
      assertions.push(`direction mismatch: expected ${expectedDir}, got ${String(direction)}`);
    }
    if (args.locale === "en" && ARABIC_RE.test(chromeText)) {
      assertions.push("en chrome contains Arabic");
    }
    if (
      (args.locale === "ar-MSA" || args.locale === "ar-Gulf") &&
      EGYPTIAN_MARKERS_RE.test(chromeText)
    ) {
      assertions.push(`${args.locale} chrome contains Egyptian dialect markers`);
    }
    if (args.locale !== "en" && !ARABIC_RE.test(chromeText) && !ARABIC_RE.test(bodyText)) {
      assertions.push(`${args.locale} capture missing Arabic text`);
    }
    for (const state of forbiddenStates) {
      if (stateProbes[state]) assertions.push(`forbidden state present: ${state}`);
    }
    if (!redaction.no_jwt_visible) assertions.push("JWT visible");
    if (!redaction.no_service_role) assertions.push("service_role/secret visible");
    if (!redaction.no_password_literal) assertions.push("password material visible");
    if (!redaction.no_forbidden_markers_in_dom) assertions.push("forbidden markers in DOM");
    if (!redaction.no_google_fonts_link) assertions.push("Google Fonts link present");
    if (forbidden > 0) assertions.push(`forbidden network requests: ${forbidden}`);
    if (prepareResult.ok === false && (prepareResult.errors ?? []).length === 0) {
      assertions.push("lesson-specific prepare script failed with no detail");
    }
    assertions.push(...assertionErrors);

    const preparePrimitives: Record<string, boolean | string | number> = {};
    for (const [key, value] of Object.entries(prepareResult)) {
      if (key === "errors") continue;
      if (typeof value === "boolean" || typeof value === "string" || typeof value === "number") {
        preparePrimitives[key] = value;
      }
    }

    const evidence: MethodARemainingSixCaptureEvidence = {
      lessonId: args.lessonId,
      concept: args.config.concept ?? null,
      requestedLocale: args.locale,
      resolvedLocale,
      direction,
      route: pathname,
      finalUrl: sanitizeUrl(finalUrl),
      readiness: { ...readiness, ...preparePrimitives },
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

    if (args.readinessOnly) {
      if (targetId) {
        await browser.send("Target.closeTarget", { targetId }).catch(() => undefined);
      }
      return { png: Buffer.alloc(0), finalUrl, evidence, readinessOnly: true };
    }

    // Ensure the layout viewport is at origin before clipping (avoids blank compositor frames).
    await sessionSend("Runtime.evaluate", {
      returnByValue: true,
      expression: `(() => { window.scrollTo(0, 0); return { y: window.scrollY, w: window.innerWidth, h: window.innerHeight }; })()`,
    });
    await sleep(300);

    let shot = (await sessionSend("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    })) as { data: string };

    let pngBuf = Buffer.from(shot.data, "base64");
    // Fail soft-retry without fromSurface if the first frame is suspiciously tiny (blank).
    if (pngBuf.length < 20_000) {
      await sleep(500);
      shot = (await sessionSend("Page.captureScreenshot", {
        format: "png",
        clip: { x: 0, y: 0, width: CANVAS_WIDTH, height: CANVAS_HEIGHT, scale: 1 },
        captureBeyondViewport: true,
        fromSurface: true,
      })) as { data: string };
      pngBuf = Buffer.from(shot.data, "base64");
    }
    if (pngBuf.length < 20_000) {
      throw new Error(`screenshot appears blank/empty (bytes=${pngBuf.length}); refusing finalize`);
    }

    if (targetId) {
      await browser.send("Target.closeTarget", { targetId }).catch(() => undefined);
    }

    return { png: pngBuf, finalUrl, evidence };
  } finally {
    browser.close();
  }
}

/**
 * Capture one Method A remaining-six cell. Fail-closed: refuses to write final.png
 * unless the lesson/cell is authorized, the config's cellAllowlist includes cellId,
 * and all readiness/redaction/network/locale/lesson-specific assertions pass.
 */
export async function captureMethodARemainingSixCell(
  input: MethodARemainingSixCaptureInput,
): Promise<MethodARemainingSixCaptureResult> {
  if (
    process.env.CONTROLLED_V1_ZERO_CAPTURE === "1" ||
    process.env.CONTROLLED_V1_ZERO_RENDER === "1"
  ) {
    return {
      ok: false,
      errors: [
        "BLOCKED_ZERO_CAPTURE: live Method A remaining-six capture refused under ZERO_CAPTURE/ZERO_RENDER",
      ],
      evidence: null,
    };
  }

  if (!(METHOD_A_REMAINING_SIX_LESSON_IDS as readonly string[]).includes(input.lessonId)) {
    return {
      ok: false,
      errors: [`refusing non-authorized Method A remaining-six lesson: ${input.lessonId}`],
      evidence: null,
    };
  }

  const config = loadRemainingSixCaptureConfig(input.lessonId);
  if (!config) {
    return {
      ok: false,
      errors: [`no authorized capture config found for lesson: ${input.lessonId}`],
      evidence: null,
    };
  }

  if (!config.cellAllowlist || !config.cellAllowlist.includes(input.cellId)) {
    return {
      ok: false,
      errors: [`cellId not in capture config cellAllowlist: ${input.cellId}`],
      evidence: null,
    };
  }

  if (!(METHOD_A_REMAINING_SIX_CELL_IDS as readonly string[]).includes(input.cellId)) {
    return {
      ok: false,
      errors: [`cellId not part of the authorized remaining-six set: ${input.cellId}`],
      evidence: null,
    };
  }

  if (input.cellId !== `${input.lessonId}__${input.locale}`) {
    return {
      ok: false,
      errors: [`cellId/locale mismatch: ${input.cellId} vs locale=${input.locale}`],
      evidence: null,
    };
  }

  const appOrigin =
    input.appOrigin ?? process.env.METHOD_A_LOCAL_APP_ORIGIN ?? METHOD_A_REMAINING_SIX_APP_ORIGIN;
  const supabaseOrigin =
    input.supabaseOrigin ??
    process.env.METHOD_A_LOCAL_SUPABASE_ORIGIN ??
    METHOD_A_REMAINING_SIX_SUPABASE_ORIGIN;
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
      ? await input.captureFn({
          lessonId: input.lessonId,
          locale: input.locale,
          appOrigin,
          config,
          readinessOnly: input.readinessOnly,
        })
      : await liveBrowserCaptureRemainingSix({
          lessonId: input.lessonId,
          locale: input.locale,
          appOrigin,
          supabaseOrigin,
          secretsRoot,
          config,
          readinessOnly: input.readinessOnly,
        });

    if (captured.evidence.assertions.length > 0) {
      return { ok: false, errors: captured.evidence.assertions, evidence: captured.evidence };
    }

    if (input.readinessOnly || captured.readinessOnly) {
      return { ok: true, readinessOnly: true, evidence: captured.evidence };
    }

    const dims = (() => {
      const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      if (captured.png.length < 24 || !captured.png.subarray(0, 8).equals(PNG_SIG)) return null;
      return { width: captured.png.readUInt32BE(16), height: captured.png.readUInt32BE(20) };
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
        lessonId: input.lessonId,
        locale: input.locale,
        concept: config.concept ?? null,
        direction: captured.evidence.direction ?? expectedDirection(input.locale, config),
        sha256,
        width: dims.width,
        height: dims.height,
      }),
      "utf8",
    );

    if (!existsSync(pngPath)) {
      return { ok: false, errors: ["final.png missing after write"], evidence: captured.evidence };
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

export function writeRemainingSixCaptureEvidenceJson(
  path: string,
  cellId: string,
  evidence: MethodARemainingSixCaptureEvidence,
  sha256: string | null,
): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    `${JSON.stringify(
      {
        schemaVersion: "controlled-v1-method-a-remaining-six-capture-evidence/1",
        authorizationId: METHOD_A_REMAINING_SIX_AUTH_ID,
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
