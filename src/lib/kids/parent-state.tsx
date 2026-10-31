import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/lib/auth-context";
import { KIDS_LEVELS, type KidsLevelId } from "./catalogue";
import { KIDS_FAMILY_POLICY } from "./family-policy";

export type KidsProfile = { id: string; level_id: KidsLevelId; display_name: string };
export type ParentState =
  "signed-out" | "checking" | "pending" | "not-released" | "ready" | "unavailable";

function validProfile(value: unknown): value is KidsProfile {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.display_name === "string" &&
    KIDS_LEVELS.some((level) => level.id === row.level_id)
  );
}

type ParentRequest = {
  generation: ReturnType<typeof useAuth>["authGeneration"];
  userId: string | undefined;
  authLoading: boolean;
  epoch: number;
  active: boolean;
};

type ParentSnapshot = {
  state: ParentState;
  profiles: KidsProfile[];
  owner: ParentRequest | null;
};

/**
 * Keep lazy SDK adoption behind the captured owner, including the microtask
 * that reads/invokes then. Box the response so resolving our Promise cannot
 * silently adopt another response thenable before the caller checks ownership.
 */
function awaitCurrentResponse<T>(
  pending: T | PromiseLike<T>, requireCurrent: () => void,
): Promise<{ value: T }> {
  return new Promise((resolve, reject) => {
    const fail = (error: unknown) => {
      // An eager native Promise may already be running/rejected. Observe only
      // its intrinsic rejection; never access a retired lazy builder's then.
      try { Reflect.apply(Promise.prototype.then, pending, [undefined, () => {}]); } catch {}
      reject(error);
    };
    try { requireCurrent(); } catch (error) { fail(error); return; }
    queueMicrotask(() => {
      try {
        requireCurrent();
        const then = pending !== null &&
          (typeof pending === "object" || typeof pending === "function")
          ? (pending as PromiseLike<T>).then
          : undefined;
        requireCurrent();
        if (typeof then !== "function") {
          resolve({ value: pending as T });
          return;
        }
        // No adoption gap after this check; preserve the builder's receiver.
        Reflect.apply(then, pending, [(value: T) => resolve({ value }), reject]);
      } catch (error) {
        fail(error);
      }
    });
  });
}


