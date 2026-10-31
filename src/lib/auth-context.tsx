import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { syncAccessTokenCookie } from "@/lib/auth-access-token-cookie";
import { captureError, captureWarn } from "@/lib/error-capture";
import { requestAccountWelcome } from "@/lib/account-welcome.functions";

const DEVICE_KEY = "lovable.device_id";

// Silence cosmetic supabase-js refresh-token console noise (e.g. anonymous
// visitors with a stale local token). Real auth errors still surface via
// onAuthStateChange / signIn responses. Browser-only, install once.
if (
  typeof window !== "undefined" &&
  !(window as { __vivaAuthNoiseFilter?: boolean }).__vivaAuthNoiseFilter
) {
  (window as { __vivaAuthNoiseFilter?: boolean }).__vivaAuthNoiseFilter = true;
  const origError = console.error.bind(console);
  const NOISY =
    /(Invalid Refresh Token|refresh_token_not_found|Refresh Token Not Found|Auth session missing)/i;
  console.error = (...args: unknown[]) => {
    try {
      const msg = args
        .map((a) => {
          if (a instanceof Error) return a.message;
          if (typeof a === "string") return a;
          try {
            return JSON.stringify(a);
          } catch {
            return String(a);
          }
        })
        .join(" ");
      if (NOISY.test(msg)) return;
    } catch {
      /* fall through */
    }
    origError(...args);
  };
}

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
    id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

/** Per-provider local equality hint. It is neither a token nor a permission epoch. */
export type AuthGeneration = Readonly<{ value: number }>;

/** Local uninterrupted-principal observation for UI text only, never async authority or server-session identity. */
export type AuthContinuity = Readonly<{ continuity: number }>;
type AuthCtx = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  authGeneration: AuthGeneration;
  authContinuity: AuthContinuity;
  isAuthGenerationCurrent: (captured: AuthGeneration) => boolean;
  authError: "session_unavailable" | "invalid_session" | null;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
  authGeneration: Object.freeze({ value: 0 }),
  authContinuity: Object.freeze({ continuity: 0 }),
  isAuthGenerationCurrent: () => false,
  authError: null,
});

