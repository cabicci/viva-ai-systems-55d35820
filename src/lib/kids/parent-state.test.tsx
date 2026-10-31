import { act, cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KidsParentStateProvider } from "./KidsParentStateProvider";
import { useKidsParentState } from "./parent-state";

const mock = vi.hoisted(() => ({
  useAuth: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  authRef: { current: Object.freeze({ value: 0 }) as Readonly<{ value: number }> },
  isCurrent: (captured: { value: number }) => captured === mock.authRef.current,
}));
vi.mock("@/lib/auth-context", () => ({ useAuth: mock.useAuth }));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: mock.rpc, from: mock.from },
}));

beforeEach(() => {
  mock.useAuth.mockReset();
  mock.rpc.mockReset();
  mock.from.mockReset();
  mock.authRef.current = Object.freeze({ value: 0 });
  setAuth();
});

afterEach(() => cleanup());

function wrapper({ children }: { children: ReactNode }) {
  return <KidsParentStateProvider>{children}</KidsParentStateProvider>;
}

function renderParentState() {
  return renderHook(() => useKidsParentState(), { wrapper });
}

describe("Kids parent privacy gate", () => {
  it("shares the verified parent state when a lesson view is replaced", async () => {
    mock.rpc.mockResolvedValue({ data: true, error: null });
    mock.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    function LessonView({ name }: { name: string }) {
      const { state } = useKidsParentState();
      return <span>{`${name}: ${state}`}</span>;
    }
    const { rerender } = render(
      <KidsParentStateProvider>
        <LessonView key="first" name="First lesson" />
      </KidsParentStateProvider>,
    );
    await screen.findByText("First lesson: ready");
    rerender(
      <KidsParentStateProvider>
        <LessonView key="second" name="Second lesson" />
      </KidsParentStateProvider>,
    );
    expect(screen.getByText("Second lesson: ready")).toHaveProperty("isConnected", true);
    expect(mock.rpc).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
  });

  it("blocks a fourth profile before sending child data", async () => {
    mock.rpc.mockResolvedValue({ data: true, error: null });
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [1, 2, 3].map((n) => ({
          id: `profile-${n}`,
          level_id: "level-1",
          display_name: "Explorer",
        })),
        error: null,
      }),
      insert: vi.fn(),
    };
    mock.from.mockReturnValue(query);
    const { result } = renderParentState();
    await waitFor(() => expect(result.current.state).toBe("ready"));
    await expect(result.current.createProfile("Fourth", "level-1")).rejects.toThrow("limit");
    expect(query.insert).not.toHaveBeenCalled();
  });
  it("does not request child profiles or collect child data when release or verification is absent", async () => {
    mock.rpc.mockResolvedValue({ data: false, error: null });
    const { result } = renderParentState();
    await waitFor(() => expect(result.current.state).toBe("pending"));
    expect(mock.rpc).toHaveBeenCalledWith("kids_parent_can_manage_profiles");
    expect(mock.from).not.toHaveBeenCalled();
    await expect(result.current.createProfile("Child", "level-1")).rejects.toThrow();
    expect(mock.from).not.toHaveBeenCalled();
  });

  it("shows a closed setup state when the Kids RPC has not been deployed", async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { code: "PGRST202", message: "RPC missing" } });
    const { result } = renderParentState();
    await waitFor(() => expect(result.current.state).toBe("not-released"));
    expect(mock.from).not.toHaveBeenCalled();
    await expect(result.current.createProfile("Child", "level-1")).rejects.toThrow();
  });

  it("keeps unexpected server failures distinct and fails closed", async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { code: "503", message: "RPC unavailable" } });
    const { result } = renderParentState();
    await waitFor(() => expect(result.current.state).toBe("unavailable"));
    expect(mock.from).not.toHaveBeenCalled();
  });

  it("never queries parent data when signed out", async () => {
    setAuth(null);
    const { result } = renderParentState();
    await waitFor(() => expect(result.current.state).toBe("signed-out"));
    expect(mock.rpc).not.toHaveBeenCalled();
    expect(mock.from).not.toHaveBeenCalled();
  });

  it("reads only the verified parent's profiles after the server grants access", async () => {
    mock.rpc.mockResolvedValue({ data: true, error: null });
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ id: "profile-1", level_id: "level-1", display_name: "Explorer" }],
        error: null,
      }),
    };
    mock.from.mockReturnValue(query);
    const { result } = renderParentState();
    await waitFor(() => expect(result.current.state).toBe("ready"));
    expect(mock.from).toHaveBeenCalledWith("kids_profiles");
    expect(query.eq).toHaveBeenCalledWith("parent_id", "parent-1");
    expect(result.current.profiles).toHaveLength(1);
    await act(async () => {
      result.current.refresh();
    });
  });

  it("clears a previously open profile on tab focus and denies it after parent approval is revoked", async () => {
    let resolveRevocation!: (value: { data: boolean; error: null }) => void;
    mock.rpc.mockResolvedValueOnce({ data: true, error: null });
    mock.rpc.mockImplementationOnce(
      () =>
        new Promise<{ data: boolean; error: null }>((resolve) => {
          resolveRevocation = resolve;
        }),
    );
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ id: "profile-1", level_id: "level-1", display_name: "Explorer" }],
        error: null,
      }),
    };
    mock.from.mockReturnValue(query);
    const { result } = renderParentState();
    await waitFor(() => expect(result.current.state).toBe("ready"));
    expect(result.current.profiles).toHaveLength(1);

    act(() => window.dispatchEvent(new Event("focus")));
    expect(result.current.state).toBe("checking");
    expect(result.current.profiles).toEqual([]);
    expect(mock.rpc).toHaveBeenCalledTimes(2);
    await act(async () => resolveRevocation({ data: false, error: null }));
    await waitFor(() => expect(result.current.state).toBe("pending"));
    expect(mock.from).toHaveBeenCalledTimes(1);
    expect(result.current.profiles).toEqual([]);
  });
});

