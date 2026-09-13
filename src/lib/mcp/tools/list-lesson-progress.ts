import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const statusSchema = z.enum(["not-started", "in-progress", "completed"]);

export default defineTool({
  name: "list_lesson_progress",
  title: "عرض تقدّم الدروس",
  description: "يعرض حالات الدروس المسجلة للمستخدم الذي وافق على الاتصال.",
  inputSchema: {
    status: statusSchema.optional().describe("حالة اختيارية لتصفية النتائج."),
  },
  outputSchema: {
    items: z.array(
      z.object({
        lessonId: z.string(),
        status: statusSchema,
        updatedAt: z.string(),
      }),
    ),
    count: z.number().int().nonnegative(),
  },
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: async ({ status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return {
        content: [{ type: "text", text: "يجب تسجيل الدخول أولاً." }],
        isError: true,
      };
    }

    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("lesson_progress")
      .select("lesson_id,status,updated_at")
      .order("updated_at", { ascending: false });
    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) {
      return {
        content: [{ type: "text", text: "تعذّر تحميل تقدّم الدروس." }],
        isError: true,
      };
    }

    const items = (data ?? []).map((row) => ({
      lessonId: row.lesson_id,
      status: row.status,
      updatedAt: row.updated_at,
    }));
    const result = { items, count: items.length };
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    };
  },
});