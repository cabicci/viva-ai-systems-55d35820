import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "@/lib/auth-context";

const mock = vi.hoisted(() => ({
  onAuthStateChange: vi.fn(), getSession: vi.fn(), signOut: vi.fn(),
  rpc: vi.fn(), from: vi.fn(), channel: vi.fn(), removeChannel: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { auth: mock, rpc: mock.rpc, from: mock.from, channel: mock.channel, removeChannel: mock.removeChannel },
}));
vi.mock("@/lib/auth-access-token-cookie", () => ({ syncAccessTokenCookie: vi.fn() }));
vi.mock("@/lib/error-capture", () => ({ captureError: vi.fn(), captureWarn: vi.fn() }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
const session = { access_token: "fake.payload.signature", user: { id: "test-user" } };
type SessionResult = { data: { session: typeof session | null } };
let restore: ReturnType<typeof deferred<SessionResult>>;
let claim: ReturnType<typeof deferred<{ error: null }>>;
let notifyAuth: (event: string, value: typeof session | null) => void;
let notifyDevice: (event: { new: { device_id: string } }) => void;
let ownClaimCompleted: boolean;
let root: Root;
let container: HTMLDivElement;

beforeEach(async () => {
  vi.resetAllMocks();
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  localStorage.setItem("lovable.device_id", "current-device");
  restore = deferred<SessionResult>();
  claim = deferred<{ error: null }>();
  ownClaimCompleted = false;
  mock.onAuthStateChange.mockImplementation((callback) => {
    notifyAuth = callback;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
  mock.getSession.mockReturnValue(restore.promise);
  mock.signOut.mockResolvedValue({ error: null });
  mock.rpc.mockReturnValue(claim.promise);
  const query = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({ data: { device_id: ownClaimCompleted ? "current-device" : "previous-device" } })),
  };
  mock.from.mockReturnValue(query);
  const channel = { on: vi.fn(), subscribe: vi.fn() };
  channel.on.mockImplementation((_type, _filter, callback) => { notifyDevice = callback; return channel; });
  channel.subscribe.mockReturnValue(channel);
  mock.channel.mockReturnValue(channel);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(createElement(AuthProvider, null, createElement("div", null, "learner"))); });
});

afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
  localStorage.clear();
});

async function completeClaimAndRestore() {
  await act(async () => {
    ownClaimCompleted = true;
    claim.resolve({ error: null });
    restore.resolve({ data: { session } });
  });
}

describe("AuthProvider active-device ordering", () => {
  it("waits for its own claim when INITIAL_SESSION precedes getSession", async () => {
    await act(async () => { notifyAuth("INITIAL_SESSION", session); });
    expect(mock.rpc).toHaveBeenCalledWith("claim_active_device", { p_device_id: "current-device" });
    expect(mock.from).not.toHaveBeenCalled();
    expect(mock.signOut).not.toHaveBeenCalled();
    await act(async () => { notifyDevice({ new: { device_id: "previous-device" } }); });
    expect(mock.signOut).not.toHaveBeenCalled();
    await completeClaimAndRestore();
    expect(mock.rpc).toHaveBeenCalledTimes(1);
    expect(mock.from).toHaveBeenCalledWith("user_active_device");
    expect(mock.signOut).not.toHaveBeenCalled();
  });

  it("deduplicates a later INITIAL_SESSION event after getSession started the claim", async () => {
    await act(async () => { restore.resolve({ data: { session } }); });
    expect(mock.rpc).toHaveBeenCalledTimes(1);
    expect(mock.from).not.toHaveBeenCalled();
    await act(async () => { notifyAuth("INITIAL_SESSION", session); });
    await completeClaimAndRestore();
    expect(mock.rpc).toHaveBeenCalledTimes(1);
    expect(mock.signOut).not.toHaveBeenCalled();
  });

  it("keeps SIGNED_IN ordering and enforces a genuinely different device after claiming", async () => {
    await act(async () => { notifyAuth("SIGNED_IN", session); });
    expect(mock.from).not.toHaveBeenCalled();
    await completeClaimAndRestore();
    await act(async () => { notifyAuth("TOKEN_REFRESHED", session); });
    expect(mock.rpc).toHaveBeenCalledTimes(1);
    expect(mock.signOut).not.toHaveBeenCalled();
    await act(async () => { notifyDevice({ new: { device_id: "another-device" } }); });
    expect(mock.signOut).toHaveBeenCalledTimes(1);
  });
});
