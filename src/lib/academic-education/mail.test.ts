import { it, expect, vi } from "vitest";
import { runAcademicMailJob } from "../../../supabase/functions/_shared/academic-mail-worker";
import {
  subscriptionContent,
  paymentConfirmationContent,
  receiptReviewContent,
  invitationContent,
} from "../../../supabase/functions/_shared/masaarat-mail";
import { SUPPORTED_LOCALES } from "../locale/types";
it.each(SUPPORTED_LOCALES)(
  "uses four-context academic welcome and protected review links in %s",
  (locale) => {
    const row = {
      order_id: "00000000-0000-4000-8000-000000000001",
      reference: "MS-SYNTHETIC",
      package: "academic",
      currency: "EGP",
      amount_minor: 30900,
      locale,
    };
    expect(subscriptionContent("academic", "activated", "Synthetic", locale).html).toContain(
      "https://masaarat.ai/academic",
    );
    expect(paymentConfirmationContent(row).text).toContain("Academic");
    expect(receiptReviewContent(row).html).toContain("/admin/commerce?order=");
    expect(
      invitationContent({
        id: row.order_id,
        package: "academic",
        locale,
        duration_days: 30,
        deadline: new Date(Date.now() + 86400000).toISOString(),
        access_kind: "complimentary",
      }).text,
    ).toContain("Academic");
  },
);
it("rechecks authorization and retries with the immutable outbox key, without real sends", async () => {
  const row = {
    id: "synthetic",
    claim_token: "synthetic-token",
    recipient: "synthetic@example.test",
    name: "Synthetic",
    locale: "en",
    kind: "activated",
  };
  const db = {
    rpc: vi.fn(async (_name: string, args: Record<string, unknown>) => ({
      data: args.p_action === "claim" ? [row] : true,
      error: null,
    })),
  };
  const send = vi.fn().mockRejectedValue(new Error("timeout"));
  expect(await runAcademicMailJob(db, send)).toEqual({ accepted: 0, deferred: 1 });
  expect(send).toHaveBeenCalledWith(
    expect.objectContaining({ idempotencyKey: "academic-subscription/synthetic" }),
  );
  expect(db.rpc).toHaveBeenLastCalledWith("academic_mail_command", {
    p_action: "result",
    p_data: { id: row.id, claim_token: row.claim_token, provider_id: null, blocked: false },
  });
  db.rpc.mockImplementation(async (_name, args) => ({
    data: args.p_action === "claim" ? [row] : false,
    error: null,
  }));
  send.mockClear();
  expect(await runAcademicMailJob(db, send)).toEqual({ accepted: 0, deferred: 1 });
  expect(send).not.toHaveBeenCalled();
});
