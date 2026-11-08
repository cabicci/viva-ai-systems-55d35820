import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { COURSE_AREAS } from "../contract";

export type CoursePasswordResult = "unlocked" | "wrong" | "limited" | "not_locked" | "unavailable";

export const unlockCoursePassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        area: z.enum(COURSE_AREAS),
        course: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9-]{0,79}$/),
        password: z.string().min(1).max(200),
      })
      .strict()
      .parse(input),
  )
  .handler(async ({ data, context }): Promise<{ status: CoursePasswordResult }> => {
    const { coursePasswordSecret, coursePasswordMatches } =
      await import("./course-password.server");
    const secretName = coursePasswordSecret(data.area, data.course);
    if (!secretName) return { status: "not_locked" };
    const expected = process.env[secretName];
    if (!expected) return { status: "unavailable" };
    const ok = coursePasswordMatches(data.password, expected);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const r = await supabaseAdmin.rpc("curriculum_password_attempt", {
      p_user: context.userId,
      p_area: data.area,
      p_course: data.course,
      p_ok: ok,
    });
    if (r.error) throw new Error("COURSE_PASSWORD_FAILED");
    const status = r.data as CoursePasswordResult;
    return { status: status === "not_locked" ? "unavailable" : status };
  });
