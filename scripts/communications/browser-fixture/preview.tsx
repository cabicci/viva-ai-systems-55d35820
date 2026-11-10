import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider } from "@/lib/locale/locale-context";
import type { SupportedLocale } from "@/lib/locale/types";
import { PhoneVerification } from "@/components/communications/PhoneVerification";
import { Route } from "@/routes/signup";
const Signup = (Route as unknown as { component: () => React.ReactNode }).component;
export function Preview() {
  const [locale, setLocale] = useState<SupportedLocale>("en");
  return (
    <LocaleProvider effectiveLocale={locale}>
      <main dir={locale === "en" ? "ltr" : "rtl"} className="p-4 max-w-4xl mx-auto grid gap-5">
        <select
          aria-label="Locale"
          value={locale}
          onChange={(e) => setLocale(e.target.value as SupportedLocale)}
        >
          {["ar-EG", "ar-MSA", "ar-Gulf", "en"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <Signup key={locale + "signup"} />
        <PhoneVerification key={locale + "phone"} />
      </main>
    </LocaleProvider>
  );
}
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <Preview />
  </QueryClientProvider>,
);
