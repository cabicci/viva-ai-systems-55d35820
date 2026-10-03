import { describe, expect, it, vi } from "vitest";
import { runMailStreams } from "../../../supabase/functions/account-welcome-job/streams";

describe("independent welcome, subscription and contact processing", () => {
  it("runs contact retries despite another stream failing, and reports partial failure", async () => {
    const contact = vi.fn().mockResolvedValue({ accepted: 1, deferred: 0 });
    expect(
      await runMailStreams({
        welcome: () => {
          throw new Error("private provider detail");
        },
        subscription: async () => ({ accepted: 0, deferred: 0 }),
        contact,
      }),
    ).toEqual({
      status: 503,
      body: {
        welcome: { error: "mail_stream_failed" },
        subscription: { accepted: 0, deferred: 0 },
        contact: { accepted: 1, deferred: 0 },
      },
    });
    expect(contact).toHaveBeenCalledTimes(1);
  });
  it("preserves successful existing streams when contact is disabled", async () => {
    expect(
      await runMailStreams({
        welcome: async () => ({ accepted: 1, deferred: 0 }),
        subscription: null,
        contact: null,
      }),
    ).toEqual({
      status: 200,
      body: { welcome: { accepted: 1, deferred: 0 }, subscription: null, contact: null },
    });
  });
});
