/**
 * Method-aware production transport router.
 * Method 1/4: local master PNG (zero provider/HTTP).
 * Method 2: OpenAI Images API (official format only).
 *   Gated fallback: LESSON_VISUALS_METHOD2_FALLBACK=local-master when API key
 *   missing/placeholder → localMaster hybrid (same visual path as method 4).
 * Method 3: allowlisted public screenshot capture.
 * dry-run: mock only (unchanged).
 */
import type { LessonVisualMaster, Method } from "../types";
import { createLocalMasterTransport } from "./localMasterTransport";
import { localRendererIdentity } from "./localMasterRenderer";
import { createMockProvider } from "./mockProvider";
import {
  createOpenAIImagesTransport,
  DEFAULT_OPENAI_IMAGES_ENDPOINT,
} from "./openaiImagesTransport";
import type { ProviderTransport } from "./providerContract";
import {
  createScreenshotCaptureTransport,
  screenshotRendererModel,
  type ScreenshotCaptureFn,
} from "./screenshotCapture";
import type { ProductionConfig } from "./types";

export type MethodTransportKind =
  | "mock"
  | "local-deterministic"
  | "local-hybrid"
  | "local-hybrid-method2-fallback"
  | "openai-images"
  | "screenshot";

export interface MethodTransportSelection {
  ok: boolean;
  errors: string[];
  transport: (ProviderTransport & {
    isMock?: boolean;
    generateCallCount?: number;
    httpCallCount?: number;
    kind?: string;
  }) | null;
  kind: MethodTransportKind | null;
  /** When false, cell runner must not count an external provider attempt. */
  countsAsExternalProviderAttempt: boolean;
  expectedProviderName: string | null;
  expectedModel: string | null;
}

/** Placeholder / absent keys must never trigger paid OpenAI spend. */
export function isMissingOrPlaceholderProviderApiKey(apiKey: string): boolean {
  const k = apiKey.trim();
  if (!k) return true;
  const lower = k.toLowerCase();
  if (lower === "sk-test-not-real") return true;
  if (/^sk-(test|fake|dummy|placeholder)/i.test(k)) return true;
  if (lower.includes("not-real") || lower.includes("placeholder")) return true;
  if (lower === "changeme" || lower === "todo") return true;
  return false;
}

export function isMethod2LocalMasterFallbackEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (env.LESSON_VISUALS_METHOD2_FALLBACK ?? "").trim() === "local-master";
}

