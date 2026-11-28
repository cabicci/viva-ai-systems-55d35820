import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { COURSE_AREAS } from "../contract";
import { hasSubmittedInitialDecision, initialDecisionForUpdate } from "./management-case-update";
import type { AssistantReply } from "@/lib/card-assistant/types";
import {
  curriculumJourneyInput,
  curriculumJourneyResult,
  curriculumPositionInput,
  curriculumPositionResult,
} from "./client";

export const readCurriculumJourney = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => curriculumJourneyInput.parse(input))
  .handler(async ({ data, context }) => {
    if (data.expectedAccountId !== context.userId) throw new Error("CURRICULUM_ACCOUNT_CHANGED");
    const { expectedAccountId: _actor, ...p_data } = data;
    const r = await context.supabase.rpc(
      "curriculum_command" as never,
      { p_action: "journey", p_data } as never,
    );
    if (r.error) throw new Error(r.error.message);
    const result = curriculumJourneyResult.parse(r.data);
    if (
      result.area !== data.area ||
      result.course !== data.course ||
      result.locale !== data.locale ||
      result.activeVersion !== data.version ||
      result.profileId !== (data.profileId ?? null)
    )
      throw new Error("CURRICULUM_CONTENT_CHANGED");
    return result;
  });

export const curriculumPosition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => curriculumPositionInput.parse(input))
  .handler(async ({ data, context }) => {
    if (data.expectedAccountId !== context.userId) throw new Error("CURRICULUM_ACCOUNT_CHANGED");
    const { expectedAccountId: _actor, action: p_action, ...p_data } = data;
    const r = await context.supabase.rpc(
      "learning_command" as never,
      { p_action, p_data } as never,
    );
    if (r.error) throw new Error(r.error.message);
    const result = curriculumPositionResult.parse(r.data);
    if ("contentVersion" in result && result.contentVersion !== data.contentVersion)
      throw new Error("CURRICULUM_CONTENT_CHANGED");
    return result;
  });

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
    const initialLesson = initialDecisionForUpdate(data);
    if (initialLesson) {
      const initial = await context.supabase.rpc(
        "curriculum_command" as never,
        {
          p_action: "lesson",
          p_data: {
            area: data.area,
            course: data.course,
            lesson: initialLesson,
            locale: data.locale,
            ...(data.profileId ? { profileId: data.profileId } : {}),
          },
        } as never,
      );
      if (initial.error || !hasSubmittedInitialDecision(initial.data, data.version)) {
        throw new Error("CURRICULUM_INITIAL_SUBMISSION_REQUIRED");
      }
    }
    if (!asset.storage) throw new Error("CURRICULUM_ASSET_UNAVAILABLE");
    if (data.area === "academic" && data.course === "AC-MGT-INV" && asset.id === "shubbak-update") {
      if (data.lesson !== "AC-MGT-INV-L39" || !data.version)
        throw new Error("CURRICULUM_INITIAL_SUBMISSION_REQUIRED");
      const history = await context.supabase.rpc("curriculum_command" as never, {
        p_action: "lesson",
        p_data: { area: data.area, course: data.course, lesson: data.lesson,
          locale: data.locale, profileId: data.profileId },
      } as never);
      const { canReleaseInvestmentUpdate } = await import("./investment-update.server");
      if (history.error || !canReleaseInvestmentUpdate(history.data, data.version))
        throw new Error("CURRICULUM_INITIAL_SUBMISSION_REQUIRED");
    }
    await (await import("./assets.server")).verifyPrivateCourseAssets([asset]);
    if (JSON.stringify(await read()) !== JSON.stringify(asset))
      throw new Error("CURRICULUM_ASSET_CHANGED");
    const signed = await supabaseAdmin.storage
      .from(asset.storage.bucket)
      .createSignedUrl(asset.storage.path, 60);
    if (signed.error || !signed.data?.signedUrl) throw new Error("CURRICULUM_ASSET_UNAVAILABLE");
    return { url: signed.data.signedUrl };
  });

