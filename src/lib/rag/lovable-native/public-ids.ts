/**
 * Browser-safe identifiers for the Lovable-native importer control surface.
 * Must not include artifact digests, corpus text, or secrets.
 */
export const LOVABLE_NATIVE_AUTHORIZATION_ID =
  "CR-RAG-LOVABLE-NATIVE-RESUMABLE-IMPORTER-20260727-01" as const;

export const ACTIVATION_DISABLED = true;
export const ROLLBACK_DISABLED = true;

export function getDisabledLifecycleControls() {
  return {
    activate: null,
    rollback: null,
    activationEnabled: false as const,
    rollbackEnabled: false as const,
    reason: "Requires separate Control Room authorization",
  };
}
