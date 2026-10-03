// @vitest-environment node
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { dispatchImmediateMail } from "../mail-dispatch.server";
const target = { stream: "welcome", id: "b08ff00f-e77a-4489-925f-8336d814a750" } as const;
const secret = "synthetic-existing-worker-authorization-only";
const fetcher = vi.fn();
let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://isolated.supabase.co");
  vi.stubEnv("ACCOUNT_WELCOME_JOB_SECRET", secret);
  vi.stubGlobal("fetch", fetcher);
  fetcher.mockReset().mockResolvedValue(Response.json({ welcome: { accepted: 1, deferred: 0 } }));
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
describe("server-only existing worker dispatch", () => {
  it("reuses the existing worker authorization and bounds the attempt without following credential redirects", async () => {
    expect(await dispatchImmediateMail(target)).toEqual({ accepted: 1, deferred: 0 });
    expect(fetcher).toHaveBeenCalledExactlyOnceWith(
      "https://isolated.supabase.co/functions/v1/account-welcome-job",
      expect.objectContaining({
        method: "POST",
        redirect: "error",
        signal: expect.any(AbortSignal),
        headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
        body: JSON.stringify({ immediate: target }),
      }),
    );
  });
  it.each(["", "http://isolated.supabase.co", "https://supabase.co.attacker.test"])(
    "rejects invalid endpoint configuration before dispatch: %s",
    async (url) => {
      vi.stubEnv("SUPABASE_URL", url);
      await expect(dispatchImmediateMail(target)).rejects.toThrow("mail_dispatch_unconfigured");
      expect(fetcher).not.toHaveBeenCalled();
    },
  );
  it("requires the already-installed authorization and a bounded valid target", async () => {
    vi.stubEnv("ACCOUNT_WELCOME_JOB_SECRET", "");
    await expect(dispatchImmediateMail(target)).rejects.toThrow("mail_dispatch_unconfigured");
    await expect(
      dispatchImmediateMail({ ...target, stream: "lifecycle" } as never),
    ).rejects.toThrow("mail_dispatch_target_invalid");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([401, 503])("logs only the safe status on worker failure: %s", async (status) => {
    fetcher.mockResolvedValue(new Response(secret, { status }));
    await expect(dispatchImmediateMail(target)).rejects.toThrow("mail_dispatch_unavailable");
    expect(warn).toHaveBeenCalledExactlyOnceWith("mail:immediate_dispatch_failure", {
      kind: "worker_response",
      status,
    });
    expect(JSON.stringify(warn.mock.calls)).not.toContain(secret);
  });
  it("does not expose network exception details or attempt a second send", async () => {
    fetcher.mockRejectedValue(new Error(secret));
    await expect(dispatchImmediateMail(target)).rejects.toThrow("mail_dispatch_unavailable");
    expect(warn).toHaveBeenCalledExactlyOnceWith("mail:immediate_dispatch_failure", {
      kind: "network",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([
    [{ enabled: false }, "mail_dispatch_disabled"],
    [{ welcome: { accepted: 0, deferred: 1 } }, "mail_dispatch_deferred"],
    [{ welcome: { accepted: 2, deferred: 0 } }, "mail_dispatch_invalid_response"],
    [{ contact: { accepted: 1, deferred: 0 } }, "mail_dispatch_invalid_response"],
    [{ welcome: { accepted: -1, deferred: 0 } }, "mail_dispatch_invalid_response"],
  ])(
    "does not mistake disabled, deferred or malformed work for delivery",
    async (body, message) => {
      fetcher.mockResolvedValue(Response.json(body));
      await expect(dispatchImmediateMail(target)).rejects.toThrow(message as string);
    },
  );
  it("accepts a completed target without resending it", async () => {
    fetcher.mockResolvedValue(Response.json({ contact: { accepted: 0, deferred: 0 } }));
    expect(await dispatchImmediateMail({ ...target, stream: "contact" })).toEqual({
      accepted: 0,
      deferred: 0,
    });
  });
});
