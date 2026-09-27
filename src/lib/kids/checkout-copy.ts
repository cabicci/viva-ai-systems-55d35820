import type { SupportedLocale } from "@/lib/locale/types";

const ar = {
  offer: "هل ترغب في إضافة باقة كيدز العائلية؟",
  prices: "عرض أسعار كيدز",
  pending: "باقة كيدز غير متاحة للشراء بعد. الدفع الحالي يخص باقة الكبار المختارة فقط.",
  confirm: "راجع اختيارك قبل الانتقال إلى الدفع التجريبي",
  choice: "باقة كيدز إضافة اختيارية مستقلة. لن تُضاف إلى هذا الطلب أو يُحصّل ثمنها الآن.",
  adultOnly: "متابعة دفع باقة الكبار فقط",
  back: "العودة لاختيار الباقة",
} as const;
type Copy = { [K in keyof typeof ar]: string };

const eg: Copy = {
  offer: "تحب تضيف باقة كيدز للعيلة؟",
  prices: "شوف أسعار كيدز",
  pending: "شراء باقة كيدز لسه مش متاح. الدفع الحالي لباقة الكبار اللي اخترتها بس.",
  confirm: "راجع اختيارك قبل الدفع التجريبي",
  choice: "كيدز إضافة اختيارية منفصلة، ومش هتضاف للطلب ده ولا هيتخصم تمنها دلوقتي.",
  adultOnly: "كمّل دفع باقة الكبار بس",
  back: "ارجع لاختيار الباقة",
};
const gulf: Copy = {
  offer: "تبي تضيف باقة كيدز للعائلة؟",
  prices: "شوف أسعار كيدز",
  pending: "شراء كيدز ما هو متاح للحين. الدفع الحالي لباقة الكبار المختارة بس.",
  confirm: "راجع اختيارك قبل الدفع التجريبي",
  choice: "كيدز إضافة اختيارية مستقلة، وما راح تنضاف للطلب أو ينخصم سعرها الحين.",
  adultOnly: "تابع دفع باقة الكبار بس",
  back: "ارجع لاختيار الباقة",
};
const en: Copy = {
  offer: "Interested in adding a Kids family plan?",
  prices: "View Kids prices",
  pending: "Kids cannot be purchased yet. This checkout is for the selected adult plan only.",
  confirm: "Review your selection before test checkout",
  choice: "Kids is an optional separate plan. It will not be added to this order or charged now.",
  adultOnly: "Continue with adult plan only",
  back: "Back to plan selection",
};

export function getKidsCheckoutCopy(locale: SupportedLocale): Copy {
  if (locale === "en") return en;
  if (locale === "ar-EG") return eg;
  if (locale === "ar-Gulf") return gulf;
  return ar;
}