type Outcome = { data: unknown; error: null | { code?: string; message?: string } };
function deferred<T = Outcome>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const child = { id: "synthetic-child", level_id: "level-1", display_name: "Explorer" };
function setAuth(userId: string | null = "parent-1", loading = false) {
  mock.useAuth.mockReturnValue({
    user: userId ? { id: userId } : null, loading,
    authGeneration: mock.authRef.current,
    isAuthGenerationCurrent: mock.isCurrent,
  });
}
function replaceAuth(userId: string | null = "parent-1", loading = false) {
  mock.authRef.current = Object.freeze({ value: mock.authRef.current.value + 1 });
  setAuth(userId, loading);
}
function profileQuery(response: Outcome | Promise<Outcome> = { data: [child], error: null }) {
  const query = { select: vi.fn(), eq: vi.fn() };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(response);
  return query;
}
function allowRead(rows: unknown = [child]) {
  mock.rpc.mockResolvedValue({ data: true, error: null });
  const query = profileQuery({ data: rows, error: null });
  mock.from.mockReturnValue(query);
  return query;
}
async function ready(result: { current: ReturnType<typeof useKidsParentState> }) {
  await waitFor(() => expect(result.current.state).toBe("ready"));
}
async function settle(work: () => void) {
  await act(async () => { work(); await Promise.resolve(); });
}

