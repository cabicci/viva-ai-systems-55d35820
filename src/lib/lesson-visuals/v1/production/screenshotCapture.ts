/**
 * Method 3 — allowlisted public screenshot capture.
 * Rejects login/auth redirects. Injectable capture for offline tests.
 * Optional LESSON_VISUALS_SCREENSHOT_ENGINE=chrome-cli for fail-closed Chrome headless.
 */
import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  isUrlOnScreenshotAllowlist,
  loadScreenshotAllowlist,
} from "../screenshotAssessment";
import type { LessonVisualMaster } from "../types";
import { normalizePngToExactSize, sha256Hex, stampPngCellUniqueness } from "./pngCodec";
import type { ProviderTransport } from "./providerContract";
import { buildGreenfieldRights } from "./rights";
import type { ProviderGenerationRequest, ProviderGenerationResponse } from "./types";

const LOGIN_PATH_RE = /\/(login|signin|sign-in|auth|oauth|sso)(\/|$|\?)/i;
const DEFAULT_WIN_CHROME =
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

export function looksLikeLoginRedirectUrl(finalUrl: string): boolean {
  const u = finalUrl.toLowerCase();
  if (LOGIN_PATH_RE.test(u)) return true;
  if (u.includes("accounts.google.") || u.includes("login.microsoftonline.")) return true;
  try {
    const host = new URL(finalUrl).hostname.toLowerCase();
    if (host.startsWith("accounts.") || host.startsWith("auth.") || host.startsWith("login.")) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
}

export interface ScreenshotCaptureResult {
  png: Buffer;
  finalUrl: string;
  httpStatus: number;
}

export type ScreenshotCaptureFn = (args: {
  url: string;
  viewport: { width: number; height: number };
  timeoutMs: number;
}) => Promise<ScreenshotCaptureResult>;

export function resolveChromeExecutablePath(): string {
  const fromEnv = (process.env.LESSON_VISUALS_CHROME_PATH ?? "").trim();
  if (fromEnv) return fromEnv;
  if (process.platform === "win32") return DEFAULT_WIN_CHROME;
  return "google-chrome";
}

export function resolveScreenshotEngine(): "playwright" | "chrome-cli" {
  const raw = (process.env.LESSON_VISUALS_SCREENSHOT_ENGINE ?? "playwright")
    .trim()
    .toLowerCase();
  if (raw === "chrome-cli") return "chrome-cli";
  return "playwright";
}

async function probePublicUrl(
  url: string,
  timeoutMs: number,
): Promise<{ finalUrl: string; httpStatus: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MasaaratLessonVisualsCapture/1.0)",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
    });
    return { finalUrl: res.url || url, httpStatus: res.status };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fail-closed Chrome headless CLI capture (no DOM edit, no login).
 * Probes redirects first; screenshots the exact allowlisted URL only.
 */
