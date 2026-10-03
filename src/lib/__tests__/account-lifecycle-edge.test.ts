// @vitest-environment node
import { readFileSync } from "node:fs";
import ts from "typescript";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as worker from "../../../supabase/functions/_shared/account-lifecycle-worker";
import * as handlers from "../../../supabase/functions/account-deletion-job/handler";

// Execute the actual authored entrypoint. Only npm/Deno host bindings are
// replaced; auth, body parsing, switches, batch dispatch and handlers are real.
const entrypoint = ts.transpileModule(
  readFileSync("supabase/functions/account-deletion-job/index.ts", "utf8"),
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  },
).outputText;
const first = "11111111-1111-4111-8111-111111111111",
  second = "22222222-2222-4222-8222-222222222222";
const secret = "s".repeat(32);
let endpoint: (request: Request) => Promise<Response>;
let environment: Record<string, string>;
const rpc =
  vi.fn<
    (name: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>
  >();
const call = (body: unknown) =>
  endpoint(
    new Request("https://isolated.test/account-deletion-job", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
beforeEach(() => {
  rpc.mockReset();
  environment = {
    ACCOUNT_DELETION_JOB_SECRET: secret,
    SUPABASE_URL: "https://isolated.test",
    SUPABASE_SERVICE_ROLE_KEY: "synthetic-key",
    STRIPE_SECRET_KEY: "sk_test_synthetic_only",
    ACCOUNT_DELETION_ENABLED: "false",
    ACCOUNT_FINANCIAL_PURGE_ENABLED: "true",
  };
  new Function("require", "Deno", "exports", entrypoint)(
    (name: string) =>
      name.startsWith("npm:")
        ? { createClient: () => ({ rpc }) }
        : name.endsWith("account-lifecycle-worker.ts")
          ? worker
          : handlers,
    {
      env: { get: (name: string) => environment[name] },
      serve: (fn: typeof endpoint) => {
        endpoint = fn;
      },
    },
    {},
  );
});
describe("protected account lifecycle batch entrypoint", () => {
  it("runs due finance while general account deletion is paused, without fetching deletion candidates", async () => {
    rpc.mockImplementation(async (name) => ({
      data: name === "lc09_financial_purge_candidates" ? [] : null,
      error: null,
    }));
    expect(await (await call({ action: "run_batch" })).json()).toEqual({
      completed: 0,
      deferred: 0,
    });
    expect(rpc).toHaveBeenCalledExactlyOnceWith("lc09_financial_purge_candidates", { p_limit: 2 });
  });
  it("continues another due account after a failed claim and returns only counts", async () => {
    rpc.mockImplementation(async (name, args) => {
      if (name === "lc09_financial_purge_candidates") return { data: [first, second], error: null };
      if (name === "lc09_claim_financial_purge" && args?.p_user_id === first)
        return { data: null, error: "synthetic busy" };
      return { data: { stage: "financial_purged" }, error: null };
    });
    const response = await call({ action: "run_batch" });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ completed: 1, deferred: 1 });
    expect(rpc).toHaveBeenCalledWith("lc09_claim_financial_purge", { p_user_id: second });
  });
  it("rejects unknown actions and unprotected callers without reaching the database", async () => {
    expect((await call({ action: "erase_everything" })).status).toBe(400);
    expect(
      (
        await endpoint(
          new Request("https://isolated.test", {
            method: "POST",
            headers: { Authorization: "Bearer browser-jwt" },
          }),
        )
      ).status,
    ).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
  it("keeps the two switches independent and does no operation when both are disabled", async () => {
    environment.ACCOUNT_FINANCIAL_PURGE_ENABLED = "false";
    expect(await (await call({ action: "run_batch" })).json()).toEqual({ enabled: false });
    environment.ACCOUNT_DELETION_ENABLED = "true";
    expect(await (await call({ action: "purge_financial", user_id: first })).json()).toEqual({
      enabled: false,
    });
    expect(rpc).not.toHaveBeenCalled();
  });
});
