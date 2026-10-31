import * as React from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { captureWarn } from "@/lib/error-capture";
import type { BuildLog, BuildLogType } from "@/lib/build-logs";
import { JourneyReadProvider, useJourneyReadController, boxJourneyRead, type JourneyReadOperation, type JourneyReadBox, type JourneyReadData, type JourneyCloudLog, type JourneyCloudMission } from "@/lib/journey-current-user-context";

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
// Opt-in, private in-memory read branch. The legacy implementation above is
// intentionally preserved and is never called or co-mounted by this branch.
function ownedRecord(value: unknown): object {
  if (value === null || typeof value !== "object") throw new Error("Malformed cloud read object");
  return value;
}
function ownedString(operation: JourneyReadOperation, value: object, key: string): string {
  const field = operation.read(() => Reflect.get(value, key));
  if (typeof field !== "string") throw new Error("Malformed cloud field: " + key);
  return field;
}
function ownedNullableString(operation: JourneyReadOperation, value: object, key: string): string | null {
  const field = operation.read(() => Reflect.get(value, key));
  if (field !== null && typeof field !== "string") throw new Error("Malformed cloud field: " + key);
  return field;
}
function ownedMetadata(operation: JourneyReadOperation, value: unknown): JourneyCloudLog["metadata"] {
  if (value === null) return null;
  const metadata = ownedRecord(value);
  if (Array.isArray(metadata)) throw new Error("Malformed log metadata");
  const localId = operation.read(() => Reflect.get(metadata, "local_id"));
  const moduleId = operation.read(() => Reflect.get(metadata, "module_id"));
  const localTimestamp = operation.read(() => Reflect.get(metadata, "local_timestamp"));
  if (localId !== undefined && typeof localId !== "string") throw new Error("Malformed local log id");
  if (moduleId !== undefined && moduleId !== null && typeof moduleId !== "string") throw new Error("Malformed module id");
  if (localTimestamp !== undefined && typeof localTimestamp !== "number") throw new Error("Malformed local log timestamp");
  return Object.freeze({
    ...(localId === undefined ? {} : { local_id: localId }),
    ...(moduleId === undefined ? {} : { module_id: moduleId }),
    ...(localTimestamp === undefined ? {} : { local_timestamp: localTimestamp }),
  });
}
function ownedData(operation: JourneyReadOperation, response: unknown) {
  const result = ownedRecord(response);
  const error = operation.read(() => Reflect.get(result, "error"));
  if (error) throw error;
  const data = operation.read(() => Reflect.get(result, "data"));
  if (!Array.isArray(data)) throw new Error("Cloud response is not an array");
  return data;
}
async function readOwnedCloud(operation: JourneyReadOperation): Promise<JourneyReadBox<JourneyReadData>> {
  const fromLogs = operation.read(() => supabase.from);
  const bindFromLogs = operation.read(() => fromLogs.bind<typeof fromLogs>);
  const boundFromLogs = operation.read(() => bindFromLogs.call(fromLogs, supabase));
  const tableLogs = operation.read(() => boundFromLogs("build_logs"));
  const selectLogs = operation.read(() => tableLogs.select);
  const bindSelectLogs = operation.read(() => selectLogs.bind<typeof selectLogs>);
  const boundSelectLogs = operation.read(() => bindSelectLogs.call(selectLogs, tableLogs));
  const selectedLogs = operation.read(() => boundSelectLogs("id, type, lesson_id, title, short_description, created_at, metadata"));
  const eqLogs = operation.read(() => selectedLogs.eq);
  const bindEqLogs = operation.read(() => eqLogs.bind<typeof eqLogs>);
  const boundEqLogs = operation.read(() => bindEqLogs.call(eqLogs, selectedLogs));
  const actorLogs = operation.read(() => boundEqLogs("user_id", operation.actor));
  const orderLogs = operation.read(() => actorLogs.order);
  const bindOrderLogs = operation.read(() => orderLogs.bind<typeof orderLogs>);
  const boundOrderLogs = operation.read(() => bindOrderLogs.call(orderLogs, actorLogs));
  const orderedLogs = operation.read(() => boundOrderLogs("created_at", { ascending: false }));
  const limitLogs = operation.read(() => orderedLogs.limit);
  const bindLimitLogs = operation.read(() => limitLogs.bind<typeof limitLogs>);
  const boundLimitLogs = operation.read(() => bindLimitLogs.call(limitLogs, orderedLogs));
  const pendingLogs = operation.read(() => boundLimitLogs(500));
  const logsBox = await operation.adopt(pendingLogs); operation.requireCurrent();
  const logRows = ownedData(operation, logsBox.value);
  const logLength = operation.read(() => logRows.length);
  if (!Number.isSafeInteger(logLength) || logLength < 0) throw new Error("Invalid cloud log length");
  const logs: JourneyCloudLog[] = [];
  for (let i = 0; i < Math.min(logLength, 500); i++) {
    const row = ownedRecord(operation.read(() => logRows[i]));
    logs.push(Object.freeze({
      id: ownedString(operation, row, "id"), type: ownedString(operation, row, "type"),
      lesson_id: ownedNullableString(operation, row, "lesson_id"), title: ownedString(operation, row, "title"),
      short_description: ownedString(operation, row, "short_description"), created_at: ownedString(operation, row, "created_at"),
      metadata: ownedMetadata(operation, operation.read(() => Reflect.get(row, "metadata"))),
    }));
  }
  operation.requireCurrent();
  const fromMissions = operation.read(() => supabase.from);
  const bindFromMissions = operation.read(() => fromMissions.bind<typeof fromMissions>);
  const boundFromMissions = operation.read(() => bindFromMissions.call(fromMissions, supabase));
  const tableMissions = operation.read(() => boundFromMissions("user_mission_state"));
  const selectMissions = operation.read(() => tableMissions.select);
  const bindSelectMissions = operation.read(() => selectMissions.bind<typeof selectMissions>);
  const boundSelectMissions = operation.read(() => bindSelectMissions.call(selectMissions, tableMissions));
  const selectedMissions = operation.read(() => boundSelectMissions("mission_id, state, created_at, updated_at"));
  const eqMissions = operation.read(() => selectedMissions.eq);
  const bindEqMissions = operation.read(() => eqMissions.bind<typeof eqMissions>);
  const boundEqMissions = operation.read(() => bindEqMissions.call(eqMissions, selectedMissions));
  const pendingMissions = operation.read(() => boundEqMissions("user_id", operation.actor));
  const missionsBox = await operation.adopt(pendingMissions); operation.requireCurrent();
  const missionRows = ownedData(operation, missionsBox.value);
  const missionLength = operation.read(() => missionRows.length);
  if (!Number.isSafeInteger(missionLength) || missionLength < 0) throw new Error("Invalid mission result length");
  const missions: JourneyCloudMission[] = [];
  for (let i = 0; i < missionLength; i++) {
    const row = ownedRecord(operation.read(() => missionRows[i]));
    missions.push(Object.freeze({
      mission_id: ownedString(operation, row, "mission_id"), state: ownedString(operation, row, "state"),
      created_at: ownedString(operation, row, "created_at"), updated_at: ownedString(operation, row, "updated_at"),
    }));
  }
  operation.requireCurrent();
  return boxJourneyRead(Object.freeze({ logs: Object.freeze(logs), missions: Object.freeze(missions) }));
}
function OwnedCloudRead() {
  const controller = useJourneyReadController();
  React.useEffect(() => controller?.installReader(readOwnedCloud), [controller]);
  return null;
}
export function OwnedJourneyReadBoundary({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  return <JourneyReadProvider enabled={enabled}><OwnedCloudRead />{children}</JourneyReadProvider>;
}