describe("Kids parent request and auth-generation currentness", () => {
  it("masks a saved ready API synchronously before a same-UUID rerender or effect cleanup", async () => {
    allowRead();
    const { result, rerender } = renderParentState();
    await ready(result);
    const old = result.current;
    const refresh = old.refresh;
    const create = old.createProfile;
    replaceAuth();
    expect(old.state).toBe("checking");
    expect(old.profiles).toEqual([]);
    act(() => refresh());
    await expect(create("Child", "level-1", "synthetic-policy")).rejects.toThrow("no longer current");
    expect(mock.rpc).toHaveBeenCalledTimes(1);
    const next = deferred();
    mock.rpc.mockReturnValueOnce(next.promise);
    rerender();
    expect(result.current.state).toBe("checking");
    expect(result.current.profiles).toEqual([]);
    await settle(() => next.resolve({ data: false, error: null }));
    expect(result.current.state).toBe("pending");
    expect(mock.from).toHaveBeenCalledTimes(1);
  });

  it.each(["true", "false", "PGRST202", "42883", "503", "malformed", "reject"])(
    "discards stale manage %s after a new same-UUID request is ready",
    async (outcome) => {
      const old = deferred();
      mock.rpc.mockReturnValueOnce(old.promise);
      allowRead();
      // Preserve the first deferred invocation, then serve the replacement.
      mock.rpc.mockReset().mockReturnValueOnce(old.promise).mockResolvedValue({ data: true, error: null });
      const { result, rerender } = renderParentState();
      replaceAuth();
      rerender();
      await ready(result);
      const current = result.current;
      await settle(() => {
        if (outcome === "reject") old.reject(new Error("synthetic-manage-reject"));
        else old.resolve({
          data: outcome === "true" ? true : outcome === "false" ? false : outcome === "malformed" ? "true" : null,
          error: ["PGRST202", "42883", "503"].includes(outcome) ? { code: outcome } : null,
        });
      });
      expect(result.current).toBe(current);
      expect(result.current.state).toBe("ready");
      expect(result.current.profiles).toEqual([child]);
      expect(mock.from).toHaveBeenCalledTimes(1);
      expect(mock.rpc).toHaveBeenCalledTimes(2);
    },
  );

  it.each(["success", "malformed-level", "malformed-data", "error", "reject"])(
    "discards stale profile %s after same-UUID replacement",
    async (outcome) => {
      const old = deferred();
      allowRead();
      mock.from.mockReturnValueOnce(profileQuery(old.promise)).mockReturnValue(profileQuery());
      const { result, rerender } = renderParentState();
      await waitFor(() => expect(mock.from).toHaveBeenCalledTimes(1));
      replaceAuth();
      rerender();
      await ready(result);
      const current = result.current;
      await settle(() => {
        if (outcome === "reject") old.reject(new Error("synthetic-profile-reject"));
        else old.resolve({
          data: outcome === "malformed-level" ? [{ ...child, level_id: "unknown" }]
            : outcome === "malformed-data" ? {} : [{ ...child, id: "old-child" }],
          error: outcome === "error" ? { code: "503" } : null,
        });
      });
      expect(result.current).toBe(current);
      expect(result.current.profiles).toEqual([child]);
      expect(mock.rpc).toHaveBeenCalledTimes(2);
    },
  );

  it.each(["resolve", "reject"])(
    "blocks pending manage %s immediately after logout intent without a rerender",
    async (outcome) => {
      const old = deferred();
      mock.rpc.mockReturnValue(old.promise);
      const { result } = renderParentState();
      replaceAuth(null);
      await settle(() => outcome === "reject"
        ? old.reject(new Error("synthetic-logout-race"))
        : old.resolve({ data: true, error: null }));
      expect(mock.from).not.toHaveBeenCalled();
      expect(result.current.state).toBe("checking");
      expect(result.current.profiles).toEqual([]);
    },
  );

  it("keeps different-user reads scoped and discards the retired parent's manage success", async () => {
    const old = deferred();
    allowRead();
    mock.rpc.mockReset().mockReturnValueOnce(old.promise).mockResolvedValue({ data: true, error: null });
    const query = profileQuery();
    mock.from.mockReturnValue(query);
    const { result, rerender } = renderParentState();
    replaceAuth("parent-2");
    rerender();
    await ready(result);
    await settle(() => old.resolve({ data: true, error: null }));
    expect(query.eq).toHaveBeenCalledExactlyOnceWith("parent_id", "parent-2");
  });

  it.each(["manage", "profiles"])("isolates unmount/remount during pending %s", async (stage) => {
    const old = deferred();
    allowRead();
    if (stage === "manage") mock.rpc.mockReturnValueOnce(old.promise);
    else mock.from.mockReturnValueOnce(profileQuery(old.promise));
    const first = renderParentState();
    if (stage === "profiles") await waitFor(() => expect(mock.from).toHaveBeenCalledTimes(1));
    const retired = first.result.current;
    first.unmount();
    const second = renderParentState();
    await ready(second.result);
    const count = mock.from.mock.calls.length;
    await settle(() => old.resolve({ data: stage === "manage" ? true : [{ ...child, id: "retired" }], error: null }));
    expect(mock.from).toHaveBeenCalledTimes(count);
    expect(second.result.current.profiles).toEqual([child]);
    expect(retired.profiles).toEqual([]);
    act(() => retired.refresh());
    expect(mock.from).toHaveBeenCalledTimes(count);
  });

  it("isolates effect replay in StrictMode and never advances the retired request", async () => {
    const first = deferred();
    const second = deferred();
    mock.rpc.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    mock.from.mockReturnValue(profileQuery());
    const { result } = renderHook(() => useKidsParentState(), {
      reactStrictMode: true,
      wrapper: ({ children }: { children: ReactNode }) =>
        <StrictMode><KidsParentStateProvider>{children}</KidsParentStateProvider></StrictMode>,
    });
    expect(mock.rpc).toHaveBeenCalledTimes(2);
    await settle(() => first.resolve({ data: true, error: null }));
    expect(mock.from).not.toHaveBeenCalled();
    expect(result.current.state).toBe("checking");
    await settle(() => second.resolve({ data: true, error: null }));
    await ready(result);
    expect(mock.from).toHaveBeenCalledTimes(1);
  });

  it.each(["from", "select", "eq", "select-getter", "eq-getter"])(
    "stops a query-builder chain invalidated by %s reentrancy",
    async (step) => {
      const select = vi.fn();
      const eq = vi.fn().mockReturnValue({ data: [child], error: null });
      const query = { select, eq };
      select.mockReturnValue(query);
      if (step === "from") mock.from.mockImplementation(() => { replaceAuth(); return query; });
      else mock.from.mockReturnValue(query);
      if (step === "select") select.mockImplementation(() => { replaceAuth(); return query; });
      if (step === "eq") eq.mockImplementation(() => { replaceAuth(); return { data: [child], error: null }; });
      if (step === "select-getter") Object.defineProperty(query, "select", {
        get() { replaceAuth(); return select; },
      });
      if (step === "eq-getter") Object.defineProperty(query, "eq", {
        get() { replaceAuth(); return eq; },
      });
      mock.rpc.mockResolvedValue({ data: true, error: null });
      const { result } = renderParentState();
      await waitFor(() => expect(mock.from).toHaveBeenCalledTimes(1));
      expect(result.current.profiles).toEqual([]);
      expect(result.current.state).toBe("checking");
      if (step === "from" || step === "select-getter") expect(select).not.toHaveBeenCalled();
      if (step !== "eq") expect(eq).not.toHaveBeenCalled();
    },
  );

  it("retired event callbacks cannot refresh a newer same-UUID context", async () => {
    const win = vi.spyOn(window, "addEventListener");
    const doc = vi.spyOn(document, "addEventListener");
    allowRead();
    const { result, rerender } = renderParentState();
    await ready(result);
    const focus = win.mock.calls.find(([name]) => name === "focus")![1] as EventListener;
    const consent = win.mock.calls.find(([name]) => name === "kids-consent-changed")![1] as EventListener;
    const visibility = doc.mock.calls.find(([name]) => name === "visibilitychange")![1] as EventListener;
    win.mockRestore();
    doc.mockRestore();
    replaceAuth();
    rerender();
    await ready(result);
    const current = result.current;
    act(() => {
      focus(new Event("focus"));
      consent(new CustomEvent("kids-consent-changed", { detail: { allowed: true } }));
      visibility(new Event("visibilitychange"));
    });
    expect(result.current).toBe(current);
    expect(mock.rpc).toHaveBeenCalledTimes(2);
    expect(result.current.profiles).toEqual([child]);
  });

  it("retired refresh cannot retire a newer request in the same auth generation", async () => {
    allowRead();
    const { result } = renderParentState();
    await ready(result);
    const old = result.current.refresh;
    act(() => result.current.refresh());
    await ready(result);
    const current = result.current;
    act(() => old());
    expect(result.current).toBe(current);
    expect(mock.rpc).toHaveBeenCalledTimes(2);
  });

  it("preserves 250ms focus/visibility dedup across a refresh and ignores consent payload authority", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000_000);
    allowRead();
    const { result } = renderParentState();
    await ready(result);
    act(() => window.dispatchEvent(new Event("focus")));
    await ready(result);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(mock.rpc).toHaveBeenCalledTimes(2);
    now.mockReturnValue(1_000_250);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    await ready(result);
    expect(mock.rpc).toHaveBeenCalledTimes(3);
    mock.rpc.mockResolvedValueOnce({ data: false, error: null });
    act(() => window.dispatchEvent(new CustomEvent("kids-consent-changed", { detail: { allowed: true, profiles: [child] } })));
    await waitFor(() => expect(result.current.state).toBe("pending"));
    expect(result.current.profiles).toEqual([]);
    expect(mock.from).toHaveBeenCalledTimes(3);
    now.mockRestore();
  });

  it.each(["success", "error", "reject"])(
    "rejects retired mutation %s without refreshing replacement context",
    async (outcome) => {
      allowRead();
      const { result, rerender } = renderParentState();
      await ready(result);
      const mutation = deferred();
      mock.rpc.mockReturnValueOnce(mutation.promise);
      const pending = result.current.createProfile("New", "level-1", "synthetic-policy");
      const assertion = expect(pending).rejects.toThrow("no longer current");
      expect(mock.rpc).toHaveBeenCalledTimes(2);
      replaceAuth();
      rerender();
      await ready(result);
      const current = result.current;
      await settle(() => {
        if (outcome === "reject") mutation.reject(new Error("synthetic-mutation-rejection"));
        else mutation.resolve({ data: null, error: outcome === "error" ? { code: "503" } : null });
      });
      await assertion;
      expect(result.current).toBe(current);
      expect(result.current.profiles).toEqual([child]);
      expect(mock.rpc).toHaveBeenCalledTimes(3);
    },
  );

  it("a saved mutation callback cannot invoke after current refresh retirement or unmount", async () => {
    allowRead();
    const { result, unmount } = renderParentState();
    await ready(result);
    const old = result.current.createProfile;
    act(() => result.current.refresh());
    await ready(result);
    await expect(old("New", "level-1", "synthetic-policy")).rejects.toThrow("no longer current");
    const latest = result.current.createProfile;
    unmount();
    await expect(latest("New", "level-1", "synthetic-policy")).rejects.toThrow("no longer current");
    expect(mock.rpc).toHaveBeenCalledTimes(2);
  });

  it("creates with unchanged consent arguments and reauthorizes before reading again", async () => {
    allowRead([]);
    const { result } = renderParentState();
    await ready(result);
    mock.rpc.mockResolvedValueOnce({ data: null, error: null });
    await act(async () => result.current.createProfile("  Explorer  ", "level-1", "synthetic-policy"));
    await ready(result);
    expect(mock.rpc).toHaveBeenNthCalledWith(2, "kids_parent_create_consented_profile", {
      p_display_name: "Explorer", p_level_id: "level-1",
      p_policy_id: "synthetic-policy", p_accepted: true,
    });
    expect(mock.rpc).toHaveBeenNthCalledWith(3, "kids_parent_can_manage_profiles");
    expect(mock.from).toHaveBeenCalledTimes(2);
  });

  it.each(["error", "reject"])("preserves current mutation %s Promise behavior", async (outcome) => {
    allowRead([]);
    const { result } = renderParentState();
    await ready(result);
    const failure = new Error("synthetic transport failure");
    if (outcome === "error") mock.rpc.mockResolvedValueOnce({ data: null, error: { code: "503" } });
    else mock.rpc.mockRejectedValueOnce(failure);
    await expect(result.current.createProfile("New", "level-1", "synthetic-policy"))
      .rejects.toThrow(outcome === "error" ? "Unable to create Kids profile" : failure.message);
    expect(result.current.state).toBe("ready");
    expect(mock.rpc).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["", "level-1", "synthetic-policy", "Invalid profile name"],
    ["x".repeat(41), "level-1", "synthetic-policy", "Invalid profile name"],
    ["Child", "unknown", "synthetic-policy", "approval"],
    ["Child", "level-1", undefined, "consent"],
  ])("keeps existing local create validation (%s/%s)", async (name, level, policy, message) => {
    allowRead([]);
    const { result } = renderParentState();
    await ready(result);
    await expect(result.current.createProfile(name!, level as "level-1", policy)).rejects.toThrow(message!);
    expect(mock.rpc).toHaveBeenCalledTimes(1);
  });

  it("does not start parent checks during auth loading, then checks after it completes", async () => {
    setAuth("parent-1", true);
    allowRead([]);
    const { result, rerender } = renderParentState();
    expect(result.current.state).toBe("checking");
    expect(mock.rpc).not.toHaveBeenCalled();
    setAuth();
    rerender();
    await ready(result);
    expect(mock.rpc).toHaveBeenCalledTimes(1);
  });

  it.each(["manage-reject", "profile-reject", "malformed-profile", "42883", "truthy-not-true"])(
    "keeps current %s failure/closed state defined",
    async (outcome) => {
      allowRead();
      if (outcome === "manage-reject") mock.rpc.mockRejectedValueOnce(new Error("synthetic-manage"));
      if (outcome === "profile-reject") mock.from.mockReturnValueOnce(profileQuery(Promise.reject(new Error("synthetic-read"))));
      if (outcome === "malformed-profile") mock.from.mockReturnValueOnce(profileQuery({ data: [{ ...child, display_name: 42 }], error: null }));
      if (outcome === "42883") mock.rpc.mockResolvedValueOnce({ data: null, error: { code: "42883" } });
      if (outcome === "truthy-not-true") mock.rpc.mockResolvedValueOnce({ data: 1, error: null });
      const { result } = renderParentState();
      await waitFor(() => expect(result.current.state).toBe(
        outcome === "42883" ? "not-released" : outcome === "truthy-not-true" ? "pending" : "unavailable",
      ));
      expect(result.current.profiles).toEqual([]);
      if (["42883", "truthy-not-true", "manage-reject"].includes(outcome)) expect(mock.from).not.toHaveBeenCalled();
    },
  );
});


