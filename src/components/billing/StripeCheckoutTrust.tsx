import { useLocale } from "@/lib/locale/locale-context";
import type { SupportedLocale } from "@/lib/locale/types";
import slateMark from "@/assets/billing/stripe-wordmark-slate.svg.asset.json";
import whiteMark from "@/assets/billing/stripe-wordmark-white.svg.asset.json";

const trustCopy = {
  "ar-EG": "دفع آمن بكارت ائتمان أو خصم عن طريق Stripe",
  "ar-MSA": "دفع آمن ببطاقة ائتمان أو خصم عبر Stripe",
  "ar-Gulf": "دفع آمن ببطاقة ائتمان أو خصم عن طريق Stripe",
  en: "Secure credit/debit card payment via Stripe",
};

const linkCopy = {
  "ar-EG": "Link اختياري. اختار «Pay without Link» عشان تدخل بيانات الكارت.",
  "ar-MSA": "Link اختياري. اختر «Pay without Link» لإدخال بيانات البطاقة.",
  "ar-Gulf": "Link اختياري. اختر «Pay without Link» لإدخال بيانات البطاقة.",
  en: "Link is optional. Choose “Pay without Link” to enter your card details.",
};

export function stripeCardPaymentLabel(locale: SupportedLocale) {
  return trustCopy[locale];
}

/** Official, unmodified payment-provider marks; never an endorsement or card-brand claim. */
export function StripeCheckoutTrust({ showLinkHelp = false }: { showLinkHelp?: boolean }) {
  const { locale } = useLocale();
  return (
    <div className="min-w-0 space-y-1 text-center text-xs font-normal leading-relaxed text-muted-foreground" dir={locale === "en" ? "ltr" : "rtl"}>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <p className="min-w-0 break-words">{stripeCardPaymentLabel(locale)}</p>
        <span className="inline-flex shrink-0 items-center py-1" aria-hidden="true">
          <img src={slateMark.url} alt="" width={48} height={20} className="h-5 w-12 object-contain dark:hidden" />
          <img src={whiteMark.url} alt="" width={48} height={20} className="hidden h-5 w-12 object-contain dark:block" />
        </span>
      </div>
      {showLinkHelp && <p className="break-words">{linkCopy[locale]}</p>}
    </div>
  );
}