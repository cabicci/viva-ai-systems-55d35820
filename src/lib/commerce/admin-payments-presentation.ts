import type { SupportedLocale } from "@/lib/locale/types";

export type AdminPaymentTask = "review" | "record" | "access" | "refund";

const english = {
  tasks: "Payment administration tasks",
  review: "Review orders",
  record: "Record and allocate payment",
  access: "Manage access",
  refund: "Record a refund",
  overview: "Available records summary",
  overviewHint: "Totals cover only the records currently loaded.",
  reviewHint:
    "Review the orders in the current results and their receipts. A receipt alone does not confirm receipt of funds.",
  recordHint:
    "Choose eligible orders, then record received funds or allocate an existing payment balance. Verify the funds before saving.",
  accessHint:
    "Review the access rights in the current results. Changes apply only to the selected right.",
  refundHint:
    "Record funds already returned outside the platform. This form does not send money through a payment provider.",
  noOrders: "No orders in the current results. Check the filters or page above.",
  noAccess: "No access rights in the current results. Check the filters or page above.",
  noPayments: "No recorded payments in the loaded records.",
  noEligible: "No eligible orders in the current results. Check the filters or page above.",
  noRefunds: "No remaining refundable balance in the loaded records.",
  selection: "Selected orders",
  noSelection: "Select an eligible order to see its payment summary.",
  clearSelection: "Clear order selection",
  incompatible:
    "Selected orders cannot share this payment: check their method, currency and group.",
  incompatibleSource:
    "This recorded payment does not match the selected orders. Choose a compatible payment or record received funds.",
  verificationNeeded: "Confirm that the funds have actually been received before saving.",
  invalidAmounts: "Check the allocation amounts and available balance before saving.",
  savedInputs:
    "Could not confirm the result. Your entries are still here; retry with the same details.",
  saving: "Saving this action. Wait for the result before leaving this task.",
  source: "Payment source",
  newFunds: "New received funds",
  available: "Available balance",
  targetOrder: "Order opened from link",
  targetNotVisible:
    "This order is not in the current results. Check its status and the filters above.",
  receiptLoading: "Loading order receipts…",
  receiptFailed: "Could not load order receipts.",
  receiptEmpty: "No receipts returned for this order.",
  retry: "Retry loading receipts",
  refundTarget: "Selected refund balance",
  orderAllocation: "Order allocation",
  unallocated: "Unallocated payment balance",
};
const arabic: typeof english = {
  tasks: "مهام إدارة المدفوعات",
  review: "مراجعة الطلبات",
  record: "تسجيل وتوزيع دفعة",
  access: "إدارة حقوق الوصول",
  refund: "تسجيل استرداد",
  overview: "ملخص السجلات المتاحة",
  overviewHint: "الإجماليات محسوبة من السجلات المحمّلة حاليًا.",
  reviewHint: "راجع الطلبات الظاهرة وإيصالاتها. وجود إيصال وحده لا يؤكد استلام المبلغ.",
  recordHint:
    "اختر الطلبات المؤهلة، ثم سجّل المبلغ المستلم أو وزّع رصيد دفعة مسجلة. تحقق من استلام الأموال قبل الحفظ.",
  accessHint: "راجع حقوق الوصول الظاهرة في النتائج الحالية. التعديل يخص حق الوصول المحدد فقط.",
  refundHint:
    "سجّل الأموال التي أُعيدت بالفعل خارج المنصة. هذا النموذج لا يرسل أموالًا عبر مزود الدفع.",
  noOrders: "لا توجد طلبات في النتائج الحالية. راجع الفلاتر أو الصفحة بالأعلى.",
  noAccess: "لا توجد حقوق وصول في النتائج الحالية. راجع الفلاتر أو الصفحة بالأعلى.",
  noPayments: "لا توجد دفعات مسجلة ضمن السجلات المحملة.",
  noEligible: "لا توجد طلبات مؤهلة في النتائج الحالية. راجع الفلاتر أو الصفحة بالأعلى.",
  noRefunds: "لا يوجد رصيد متبقٍ قابل للاسترداد ضمن السجلات المحملة.",
  selection: "الطلبات المحددة",
  noSelection: "اختر طلبًا مؤهلًا لعرض ملخص دفعته.",
  clearSelection: "مسح اختيار الطلبات",
  incompatible: "لا يمكن جمع هذه الطلبات في دفعة واحدة؛ راجع وسيلة الدفع والعملة والمجموعة.",
  incompatibleSource:
    "الدفعة المسجلة لا تطابق الطلبات المحددة. اختر دفعة متوافقة أو سجّل مبلغًا مستلمًا.",
  verificationNeeded: "أكّد استلام الأموال فعليًا قبل الحفظ.",
  invalidAmounts: "راجع مبالغ التوزيع والرصيد المتاح قبل الحفظ.",
  savedInputs: "تعذر التأكد من نتيجة الحفظ. بياناتك ما زالت موجودة؛ أعد المحاولة بنفس البيانات.",
  saving: "جارٍ حفظ الإجراء. انتظر النتيجة قبل مغادرة هذه المهمة.",
  source: "مصدر الدفعة",
  newFunds: "مبلغ مستلم جديد",
  available: "الرصيد المتاح",
  targetOrder: "الطلب المفتوح من الرابط",
  targetNotVisible: "هذا الطلب غير ظاهر في النتائج الحالية. راجع حالته والفلاتر بالأعلى.",
  receiptLoading: "جارٍ تحميل إيصالات الطلب…",
  receiptFailed: "تعذر تحميل إيصالات الطلب.",
  receiptEmpty: "لم تُرجع الخدمة إيصالات لهذا الطلب.",
  retry: "إعادة تحميل الإيصالات",
  refundTarget: "الرصيد المحدد للاسترداد",
  orderAllocation: "مبلغ مخصص لطلب",
  unallocated: "رصيد دفعة غير موزع",
};

const localized: Record<SupportedLocale, typeof english> = {
  en: english,
  "ar-MSA": arabic,
  "ar-EG": {
    ...arabic,
    recordHint:
      "اختار الطلبات المؤهلة، وبعدها سجّل المبلغ اللي استلمته أو وزّع رصيد دفعة مسجلة. اتأكد من وصول الفلوس قبل الحفظ.",
    savedInputs: "ما قدرناش نتأكد من نتيجة الحفظ. بياناتك لسه موجودة؛ جرّب تاني بنفس البيانات.",
    saving: "بنحفظ الإجراء. استنى النتيجة قبل ما تسيب المهمة دي.",
  },
  "ar-Gulf": {
    ...arabic,
    recordHint:
      "اختر الطلبات المؤهلة، وبعدها سجّل المبلغ المستلم أو وزّع رصيد دفعة مسجلة. تأكّد من وصول المبلغ قبل الحفظ.",
    savedInputs: "ما قدرنا نتأكد من نتيجة الحفظ. بياناتك موجودة؛ حاول مرة ثانية بنفس البيانات.",
    saving: "جاري حفظ الإجراء. انتظر النتيجة قبل مغادرة المهمة.",
  },
};

export const adminPaymentsPresentation = (locale: SupportedLocale) => localized[locale];
