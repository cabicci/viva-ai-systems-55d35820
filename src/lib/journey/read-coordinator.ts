import { immutableJson, jsonObject, exactKeys, isReadContextLedger, sameSubject,
  type Json, type JsonObject, type LocalContext, type ReadContextLedger, type ReadTicket,
  type TicketInfo, type ServerBinding, type CursorChain } from "./read-context";

export type Verification = Readonly<{
  responseVerified: boolean;
  schemaValid: boolean;
  correlationValid: boolean;
  targetValid: boolean;
  evidencePermitted: boolean;
  authorizationCurrent?: boolean;
  serverContextVerified?: boolean;
  producerVerified?: boolean;
  cursorVerified?: boolean;
  verified_cursor_chain?: CursorChain;
}>;
export type ReadCompletion = Readonly<{ response: JsonObject; verification: Verification }>;
export type ViewSnapshot = Readonly<{
  context: LocalContext;
  root_generation: number;
  status: "idle" | "ready" | "stale" | "partial" | "unavailable" | "denied" |
    "restart_required" | "error" | "confirmed_empty" | "authorization_required" | "scope_refresh_required";
  history: readonly Json[];
  method_result: Json | null;
  server_snapshot: Json | null;
  coverage: Json | null;
  error: Json | null;
  /** Preserved archive with explicit origin, not automatically active work for a new subject. */
  local_work_owner: LocalContext;
  local_work: JsonObject;
}>;
export type CompletionResult = Readonly<{ status: "applied" | "dropped" | "gated"; reason: string }>;
type StoredView = { scope: string; state: ViewSnapshot };
const verdict = (status: CompletionResult["status"], reason: string): CompletionResult => Object.freeze({ status, reason });
const same = (a: Json, b: Json): boolean => {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => same(v, b[i]));
  if (!a || !b || typeof a !== "object" || typeof b !== "object" || Array.isArray(a) || Array.isArray(b)) return false;
  const ak = Object.keys(a), bk = Object.keys(b);
  return ak.length === bk.length && ak.every(k => Object.prototype.hasOwnProperty.call(b, k) && same((a as JsonObject)[k], (b as JsonObject)[k]));
};
function rowKey(value: Json): string {
  const row = jsonObject(value);
  const record = jsonObject(row.record);
  if (row.record_type === "legacy_fact") {
    const s = jsonObject(record.source);
    if (typeof s.source_kind !== "string" || typeof s.locator !== "string") throw new TypeError("Legacy identity missing");
    return JSON.stringify([row.record_type, s.source_kind, s.locator]);
  }
  const field = ({ bookmark: "bookmark_id", draft: "draft_id", attempt: "attempt_id", official_result: "official_result_id" } as Record<string, string>)[String(row.record_type)];
  if (!field || typeof record[field] !== "string") throw new TypeError("Record identity missing");
  return JSON.stringify([row.record_type, record[field]]);
}
function mergeRows(old: readonly Json[], rows: readonly Json[]): readonly Json[] {
  const map = new Map(old.map(r => [rowKey(r), r]));
  for (const row of rows) map.set(rowKey(row), row);
  return Object.freeze([...map.values()]);
}
function evidenceRequested(request: TicketInfo["request"], value: Json): boolean {
  if (Array.isArray(value)) return value.every(v => evidenceRequested(request, v));
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (item && typeof item === "object" && !Array.isArray(item) && (item as JsonObject).status === "available") {
        if (key === "original_response" && request.evidence.original_response !== "include_if_authorized") return false;
        if (key === "public_rubric_view" && request.evidence.public_rubric !== "include_if_authorized") return false;
      }
      if (!evidenceRequested(request, item)) return false;
    }
  }
  return true;
}
function pageMatches(info: TicketInfo, response: JsonObject, verification: Verification): boolean {
  const expected = info.options.cursor_chain, verified = verification.verified_cursor_chain;
  if (!expected || !verified || verification.cursorVerified !== true ||
      !same(expected as unknown as Json, verified as unknown as Json)) return false;
  const sc = jsonObject(response.server_context), snapshot = jsonObject(response.snapshot);
  if (expected.cursor !== info.request.payload.cursor || expected.snapshot_id !== info.request.payload.snapshot_id) return false;
  for (const key of ["backend_namespace", "actor_user_id", "subject", "context", "permission_epoch", "scope_sha256"] as const)
    if (!same(expected[key] as Json, sc[key])) return false;
  for (const key of ["snapshot_id", "projection_version", "projection_generation", "filter_sha256", "source_watermarks_sha256", "stable_sort_version"] as const)
    if (expected[key] !== snapshot[key]) return false;
  return true;
}

/** Synchronous internal commits only. No caller sink, callback, effect list, Promise or
 * setter is accepted. Thus async/reentrant sinks cannot retain an unguarded capability.
 * Later React/transport wiring must fence its own effects; this module is not that wiring. */