type Claim = { generation: AuthGeneration; started: boolean; promise: Promise<void> };
type AuthControl = {
  defer: (captured: AuthGeneration, work: () => void, cancelled?: () => void) => () => void;
  signOut: (captured: AuthGeneration, scope?: "local") => Promise<void>;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<AuthCtx["authError"]>(null);
  const generationRef = useRef<AuthGeneration>(Object.freeze({ value: 0 }));
  const [authGeneration, setAuthGeneration] = useState(generationRef.current);
  const continuityRef = useRef<AuthContinuity>(Object.freeze({ continuity: 0 }));
  const [authContinuity, setAuthContinuity] = useState(continuityRef.current);
  const lifecycle = useRef<object | null>(null);
  const observation = useRef(0);
  const currentSession = useRef<Session | null>(null);
  const control = useRef<AuthControl | null>(null);
  const claimedUserIds = useRef<Set<string>>(new Set());
  const claimPromises = useRef<Map<string, Claim>>(new Map());
  const welcomeAttempted = useRef<Set<string>>(new Set());

  const isAuthGenerationCurrent = useCallback((captured: AuthGeneration) =>
    lifecycle.current !== null && generationRef.current === captured, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const life = {};
    lifecycle.current = life;
    const live = () => lifecycle.current === life;
    const current = (captured: AuthGeneration) => live() && generationRef.current === captured;
    const rotate = () => {
      generationRef.current = Object.freeze({ value: generationRef.current.value + 1 });
      return generationRef.current;
    };
    const breakContinuity = () => {
      continuityRef.current = Object.freeze({ continuity: continuityRef.current.continuity + 1 });
      return continuityRef.current;
    };
    const clearClaims = () => {
      claimedUserIds.current.clear();
      claimPromises.current.clear();
      welcomeAttempted.current.clear();
    };
    // StrictMode replay is a new local lifecycle even though React retains refs/state.
    const initialGeneration = rotate();
    setAuthContinuity(breakContinuity());
    observation.current += 1;
    currentSession.current = null;
    clearClaims();
    setAuthGeneration(initialGeneration);
    setSession(null);
    setLoading(true);
    setAuthError(null);
    let nonInitialObserved = false;
    let logoutIntent: AuthGeneration | null = null;
    const jobs = new Map<ReturnType<typeof setTimeout>, () => void>();
    const defer: AuthControl["defer"] = (captured, work, cancelled = () => {}) => {
      if (!current(captured)) { cancelled(); return () => {}; }
      // SDK work stays outside onAuthStateChange's synchronous, SDK-lock-held callback.
      const handle = setTimeout(() => {
        jobs.delete(handle);
        if (current(captured)) work();
        else cancelled();
      }, 0);
      jobs.set(handle, cancelled);
      return () => {
        if (!jobs.has(handle)) return;
        clearTimeout(handle);
        jobs.delete(handle);
        cancelled();
      };
    };
    const sdkSignOut = (captured: AuthGeneration, scope?: "local") => new Promise<void>((resolve, reject) => {
      defer(captured, () => {
        if (!current(captured)) { resolve(); return; }
        try {
          const pending = scope === "local" ? supabase.auth.signOut({ scope: "local" }) : supabase.auth.signOut();
          // No cookie/state/log continuation: a later login must never be cleared here.
          void Promise.resolve(pending).then(() => resolve(), reject);
        } catch (error) { reject(error); }
      }, resolve);
    });
    const registerClaim = (userId: string, captured: AuthGeneration) => {
      if (!current(captured)) return;
      const old = claimPromises.current.get(userId);
      // Already-started same-user claims are not duplicated on refresh/repeated SIGNED_IN.
      if (claimedUserIds.current.has(userId) || old?.started || old?.generation === captured) return;
      let settle!: () => void;
      const entry: Claim = { generation: captured, started: false, promise: new Promise<void>(resolve => { settle = resolve; }) };
      // Register before publishing state, so the watcher can never overtake the claim.
      claimPromises.current.set(userId, entry);
      defer(captured, () => {
        if (!current(captured) || currentSession.current?.user.id !== userId) { settle(); return; }
        try {
          const deviceId = getDeviceId();
          if (!current(captured)) { settle(); return; }
          entry.started = true;
          claimedUserIds.current.add(userId);
          const pending = supabase.rpc("claim_active_device", { p_device_id: deviceId });
          void Promise.resolve(pending).then(({ error }) => {
            if (error && current(captured)) captureError("auth:claim_active_device", { reason: "device claim failed" });
          }, () => {
            if (current(captured)) captureError("auth:claim_active_device", { reason: "device claim failed" });
          }).then(settle, settle);
        } catch {
          if (current(captured)) captureError("auth:claim_active_device", { reason: "device claim failed" });
          settle();
        }
      }, settle);
    };
    const publish = (nextSession: Session | null, event: string, seen: number, error: AuthCtx["authError"] = null) => {
      if (!live() || observation.current !== seen) return;
      const invalid = !!nextSession?.access_token && nextSession.access_token.split(".").length !== 3;
      const nextSessionValue = invalid ? null : nextSession;
      const previousId = currentSession.current?.user.id;
      const nextId = nextSessionValue?.user.id;
      // SIGNED_IN may be repeated by the SDK. Rotate a conservative LOCAL hint;
      // it does not prove a new server session, and does not reset same-user claim/welcome suppression.
      const captured = previousId !== nextId || !nextSessionValue || event === "SIGNED_IN" ? rotate() : generationRef.current;
      // Observe every principal break synchronously, including transitions React may coalesce.
      if (previousId !== nextId || !nextSessionValue) {
        breakContinuity();
        clearClaims();
      }
      setAuthContinuity(continuityRef.current);
      currentSession.current = nextSessionValue;
      logoutIntent = invalid ? captured : null;
      const frame = () => current(captured) && observation.current === seen;
      if (nextId && frame()) registerClaim(nextId, captured);
      if (frame()) syncAccessTokenCookie(nextSessionValue?.access_token ?? null);
      if (frame()) setSession(nextSessionValue);
      if (frame()) setLoading(false);
      if (frame()) setAuthError(invalid ? "invalid_session" : error);
      if (frame()) setAuthGeneration(captured);
      if (invalid && frame()) void sdkSignOut(captured).catch(() => {
        if (current(captured)) captureWarn("auth:invalid_session", { reason: "local session cleanup deferred" });
      });
    };
    const localControl: AuthControl = {
      defer,
      signOut: (expected, scope) => {
        if (!current(expected)) return Promise.resolve();
        const seen = ++observation.current;
        const captured = rotate();
        currentSession.current = null;
        logoutIntent = captured;
        setAuthContinuity(breakContinuity());
        clearClaims();
        const frame = () => current(captured) && observation.current === seen;
        // Intent invalidates synchronously, before any SDK promise or callback can complete.
        if (frame()) syncAccessTokenCookie(null);
        if (frame()) setSession(null);
        if (frame()) setLoading(false);
        if (frame()) setAuthError(null);
        if (frame()) setAuthGeneration(captured);
        return sdkSignOut(captured, scope);
      },
    };
    control.current = localControl;
    const bootstrapObservation = observation.current;
    const bootstrapGeneration = generationRef.current;
    const bootstrapCurrent = () => current(bootstrapGeneration) && observation.current === bootstrapObservation;
    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!live()) return;
      const seen = ++observation.current;
      // The initial SDK notification is another bootstrap source, never a rollback after a later event.
      if (event === "INITIAL_SESSION" && nonInitialObserved) return;
      if (event !== "INITIAL_SESSION") nonInitialObserved = true;
      // A refresh/initial snapshot cannot silently undo a local logout intent. Explicit sign-in is fresh.
      if (logoutIntent && nextSession && event !== "SIGNED_IN") return;
      publish(event === "SIGNED_OUT" ? null : nextSession, event, seen);
    });
    if (bootstrapCurrent()) {
      try {
        void Promise.resolve(supabase.auth.getSession()).then(({ data, error }) => {
          if (!bootstrapCurrent()) return;
          publish(error ? null : data.session, "bootstrap", bootstrapObservation, error ? "session_unavailable" : null);
        }, () => {
          if (!bootstrapCurrent()) return;
          publish(null, "bootstrap", bootstrapObservation, "session_unavailable");
        });
      } catch {
        if (bootstrapCurrent()) publish(null, "bootstrap", bootstrapObservation, "session_unavailable");
      }
    }
    return () => {
      if (live()) {
        lifecycle.current = null;
        observation.current += 1;
        rotate();
        breakContinuity();
        currentSession.current = null;
        clearClaims();
        if (control.current === localControl) control.current = null;
      }
      for (const [handle, cancelled] of jobs) { clearTimeout(handle); cancelled(); }
      jobs.clear();
      sub.subscription.unsubscribe();
    };
  }, []);

  // Welcome remains non-blocking and idempotent for the current confirmed user.
  useEffect(() => {
    const userId = session?.user?.id;
    const captured = authGeneration;
    if (!userId || !session.user.email_confirmed_at || !isAuthGenerationCurrent(captured) || welcomeAttempted.current.has(userId)) return;
    return control.current?.defer(captured, () => {
      if (!isAuthGenerationCurrent(captured) || currentSession.current?.user.id !== userId || welcomeAttempted.current.has(userId)) return;
      welcomeAttempted.current.add(userId);
      try {
        void Promise.resolve(requestAccountWelcome()).catch(() => {
          if (isAuthGenerationCurrent(captured)) captureWarn("auth:welcome_deferred", { reason: "scheduled retry retained" });
        });
      } catch {
        if (isAuthGenerationCurrent(captured)) captureWarn("auth:welcome_deferred", { reason: "scheduled retry retained" });
      }
    });
  }, [session?.user?.id, session?.user?.email_confirmed_at, authGeneration, isAuthGenerationCurrent]);

  // Keep claim-before-check and local-only displaced-session signout. Captures include
  // the incarnation hint, so a same-UUID out/in cannot keep an old watcher alive.
  useEffect(() => {
    const userId = session?.user?.id;
    const captured = authGeneration;
    if (!userId || !isAuthGenerationCurrent(captured)) return;
    const pending = claimPromises.current.get(userId)?.promise;
    if (!pending) return;
    let cancelled = false;
    let claimSettled = false;
    const current = () => !cancelled && isAuthGenerationCurrent(captured) && currentSession.current?.user.id === userId;
    let deviceId: string;
    try { deviceId = getDeviceId(); }
    catch { return; }
    const enforce = (rowDeviceId: string | null | undefined) => {
      if (!current() || !claimSettled || !rowDeviceId || rowDeviceId === deviceId) return;
      captureWarn("auth:active_device_mismatch", { reason: "another device claimed the session — signing out" });
      if (!current()) return;
      void control.current?.signOut(captured, "local").catch(() => {
        // No stale logging or cookie cleanup when a newer context has arrived.
        if (isAuthGenerationCurrent(captured)) captureWarn("auth:device_signout", { reason: "local signout deferred" });
      });
    };
    void pending.then(() => {
      if (!current()) return;
      claimSettled = true;
      try {
        if (!current()) return;
        const query = supabase.from("user_active_device");
        if (!current()) return;
        const selected = query.select("device_id");
        if (!current()) return;
        const scoped = selected.eq("user_id", userId);
        if (!current()) return;
        void Promise.resolve(scoped.maybeSingle()).then(({ data }) => {
          if (current()) enforce(data?.device_id);
        }, () => {});
      } catch { /* Existing best-effort watcher; no invented permission from query failure. */ }
    });
    let channel: ReturnType<typeof supabase.channel> | undefined;
    const cancelChannel = control.current?.defer(captured, () => {
      try {
        if (current()) channel = supabase.channel(`uad:${userId}`);
        if (current() && channel) channel.on("postgres_changes", {
          event: "*", schema: "public", table: "user_active_device", filter: `user_id=eq.${userId}`,
        }, payload => {
          if (!current()) return;
          const row = (payload.new ?? payload.old) as { device_id?: string } | null;
          enforce(row?.device_id);
        });
        if (current() && channel) channel.subscribe();
      } catch { /* No signout or authority inference from subscription failure. */ }
    });
    return () => {
      cancelled = true;
      cancelChannel?.();
      // This is cleanup of this effect's exact owned resource, never the new watcher's channel.
      if (channel) {
        try { void Promise.resolve(supabase.removeChannel(channel)).catch(() => {}); }
        catch { /* already removed */ }
      }
    };
  }, [session?.user?.id, authGeneration, isAuthGenerationCurrent]);

  const signOut = useCallback(() => control.current?.signOut(authGeneration) ?? Promise.resolve(), [authGeneration]);
  return (
    <Ctx.Provider value={{ user: session?.user ?? null, session, loading, signOut,
      authGeneration, authContinuity, isAuthGenerationCurrent, authError }}>
      {children}
    </Ctx.Provider>
  );
}
export const useAuth = () => useContext(Ctx);
