import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const statusSchema = z.enum(["not-started", "in-progress", "completed"]);

export default defineTool({
  name: "update_lesson_progress",
  title: "تحديث تقدّم درس",
  description: "يحدّث حالة درس للمستخدم الذي وافق على الاتصال.",
  inputSchema: {
    lessonId: z.string().trim().min(1).max(180).describe("المعرّف الكامل للدرس."),
    status: statusSchema.describe("الحالة الجديدة للدرس."),
  },
  outputSchema: {
    lessonId: z.string(),
    status: statusSchema,
    updatedAt: z.string(),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: async ({ lessonId, status }, ctx) => {
    const userId = ctx.getUserId();
    if (!ctx.isAuthenticated() || !userId) {
      return {
        content: [{ type: "text", text: "يجب تسجيل الدخول أولاً." }],
        isError: true,
      };
    }

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("lesson_progress")
      .upsert(
        { user_id: userId, lesson_id: lessonId, status },
        { onConflict: "user_id,lesson_id" },
      )
      .select("lesson_id,status,updated_at")
      .single();

    if (error || !data) {
      return {
        content: [{ type: "text", text: "تعذّر تحديث حالة الدرس." }],
        isError: true,
      };
    }

    const result = {
      lessonId: data.lesson_id,
      status: data.status,
      updatedAt: data.updated_at,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  },
});