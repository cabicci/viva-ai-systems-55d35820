import { isRedirect, redirect } from "@tanstack/react-router";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function parsePaymentSearch(raw: Record<string, unknown>): { order?: string } {
  return { order: typeof raw.order === "string" && uuid.test(raw.order) ? raw.order : undefined };
}
export function parsePaymentLoginSearch(raw: Record<string, unknown>): {
  order?: string;
  paymentView?: "customer" | "admin";
} {
  const { order } = parsePaymentSearch(raw);
  return order && (raw.paymentView === "customer" || raw.paymentView === "admin")
    ? { order, paymentView: raw.paymentView }
    : {};
}
/** Preserve a specific payment destination without accepting arbitrary redirect URLs. */
export async function guardPaymentLink(
  guard: () => Promise<void>,
  order: string | undefined,
  paymentView: "customer" | "admin",
) {
  try {
    await guard();
  } catch (error) {
    if (order && isRedirect(error) && error.options.to === "/login") {
      throw redirect({ to: "/login", search: { order, paymentView }, replace: true });
    }
    throw error;
  }
}