type LazyOptions = {
  get?: () => void;
  invoke?: (resolve: (value: Outcome) => void, reject: (error: unknown) => void) => void;
};
function lazyResponse(value: Outcome, options: LazyOptions = {}) {
  const captured = mock.authRef.current;
  const observations = { reads: 0, currentAtDispatch: [] as boolean[] };
  const builder = {};
  const dispatch = vi.fn(function (
    this: unknown, resolve: (value: Outcome) => void, reject: (error: unknown) => void,
  ) {
    expect(this).toBe(builder);
    observations.currentAtDispatch.push(mock.isCurrent(captured));
    if (options.invoke) options.invoke(resolve, reject);
    else resolve(value);
  });
  Object.defineProperty(builder, "then", {
    get() { observations.reads += 1; options.get?.(); return dispatch; },
  });
  return { builder, dispatch, observations };
}
async function beginLazyOperation(operation: "manage" | "create", construct: () => unknown) {
  if (operation === "create") {
    allowRead([]);
    const view = renderParentState();
    await ready(view.result);
    mock.rpc.mockImplementationOnce(construct);
    const pending = view.result.current.createProfile("  Explorer  ", "level-1", "synthetic-policy");
    const handled = pending.then(
      () => ({ ok: true as const, error: null }),
      (error: unknown) => ({ ok: false as const, error }),
    );
    return { ...view, handled };
  }
  mock.rpc.mockImplementationOnce(construct);
  mock.from.mockReturnValue(profileQuery());
  return { ...renderParentState(), handled: null };
}
async function flushAdoption() {
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
}

