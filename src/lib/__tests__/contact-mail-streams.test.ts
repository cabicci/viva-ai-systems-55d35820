import { describe, expect, it, vi } from "vitest";
import { runMailStreams } from "../../../supabase/functions/account-welcome-job/streams";
import { contactMailEnabled } from "../../../supabase/functions/_shared/contact-mail-enabled";

describe("independent welcome, subscription and contact processing", () => {
  it("retries the direct route even while the original switch is disabled", async () => {
    const retry = vi.fn().mockResolvedValue({ accepted: 1, deferred: 0 });
    const result = await runMailStreams({
      welcome: null,
      contact: contactMailEnabled("true") ? retry : null,
    });
    expect(retry).toHaveBeenCalledTimes(1);
    expect(result.body.contact).toEqual({ accepted: 1, deferred: 0 });
  });
  it.each([undefined, "", "false", "TRUE", "1"])(
    "does not activate either runtime for an absent or invalid direct flag: %s",
    (direct) => expect(contactMailEnabled(direct)).toBe(false),
  );
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
