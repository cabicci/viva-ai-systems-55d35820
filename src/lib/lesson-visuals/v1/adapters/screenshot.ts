import {
  isUrlOnScreenshotAllowlist,
  loadScreenshotAllowlist,
} from "../screenshotAssessment";
import type { AdapterContext, AdapterResult } from "../types";

function looksLikeLoginRedirect(finalUrl: string, bodyText: string): boolean {
  const u = finalUrl.toLowerCase();
  if (
    u.includes("/login") ||
    u.includes("/signin") ||
    u.includes("/auth") ||
    u.includes("accounts.")
  ) {
    return true;
  }
  const lower = bodyText.toLowerCase();
  return (
    lower.includes("sign in") ||
    lower.includes("log in") ||
    lower.includes("تسجيل الدخول") ||
    lower.includes('name="password"')
  );
}

function isAllowlistedUrl(url: string): boolean {
  return isUrlOnScreenshotAllowlist(url, loadScreenshotAllowlist());
}

/**
 * Authentic screenshot adapter — allowlisted public URLs only (see screenshotAllowlist.json).
 * No auth cookies. Fails on login redirect. Live capture is workflow-owned.
 */
export async function captureScreenshot(
  ctx: AdapterContext,
): Promise<AdapterResult> {
  const spec = ctx.master.screenshotSpec;
  if (!spec) {
    return {
      ok: false,
      error: "screenshot adapter: master.screenshotSpec is null",
    };
  }
  const url = spec.exactUrl || spec.url;
  if (!spec.allowlisted || !isAllowlistedUrl(url)) {
    return {
      ok: false,
      error: `screenshot adapter: URL not allowlisted: ${url}`,
    };
  }
  if (spec.failOnLoginRedirect !== true) {
    return {
      ok: false,
      error: "screenshot adapter: failOnLoginRedirect must be true",
    };
  }

  if (ctx.fixtureMode) {
    return {
      ok: false,
      error:
        "screenshot adapter: fixtureMode refuses live capture (use deterministic fixture)",
    };
  }

  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      Accept: "text/html,application/xhtml+xml",
    },
  });

  const finalUrl = res.url;
  const bodyText = await res.text();
  if (looksLikeLoginRedirect(finalUrl, bodyText)) {
    return {
      ok: false,
      error: `screenshot adapter: login redirect detected (${finalUrl})`,
    };
  }
  if (!res.ok) {
    return {
      ok: false,
      error: `screenshot adapter: HTTP ${res.status} for ${url}`,
    };
  }

  return {
    ok: false,
    error:
      "screenshot adapter: live capture disabled in library path (workflow-owned)",
  };
}

export { isAllowlistedUrl, looksLikeLoginRedirect, isUrlOnScreenshotAllowlist };
