import * as React from "react";
import { useMemo } from "react";
import { LESSONS, type LessonContent, type MissionBlock } from "@/lib/unified-lessons";
import { PATHS } from "@/lib/curriculum-data";
import { useLearnerContext } from "@/lib/learner-context";
import { addBuildLog } from "@/lib/build-logs";
import { syncMissionState } from "@/lib/cloud-sync";
import { supabase } from "@/integrations/supabase/client";

/**
 * Mission Runtime — foundation layer.
 *
 * Two cooperating layers live here:
 *
 *  1. Introspection (existing): extract mission objects from shipped
 *     lessons so dashboards / system-state can render them as
 *     first-class entities. Pure read, no persistence.
 *
 *  2. State machine (new): a lightweight `locked → available → started
 *     → completed` runtime per mission, with localStorage persistence
 *     and Build Log integration. Decoupled from `lesson-progress` so
 *     missions can later evolve into real execution units (with
 *     submissions, AI evaluation, adaptive progression) without
 *     touching lesson routing.
 *
 * Public API for the state machine (`startMission` / `completeMission`
 * / `getMissionState` / `useMissionState`) is intentionally stable so
 * the storage backend can be swapped to Lovable Cloud later without
 * rewriting call sites.
 */

/* ============================================================== */
/*  Layer 1 — introspection (read-only)                            */
/* ============================================================== */

export type MissionStatus = "not-started" | "in-progress" | "completed";

export interface MissionRecord {
  /** stable derived id — `${lessonId}::mission` */
  missionId: string;
  lessonId: string;
  lessonTitle: string;
  moduleTitle: string;
  missionTitle: string;
  missionDescription: string;
  /** parsed bullet/numbered steps if the mission text contains them */
  missionSteps: string[];
  /** runtime default — mission completion is not persisted yet */
  status: MissionStatus;
}

const MODULE_INDEX: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const p of PATHS) {
    for (const m of p.modules) {
      for (const l of m.lessons) {
        if (!out[l.id]) out[l.id] = m.title;
      }
    }
  }
  return out;
})();

function extractSteps(mission: MissionBlock): string[] {
  const candidates = [mission.intro, mission.prompt, mission.outro].filter(
    Boolean,
  ) as string[];

  for (const text of candidates) {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const bulletLines = lines.filter((l) =>
      /^([-*•·▪️◦]|\d+[.)-])\s+/.test(l),
    );
    if (bulletLines.length >= 2) {
      return bulletLines.map((l) =>
        l.replace(/^([-*•·▪️◦]|\d+[.)-])\s+/, "").trim(),
      );
    }
  }
  return [];
}

function buildMission(l: LessonContent): MissionRecord | null {
  if (!l.mission) return null;
  const m = l.mission;
  const description = [m.intro, m.prompt, m.outro]
    .filter(Boolean)
    .join("\n\n")
    .trim();
  return {
    missionId: `${l.id}::mission`,
    lessonId: l.id,
    lessonTitle: l.title,
    moduleTitle: MODULE_INDEX[l.id] ?? l.stage,
    missionTitle: m.title?.trim() || `مهمة درس: ${l.title}`,
    missionDescription: description,
    missionSteps: extractSteps(m),
    status: "not-started",
  };
}

export function getMissionsFromLessons(): MissionRecord[] {
  const out: MissionRecord[] = [];
  for (const l of LESSONS) {
    const r = buildMission(l);
    if (r) out.push(r);
  }
  return out;
}

export interface MissionRuntime {
  missions: MissionRecord[];
  total: number;
  liveMissions: MissionRecord[];
  currentMission: MissionRecord | null;
  isPersisted: false;
}

export function useMissionRuntime(): MissionRuntime {
  const ctx = useLearnerContext();

  return useMemo<MissionRuntime>(() => {
    const missions = getMissionsFromLessons();
    const liveMissions = missions;
    const currentLessonId = ctx.currentLesson?.id ?? null;
    const currentMission = currentLessonId
      ? (missions.find((m) => m.lessonId === currentLessonId) ?? null)
      : null;

    return {
      missions,
      total: missions.length,
      liveMissions,
      currentMission,
      isPersisted: false,
    };
  }, [ctx.currentLesson?.id]);
}

/* ============================================================== */
/*  Layer 2 — state machine (persisted)                            */
/* ============================================================== */

export type MissionState = "locked" | "available" | "started" | "completed";

