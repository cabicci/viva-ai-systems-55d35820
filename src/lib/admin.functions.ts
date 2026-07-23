import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

// IMPORTANT: do NOT import `@/integrations/supabase/client.server` at the top
// level — server-fn modules only strip handler bodies from the client bundle.
// Load the admin client inside each `.handler()` via dynamic import.
async function loadSupabaseAdmin() {
  const mod = await import("@/integrations/supabase/client.server");
  return mod.supabaseAdmin;
}

/**
 * Admin-only stats. Each handler:
 *  1. Authenticates via requireSupabaseAuth
 *  2. Verifies the user has role = 'admin' via has_role() RPC
 *  3. Uses supabaseAdmin to bypass RLS for aggregate reads
 */

async function assertAdmin(context: { supabase: SupabaseClient<Database>; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error("Authorization check failed");
  if (!data) throw new Error("Forbidden: admin role required");
}

/* -------------------------------------------------------------- */
/* Server-side gate for /admin route (beforeLoad)                 */
/* -------------------------------------------------------------- */

/**
 * Returns { isAdmin: true } only for authenticated admins.
 * Throws Unauthorized if no verified identity → caller treats as "go to /login".
 * Returns { isAdmin: false } if authenticated but not admin → caller redirects to /dashboard.
 *
 * Identity sources (both verified via getClaims, never client role claims):
 * - Authorization Bearer (client server-fn RPC via attachSupabaseAuth)
 * - masaarat_access_token cookie (SSR document requests after client sync)
 */
export const assertAdminAccess = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ isAdmin: boolean; userId: string }> => {
    const { resolveVerifiedRequestUser } = await import("@/lib/ssr-request-auth.server");
    const auth = await resolveVerifiedRequestUser();
    if (!auth) {
      throw new Error("Unauthorized: No valid session");
    }

    const { data, error } = await auth.supabase.rpc("has_role", {
      _user_id: auth.userId,
      _role: "admin",
    });
    if (error) throw new Error("Authorization check failed");
    return { isAdmin: Boolean(data), userId: auth.userId };
  },
);

/* -------------------------------------------------------------- */
/* Overview stats                                                  */
/* -------------------------------------------------------------- */

export type AdminOverview = {
  totalUsers: number;
  newUsers7d: number;
  activeToday: number;
  lessonsCompleted: number;
  missionsSubmitted: number;
  proUsers: number;
};

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminOverview> => {
    await assertAdmin(context);

    // Single SQL aggregation in Postgres (cheap, scales).
    const { data, error } = await context.supabase.rpc("get_admin_overview");
    if (error) throw new Error(`Failed to load admin overview: ${error.message}`);
    const row = (data ?? {}) as Record<string, number | string | null>;
    const n = (v: unknown) => Number(v ?? 0) || 0;
    return {
      totalUsers: n(row.total_users),
      newUsers7d: n(row.new_users_7d),
      activeToday: n(row.active_today),
      lessonsCompleted: n(row.lessons_completed),
      missionsSubmitted: n(row.missions_submitted),
      proUsers: n(row.pro_users),
    };
  });

/* -------------------------------------------------------------- */
/* Recent activity                                                 */
/* -------------------------------------------------------------- */

export type RecentSignup = {
  id: string;
  email: string | null;
  createdAt: string;
};

export type RecentLesson = {
  userId: string;
  lessonId: string;
  status: string;
  updatedAt: string;
};

export type RecentMission = {
  userId: string;
  missionId: string;
  lessonId: string | null;
  status: string;
  score: number | null;
  submittedAt: string | null;
};

export type AdminActivity = {
  signups: RecentSignup[];
  lessons: RecentLesson[];
  missions: RecentMission[];
};

