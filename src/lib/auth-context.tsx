import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { captureError } from "@/lib/error-capture";

const DEVICE_KEY = "lovable.device_id";

function getDeviceId(): string {
  // Called only from client-side effects (signIn/onAuthStateChange), so we
  // throw on SSR rather than returning "" — an empty id would fail the
  // server-side length check anyway, but a sentinel here makes the misuse
  // obvious instead of letting it silently no-op.
  if (typeof window === "undefined") {
    throw new Error("getDeviceId called on the server");
  }
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({ user: null, session: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Track which user ids we've already claimed the active-device row for,
  // so token refreshes / tab focus events don't re-fire `claim_active_device`.
  const claimedUserIds = useRef<Set<string>>(new Set());
  // Promise that resolves once the claim RPC for the current user finished,
  // so the device-watcher effect won't read a stale row mid-login and sign us out.
  const claimPromises = useRef<Map<string, Promise<void>>>(new Map());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => {
      // Guard against malformed/legacy tokens that would later trip
      // "Invalid Compact JWS" on the server. A real Supabase JWT has 3
      // dot-separated segments — anything else means a stale storage row.
      if (s?.access_token && s.access_token.split(".").length !== 3) {
        supabase.auth.signOut();
        setSession(null);
        setLoading(false);
        return;
      }
      setSession(s);
      setLoading(false);
      if (e === "SIGNED_IN" && s?.user && !claimedUserIds.current.has(s.user.id)) {
        claimedUserIds.current.add(s.user.id);
        const deviceId = getDeviceId();
        const p = Promise.resolve(
          supabase.rpc("claim_active_device", { p_device_id: deviceId }),
        ).then(({ error }) => {
          if (error) captureError("auth:claim_active_device", error);
        });
        claimPromises.current.set(s.user.id, p);

      }
      if (e === "SIGNED_OUT") {
        claimedUserIds.current.clear();
        claimPromises.current.clear();
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      const s = data.session;
      if (s?.access_token && s.access_token.split(".").length !== 3) {
        supabase.auth.signOut();
        setSession(null);
      } else {
        setSession(s);
        // Also claim the device on initial load — otherwise the device
        // watcher reads a stale row (from a previous device/origin) and
        // signs the user out right after the page loads.
        if (s?.user && !claimedUserIds.current.has(s.user.id)) {
          claimedUserIds.current.add(s.user.id);
          const deviceId = getDeviceId();
          const p = Promise.resolve(
            supabase.rpc("claim_active_device", { p_device_id: deviceId }),
          ).then(({ error }) => {
            if (error) captureError("auth:claim_active_device", error);
          });
          claimPromises.current.set(s.user.id, p);
        }
      }
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Watch active device row; sign out if another device claims the session.
  useEffect(() => {
    if (!session?.user) return;
    const userId = session.user.id;
    const deviceId = getDeviceId();
    let cancelled = false;

    const check = (rowDeviceId: string | null | undefined) => {
      if (cancelled) return;
      if (rowDeviceId && rowDeviceId !== deviceId) {
        toast.error("تم تسجيل دخولك من جهاز تاني، هتطلع من هنا.");
        supabase.auth.signOut();
      }
    };

    // Wait for any in-flight claim from this tab to finish before reading the
    // row — otherwise we race the claim, see the previous device's id, and
    // sign ourselves out right after a successful login.
    const pending = claimPromises.current.get(userId) ?? Promise.resolve();
    pending.then(() => {
      if (cancelled) return;
      supabase
        .from("user_active_device")
        .select("device_id")
        .eq("user_id", userId)
        .maybeSingle()
        .then(({ data }) => check(data?.device_id));
    });

    const channel = supabase
      .channel(`uad:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_active_device", filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as { device_id?: string } | null;
          check(row?.device_id);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);


  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        signOut: async () => { await supabase.auth.signOut(); },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