describe("Kids parent lazy dispatch", () => {
  it.each(["manage", "create"] as const)(
    "never reads or dispatches %s builder retired during RPC construction (KPR-01)",
    async (operation) => {
      const lazy = lazyResponse({ data: true, error: null });
      const view = await beginLazyOperation(operation, () => {
        replaceAuth(null);
        return lazy.builder;
      });
      await flushAdoption();
      expect(lazy.observations.reads).toBe(0);
      expect(lazy.dispatch).not.toHaveBeenCalled();
      expect(view.result.current.profiles).toEqual([]);
      if (view.handled) {
        const outcome = await view.handled;
        expect(outcome.ok).toBe(false);
        expect(outcome.error).toEqual(new Error("Kids parent context is no longer current"));
        expect(mock.rpc).toHaveBeenCalledTimes(2);
      } else expect(mock.from).not.toHaveBeenCalled();
    },
  );

  it.each(["manage", "create"] as const)(
    "rechecks %s at deferred adoption after an earlier queued retirement",
    async (operation) => {
      const lazy = lazyResponse({ data: true, error: null });
      const view = await beginLazyOperation(operation, () => {
        queueMicrotask(() => replaceAuth());
        return lazy.builder;
      });
      await flushAdoption();
      expect(lazy.observations.reads).toBe(0);
      expect(lazy.dispatch).not.toHaveBeenCalled();
      expect(view.result.current.profiles).toEqual([]);
      if (view.handled) expect((await view.handled).error).toEqual(new Error("Kids parent context is no longer current"));
      else expect(mock.from).not.toHaveBeenCalled();
    },
  );

  it.each(["manage", "create"] as const)(
    "does not invoke %s then after its getter retires the request",
    async (operation) => {
      const lazy = lazyResponse({ data: true, error: null }, { get: () => replaceAuth() });
      const view = await beginLazyOperation(operation, () => lazy.builder);
      await flushAdoption();
      expect(lazy.observations.reads).toBe(1);
      expect(lazy.dispatch).not.toHaveBeenCalled();
      expect(view.result.current.profiles).toEqual([]);
      if (view.handled) expect((await view.handled).error).toEqual(new Error("Kids parent context is no longer current"));
      else expect(mock.from).not.toHaveBeenCalled();
    },
  );

  it.each(["manage", "create"] as const)(
    "dispatches a current %s builder once with its original receiver",
    async (operation) => {
      const lazy = lazyResponse({ data: true, error: null });
      Object.defineProperty(lazy.dispatch, "call", { get() { throw new Error("custom call property must not be read"); } });
      const view = await beginLazyOperation(operation, () => lazy.builder);
      if (view.handled) await act(async () => { expect((await view.handled).ok).toBe(true); });
      await ready(view.result);
      expect(lazy.observations.reads).toBe(1);
      expect(lazy.dispatch).toHaveBeenCalledTimes(1);
      expect(lazy.observations.currentAtDispatch).toEqual([true]);
      if (operation === "manage") {
        expect(mock.rpc).toHaveBeenCalledWith("kids_parent_can_manage_profiles");
        expect(mock.from).toHaveBeenCalledTimes(1);
      } else {
        expect(mock.rpc).toHaveBeenNthCalledWith(2, "kids_parent_create_consented_profile", {
          p_display_name: "Explorer", p_level_id: "level-1",
          p_policy_id: "synthetic-policy", p_accepted: true,
        });
        expect(mock.rpc).toHaveBeenNthCalledWith(3, "kids_parent_can_manage_profiles");
        expect(mock.from).toHaveBeenCalledTimes(2);
      }
    },
  );

  it.each([
    ["manage", "getter"], ["create", "getter"],
    ["manage", "throw"], ["create", "throw"],
    ["manage", "reject"], ["create", "reject"],
  ] as const)("preserves current %s lazy %s errors", async (operation, mode) => {
    const failure = new Error("synthetic lazy " + mode);
    const lazy = lazyResponse({ data: true, error: null }, {
      get: mode === "getter" ? () => { throw failure; } : undefined,
      invoke: mode === "throw" ? () => { throw failure; }
        : mode === "reject" ? (_resolve, reject) => reject(failure) : undefined,
    });
    const view = await beginLazyOperation(operation, () => lazy.builder);
    if (view.handled) {
      const outcome = await view.handled;
      expect(outcome.ok).toBe(false);
      expect(outcome.error).toBe(failure);
      expect(view.result.current.state).toBe("ready");
      expect(mock.rpc).toHaveBeenCalledTimes(2);
    } else {
      await waitFor(() => expect(view.result.current.state).toBe("unavailable"));
      expect(mock.from).not.toHaveBeenCalled();
    }
    expect(lazy.dispatch).toHaveBeenCalledTimes(mode === "getter" ? 0 : 1);
  });

  it.each(["manage", "create"] as const)(
    "retains current %s SDK error semantics through lazy fulfillment",
    async (operation) => {
      const lazy = lazyResponse({ data: null, error: { code: "PGRST202" } });
      const view = await beginLazyOperation(operation, () => lazy.builder);
      if (view.handled) {
        expect((await view.handled).error).toEqual(new Error("Unable to create Kids profile"));
        expect(view.result.current.state).toBe("ready");
        expect(mock.rpc).toHaveBeenCalledTimes(2);
      } else {
        await waitFor(() => expect(view.result.current.state).toBe("not-released"));
        expect(mock.from).not.toHaveBeenCalled();
      }
      expect(lazy.dispatch).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    ["manage", "success"], ["manage", "error"], ["manage", "reject"],
    ["create", "success"], ["create", "error"], ["create", "reject"],
  ] as const)("keeps already-dispatched %s %s completion closed after retirement", async (operation, mode) => {
    let fulfill!: (value: Outcome) => void;
    let reject!: (error: unknown) => void;
    const lazy = lazyResponse({ data: true, error: null }, {
      invoke: (yes, no) => { fulfill = yes; reject = no; },
    });
    const view = await beginLazyOperation(operation, () => lazy.builder);
    await waitFor(() => expect(lazy.dispatch).toHaveBeenCalledTimes(1));
    expect(lazy.observations.currentAtDispatch).toEqual([true]);
    replaceAuth();
    await settle(() => mode === "reject" ? reject(new Error("synthetic retired rejection"))
      : fulfill({ data: true, error: mode === "error" ? { code: "503" } : null }));
    expect(view.result.current.profiles).toEqual([]);
    if (view.handled) {
      expect((await view.handled).error).toEqual(new Error("Kids parent context is no longer current"));
      expect(mock.rpc).toHaveBeenCalledTimes(2);
    } else expect(mock.from).not.toHaveBeenCalled();
    expect(lazy.dispatch).toHaveBeenCalledTimes(1);
  });

  it.each(["manage", "create"] as const)(
    "observes an already-eager native %s rejection without dispatching a retired lazy operation",
    async (operation) => {
      const failure = new Error("synthetic eager rejection");
      const view = await beginLazyOperation(operation, () => {
        replaceAuth();
        return Promise.reject(failure);
      });
      await flushAdoption();
      expect(view.result.current.profiles).toEqual([]);
      if (view.handled) expect((await view.handled).error).toEqual(new Error("Kids parent context is no longer current"));
      else expect(mock.from).not.toHaveBeenCalled();
      // Vitest's unhandled-rejection checks remain enabled.
    },
  );

  it.each(["eq-construction", "queued-retirement", "then-getter"])(
    "preserves the profile adoption fence at %s (KR15 and adjacent boundary)",
    async (stage) => {
      allowRead([]);
      const lazy = lazyResponse({ data: [child], error: null }, {
        get: stage === "then-getter" ? () => replaceAuth() : undefined,
      });
      const query = profileQuery();
      query.eq.mockImplementation(() => {
        if (stage === "eq-construction") replaceAuth();
        if (stage === "queued-retirement") queueMicrotask(() => replaceAuth());
        return lazy.builder;
      });
      mock.from.mockReturnValue(query);
      const { result } = renderParentState();
      await flushAdoption();
      expect(query.eq).toHaveBeenCalledWith("parent_id", "parent-1");
      expect(lazy.observations.reads).toBe(stage === "then-getter" ? 1 : 0);
      expect(lazy.dispatch).not.toHaveBeenCalled();
      expect(result.current.profiles).toEqual([]);
      expect(result.current.state).toBe("checking");
    },
  );

  it("dispatches a current lazy profile read once with the original builder receiver", async () => {
    allowRead([]);
    const lazy = lazyResponse({ data: [child], error: null });
    mock.from.mockReturnValue(profileQuery(lazy.builder as Promise<Outcome>));
    const { result } = renderParentState();
    await ready(result);
    expect(lazy.observations.reads).toBe(1);
    expect(lazy.dispatch).toHaveBeenCalledTimes(1);
    expect(lazy.observations.currentAtDispatch).toEqual([true]);
    expect(result.current.profiles).toEqual([child]);
  });

  it("boxes a fulfilled response so its incidental then property is never adopted", async () => {
    let innerReads = 0;
    const response: Outcome = { data: true, error: null };
    Object.defineProperty(response, "then", { get() { innerReads += 1; throw new Error("response then must not be read"); } });
    const lazy = lazyResponse(response);
    const view = await beginLazyOperation("manage", () => lazy.builder);
    await ready(view.result);
    expect(innerReads).toBe(0);
    expect(lazy.dispatch).toHaveBeenCalledTimes(1);
    expect(view.result.current.profiles).toEqual([child]);
  });

  it("keeps first settlement and dispatch-once behavior for a current thenable", async () => {
    const lazy = lazyResponse({ data: true, error: null }, {
      invoke(resolve, reject) {
        resolve({ data: true, error: null });
        reject(new Error("synthetic second settlement"));
        throw new Error("synthetic throw after settlement");
      },
    });
    const view = await beginLazyOperation("manage", () => lazy.builder);
    await ready(view.result);
    expect(lazy.dispatch).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledTimes(1);
  });
});


