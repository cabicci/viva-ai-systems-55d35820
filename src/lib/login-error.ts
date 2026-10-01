import type { UiStringKey } from "@/lib/locale/ui-strings";

export function loginErrorPresentation(error: unknown): { key: UiStringKey; canReset: boolean } {
  const detail = error && typeof error === "object" ? (error as Record<string, unknown>) : {};
  if (detail.code === "invalid_credentials") {
    return { key: "auth.login.error.credentials", canReset: true };
  }
  if (detail.code === "email_not_confirmed") {
    return { key: "auth.login.error.unconfirmed", canReset: false };
  }
  if (detail.status === 429 || detail.code === "over_request_rate_limit") {
    return { key: "auth.login.error.rateLimit", canReset: false };
  }
  if (
    detail.name === "AuthRetryableFetchError" ||
    (typeof detail.message === "string" &&
      /failed to fetch|networkerror|network request failed|load failed/i.test(detail.message))
  ) {
    return { key: "auth.login.error.connection", canReset: false };
  }
  return { key: "auth.login.failedMessage", canReset: false };
}