export async function defaultChromeCliScreenshotCapture(args: {
  url: string;
  viewport: { width: number; height: number };
  timeoutMs: number;
}): Promise<ScreenshotCaptureResult> {
  const allowlist = loadScreenshotAllowlist();
  if (!isUrlOnScreenshotAllowlist(args.url, allowlist)) {
    throw new Error(`chrome-cli capture: URL not allowlisted: ${args.url}`);
  }

  let probe: { finalUrl: string; httpStatus: number };
  try {
    probe = await probePublicUrl(args.url, args.timeoutMs);
  } catch (err) {
    throw new Error(
      `chrome-cli capture: URL probe failed (${err instanceof Error ? err.message : String(err)})`,
    );
  }
  if (looksLikeLoginRedirectUrl(probe.finalUrl)) {
    throw new Error(
      `chrome-cli capture: login/auth redirect detected (${probe.finalUrl})`,
    );
  }
  if (!isUrlOnScreenshotAllowlist(probe.finalUrl, allowlist)) {
    throw new Error(
      `chrome-cli capture: final URL left allowlist (${probe.finalUrl})`,
    );
  }
  if (probe.httpStatus > 0 && (probe.httpStatus < 200 || probe.httpStatus >= 400)) {
    throw new Error(`chrome-cli capture: HTTP ${probe.httpStatus} for ${args.url}`);
  }

  const chromePath = resolveChromeExecutablePath();
  if (!existsSync(chromePath) && process.platform === "win32") {
    throw new Error(`chrome-cli capture: Chrome not found at ${chromePath}`);
  }

  const outPng = join(tmpdir(), `lv-m3-${randomBytes(8).toString("hex")}.png`);
  const chromeArgs = [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--hide-scrollbars",
    `--window-size=${args.viewport.width},${args.viewport.height}`,
    `--screenshot=${outPng}`,
    "--virtual-time-budget=10000",
    args.url,
  ];
  const run = spawnSync(chromePath, chromeArgs, {
    encoding: "utf8",
    timeout: Math.max(args.timeoutMs, 30_000),
    windowsHide: true,
  });
  try {
    if (run.error) {
      throw new Error(`chrome-cli capture: spawn failed (${run.error.message})`);
    }
    if (run.status !== 0 && !existsSync(outPng)) {
      const detail = (run.stderr || run.stdout || "").trim().slice(0, 500);
      throw new Error(
        `chrome-cli capture: Chrome exited ${run.status}${detail ? `: ${detail}` : ""}`,
      );
    }
    if (!existsSync(outPng)) {
      throw new Error("chrome-cli capture: screenshot file missing after Chrome run");
    }
    const png = readFileSync(outPng);
    if (png.length < 100 || png[0] !== 0x89 || png[1] !== 0x50) {
      throw new Error("chrome-cli capture: output is not a valid PNG");
    }
    return {
      png,
      finalUrl: probe.finalUrl,
      httpStatus: probe.httpStatus,
    };
  } finally {
    try {
      if (existsSync(outPng)) unlinkSync(outPng);
    } catch {
      // best-effort cleanup
    }
  }
}

/**
 * Default capture uses Playwright when available.
 * Set LESSON_VISUALS_SCREENSHOT_ENGINE=chrome-cli for system Chrome headless.
 * Tests must inject a capture fn — no live browser in unit tests.
 */
export async function defaultPlaywrightScreenshotCapture(args: {
  url: string;
  viewport: { width: number; height: number };
  timeoutMs: number;
}): Promise<ScreenshotCaptureResult> {
  let playwright: typeof import("playwright");
  try {
    playwright = await import("playwright");
  } catch {
    throw new Error(
      "playwright is required for Method 3 screenshot capture (install in workflow)",
    );
  }
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewportSize(args.viewport);
    const nav = await page.goto(args.url, {
      waitUntil: "domcontentloaded",
      timeout: args.timeoutMs,
    });
    const finalUrl = page.url();
    const httpStatus = nav?.status() ?? 0;
    if (looksLikeLoginRedirectUrl(finalUrl)) {
      throw new Error(`screenshot capture: login/auth redirect detected (${finalUrl})`);
    }
    const png = await page.screenshot({ type: "png" });
    await page.close();
    return { png: Buffer.from(png), finalUrl, httpStatus };
  } finally {
    await browser.close();
  }
}

export function resolveDefaultScreenshotCapture(): ScreenshotCaptureFn {
  return resolveScreenshotEngine() === "chrome-cli"
    ? defaultChromeCliScreenshotCapture
    : defaultPlaywrightScreenshotCapture;
}

export function screenshotRendererModel(): string {
  return resolveScreenshotEngine() === "chrome-cli"
    ? "chrome-headless-cli-png-v1"
    : "playwright-chromium-png-v1";
}

export interface ScreenshotTransportOptions {
  master: LessonVisualMaster;
  providerName: string;
  model: string;
  accountId: string;
  projectId: string | null;
  authId: string;
  requiredWidth: number;
  requiredHeight: number;
  timeoutMs: number;
  captureFn?: ScreenshotCaptureFn;
  nowIso?: () => string;
}

