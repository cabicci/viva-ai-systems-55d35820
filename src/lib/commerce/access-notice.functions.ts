import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const input = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("preferences"),
    data: z.object({ opted_in: z.boolean().optional() }).strict(),
  }),
  z.object({
    action: z.literal("status"),
    data: z.object({ source_id: z.string().uuid() }).strict(),
  }),
  z.object({
    action: z.literal("queue_public_coupon"),
    data: z.object({ id: z.string().uuid() }).strict(),
  }),
]);

export const accessNoticeCommand = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => input.parse(data))
  .handler(async ({ data, context }) => {
    const result = await context.supabase.rpc(
      "access_notice_control" as never,
      {
        p_action: data.action,
        p_data: data.data,
      } as never,
    );
    if (result.error) throw new Error(result.error.message);
    return result.data;
  });
