import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
const state = vi.hoisted(() => ({
  header: undefined as string | undefined,
  claims: vi.fn(), rpc: vi.fn(), insert: vi.fn(), create: vi.fn(), fetch: vi.fn(),
  submissions: [] as any[], listeners: {} as Record<string, (event: any) => void>,
  transportFailure: false,
}));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => {
  let validate: (data: any) => any = data => data;
  const chain = { inputValidator: (fn: (data: any) => any) => { validate = fn; return chain; }, handler: (fn: any) => async (args: any) => {
    state.submissions.push(args.data);
    if (state.transportFailure) throw new Error("synthetic transport failure");
    return fn({ data: validate(args.data) });
  } };
  return chain;
} }));
vi.mock("@tanstack/react-start/server", () => ({ getRequestHeader: () => state.header }));
vi.mock("@supabase/supabase-js", () => ({ createClient: (...args: any[]) => state.create(...args) }));
const MARK = "SYNTHETIC_PRIVATE_MARKER";
let server: any;
let producer: any;
beforeEach(async () => {
  vi.resetModules(); vi.clearAllMocks();
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("SUPABASE_URL", "https://synthetic.invalid");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "synthetic-service-key");
  vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "synthetic-public-key");
  vi.stubGlobal("location", { href: `https://user:${MARK}@example.test/lesson?code=${MARK}#${MARK}` });
  state.listeners = {}; state.submissions = []; state.header = undefined; state.transportFailure = false;
  vi.stubGlobal("addEventListener", (type: string, fn: (event: any) => void) => { state.listeners[type] = fn; });
  state.fetch.mockRejectedValue(new Error("network forbidden")); vi.stubGlobal("fetch", state.fetch);
  state.claims.mockResolvedValue({ data: { claims: { sub: "verified-user" } }, error: null });
  state.rpc.mockResolvedValue({ data: [{ allowed: true }], error: null });
  state.insert.mockResolvedValue({ error: null });
  state.create.mockImplementation((url: string, key: string) => {
    expect(url).toBe("https://synthetic.invalid");
    return key === "synthetic-public-key" ? { auth: { getClaims: state.claims } } : { rpc: state.rpc, from: (table: string) => { expect(table).toBe("client_error_logs"); return { insert: state.insert }; } };
  });
  server = await import("@/lib/error-log.functions");
  producer = await import("@/lib/error-capture");
});
afterEach(() => { expect(state.fetch).not.toHaveBeenCalled(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const raw = () => ({
  scope: `scope https://example.test/?code=${MARK}`,
  message: `Request https://user:${MARK}@example.test/path?token=${MARK} failed`,
  stack: `TypeError\n  at https://cdn.test/app.js:10:2?signature=${MARK}`,
  url: `https://user:${MARK}@example.test/lesson?code=${MARK}#${MARK}`,
  userAgent: `Agent Bearer ${MARK}`, release: `https://example.test/release#${MARK}`,
  extra: { status: 503, headers: { authorization: `Bearer ${MARK}`, Cookie: MARK }, request: { redirectUrl: encodeURIComponent(`https://example.test/?code=${MARK}`) } },
  user_id: "forged-user",
});

describe("actual server handler", () => {
  it("sanitizes a forged direct caller before insertion and ignores caller identity", async () => {
    expect(await server.logClientError({ data: raw() })).toEqual({ ok: true });
    const saved = state.insert.mock.calls[0][0];
    expect(JSON.stringify(saved)).not.toContain(MARK);
    expect(saved.url).toBe("https://example.test/lesson");
    expect(saved.message).toContain("https://example.test/path");
    expect(saved.extra.status).toBe(503); expect(saved.user_id).toBeNull();
    expect(state.rpc).toHaveBeenCalledWith("consume_rate_limit", { p_user_id: "00000000-0000-0000-0000-000000000001", p_bucket_key: "error-log", p_max_calls: 20, p_window_seconds: 60 });
  });
  it("continues to use verified auth claims and authenticated rate limit", async () => {
    state.header = "Bearer synthetic-auth-credential";
    expect(await server.logClientError({ data: raw() })).toEqual({ ok: true });
    expect(state.claims).toHaveBeenCalledWith("synthetic-auth-credential");
    expect(state.insert.mock.calls[0][0].user_id).toBe("verified-user");
    expect(state.rpc).toHaveBeenCalledWith("consume_rate_limit", expect.objectContaining({ p_user_id: "verified-user", p_max_calls: 30 }));
    expect(JSON.stringify(state.insert.mock.calls)).not.toContain("synthetic-auth-credential");
  });
  it.each(["returned", "rejected"])("treats %s claims failure as anonymous", async mode => {
    state.header = "Bearer synthetic-auth-credential";
    if (mode === "returned") state.claims.mockResolvedValue({ data: { claims: { sub: "unverified-user" } }, error: { message: MARK } });
    else state.claims.mockRejectedValue(new Error(MARK));
    await server.logClientError({ data: raw() });
    expect(state.insert.mock.calls[0][0].user_id).toBeNull();
    expect(state.rpc).toHaveBeenCalledWith("consume_rate_limit", expect.objectContaining({ p_max_calls: 20 }));
  });
  it.each(["denied", "returned-error", "rejected"])("fails closed without persistence when rate limit is %s", async mode => {
    if (mode === "denied") state.rpc.mockResolvedValue({ data: [{ allowed: false }], error: null });
    else if (mode === "returned-error") state.rpc.mockResolvedValue({ data: [{ allowed: true }], error: { message: MARK } });
    else state.rpc.mockRejectedValue(new Error(MARK));
    expect(await server.logClientError({ data: raw() })).toEqual({ ok: false });
    expect(state.insert).not.toHaveBeenCalled();
  });
  it.each(["returned", "rejected"])("reports %s insert failure truthfully without throwing", async mode => {
    if (mode === "returned") state.insert.mockResolvedValue({ error: { message: MARK } });
    else state.insert.mockRejectedValue(new Error(MARK));
    expect(await server.logClientError({ data: raw() })).toEqual({ ok: false });
    expect(JSON.stringify(state.insert.mock.calls)).not.toContain(MARK);
  });
  it("retains input validation and performs no write for oversized inputs", async () => {
    await expect(server.logClientError({ data: { scope: "x", message: "x".repeat(2001) } })).rejects.toThrow();
    expect(state.rpc).not.toHaveBeenCalled(); expect(state.insert).not.toHaveBeenCalled();
  });
  it("rejects ambiguous encoded context before persistence", async () => {
    const data = raw(); data.message = `Error https://example.test/?code=%22${MARK}`;
    data.url = `https://[broken/${MARK}?code=bad`;
    await server.logClientError({ data });
    expect(JSON.stringify(state.insert.mock.calls)).not.toContain(MARK);
    expect(state.insert.mock.calls[0][0].message).toBe("[redacted]");
  });
});

describe("actual browser error producer", () => {
  it.each(["captureError", "captureWarn"])("sanitizes before %s transport, not only before persistence", async name => {
    const err = new Error(raw().message); err.stack = raw().stack;
    producer[name](raw().scope, err);
    await waitFor(() => expect(state.insert).toHaveBeenCalledTimes(1));
    expect(JSON.stringify(state.submissions)).not.toContain(MARK);
    expect(JSON.stringify(state.insert.mock.calls)).not.toContain(MARK);
    expect(state.submissions[0].url).toBe("https://example.test/lesson");
  });
  it("sanitizes reports from both global browser error paths", async () => {
    state.listeners.error({ error: new Error(raw().message) });
    state.listeners.unhandledrejection({ reason: `Bearer ${MARK}` });
    await waitFor(() => expect(state.submissions).toHaveLength(2));
    expect(JSON.stringify(state.submissions)).not.toContain(MARK);
  });
  it("deduplicates on sanitized identity without retaining URL secrets in keys", async () => {
    producer.captureError("fetch", new Error(`Failed https://example.test/?token=${MARK}A`));
    producer.captureError("fetch", new Error(`Failed https://example.test/?token=${MARK}B`));
    await waitFor(() => expect(state.insert).toHaveBeenCalledTimes(1));
    expect(state.submissions).toHaveLength(1);
    expect(JSON.stringify(state.submissions)).not.toContain(MARK);
  });
  it("preserves the maximum of 20 browser reports per minute", async () => {
    for (let i = 0; i < 25; i++) producer.captureError(`scope${i}`, new Error(`Error ${i}`));
    await waitFor(() => expect(state.submissions).toHaveLength(20));
    expect(state.rpc).toHaveBeenCalledTimes(20);
  });
  it("swallows transport failure and still submits only sanitized data", async () => {
    state.transportFailure = true;
    expect(() => producer.captureError("fetch", new Error(raw().message))).not.toThrow();
    await waitFor(() => expect(state.submissions).toHaveLength(1));
    expect(state.insert).not.toHaveBeenCalled();
    expect(JSON.stringify(state.submissions)).not.toContain(MARK);
  });
});
