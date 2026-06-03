import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { captureWarn } from "@/lib/error-capture";
import type { BuildLog, BuildLogType } from "@/lib/build-logs";

/**
 * Pulls cloud-persisted state (build logs + mission state) into the
 * local stores once after sign-in. Keeps the existing local-first
 * runtime APIs (`useBuildLogs`, `useMissionState`) working unchanged
 * while giving cross-device continuity.
 *
 * Merge strategy: additive only — never deletes local entries the
 * cloud doesn't know about (e.g. anonymous activity from before login).
 */

const BUILD_LOGS_KEY = "build-logs:v1";
const BUILD_LOGS_EVENT = "build-logs:changed";
const MISSION_KEY = "mission-runtime:v1";
const MISSION_EVENT = "mission-runtime:changed";

const hydratedUsers = new Set<string>();

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown, event: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(event));
  } catch {
    /* ignore */
  }
}

type CloudBuildLog = {
  id: string;
  type: BuildLogType;
  lesson_id: string | null;
  title: string;
  short_description: string;
  created_at: string;
  metadata: { local_id?: string; module_id?: string | null; local_timestamp?: number } | null;
};

async function hydrateBuildLogs(userId: string) {
  const { data, error } = await supabase
    .from("build_logs")
    .select("id, type, lesson_id, title, short_description, created_at, metadata")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    captureWarn("cloud-hydration:build-logs", error);
    return;
  }
  if (!data || data.length === 0) return;

  const local = readLocal<BuildLog[]>(BUILD_LOGS_KEY, []);
  const seen = new Set(local.map((l) => l.id));
  const merged = [...local];

  for (const row of data as CloudBuildLog[]) {
    const meta = row.metadata ?? {};
    const id = meta.local_id || row.id;
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push({
      id,
      timestamp: meta.local_timestamp ?? new Date(row.created_at).getTime(),
      lessonId: row.lesson_id,
      moduleId: meta.module_id ?? null,
      type: row.type,
      title: row.title,
      shortDescription: row.short_description,
    });
  }

  merged.sort((a, b) => b.timestamp - a.timestamp);
  writeLocal(BUILD_LOGS_KEY, merged.slice(0, 500), BUILD_LOGS_EVENT);
}

type CloudMissionRow = {
  mission_id: string;
  state: "started" | "completed";
  created_at: string;
  updated_at: string;
};

type MissionPersisted = {
  id: string;
  lessonId?: string | null;
  state: "started" | "completed";
  startedAt?: number;
  completedAt?: number;
};

async function hydrateMissionState(userId: string) {
  const { data, error } = await supabase
    .from("user_mission_state")
    .select("mission_id, state, created_at, updated_at")
    .eq("user_id", userId);

  if (error) {
    captureWarn("cloud-hydration:mission-state", error);
    return;
  }
  if (!data || data.length === 0) return;

  const local = readLocal<Record<string, MissionPersisted>>(MISSION_KEY, {});
  let changed = false;

  for (const row of data as CloudMissionRow[]) {
    if (row.state !== "started" && row.state !== "completed") continue;
    const existing = local[row.mission_id];
    const startedAt = new Date(row.created_at).getTime();
    const completedAt =
      row.state === "completed" ? new Date(row.updated_at).getTime() : undefined;

    // If local is already completed, leave it. Otherwise upgrade.
    if (existing?.state === "completed") continue;
    if (existing?.state === "started" && row.state === "started") continue;

    local[row.mission_id] = {
      id: row.mission_id,
      lessonId: existing?.lessonId ?? row.mission_id.split("::")[0] ?? null,
      state: row.state,
      startedAt: existing?.startedAt ?? startedAt,
      completedAt,
    };
    changed = true;
  }

  if (changed) {
    writeLocal(MISSION_KEY, local, MISSION_EVENT);
  }
}

export function CloudHydration() {
  const { user, loading } = useAuth();
  const lastUserIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (loading) return;
    const userId = user?.id ?? null;

    // User switched / signed out → drop stale hydration marks so the
    // next account on this tab re-hydrates from cloud.
    if (lastUserIdRef.current && lastUserIdRef.current !== userId) {
      hydratedUsers.delete(lastUserIdRef.current);
    }
    lastUserIdRef.current = userId;

    if (!userId) return;
    if (hydratedUsers.has(userId)) return;
    hydratedUsers.add(userId);

    // Fire-and-forget. Never blocks UI.
    void hydrateBuildLogs(userId);
    void hydrateMissionState(userId);
  }, [user, loading]);

  return null;
}