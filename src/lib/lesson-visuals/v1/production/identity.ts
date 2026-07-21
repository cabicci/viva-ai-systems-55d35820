import { PRODUCTION_LOCALES } from "../constants";
import type { Locale } from "../types";
import type { ProviderGenerationRequest, ProviderGenerationResponse } from "./types";

const LOCALE_SET = new Set<string>(PRODUCTION_LOCALES);

export function isKnownLocale(locale: string): locale is Locale {
  return LOCALE_SET.has(locale);
}

export function validateRequestIdentity(req: ProviderGenerationRequest): string[] {
  const errors: string[] = [];
  if (!req.runId?.trim()) errors.push("runId missing");
  if (!req.controlRoomAuthorizationId?.trim()) errors.push("controlRoomAuthorizationId missing");
  if (!/^[a-f0-9]{40}$/.test(req.sourceSha)) errors.push("sourceSha invalid");
  if (!/^[a-f0-9]{64}$/.test(req.approvedManifestSha256)) {
    errors.push("approvedManifestSha256 invalid");
  }
  if (!req.cellId?.trim()) errors.push("cellId missing");
  if (!req.lessonId?.trim()) errors.push("lessonId missing");
  if (!isKnownLocale(req.locale)) errors.push(`unknown locale ${req.locale}`);
  const expectedCell = `${req.lessonId}__${req.locale}`;
  if (req.cellId !== expectedCell) {
    errors.push(`cellId ${req.cellId} != expected ${expectedCell}`);
  }
  if (![1, 2, 3, 4].includes(req.method)) errors.push("method invalid");
  if (!req.idempotencyKey?.trim()) errors.push("idempotencyKey missing");
  if (!Number.isInteger(req.attemptNumber) || req.attemptNumber < 1) {
    errors.push("attemptNumber invalid");
  }
  return errors;
}

export function validateResponseIdentity(
  req: ProviderGenerationRequest,
  res: ProviderGenerationResponse,
): string[] {
  const errors: string[] = [];
  if (res.cellId !== req.cellId) errors.push("response cellId mismatch");
  if (res.lessonId !== req.lessonId) errors.push("response lessonId mismatch");
  if (res.locale !== req.locale) errors.push("response locale mismatch / cross-locale output");
  if (res.runId !== req.runId) errors.push("response runId mismatch");
  if (res.idempotencyKey !== req.idempotencyKey) errors.push("response idempotencyKey mismatch");
  if (res.attemptNumber !== req.attemptNumber) errors.push("response attemptNumber mismatch");
  if (!res.providerRequestId?.trim()) errors.push("missing provider request ID");
  return errors;
}

export function assertUniqueProviderRequestIds(
  ids: Iterable<string>,
): { ok: boolean; duplicate: string | null } {
  const seen = new Set<string>();
  for (const id of ids) {
    if (!id) continue;
    if (seen.has(id)) return { ok: false, duplicate: id };
    seen.add(id);
  }
  return { ok: true, duplicate: null };
}
