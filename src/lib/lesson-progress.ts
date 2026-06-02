import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export type LessonStatus = "not-started" | "in-progress" | "completed";

type Store = Record<string, LessonStatus>;

const QK = ["lesson-progress"] as const;

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
  const { user, loading } = useAuth();
  const userId = user?.id ?? null;
  const qc = useQueryClient();

  const { data: store = {}, isSuccess, isFetched } = useQuery({
    queryKey: [...QK, userId],
    queryFn: () => fetchProgress(userId),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LessonStatus }) => {
      if (!userId) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("lesson_progress")
        .upsert(
          { user_id: userId, lesson_id: id, status },
          { onConflict: "user_id,lesson_id" },
        );
      if (error) throw error;
      // user_lesson_status is kept in sync by a DB trigger
      // (sync_lesson_status_mirror). No client-side mirror needed.
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: [...QK, userId] });
      const prev = qc.getQueryData<Store>([...QK, userId]) ?? {};
      qc.setQueryData<Store>([...QK, userId], { ...prev, [id]: status });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData([...QK, userId], ctx.prev);
    },
    // No onSettled invalidate: optimistic cache is the source of truth
    // until the next natural refetch (staleTime). Avoids a refetch
    // round-trip on every lesson click.
  });

  const setStatus = React.useCallback(
    (id: string, status: LessonStatus) => {
      mutation.mutate({ id, status });
    },
    [mutation],
  );

  const getStatus = React.useCallback(
    (id: string): LessonStatus => store[id] ?? "not-started",
    [store],
  );

  return {
    store,
    getStatus,
    setStatus,
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