import { assertProviderCostWithinLimit } from "./budget";
import { assertGreenfieldReferences } from "./greenfield";
import { validateRequestIdentity, validateResponseIdentity } from "./identity";
import { validateOutputBytes } from "./outputValidation";
import { sha256Hex } from "./pngCodec";
import { validateRightsProvenance } from "./rights";
import type { UsdMicros } from "./money";
import type {
  ExecutionMode,
  OutputValidationRecord,
  ProductionConfig,
  ProviderGenerationRequest,
  ProviderGenerationResponse,
} from "./types";

export interface ProviderTransport {
  generate(request: ProviderGenerationRequest): Promise<ProviderGenerationResponse>;
  resolveSecureBytes?(
    reference: string,
    request: ProviderGenerationRequest,
  ): Promise<Buffer>;
}

export interface ProviderAdapterContext {
  config: ProductionConfig;
  transport: ProviderTransport;
  expectedProviderName: string;
  remainingRunBudgetMicros: UsdMicros;
  seenProviderRequestIds: Set<string>;
}

export interface ProviderAdapterResult {
  ok: boolean;
  errors: string[];
  response: ProviderGenerationResponse | null;
  bytes: Buffer | null;
  validation: OutputValidationRecord | null;
  costMicros: UsdMicros | null;
  independentChecksum: string | null;
}

function parseCost(raw: string): UsdMicros {
  if (!/^\d+$/.test(raw)) throw new Error("providerReportedCostMicros malformed");
  return BigInt(raw);
}

export async function executeProviderContract(
  request: ProviderGenerationRequest,
  ctx: ProviderAdapterContext,
): Promise<ProviderAdapterResult> {
  const errors: string[] = [];
  errors.push(...validateRequestIdentity(request));

  if (!ctx.config.providerApiKeyPresent && ctx.config.executionMode === "production") {
    errors.push("missing provider credentials");
  }
  if (!ctx.config.providerName) errors.push("unsupported provider configuration: name missing");
  if (ctx.expectedProviderName !== ctx.config.providerName) {
    errors.push(
      `unexpected provider identity expected=${ctx.expectedProviderName} configured=${ctx.config.providerName}`,
    );
  }
  const gfPrompt = assertGreenfieldReferences([request.promptOrRenderingSpec]);
  if (!gfPrompt.ok) errors.push(...gfPrompt.errors);

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
      response: null,
      bytes: null,
      validation: null,
      costMicros: null,
      independentChecksum: null,
    };
  }

  const response = await ctx.transport.generate(request);
  errors.push(...validateResponseIdentity(request, response));

  if (response.providerName !== ctx.config.providerName) {
    errors.push(`unexpected provider identity in response: ${response.providerName}`);
  }
  if (response.modelOrRenderer !== ctx.config.providerModel) {
    errors.push(`unexpected model/renderer: ${response.modelOrRenderer}`);
  }
  if (!response.providerRequestId?.trim()) errors.push("missing request IDs");
  if (ctx.seenProviderRequestIds.has(response.providerRequestId)) {
    errors.push(`duplicate provider request ID ${response.providerRequestId}`);
  }

  let costMicros: UsdMicros | null = null;
  try {
    costMicros = parseCost(response.providerReportedCostMicros);
    const costErr = assertProviderCostWithinLimit(
      costMicros,
      ctx.config.cellCostCeilingMicros,
      ctx.remainingRunBudgetMicros,
    );
    if (costErr) errors.push(costErr);
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  let bytes: Buffer | null = null;
  if (response.outputBytesBase64) {
    bytes = Buffer.from(response.outputBytesBase64, "base64");
  } else if (response.secureByteReference) {
    const gf = assertGreenfieldReferences([response.secureByteReference]);
    if (!gf.ok) errors.push(...gf.errors);
    if (!ctx.transport.resolveSecureBytes) {
      errors.push("URL/secure reference response rejected — no authorized byte resolver");
    } else {
      bytes = await ctx.transport.resolveSecureBytes(response.secureByteReference, request);
    }
  } else {
    errors.push("missing or empty output bytes (URL-only without resolver rejected)");
  }

  if (bytes && bytes.length === 0) {
    errors.push("missing or empty output bytes");
    bytes = null;
  }

  let independentChecksum: string | null = null;
  let validation: OutputValidationRecord | null = null;
  if (bytes) {
    independentChecksum = sha256Hex(bytes);
    if (response.contentChecksumSha256 !== independentChecksum) {
      errors.push("provider-reported checksum mismatch vs independently calculated bytes");
    }
    const rights = validateRightsProvenance(response.rightsProvenance, {
      cellId: request.cellId,
      sourceSha: request.sourceSha,
      approvedManifestSha256: request.approvedManifestSha256,
      providerRequestId: response.providerRequestId,
      outputContentSha256: independentChecksum,
    });
    if (!rights.ok) errors.push(...rights.errors);

    validation = validateOutputBytes({
      bytes,
      declaredMime: response.mimeType,
      declaredWidth: response.width,
      declaredHeight: response.height,
      declaredChecksum: independentChecksum,
      declaredByteLength: response.byteLength,
      config: ctx.config,
      cellId: request.cellId,
      sourceSha: request.sourceSha,
      approvedManifestSha256: request.approvedManifestSha256,
      forceProductionGates: ctx.config.executionMode === "production",
    });
    if (!validation.ok) errors.push(...validation.errors);
  }

  if (response.schemaVersion !== "lesson-visual-provider-response/v1") {
    errors.push("malformed metadata: schemaVersion");
  }
  if (!response.generationTimestamp) errors.push("malformed metadata: generationTimestamp");

  if (errors.length === 0 && response.providerRequestId) {
    ctx.seenProviderRequestIds.add(response.providerRequestId);
  }

  return {
    ok: errors.length === 0,
    errors,
    response,
    bytes,
    validation,
    costMicros,
    independentChecksum,
  };
}

export function assertExecutionAllowsMock(
  executionMode: ExecutionMode,
  transportIsMock: boolean,
): string | null {
  if (executionMode === "production" && transportIsMock) {
    return "production mode rejects mock/fixture provider transport";
  }
  return null;
}
