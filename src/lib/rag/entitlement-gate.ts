import type { DenialReasonCode, EntitlementSnapshot } from "@/lib/billing/types";
import { evaluateAccess } from "@/lib/billing/entitlement/evaluate";
import { APPROVED_LOCALES } from "./constants";
import { isValidPackageLocale } from "./retrieval";

export type RagGateOperation = "activate_batch" | "retrieve" | "expose";

export interface RagEntitlementGateInput {
  snapshot: EntitlementSnapshot | null | undefined;
  locale: string | null;
  lessonId: string | null;
  operation: RagGateOperation;
  batchLessonIds?: string[];
}

export interface RagEntitlementGateResult {
  allowed: boolean;
  denialReasonCode: DenialReasonCode | null;
  reason: string;
}

function snapshotConfigured(snapshot: EntitlementSnapshot | null | undefined): boolean {
  if (!snapshot) return false;
  if (typeof snapshot.snapshotVersion !== "number") return false;
  if (!snapshot.generatedAt || !snapshot.expiresAt) return false;
  if (Number.isNaN(Date.parse(snapshot.generatedAt))) return false;
  if (Number.isNaN(Date.parse(snapshot.expiresAt))) return false;
  return true;
}

function ragContractEnabled(snapshot: EntitlementSnapshot): boolean {
  return snapshot.ragAllowedLessonIds.length > 0;
}

/** RAG-owned entitlement gate — consumes Billing contract without modifying Billing files. */
export function evaluateRagEntitlementGate(
  input: RagEntitlementGateInput,
): RagEntitlementGateResult {
  const { snapshot, locale, lessonId, operation, batchLessonIds = [] } = input;

  if (!snapshotConfigured(snapshot)) {
    return {
      allowed: false,
      denialReasonCode: "ENTITLEMENT_UNAVAILABLE",
      reason: "entitlement_configuration_missing_or_malformed",
    };
  }

  const entitledSnapshot = snapshot!;

  if (!ragContractEnabled(entitledSnapshot)) {
    return {
      allowed: false,
      denialReasonCode: "RAG_NOT_ENTITLED",
      reason: "rag_contract_disabled_or_unresolved",
    };
  }

  if (operation === "activate_batch") {
    const uniqueLessons = [...new Set(batchLessonIds)];
    if (uniqueLessons.length === 0) {
      return {
        allowed: false,
        denialReasonCode: "ENTITLEMENT_UNAVAILABLE",
        reason: "batch_lesson_ids_missing",
      };
    }
    for (const id of uniqueLessons) {
      const access = evaluateAccess(entitledSnapshot, "rag", id);
      if (!access.allowed) {
        return {
          allowed: false,
          denialReasonCode: access.denialReasonCode ?? "RAG_NOT_ENTITLED",
          reason: `batch_lesson_not_entitled:${id}`,
        };
      }
    }
    const runtime = evaluateAccess(entitledSnapshot, "assistant_runtime");
    if (!runtime.allowed) {
      return {
        allowed: false,
        denialReasonCode: runtime.denialReasonCode ?? "AI_QUOTA_EXCEEDED",
        reason: "assistant_runtime_not_entitled_for_activation",
      };
    }
    return { allowed: true, denialReasonCode: null, reason: "activation_entitled" };
  }

  if (operation === "retrieve" || operation === "expose") {
    if (!isValidPackageLocale(locale)) {
      return {
        allowed: false,
        denialReasonCode: "RAG_NOT_ENTITLED",
        reason: "invalid_or_missing_package_locale",
      };
    }

    if (!(APPROVED_LOCALES as readonly string[]).includes(locale)) {
      return {
        allowed: false,
        denialReasonCode: "RAG_NOT_ENTITLED",
        reason: "locale_bypass_denied",
      };
    }

    if (lessonId) {
      const ragAccess = evaluateAccess(entitledSnapshot, "rag", lessonId);
      if (!ragAccess.allowed) {
        return {
          allowed: false,
          denialReasonCode: ragAccess.denialReasonCode ?? "RAG_NOT_ENTITLED",
          reason: `lesson_not_entitled:${lessonId}`,
        };
      }
    }

    const runtime = evaluateAccess(entitledSnapshot, "assistant_runtime");
    if (!runtime.allowed) {
      return {
        allowed: false,
        denialReasonCode: runtime.denialReasonCode ?? "AI_QUOTA_EXCEEDED",
        reason: "assistant_runtime_quota_exceeded",
      };
    }

    return { allowed: true, denialReasonCode: null, reason: "retrieval_entitled" };
  }

  return {
    allowed: false,
    denialReasonCode: "ENTITLEMENT_UNAVAILABLE",
    reason: "unsupported_operation",
  };
}
