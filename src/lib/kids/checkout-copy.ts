import type { SupportedLocale } from "@/lib/locale/types";

const ar = {
  offer: "هل ترغب في إضافة باقة كيدز العائلية؟",
  prices: "عرض أسعار كيدز",
  pending: "تقدر تشترك في كيدز بشكل مستقل من قسم أسعارها. الدفع الحالي يخص باقة الكبار فقط.",
  confirm: "راجع اختيارك قبل الانتقال إلى الدفع التجريبي",
  choice: "باقة كيدز اختيارية ومستقلة؛ يمكنك شراؤها من قسم أسعارها بعد إتمام هذا الدفع أو قبله.",
  adultOnly: "متابعة دفع باقة الكبار فقط",
  back: "العودة لاختيار الباقة",
} as const;
type Copy = { [K in keyof typeof ar]: string };

const eg: Copy = {
  offer: "تحب تضيف باقة كيدز للعيلة؟",
  prices: "شوف أسعار كيدز",
  pending: "تقدر تشترك في كيدز لوحدها من قسم أسعارها. الدفع الحالي لباقة الكبار بس.",
  confirm: "راجع اختيارك قبل الدفع التجريبي",
  choice: "كيدز باقة اختيارية منفصلة؛ تقدر تشتريها من قسم أسعارها قبل الدفع ده أو بعده.",
  adultOnly: "كمّل دفع باقة الكبار بس",
  back: "ارجع لاختيار الباقة",
};
const gulf: Copy = {
  offer: "تبي تضيف باقة كيدز للعائلة؟",
  prices: "شوف أسعار كيدز",
  pending: "تقدر تشترك بكيدز لحالها من قسم أسعارها. الدفع الحالي لباقة الكبار بس.",
  confirm: "راجع اختيارك قبل الدفع التجريبي",
  choice: "كيدز باقة اختيارية مستقلة؛ تقدر تشتريها من قسم أسعارها قبل هالدفع أو بعده.",
  adultOnly: "تابع دفع باقة الكبار بس",
  back: "ارجع لاختيار الباقة",
};
const en: Copy = {
  offer: "Interested in adding a Kids family plan?",
  prices: "View Kids prices",
  pending:
    "You can subscribe to Kids separately in its pricing section. This checkout is for the adult plan only.",
  confirm: "Review your selection before test checkout",
  choice:
    "Kids is an optional, separate plan. Subscribe in its pricing section before or after this checkout.",
  adultOnly: "Continue with adult plan only",
  back: "Back to plan selection",
};

export function getKidsCheckoutCopy(locale: SupportedLocale): Copy {
  if (locale === "en") return en;
  if (locale === "ar-EG") return eg;
  if (locale === "ar-Gulf") return gulf;
  return ar;
}