export const getAdminActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminActivity> => {
    await assertAdmin(context);
    const supabaseAdmin = await loadSupabaseAdmin();

    // Fetch up to 5 pages (500 users) to keep "Recent signups" accurate
    // beyond the first 20. listUsers returns by created_at desc by default,
    // but we re-sort defensively before slicing.
    const collected: Array<{ id: string; email?: string | null; created_at: string }> = [];
    for (let page = 1; page <= 5; page++) {
      const { data: usersPage } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 100,
      });
      const batch = usersPage?.users ?? [];
      if (batch.length === 0) break;
      collected.push(...batch);
      if (batch.length < 100) break;
    }
    const signups: RecentSignup[] = collected
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20)
      .map((u) => ({
        id: u.id,
        email: u.email ?? null,
        createdAt: u.created_at,
      }));

    const { data: lessonRows } = await supabaseAdmin
      .from("user_lesson_status")
      .select("user_id, lesson_id, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(20);
    const lessons: RecentLesson[] = (lessonRows ?? []).map((r) => ({
      userId: r.user_id,
      lessonId: r.lesson_id,
      status: r.status,
      updatedAt: r.updated_at,
    }));

    const { data: missionRows } = await supabaseAdmin
      .from("mission_submissions")
      .select("user_id, mission_id, lesson_id, status, score, submitted_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(10);
    const missions: RecentMission[] = (missionRows ?? []).map((r) => ({
      userId: r.user_id,
      missionId: r.mission_id,
      lessonId: r.lesson_id,
      status: r.status,
      score: r.score == null ? null : Number(r.score),
      submittedAt: r.submitted_at ?? r.updated_at,
    }));

    return { signups, lessons, missions };
  });

/* -------------------------------------------------------------- */
/* Paginated users list                                            */
/* -------------------------------------------------------------- */

export type AdminUserRow = {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
};

export type AdminUsersPage = {
  users: AdminUserRow[];
  page: number;
  pageSize: number;
  total: number | null;
  hasMore: boolean;
};

const listUsersInput = z.object({
  page: z.number().int().min(1).max(10_000).default(1),
  pageSize: z.number().int().min(5).max(100).default(25),
});

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => listUsersInput.parse(input ?? {}))
  .handler(async ({ data, context }): Promise<AdminUsersPage> => {
    await assertAdmin(context);
    const supabaseAdmin = await loadSupabaseAdmin();

    const { page, pageSize } = data;
    const { data: res, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: pageSize,
    });
    if (error) throw new Error(`Failed to list users: ${error.message}`);

    const rawUsers = res?.users ?? [];
    const users: AdminUserRow[] = rawUsers.map((u) => ({
      id: u.id,
      email: u.email ?? null,
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
    }));

    const totalRaw = (res as unknown as { total?: number })?.total;
    const total = typeof totalRaw === "number" ? totalRaw : null;
    const hasMore = total != null ? page * pageSize < total : users.length === pageSize;

    return { users, page, pageSize, total, hasMore };
  });

/* -------------------------------------------------------------- */
/* Path distribution & drop-off                                    */
/* -------------------------------------------------------------- */

export type PathDistribution = {
  pathId: string;
  completedLessons: number;
  activeUsers: number;
};

export type DropOffLesson = {
  lessonId: string;
  startedCount: number;
};

export type AdminInsights = {
  pathDistribution: PathDistribution[];
  dropOffLessons: DropOffLesson[];
};

export const getAdminInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminInsights> => {
    await assertAdmin(context);

    // SQL-side aggregation — no row scan in JS.
    const { data, error } = await context.supabase.rpc("get_admin_insights");
    if (error) throw new Error(`Failed to load admin insights: ${error.message}`);
    const payload = (data ?? {}) as {
      path_distribution?: Array<{
        path_id: string;
        completed_lessons: number | string;
        active_users: number | string;
      }>;
      drop_off_lessons?: Array<{ lesson_id: string; started_count: number | string }>;
    };
    const n = (v: unknown) => Number(v ?? 0) || 0;
    return {
      pathDistribution: (payload.path_distribution ?? []).map((r) => ({
        pathId: r.path_id,
        completedLessons: n(r.completed_lessons),
        activeUsers: n(r.active_users),
      })),
      dropOffLessons: (payload.drop_off_lessons ?? []).map((r) => ({
        lessonId: r.lesson_id,
        startedCount: n(r.started_count),
      })),
    };
  });
