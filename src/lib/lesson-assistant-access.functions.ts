import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Advisory UI decision only; the existing runtime still verifies and reserves every question. */
export const getLessonAssistantAccess = createServerFn({ method: "GET" })
  .inputValidator(z.object({
    pathId: z.string().regex(/^[a-z0-9-]{1,80}$/),
    lessonId: z.string().regex(/^[a-z0-9-]{1,160}$/),
  }))
  .handler(async ({ data }) => {
    const { readLessonAssistantAccess } = await import("./lesson-assistant-access.server");
    return readLessonAssistantAccess(data);
  });
