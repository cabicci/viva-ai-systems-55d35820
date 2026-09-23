import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { verifyTurnstileToken } from "./turnstile.server";

export const verifyTurnstile = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ token: z.string().min(1).max(2048) }).parse(input))
  .handler(async ({ data }) => {
    return verifyTurnstileToken(data.token);
  });
