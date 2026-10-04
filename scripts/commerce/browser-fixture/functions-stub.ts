export const commerceCommand = async ({
  data,
}: {
  data: { action: string; data: Record<string, unknown> };
}) => {
  if (data.action === "methods")
    return [
      {
        code: "instapay",
        enabled: true,
        destination: "SYNTHETIC ONLY",
        instructions: "Synthetic instructions",
        currencies: ["EGP", "USD"],
      },
    ];
  if (data.action === "quote")
    return { original_minor: 16900, final_minor: 13520, currency: "EGP" };
  if (data.action === "create_order")
    return {
      id: "00000000-0000-4000-8000-000000000001",
      reference: "SYNTHETIC-ORDER",
      final_minor: 13520,
      currency: "EGP",
      expires_at: "2026-12-01T00:00:00Z",
      review_status: "awaiting_receipt",
      instructions_snapshot: {
        destination: "SYNTHETIC ONLY",
        instructions: "Synthetic instructions",
      },
    };
  return {};
};
export const uploadCommerceReceipt = async () => ({ id: "synthetic_receipt" });
export const readCommerceReceipt = async () => ({ base64: "", mime: "image/png" });
export const previewCommerceInvitation = async () => ({ html: "<p>Synthetic preview</p>" });
export const dispatchCommerceInvitations = async () => ({ accepted: 0, pending: 0, claimed: 0 });
