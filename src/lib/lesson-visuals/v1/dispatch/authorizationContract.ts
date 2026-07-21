/**
 * Lovable-only dispatch authorization contract (fail-closed).
 * Pure functions — no network. Cursor/CLI/unauth actors must fail.
 */

export type DispatchRunMode = "full" | "failed-only" | "pilot";

export interface DispatchAuthorizationInput {
  controlRoomAuthorizationId: string;
  approvedSourceSha: string;
  approvedManifestSha256: string;
  runMode: DispatchRunMode;
  dispatchActor: string;
  /** Actual git actor that triggered workflow_dispatch (github.actor). */
  githubActor?: string;
  /** sha256 hex of checked-out AUTHORIZED_MANIFEST.json bytes. */
  actualManifestSha256?: string;
  /** Checked-out HEAD / input source_sha that must match approvedSourceSha. */
  actualSourceSha?: string;
  /**
   * Allowlisted dispatch actors. Empty/undefined in production sense = fail closed.
   * Local tests pass an explicit fixture list.
   */
  allowedDispatchActors?: readonly string[];
  /** Optional allowlisted github.actor values (defaults to allowedDispatchActors). */
  allowedGithubActors?: readonly string[];
  /** Optional future signed payload / token placeholder. */
  signedPayload?: string | null;
  /** Optional bounded max_parallel (validated when provided). */
  maxParallel?: number;
  maxParallelMin?: number;
  maxParallelMax?: number;
}

export interface DispatchAuthorizationResult {
  ok: boolean;
  errors: string[];
}

export const DEFAULT_FIXTURE_DISPATCH_ACTORS = ["lovable"] as const;

const CR_ID_RE = /^CR-[A-Za-z0-9][A-Za-z0-9._-]{2,127}$/;
const SHA1_RE = /^[a-f0-9]{40}$/;
const SHA256_RE = /^[a-f0-9]{64}$/;

const BANNED_ACTORS = new Set([
  "cursor",
  "cli",
  "cursor-agent",
  "github-ui",
  "unauthenticated",
  "api",
  "",
]);

function normalizeActor(actor: string | undefined): string {
  return (actor ?? "").trim().toLowerCase();
}

/**
 * Fail-closed validation of a Control Room → Lovable → Actions dispatch attempt.
 */
export function validateDispatchAuthorization(
  input: DispatchAuthorizationInput,
): DispatchAuthorizationResult {
  const errors: string[] = [];

  const allow = input.allowedDispatchActors ?? [];
  if (allow.length === 0) {
    errors.push(
      "dispatch actor allowlist is empty — fail closed (set LOVABLE_DISPATCH_ACTORS / fixture allowlist)",
    );
  }

  const githubAllow = input.allowedGithubActors ?? allow;

  if (!input.controlRoomAuthorizationId || !CR_ID_RE.test(input.controlRoomAuthorizationId)) {
    errors.push(
      "controlRoomAuthorizationId missing or invalid (expected non-empty CR-… prefix id)",
    );
  }

  if (!SHA1_RE.test(input.approvedSourceSha ?? "")) {
    errors.push("approvedSourceSha must be 40-char lowercase hex");
  }

  if (!SHA256_RE.test(input.approvedManifestSha256 ?? "")) {
    errors.push("approvedManifestSha256 must be 64-char lowercase hex");
  }

  if (input.runMode !== "full" && input.runMode !== "failed-only" && input.runMode !== "pilot") {
    errors.push("runMode must be full | failed-only | pilot");
  }

  if (input.maxParallel !== undefined) {
    const min = input.maxParallelMin ?? 1;
    const max = input.maxParallelMax ?? 50;
    if (!Number.isInteger(input.maxParallel) || input.maxParallel < min || input.maxParallel > max) {
      errors.push(`maxParallel must be an integer in [${min},${max}]`);
    }
  }

  const dispatchActor = normalizeActor(input.dispatchActor);
  if (!dispatchActor) {
    errors.push("dispatchActor is empty");
  } else if (BANNED_ACTORS.has(dispatchActor)) {
    errors.push(`dispatchActor "${input.dispatchActor}" is not authorized (banned)`);
  } else if (allow.length > 0 && !allow.map(normalizeActor).includes(dispatchActor)) {
    errors.push(`dispatchActor "${input.dispatchActor}" not in allowlist`);
  }

  if (input.githubActor !== undefined) {
    const ga = normalizeActor(input.githubActor);
    if (!ga || BANNED_ACTORS.has(ga) || (githubAllow.length > 0 && !githubAllow.map(normalizeActor).includes(ga))) {
      errors.push(`github.actor "${input.githubActor}" is not an authorized Lovable dispatcher`);
    }
  }

  if (input.actualSourceSha !== undefined) {
    if (!SHA1_RE.test(input.actualSourceSha) || input.actualSourceSha !== input.approvedSourceSha) {
      errors.push(
        `source_sha mismatch: actual ${input.actualSourceSha} != approved ${input.approvedSourceSha}`,
      );
    }
  }

  if (input.actualManifestSha256 !== undefined) {
    if (
      !SHA256_RE.test(input.actualManifestSha256) ||
      input.actualManifestSha256 !== input.approvedManifestSha256
    ) {
      errors.push(
        `AUTHORIZED_MANIFEST.json sha256 mismatch: actual ${input.actualManifestSha256} != approved ${input.approvedManifestSha256}`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

/** Parse comma/space-separated allowlist env (repository variable). */
export function parseDispatchActorAllowlist(raw: string | undefined | null): string[] {
  if (!raw || !raw.trim()) return [];
  return raw
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
