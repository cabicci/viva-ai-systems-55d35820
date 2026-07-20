import {
  SCREENSHOT_ALLOWLIST_HOSTS,
  type AdapterContext,
  type AdapterResult,
} from "../types";

function isAllowlistedUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  return (SCREENSHOT_ALLOWLIST_HOSTS as readonly string[]).includes(
    parsed.hostname.toLowerCase(),
  );
}

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

/**
 * Authentic screenshot adapter — allowlisted Masaarat public URLs only.
 * No auth cookies. Fails on login redirect.
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
  if (!spec.allowlisted || !isAllowlistedUrl(spec.url)) {
    return {
      ok: false,
      error: `screenshot adapter: URL not allowlisted: ${spec.url}`,
    };
  }
  if (spec.failOnLoginRedirect !== true) {
    return {
      ok: false,
      error: "screenshot adapter: failOnLoginRedirect must be true",
    };
  }

  // Local/CI must not capture production pages unless explicitly allowed in workflow.
  // This adapter still enforces domain + login guards for tests.
  if (ctx.fixtureMode) {
    return {
      ok: false,
      error:
        "screenshot adapter: fixtureMode refuses live capture (use deterministic fixture)",
    };
  }

  const res = await fetch(spec.url, {
    redirect: "follow",
    headers: {
      // Explicitly no cookies / auth
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
      error: `screenshot adapter: HTTP ${res.status} for ${spec.url}`,
    };
  }

  return {
    ok: false,
    error:
      "screenshot adapter: live capture disabled in library path (workflow-owned)",
  };
}

export { isAllowlistedUrl, looksLikeLoginRedirect };
