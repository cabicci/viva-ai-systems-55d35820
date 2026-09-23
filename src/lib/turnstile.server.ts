const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileVerification = { success: true } | { success: false; error: string };

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
): Promise<TurnstileVerification> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY missing");
    return { success: false, error: "captcha_misconfigured" };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(10_000),
    });
    const payload = (await response.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };
    if (!payload.success) {
      return {
        success: false,
        error: payload["error-codes"]?.[0] ?? "verification_failed",
      };
    }
    return { success: true };
  } catch (error) {
    console.error("Turnstile verify failed:", error);
    return { success: false, error: "network_error" };
  }
}
