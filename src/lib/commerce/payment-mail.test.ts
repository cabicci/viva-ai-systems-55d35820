// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { runCommercePaymentMailJob } from "../../../supabase/functions/_shared/commerce-payment-mail-worker";
import {
  paymentConfirmationContent,
  receiptReviewContent,
} from "../../../supabase/functions/_shared/masaarat-mail";
const row = {
  id: "mail-1",
  order_id: "order-1",
  claim_token: "claim-1",
  recipient: "synthetic@example.test",
  payload: {
    locale: "en",
    name: "Synthetic",
    package: "pro",
    reference: "MS-SYNTHETIC",
    amount_minor: 16900,
    currency: "EGP",
  },
};
function database() {
  return {
    rpc: vi.fn(
      async (
        _name: string,
        args: Record<string, unknown>,
      ): Promise<{ data: unknown; error: unknown }> => ({
        data: args.p_action === "claim" ? [row] : true,
        error: null,
      }),
    ),
  };
}
describe("manual payment confirmation mail", () => {
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"])(
    "uses contextual branded confirmation in %s",
    (locale) => {
      const mail = paymentConfirmationContent({
        ...row.payload,
        locale,
        name: "<script>name</script>",
      });
      expect(mail.subject).toContain("Pro");
      expect(mail.text).toContain("MS-SYNTHETIC");
      expect(mail.html).toContain("&lt;script&gt;name&lt;/script&gt;");
      expect(mail.html).toContain(locale === "en" ? 'dir="ltr"' : 'dir="rtl"');
      expect(mail.html).toContain("https://masaarat.ai/payments");
    },
  );
  it.each(["ar-EG", "ar-MSA", "ar-Gulf", "en"])(
    "provides a protected sales review link in %s",
    (locale) => {
      const mail = receiptReviewContent({ ...row.payload, locale });
      expect(mail.text).toContain("MS-SYNTHETIC");
      expect(mail.html).toContain("https://masaarat.ai/admin/commerce");
      expect(mail.html).not.toContain("storage/v1");
      expect(mail.html).toContain(locale === "en" ? 'dir="ltr"' : 'dir="rtl"');
    },
  );
  it("dispatches a targeted receipt alert to the stored sales recipient", async () => {
    const db = database(),
      send = vi.fn().mockResolvedValue({ ok: true, emailId: "sales-provider" });
    db.rpc.mockImplementation(async (_name, args) => ({
      data:
        args.p_action === "claim"
          ? [{ ...row, order_id: null, receipt_id: "receipt-1", recipient: "sales@masaarat.ai" }]
          : true,
      error: null,
    }));
    expect(await runCommercePaymentMailJob(db, send, undefined, "receipt-1")).toEqual({
      accepted: 1,
      deferred: 0,
    });
    expect(db.rpc).toHaveBeenNthCalledWith(1, "commerce_payment_mail", {
      p_action: "claim",
      p_data: { receipt_id: "receipt-1" },
    });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "sales@masaarat.ai",
        subject: expect.stringContaining("awaiting review"),
      }),
    );
    await expect(
      runCommercePaymentMailJob(db, send, undefined, "different-receipt"),
    ).rejects.toThrow("target_mismatch");
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("uses only stored recipients, rechecks permission, records the provider result and keeps one retry key", async () => {
    const db = database(),
      send = vi.fn().mockResolvedValue({ ok: true, emailId: "provider-1" });
    expect(await runCommercePaymentMailJob(db, send, "order-1")).toEqual({
      accepted: 1,
      deferred: 0,
    });
    expect(db.rpc).toHaveBeenNthCalledWith(1, "commerce_payment_mail", {
      p_action: "claim",
      p_data: { order_id: "order-1" },
    });
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ to: row.recipient, idempotencyKey: "commerce-payment/mail-1" }),
    );
    expect(db.rpc).toHaveBeenLastCalledWith("commerce_payment_mail", {
      p_action: "result",
      p_data: { id: "mail-1", claim_token: "claim-1", provider_id: "provider-1", retryable: false },
    });
  });
  it("does not send when the target differs or authorization changes", async () => {
    const db = database(),
      send = vi.fn();
    await expect(runCommercePaymentMailJob(db, send, "another-order")).rejects.toThrow(
      "target_mismatch",
    );
    expect(send).not.toHaveBeenCalled();
    db.rpc.mockImplementation(async (_name, args) => ({
      data: args.p_action === "claim" ? [row] : false,
      error: null,
    }));
    expect(await runCommercePaymentMailJob(db, send, "order-1")).toEqual({
      accepted: 0,
      deferred: 1,
    });
    expect(send).not.toHaveBeenCalled();
  });
  it("preserves a retry after a provider timeout without reporting successful sending", async () => {
    const db = database(),
      send = vi.fn().mockRejectedValue(new Error("synthetic timeout"));
    expect(await runCommercePaymentMailJob(db, send)).toEqual({ accepted: 0, deferred: 1 });
    expect(db.rpc).toHaveBeenLastCalledWith(
      "commerce_payment_mail",
      expect.objectContaining({
        p_action: "result",
        p_data: expect.objectContaining({ provider_id: null, retryable: true }),
      }),
    );
  });
});
