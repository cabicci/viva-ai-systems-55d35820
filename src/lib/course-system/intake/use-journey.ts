import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { readCurriculumJourney } from "./functions";
import type { CurriculumJourneyInput } from "./client";

/** No shared private result survives an auth/subject/version/mount generation. */
export function useOwnedIntakeRead<T>(
  scope: string,
  load: (actor: string) => Promise<T>,
  enabled = true,
) {
  const auth = useAuth();
  const client = useQueryClient();
  const [revision, setRevision] = useState(0);
  const selection = useRef<{
    actor: string | undefined;
    generation: typeof auth.authGeneration;
    scope: string;
    client: typeof client;
    enabled: boolean;
    loading: boolean;
    revision: number;
  } | null>(null);
  const old = selection.current;
  if (
    !old ||
    old.actor !== auth.user?.id ||
    old.generation !== auth.authGeneration ||
    old.scope !== scope ||
    old.client !== client ||
    old.enabled !== enabled ||
    old.loading !== auth.loading ||
    old.revision !== revision
  ) {
    selection.current = {
      actor: auth.user?.id,
      generation: auth.authGeneration,
      scope,
      client,
      enabled,
      loading: auth.loading,
      revision,
    };
  }
  const frame = selection.current!;
  const latest = useRef({ auth, frame, load });
  latest.current = { auth, frame, load };
  const life = useRef<object | null>(null);
  const action = useRef<object | null>(null);
  const [view, setView] = useState<{
    frame: typeof frame;
    action: object;
    data?: T;
    error?: unknown;
  } | null>(null);
  useLayoutEffect(() => {
    const token = {};
    life.current = token;
    return () => {
      if (life.current === token) {
        life.current = null;
        action.current = null;
      }
    };
  }, []);
  const current = () => {
    const live = latest.current;
    return (
      life.current !== null &&
      live.frame === frame &&
      frame.enabled &&
      !frame.loading &&
      !!frame.actor &&
      !live.auth.loading &&
      live.auth.user?.id === frame.actor &&
      live.auth.authGeneration === frame.generation &&
      live.auth.isAuthGenerationCurrent(frame.generation)
    );
  };
  useEffect(() => {
    const token = {};
    action.current = token;
    const mounted = life.current;
    const owns = () => current() && action.current === token && life.current === mounted;
    queueMicrotask(() => {
      if (!owns()) return;
      void (async () => {
        try {
          const data = await latest.current.load(frame.actor!);
          if (owns()) setView((previous) => (owns() ? { frame, action: token, data } : previous));
        } catch (error) {
          if (owns()) setView((previous) => (owns() ? { frame, action: token, error } : previous));
        }
      })();
    });
    return () => {
      if (action.current === token) action.current = null;
    };
  }, [frame]);
  const owned = current() && view?.frame === frame && view.action === action.current ? view : null;
  return {
    data: owned?.data,
    error: owned?.error,
    isPending: !owned,
    isError: !!owned?.error,
    refetch: () => {
      if (current()) setRevision((n) => n + 1);
    },
  };
}

export function useCurriculumJourney(input: CurriculumJourneyInput) {
  const read = useServerFn(readCurriculumJourney);
  return useOwnedIntakeRead(JSON.stringify(["admitted-journey", input]), (actor) =>
    read({ data: { ...input, expectedAccountId: actor } }),
  );
}