export function selectMethodAwareTransport(args: {
  config: ProductionConfig;
  method: Method;
  apiKey: string;
  master: LessonVisualMaster;
  fetchImpl?: typeof fetch;
  screenshotCapture?: ScreenshotCaptureFn;
  mockCostMicros?: string;
}): MethodTransportSelection {
  const { config, method, master } = args;

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
    return {
      ok: true,
      errors: [],
      transport,
      kind: "mock",
      countsAsExternalProviderAttempt: true,
      expectedProviderName: config.providerName,
      expectedModel: config.providerModel,
    };
  }

  if (config.executionMode !== "production") {
    return {
      ok: false,
      errors: ["unsupported execution mode"],
      transport: null,
      kind: null,
      countsAsExternalProviderAttempt: false,
      expectedProviderName: null,
      expectedModel: null,
    };
  }

  if (master.method !== method) {
    return {
      ok: false,
      errors: [
        `cell method ${method} does not match authoritative master.method ${master.method} for ${master.lessonId}`,
      ],
      transport: null,
      kind: null,
      countsAsExternalProviderAttempt: false,
      expectedProviderName: null,
      expectedModel: null,
    };
  }

  if (method === 1 || method === 4) {
    const identity = localRendererIdentity(method);
    const transport = createLocalMasterTransport({
      method,
      master,
      accountId: config.providerAccountId,
      projectId: config.providerProjectId || null,
      authId: config.providerAuthId,
      requiredWidth: config.requiredWidth,
      requiredHeight: config.requiredHeight,
    });
    return {
      ok: true,
      errors: [],
      transport,
      kind: method === 1 ? "local-deterministic" : "local-hybrid",
      countsAsExternalProviderAttempt: false,
      expectedProviderName: identity.providerName,
      expectedModel: identity.modelOrRenderer,
    };
  }

  if (method === 2) {
    const wantFallback = isMethod2LocalMasterFallbackEnabled();
    const missingOrPlaceholder = isMissingOrPlaceholderProviderApiKey(args.apiKey);
    if (wantFallback && missingOrPlaceholder) {
      const identity = localRendererIdentity(2, { method2Fallback: true });
      const transport = createLocalMasterTransport({
        method: 2,
        master,
        accountId: config.providerAccountId,
        projectId: config.providerProjectId || null,
        authId: config.providerAuthId,
        requiredWidth: config.requiredWidth,
        requiredHeight: config.requiredHeight,
        method2Fallback: true,
      });
      return {
        ok: true,
        errors: [],
        transport,
        kind: "local-hybrid-method2-fallback",
        countsAsExternalProviderAttempt: false,
        expectedProviderName: identity.providerName,
        expectedModel: identity.modelOrRenderer,
      };
    }

    if (!args.apiKey.trim()) {
      return {
        ok: false,
        errors: ["Method 2 requires LESSON_VISUALS_PROVIDER_API_KEY"],
        transport: null,
        kind: null,
        countsAsExternalProviderAttempt: true,
        expectedProviderName: null,
        expectedModel: null,
      };
    }
    if (!config.providerApiKeyPresent) {
      return {
        ok: false,
        errors: ["Method 2 requires provider API key present in config"],
        transport: null,
        kind: null,
        countsAsExternalProviderAttempt: true,
        expectedProviderName: null,
        expectedModel: null,
      };
    }
    if (isMissingOrPlaceholderProviderApiKey(args.apiKey)) {
      return {
        ok: false,
        errors: [
          "Method 2 refuses placeholder API key (set LESSON_VISUALS_METHOD2_FALLBACK=local-master for unpaid localMaster hybrid, or provide a real key)",
        ],
        transport: null,
        kind: null,
        countsAsExternalProviderAttempt: true,
        expectedProviderName: null,
        expectedModel: null,
      };
    }
    const endpoint =
      config.providerEndpoint.trim() || DEFAULT_OPENAI_IMAGES_ENDPOINT;
    if (!/^https:\/\//i.test(endpoint)) {
      return {
        ok: false,
        errors: ["Method 2 OpenAI endpoint must be https://"],
        transport: null,
        kind: null,
        countsAsExternalProviderAttempt: true,
        expectedProviderName: null,
        expectedModel: null,
      };
    }
    const transport = createOpenAIImagesTransport({
      apiKey: args.apiKey,
      endpoint,
      timeoutMs: config.providerTimeoutMs,
      providerName: config.providerName,
      model: config.providerModel,
      accountId: config.providerAccountId,
      projectId: config.providerProjectId || null,
      authId: config.providerAuthId,
      master,
      requiredWidth: config.requiredWidth,
      requiredHeight: config.requiredHeight,
      fetchImpl: args.fetchImpl,
    });
    return {
      ok: true,
      errors: [],
      transport,
      kind: "openai-images",
      countsAsExternalProviderAttempt: true,
      expectedProviderName: config.providerName,
      expectedModel: config.providerModel,
    };
  }

  if (method === 3) {
    const model = screenshotRendererModel();
    const transport = createScreenshotCaptureTransport({
      master,
      providerName: "screenshot-capture",
      model,
      accountId: config.providerAccountId,
      projectId: config.providerProjectId || null,
      authId: config.providerAuthId,
      requiredWidth: config.requiredWidth,
      requiredHeight: config.requiredHeight,
      timeoutMs: config.providerTimeoutMs,
      captureFn: args.screenshotCapture,
    });
    return {
      ok: true,
      errors: [],
      transport,
      kind: "screenshot",
      countsAsExternalProviderAttempt: true,
      expectedProviderName: "screenshot-capture",
      expectedModel: model,
    };
  }

  return {
    ok: false,
    errors: [`unsupported method ${method as number}`],
    transport: null,
    kind: null,
    countsAsExternalProviderAttempt: false,
    expectedProviderName: null,
    expectedModel: null,
  };
}

/** Route helper for tests — classify method without constructing transports. */
export function classifyMethodRoute(method: Method): {
  kind: MethodTransportKind;
  countsAsExternalProviderAttempt: boolean;
  zeroProviderCalls: boolean;
} {
  switch (method) {
    case 1:
      return {
        kind: "local-deterministic",
        countsAsExternalProviderAttempt: false,
        zeroProviderCalls: true,
      };
    case 2:
      return {
        kind: "openai-images",
        countsAsExternalProviderAttempt: true,
        zeroProviderCalls: false,
      };
    case 3:
      return {
        kind: "screenshot",
        countsAsExternalProviderAttempt: true,
        zeroProviderCalls: false,
      };
    case 4:
      return {
        kind: "local-hybrid",
        countsAsExternalProviderAttempt: false,
        zeroProviderCalls: true,
      };
    default: {
      const _exhaustive: never = method;
      return _exhaustive;
    }
  }
}
