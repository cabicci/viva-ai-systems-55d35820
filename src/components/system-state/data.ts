import type { Status } from "./types";

export const ROUTES: {
  path: string;
  title: string;
  purpose: string;
  status: Status;
}[] = [
  { path: "/", title: "Landing — Hero & Ecosystem", purpose: "نقطة الدخول السينمائية للـ Ecosystem.", status: "live" },
  { path: "/login", title: "تسجيل الدخول", purpose: "Auth — Email/Password عبر Lovable Cloud.", status: "live" },
  { path: "/signup", title: "إنشاء حساب", purpose: "Auth — Sign up جديد.", status: "live" },
  { path: "/onboarding", title: "Onboarding", purpose: "تجهيز المتعلم قبل الدخول للوحة.", status: "live" },
  { path: "/dashboard", title: "لوحة المتعلم", purpose: "نقطة الانطلاق الشخصية بعد الدخول.", status: "live" },
  { path: "/curriculum", title: "خريطة المنهج", purpose: "كل المسارات والوحدات والدروس وحالة التقدم.", status: "live" },
  { path: "/paths/builder", title: "Builder Path", purpose: "نظرة عامة على مسار Builder.", status: "live" },
  { path: "/lessons/$lessonId", title: "Lesson Engine", purpose: "محرك عرض الدرس باستخدام بيانات `lessons-data.ts`.", status: "live" },
  { path: "/operational-layers", title: "Operational Layers", purpose: "خريطة الطبقات التشغيلية للمنصة (Internal).", status: "live" },
  { path: "/behavior-architecture", title: "Behavior Architecture", purpose: "خريطة سلوك المنصة كـ AI-Native Ecosystem (Internal).", status: "live" },
  { path: "/system-state", title: "System State", purpose: "هذه الصفحة — Snapshot داخلي للمنصة (Internal).", status: "live" },
  { path: "/assistant-runtime", title: "Assistant Runtime", purpose: "Internal shell — يربط Context + Retrieval قبل توصيل أي AI خارجي.", status: "live" },
];

export const GAPS = [
  { title: "AI Runtime Layer غير موجود", body: "كل ما يخص AI داخل المنصة تعليمي فقط — مفيش assistant أو RAG أو agents مفعّلين فعلًا." },
  { title: "Context Tracking مفقود", body: "المنصة لا تعرف أين المتعلم لحظيًا أو ما هي مهمته الحالية بشكل runtime-aware." },
  { title: "Sequential Unlocks غير مفعّلة", body: "isUnlocked() ترجع true دائمًا — لا يوجد gating تدريجي بين الدروس." },
  { title: "باقي المسارات coming-soon", body: "Creator / Automator / Analyst / Business مفيهاش دروس منشورة بعد." },
  { title: "Module 03 ناقص درس", body: "درس Human in the Loop معرّف في curriculum لكنه لسه coming-soon." },
  { title: "Module 04 (Real Build) كامل coming-soon", body: "كل دروس البناء الفعلي لسه placeholders." },
  { title: "Mission Tracking مستقل غير موجود", body: "إكمال المهمة مرتبط بإكمال الدرس فقط، لا يوجد سجل مهام منفصل." },
  { title: "Video Layer غير منفّذ", body: "مفيش video player أو ربط فيديوهات بالدروس داخل LessonEngine." },
  { title: "Build Logs Layer غير منفّذ", body: "لا يوجد سجل بناء عام داخل المنصة (مذكور كطبقة معمارية فقط)." },
  { title: "Workflow / Automation غير مفعّلة", body: "مفيش edge functions أو cron أو automations تعمل فعليًا." },
];