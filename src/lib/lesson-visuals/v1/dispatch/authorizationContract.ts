/**
 * Lovable-only dispatch authorization contract (fail-closed).
 * Separates immutable content identity from workflow execution identity.
 * Pure functions — no network. Cursor/CLI/unauth actors must fail.
 */

export type DispatchRunMode = "full" | "failed-only" | "pilot";

export interface DispatchAuthorizationInput {
  controlRoomAuthorizationId: string;
  /**
   * Immutable content/base SHA (AUTHORITATIVE_BASE_SOURCE_SHA).
   * Must match manifest/master `sourceSha` semantics — not checkout HEAD.
   */
  approvedContentSha: string;
  /**
   * Explicitly authorized execution commit SHA to check out and run.
   * Must equal actualExecutionSha (HEAD). May differ from content SHA.
   */
  approvedExecutionSha: string;
  approvedManifestSha256: string;
  runMode: DispatchRunMode;
  dispatchActor: string;
  /** Actual git actor that triggered workflow_dispatch (github.actor). */
  githubActor?: string;
  /** sha256 hex of checked-out AUTHORIZED_MANIFEST.json bytes. */
  actualManifestSha256?: string;
  /** Checked-out HEAD — must equal approvedExecutionSha. */
  actualExecutionSha?: string;
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

function looksLikeMovingRef(raw: string): boolean {
  const s = raw.trim();
  if (!s) return true;
  if (/^(refs\/)?heads\//i.test(s)) return true;
  if (/^(refs\/)?tags\//i.test(s)) return true;
  if (s === "main" || s === "master" || s === "HEAD") return true;
  if (/^[a-f0-9]{40}$/.test(s)) return false;
  // Non-hex full SHA → reject as non-immutable ref/name.
  return true;
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

  if (!input.approvedContentSha?.trim()) {
    errors.push("approvedContentSha missing");
  } else if (looksLikeMovingRef(input.approvedContentSha) || !SHA1_RE.test(input.approvedContentSha)) {
    errors.push("approvedContentSha must be a full 40-char lowercase hex commit SHA (not a branch/tag)");
  }

  if (!input.approvedExecutionSha?.trim()) {
    errors.push("approvedExecutionSha missing");
  } else if (
    looksLikeMovingRef(input.approvedExecutionSha) ||
    !SHA1_RE.test(input.approvedExecutionSha)
  ) {
    errors.push(
      "approvedExecutionSha must be a full 40-char lowercase hex commit SHA (not a branch/tag)",
    );
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

  // Execution authorization: approved execution SHA must equal checked-out HEAD.
  // Content SHA is NOT required to equal execution SHA.
  if (input.actualExecutionSha !== undefined) {
    if (!SHA1_RE.test(input.actualExecutionSha)) {
      errors.push("actualExecutionSha must be 40-char lowercase hex");
    } else if (input.actualExecutionSha !== input.approvedExecutionSha) {
      errors.push(
        `execution_sha mismatch: HEAD ${input.actualExecutionSha} != approved ${input.approvedExecutionSha}`,
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
