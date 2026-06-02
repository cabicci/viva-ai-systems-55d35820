import * as React from "react";
import { getLesson } from "@/lib/unified-lessons";
import { syncBuildLog } from "@/lib/cloud-sync";

/**
 * Build Logs Runtime — foundation layer.
 *
 * Lightweight, frontend-only persistence for the learner's build
 * activity. Designed to be swapped for a Supabase-backed runtime
 * later without changing the public API of `addBuildLog` /
 * `getBuildLogs` / `clearBuildLogs`.
 */

export type BuildLogType =
  | "mission_started"
  | "mission_completed"
  | "lesson_completed"
  | "milestone"
  | "runtime_realization";

export interface BuildLog {
  id: string;
  timestamp: number; // epoch ms
  lessonId: string | null;
  moduleId: string | null;
  type: BuildLogType;
  title: string;
  shortDescription: string;
}

const STORAGE_KEY = "build-logs:v1";
const EVENT = "build-logs:changed";

/* ------------------------------ helpers ------------------------------ */

function safeRead(): BuildLog[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BuildLog[]) : [];
  } catch {
    return [];
  }
}

function safeWrite(logs: BuildLog[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* ignore */
  }
}

function makeId() {
  return `bl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Extract "MODULE 04" from a stage like "MODULE 04 · LESSON 02". */
function moduleFromStage(stage: string | undefined): string | null {
  if (!stage) return null;
  const m = stage.match(/MODULE\s*\d+/i);
  return m ? m[0].toUpperCase().replace(/\s+/g, " ") : null;
}

/* ------------------------------ public API ------------------------------ */

export interface AddBuildLogInput {
  type: BuildLogType;
  lessonId?: string | null;
  title?: string;
  shortDescription?: string;
}

/**
 * Add a build log entry. If `lessonId` is provided, lesson title and
 * module are filled in automatically when missing. Duplicate
 * (type + lessonId) entries within 2 seconds are de-duped.
 */
export function addBuildLog(input: AddBuildLogInput): BuildLog {
  const lessonId = input.lessonId ?? null;
  const lesson = lessonId ? getLesson(lessonId) : null;
  const moduleId = moduleFromStage(lesson?.stage);

  const log: BuildLog = {
    id: makeId(),
    timestamp: Date.now(),
    lessonId,
    moduleId,
    type: input.type,
    title: input.title ?? lesson?.title ?? defaultTitle(input.type),
    shortDescription:
      input.shortDescription ?? defaultDescription(input.type, lesson?.title),
  };

  const current = safeRead();
  const recent = current[0];
  if (
    recent &&
    recent.type === log.type &&
    recent.lessonId === log.lessonId &&
    log.timestamp - recent.timestamp < 2_000
  ) {
    return recent;
  }

  const next = [log, ...current].slice(0, 500);
  safeWrite(next);
  // Best-effort cloud mirror; silent no-op when unauthenticated.
  void syncBuildLog(log);
  return log;
}

export function getBuildLogs(): BuildLog[] {
  return safeRead();
}

export function clearBuildLogs() {
  safeWrite([]);
}

function defaultTitle(type: BuildLogType): string {
  switch (type) {
    case "mission_started":
      return "بدأت مهمة جديدة";
    case "mission_completed":
      return "أكملت مهمة";
    case "lesson_completed":
      return "أكملت درسًا";
    case "milestone":
      return "محطة جديدة";
    case "runtime_realization":
      return "لحظة إدراك";
  }
}

function defaultDescription(type: BuildLogType, lessonTitle?: string): string {
  const where = lessonTitle ? ` — ${lessonTitle}` : "";
  switch (type) {
    case "mission_started":
      return `بدأت تنفيذ مهمة جديدة${where}.`;
    case "mission_completed":
      return `أنهيت مهمة وبنيت طبقة جديدة من الفهم${where}.`;
    case "lesson_completed":
      return `أكملت الدرس${where} وأضفت خطوة جديدة في رحلة البناء.`;
    case "milestone":
      return `محطة جديدة في رحلتك${where}.`;
    case "runtime_realization":
      return `إدراك جديد عن طريقة عمل الأنظمة${where}.`;
  }
}

/* ------------------------------ hooks ------------------------------ */

/** Subscribe to logs in React. Re-renders on add / clear. */
export function useBuildLogs(): BuildLog[] {
  const [logs, setLogs] = React.useState<BuildLog[]>(() => safeRead());

  React.useEffect(() => {
    const sync = () => setLogs(safeRead());
    if (typeof window === "undefined") return;
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return logs;
}
