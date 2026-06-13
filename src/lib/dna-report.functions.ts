import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { PATHS, totalLessons, totalAvailableLessons } from "@/lib/curriculum-data";
import { enforceRateLimit } from "./rate-limit.server";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error("Authorization check failed");
  if (!data) throw new Error("Forbidden: admin role required");
}

const DNA_REPORTS_BUCKET = "dna-reports";

function storageConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing backend storage configuration");
  return { url, key };
}

function encodeStoragePath(path: string) {
  return path.split("/").filter(Boolean).map(encodeURIComponent).join("/");
}

type DnaStorageObject = {
  name?: string;
  created_at?: string | null;
  metadata?: { size?: number } | null;
};

async function storageErrorMessage(response: Response) {
  const text = await response.text();
  try {
    const body = JSON.parse(text) as { message?: string; error?: string; msg?: string };
    return body.message ?? body.error ?? body.msg ?? text;
  } catch {
    return text || response.statusText;
  }
}

async function storageFetch(path: string, init: RequestInit = {}) {
  const { url, key } = storageConfig();
  return fetch(`${url}/storage/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(init.headers ?? {}),
    },
  });
}

function safe<T>(label: string, p: PromiseLike<T>): Promise<T | { __error: string }> {
  return Promise.resolve(p).catch((e) => ({ __error: `${label}: ${e?.message ?? String(e)}` }));
}

function truncate(s: string | null | undefined, max = 2000): string {
  if (!s) return "";
  if (s.length <= max) return s;
  return s.slice(0, max) + "…[truncated]";
}

function fmtErr(v: unknown): string {
  if (v && typeof v === "object" && "__error" in (v as any)) {
    return `_(تعذّر جلب البيانات — ${(v as any).__error})_`;
  }
  return "";
}

function rows<T = any>(v: unknown): T[] {
  if (!v || typeof v !== "object") return [];
  if ("__error" in (v as any)) return [];
  const data = (v as any).data;
  return Array.isArray(data) ? (data as T[]) : [];
}

function countOf(v: unknown): number | null {
  if (!v || typeof v !== "object") return null;
  if ("__error" in (v as any)) return null;
  const c = (v as any).count;
  return typeof c === "number" ? c : null;
}

export const generateDnaReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    // Heavy aggregate report — cap per-admin generation rate to protect DB.
    await enforceRateLimit({
      userId: context.userId,
      bucketKey: "dna-report:generate",
      maxCalls: 6,
      windowSeconds: 3600,
    });
    // Use service-role client to bypass RLS for cross-user aggregates.
    // (admin RLS tables like learner_events / mission_submissions return
    //  silently empty under the user client.)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const supabase = supabaseAdmin;
    const now = new Date();
    const stamp = now.toISOString();

    // Cap each aggregate read so a runaway table cannot DoS the DB.
    const ROW_CAP = 5000;

    // ---------- Parallel data collection ----------
    const [
      activeDevicesRes,
      subscriptionsRes,
      lessonProgressRes,
      userLessonStatusRes,
      activityTimeRes,
      streaksRes,
      missionsAggRes,
      learnerEventsRes,
      errorLogsRes,
      knowledgeChunksRes,
      roadmapRes,
      rolesRes,
    ] = await Promise.all([
      safe("user_active_device count", supabase.from("user_active_device").select("user_id", { count: "exact", head: true })),
      safe("user_subscriptions tiers", supabase.from("user_subscriptions").select("tier,status").limit(ROW_CAP)),
      safe("lesson_progress all", supabase.from("lesson_progress").select("user_id,lesson_id,status").limit(ROW_CAP)),
      safe("user_lesson_status all", supabase.from("user_lesson_status").select("user_id,lesson_id,status").limit(ROW_CAP)),
      safe("user_activity_time top", supabase.from("user_activity_time").select("user_id,total_seconds").order("total_seconds", { ascending: false }).limit(10)),
      safe("user_streaks all", supabase.from("user_streaks").select("user_id,current_streak,longest_streak,last_activity_date").limit(ROW_CAP)),
      safe("mission_submissions all", supabase.from("mission_submissions").select("status,score,mission_id,evaluated_at,created_at").limit(ROW_CAP)),
      safe("learner_events all", supabase.from("learner_events").select("event_type,created_at").order("created_at", { ascending: false }).limit(ROW_CAP)),
      safe("client_error_logs recent", supabase.from("client_error_logs").select("scope,message,created_at").gte("created_at", new Date(Date.now() - 7 * 86400_000).toISOString()).order("created_at", { ascending: false }).limit(50)),
      safe("knowledge_chunks count", supabase.from("knowledge_chunks").select("id", { count: "exact", head: true })),
      safe("roadmap_items all", supabase.from("roadmap_items").select("*").order("phase").order("sort_order").limit(1000)),
      safe("user_roles all", supabase.from("user_roles").select("user_id,role").limit(1000)),
    ]);

    // ---------- Compute stats ----------
    const out: string[] = [];
    const push = (s: string) => out.push(s);
    const h1 = (t: string) => push(`\n# ${t}\n`);
    const h2 = (t: string) => push(`\n## ${t}\n`);
    const h3 = (t: string) => push(`\n### ${t}\n`);

    // ===== 1. Executive Summary =====
    h1("DNA Report — Snapshot كامل للمنصة");
    push(`> **Generated:** ${stamp}`);
    push(`> **Purpose:** الملف ده هو DNA المنصة. أي حد يقراه يفهم كل اللي بنبنيه ويقدر يكمل من نفس النقطة من غير ما يرجعلنا.`);
    h2("1. نظرة عامة");
    push(`- **اسم المنصة:** مسارات · masaarat.ai`);
    push(`- **الجمهور:** مبتدئين عرب (لهجة مصرية) عايزين يتعلموا الـ AI من الصفر.`);
    push(`- **الـ Tech Stack:**`);
    push(`  - Frontend/SSR: **TanStack Start v1** + React 19 + Vite 7`);
    push(`  - Backend: **Supabase** (Postgres + Auth + Storage) via **Lovable Cloud**`);
    push(`  - Server logic: **TanStack \`createServerFn\`** (مش Edge Functions)`);
    push(`  - Runtime: **Cloudflare Workers** (workerd, nodejs_compat)`);
    push(`  - Styling: **Tailwind v4** + semantic tokens في \`src/styles.css\``);
    push(`  - AI: **Lovable AI Gateway** (Gemini + GPT models) + ElevenLabs + D-ID + Bunny Stream`);
    push(`- **URLs:**`);
    push(`  - Preview: \`https://id-preview--db3e0659-63cc-4b7e-8985-61692a4adc4a.lovable.app\``);
    push(`  - Published: \`https://ai-ecosystem-hub-72.lovable.app\``);

    // ===== 2. Architecture =====
    h2("2. Architecture Map");
    h3("Routes");
    push("الـ routes تتبع نظام TanStack file-based في `src/routes/`:");
    const ROUTES = [
      ["/", "Landing page"],
      ["/login, /signup, /forgot-password, /reset-password", "Auth"],
      ["/onboarding", "Onboarding بعد signup"],
      ["/dashboard", "لوحة المتعلّم الرئيسية"],
      ["/curriculum", "عرض كل الـ paths والـ modules"],
      ["/learn/$pathId/$lessonId", "صفحة الدرس الواحد (الـ engine الأساسي)"],
      ["/ai-assistant", "محادثة AI"],
      ["/assistant-runtime", "Assistant runtime view"],
      ["/creator/workbook", "Creator workbook"],
      ["/image-gallery, /image-gallery/$path", "معرض الصور"],
      ["/build-logs", "سجلّات الـ builds للمستخدم"],
      ["/system-state, /operational-layers, /behavior-architecture", "Internal dashboards (admin/diagnostics)"],
      ["/account", "إعدادات الحساب + delete-my-account"],
      ["/admin", "لوحة الأدمن — users, stats, content"],
      ["/roadmap, /roadmap/$id", "خريطة الشغل المشتركة (admin only)"],
    ];
    for (const [r, d] of ROUTES) push(`- \`${r}\` — ${d}`);

    h3("Auth flow");
    push(`- Google OAuth عبر **Lovable broker** (\`lovable.auth.signInWithOAuth("google", ...)\`) — مش \`supabase.auth.signInWithOAuth\` مباشرة.`);
    push(`- Email/password متاح كـ fallback.`);
    push(`- الـ protected routes تحت layout \`_authenticated\` — لكن المشروع حاليًا بيستخدم \`AdminGate\` component للـ admin pages.`);
    push(`- **Session Enforcement:** كل user له device واحد نشط عبر function \`claim_active_device\` + جدول \`user_active_device\`. لو دخل من device تاني، القديم يطلع.`);
    push(`- **Roles:** نظام \`user_roles\` منفصل + function \`has_role(user_id, role)\` SECURITY DEFINER — مش بنخزن الـ role في profile علشان نتفادى privilege escalation.`);

    h3("Data flow");
    push("```");
    push("Component → useServerFn(fn) → createServerFn (server) → Supabase");
    push("                                    ↓");
    push("                  middleware: requireSupabaseAuth (bearer attached client-side)");
    push("                                    ↓");
    push("                  RLS policies enforce per-user access");
    push("```");
    push(`- الـ \`attachSupabaseAuth\` middleware في \`src/start.ts\` بيركّب الـ Bearer header تلقائيًا على كل server-fn call.`);
    push(`- للـ admin operations اللي محتاجة bypass RLS بنستخدم \`supabaseAdmin\` من \`@/integrations/supabase/client.server\` (server-only).`);

    // ===== 3. Content DNA =====
    h2("3. Content DNA — المحتوى التعليمي كامل");
    push(`**إجمالي الـ paths:** ${PATHS.length} | **إجمالي الـ lessons:** ${totalLessons()} | **منشور (available):** ${totalAvailableLessons()}`);
    push(`\n> **Lesson ID convention:** \`{pathId}-{moduleSlug}-{lessonSlug}\` (مثال: \`automator-m2-l1-systems-view\`). الـ id لوحده بيشفّر path + module + ترتيب — متخترعش رقم درس عام زي "الدرس 22".\n`);

    for (const path of PATHS) {
      h3(`Path: ${path.title} — \`${path.id}\``);
      push(`- **Tagline:** ${path.tagline}`);
      push(`- **Status:** ${path.status} | **Kind:** ${path.kind ?? "path"} | **Route:** ${path.route ?? "—"}`);
      push(`- **Modules:** ${path.modules.length} | **Lessons:** ${path.modules.reduce((s, m) => s + m.lessons.length, 0)}`);
      for (const mod of path.modules) {
        push(`\n**Module ${mod.order}: ${mod.title}** \`${mod.id}\``);
        if (mod.subtitle) push(`  - _${mod.subtitle}_`);
        for (const l of mod.lessons) {
          const state = l.state === "available" ? "✅" : "🔜";
          push(`  - ${state} \`${l.id}\` — ${l.title}${l.route ? `  →  \`${l.route}\`` : ""}`);
        }
      }
    }

    // ===== 4. Database Schema =====
    h2("4. Database Schema (Supabase / Postgres)");
    push(`الجداول الرئيسية (كل واحد عليه RLS مفعّل):`);
    const TABLES: Array<[string, string]> = [
      ["user_roles", "أدوار المستخدمين (app_role enum: admin|moderator|user). يُقرأ عبر `has_role()` SECURITY DEFINER."],
      ["user_subscriptions", "tier (free/paid), status, provider info. read-only للمستخدم."],
      ["user_active_device", "device واحد فقط لكل user. مدارة عبر `claim_active_device()`."],
      ["user_activity_time", "total_seconds مجمعة. تتحدّث عبر `increment_user_activity_time()`."],
      ["user_streaks", "current_streak, longest_streak, last_activity_date. تتحدّث عبر `record_user_activity()`."],
      ["lesson_progress", "حالة الدرس (lesson_status enum). **المصدر الوحيد** للكتابة من الـ client."],
      ["user_lesson_status", "نسخة mirror بـ enum lesson_status_v2. بتتزامن تلقائيًا عبر trigger `sync_lesson_status_mirror` — مفيش client writes."],
      ["lesson_notes", "ملاحظات المستخدم على الدروس."],
      ["lesson_quiz_attempts", "محاولات الـ quizzes (per question)."],
      ["mission_submissions", "draft/submitted/evaluated. score + feedback admin-only (محمي بـ trigger)."],
      ["user_mission_state", "حالة الـ mission للمستخدم (available, locked, completed, …)."],
      ["build_logs", "سجلّ ما ينتجه المستخدم في الـ missions/lessons."],
      ["learner_events", "تتبّع الأحداث: lesson_opened/completed/abandoned/reaction, path_selected, sim_started/ended, assistant_asked/evaluated, mission_submitted, quiz_attempted."],
      ["knowledge_chunks", "RAG vector store (pgvector). يُستعلم عبر `match_knowledge_chunks()`."],
      ["client_error_logs", "أخطاء الـ client (insert مفتوح، select للأدمن)."],
      ["roadmap_items", "البنود في خريطة الشغل (phase A/B/C/D/inbox × status todo/in_progress/done/deferred)."],
    ];
    for (const [t, d] of TABLES) push(`- **\`${t}\`** — ${d}`);

    h3("Database functions (SECURITY DEFINER حيث يلزم)");
    push(`- \`has_role(uid, role)\` — فحص role بدون recursion.`);
    push(`- \`claim_active_device(device_id)\` — فرض جهاز واحد لكل مستخدم.`);
    push(`- \`record_user_activity()\` — تحديث الـ streak.`);
    push(`- \`increment_user_activity_time(seconds)\` — جمع وقت النشاط.`);
    push(`- \`mark_roadmap_done(item_id)\` — admin-only، يحدّث الـ status + completed_at.`);
    push(`- \`delete_my_account_data()\` — مسح كل بيانات المستخدم تحت user-initiated request.`);
    push(`- \`match_knowledge_chunks(...)\` — vector search للـ RAG.`);
    push(`- \`protect_mission_submission_insert/admin_columns()\` — triggers تمنع المستخدم من تعديل score/feedback.`);

    h3("Storage buckets");
    push(`- \`audio-assets\` (public)`);

    h3("Secrets (الأسماء فقط)");
    const SECRETS = [
      "SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_DB_URL", "SUPABASE_JWKS",
      "LOVABLE_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY", "GEMINI_API_KEY_2/3/4",
      "ELEVENLABS_API_KEY", "DID_API_KEY", "BUNNY_STREAM_API_KEY", "BUNNY_STREAM_LIBRARY_ID",
      "EMBEDDING_API_KEY", "GCP_SERVICE_ACCOUNT_JSON", "GH_PAT",
    ];
    push(SECRETS.map((s) => `\`${s}\``).join(", "));

    // ===== 5. Server Functions =====
    h2("5. Server Functions & API Surface");
    push(`كل الـ server-side logic في \`src/lib/*.functions.ts\` (TanStack \`createServerFn\`). أمثلة رئيسية:`);
    push(`- **\`admin.functions.ts\`** — listUsers, getAdminStats, … (محمي بـ has_role check)`);
    push(`- **\`roadmap.functions.ts\`** — list/get/create/update/delete + logCompletedWork + getRoadmapPhaseStats`);
    push(`- **\`mission-ai-evaluation.functions.ts\`** — تقييم الـ mission submissions عبر AI`);
    push(`- **\`error-log.functions.ts\`** — logging أخطاء الـ client`);
    push(`- **\`dna-report.functions.ts\`** — التقرير ده 😉`);
    push(`\n_(لكل serverFn جديد: حافظ على \`.inputValidator(z…).handler(…)\` chain متصل، استخدم \`requireSupabaseAuth\` للمحمي، وارجع DTOs بسيطة)._`);

    // ===== 6. Live Stats =====
    h2("6. Live Platform Stats");

    const subsErr = fmtErr(subscriptionsRes);
    if (subsErr) push(`**Subscriptions:** ${subsErr}`);
    else {
      const subs = rows<{ tier: string; status: string | null }>(subscriptionsRes);
      const byTier: Record<string, number> = {};
      for (const s of subs) byTier[s.tier] = (byTier[s.tier] ?? 0) + 1;
      push(`- **إجمالي السجلات في user_subscriptions:** ${subs.length}`);
      for (const [tier, n] of Object.entries(byTier)) push(`  - \`${tier}\`: ${n}`);
    }

    const devCount = countOf(activeDevicesRes);
    if (devCount !== null) push(`- **مستخدمون عندهم device نشط:** ${devCount}`);

    const rolesErr = fmtErr(rolesRes);
    if (!rolesErr) {
      const roles = rows<{ user_id: string; role: string }>(rolesRes);
      const byRole: Record<string, number> = {};
      for (const r of roles) byRole[r.role] = (byRole[r.role] ?? 0) + 1;
      push(`- **User roles:** ${Object.entries(byRole).map(([r, n]) => `${r}=${n}`).join(", ") || "—"}`);
    }

    const lpErr = fmtErr(lessonProgressRes);
    if (!lpErr) {
      const lp = rows<{ user_id: string; lesson_id: string; status: string }>(lessonProgressRes);
      const completed = lp.filter((r) => r.status === "completed").length;
      const usersWithProgress = new Set(lp.map((r) => r.user_id)).size;
      push(`- **lesson_progress:** ${lp.length} سجل، منهم ${completed} completed. مستخدمون عندهم progress: ${usersWithProgress}`);
    }

    const ulsErr = fmtErr(userLessonStatusRes);
    if (!ulsErr) {
      const uls = rows<{ status: string }>(userLessonStatusRes);
      const byStatus: Record<string, number> = {};
      for (const r of uls) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      push(`- **user_lesson_status:** ${uls.length} سجل — ${Object.entries(byStatus).map(([s, n]) => `${s}=${n}`).join(", ")}`);
    }

    const stkErr = fmtErr(streaksRes);
    if (!stkErr) {
      const stk = rows<{ current_streak: number; longest_streak: number }>(streaksRes);
      const avgCur = stk.length ? (stk.reduce((s, r) => s + r.current_streak, 0) / stk.length).toFixed(2) : "0";
      const maxLong = stk.length ? Math.max(...stk.map((r) => r.longest_streak)) : 0;
      push(`- **Streaks:** ${stk.length} مستخدم، متوسط current_streak=${avgCur}، أعلى longest_streak=${maxLong}`);
    }

    const atErr = fmtErr(activityTimeRes);
    if (!atErr) {
      const at = rows<{ user_id: string; total_seconds: number }>(activityTimeRes);
      push(`- **Top 10 users by activity time:**`);
      for (const r of at) push(`  - \`${r.user_id.slice(0, 8)}…\` — ${(r.total_seconds / 60).toFixed(1)} دقيقة`);
    }

    const msErr = fmtErr(missionsAggRes);
    if (!msErr) {
      const ms = rows<{ status: string; score: number | null; evaluated_at: string | null }>(missionsAggRes);
      const byStatus: Record<string, number> = {};
      for (const r of ms) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
      const scored = ms.filter((r) => typeof r.score === "number");
      const avg = scored.length ? (scored.reduce((s, r) => s + (r.score ?? 0), 0) / scored.length).toFixed(2) : "—";
      push(`- **Mission submissions:** ${ms.length} إجمالي — ${Object.entries(byStatus).map(([s, n]) => `${s}=${n}`).join(", ")}`);
      push(`  - متوسط الدرجة (للمقيّم): ${avg}`);
      push(`  - submissions في حالة \`submitted\` ومستنية تقييم: ${byStatus.submitted ?? 0}`);
    }

    const leErr = fmtErr(learnerEventsRes);
    if (!leErr) {
      const le = rows<{ event_type: string }>(learnerEventsRes);
      if (le.length === 0) push(`- **learner_events:** مفيش أحداث في النافذة المطلوبة.`);
      else {
        const byType: Record<string, number> = {};
        for (const e of le) byType[e.event_type] = (byType[e.event_type] ?? 0) + 1;
        push(`- **learner_events:** ${le.length} إجمالي — ${Object.entries(byType).map(([t, n]) => `${t}=${n}`).join(", ")}`);
      }
    }

    const kcCount = countOf(knowledgeChunksRes);
    if (kcCount !== null) push(`- **knowledge_chunks (RAG vectors):** ${kcCount}`);

    const errErr = fmtErr(errorLogsRes);
    if (!errErr) {
      const errs = rows<{ scope: string; message: string; created_at: string }>(errorLogsRes);
      push(`- **client_error_logs آخر 7 أيام:** ${errs.length}`);
      if (errs.length > 0) {
        const byScope: Record<string, number> = {};
        for (const e of errs) byScope[e.scope] = (byScope[e.scope] ?? 0) + 1;
        push(`  - بالـ scope: ${Object.entries(byScope).map(([s, n]) => `${s}=${n}`).join(", ")}`);
        push(`  - آخر 5 رسائل:`);
        for (const e of errs.slice(0, 5)) push(`    - [${e.scope}] ${truncate(e.message, 200)}`);
      }
    }

    // ===== 7. Roadmap State =====
    h2("7. Roadmap State (شامل)");
    const rmErr = fmtErr(roadmapRes);
    if (rmErr) push(rmErr);
    else {
      const items = rows<{
        id: string;
        title: string;
        description: string | null;
        notes: string | null;
        phase: string;
        status: string;
        sort_order: number;
        completed_at: string | null;
        created_at: string;
      }>(roadmapRes);
      const byPhase: Record<string, typeof items> = { A: [], B: [], C: [], D: [], inbox: [] };
      for (const it of items) (byPhase[it.phase] ??= []).push(it);
      const labels: Record<string, string> = {
        A: "Phase A — Mission System Core",
        B: "Phase B — ملء الـ Missions الباقية",
        C: "Phase C — Future / أفكار",
        D: "Phase D — مؤجل بعد الـ beta",
        inbox: "Inbox",
      };
      const statusIcon: Record<string, string> = {
        done: "✅", in_progress: "🔄", todo: "⏳", deferred: "⏸️",
      };
      for (const ph of ["A", "B", "C", "D", "inbox"]) {
        const list = byPhase[ph] ?? [];
        if (!list.length) continue;
        const done = list.filter((i) => i.status === "done").length;
        h3(`${labels[ph]} (${done}/${list.length})`);
        for (const it of list) {
          push(`#### ${statusIcon[it.status] ?? "•"} ${it.title}`);
          push(`- **id:** \`${it.id}\` | **status:** ${it.status}${it.completed_at ? ` | **completed:** ${it.completed_at.slice(0, 10)}` : ""}`);
          if (it.description) push(`- **Description:** ${it.description}`);
          if (it.notes) push(`- **Notes:**\n\n  > ${it.notes.replace(/\n/g, "\n  > ")}`);
        }
      }
    }

    // ===== 8. Conventions =====
    h2("8. Conventions & Rules");
    push(`- **Lesson ID:** \`{pathId}-{moduleSlug}-{lessonSlug}\``);
    push(`- **Design tokens:** ممنوع تكتب لون مباشر زي \`text-white\` أو \`bg-black\`. استخدم semantic tokens من \`src/styles.css\` (\`bg-background\`, \`text-foreground\`, \`bg-primary\`, …).`);
    push(`- **اللغة:** Egyptian Arabic — راجع \`mem://design/egyptian-arabic-prompt-rules\` لقواعد الـ TTS والكلمات الممنوعة.`);
    push(`- **Paths lineup (dashboard order):** Business → Creator → Analyst → Automator → Builder — كلهم مكتملين ومنشورين. متقولش "coming soon" على أي واحد فيهم.`);
    push(`- **Path integration / visual journey map:** مؤجل لحد إشعار آخر.`);
    push(`- **Server functions:** \`createServerFn\` + \`requireSupabaseAuth\` للمحمي. عمرك ما تستخدم Supabase Edge Functions لـ app-internal logic.`);
    push(`- **Auth:** Google عبر Lovable broker، مش raw \`supabase.auth.signInWithOAuth("google")\`.`);

    // ===== 9. Next-up Investments =====
    h2("9. Next-up Investments");
    push(`الـ Phase A debts (Admin Stats RPC, Pagination, learner_events) كلهم اتقفلوا. الـ debts/investments الجاية اتسجّلت كبنود في الـ roadmap — راجع القسم 7 أعلاه للقايمة الكاملة بحالتها الحالية.`);

    // ===== 10. How to Continue =====
    h2("10. How to Continue (دليل تشغيلي)");
    h3("تشغيل المشروع");
    push("- المشروع مدار من Lovable Cloud — الـ env vars بتتحقن تلقائيًا.");
    push("- محليًا: `bun install` ثم `bun run dev`.");
    h3("إضافة درس جديد");
    push("1. أضف الـ content في `src/components/intro/lessons/` (لو فيه blocks) أو في المكان المناسب للـ path.");
    push("2. أضف الـ lesson في `src/lib/curriculum-data.ts` تحت الـ module المناسب بالـ id والـ route.");
    push("3. لو محتاج صفحة dedicated، استخدم `/learn/{pathId}/{slug}` (الـ route موجود).");
    push("4. الـ `unified-lessons.ts` adapter بيلتقطه تلقائيًا.");
    h3("إضافة server function");
    push("```ts");
    push(`import { createServerFn } from "@tanstack/react-start";`);
    push(`import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";`);
    push(`import { z } from "zod";`);
    push(``);
    push(`export const myFn = createServerFn({ method: "POST" })`);
    push(`  .middleware([requireSupabaseAuth])`);
    push(`  .inputValidator((i) => z.object({ ... }).parse(i))`);
    push(`  .handler(async ({ data, context }) => { ... });`);
    push("```");
    h3("Migration");
    push("- استخدم Lovable migration tool (مش تحرير ملفات الـ migrations مباشرة).");
    push("- لأي جدول جديد: `CREATE TABLE` → `GRANT` → `ENABLE RLS` → `CREATE POLICY`.");

    push(`\n---\n_Generated by \`generateDnaReport\` at ${stamp}._\n`);

    const markdown = out.join("\n");

    // Archive a copy to private Storage bucket (admins only).
    const pad = (n: number) => String(n).padStart(2, "0");
    const fileName = `dna-report-${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}.md`;
    let storagePath: string | null = null;
    let storageError: string | null = null;
    try {
      const upRes = await storageFetch(`object/${DNA_REPORTS_BUCKET}/${encodeStoragePath(fileName)}`, {
        method: "POST",
        headers: {
          "content-type": "text/markdown;charset=utf-8",
          "cache-control": "max-age=3600",
          "x-upsert": "false",
        },
        body: markdown,
      });
      if (!upRes.ok) throw new Error(await storageErrorMessage(upRes));
      storagePath = fileName;
    } catch (e: any) {
      storageError = e?.message ?? String(e);
    }

    return { markdown, generatedAt: stamp, storagePath, storageError };
  });

export const listDnaReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const res = await storageFetch(`object/list/${DNA_REPORTS_BUCKET}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ limit: 100, offset: 0, prefix: "", sortBy: { column: "created_at", order: "desc" } }),
    });
    if (!res.ok) throw new Error(await storageErrorMessage(res));
    const data = (await res.json()) as DnaStorageObject[];
    return {
      reports: (data ?? [])
        .filter((f: DnaStorageObject): f is DnaStorageObject & { name: string } => !!f.name && f.name.endsWith(".md"))
        .map((f) => ({
          path: f.name,
          name: f.name,
          size: (f.metadata as any)?.size ?? null,
          createdAt: f.created_at ?? null,
        })),
    };
  });

export const downloadDnaReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ path: z.string().min(1).max(200) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const res = await storageFetch(`object/${DNA_REPORTS_BUCKET}/${encodeStoragePath(data.path)}`);
    if (!res.ok) throw new Error(await storageErrorMessage(res));
    const markdown = await res.text();
    return { markdown, path: data.path };
  });

export const deleteDnaReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ path: z.string().min(1).max(200) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const res = await storageFetch(`object/${DNA_REPORTS_BUCKET}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prefixes: [data.path] }),
    });
    if (!res.ok) throw new Error(await storageErrorMessage(res));
    return { ok: true };
  });