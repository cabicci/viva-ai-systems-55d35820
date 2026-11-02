import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { COURSE_AREAS } from "../contract";
import type { AssistantReply } from "@/lib/card-assistant/types";

export const curriculumAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        expectedAccountId: z.string().uuid(),
        area: z.enum(COURSE_AREAS),
        course: z.string().min(1).max(80),
        lesson: z.string().min(1).max(80),
        locale: z.enum(["ar-EG", "ar-MSA", "ar-Gulf", "en"]),
        profileId: z.string().uuid().optional(),
        asset: z.string().min(1).max(80),
        version: z
          .string()
          .regex(/^[a-f0-9]{64}$/)
          .optional(),
      })
      .strict()
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (data.expectedAccountId !== context.userId) throw new Error("CURRICULUM_ACCOUNT_CHANGED");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const args = {
      p_user: context.userId,
      p_area: data.area,
      p_course: data.course,
      p_lesson: data.lesson,
      p_locale: data.locale,
      p_child: data.profileId ?? null,
      p_asset: data.asset,
      p_version: data.version ?? null,
    };
    const read = async () => {
      const r = await supabaseAdmin.rpc("curriculum_asset_source" as never, args as never);
      if (r.error) throw new Error("CURRICULUM_ASSET_UNAVAILABLE");
      return r.data as unknown as import("./assets.server").PrivateCourseAsset;
    };
    const asset = await read();
    if (!asset.storage) throw new Error("CURRICULUM_ASSET_UNAVAILABLE");
    await (await import("./assets.server")).verifyPrivateCourseAssets([asset]);
    if (JSON.stringify(await read()) !== JSON.stringify(asset))
      throw new Error("CURRICULUM_ASSET_CHANGED");
    const signed = await supabaseAdmin.storage
      .from(asset.storage.bucket)
      .createSignedUrl(asset.storage.path, 60);
    if (signed.error || !signed.data?.signedUrl) throw new Error("CURRICULUM_ASSET_UNAVAILABLE");
    return { url: signed.data.signedUrl };
  });

export const curriculumAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .discriminatedUnion("action", [
        z.object({ action: z.literal("stage"), raw: z.string().min(2).max(8_000_000) }).strict(),
        z.object({ action: z.literal("list") }).strict(),
        z
          .object({
            action: z.enum(["review", "approve"]),
            area: z.enum(COURSE_AREAS),
            course: z.string().min(1).max(80),
            version: z.string().regex(/^[a-f0-9]{64}$/),
            reviewed: z.boolean().optional(),
            expectedActive: z.string().nullable().optional(),
          })
          .strict(),
      ])
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (role.error || role.data !== true) throw new Error("CURRICULUM_ADMIN_REQUIRED");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const p_data =
      data.action === "stage"
        ? { prepared: await (await import("./prepare.server")).prepareIntake(data.raw) }
        : data;
    const r = await supabaseAdmin.rpc(
      "curriculum_admin" as never,
      { p_user: context.userId, p_action: data.action, p_data } as never,
    );
    if (r.error) throw new Error(r.error.message);
    return r.data;
  });

export const askCurriculumAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        expectedAccountId: z.string().uuid(),
        area: z.enum(COURSE_AREAS),
        course: z.string().min(1).max(80),
        lesson: z.string().min(1).max(80),
        locale: z.enum(["ar-EG", "ar-MSA", "ar-Gulf", "en"]),
        profileId: z.string().uuid().optional(),
        query: z.string().trim().min(1).max(2000),
        requestId: z.string().uuid(),
        history: z
          .array(
            z.object({ question: z.string().max(2000), answer: z.string().max(12000) }).strict(),
          )
          .max(6)
          .optional(),
      })
      .strict()
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (data.expectedAccountId !== context.userId) throw new Error("CURRICULUM_ACCOUNT_CHANGED");
    const { askCurriculum } = await import("./assistant.server");
    const result = await askCurriculum({
      ...data,
      userId: context.userId,
      childId: data.profileId ?? null,
    });
    return { ...result.body, status: result.status } as AssistantReply;
  });
