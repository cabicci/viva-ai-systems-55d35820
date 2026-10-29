import { useLocale } from "@/lib/locale/locale-context";

const trustCopy = {
  "ar-EG": "دفع آمن عن طريق Stripe",
  "ar-MSA": "دفع آمن عبر Stripe",
  "ar-Gulf": "دفع آمن عن طريق Stripe",
  en: "Secure checkout powered by Stripe",
};

/** Payment-provider attribution, not an endorsement or a payment-method claim. */
export function StripeCheckoutTrust() {
  const { locale } = useLocale();
  return (
    <p className="text-center text-xs font-normal leading-relaxed text-muted-foreground" dir={locale === "en" ? "ltr" : "rtl"}>
      {trustCopy[locale]}
    </p>
  );
}