/**
 * Admin-only Lovable-native RAG import lifecycle server actions.
 * Authorization: CR-RAG-LOVABLE-NATIVE-RESUMABLE-IMPORTER-20260727-01
 *
 * Activation and rollback are intentionally not exported.
 * Executor/corpus/digest modules are dynamically imported so browser bundles
 * never receive artifact text, digests, or service-role helpers.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  ACTIVATION_DISABLED,
  LOVABLE_NATIVE_AUTHORIZATION_ID,
  ROLLBACK_DISABLED,
  getDisabledLifecycleControls,
} from "@/lib/rag/lovable-native/public-ids";
import type { RagImportStatusView } from "@/lib/rag/lovable-native/contracts";

export {
  ACTIVATION_DISABLED,
  ROLLBACK_DISABLED,
  getDisabledLifecycleControls,
  LOVABLE_NATIVE_AUTHORIZATION_ID,
};

async function assertAdmin(context: {
  // Matches existing admin serverFn pattern (assistant-seed.functions.ts).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase client rpc generics are narrower than has_role
  supabase: any;
  userId: string;
}) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error("UNAUTHORIZED");
  if (!data) throw new Error("FORBIDDEN");
}

async function adminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as {
    rpc: (
      fn: string,
      args?: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };
}

const emptyInput = z.object({});

export type RagImportStatusResponse = RagImportStatusView & {
  authorizationId: string;
  executorContractVersion: string;
};

export type RagImportActionResponse = {
  ok: boolean;
  activationEnabled: false;
  rollbackEnabled: false;
  message?: string;
  executionId?: string | null;
  versionKey?: string | null;
  resumed?: boolean;
  done?: boolean;
  providerCalls?: number;
  batchOrdinal?: number | null;
  acceptedRowCount?: number | null;
  sourceSha?: string;
  lockedDigests?: {
    packageManifestSha256: string;
    chunkManifestSha256: string;
    chunksSha256: string;
    authoritativeLookupSha256: string;
  };
  errors?: string[];
  stagingChunkCount?: number;
  completedBatches?: number;
  providerAttemptTotal?: number;
  legacyLessonCount?: number;
  activeVersionCount?: number;
  status?: RagImportStatusView | null;
  validation?: {
    ok?: boolean;
    errors?: string[];
  } | null;
};

function toActionResponse(value: unknown): RagImportActionResponse {
  const v = (value ?? {}) as Record<string, unknown>;
  return {
    ok: v.ok !== false,
    activationEnabled: false,
    rollbackEnabled: false,
    message: typeof v.message === "string" ? v.message : undefined,
    executionId: typeof v.executionId === "string" ? v.executionId : null,
    versionKey:
      typeof v.versionKey === "string"
        ? v.versionKey
        : typeof v.stagingVersionKey === "string"
          ? v.stagingVersionKey
          : null,
    resumed: typeof v.resumed === "boolean" ? v.resumed : undefined,
    done: typeof v.done === "boolean" ? v.done : undefined,
    providerCalls: typeof v.providerCalls === "number" ? v.providerCalls : undefined,
    batchOrdinal: typeof v.batchOrdinal === "number" ? v.batchOrdinal : null,
    acceptedRowCount: typeof v.acceptedRowCount === "number" ? v.acceptedRowCount : null,
    sourceSha: typeof v.sourceSha === "string" ? v.sourceSha : undefined,
    lockedDigests:
      v.lockedDigests && typeof v.lockedDigests === "object"
        ? (v.lockedDigests as RagImportActionResponse["lockedDigests"])
        : undefined,
    errors: Array.isArray(v.errors) ? (v.errors as string[]) : undefined,
    stagingChunkCount: typeof v.stagingChunkCount === "number" ? v.stagingChunkCount : undefined,
    completedBatches: typeof v.completedBatches === "number" ? v.completedBatches : undefined,
    providerAttemptTotal:
      typeof v.providerAttemptTotal === "number" ? v.providerAttemptTotal : undefined,
    legacyLessonCount: typeof v.legacyLessonCount === "number" ? v.legacyLessonCount : undefined,
    activeVersionCount: typeof v.activeVersionCount === "number" ? v.activeVersionCount : undefined,
  };
}

export const getRagImportStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RagImportStatusResponse> => {
    await assertAdmin(context);
    const { EXECUTOR_CONTRACT_VERSION } = await import("@/lib/rag/lovable-native/contracts");
    const { getImportStatus } = await import("@/lib/rag/lovable-native/executor.server");
    const admin = await adminClient();
    const status = await getImportStatus(admin);
    return {
      ...status,
      authorizationId: LOVABLE_NATIVE_AUTHORIZATION_ID,
      executorContractVersion: EXECUTOR_CONTRACT_VERSION,
    };
  });

export const initializeOrResumeRagImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => emptyInput.parse(input ?? {}))
  .handler(async ({ context }): Promise<RagImportActionResponse> => {
    await assertAdmin(context);
    const { LOCKED_ARTIFACT_DIGESTS, LOCKED_SOURCE_SHA } =
      await import("@/lib/rag/lovable-native/contracts");
    const { initializeOrResumeImport } = await import("@/lib/rag/lovable-native/executor.server");
    const admin = await adminClient();
    const result = await initializeOrResumeImport(admin);
    return toActionResponse({
      ...result,
      lockedDigests: LOCKED_ARTIFACT_DIGESTS,
      sourceSha: LOCKED_SOURCE_SHA,
      activationEnabled: false,
      rollbackEnabled: false,
    });
  });

export const executeNextRagImportBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => emptyInput.parse(input ?? {}))
  .handler(async ({ context }): Promise<RagImportActionResponse> => {
    await assertAdmin(context);
    const { executeNextImportBatch } = await import("@/lib/rag/lovable-native/executor.server");
    const admin = await adminClient();
    return toActionResponse(await executeNextImportBatch({ admin }));
  });

export const validateRagImportStaging = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => emptyInput.parse(input ?? {}))
  .handler(async ({ context }): Promise<RagImportActionResponse> => {
    await assertAdmin(context);
    const { validateStagingImport } = await import("@/lib/rag/lovable-native/executor.server");
    const admin = await adminClient();
    return toActionResponse(await validateStagingImport(admin));
  });

export const getRagImportEvidence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RagImportActionResponse> => {
    await assertAdmin(context);
    const { LOCKED_ARTIFACT_DIGESTS } = await import("@/lib/rag/lovable-native/contracts");
    const { getImportEvidence } = await import("@/lib/rag/lovable-native/executor.server");
    const admin = await adminClient();
    const evidence = await getImportEvidence(admin);
    return toActionResponse({
      ...evidence,
      activationEnabled: false,
      rollbackEnabled: false,
      lockedDigests: LOCKED_ARTIFACT_DIGESTS,
    });
  });
