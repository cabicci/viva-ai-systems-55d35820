import * as React from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AuthGeneration } from "@/lib/auth-context";

export type LessonStatus = "not-started" | "in-progress" | "completed";

type Store = Record<string, LessonStatus>;
/** Response for the captured write; callers must also fence their visible action context. */
export type LessonProgressWriteOutcome = Readonly<{
  kind: "acknowledged" | "unconfirmed" | "not-started";
  userId: string | null;
  lessonId: string;
  status: LessonStatus;
  operationId: number | null;
  isCurrent: () => boolean;
}>;


const QK = ["lesson-progress"] as const;

type WriteTracker = { sequence: number; latest: Map<string, number> };
const writeTrackers = new WeakMap<QueryClient, WriteTracker>();
function progressWrites(client: QueryClient): WriteTracker {
  let tracker = writeTrackers.get(client);
  if (!tracker) {
    tracker = { sequence: 0, latest: new Map() };
    writeTrackers.set(client, tracker);
  }
  return tracker;
}

async function fetchProgress(userId: string | null): Promise<Store> {
  if (!userId) return {};
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id, status")
    .eq("user_id", userId);
  if (error) throw error;
  const out: Store = {};
  for (const row of data ?? []) out[row.lesson_id] = row.status as LessonStatus;
  return out;
}

export function useLessonProgress() {
  const { user, loading, authGeneration, isAuthGenerationCurrent } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();
  const writes = progressWrites(qc);

  const {
    data: store = {},
    isSuccess,
    isFetched,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: [...QK, userId],
    queryFn: () => fetchProgress(userId),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async ({ userId, id, status, authGeneration }: {
      userId: string | null;
      id: string;
      status: LessonStatus;
      operationId: number;
      authGeneration: AuthGeneration;
    }) => {
      if (!userId) throw new Error("Not authenticated");
      if (!isAuthGenerationCurrent(authGeneration)) throw new Error("Progress write context retired");
      const { error } = await supabase
        .from("lesson_progress")
        .upsert({ user_id: userId, lesson_id: id, status }, { onConflict: "user_id,lesson_id" });
      if (error) throw error;
      // user_lesson_status is kept in sync by a DB trigger
      // (sync_lesson_status_mirror). No client-side mirror needed.
    },
    onMutate: async ({ userId, id, status, operationId, authGeneration }) => {
      if (!userId) return;
      if (!isAuthGenerationCurrent(authGeneration)) throw new Error("Progress write context retired");
      const queryKey = [...QK, userId] as const;
      await qc.cancelQueries({ queryKey });
      if (!isAuthGenerationCurrent(authGeneration)) throw new Error("Progress write context retired");
      const prev = qc.getQueryData<Store>(queryKey) ?? {};
      qc.setQueryData<Store>(queryKey, { ...prev, [id]: status });
      return { queryKey, previousStatus: prev[id], operationId };
    },
    onError: (_e, { userId, id }, ctx) => {
      if (!ctx || writes.latest.get(JSON.stringify([userId, id])) !== ctx.operationId) return;
      qc.setQueryData<Store>(ctx.queryKey, (current) => {
        if (!current) return current;
        const next = { ...current };
        if (ctx.previousStatus === undefined) delete next[id];
        else next[id] = ctx.previousStatus;
        return next;
      });
    },
    onSuccess: async (_data, { userId, id, status, operationId }) => {
      if (!userId) return;
      const writeKey = JSON.stringify([userId, id]);
      if (writes.latest.get(writeKey) !== operationId) return;
      const queryKey = [...QK, userId] as const;
      await qc.cancelQueries({ queryKey, exact: true });
      if (writes.latest.get(writeKey) !== operationId) return;
      qc.setQueryData<Store>(queryKey, (current) => ({ ...current, [id]: status }));
    },
    // No onSettled invalidate: optimistic cache is the source of truth
    // until the next natural refetch (staleTime). Avoids a refetch
    // round-trip on every lesson click.
  });

  const setStatus = React.useCallback(
    (id: string, status: LessonStatus) => {
      const operationId = ++writes.sequence;
      writes.latest.set(JSON.stringify([userId, id]), operationId);
      mutation.mutate({ userId, id, status, operationId, authGeneration });
    },
    [mutation, userId, writes, authGeneration],
  );

  const setStatusWithOutcome = React.useCallback(
    async (id: string, status: LessonStatus): Promise<LessonProgressWriteOutcome> => {
      if (!userId) return {
        kind: "not-started", userId, lessonId: id, status, operationId: null,
        isCurrent: () => false,
      };
      const operationId = ++writes.sequence;
      const writeKey = JSON.stringify([userId, id]);
      writes.latest.set(writeKey, operationId);
      const isCurrent = () => isAuthGenerationCurrent(authGeneration) &&
        writes.latest.get(writeKey) === operationId;
      try {
        await mutation.mutateAsync({ userId, id, status, operationId, authGeneration });
        return { kind: "acknowledged", userId, lessonId: id, status, operationId, isCurrent };
      } catch {
        // A rejected response cannot prove that a remote write never arrived.
        return { kind: "unconfirmed", userId, lessonId: id, status, operationId, isCurrent };
      }
    },
    [mutation, userId, writes, authGeneration, isAuthGenerationCurrent],
  );

  const getStatus = React.useCallback(
    (id: string): LessonStatus => store[id] ?? "not-started",
    [store],
  );

  const request = mutation.variables;
  const isCurrentWrite = request?.userId === userId &&
    isAuthGenerationCurrent(request.authGeneration) &&
    writes.latest.get(JSON.stringify([userId, request?.id])) === request?.operationId;

  return {
    isFetching,
    writeState: request && isCurrentWrite
      ? { lessonId: request.id, status: mutation.status, error: mutation.error }
      : null,
    store,
    isError,
    refetch,
    getStatus,
    setStatus,
    setStatusWithOutcome,
    isLoaded: !loading && (!userId || isSuccess || isFetched),
  };
}

/**
 * All lessons are freely accessible — no sequential gating.
 * Kept as a no-op so existing call sites continue to compile.
 */
export function isUnlocked(
  _store: Record<string, LessonStatus>,
  _orderedIds: string[],
  _id: string,
): boolean {
  return true;
}
