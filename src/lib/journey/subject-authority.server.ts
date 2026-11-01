import { resolveVerifiedRequestUser } from "../ssr-request-auth.server.ts";
import { projectLegacyHistory, type LegacyProjection } from "../learning-read/legacy-projection.ts";

/** Internal bookmark relationship only; never a lesson/content/attempt grant. */
export type PersonalBookmarkSubject = Readonly<{
  kind: "auth_user" | "kids_profile";
  id: string;
}>;

export type PersonalBookmarkAuthorityResult =
  | {
      status: "authorized";
      scope: "personal_bookmark_read";
      relationship: "self" | "parent";
      permissionEpoch: null;
    }
  | { status: "unauthenticated"; code: "no_request_identity" }
  | {
      status: "denied";
      code:
        | "invalid_subject"
        | "different_actor"
        | "account_inactive"
        | "parent_manage_denied"
        | "profile_missing"
        | "profile_not_owned";
    }
  | {
      status: "unavailable";
      code:
        | "request_identity_unavailable"
        | "account_check_unavailable"
        | "parent_manage_unavailable"
        | "profile_lookup_unavailable";
    };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function uuid(value: unknown): string | null {
  return typeof value === "string" && UUID.test(value) ? value.toLowerCase() : null;
}

// Do not invoke selector/response getters or coerce untrusted values.
function own(value: unknown, key: string): unknown {
  if (value === null || typeof value !== "object") return undefined;
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor && "value" in descriptor ? descriptor.value : undefined;
}

function subjectFrom(value: unknown): PersonalBookmarkSubject | null {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
    const keys = Reflect.ownKeys(value);
    if (keys.length !== 2 || !keys.includes("kind") || !keys.includes("id")) return null;
    const kind = own(value, "kind");
    const id = uuid(own(value, "id"));
    return (kind === "auth_user" || kind === "kids_profile") && id ? { kind, id } : null;
  } catch {
    return null;
  }
}

function booleanDecision(value: unknown): "allow" | "deny" | "unavailable" {
  if (own(value, "error") !== null) return "unavailable";
  const data = own(value, "data");
  return data === true ? "allow" : data === false ? "deny" : "unavailable";
}

type RequestClient = NonNullable<Awaited<ReturnType<typeof resolveVerifiedRequestUser>>>["supabase"];
type BoundRequest = { actor: string; client: RequestClient };
type AuthorityFailure = Exclude<PersonalBookmarkAuthorityResult, { status: "authorized" }>;

function hasDataMethod(value: unknown, key: string): boolean {
  if (!value || typeof value !== "object") return false;
  let current: object | null = value;
  for (let depth = 0; current && depth < 32; depth++) {
    const descriptor = Object.getOwnPropertyDescriptor(current, key);
    if (descriptor) return "value" in descriptor && typeof descriptor.value === "function";
    current = Object.getPrototypeOf(current);
  }
  return false;
}

async function captureRequest(): Promise<BoundRequest | AuthorityFailure> {
  try {
    const request = await resolveVerifiedRequestUser();
    if (request === null) return { status: "unauthenticated", code: "no_request_identity" };
    const actor = uuid(own(request, "userId"));
    const client = own(request, "supabase") as RequestClient | undefined;
    if (!actor || !client || !hasDataMethod(client, "rpc") || !hasDataMethod(client, "from")) {
      return { status: "unavailable", code: "request_identity_unavailable" };
    }
    return { actor, client };
  } catch {
    return { status: "unavailable", code: "request_identity_unavailable" };
  }
}

/**
 * Resolve the actual request on every call, then use ONLY its authenticated
 * invoker client. No actor/client/dependency override is accepted by this API.
 * Mirrors journey_owner_read plus its restrictive account-active policy.
 *
 * permissionEpoch is explicitly unknown, not a version, TTL or reusable lease.
 * Existing getClaims verifies cryptographic identity; these separate current
 * lookups do not prove all session/grant revocations or an atomic commit-time
 * snapshot. A later data reader must retain invoker RLS and the C2 fence before
 * every outcome/effect. This internal helper is not that reader or a handler.
 */
