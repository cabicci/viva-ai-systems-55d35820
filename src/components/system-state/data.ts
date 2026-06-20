import type { Status } from "./types";

export const ROUTES: {
  path: string;
  title: string;
  purpose: string;
  status: Status;
}[] = [
  { path: "/", title: "Landing — Hero & Paths", purpose: "نقطة الدخول السينمائية لمسارات (masaarat.ai).", status: "live" },
  { path: "/login", title: "تسجيل الدخول", purpose: "Auth — Email/Password عبر Lovable Cloud.", status: "live" },
  { path: "/signup", title: "إنشاء حساب", purpose: "Auth — Sign up جديد.", status: "live" },
  { path: "/onboarding", title: "Onboarding (legacy)", purpose: "Legacy redirect — anonymous → /login, signed-in → /dashboard.", status: "partial" },
  { path: "/dashboard", title: "لوحة المتعلم", purpose: "نقطة الانطلاق الشخصية بعد الدخول.", status: "live" },
  { path: "/curriculum", title: "خريطة المنهج", purpose: "كل المسارات الخمسة (Builder · Creator · Automator · Analyst · Business) والوحدات والدروس وحالة التقدّم.", status: "live" },
  { path: "/learn/$pathId/$lessonId", title: "Lesson Viewer", purpose: "عرض الدرس عبر IntroLessonRenderer — المحتوى من unified-lessons + INTRO_LESSON_CONTENT.", status: "live" },
  { path: "/ai-assistant", title: "مساعد المنصة", purpose: "Assistant runtime للمتعلم — Context + Retrieval + Edge Function.", status: "live" },
  { path: "/system-state", title: "System State", purpose: "هذه الصفحة — Snapshot داخلي للمنصة (Internal).", status: "live" },
  { path: "/assistant-runtime", title: "Assistant Runtime", purpose: "Admin diagnostics — حالة Assistant Runtime والتحقق من Context + Retrieval + Edge Function.", status: "live" },
];

export const GAPS = [
  { title: "Sequential Unlocks غير مفعّلة", body: "isUnlocked() ترجع true دائمًا — لا يوجد gating تدريجي بين الدروس." },
  { title: "Path integration map deferred", body: "الـ 5 مسارات (Builder · Creator · Automator · Analyst · Business) live — visual journey map بين المسارات مؤجل لإشعار آخر." },
  { title: "Mission persistence", body: "Mission Runtime Foundation موجود — تتبّع إكمال المهام المستقل وحفظه في DB ما زال جزئيًا. راجع Mission Runtime Panel." },
  { title: "Build Logs visibility", body: "صفحة /build-logs admin-only — قرار التوسّع للمتعلم: admin/internal — needs operational decision." },
  { title: "Workflow / Automation scope", body: "Edge functions موجودة (assistant-runtime وغيرها) — نطاق الأتمتة الكامل: admin/internal — needs operational decision." },
  { title: "Multimodal / Agent runtime", body: "Assistant + RAG منفّذان — vision pipeline و agent tool-use ما زالا خارج النطاق الحالي." },
];
