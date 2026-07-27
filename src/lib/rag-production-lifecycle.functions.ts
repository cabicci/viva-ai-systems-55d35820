/**
 * Admin-only Lovable-native RAG import lifecycle server actions.
 * Authorization: CR-RAG-LOVABLE-NATIVE-RESUMABLE-IMPORTER-20260727-01
 * First activation: CR-RAG-PRODUCTION-FIRST-ACTIVATION-20260727-01
 *
 * Executor/corpus/digest modules are dynamically imported so browser bundles
 * never receive artifact text, digests, or service-role helpers.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  ACTIVATION_CONFIRMATION,
  ACTIVATION_DISABLED,
  AUTHORIZED_STAGING_VERSION_KEY,
  FIRST_ACTIVATION_AUTHORIZATION_ID,
  LOVABLE_NATIVE_AUTHORIZATION_ID,
  ROLLBACK_CONFIRMATION,
  ROLLBACK_DISABLED,
  getDisabledLifecycleControls,
} from "@/lib/rag/lovable-native/public-ids";
import type { RagImportStatusView } from "@/lib/rag/lovable-native/contracts";

export {
  ACTIVATION_CONFIRMATION,
  ACTIVATION_DISABLED,
  AUTHORIZED_STAGING_VERSION_KEY,
  FIRST_ACTIVATION_AUTHORIZATION_ID,
  ROLLBACK_CONFIRMATION,
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

const activationInput = z
  .object({
    versionKey: z.string(),
    confirmation: z.string(),
  })
  .strict();

const rollbackInput = z
  .object({
    versionKey: z.string(),
    confirmation: z.string(),
  })
  .strict();

export type RagImportStatusResponse = RagImportStatusView & {
  authorizationId: string;
  firstActivationAuthorizationId: string;
  executorContractVersion: string;
  authorizedStagingVersionKey: typeof AUTHORIZED_STAGING_VERSION_KEY;
};

export type RagImportActionResponse = {
  ok: boolean;
  activationEnabled: boolean;
  rollbackEnabled: boolean;
  message?: string;
  code?: string;
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
  activated?: boolean;
  rolledBack?: boolean;
  activatedChunks?: number;
  activeVersions?: number;
  activeVersionCountAfter?: number;
};

function toActionResponse(value: unknown): RagImportActionResponse {
  const v = (value ?? {}) as Record<string, unknown>;
  return {
    ok: v.ok !== false,
    activationEnabled: v.activationEnabled === true,
    rollbackEnabled: v.rollbackEnabled === true,
    message: typeof v.message === "string" ? v.message : undefined,
    code: typeof v.code === "string" ? v.code : undefined,
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
    activated: typeof v.activated === "boolean" ? v.activated : undefined,
    rolledBack: typeof v.rolledBack === "boolean" ? v.rolledBack : undefined,
    activatedChunks: typeof v.activatedChunks === "number" ? v.activatedChunks : undefined,
    activeVersions: typeof v.activeVersions === "number" ? v.activeVersions : undefined,
    activeVersionCountAfter:
      typeof v.activeVersionCountAfter === "number" ? v.activeVersionCountAfter : undefined,
  };
}

function sanitizeActionError(err: unknown): never {
  const code =
    err &&
    typeof err === "object" &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
      ? (err as { code: string }).code
      : err instanceof Error
        ? err.message.split(":")[0]
        : "INTERNAL";
  const allowed = new Set([
    "UNAUTHORIZED",
    "FORBIDDEN",
    "WRONG_VERSION",
    "WRONG_CONFIRMATION",
    "EXECUTION_MISMATCH",
    "SOURCE_MISMATCH",
    "SESSION_NOT_COMPLETED",
    "SESSION_ALREADY_COMPLETED",
    "BATCH_COUNT_MISMATCH",
    "CHUNK_COUNT_MISMATCH",
    "STAGING_COUNT_MISMATCH",
    "PROVIDER_ATTEMPT_CEILING_EXCEEDED",
    "LAST_ERROR_PRESENT",
    "VALIDATION_FAILED",
    "ACTIVE_VERSION_EXISTS",
    "ACTIVE_VERSION_COUNT_INVALID",
    "ACTIVATION_RPC_FAILURE",
    "ROLLBACK_UNAVAILABLE",
    "ROLLBACK_CONFIRMATION_MISMATCH",
    "ROLLBACK_RPC_FAILURE",
    "MALFORMED_RPC_RESPONSE",
    "NO_SESSION",
    "PROVIDER_ATTEMPT_CEILING",
    "MISSING_OPENAI_KEY",
    "CLAIM_FAILED",
    "COMMIT_FAILED",
    "PROVIDER_FAILED",
    "PROVIDER_RESPONSE_INVALID",
    "DIGEST_MISMATCH",
    "CORPUS_ADMISSION_FAILED",
    "INTERNAL",
  ]);
  throw new Error(allowed.has(code ?? "") ? (code as string) : "INTERNAL");
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
      firstActivationAuthorizationId: FIRST_ACTIVATION_AUTHORIZATION_ID,
      executorContractVersion: EXECUTOR_CONTRACT_VERSION,
      authorizedStagingVersionKey: AUTHORIZED_STAGING_VERSION_KEY,
    };
  });

export const initializeOrResumeRagImport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => emptyInput.parse(input ?? {}))
  .handler(async ({ context }): Promise<RagImportActionResponse> => {
    await assertAdmin(context);
    try {
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
    } catch (err) {
      sanitizeActionError(err);
    }
  });

export const executeNextRagImportBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => emptyInput.parse(input ?? {}))
  .handler(async ({ context }): Promise<RagImportActionResponse> => {
    await assertAdmin(context);
    try {
      const { executeNextImportBatch } = await import("@/lib/rag/lovable-native/executor.server");
      const admin = await adminClient();
      return toActionResponse(await executeNextImportBatch({ admin }));
    } catch (err) {
      sanitizeActionError(err);
    }
  });

export const validateRagImportStaging = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => emptyInput.parse(input ?? {}))
  .handler(async ({ context }): Promise<RagImportActionResponse> => {
    await assertAdmin(context);
    try {
      const { validateStagingImport } = await import("@/lib/rag/lovable-native/executor.server");
      const admin = await adminClient();
      return toActionResponse(await validateStagingImport(admin));
    } catch (err) {
      sanitizeActionError(err);
    }
  });

export const getRagImportEvidence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RagImportActionResponse> => {
    await assertAdmin(context);
    try {
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
    } catch (err) {
      sanitizeActionError(err);
    }
  });

export const activateAuthorizedRagIndexVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => activationInput.parse(input))
  .handler(async ({ context, data }): Promise<RagImportActionResponse> => {
    await assertAdmin(context);
    try {
      const { activateAuthorizedRagIndexVersion: activate } =
        await import("@/lib/rag/lovable-native/executor.server");
      const admin = await adminClient();
      const evidence = await activate(admin, {
        versionKey: data.versionKey,
        confirmation: data.confirmation,
      });
      return toActionResponse({
        ...evidence,
        activationEnabled: false,
        rollbackEnabled: false,
      });
    } catch (err) {
      sanitizeActionError(err);
    }
  });

export const rollbackAuthorizedRagIndexVersion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => rollbackInput.parse(input))
  .handler(async ({ context, data }): Promise<RagImportActionResponse> => {
    await assertAdmin(context);
    try {
      const { rollbackAuthorizedRagIndexVersion: rollback } =
        await import("@/lib/rag/lovable-native/executor.server");
      const admin = await adminClient();
      const evidence = await rollback(admin, {
        versionKey: data.versionKey,
        confirmation: data.confirmation,
      });
      return toActionResponse({
        ...evidence,
        activationEnabled: false,
        rollbackEnabled: false,
      });
    } catch (err) {
      sanitizeActionError(err);
    }
  });