export async function authorizePersonalBookmarkSubject(
  requestedSubject: unknown,
): Promise<PersonalBookmarkAuthorityResult> {
  const binding = await captureRequest();
  if ("status" in binding) return binding;
  const subject = subjectFrom(requestedSubject);
  if (!subject) return { status: "denied", code: "invalid_subject" };
  return authorizeBound(binding, subject);
}

// Private, captured request only. Both exports share this exact policy;
// callers can never provide a binding/client or turn this into a grant lease.
async function authorizeBound(
  { actor, client }: BoundRequest,
  subject: PersonalBookmarkSubject,
): Promise<PersonalBookmarkAuthorityResult> {
  if (subject.kind === "auth_user" && subject.id !== actor) {
    return { status: "denied", code: "different_actor" };
  }

  try {
    const active = booleanDecision(await client.rpc("lc09_account_active"));
    if (active === "deny") return { status: "denied", code: "account_inactive" };
    if (active !== "allow") return { status: "unavailable", code: "account_check_unavailable" };
  } catch {
    return { status: "unavailable", code: "account_check_unavailable" };
  }

  if (subject.kind === "auth_user") {
    return { status: "authorized", scope: "personal_bookmark_read", relationship: "self", permissionEpoch: null };
  }

  try {
    const manage = booleanDecision(await client.rpc("kids_parent_can_manage_profiles"));
    if (manage === "deny") return { status: "denied", code: "parent_manage_denied" };
    if (manage !== "allow") return { status: "unavailable", code: "parent_manage_unavailable" };
  } catch {
    return { status: "unavailable", code: "parent_manage_unavailable" };
  }

  try {
    const result = await client.from("kids_profiles")
      .select("id,parent_id")
      .eq("id", subject.id)
      .eq("parent_id", actor)
      .maybeSingle();
    if (own(result, "error") !== null) {
      return { status: "unavailable", code: "profile_lookup_unavailable" };
    }
    const row = own(result, "data");
    if (row === null) return { status: "denied", code: "profile_missing" };
    const id = uuid(own(row, "id"));
    const parent = uuid(own(row, "parent_id"));
    if (!id || !parent) return { status: "unavailable", code: "profile_lookup_unavailable" };
    if (id !== subject.id || parent !== actor) return { status: "denied", code: "profile_not_owned" };
    return { status: "authorized", scope: "personal_bookmark_read", relationship: "parent", permissionEpoch: null };
  } catch {
    return { status: "unavailable", code: "profile_lookup_unavailable" };
  }
}

type BookmarkArea = "ai" | "technical" | "academic" | "kids";
type VisitLocale = "ar-EG" | "ar-MSA" | "ar-Gulf" | "en";
type BookmarkRow = Readonly<{
  user_id: string;
  line: BookmarkArea;
  course_id: string;
  subject_id: string;
  profile_id: string | null;
  lesson_id: string;
  locale: VisitLocale;
  visited_at: string;
}>;
type BookmarkSelector = { subject: PersonalBookmarkSubject; area: BookmarkArea; course_id: string };

export type PersonalBookmarkSourceResult =
  | AuthorityFailure
  | { status: "denied"; code: "invalid_bookmark_selector" }
  | { status: "unavailable"; code: "bookmark_source_unavailable" }
  | {
      status: "succeeded";
      row: BookmarkRow | null;
      selectedSourceComplete: true;
      permissionEpoch: null;
      sourceFreshness: null;
    };

const BOOKMARK_COLUMNS = "user_id,line,course_id,subject_id,profile_id,lesson_id,locale,visited_at";

// PostgreSQL length(text) counts Unicode characters, not UTF-16 code units.
// PostgreSQL UTF-8 text cannot contain NUL or unpaired UTF-16 surrogates.
function sourceText(value: unknown, maximum: number): value is string {
  if (typeof value !== "string") return false;
  let count = 0;
  for (const character of value) {
    const point = character.codePointAt(0)!;
    if (point === 0 || (point >= 0xd800 && point <= 0xdfff) || ++count > maximum) return false;
  }
  return count > 0;
}

