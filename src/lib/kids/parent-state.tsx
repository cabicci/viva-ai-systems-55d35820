import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { KIDS_LEVELS, type KidsLevelId } from "./catalogue";
import { KIDS_FAMILY_POLICY } from "./family-policy";

export type KidsProfile = { id: string; level_id: KidsLevelId; display_name: string };
export type ParentState =
  | "signed-out"
  | "checking"
  | "pending"
  | "not-released"
  | "ready"
  | "unavailable";

function validProfile(value: unknown): value is KidsProfile {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.display_name === "string" &&
    KIDS_LEVELS.some((level) => level.id === row.level_id)
  );
}

/** Profile reads and creation only start after the server confirms privacy release and parent verification. */
export function useKidsParentState() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;
  const [state, setState] = useState<ParentState>("checking");
  const [profiles, setProfiles] = useState<KidsProfile[]>([]);
  const [verifiedUserId, setVerifiedUserId] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const requestEpoch = useRef(0);
  const refresh = useCallback(() => {
    requestEpoch.current += 1;
    setProfiles([]);
    setVerifiedUserId(null);
    setState("checking");
    setRevision((current) => current + 1);
  }, []);

  // A revoked parent approval must clear already rendered lesson content on return.
  useEffect(() => {
    if (!userId || authLoading) return;
    let lastCheck = 0;
    const recheck = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastCheck < 250) return; // focus and visibility often fire together
      lastCheck = now;
      refresh();
    };
    window.addEventListener("focus", recheck);
    document.addEventListener("visibilitychange", recheck);
    return () => {
      window.removeEventListener("focus", recheck);
      document.removeEventListener("visibilitychange", recheck);
    };
  }, [userId, authLoading, refresh]);

  useEffect(() => {
    let cancelled = false;
    const epoch = requestEpoch.current;
    setProfiles([]);
    setVerifiedUserId(null);
    if (authLoading) {
      setState("checking");
      return () => {
        cancelled = true;
      };
    }
    if (!userId) {
      setState("signed-out");
      return () => {
        cancelled = true;
      };
    }
    setState("checking");
    (async () => {
      // The RPC returns false when either release control or parent verification is absent.
      const { data, error } = await supabase.rpc("kids_parent_can_manage_profiles" as never);
      if (cancelled || epoch !== requestEpoch.current) return;
      if (error) {
        // The service has not been installed yet: show a closed launch state,
        // without inviting repeated retries or implying a problem with the account.
        setState(
          error.code === "PGRST202" || error.code === "42883" ? "not-released" : "unavailable",
        );
        return;
      }
      if (data !== true) {
        setState("pending");
        return;
      }
      const result = await supabase
        .from("kids_profiles" as never)
        .select("id, level_id, display_name")
        .eq("parent_id", userId);
      if (cancelled || epoch !== requestEpoch.current) return;
      if (result.error || !Array.isArray(result.data) || !result.data.every(validProfile)) {
        setState("unavailable");
        return;
      }
      setProfiles(result.data);
      setVerifiedUserId(userId);
      setState("ready");
    })().catch(() => {
      if (!cancelled && epoch === requestEpoch.current) setState("unavailable");
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, userId, revision]);

  const createProfile = useCallback(
    async (displayName: string, levelId: KidsLevelId) => {
      if (
        state !== "ready" ||
        verifiedUserId !== userId ||
        !user ||
        !KIDS_LEVELS.some((level) => level.id === levelId)
      ) {
        throw new Error("Kids parent approval is required");
      }
      const name = displayName.trim();
      if (profiles.length >= KIDS_FAMILY_POLICY.maxProfiles)
        throw new Error("Kids family profile limit reached");
      if (!name || name.length > 40) throw new Error("Invalid profile name");
      // RLS repeats both owner and server-side release/verification checks.
      const { error } = await supabase
        .from("kids_profiles" as never)
        .insert({ parent_id: user.id, display_name: name, level_id: levelId } as never);
      if (error) throw new Error("Unable to create Kids profile");
      refresh();
    },
    [state, verifiedUserId, userId, user, profiles.length, refresh],
  );

  const effectiveState: ParentState = authLoading
    ? "checking"
    : !userId
      ? "signed-out"
      : state === "ready" && verifiedUserId !== userId
        ? "checking"
        : state;
  return {
    state: effectiveState,
    profiles: effectiveState === "ready" ? profiles : [],
    refresh,
    createProfile,
  };
}