export const uploadCurriculumAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: FormData) => {
    if (!(input instanceof FormData)) throw new Error("CURRICULUM_ASSET_UNAVAILABLE");
    return input;
  })
  .handler(async ({ data, context }) => {
    if (data.get("account") !== context.userId) throw new Error("CURRICULUM_ACCOUNT_CHANGED");
    const role = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (role.error || role.data !== true) throw new Error("CURRICULUM_ADMIN_REQUIRED");
    const file = data.get("file");
    if (!(file instanceof Blob) || !file.size || file.size > 10_485_760)
      throw new Error("CURRICULUM_ASSET_UNAVAILABLE");
    const id = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9-]{0,79}$/);
    const args = {
      p_user: context.userId,
      p_area: z.enum(COURSE_AREAS).parse(data.get("area")),
      p_course: id.parse(data.get("course")),
      p_lesson: id.parse(data.get("lesson")),
      p_locale: z.enum(["ar-EG", "ar-MSA", "ar-Gulf", "en"]).parse(data.get("locale")),
      p_child: null,
      p_asset: id.parse(data.get("asset")),
      p_version: z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .parse(data.get("version")),
    };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const result = await supabaseAdmin.rpc("curriculum_asset_source", args as never);
    if (result.error) throw new Error("CURRICULUM_ASSET_UNAVAILABLE");
    const asset = z
      .object({
        id,
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
        storage: z.object({
          bucket: z.enum(["academic-downloads", "technical-downloads"]),
          path: z.string().min(1),
        }),
      })
      .parse(result.data);
    const { storeReviewedCourseAsset } = await import("./assets.server");
    return storeReviewedCourseAsset(asset, file);
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
    if (data.action !== "list" || !Array.isArray(r.data)) return r.data;
    // Admin verified above: read-only enrichment with sanitized preparation state.
    const { preparationStatus, aiPreparationStatus, matchCurriculumJob } =
      await import("./preparation");
    type ListEntry = {
      area: string;
      id: string;
      versions: { version: string; state: "draft" | "approved" | "ready" }[];
    };
    const entries = r.data as ListEntry[];
    const keys = entries.filter((e) => e.area !== "ai").map((e) => `${e.id}:intake`);
    // AI curricula have no source events (0034 excludes area "ai"); read only their exact curriculum-adapter jobs.
    const aiIds = entries.filter((e) => e.area === "ai").map((e) => e.id);
    const aiJobs = aiIds.length
      ? await supabaseAdmin
          .from("assistant_auto_jobs" as never)
          .select(
            "job_id,area,card_id,state,next_offset,scope_count,error_code,created_at,adapter:manifest->>adapter,curriculum_version:manifest->>curriculumVersion",
          )
          .eq("area", "ai")
          .in("card_id", aiIds)
          .eq("manifest->>adapter", "curriculum")
      : { data: [], error: null };
    if (aiJobs.error) throw new Error("CURRICULUM_PREPARATION_UNAVAILABLE");
    const aiJobRows = (aiJobs.data ?? []) as unknown as Parameters<typeof matchCurriculumJob>[0];
    const events = keys.length
      ? await supabaseAdmin
          .from("assistant_auto_source_events" as never)
          .select("area,source_key,source_sha,withdrawn,job_id,event_id")
          .in("source_key", keys)
          .order("event_id", { ascending: false })
      : { data: [], error: null };
    if (events.error) throw new Error("CURRICULUM_PREPARATION_UNAVAILABLE");
    const rows = (events.data ?? []) as unknown as {
      area: string;
      source_key: string;
      source_sha: string | null;
      withdrawn: boolean;
      job_id: string | null;
    }[];
    const jobIds = [...new Set(rows.map((e) => e.job_id).filter((x): x is string => !!x))];
    const jobs = jobIds.length
      ? await supabaseAdmin
          .from("assistant_auto_jobs" as never)
          .select("job_id,state,next_offset,scope_count,error_code")
          .in("job_id", jobIds)
      : { data: [], error: null };
    if (jobs.error) throw new Error("CURRICULUM_PREPARATION_UNAVAILABLE");
    const jobMap = new Map(
      (
        (jobs.data ?? []) as unknown as {
          job_id: string;
          state: "queued" | "running" | "complete" | "held";
          next_offset: number;
          scope_count: number;
          error_code: string | null;
        }[]
      ).map((j) => [j.job_id, j]),
    );
    return entries.map((e) => ({
      ...e,
      versions: e.versions.map((v) => {
        if (e.area === "ai")
          return {
            ...v,
            preparation: aiPreparationStatus(
              v.state,
              v.version,
              matchCurriculumJob(aiJobRows, e.area, e.id, v.version),
            ),
          };
        const event =
          rows.find(
            (x) =>
              x.area === e.area && x.source_key === `${e.id}:intake` && x.source_sha === v.version,
          ) ?? null;
        return {
          ...v,
          preparation: preparationStatus(
            v.state,
            v.version,
            event,
            event?.job_id ? (jobMap.get(event.job_id) ?? null) : null,
          ),
        };
      }),
    }));
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