function bookmarkSelector(value: unknown): BookmarkSelector | null {
  try {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const keys = Reflect.ownKeys(value);
    if (keys.length !== 3 || !["subject", "area", "course_id"].every(key => keys.includes(key))) return null;
    const subject = subjectFrom(own(value, "subject"));
    const area = own(value, "area");
    const course = own(value, "course_id");
    if (!subject || !sourceText(course, 80)) return null;
    if (area !== "ai" && area !== "technical" && area !== "academic" && area !== "kids") return null;
    if ((subject.kind === "kids_profile") !== (area === "kids")) return null;
    return { subject, area, course_id: course };
  } catch {
    return null;
  }
}

// Validate timestamp observations without a clock, date conversion, default or
// freshness inference. Preserve ISO PostgreSQL JSON text and its infinities.
function visitTime(value: unknown): value is string {
  if (value === "infinity" || value === "-infinity") return true;
  if (typeof value !== "string") return false;
  const match = /^([0-9]{4,6})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2})(?:\.[0-9]{1,6})?(?:Z|[+-]([0-9]{2}):([0-9]{2})(?::([0-9]{2}))?)( BC)?$/.exec(value);
  if (!match) return false;
  const [, y, m, d, hh, mm, ss, oh, om, os, bc] = match;
  const year = Number(y), month = Number(m), day = Number(d);
  if (year < 1 || year > (bc ? 4713 : 294276) || month < 1 || month > 12) return false;
  const astronomicalYear = bc ? 1 - year : year;
  const leap = astronomicalYear % 4 === 0 && (astronomicalYear % 100 !== 0 || astronomicalYear % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  return day >= 1 && day <= days && Number(hh) <= 23 && Number(mm) <= 59 && Number(ss) <= 59 &&
    (oh === undefined || (Number(oh) <= 15 && Number(om) <= 59 && (os === undefined || Number(os) <= 59)));
}

function sourceRow(value: unknown, binding: BoundRequest, selector: BookmarkSelector): BookmarkRow | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const user = own(value, "user_id"), area = own(value, "line"), course = own(value, "course_id");
  const subject = own(value, "subject_id"), profile = own(value, "profile_id");
  const lesson = own(value, "lesson_id"), locale = own(value, "locale"), visited = own(value, "visited_at");
  const expectedProfile = selector.subject.kind === "kids_profile" ? selector.subject.id : null;
  if (user !== binding.actor || area !== selector.area || course !== selector.course_id ||
      subject !== selector.subject.id || profile !== expectedProfile || !sourceText(lesson, 160) ||
      (locale !== "ar-EG" && locale !== "ar-MSA" && locale !== "ar-Gulf" && locale !== "en") || !visitTime(visited)) return null;
  // These are exactly the selected fields, captured once as own data values.
  return { user_id: user, line: selector.area, course_id: course, subject_id: subject,
    profile_id: expectedProfile, lesson_id: lesson, locale, visited_at: visited };
}

/**
 * INTERNAL single exact-key bookmark source read, not a wire method/endpoint.
 * Capture ONE actual request. Initial checks, query and final checks all use
 * that SAME invoker. Final authorization failure wins over EVERY query outcome.
 * Sequential observations are not atomic revocation/session/commit protection;
 * eventual usage still requires invoker RLS and C2 all-outcome currentness.
 * A copied visit does not authorize its lesson or establish content locale,
 * enrollment, a cursor, source version, freshness or complete journey history.
 */
export async function readPersonalBookmarkSource(input: unknown): Promise<PersonalBookmarkSourceResult> {
  return readCapturedBookmark(input, "source");
}

type BookmarkSelection = Readonly<{
  subject: PersonalBookmarkSubject;
  area: BookmarkArea;
  course_id: string;
}>;
export type PersonalBookmarkProjectionResult =
  | Exclude<PersonalBookmarkSourceResult, { status: "succeeded" }>
  | { status: "unavailable"; code: "bookmark_projection_unavailable" }
  | {
      status: "succeeded";
      projection: LegacyProjection;
      selection: BookmarkSelection;
      selectedSourceComplete: true;
      permissionEpoch: null;
      sourceFreshness: null;
    };

/**
 * INTERNAL historical composition for one selected composite key. A predictable
 * opaque ID identifies that key, never a grant/write UUID/receipt/material hash.
 * The actual pure mapper preserves reference_unknown and all absent facts.
 */
