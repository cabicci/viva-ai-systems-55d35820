import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { enforceRateLimit } from "./rate-limit.server";

async function limitWrites(userId: string) {
  // Admin-only write fns — generous per-user cap to stop runaway loops/bugs.
  await enforceRateLimit({
    userId,
    bucketKey: "roadmap:write",
    maxCalls: 120,
    windowSeconds: 3600,
  });
}

const PHASES = ["A", "B", "C", "D", "inbox"] as const;
const STATUSES = ["todo", "in_progress", "done", "deferred"] as const;

export type RoadmapPhase = (typeof PHASES)[number];
export type RoadmapStatus = (typeof STATUSES)[number];

export interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  phase: RoadmapPhase;
  status: RoadmapStatus;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error("Authorization check failed");
  if (!data) throw new Error("Forbidden: admin role required");
}

export const listRoadmapItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabase } = context;
    const { data, error } = await supabase
      .from("roadmap_items")
      .select("*")
      .order("phase", { ascending: true })
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as RoadmapItem[];
  });

export const getRoadmapItem = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("roadmap_items")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    return row as RoadmapItem;
  });

export interface PhaseStat {
  phase: RoadmapPhase;
  todo: number;
  in_progress: number;
  done: number;
  deferred: number;
  total: number;
}

export const getRoadmapPhaseStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabase } = context;
    const { data, error } = await supabase
      .from("roadmap_items")
      .select("phase,status");
    if (error) throw new Error(error.message);
    const acc: Record<RoadmapPhase, PhaseStat> = {
      A: { phase: "A", todo: 0, in_progress: 0, done: 0, deferred: 0, total: 0 },
      B: { phase: "B", todo: 0, in_progress: 0, done: 0, deferred: 0, total: 0 },
      C: { phase: "C", todo: 0, in_progress: 0, done: 0, deferred: 0, total: 0 },
      D: { phase: "D", todo: 0, in_progress: 0, done: 0, deferred: 0, total: 0 },
      inbox: { phase: "inbox", todo: 0, in_progress: 0, done: 0, deferred: 0, total: 0 },
    };
    for (const row of (data ?? []) as { phase: RoadmapPhase; status: RoadmapStatus }[]) {
      acc[row.phase].total += 1;
      acc[row.phase][row.status] += 1;
    }
    // Current phase = first phase with in_progress, else first with todo, else 'A'.
    const order: RoadmapPhase[] = ["A", "B", "C", "D", "inbox"];
    let current: RoadmapPhase = "A";
    const withInProgress = order.find((p) => acc[p].in_progress > 0);
    if (withInProgress) current = withInProgress;
    else {
      const withTodo = order.find((p) => acc[p].todo > 0);
      if (withTodo) current = withTodo;
    }
    return { stats: acc, currentPhase: current };
  });

const createSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
  phase: z.enum(PHASES).default("inbox"),
  status: z.enum(STATUSES).default("todo"),
});

export const createRoadmapItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await limitWrites(context.userId);
    const { supabase } = context;
    const { data: row, error } = await supabase
      .from("roadmap_items")
      .insert({
        title: data.title,
        description: data.description ?? null,
        notes: data.notes ?? null,
        phase: data.phase,
        status: data.status,
        sort_order: Math.floor(Date.now() / 1000) % 100000,
        completed_at: data.status === "done" ? new Date().toISOString() : null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as RoadmapItem;
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).nullable().optional(),
  notes: z.string().max(10000).nullable().optional(),
  phase: z.enum(PHASES).optional(),
  status: z.enum(STATUSES).optional(),
});

export const updateRoadmapItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await limitWrites(context.userId);
    const { supabase } = context;
    const patch: {
      title?: string;
      description?: string | null;
      notes?: string | null;
      phase?: RoadmapPhase;
      status?: RoadmapStatus;
      completed_at?: string | null;
    } = {};
    if (data.title !== undefined) patch.title = data.title;
    if (data.description !== undefined) patch.description = data.description;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.phase !== undefined) patch.phase = data.phase;
    if (data.status !== undefined) {
      patch.status = data.status;
      patch.completed_at = data.status === "done" ? new Date().toISOString() : null;
    }
    const { data: row, error } = await supabase
      .from("roadmap_items")
      .update(patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as RoadmapItem;
  });

export const deleteRoadmapItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await limitWrites(context.userId);
    const { supabase } = context;
    const { error } = await supabase.from("roadmap_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Auto-log a piece of completed work as a done roadmap item.
 * Use this when finishing meaningful work that wasn't already tracked.
 */
const logCompletedSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional().nullable(),
  notes: z.string().max(10000).optional().nullable(),
  phase: z.enum(PHASES).default("inbox"),
});

export const logCompletedWork = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => logCompletedSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await limitWrites(context.userId);
    const { supabase } = context;
    const now = new Date().toISOString();
    const { data: row, error } = await supabase
      .from("roadmap_items")
      .insert({
        title: data.title,
        description: data.description ?? null,
        notes: data.notes ?? null,
        phase: data.phase,
        status: "done",
        sort_order: Math.floor(Date.now() / 1000) % 100000,
        completed_at: now,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row as RoadmapItem;
  });