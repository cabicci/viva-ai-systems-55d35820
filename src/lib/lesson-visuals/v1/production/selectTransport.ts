/**
 * Select provider transport by execution mode.
 * dry-run → mock only; production → real HTTP transport only.
 * Never falls back between modes. Never logs secret values.
 */
import { createHttpProvider } from "./httpProvider";
import { createMockProvider } from "./mockProvider";
import type { ProviderTransport } from "./providerContract";
import type { ProductionConfig } from "./types";

export interface TransportSelectionResult {
  ok: boolean;
  errors: string[];
  transport: (ProviderTransport & { isMock?: boolean; generateCallCount?: number }) | null;
  kind: "mock" | "http" | null;
}

export function selectProviderTransport(args: {
  config: ProductionConfig;
  /** Raw API key from env — never logged. */
  apiKey: string;
  fetchImpl?: typeof fetch;
  mockCostMicros?: string;
}): TransportSelectionResult {
  const { config } = args;
  if (config.executionMode === "dry-run") {
    const transport = createMockProvider({
      providerName: config.providerName,
      model: config.providerModel,
      accountId: config.providerAccountId,
      projectId: config.providerProjectId || null,
      authId: config.providerAuthId,
      width: config.requiredWidth,
      height: config.requiredHeight,
      costMicros: args.mockCostMicros ?? "1000",
    });
    return { ok: true, errors: [], transport, kind: "mock" };
  }

  if (config.executionMode === "production") {
    if (!args.apiKey.trim()) {
      return { ok: false, errors: ["provider API key missing"], transport: null, kind: null };
    }
    if (!config.providerEndpoint.trim()) {
      return { ok: false, errors: ["provider endpoint missing"], transport: null, kind: null };
    }
    if (!config.providerApiKeyPresent) {
      return { ok: false, errors: ["provider API key not present in config"], transport: null, kind: null };
    }
    const transport = createHttpProvider({
      endpoint: config.providerEndpoint,
      apiKey: args.apiKey,
      timeoutMs: config.providerTimeoutMs,
      expectedProviderName: config.providerName,
      expectedModel: config.providerModel,
      expectedAccountId: config.providerAccountId,
      expectedProjectId: config.providerProjectId || null,
      expectedAuthId: config.providerAuthId,
      fetchImpl: args.fetchImpl,
    });
    return { ok: true, errors: [], transport, kind: "http" };
  }

  return { ok: false, errors: ["unsupported execution mode"], transport: null, kind: null };
}
