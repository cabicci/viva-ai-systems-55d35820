/**
 * Method 3 — allowlisted public screenshot capture.
 * Rejects login/auth redirects. Injectable capture for offline tests.
 */
import { createHash } from "node:crypto";
import {
  isUrlOnScreenshotAllowlist,
  loadScreenshotAllowlist,
} from "../screenshotAssessment";
import type { LessonVisualMaster } from "../types";
import { normalizePngToExactSize, sha256Hex } from "./pngCodec";
import type { ProviderTransport } from "./providerContract";
import { buildGreenfieldRights } from "./rights";
import type { ProviderGenerationRequest, ProviderGenerationResponse } from "./types";

const LOGIN_PATH_RE = /\/(login|signin|sign-in|auth|oauth|sso)(\/|$|\?)/i;

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

/**
 * Default capture uses Playwright when available.
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
  const capture = opts.captureFn ?? defaultPlaywrightScreenshotCapture;
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
      const bytes = normalized.bytes;
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