/** Profile reads and creation only start after the server confirms privacy release and parent verification. */
export function useKidsParentStateSource() {
  const { user, loading: authLoading, authGeneration, isAuthGenerationCurrent } = useAuth();
  const userId = user?.id;
  const [snapshot, setSnapshot] = useState<ParentSnapshot>({
    state: "checking", profiles: [], owner: null,
  });
  const [revision, setRevision] = useState(0);
  const requestEpoch = useRef(0);
  const request = useRef<ParentRequest | null>(null);
  const lastFocusCheck = useRef<{ generation: typeof authGeneration; time: number } | null>(null);

  // The auth ref invalidates before React renders or runs our effect cleanup.
  // Neither this local owner nor the auth generation grants server permission.
  const isCurrent = useCallback((captured: ParentRequest) =>
    captured.active && request.current === captured &&
    captured.epoch === requestEpoch.current &&
    isAuthGenerationCurrent(captured.generation), [isAuthGenerationCurrent]);

  const refreshRequest = useCallback((captured: ParentRequest) => {
    if (!isCurrent(captured)) return;
    requestEpoch.current += 1;
    request.current = null;
    setSnapshot({ state: "checking", profiles: [], owner: null });
    setRevision((current) => current + 1);
  }, [isCurrent]);

  useEffect(() => {
    const captured: ParentRequest = {
      generation: authGeneration, userId, authLoading,
      epoch: ++requestEpoch.current, active: true,
    };
    request.current = captured;
    const requireCurrent = () => {
      if (!isCurrent(captured)) throw new Error("Kids parent context is no longer current");
    };
    const publish = (state: ParentState, profiles: KidsProfile[] = []) => {
      if (!isCurrent(captured)) return;
      setSnapshot({ state, profiles, owner: captured });
    };
    const refresh = () => refreshRequest(captured);
    const recheck = () => {
      if (!isCurrent(captured) || document.visibilityState !== "visible") return;
      const now = Date.now();
      if (!isCurrent(captured)) return;
      const last = lastFocusCheck.current;
      if (last?.generation === captured.generation && now - last.time < 250) return;
      lastFocusCheck.current = { generation: captured.generation, time: now };
      refresh();
    };
    const listens = Boolean(userId && !authLoading && isCurrent(captured));
    const cleanup = () => {
      captured.active = false;
      if (request.current === captured) {
        request.current = null;
        requestEpoch.current += 1;
      }
      if (listens) {
        window.removeEventListener("focus", recheck);
        window.removeEventListener("kids-consent-changed", refresh);
        document.removeEventListener("visibilitychange", recheck);
      }
    };

    publish(authLoading ? "checking" : !userId ? "signed-out" : "checking");
    if (!userId || authLoading || !isCurrent(captured)) return cleanup;
    // Events are payload-free hints to recheck the server, not revocation proof.
    window.addEventListener("focus", recheck);
    window.addEventListener("kids-consent-changed", refresh);
    document.addEventListener("visibilitychange", recheck);
    (async () => {
      if (!isCurrent(captured)) return;
      // Only literal true permits the next scoped read.
      const manage = supabase.rpc<"kids_parent_can_manage_profiles">;
      if (!isCurrent(captured)) return;
      const pendingResponse = manage.call(supabase, "kids_parent_can_manage_profiles");
      const { value: response } = await awaitCurrentResponse(pendingResponse, requireCurrent);
      if (!isCurrent(captured)) return;
      const { data, error } = response;
      if (!isCurrent(captured)) return;
      if (error) {
        const code = error.code;
        publish(code === "PGRST202" || code === "42883" ? "not-released" : "unavailable");
        return;
      }
      if (data !== true) {
        publish("pending");
        return;
      }
      if (!isCurrent(captured)) return;
      const from = supabase.from;
      if (!isCurrent(captured)) return;
      const bind = from.bind<typeof from>;
      if (!isCurrent(captured)) return;
      const boundFrom = bind.call(from, supabase);
      if (!isCurrent(captured)) return;
      const table = boundFrom("kids_profiles");
      if (!isCurrent(captured)) return;
      const select = table.select;
      if (!isCurrent(captured)) return;
      const selected = select.call(table, "id, level_id, display_name");
      if (!isCurrent(captured)) return;
      const eq = selected.eq;
      if (!isCurrent(captured)) return;
      const pending = eq.call(selected, "parent_id", userId);
      const { value: result } = await awaitCurrentResponse(pending, requireCurrent);
      if (!isCurrent(captured)) return;
      const { data: rows, error: readError } = result;
      if (!isCurrent(captured)) return;
      const valid = !readError && Array.isArray(rows) && rows.every(validProfile);
      if (!isCurrent(captured)) return;
      if (!valid) {
        publish("unavailable");
        return;
      }
      publish("ready", rows as KidsProfile[]);
    })().catch(() => publish("unavailable"));
    return cleanup;
  }, [authGeneration, authLoading, userId, revision, isCurrent, refreshRequest]);

  const owner = snapshot.owner;
  const ownsView = () => owner !== null &&
    owner.generation === authGeneration && owner.userId === userId &&
    owner.authLoading === authLoading && isCurrent(owner);
  const refresh = useCallback(() => {
    if (owner && owner.generation === authGeneration && owner.userId === userId &&
      owner.authLoading === authLoading) refreshRequest(owner);
  }, [owner, authGeneration, userId, authLoading, refreshRequest]);
  const createProfile = async (
    displayName: string, levelId: KidsLevelId, consentPolicyId?: string,
  ) => {
    // A retired saved callback must reject, without starting another RPC.
    const requireCurrent = () => {
      if (!ownsView()) throw new Error("Kids parent context is no longer current");
    };
    requireCurrent();
    if (snapshot.state !== "ready" || !user ||
      !KIDS_LEVELS.some((level) => level.id === levelId)) {
      throw new Error("Kids parent approval is required");
    }
    const name = displayName.trim();
    if (snapshot.profiles.length >= KIDS_FAMILY_POLICY.maxProfiles)
      throw new Error("Kids family profile limit reached");
    if (!name || name.length > 40) throw new Error("Invalid profile name");
    if (!consentPolicyId) throw new Error("Child service consent is required");
    requireCurrent();
    try {
      // The server binds guardian, country, immutable policy and child atomically.
      // This local fence cannot undo an already-started remote mutation.
      const create = supabase.rpc<
        "kids_parent_create_consented_profile",
        Database["public"]["Functions"]["kids_parent_create_consented_profile"]["Args"]
      >;
      requireCurrent();
      const pendingResponse = create.call(
        supabase, "kids_parent_create_consented_profile",
        {
          p_display_name: name,
          p_level_id: levelId,
          p_policy_id: consentPolicyId,
          p_accepted: true,
        },
      );
      const { value: response } = await awaitCurrentResponse(pendingResponse, requireCurrent);
      requireCurrent();
      const { error } = response;
      requireCurrent();
      if (error) throw new Error("Unable to create Kids profile");
    } catch (error) {
      requireCurrent();
      throw error;
    }
    if (owner) refreshRequest(owner);
  };
  const effectiveState = (): ParentState => authLoading
    ? "checking"
    : !userId
      ? "signed-out"
      : !ownsView()
        ? "checking"
        : snapshot.state;
  return {
    // Getters also protect a previously returned API before effect cleanup.
    get state() { return effectiveState(); },
    get profiles() { return effectiveState() === "ready" ? snapshot.profiles : []; },
    refresh,
    createProfile,
  };
}

export const KidsParentStateContext = createContext<ReturnType<
  typeof useKidsParentStateSource
> | null>(null);

export function useKidsParentState() {
  const value = useContext(KidsParentStateContext);
  if (!value) throw new Error("Kids parent state requires the Kids route provider");
  return value;
}