export function createReadCoordinator(options: Readonly<{ ledger: ReadContextLedger; local_work: JsonObject }>) {
  exactKeys(options, ["ledger", "local_work"]);
  const descriptor = Object.getOwnPropertyDescriptors(options);
  if (!("value" in descriptor.ledger) || !("value" in descriptor.local_work)) throw new TypeError("Accessor options");
  const ledger = descriptor.ledger.value as ReadContextLedger;
  if (!isReadContextLedger(ledger)) throw new TypeError("Genuine context ledger required");
  const root = ledger.snapshot().root_generation;
  const work = immutableJson(jsonObject(descriptor.local_work.value));
  if (ledger.snapshot().root_generation !== root) throw new Error("Reentrant coordinator creation");
  const owner = ledger.snapshot().context;
  const views = new Map<string, StoredView>();
  function empty(): ViewSnapshot {
    const c = ledger.snapshot();
    return Object.freeze({ context: c.context, root_generation: c.root_generation,
      status: c.mode === "blocked" ? "authorization_required" : "idle", history: Object.freeze([]),
      method_result: null, server_snapshot: null, coverage: null, error: null, local_work_owner: owner, local_work: work });
  }
  function snapshot(slot: string): ViewSnapshot {
    const saved = views.get(slot), current = ledger.snapshot(), request = ledger.currentRequest(slot);
    if (!saved || saved.state.root_generation !== current.root_generation ||
        (request && saved.scope !== request.view_scope)) return empty();
    return saved.state;
  }
  function store(info: TicketInfo, state: ViewSnapshot): void {
    views.set(info.slot, { scope: info.view_scope, state: Object.freeze(state) });
  }
  function completeRead(ticket: ReadTicket, supplied: ReadCompletion): CompletionResult {
    // First decision, before even inspecting caller data (including error/clear paths).
    if (!ledger.isCurrent(ticket)) return verdict("dropped", "stale_or_foreign_ticket");
    let input: ReadCompletion;
    try {
      input = immutableJson(supplied);
      exactKeys(input, ["response", "verification"]);
      jsonObject(input.response); jsonObject(input.verification);
      exactKeys(input.verification, ["responseVerified", "schemaValid", "correlationValid", "targetValid", "evidencePermitted",
        "authorizationCurrent", "serverContextVerified", "producerVerified", "cursorVerified", "verified_cursor_chain"],
      ["responseVerified", "schemaValid", "correlationValid", "targetValid", "evidencePermitted"]);
    } catch { return verdict("gated", "invalid_input"); }
    if (!ledger.isCurrent(ticket)) return verdict("dropped", "context_changed_during_input");
    const { response: r, verification: v } = input;
    if (![v.responseVerified, v.schemaValid, v.correlationValid, v.targetValid, v.evidencePermitted].every(x => x === true))
      return verdict("gated", "external_verification_required");
    const info = ledger.inspectTicket(ticket)!;
    if (r.contract_version !== "masarat-foundation-read-v1-candidate1" || r.read_revision !== 1 ||
        r.request_id !== info.request.request_id || r.method !== info.request.method)
      return verdict("gated", "response_correlation_mismatch");
    const outcome = r.outcome;
    if (!["ok", "partial", "unavailable", "denied", "restart_required"].includes(String(outcome)))
      return verdict("gated", "unsupported_outcome");
    const base = snapshot(info.slot);
    if (outcome === "denied" || outcome === "restart_required") {
      if ([r.server_context, r.snapshot, r.coverage, r.result].some(x => x !== null) || !r.error)
        return verdict("gated", "invalid_denial_or_restart");
      let code: Json;
      try { code = jsonObject(r.error).code; if (typeof code !== "string") throw new TypeError(); }
      catch { return verdict("gated", "invalid_denial_or_restart"); }
      if (!ledger.isCurrent(ticket)) return verdict("dropped", "stale_before_clear");
      // Authenticated denials and scope changes invalidate every old slot. A cursor-only restart does not invent revocation.
      if (outcome === "denied" || code === "CURSOR_SCOPE_CHANGED") ledger.observeRevocation(ticket);
      else ledger.retireRead(ticket);
      store(info, { ...empty(), status: outcome, error: r.error });
      return verdict("applied", outcome);
    }
    if (v.authorizationCurrent !== true || v.serverContextVerified !== true)
      return verdict("gated", "current_server_authorization_required");
    let coverage: JsonObject, result: JsonObject | null, history = base.history;
    let status: ViewSnapshot["status"];
    try {
      coverage = jsonObject(r.coverage);
      result = r.result === null ? null : jsonObject(r.result);
      if (outcome === "unavailable") {
        if (r.snapshot !== null || result !== null || coverage.completeness !== "unavailable" || !r.error)
          return verdict("gated", "invalid_unavailable");
        status = "unavailable";
      } else {
        const s = jsonObject(r.snapshot);
        if (!result || s.filter_sha256 !== info.options.filter_sha256 ||
            (outcome === "ok" && (coverage.completeness !== "complete" || r.error !== null)) ||
            (outcome === "partial" && (coverage.completeness !== "partial" || !r.error)))
          return verdict("gated", "coverage_or_filter_mismatch");
        if (info.request.method === "read_journey_page" && !pageMatches(info, r, v))
          return verdict("gated", "verified_cursor_chain_required");
        if (info.request.method === "read_journey_page") {
          const prior = jsonObject(base.server_snapshot), chain = info.options.cursor_chain!;
          for (const key of ["snapshot_id", "projection_version", "projection_generation", "filter_sha256", "source_watermarks_sha256", "stable_sort_version"] as const)
            if (prior[key] !== chain[key]) return verdict("gated", "local_snapshot_chain_required");
          if (jsonObject(base.method_result).next_cursor !== chain.cursor)
            return verdict("gated", "local_cursor_order_mismatch");
        }
        if (info.request.method === "read_journey_watermarks" && !same(result.source_watermarks, coverage.sources))
          return verdict("gated", "watermark_mismatch");
        if (!evidenceRequested(info.request, result)) return verdict("gated", "evidence_not_requested");
        if (info.request.method === "read_attempt_material" && jsonObject(result.material).status === "available" && v.producerVerified !== true)
          return verdict("gated", "public_safe_producer_required");
        const journey = info.request.method === "read_journey_snapshot" || info.request.method === "read_journey_page";
        const rows = journey ? result.records : info.request.method === "read_resume_cursor" ? result.bookmarks : undefined;
        if (rows !== undefined && !Array.isArray(rows)) return verdict("gated", "invalid_rows");
        if (result.empty_confirmed === true) {
          if (outcome !== "ok" || !Array.isArray(rows) || rows.length !== 0 ||
              (journey && result.next_cursor !== null) || !Array.isArray(coverage.sources) ||
              coverage.sources.some(source => !["succeeded", "not_applicable"].includes(String(jsonObject(source).load_state))))
            return verdict("gated", "false_empty_claim");
        }
        if (journey) {
          const incoming = rows as readonly Json[];
          if (!incoming) return verdict("gated", "missing_records");
          incoming.forEach(rowKey);
          history = outcome === "partial" || info.request.method === "read_journey_page"
            ? mergeRows(base.history, incoming) : incoming.length || result.empty_confirmed === true ? incoming : base.history;
        }
        status = outcome === "partial" ? "partial" : result.empty_confirmed === true && (!journey || history.length === 0) ? "confirmed_empty" :
          coverage.freshness === "stale" ? "stale" : "ready";
        if (journey && outcome === "ok" && (rows as readonly Json[]).length === 0 && result.empty_confirmed !== true &&
            info.request.method !== "read_journey_page" && history.length > 0) status = "stale";
      }
    } catch { return verdict("gated", "invalid_projection"); }
    // All potentially reentrant caller-data traversal finished before any ledger/view mutation.
    if (!ledger.isCurrent(ticket)) return verdict("dropped", "stale_before_commit");
    const bound = ledger.bindObservedServerContext(ticket, r.server_context as unknown as ServerBinding, true);
    if (bound === "dropped") return verdict("dropped", "stale_server_context");
    if (bound === "gated") return verdict("gated", "server_context_mismatch");
    if (bound === "mismatch") {
      store(info, { ...empty(), status: "scope_refresh_required", error: "SERVER_SCOPE_CHANGED" });
      return verdict("applied", "scope_refresh_required");
    }
    if (!ledger.isCurrent(ticket)) return verdict("dropped", "stale_before_commit");
    const nextState: ViewSnapshot = Object.freeze({ ...base, context: ledger.snapshot().context,
      root_generation: ledger.snapshot().root_generation, status, history,
      method_result: outcome === "unavailable" ? base.method_result : result,
      server_snapshot: outcome === "unavailable" ? base.server_snapshot : r.snapshot,
      coverage, error: r.error });
    ledger.retireRead(ticket);
    store(info, nextState);
    return verdict("applied", String(outcome));
  }
  function completeLocalFailure(ticket: ReadTicket, supplied: Readonly<{ code: string }>): CompletionResult {
    if (!ledger.isCurrent(ticket)) return verdict("dropped", "stale_or_foreign_ticket");
    let failure: Readonly<{ code: string }>;
    try { failure = immutableJson(supplied); exactKeys(failure, ["code"]); if (!failure.code || typeof failure.code !== "string") throw new TypeError(); }
    catch { return verdict("gated", "invalid_local_failure"); }
    if (!ledger.isCurrent(ticket)) return verdict("dropped", "context_changed_during_input");
    const info = ledger.inspectTicket(ticket)!, base = snapshot(info.slot);
    ledger.retireRead(ticket);
    store(info, { ...base, status: "error", error: failure.code });
    return verdict("applied", "local_failure");
  }
  return Object.freeze({ snapshot, completeRead, completeLocalFailure });
}