import { supabase as eagerControlledClient } from "@/integrations/supabase/client";

type EagerTrace = {
  from: string[]; select: string[]; eq: Array<[string, string]>;
  thenReads: number; dispatches: number;
};
function eagerTrace(): EagerTrace {
  return { from: [], select: [], eq: [], thenReads: 0, dispatches: 0 };
}
function eagerPlainQuery(trace: EagerTrace, finish: () => unknown) {
  // Only from returns this plain object through vi.fn. The target Promise is
  // returned exclusively by the plain eq/finish functions, never by a spy.
  const selected = {
    eq(this: object, column: string, value: string) {
      expect(this).toBe(selected); trace.eq.push([column, value]); return finish();
    },
  };
  const table = {
    select(this: object, columns: string) {
      expect(this).toBe(table); trace.select.push(columns); return selected;
    },
  };
  expect(vi.isMockFunction(selected.eq)).toBe(false);
  expect(vi.isMockFunction(finish)).toBe(false);
  mock.rpc.mockResolvedValue({ data: true, error: null });
  mock.from.mockImplementation(function (this: object, relation: string) {
    expect(this).toBe(eagerControlledClient); trace.from.push(relation); return table;
  });
}
function eagerWatch(label: string, target: () => object | undefined) {
  const events: Array<{ message: string; target: boolean }> = [];
  const listener = (reason: unknown, promise: Promise<unknown>) => {
    events.push({ message: reason instanceof Error ? reason.message : String(reason), target: promise === target() });
  };
  // Recording only: no Promise observer, preventDefault, handler replacement,
  // removeAllListeners or suppression of Vitest's own rejection reporting.
  process.on("unhandledRejection", listener);
  return {
    events,
    close(trace: EagerTrace) {
      console.info("KPS22_NATIVE_EVENTS " + JSON.stringify({ label, events, trace,
        targetReturnsThroughPlainFunctions: true, fixtureAttachedTargetObserver: false }));
      process.off("unhandledRejection", listener);
    },
  };
}
async function eagerCheckpoint() {
  await act(async () => {
    for (let n = 0; n < 8; n += 1) await Promise.resolve();
    // Real event-loop boundaries let Node report an abandoned native rejection.
    // These are test checkpoints, never a product deadline/retry policy.
    await new Promise<void>((resolve) => setImmediate(resolve));
    await new Promise<void>((resolve) => setImmediate(resolve));
  });
}
function eagerOwnThenMustStayUnread(promise: Promise<Outcome>, trace: EagerTrace) {
  Object.defineProperty(promise, "then", { configurable: true, get() {
    trace.thenReads += 1; throw new Error("KPS22 retired own then getter was read");
  } });
}