export interface MissionPersistedRecord {
  id: string;
  lessonId?: string | null;
  /** Only persisted once started — derived states (locked/available) live in memory. */
  state: Extract<MissionState, "started" | "completed">;
  startedAt?: number;
  completedAt?: number;
  /**
   * Reserved for the next runtime layer (submission text, file ref,
   * AI evaluation result, etc.). Intentionally `unknown` for now.
   */
  submission?: unknown;
}

const STORAGE_KEY_BASE = "mission-runtime:v1";
const EVENT = "mission-runtime:changed";

/**
 * Per-user storage key. Without namespacing, a second user signing into the
 * same browser would inherit the previous user's mission state. The auth
 * listener below updates `currentUserId` and broadcasts the EVENT so any
 * live `useMissionState` re-syncs from the right bucket.
 */
let currentUserId: string | null = null;
let authListenerInitialized = false;

function ensureAuthListener() {
  if (authListenerInitialized || typeof window === "undefined") return;
  authListenerInitialized = true;
  supabase.auth.getSession().then(({ data }) => {
    const next = data.session?.user?.id ?? null;
    if (next !== currentUserId) {
      currentUserId = next;
      window.dispatchEvent(new Event(EVENT));
    }
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    const next = session?.user?.id ?? null;
    if (next !== currentUserId) {
      currentUserId = next;
      window.dispatchEvent(new Event(EVENT));
    }
  });
}

function storageKey(): string {
  return currentUserId
    ? `${STORAGE_KEY_BASE}:${currentUserId}`
    : `${STORAGE_KEY_BASE}:anon`;
}

type Store = Record<string, MissionPersistedRecord>;

function safeRead(): Store {
  if (typeof window === "undefined") return {};
  ensureAuthListener();
  try {
    const raw = window.localStorage.getItem(storageKey());
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

function safeWrite(store: Store) {
  if (typeof window === "undefined") return;
  ensureAuthListener();
  try {
    window.localStorage.setItem(storageKey(), JSON.stringify(store));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

export interface MissionContext {
  /** Pass `false` when the parent lesson is still locked. */
  unlocked?: boolean;
  /** Linked lesson id (defaults to missionId for lesson-bound missions). */
  lessonId?: string | null;
}

export function getMissionState(
  missionId: string,
  ctx: MissionContext = {},
): MissionState {
  const record = safeRead()[missionId];
  if (record) return record.state;
  return ctx.unlocked === false ? "locked" : "available";
}

export function getMissionPersistedRecord(
  missionId: string,
): MissionPersistedRecord | null {
  return safeRead()[missionId] ?? null;
}

export function startMission(
  missionId: string,
  ctx: MissionContext = {},
): MissionPersistedRecord {
  const store = safeRead();
  const existing = store[missionId];
  if (existing) return existing;

  const record: MissionPersistedRecord = {
    id: missionId,
    lessonId: ctx.lessonId ?? missionId,
    state: "started",
    startedAt: Date.now(),
  };
  store[missionId] = record;
  safeWrite(store);
  addBuildLog({
    type: "mission_started",
    lessonId: record.lessonId ?? null,
  });
  void syncMissionState(missionId, "started");
  return record;
}

export function completeMission(
  missionId: string,
  ctx: MissionContext = {},
): MissionPersistedRecord {
  const store = safeRead();
  const existing = store[missionId];
  if (existing?.state === "completed") return existing;

  const now = Date.now();
  const record: MissionPersistedRecord = {
    id: missionId,
    lessonId: existing?.lessonId ?? ctx.lessonId ?? missionId,
    state: "completed",
    startedAt: existing?.startedAt ?? now,
    completedAt: now,
    submission: existing?.submission,
  };
  store[missionId] = record;
  safeWrite(store);
  addBuildLog({
    type: "mission_completed",
    lessonId: record.lessonId ?? null,
  });
  void syncMissionState(missionId, "completed");
  return record;
}

export function resetMission(missionId: string) {
  const store = safeRead();
  if (!(missionId in store)) return;
  delete store[missionId];
  safeWrite(store);
}

export function useMissionState(
  missionId: string,
  ctx: MissionContext = {},
): MissionState {
  const ctxKey = `${ctx.unlocked === false ? "L" : "U"}|${ctx.lessonId ?? ""}`;
  const [state, setState] = React.useState<MissionState>(() =>
    getMissionState(missionId, ctx),
  );

  React.useEffect(() => {
    const sync = () => setState(getMissionState(missionId, ctx));
    sync();
    if (typeof window === "undefined") return;
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId, ctxKey]);

  return state;
}

export const MISSION_STATE_LABEL: Record<MissionState, string> = {
  locked: "مقفلة",
  available: "لم تبدأ بعد",
  started: "بدأت المهمة",
  completed: "تم إكمال المهمة",
};