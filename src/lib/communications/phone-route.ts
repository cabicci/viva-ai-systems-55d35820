import { isRedirect, redirect } from "@tanstack/react-router";
import { requireAuthBeforeLoad } from "@/lib/auth-route-guard";

export async function requirePhoneAccount(search: { locale?: string }) {
  try {
    await requireAuthBeforeLoad();
  } catch (error) {
    if (!isRedirect(error)) throw error;
    throw redirect({
      to: "/login",
      search: { locale: search.locale, returnTo: "/verify-phone" },
      replace: true,
    });
  }
}