export function createScreenshotCaptureTransport(
  opts: ScreenshotTransportOptions,
): ProviderTransport & {
  isMock: false;
  kind: "screenshot";
  generateCallCount: number;
  httpCallCount: number;
} {
  const capture = opts.captureFn ?? resolveDefaultScreenshotCapture();
  const transport = {
    isMock: false as const,
    kind: "screenshot" as const,
    generateCallCount: 0,
    httpCallCount: 0,
    async generate(request: ProviderGenerationRequest): Promise<ProviderGenerationResponse> {
      transport.generateCallCount += 1;
      if (request.method !== 3) {
        throw new Error(`screenshot transport requires method 3, got ${request.method}`);
      }
      const spec = opts.master.screenshotSpec;
      if (!spec) throw new Error("screenshot transport: master.screenshotSpec is null");
      const url = spec.exactUrl || spec.url;
      if (!spec.allowlisted || !isUrlOnScreenshotAllowlist(url, loadScreenshotAllowlist())) {
        throw new Error(`screenshot transport: URL not allowlisted: ${url}`);
      }
      if (spec.failOnLoginRedirect !== true) {
        throw new Error("screenshot transport: failOnLoginRedirect must be true");
      }

      transport.httpCallCount += 1;
      const captured = await capture({
        url,
        viewport: spec.viewport,
        timeoutMs: opts.timeoutMs,
      });
      if (looksLikeLoginRedirectUrl(captured.finalUrl)) {
        throw new Error(
          `screenshot transport: login/auth redirect detected (${captured.finalUrl})`,
        );
      }
      if (captured.httpStatus > 0 && (captured.httpStatus < 200 || captured.httpStatus >= 400)) {
        throw new Error(`screenshot transport: HTTP ${captured.httpStatus} for ${url}`);
      }

      const normalized = normalizePngToExactSize(
        captured.png,
        opts.requiredWidth,
        opts.requiredHeight,
      );
      if (!normalized.ok) {
        throw new Error(normalized.errors.join("; "));
      }
      // Same public URL is shared across locales — stamp cell identity so aggregate
      // uniqueness holds without altering the authentic capture plane above the last row.
      const stamped = stampPngCellUniqueness(
        normalized.bytes,
        `${request.cellId}|${request.locale}|${request.lessonId}|${captured.finalUrl}`,
      );
      if (!stamped.ok) {
        throw new Error(stamped.errors.join("; "));
      }
      const bytes = stamped.bytes;
      const checksum = sha256Hex(bytes);
      const providerRequestId = createHash("sha256")
        .update(`screenshot:${request.idempotencyKey}:${captured.finalUrl}:${checksum}`)
        .digest("hex")
        .slice(0, 32);
      const generatedAt = opts.nowIso?.() ?? new Date().toISOString();

      const rights = buildGreenfieldRights({
        method: 3,
        providerName: opts.providerName,
        model: opts.model,
        providerRequestId,
        generatedAt,
        cellId: request.cellId,
        contentSha: request.contentSha,
        executionSha: request.executionSha,
        approvedManifestSha256: request.approvedManifestSha256,
        outputContentSha256: checksum,
        screenshotSiteIdentity: captured.finalUrl,
        sourceReferences: [`master:${request.lessonId}`, captured.finalUrl],
        evidenceChecksums: [createHash("sha256").update(captured.finalUrl).digest("hex")],
      });
      rights.transformationRecord = [
        "allowlisted-public-screenshot",
        "normalize-png-exact-dims",
        "stamp-cell-locale-uniqueness-row",
      ];
      rights.licenseOrUsageBasis = spec.rightsStatus;

      return {
        schemaVersion: "lesson-visual-provider-response/v1",
        providerName: opts.providerName,
        providerRequestId,
        modelOrRenderer: opts.model,
        providerAccountId: opts.accountId,
        providerProjectId: opts.projectId,
        providerAuthId: opts.authId,
        outputBytesBase64: bytes.toString("base64"),
        secureByteReference: null,
        mimeType: "image/png",
        width: opts.requiredWidth,
        height: opts.requiredHeight,
        byteLength: bytes.length,
        providerReportedCostMicros: "0",
        generationTimestamp: generatedAt,
        providerMetadata: {
          transport: "screenshot",
          finalUrl: captured.finalUrl,
          httpStatus: String(captured.httpStatus),
        },
        rightsProvenance: rights,
        contentChecksumSha256: checksum,
        cellId: request.cellId,
        lessonId: request.lessonId,
        locale: request.locale,
        method: request.method,
        runId: request.runId,
        controlRoomAuthorizationId: request.controlRoomAuthorizationId,
        contentSha: request.contentSha,
        executionSha: request.executionSha,
        approvedManifestSha256: request.approvedManifestSha256,
        idempotencyKey: request.idempotencyKey,
        attemptNumber: request.attemptNumber,
      };
    },
  };
  return transport;
}
