import { supabase } from "@/integrations/supabase/client";
import type { MissionState } from "@/lib/mission-runtime";
import type { BuildLog } from "@/lib/build-logs";
import { captureWarn } from "@/lib/error-capture";
import {
  localLearningOwner,
  localLearningOwnerCurrent,
  subscribeLocalLearningOwner,
  type LocalLearningOwner,
} from "@/lib/local-learning-owner";

type PendingWrite = { key: string; revision: string } & (
  | { kind: "mission"; missionId: string; state: "started" | "completed" }
  | { kind: "log"; log: BuildLog; missionId: string | null }
);
const queueKey = (userId: string) => `learning-sync:v1:${userId}`;
let listening = false;
let active: { owner: LocalLearningOwner; promise: Promise<void> } | null = null;
let retryTimer: ReturnType<typeof setTimeout> | undefined;

function readQueue(userId: string): PendingWrite[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(queueKey(userId)) ?? "[]");
    return Array.isArray(value)
      ? value.filter(
          (row): row is PendingWrite =>
            row &&
            typeof row.key === "string" &&
            typeof row.revision === "string" &&
            ((row.kind === "mission" &&
              typeof row.missionId === "string" &&
              ["started", "completed"].includes(row.state)) ||
              (row.kind === "log" && row.log && typeof row.log.id === "string")),
        )
      : [];
  } catch {
    return [];
  }
}
function writeQueue(userId: string, queue: PendingWrite[]) {
  localStorage.setItem(queueKey(userId), JSON.stringify(queue));
}

/** Stable across reloads and ambiguous responses; no duplicate cloud log on retry. */
async function cloudLogId(userId: string, localId: string): Promise<string> {
  const bytes = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(JSON.stringify([userId, localId])),
    ),
  );
  bytes[6] = (bytes[6] & 15) | 80;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes.slice(0, 16), (value) => value.toString(16).padStart(2, "0")).join(
    "",
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function flush(owner: LocalLearningOwner) {
  if (!owner.userId || !localLearningOwnerCurrent(owner)) return;
  const userId = owner.userId;
  for (const item of readQueue(userId)) {
    if (!localLearningOwnerCurrent(owner)) return;
    try {
      let result: { error: unknown };
      if (item.kind === "mission") {
        result = await supabase.from("user_mission_state").upsert(
          {
            user_id: userId,
            mission_id: item.missionId,
            state: item.state,
          },
          { onConflict: "user_id,mission_id" },
        );
      } else {
        const id = await cloudLogId(userId, item.log.id);
        if (!localLearningOwnerCurrent(owner)) return;
        result = await supabase.from("build_logs").upsert(
          {
            id,
            user_id: userId,
            type: item.log.type,
            lesson_id: item.log.lessonId,
            mission_id: item.missionId,
            title: item.log.title,
            short_description: item.log.shortDescription,
            metadata: {
              local_id: item.log.id,
              module_id: item.log.moduleId,
              local_timestamp: item.log.timestamp,
            },
          },
          { onConflict: "id", ignoreDuplicates: true },
        );
      }
      if (!localLearningOwnerCurrent(owner)) return;
      if (result.error) throw result.error;
      // A later local edit may have replaced this entry while the request ran.
      writeQueue(
        userId,
        readQueue(userId).filter((row) => row.key !== item.key || row.revision !== item.revision),
      );
    } catch (error) {
      if (localLearningOwnerCurrent(owner)) captureWarn("cloud-sync:pending", error);
      return;
    }
  }
}

export function retryCloudSync(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const owner = localLearningOwner();
  if (!owner.userId) return Promise.resolve();
  if (active?.owner === owner) return active.promise;
  const promise = flush(owner).finally(() => {
    if (active?.promise === promise) active = null;
    if (!localLearningOwnerCurrent(owner) || !owner.userId || readQueue(owner.userId).length === 0)
      return;
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => {
      void retryCloudSync();
    }, 30_000);
  });
  active = { owner, promise };
  return promise;
}

function initialize() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  subscribeLocalLearningOwner(() => {
    void retryCloudSync();
  });
  window.addEventListener("online", () => {
    void retryCloudSync();
  });
}

async function enqueue(item: PendingWrite, expectedUser?: string | null) {
  if (typeof window === "undefined") return;
  initialize();
  const owner = localLearningOwner();
  if (!owner.userId || (expectedUser !== undefined && expectedUser !== owner.userId)) return;
  try {
    const queue = readQueue(owner.userId);
    // Completion is monotonic. A queued completion cannot become a start.
    const previous = queue.find((row) => row.key === item.key);
    if (item.kind === "mission" && previous?.kind === "mission" && previous.state === "completed")
      item.state = "completed";
    writeQueue(owner.userId, [...queue.filter((row) => row.key !== item.key), item]);
  } catch (error) {
    captureWarn("cloud-sync:queue-storage", error);
    return;
  }
  await retryCloudSync();
}

export function syncMissionState(
  missionId: string,
  state: Extract<MissionState, "started" | "completed">,
  userIdHint?: string | null,
): Promise<void> {
  return enqueue(
    {
      key: `mission:${missionId}`,
      revision: crypto.randomUUID(),
      kind: "mission",
      missionId,
      state,
    },
    userIdHint,
  );
}

export function syncBuildLog(
  log: BuildLog,
  missionId?: string | null,
  userIdHint?: string | null,
): Promise<void> {
  return enqueue(
    {
      key: `log:${log.id}`,
      revision: crypto.randomUUID(),
      kind: "log",
      log,
      missionId: missionId ?? null,
    },
    userIdHint,
  );
}
