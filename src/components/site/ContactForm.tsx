import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getCountries, type CountryCode } from "libphonenumber-js";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  contactCountryLanguage,
  getCallingCode,
  isCountryCode,
  normalizePhoneNumber,
  resolvePhoneCountry,
} from "@/lib/contact-form";
import { submitContactForm, type ContactSubmitResult } from "@/lib/contact-form.functions";
import { useLocale } from "@/lib/locale/locale-context";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { useUiString } from "@/lib/locale/use-ui-strings";
import type { UiStringKey } from "@/lib/locale/ui-strings";

function countryFlag(countryCode: CountryCode): string {
  return countryCode
    .split("")
    .map((letter) => String.fromCodePoint(127397 + letter.charCodeAt(0)))
    .join("");
}

function resultErrorKey(result: ContactSubmitResult): UiStringKey {
  if (result.success) return "contact.error.service";
  if (result.error === "invalid_phone") return "contact.error.phone";
  if (result.error === "captcha") return "contact.error.captcha";
  if (result.error === "rate_limit") return "contact.error.rateLimit";
  return "contact.error.service";
}

export function ContactForm() {
  const t = useUiString();
  const { locale, lang, countryCode } = useLocale();
  const localeSearch = useLocaleLinkSearch();
  const submit = useServerFn(submitContactForm);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(() =>
    resolvePhoneCountry(countryCode, locale),
  );
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [errorKey, setErrorKey] = useState<UiStringKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const countryLanguage = contactCountryLanguage(locale);
  const countries = useMemo(() => {
    const displayNames = new Intl.DisplayNames([countryLanguage], { type: "region" });
    return getCountries()
      .map((code) => ({
        code,
        name: displayNames.of(code) ?? code,
        callingCode: getCallingCode(code),
      }))
      .sort((left, right) => left.name.localeCompare(right.name, countryLanguage));
  }, [countryLanguage]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorKey(null);
    const data = new FormData(event.currentTarget);
    const firstName = String(data.get("firstName") ?? "").trim();
    const lastName = String(data.get("lastName") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const rawPhone = String(data.get("phone") ?? "").trim();
    const company = String(data.get("company") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();
    const consentToProcess = data.get("consentToProcess") === "on";

    if (!firstName || !email || message.length < 5) {
      setErrorKey("contact.error.required");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorKey("contact.error.email");
      return;
    }
    const phone = rawPhone ? normalizePhoneNumber(rawPhone, selectedCountry) : "";
    if (rawPhone && !phone) {
      setErrorKey("contact.error.phone");
      return;
    }
    if (!consentToProcess) {
      setErrorKey("contact.error.consent");
      return;
    }
    if (!turnstileToken) {
      setErrorKey("contact.error.captchaRequired");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submit({
        data: {
          firstName,
          lastName,
          email,
          phone,
          countryCode: selectedCountry,
          company,
          message,
          locale,
          consentToProcess: true,
          turnstileToken,
          pageUri: window.location.href,
        },
      });
      if (!result.success) {
        setErrorKey(resultErrorKey(result));
        setTurnstileToken("");
        setTurnstileResetKey((value) => value + 1);
        return;
      }
      setSubmitted(true);
    } catch (error) {
      console.error("Contact form submission failed:", error);
      setErrorKey("contact.error.service");
      setTurnstileToken("");
      setTurnstileResetKey((value) => value + 1);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        className="flex min-h-[480px] flex-col items-center justify-center rounded-[2rem] border border-emerald-200/70 bg-white/90 p-8 text-center shadow-[0_24px_80px_-36px_rgba(16,185,129,0.38)] backdrop-blur md:p-12"
        role="status"
      >
        <span className="mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </span>
        <h2 className="text-2xl font-black md:text-3xl">{t("contact.success.title")}</h2>
        <p className="mt-3 max-w-md leading-7 text-muted-foreground">{t("contact.success.body")}</p>
      </div>
    );
  }

  return (
    <form
      className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_24px_80px_-36px_rgba(60,46,124,0.42)] backdrop-blur md:p-8"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="mb-7">
        <h2 className="text-2xl font-black">{t("contact.form.title")}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("contact.form.subtitle")}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("contact.field.firstName")} htmlFor="contact-first-name">
          <Input
            id="contact-first-name"
            name="firstName"
            autoComplete="given-name"
            required
            maxLength={80}
          />
        </Field>
        <Field
          label={`${t("contact.field.lastName")} (${t("contact.optional")})`}
          htmlFor="contact-last-name"
        >
          <Input id="contact-last-name" name="lastName" autoComplete="family-name" maxLength={80} />
        </Field>
      </div>

      <div className="mt-5">
        <Field label={t("contact.field.email")} htmlFor="contact-email">
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            dir="ltr"
            required
            maxLength={254}
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field
          label={`${t("contact.field.company")} (${t("contact.optional")})`}
          htmlFor="contact-company"
        >
          <Input id="contact-company" name="company" autoComplete="organization" maxLength={160} />
        </Field>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <Field label={t("contact.field.country")} htmlFor="contact-country">
          <select
            id="contact-country"
            name="country"
            value={selectedCountry}
            required
            onChange={(event) => setSelectedCountry(event.target.value as CountryCode)}
            className="flex h-10 w-full rounded-md border border-input bg-white px-3 text-sm shadow-sm outline-none transition focus:ring-2 focus:ring-primary/30"
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {countryFlag(country.code)} {country.name} ({country.callingCode})
              </option>
            ))}
          </select>
        </Field>
        <Field
          label={`${t("contact.field.phone")} (${t("contact.optional")})`}
          htmlFor="contact-phone"
        >
          <div className="relative" dir="ltr">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center border-r border-border pr-3 text-sm font-semibold text-foreground/70">
              {getCallingCode(selectedCountry)}
            </span>
            <Input
              id="contact-phone"
              name="phone"
              type="tel"
              autoComplete="tel-national"
              inputMode="tel"
              className="h-10 pl-20"
              maxLength={32}
            />
          </div>
        </Field>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {isCountryCode(countryCode) ? t("contact.phone.detected") : t("contact.phone.helper")}
      </p>

      <div className="mt-5">
        <Field label={t("contact.field.message")} htmlFor="contact-message">
          <Textarea id="contact-message" name="message" rows={6} required maxLength={4_000} />
        </Field>
      </div>

      <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl bg-muted/45 p-4 text-sm leading-6">
        <input
          name="consentToProcess"
          type="checkbox"
          required
          className="mt-1 h-4 w-4 shrink-0 accent-primary"
        />
        <span>
          {t("contact.consent")}{" "}
          <Link
            to="/privacy"
            search={localeSearch()}
            className="font-semibold text-primary underline underline-offset-4"
          >
            {t("contact.privacy")}
          </Link>
        </span>
      </label>

      <div className="mt-6 overflow-hidden rounded-xl">
        <TurnstileWidget
          key={locale}
          onVerify={setTurnstileToken}
          onExpire={() => setTurnstileToken("")}
          onError={() => setErrorKey("contact.error.captcha")}
          language={lang}
          theme="light"
          resetKey={turnstileResetKey}
        />
      </div>

      {errorKey ? (
        <p
          className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm font-medium text-destructive"
          role="alert"
        >
          {t(errorKey)}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="mt-6 h-12 w-full rounded-xl" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {t("contact.submitting")}
          </>
        ) : (
          <>
            <Send className="h-4 w-4" aria-hidden="true" />
            {t("contact.submit")}
          </>
        )}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-bold text-foreground/85">
        {label}
      </label>
      {children}
    </div>
  );
}
