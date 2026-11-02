/** Presentation only: fulfillment remains in the verified payment ledger. */
export function commerceProductLabel(product: string, locale: string) {
  const arabic = locale !== "en";
  const labels: Record<string, string> = {
    pro: "Pro",
    pro_plus: "Pro Plus",
    kids: arabic ? "مسارات كيدز" : "Masaarat Kids",
    academic: "Masaarat Academic",
    technical: "Masaarat TECH",
    lifetime_course: arabic ? "منهج واحد مدى الحياة" : "One curriculum for life",
    question_topup: arabic ? "١٠٠ سؤال إضافي" : "100 extra questions",
  };
  return labels[product] ?? product;
}
