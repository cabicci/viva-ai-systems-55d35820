import { resolveVerifiedRequestUser } from "../ssr-request-auth.server.ts";
import { projectLegacyHistory, type LegacyProjection } from "../learning-read/legacy-projection.ts";

type SourceKind = "mission" | "quiz";
type ParsedSelector = Readonly<{
  subject: Readonly<{ kind: "auth_user" | "kids_profile"; id: string }>;
  source: Readonly<{ kind: SourceKind; id: string }>;
}>;
type Selection = Readonly<{
  subject: Readonly<{ kind: "auth_user"; id: string }>;
  source: Readonly<{ kind: SourceKind; id: string }>;
}>;
type Client = NonNullable<Awaited<ReturnType<typeof resolveVerifiedRequestUser>>>["supabase"];
type Binding = { actor: string; client: Client };
type Failure =
  | { status: "unauthenticated"; code: "no_request_identity" }
  | { status: "denied"; code: "invalid_selector" | "actor_only" | "different_actor" | "account_inactive" }
  | { status: "unavailable"; code: "request_identity_unavailable" | "account_check_unavailable" | "legacy_fact_source_unavailable" | "legacy_fact_projection_unavailable" };

export type PersonalLegacyFactProjectionResult = Failure | {
  status: "succeeded";
  projection: LegacyProjection;
  selection: Selection;
  selectedSourceComplete: true;
  permissionEpoch: null;
  sourceFreshness: null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MISSION_STATUSES = new Set(["draft", "submitted", "evaluating", "needs_revision", "passed", "failed"]);

function uuid(value: unknown): string | null {
  return typeof value === "string" && value.length === 36 && UUID.test(value) ? value.toLowerCase() : null;
}
function own(value: unknown, key: string): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && "value" in descriptor ? descriptor.value : undefined;
}
function keys(value: unknown, names: readonly string[]): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const actual = Reflect.ownKeys(value);
  return actual.length === names.length && names.every(name => actual.includes(name));
}
function parseSelector(input: unknown): ParsedSelector | null {
  try {
    if (!keys(input, ["subject", "source"])) return null;
    const subject = own(input, "subject"), source = own(input, "source");
    if (!keys(subject, ["kind", "id"]) || !keys(source, ["kind", "id"])) return null;
    const subjectKind = own(subject, "kind"), sourceKind = own(source, "kind");
    const subjectId = uuid(own(subject, "id")), sourceId = uuid(own(source, "id"));
    if ((subjectKind !== "auth_user" && subjectKind !== "kids_profile") ||
        (sourceKind !== "mission" && sourceKind !== "quiz") || !subjectId || !sourceId) return null;
    return Object.freeze({ subject: Object.freeze({ kind: subjectKind, id: subjectId }),
      source: Object.freeze({ kind: sourceKind, id: sourceId }) });
  } catch {
    return null;
  }
}
function hasMethod(value: unknown, key: string): boolean {
  if (!value || typeof value !== "object") return false;
  let current: object | null = value;
  for (let depth = 0; current && depth < 32; depth++) {
    const descriptor = Object.getOwnPropertyDescriptor(current, key);
    if (descriptor) return "value" in descriptor && typeof descriptor.value === "function";
    current = Object.getPrototypeOf(current);
  }
  return false;
}
async function captureRequest(): Promise<Binding | Failure> {
  try {
    const request = await resolveVerifiedRequestUser();
    if (request === null) return { status: "unauthenticated", code: "no_request_identity" };
    const actor = uuid(own(request, "userId"));
    const client = own(request, "supabase") as Client | undefined;
    if (!actor || !client || !hasMethod(client, "rpc") || !hasMethod(client, "from")) {
      return { status: "unavailable", code: "request_identity_unavailable" };
    }
    return { actor, client };
  } catch {
    return { status: "unavailable", code: "request_identity_unavailable" };
  }
}
// This domain uses only its existing restrictive account predicate, never a
// personal_bookmark_read grant. null is private control flow, not a capability.
async function activeAccount(client: Client): Promise<Failure | null> {
  try {
    const result: unknown = await client.rpc("lc09_account_active");
    if (own(result, "error") !== null) return { status: "unavailable", code: "account_check_unavailable" };
    const data = own(result, "data");
    if (data === false) return { status: "denied", code: "account_inactive" };
    if (data !== true) return { status: "unavailable", code: "account_check_unavailable" };
    return null;
  } catch {
    return { status: "unavailable", code: "account_check_unavailable" };
  }
}

