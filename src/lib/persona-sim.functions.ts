import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import v9Suggestions from "@/data/persona-sim/v9-suggestions.json";
import v9AbRaw from "@/data/persona-sim/v9-ab-raw.json";

// GET-only admin readers — no client input expected. Strict empty-object
// validator rejects any payload to harden against accidental misuse.
const EmptyInput = z.object({}).strict().optional();

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error("Authorization check failed");
  if (!data) throw new Error("Forbidden: admin role required");
}

/** Admin-only: v9 block-order suggestions (bundled server-side, not public). */
export const getPersonaSimV9Suggestions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EmptyInput.parse(input ?? {}))
  .handler(async ({ context }) => {
    await assertAdmin(context);
    return v9Suggestions;
  });

/** Admin-only: v9 A/B raw scores (bundled server-side, not public). */
export const getPersonaSimV9AbRaw = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EmptyInput.parse(input ?? {}))
  .handler(async ({ context }) => {
    await assertAdmin(context);
    return v9AbRaw;
  });