describe("Kids parent eager rejection closure", () => {
  it("ER01 observes a plain already-rejected native query after synchronous retirement without its own then getter", async () => {
    const trace = eagerTrace(); let target: Promise<Outcome> | undefined;
    const watch = eagerWatch("ER01", () => target);
    try {
      eagerPlainQuery(trace, () => {
        target = Promise.reject<Outcome>(new Error("KPS22 eager retired query"));
        eagerOwnThenMustStayUnread(target, trace); replaceAuth(); return target;
      });
      const parent = renderParentState(); await eagerCheckpoint();
      expect(trace.eq).toEqual([["parent_id", "parent-1"]]); expect(trace.thenReads).toBe(0);
      expect(parent.result.current.state).toBe("checking"); expect(parent.result.current.profiles).toEqual([]);
      expect(watch.events).toEqual([]);
    } finally { watch.close(trace); }
  });
  it("ER02 observes a later native rejection after synchronous retirement without reading own then", async () => {
    const trace = eagerTrace(); let reject!: (reason: unknown) => void;
    const target = new Promise<Outcome>((_resolve,no) => { reject = no; });
    eagerOwnThenMustStayUnread(target, trace); const watch = eagerWatch("ER02", () => target);
    try {
      eagerPlainQuery(trace, () => { replaceAuth(); return target; });
      const parent = renderParentState(); await eagerCheckpoint();
      reject(new Error("KPS22 delayed retired query")); await eagerCheckpoint();
      expect(trace.thenReads).toBe(0); expect(trace.eq).toHaveLength(1);
      expect(parent.result.current.state).toBe("checking"); expect(parent.result.current.profiles).toEqual([]);
      expect(watch.events).toEqual([]);
    } finally { watch.close(trace); }
  });
  it("ER03 synchronous retirement does not inspect or adopt a plain lazy query", async () => {
    const trace = eagerTrace();
    const lazy = { get then() { trace.thenReads += 1; return () => { trace.dispatches += 1; }; } };
    const watch = eagerWatch("ER03", () => lazy);
    try {
      eagerPlainQuery(trace, () => { replaceAuth(); return lazy; });
      const parent = renderParentState(); await eagerCheckpoint();
      expect(trace.thenReads).toBe(0); expect(trace.dispatches).toBe(0);
      expect(parent.result.current.profiles).toEqual([]); expect(watch.events).toEqual([]);
    } finally { watch.close(trace); }
  });
  it("ER04 queued retirement before lazy assimilation does not read then or dispatch", async () => {
    const trace = eagerTrace();
    const lazy = { get then() { trace.thenReads += 1; return () => { trace.dispatches += 1; }; } };
    const watch = eagerWatch("ER04", () => lazy);
    try {
      eagerPlainQuery(trace, () => { queueMicrotask(() => replaceAuth()); return lazy; });
      renderParentState(); await eagerCheckpoint();
      expect(trace.eq).toHaveLength(1); expect(trace.thenReads).toBe(0); expect(trace.dispatches).toBe(0);
      expect(watch.events).toEqual([]);
    } finally { watch.close(trace); }
  });
  it("ER05 current plain lazy query keeps its receiver, exact filter, one adoption and valid profiles", async () => {
    const trace = eagerTrace();
    const lazy = { get then() {
      trace.thenReads += 1;
      return function (this: object, fulfill: (value: Outcome) => void) {
        expect(this).toBe(lazy); trace.dispatches += 1;
        queueMicrotask(() => fulfill({ data: [child], error: null }));
      };
    } };
    const watch = eagerWatch("ER05", () => lazy);
    try {
      eagerPlainQuery(trace, () => lazy); const parent = renderParentState(); await eagerCheckpoint();
      expect(parent.result.current.state).toBe("ready"); expect(parent.result.current.profiles).toEqual([child]);
      expect(trace.from).toEqual(["kids_profiles"]); expect(trace.select).toEqual(["id, level_id, display_name"]);
      expect(trace.eq).toEqual([["parent_id", "parent-1"]]); expect(trace.thenReads).toBe(1); expect(trace.dispatches).toBe(1);
      expect(mock.rpc).toHaveBeenCalledExactlyOnceWith("kids_parent_can_manage_profiles");
      expect(watch.events).toEqual([]);
    } finally { watch.close(trace); }
  });
  it("ER06 current plain fulfilled SDK error remains unavailable rather than an empty ready state", async () => {
    const trace = eagerTrace(); let target: Promise<Outcome> | undefined;
    const watch = eagerWatch("ER06", () => target);
    try {
      eagerPlainQuery(trace, () => { target = Promise.resolve({ data: null, error: { code: "503", message: "synthetic unavailable" } }); return target; });
      const parent = renderParentState(); await eagerCheckpoint();
      expect(parent.result.current.state).toBe("unavailable"); expect(parent.result.current.profiles).toEqual([]);
      expect(trace.eq).toHaveLength(1); expect(watch.events).toEqual([]);
    } finally { watch.close(trace); }
  });
  it("ER07 current plain native rejection is handled and remains unavailable", async () => {
    const trace = eagerTrace(); let target: Promise<Outcome> | undefined;
    const watch = eagerWatch("ER07", () => target);
    try {
      eagerPlainQuery(trace, () => { target = Promise.reject(new Error("KPS22 current query rejection")); return target; });
      const parent = renderParentState(); await eagerCheckpoint();
      expect(parent.result.current.state).toBe("unavailable"); expect(parent.result.current.profiles).toEqual([]);
      expect(trace.eq).toHaveLength(1); expect(watch.events).toEqual([]);
    } finally { watch.close(trace); }
  });
  it("ER08 abandoned native rejection cannot alter a fresh generation or start work from saved old callbacks", async () => {
    const trace = eagerTrace(); let reject!: (reason: unknown) => void;
    const target = new Promise<Outcome>((_resolve,no) => { reject = no; });
    eagerOwnThenMustStayUnread(target, trace); const watch = eagerWatch("ER08", () => target);
    const fresh = { ...child, id: "fresh-native-context", display_name: "Fresh native context" };
    try {
      eagerPlainQuery(trace, () => {
        if (trace.eq.length === 1) { replaceAuth(); return target; }
        return Promise.resolve({ data: [fresh], error: null });
      });
      const parent = renderParentState(); const oldApi = parent.result.current; await eagerCheckpoint();
      parent.rerender(); await eagerCheckpoint();
      expect(parent.result.current.state).toBe("ready"); expect(parent.result.current.profiles).toEqual([fresh]);
      reject(new Error("KPS22 obsolete query rejection")); await eagerCheckpoint();
      oldApi.refresh(); await expect(oldApi.createProfile("Ignored", "level-1", "policy")).rejects.toThrow();
      await eagerCheckpoint(); expect(trace.thenReads).toBe(0);
      expect(trace.eq).toHaveLength(2); expect(mock.rpc).toHaveBeenCalledTimes(2);
      expect(parent.result.current.state).toBe("ready"); expect(parent.result.current.profiles).toEqual([fresh]);
      expect(watch.events).toEqual([]);
    } finally { watch.close(trace); }
  });
});
