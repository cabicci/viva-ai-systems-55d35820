import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listLessonProgress from "./tools/list-lesson-progress";
import updateLessonProgress from "./tools/update-lesson-progress";

const projectRef =
  import.meta.env["VITE_SUPABASE_PROJECT_ID"] ?? "project-ref-unset";

export default defineMcp({
  name: "remix-of-ai-canvas",
  title: "Remix of AI Canvas",
  version: "0.1.0",
  instructions:
    "أدوات مسارات لعرض تقدّم المستخدم في الدروس وتحديث حالة درس بعد موافقته.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listLessonProgress, updateLessonProgress],
});