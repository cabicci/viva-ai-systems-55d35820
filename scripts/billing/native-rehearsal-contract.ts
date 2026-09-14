import { randomBytes } from "node:crypto";

export type RehearsalHttpResult = {
  status: number;
  json: unknown;
  text: string;
};

export type DisposableCredentials = {
  email: string;
  password: string;
};

function randomNonce(): string {
  return randomBytes(18).toString("base64url");
}

export function createDisposableCredentials(
  nonceFactory: () => string = randomNonce,
): DisposableCredentials {
  const emailNonce = nonceFactory();
  const passwordNonce = nonceFactory();
  if (
    !/^[A-Za-z0-9_-]{16,}$/.test(emailNonce) ||
    !/^[A-Za-z0-9_-]{16,}$/.test(passwordNonce)
  ) {
    throw new Error("Disposable credential nonce is invalid");
  }
  return {
    email: `native-reh-${emailNonce}@example.com`,
    password: `Nr!1-${passwordNonce}-aA`,
  };
}

function structuredError(
  value: unknown,
): { code: string; message: string } | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { code?: unknown; message?: unknown };
  if (typeof candidate.code !== "string" || typeof candidate.message !== "string") {
    return null;
  }
  return { code: candidate.code, message: candidate.message };
}

/**
 * Accept only the two known PostgREST representations of the target RPC's
 * ordinary-user denial. Status alone is insufficient: 404/5xx, bad JWTs, and
 * unrelated errors must never count as proof that the service-role gate ran.
 */
export function isExpectedOrdinaryAuthDenial(result: RehearsalHttpResult): boolean {
  const error = structuredError(result.json);
  if (!error) return false;
  if (result.status === 400) {
    return error.code === "P0001" && error.message === "QUOTA_SERVICE_ONLY";
  }

  if (result.status === 401 || result.status === 403) {
    return (
      error.code === "42501" &&
      (error.message === "QUOTA_SERVICE_ONLY" ||
        error.message === "permission denied for function reserve_learner_ai_access")
    );
  }

  return false;
}
