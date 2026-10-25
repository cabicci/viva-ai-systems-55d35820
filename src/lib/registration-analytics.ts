import { readAnalyticsConsent, trackConfirmedRegistration } from "@/lib/analytics";

const PENDING_KEY = "masaarat.pending-registration-analytics.v1";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

type RegistrationUser = {
  id: string;
  email_confirmed_at?: string | null;
  identities?: readonly unknown[];
};

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function clearPendingRegistration(): void {
  try {
    storage()?.removeItem(PENDING_KEY);
  } catch {
    // Storage restrictions must never break account creation or sign-in.
  }
}

/** A successful request is pending, not a completed registration conversion. */
export function rememberPendingRegistration(
  user: RegistrationUser | null,
  now = Date.now(),
): boolean {
  try {
    if (readAnalyticsConsent() !== "granted" || !user?.id || !user.identities?.length) return false;
    const store = storage();
    if (!store) return false;
    store.setItem(PENDING_KEY, JSON.stringify({ userId: user.id, createdAt: now }));
    return true;
  } catch {
    return false;
  }
}

/** Match the confirmed account to this browser's consented signup attempt. */
export function completePendingRegistration(
  user: RegistrationUser | null,
  now = Date.now(),
): boolean {
  try {
    const store = storage();
    const raw = store?.getItem(PENDING_KEY);
    if (!store || !raw) return false;
    const pending = JSON.parse(raw) as { userId?: unknown; createdAt?: unknown };
    if (
      typeof pending.userId !== "string" ||
      typeof pending.createdAt !== "number" ||
      !Number.isFinite(pending.createdAt) ||
      now < pending.createdAt ||
      now - pending.createdAt > MAX_AGE_MS
    ) {
      clearPendingRegistration();
      return false;
    }
    if (readAnalyticsConsent() !== "granted") {
      clearPendingRegistration();
      return false;
    }
    if (!user?.email_confirmed_at || user.id !== pending.userId) return false;
    // Consume before dispatch: repeated auth notifications/effects do not replay it.
    store.removeItem(PENDING_KEY);
    return trackConfirmedRegistration();
  } catch {
    clearPendingRegistration();
    return false;
  }
}
