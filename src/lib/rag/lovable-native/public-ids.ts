/**
 * Browser-safe identifiers for the Lovable-native importer control surface.
 * Must not include artifact digests, corpus text, or secrets.
 * Confirmation strings are governance guards, not credentials.
 */
export const LOVABLE_NATIVE_AUTHORIZATION_ID =
  "CR-RAG-LOVABLE-NATIVE-RESUMABLE-IMPORTER-20260727-01" as const;

export const RAG_UPGRADE_AUTHORIZATION_ID =
  "CR-RAG-PRODUCTION-UPGRADE-ACTIVATION-20260916-01" as const;

/** Backward-compatible export name used by the existing admin response contract. */
export const FIRST_ACTIVATION_AUTHORIZATION_ID = RAG_UPGRADE_AUTHORIZATION_ID;

/** Locked Production staging version for the 3700 -> 3701 upgrade. */
export const AUTHORIZED_STAGING_VERSION_KEY = "rag-index-v1-3e1ef5aa-930bc16ad0085e44" as const;

/** Exact active version that the guarded upgrade is allowed to supersede. */
export const AUTHORIZED_PRIOR_ACTIVE_VERSION_KEY =
  "rag-index-v1-3e1ef5aa-5a7e8bd406427cc8" as const;

export const AUTHORIZED_SOURCE_SHA = "3e1ef5aaf0ca4f3dbcf28650751e0dd1de70bfc2" as const;

export const AUTHORIZED_EXECUTION_ID = "rag-lovable-cf227e066b9b4550806c40adb1e8bde5" as const;

export const AUTHORIZED_BATCH_COUNT = 58 as const;
export const AUTHORIZED_CHUNK_COUNT = 3701 as const;
export const AUTHORIZED_MAX_PROVIDER_ATTEMPTS = 67 as const;

/** Exact confirmation required for the guarded upgrade (case-sensitive, no trim). */
export const ACTIVATION_CONFIRMATION = "ACTIVATE_RAG_INDEX_V1" as const;

/** Exact confirmation required to restore the prior active version. */
export const ROLLBACK_CONFIRMATION = "ROLLBACK_RAG_INDEX_V1" as const;

/**
 * Permanent hard-disable flags from the prior importer authorization.
 * Upgrade authorization supersedes these for the guarded actions;
 * UI eligibility remains fail-closed until fresh status + validation + confirmation.
 */
export const ACTIVATION_DISABLED = false;
export const ROLLBACK_DISABLED = false;

export function getDisabledLifecycleControls() {
  return {
    activate: "activateAuthorizedRagIndexVersion" as const,
    rollback: "rollbackAuthorizedRagIndexVersion" as const,
    activationEnabled: false as const,
    rollbackEnabled: false as const,
    reason: "Requires explicit confirmation and server-side prechecks",
  };
}
