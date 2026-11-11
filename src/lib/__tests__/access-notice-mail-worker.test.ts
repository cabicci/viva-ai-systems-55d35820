import { expect, it, vi } from "vitest";
import { runAccessNoticeMailJob } from "../../../supabase/functions/_shared/access-notice-mail-worker";

it("uses the branded template, skips a held lease and reuses the send key on retry", async () => {
  const payload = {
    kind: "campaign_signup",
    title: "Offer <b>",
    starts_at: "2026-11-11T07:00:00Z",
    ends_at: "2026-11-25T07:00:00Z",
    catalogues: ["Course <script>"],
    questions: 25,
    marketing: false,
  };
  const row = {
    id: "campaign",
    lease: "lease1",
    recipient: "learner@example.test",
    locale: "ar-EG",
    payload,
  };
  const rpc = vi.fn(async (_name: string, args: Record<string, unknown>) => ({
    error: null,
    data:
      args.p_action === "claim"
        ? [{ ...row, id: "held" }, row]
        : args.p_action === "authorize"
          ? (args.p_data as { id: string }).id !== "held"
          : true,
  }));
  const send = vi
    .fn()
    .mockResolvedValueOnce({ ok: false, retryable: true })
    .mockResolvedValueOnce({ ok: true, emailId: "mail-fixture" });
  expect(await runAccessNoticeMailJob({ rpc }, send)).toEqual({ accepted: 0, deferred: 2 });
  expect(await runAccessNoticeMailJob({ rpc }, send)).toEqual({ accepted: 1, deferred: 1 });
  expect(send).toHaveBeenCalledTimes(2);
  expect(send.mock.calls[0]).toEqual(send.mock.calls[1]);
  const message = send.mock.calls[0][0];
  expect(message.idempotencyKey).toBe("access-notice/campaign");
  expect(message.html).toContain("masaarat-logo-lockup.png");
  expect(message.html).toContain("Course &lt;script&gt;");
  expect(message.text).toContain("25");
  expect(message.text).toContain("https://masaarat.ai/my-learning?locale=ar-EG");
});
