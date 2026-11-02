/** Selection only: prices, ownership, entitlements and credit are server owned. */
export type CommercialArea = "ai" | "academic" | "technical" | "kids";
export type CommercialPurchaseSelection =
  | {
      product: "curriculum_lifetime";
      area: CommercialArea;
      course: string;
      childId?: string;
      requestId: string;
      marketCode: "EG";
      locale?: string;
    }
  | {
      product: "question_topup";
      walletScope: "account" | "family";
      requestId: string;
      marketCode: "EG";
      locale?: string;
    };

export type CommercialPurchaseOptions = {
  curricula: { area: CommercialArea; course: string; title: string }[];
  children: { id: string; name: string }[];
};
