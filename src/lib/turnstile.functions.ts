import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const verifyTurnstile = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ token: z.string().min(1).max(2048) }).parse(input))
  .handler(async ({ data }) => {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      console.error("TURNSTILE_SECRET_KEY missing");
      return { success: false, error: "captcha_misconfigured" as const };
    }

    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", data.token);

    try {
      const res = await fetch(TURNSTILE_VERIFY_URL, { method: "POST", body });
      const json = (await res.json()) as { success: boolean; "error-codes"?: string[] };
      if (!json.success) {
        return { success: false, error: (json["error-codes"]?.[0] ?? "verification_failed") as string };
      }
      return { success: true as const };
    } catch (err) {
      console.error("Turnstile verify failed:", err);
      return { success: false, error: "network_error" as const };
    }
  });