type Snapshot = Readonly<Record<string, unknown> & { id: string; user_id: string }>;
function captureRow(value: unknown, selection: Selection, actor: string): Snapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const id = own(value, "id"), user = own(value, "user_id"), lesson = own(value, "lesson_id");
  // PostgreSQL UUID output is canonical. Input UUID casing was normalized above;
  // successful snapshots retain the actual selected row ID, never a minted ID.
  if (id !== selection.source.id || user !== actor) return null;
  if (selection.source.kind === "mission") {
    const status = own(value, "status"), score = own(value, "score"), created = own(value, "created_at");
    if ((lesson !== null && typeof lesson !== "string") || typeof status !== "string" || !MISSION_STATUSES.has(status) ||
        !(score === null || typeof score === "string" || (typeof score === "number" && Number.isFinite(score))) ||
        typeof created !== "string") return null;
    return { id, user_id: user, lesson_id: lesson, status, score, created_at: created };
  }
  const correct = own(value, "is_correct"), attempted = own(value, "attempted_at");
  if (typeof lesson !== "string" || typeof correct !== "boolean" || typeof attempted !== "string") return null;
  return { id, user_id: user, lesson_id: lesson, is_correct: correct, attempted_at: attempted };
}

/**
 * INTERNAL one PK+actor historical fact projection, not an endpoint/read1
 * envelope or grant to lesson content, original answers, grading or submission.
 * Real invoker RLS remains necessary. getClaims plus two observed account checks
 * is not atomic session/grant revocation, a permission epoch or complete C2.
 */
export async function readPersonalLegacyFactProjection(input: unknown): Promise<PersonalLegacyFactProjectionResult> {
  // Own canonical selector values are captured BEFORE any asynchronous identity
  // or source work; caller mutation/getters cannot retarget this operation.
  const parsed = parseSelector(input);
  if (!parsed) return { status: "denied", code: "invalid_selector" };
  const binding = await captureRequest();
  if ("status" in binding) return binding;
  if (parsed.subject.kind !== "auth_user") return { status: "denied", code: "actor_only" };
  if (parsed.subject.id !== binding.actor) return { status: "denied", code: "different_actor" };
  const selection: Selection = Object.freeze({ subject: Object.freeze({ kind: "auth_user", id: binding.actor }),
    source: parsed.source });
  const initial = await activeAccount(binding.client);
  if (initial) return initial;

  let available = false;
  let snapshot: Snapshot | null = null;
  try {
    const result: unknown = selection.source.kind === "mission"
      ? await binding.client.from("mission_submissions")
          .select("id,user_id,lesson_id,status,score,created_at")
          .eq("id", selection.source.id).eq("user_id", binding.actor).maybeSingle()
      : await binding.client.from("lesson_quiz_attempts")
          .select("id,user_id,lesson_id,is_correct,attempted_at")
          .eq("id", selection.source.id).eq("user_id", binding.actor).maybeSingle();
    if (own(result, "error") === null) {
      const data = own(result, "data");
      if (data === null) available = true;
      else {
        snapshot = captureRow(data, selection, binding.actor);
        available = snapshot !== null;
      }
    }
  } catch {
    // SDK failures are never forwarded or interpreted as a successful empty.
  }

  let projection: LegacyProjection | undefined;
  if (available) {
    try {
      const row = snapshot === null ? null : Object.freeze({ ...snapshot });
      // Only observation provenance uses this actual server UTC clock. Source
      // recorded time/score/text is passed unchanged to the actual pure mapper.
      const observed = new Date().toISOString();
      projection = projectLegacyHistory({ actor_user_id: binding.actor, subject: selection.subject, observed_at: observed,
        sources: [{ source_id: selection.source.kind === "mission" ? "mission_submissions_selected_key" : "lesson_quiz_attempts_selected_key",
          kind: selection.source.kind, load_state: "succeeded", completeness: "complete",
          rows: row === null ? [] : [{ locator: row.id, row }] }] });
    } catch {
      // Incompatible mapper observations or clock errors still precede policy.
    }
  }
  const final = await activeAccount(binding.client);
  if (final) return final;
  if (!available) return { status: "unavailable", code: "legacy_fact_source_unavailable" };
  if (!projection) return { status: "unavailable", code: "legacy_fact_projection_unavailable" };
  return { status: "succeeded", projection, selection, selectedSourceComplete: true, permissionEpoch: null, sourceFreshness: null };
}
