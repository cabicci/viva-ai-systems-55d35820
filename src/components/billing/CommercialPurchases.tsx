import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";
import { commercialCopy } from "@/lib/billing/commercial-copy";
import { packageBenefits } from "@/lib/billing/package-benefits";
import { PaymentMethods } from "@/components/commerce/PaymentMethods";
import { getLineCopy } from "@/lib/learning-lines";
import {
  BillingUnavailableError,
  loadCommercialPurchaseOptions,
  resolveCheckoutUrl,
  type LiveCheckoutRequest,
} from "@/lib/billing/checkout-client";

type Area = "ai" | "academic" | "technical" | "kids";

/** Selection is only an intent. The server verifies publication, ownership and price. */
export function CommercialPurchases({ area }: { area: Area }) {
  const { user, loading } = useAuth();
  const { locale } = useLocale();
  const w = commercialCopy(locale);
  const [selectedArea, setSelectedArea] = useState<Area>(area);
  const [course, setCourse] = useState("");
  const [childId, setChildId] = useState("");
  const [busy, setBusy] = useState(false);
  const [manualBusy, setManualBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const pending = useRef<{ signature: string; id: string; offerKey: string } | null>(null);
  const running = useRef(false);
  const options = useQuery({
    queryKey: ["commercial-purchase-options", user?.id, locale],
    enabled: !!user && !loading,
    queryFn: () => loadCommercialPurchaseOptions(locale),
  });
  const curricula = options.data?.curricula.filter((item) => item.area === selectedArea) ?? [];
  const selected = curricula.find((item) => item.course === course);
  const children = options.data?.children ?? [];
  const child = children.find((item) => item.id === childId);

  async function checkout(
    kind: "curriculum_lifetime" | "question_topup",
    offer?: { code: string; phone?: string },
  ) {
    if (
      running.current ||
      !user ||
      (kind === "curriculum_lifetime" && (!selected || (selectedArea === "kids" && !child)))
    )
      return;
    const code = kind === "question_topup" ? (offer?.code.trim().toUpperCase() ?? "") : "";
    const normalizedPhone = offer?.phone;
    const selection =
      kind === "curriculum_lifetime"
        ? {
            product: kind,
            area: selectedArea,
            course: selected!.course,
            ...(selectedArea === "kids" ? { childId: child!.id } : {}),
          }
        : {
            product: kind,
            walletScope: area === "kids" ? ("family" as const) : ("account" as const),
          };
    const signature = JSON.stringify({ user: user.id, selection, code, phone: normalizedPhone });
    if (pending.current?.signature !== signature) {
      pending.current = { signature, id: crypto.randomUUID(), offerKey: crypto.randomUUID() };
    }
    const request: LiveCheckoutRequest = {
      ...selection,
      requestId: pending.current.id,
      marketCode: "EG",
      locale,
      ...(code
        ? {
            offer: {
              code,
              key: pending.current.offerKey,
              ...(normalizedPhone ? { phone: normalizedPhone } : {}),
            },
          }
        : {}),
    };
    running.current = true;
    setBusy(true);
    setFailed(false);
    try {
      // One-time products never fall back to a subscription or another payment rail.
      const url = await resolveCheckoutUrl(request, async () => {
        throw new Error("PURCHASE_UNAVAILABLE");
      });
      window.location.assign(url);
    } catch (error) {
      if (error instanceof BillingUnavailableError && error.code === "COMMERCIAL_REQUEST_EXPIRED")
        pending.current = null;
      setFailed(true);
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  const input = "mt-2 min-h-11 w-full rounded border bg-background px-3";
  return (
    <section id="question-topup" className="space-y-5 scroll-mt-28" aria-label={w.lifetime}>
      <div className="grid gap-5 md:grid-cols-2">
        <article className="space-y-4 rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-bold">{w.lifetime}</h2>
          <p className="text-2xl font-black">{w.lifetimePrice}</p>
          <ul className="list-disc space-y-2 ps-5 text-sm leading-relaxed text-muted-foreground">
            {packageBenefits(locale).lifetime.map((line) => (
              <li key={line}>{line}</li>
            ))}
            {selectedArea === "kids" && <li>{w.childDetail}</li>}
          </ul>
          {user && (
            <>
              <label className="block">
                {locale === "en" ? "Learning path" : "المسار"}
                <select
                  className={input}
                  value={selectedArea}
                  disabled={busy || manualBusy}
                  onChange={(e) => {
                    setSelectedArea(e.target.value as Area);
                    setCourse("");
                    setChildId("");
                  }}
                >
                  <option value="ai">
                    {locale === "en" ? "Artificial intelligence" : "الذكاء الاصطناعي"}
                  </option>
                  <option value="academic">{locale === "en" ? "Academic" : "الأكاديمي"}</option>
                  <option value="technical">{locale === "en" ? "Technical" : "التقني"}</option>
                  <option value="kids">{locale === "en" ? "Kids" : "كيدز"}</option>
                </select>
              </label>
              <label className="block">
                {w.curriculum}
                <select
                  className={input}
                  value={course}
                  disabled={busy || manualBusy || options.isPending || !!options.error}
                  onChange={(e) => setCourse(e.target.value)}
                >
                  <option value="">—</option>
                  {curricula.map((item) => (
                    <option key={item.course} value={item.course}>
                      {item.area === "technical" && item.course === "furniture"
                        ? getLineCopy(locale).furniture
                        : item.title}
                    </option>
                  ))}
                </select>
              </label>
              {selectedArea === "kids" && (
                <label className="block">
                  {w.child}
                  <select
                    className={input}
                    value={childId}
                    disabled={busy || manualBusy || options.isPending || !!options.error}
                    onChange={(e) => setChildId(e.target.value)}
                  >
                    <option value="">—</option>
                    {children.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {options.isSuccess && !curricula.length && <p role="status">{w.empty}</p>}
              {options.isSuccess && selectedArea === "kids" && !children.length && (
                <p role="status">{w.childEmpty}</p>
              )}
              <PaymentMethods
                market="EG"
                oneTime={{
                  kind: "lifetime_course",
                  area: selectedArea,
                  course,
                  ...(selectedArea === "kids" && child ? { child_id: child.id } : {}),
                  wallet_scope: selectedArea === "kids" ? "family" : "account",
                }}
                disabled={busy || !selected || (selectedArea === "kids" && !child)}
                stripe={() => checkout("curriculum_lifetime")}
                onBusyChange={setManualBusy}
              >
                {w.buy}
              </PaymentMethods>
            </>
          )}
        </article>
        <article className="space-y-4 rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-bold">{w.topup}</h2>
          <p className="text-2xl font-black">{w.topupPrice}</p>
          <ul className="list-disc space-y-2 ps-5 text-sm leading-relaxed text-muted-foreground">
            {packageBenefits(locale).topup.map((line) => (
              <li key={line}>{line}</li>
            ))}
            {area === "kids" && <li>{w.familyTopup}</li>}
          </ul>
          {user && (
            <PaymentMethods
              market="EG"
              oneTime={{
                kind: "question_topup",
                wallet_scope: area === "kids" ? "family" : "account",
              }}
              disabled={
                busy ||
                (area === "kids" && (options.isPending || !!options.error || !children.length))
              }
              stripe={(offer) => checkout("question_topup", offer)}
            >
              {w.buy}
            </PaymentMethods>
          )}
        </article>
      </div>
      {!user && (
        <Button asChild disabled={loading}>
          <a href={`/login?locale=${locale}`}>{w.signIn}</a>
        </Button>
      )}
      {(failed || options.error) && (
        <p role="alert" className="text-destructive">
          {w.unavailable}
        </p>
      )}
    </section>
  );
}