export async function readPersonalBookmarkProjection(input: unknown): Promise<PersonalBookmarkProjectionResult> {
  return readCapturedBookmark(input, "projection");
}

async function prepareProjection(binding: BoundRequest, selector: BookmarkSelector, row: BookmarkRow | null) {
  // Capture owned immutable values BEFORE any asynchronous/reentrant digest.
  const selection: BookmarkSelection = Object.freeze({
    subject: Object.freeze({ kind: selector.subject.kind, id: selector.subject.id }),
    area: selector.area,
    course_id: selector.course_id,
  });
  const snapshot = row === null ? null : Object.freeze({ ...row });
  const tuple = JSON.stringify([
    "masaarat.journey_visits.bookmark.v1", binding.actor, selection.area,
    selection.course_id, selection.subject.kind, selection.subject.id,
  ]);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(tuple));
  if (!(digest instanceof ArrayBuffer) || digest.byteLength !== 32) throw new Error("Invalid digest result");
  const locator = "jv1_" + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  // Actual server clock for observation provenance only, not source freshness.
  // Clock/hash/mapper errors remain bounded and still precede final policy.
  const observed = new Date().toISOString();
  const projection = projectLegacyHistory({
    actor_user_id: binding.actor,
    subject: selection.subject,
    observed_at: observed,
    sources: [{ source_id: "journey_visits_selected_key", kind: "bookmark",
      load_state: "succeeded", completeness: "complete",
      rows: snapshot === null ? [] : [{ locator, row: snapshot }] }],
  });
  return { projection, selection };
}

// Closed PRIVATE modes only. Neither public selector can skip policy or inject
// source rows/bindings. One capture/query implementation serves both exports.
async function readCapturedBookmark(input: unknown, mode: "source"): Promise<PersonalBookmarkSourceResult>;
async function readCapturedBookmark(input: unknown, mode: "projection"): Promise<PersonalBookmarkProjectionResult>;
async function readCapturedBookmark(
  input: unknown, mode: "source" | "projection",
): Promise<PersonalBookmarkSourceResult | PersonalBookmarkProjectionResult> {
  const binding = await captureRequest();
  if ("status" in binding) return binding;
  const selector = bookmarkSelector(input);
  if (!selector) return { status: "denied", code: "invalid_bookmark_selector" };
  const initial = await authorizeBound(binding, selector.subject);
  if (initial.status !== "authorized") return initial;

  let available = false;
  let row: BookmarkRow | null = null;
  try {
    // Fixed physical table/columns, checked against the actual generated types;
    // returned values are still validated independently of those static types.
    let query = binding.client.from("journey_visits")
      .select(BOOKMARK_COLUMNS)
      .eq("user_id", binding.actor)
      .eq("line", selector.area)
      .eq("course_id", selector.course_id)
      .eq("subject_id", selector.subject.id);
    query = selector.subject.kind === "kids_profile"
      ? query.eq("profile_id", selector.subject.id)
      : query.is("profile_id", null);
    const result: unknown = await query.maybeSingle();
    if (own(result, "error") === null) {
      const data = own(result, "data");
      if (data === null) available = true;
      else {
        row = sourceRow(data, binding, selector);
        available = row !== null;
      }
    }
  } catch {
    // Neither thrown SDK errors nor captured source detail escape this check.
  }
  let prepared: Awaited<ReturnType<typeof prepareProjection>> | undefined;
  if (mode === "projection" && available) {
    try {
      prepared = await prepareProjection(binding, selector, row);
    } catch {
      // Do not publish a hash/clock/mapping failure before the final policy.
    }
  }
  const final = await authorizeBound(binding, selector.subject);
  if (final.status !== "authorized") return final;
  if (!available) return { status: "unavailable", code: "bookmark_source_unavailable" };
  if (mode === "projection") {
    if (!prepared) return { status: "unavailable", code: "bookmark_projection_unavailable" };
    return { status: "succeeded", ...prepared, selectedSourceComplete: true, permissionEpoch: null, sourceFreshness: null };
  }
  return { status: "succeeded", row, selectedSourceComplete: true, permissionEpoch: null, sourceFreshness: null };
}
